// ── Badge ────────────────────────────────────────────────────────────────────

async function updateBadge() {
  const storage = await chrome.storage.local.get('opt_badge')
  const enabled = storage.opt_badge !== false // default: on

  if (!enabled) {
    chrome.action.setBadgeText({ text: '' })
    return
  }

  const tabs = await chrome.tabs.query({})
  chrome.action.setBadgeText({ text: String(tabs.length) })
  chrome.action.setBadgeBackgroundColor({ color: '#1a6bff' })
}

chrome.tabs.onCreated.addListener(updateBadge)
chrome.tabs.onRemoved.addListener(updateBadge)
chrome.runtime.onInstalled.addListener(updateBadge)
chrome.runtime.onStartup.addListener(updateBadge)

// ── Garbage collection on startup ────────────────────────────────────────────

chrome.runtime.onStartup.addListener(async () => {
  const [tabs, items] = await Promise.all([
    chrome.tabs.query({}),
    chrome.storage.local.get(null),
  ])
  const activeIds = new Set(tabs.map((t) => String(t.id)))

  // Remove timestamp and index keys for tabs that no longer exist
  const deadTabKeys = Object.keys(items).filter((k) => {
    const tsMatch = k.match(/^(\d+)_/)
    const idxMatch = k.match(/^_tab_(\d+)$/)
    return (
      (tsMatch && !activeIds.has(tsMatch[1])) ||
      (idxMatch && !activeIds.has(idxMatch[1]))
    )
  })

  // Evict visit entries unseen for 90 days; cap total at 1000 entries
  const VISIT_TTL = 90 * 86400000
  const VISIT_MAX = 1000
  const visitEntries = Object.entries(items)
    .filter(([k]) => k.startsWith('v:'))
    .map(([k, v]) => ({ key: k, ts: v?.ts || 0 }))

  const staleVisitKeys = visitEntries
    .filter((e) => e.ts > 0 && Date.now() - e.ts > VISIT_TTL)
    .map((e) => e.key)

  const capVisitKeys =
    visitEntries.length > VISIT_MAX
      ? visitEntries
          .sort((a, b) => b.ts - a.ts)
          .slice(VISIT_MAX)
          .map((e) => e.key)
      : []

  const allKeysToRemove = [
    ...new Set([...deadTabKeys, ...staleVisitKeys, ...capVisitKeys]),
  ]
  if (allKeysToRemove.length > 0) chrome.storage.local.remove(allKeysToRemove)
})

chrome.storage.onChanged.addListener((changes) => {
  if ('opt_badge' in changes) updateBadge()
})

// ── Visit counter ─────────────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    if (!tab.url) return
    const key = `v:${tab.url}`
    const storage = await chrome.storage.local.get(key)
    const count = storage[key]?.count || 0
    chrome.storage.local.set({ [key]: { count: count + 1, ts: Date.now() } })
  } catch {
    // Tab may have been closed before we could read it
  }
})

// ── Tab timestamps ────────────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return

  const newKey = `${tabId}_${tab.url}`
  const indexKey = `_tab_${tabId}`

  // Read only the two keys we need — index + new timestamp key
  chrome.storage.local.get([indexKey, newKey], (items) => {
    const writes = {}
    const oldUrl = items[indexKey]
    if (oldUrl && oldUrl !== tab.url)
      chrome.storage.local.remove(`${tabId}_${oldUrl}`)
    writes[indexKey] = tab.url
    if (!items[newKey]) writes[newKey] = Date.now()
    chrome.storage.local.set(writes)
  })
})

// ── Cleanup on tab close ──────────────────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  const indexKey = `_tab_${tabId}`
  chrome.storage.local.get(indexKey, (items) => {
    const keysToRemove = [indexKey]
    if (items[indexKey]) keysToRemove.push(`${tabId}_${items[indexKey]}`)
    chrome.storage.local.remove(keysToRemove)
  })
})
