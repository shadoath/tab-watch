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

// React when the badge option is toggled in settings
chrome.storage.onChanged.addListener((changes) => {
  if ("opt_badge" in changes) updateBadge();
});

// ── Tab timestamps ────────────────────────────────────────────────────────────

// When a tab finishes loading, record the timestamp keyed by tabId + url
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const newKey = `${tabId}_${tab.url}`;

  // Remove any old keys for this tab (e.g. the user navigated to a new URL)
  chrome.storage.local.get(null, (items) => {
    const staleKeys = Object.keys(items).filter(
      (k) => k.startsWith(`${tabId}_`) && k !== newKey
    );
    if (staleKeys.length > 0) chrome.storage.local.remove(staleKeys);
  });

  // Only write if there isn't already a timestamp for this exact key,
  // so refreshing the page doesn't reset the timer
  chrome.storage.local.get(newKey, (items) => {
    if (!items[newKey]) {
      chrome.storage.local.set({ [newKey]: Date.now() });
    }
  });
});

// Clean up when a tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get(null, (items) => {
    const keysToRemove = Object.keys(items).filter((k) =>
      k.startsWith(`${tabId}_`)
    );
    if (keysToRemove.length > 0) chrome.storage.local.remove(keysToRemove);
  });
});
