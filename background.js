// ── Badge ────────────────────────────────────────────────────────────────────

async function updateBadge() {
  const storage = await chrome.storage.local.get("opt_badge");
  const enabled = storage.opt_badge !== false; // default: on

  if (!enabled) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  const tabs = await chrome.tabs.query({});
  chrome.action.setBadgeText({ text: String(tabs.length) });
  chrome.action.setBadgeBackgroundColor({ color: "#1a6bff" });
}

chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);

chrome.storage.onChanged.addListener((changes) => {
  if ("opt_badge" in changes) updateBadge();
});

// ── Visit counter ─────────────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return;
    const key = `visits_${tabId}_${tab.url}`;
    const storage = await chrome.storage.local.get(key);
    chrome.storage.local.set({ [key]: (storage[key] || 0) + 1 });
  } catch {
    // Tab may have been closed before we could read it
  }
});

// ── Tab timestamps ────────────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const newKey = `${tabId}_${tab.url}`;

  // Single read: clean up stale keys and write timestamp if not already set
  chrome.storage.local.get(null, (items) => {
    const staleKeys = Object.keys(items).filter(
      (k) => k.startsWith(`${tabId}_`) && k !== newKey
    );
    if (staleKeys.length > 0) chrome.storage.local.remove(staleKeys);
    if (!items[newKey]) chrome.storage.local.set({ [newKey]: Date.now() });
  });
});

// ── Cleanup on tab close ──────────────────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get(null, (items) => {
    const keysToRemove = Object.keys(items).filter(
      (k) => k.startsWith(`${tabId}_`) || k.startsWith(`visits_${tabId}_`)
    );
    if (keysToRemove.length > 0) chrome.storage.local.remove(keysToRemove);
  });
});
