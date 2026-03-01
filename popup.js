// Chrome tab group color name → hex
const GROUP_COLORS = {
  grey:   "#5f6368",
  blue:   "#1a73e8",
  red:    "#d93025",
  yellow: "#f9ab00",
  green:  "#1e8e3e",
  pink:   "#e52592",
  purple: "#a142f4",
  cyan:   "#12b5cb",
  orange: "#e8710a",
};

// Options loaded once per popup open — used by renderTabs via closure
let opts = {};

// Duration elements keyed by tabId — rebuilt on each full render, read by ticker
let durationEls = new Map(); // tabId → { el, timestamp }
let tickInterval = null;

function tick() {
  const now = Date.now();
  durationEls.forEach(({ el, timestamp }) => {
    el.textContent = formatDuration(now - timestamp);
  });
}

function startTicker() {
  if (tickInterval) clearInterval(tickInterval);
  if (opts.opt_refresh === false) return;
  tickInterval = setInterval(tick, (opts.opt_refresh_interval ?? 5) * 1000);
}

// ── Keyboard navigation ──────────────────────────────────────────────────────

let focusedIndex = -1;

function getVisibleItems() {
  return Array.from(document.querySelectorAll("#tab-list .tab-item"));
}

function setFocus(index) {
  const items = getVisibleItems();
  if (!items.length) return;
  focusedIndex = Math.max(0, Math.min(items.length - 1, index));
  items.forEach((item, i) => item.classList.toggle("focused", i === focusedIndex));
  items[focusedIndex].scrollIntoView({ block: "nearest" });
}

// ── Formatting ───────────────────────────────────────────────────────────────

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function applyTheme(isLight) {
  document.body.classList.toggle("light", isLight);
  const toggle = document.getElementById("theme-toggle");
  toggle.querySelector(".icon").textContent = isLight ? "☽" : "☀";
  toggle.querySelector(".label").textContent = isLight ? "Dark" : "Light";
}

function updateColHeaders(sortBy, dir) {
  document.querySelectorAll(".col-hd").forEach((col) => {
    const isActive = col.dataset.sort === sortBy;
    col.classList.toggle("active", isActive);
    col.querySelector(".sort-arrow").textContent = isActive
      ? dir === "asc" ? "↑" : "↓"
      : "";
  });
}

function renderTabs(tabData, sortBy, dir, query) {
  focusedIndex = -1;
  const list = document.getElementById("tab-list");
  list.innerHTML = "";

  let sorted = [...tabData];

  if (sortBy === "duration") {
    sorted.sort((a, b) => {
      if (a.timestamp == null && b.timestamp == null) return 0;
      if (a.timestamp == null) return 1;
      if (b.timestamp == null) return -1;
      return dir === "desc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });
  } else {
    sorted.sort((a, b) => {
      const cmp = a.title.localeCompare(b.title);
      return dir === "asc" ? cmp : -cmp;
    });
  }

  const filtered = query ? sorted.filter((t) => t.search.includes(query)) : sorted;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">${query ? "No matching tabs" : "No tabs open"}</div>`;
    return;
  }

  durationEls.clear();

  filtered.forEach(({ tabId, windowId, title, hostname, favicon, duration, hasTimestamp, group, isStale, timestamp, visits }, index) => {
    const item = document.createElement("div");
    item.className = "tab-item";

    if (isStale) item.classList.add("stale");

    if (opts.opt_animations !== false) {
      item.classList.add("animate");
      item.style.animationDelay = `${index * 25}ms`;
    }

    const groupChip = group
      ? `<span class="group-chip" style="background:${GROUP_COLORS[group.color] ?? "#5f6368"}">${escapeHtml(group.title || "")}</span>`
      : "";

    const staleDot = isStale ? `<div class="stale-dot"></div>` : "";

    const visitLabel = visits > 0
      ? `<span class="tab-visits"> · ${visits} visit${visits !== 1 ? "s" : ""}</span>`
      : "";

    item.innerHTML = `
      ${favicon}
      <div class="tab-info">
        <div class="tab-title" title="${title.replace(/"/g, "&quot;")}">${escapeHtml(title)}</div>
        <div class="tab-url">${escapeHtml(hostname)}${visitLabel}</div>
      </div>
      ${groupChip}
      ${staleDot}
      <div class="tab-duration ${hasTimestamp ? "" : "unknown"}">
        ${hasTimestamp ? duration : "—"}
      </div>
    `;

    item.addEventListener("click", () => {
      chrome.tabs.update(tabId, { active: true });
      chrome.windows.update(windowId, { focused: true });
      window.close();
    });

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.title = "Close tab";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.tabs.remove(tabId);
      item.remove();
      durationEls.delete(tabId);
      const idx = tabData.findIndex((t) => t.tabId === tabId);
      if (idx !== -1) tabData.splice(idx, 1);
    });
    item.appendChild(closeBtn);

    list.appendChild(item);

    if (hasTimestamp) {
      durationEls.set(tabId, { el: item.querySelector(".tab-duration"), timestamp });
    }
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function init() {
  // Fetch tabs, storage, and tab groups in parallel
  const [tabs, storage, rawGroups] = await Promise.all([
    chrome.tabs.query({}),
    new Promise((resolve) => chrome.storage.local.get(null, resolve)),
    chrome.tabGroups ? chrome.tabGroups.query({}) : Promise.resolve([]),
  ]);

  // Apply theme
  applyTheme(storage.theme === "light");

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const nowLight = !document.body.classList.contains("light");
    applyTheme(nowLight);
    chrome.storage.local.set({ theme: nowLight ? "light" : "dark" });
  });

  document.getElementById("options-btn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Resolve options with defaults
  opts = {
    opt_badge:            storage.opt_badge            !== false,
    opt_groups:           storage.opt_groups           !== false,
    opt_warn:             storage.opt_warn             !== false,
    opt_warn_days:        storage.opt_warn_days        ?? 7,
    opt_animations:       storage.opt_animations       !== false,
    opt_refresh:          storage.opt_refresh          !== false,
    opt_refresh_interval: storage.opt_refresh_interval ?? 5,
  };

  // Build groups lookup map
  const groups = {};
  rawGroups.forEach((g) => { groups[g.id] = g; });

  const now = Date.now();
  const warnMs = opts.opt_warn_days * 24 * 60 * 60 * 1000;

  // Build tab data array
  const tabData = tabs.map((tab) => {
    const key = `${tab.id}_${tab.url}`;
    const timestamp = storage[key] ?? null;
    const hasTimestamp = timestamp !== null;
    const title = tab.title || "Untitled";
    const hostname = getHostname(tab.url || "");
    const group = (opts.opt_groups && tab.groupId > 0) ? groups[tab.groupId] ?? null : null;
    const isStale = opts.opt_warn && hasTimestamp && (now - timestamp) > warnMs;

    const visits = storage[`visits_${tab.id}_${tab.url}`] || 0;

    return {
      tabId: tab.id,
      windowId: tab.windowId,
      title,
      hostname,
      search: `${title} ${hostname}`.toLowerCase(),
      timestamp,
      hasTimestamp,
      duration: hasTimestamp ? formatDuration(now - timestamp) : null,
      visits,
      group,
      isStale,
      favicon: tab.favIconUrl
        ? `<img class="favicon" src="${tab.favIconUrl}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className: 'favicon-placeholder'}))">`
        : `<div class="favicon-placeholder"></div>`,
    };
  });

  let currentSort = "duration";
  let currentDir = "desc";
  let currentQuery = "";

  renderTabs(tabData, currentSort, currentDir, currentQuery);
  updateColHeaders(currentSort, currentDir);
  startTicker();

  const search = document.getElementById("search");

  search.addEventListener("input", () => {
    currentQuery = search.value.trim().toLowerCase();
    renderTabs(tabData, currentSort, currentDir, currentQuery);
  });

  search.addEventListener("keydown", (e) => {
    const items = getVisibleItems();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocus(focusedIndex < 0 ? 0 : focusedIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocus(focusedIndex <= 0 ? 0 : focusedIndex - 1);
        break;
      case "Enter":
        if (focusedIndex >= 0) {
          e.preventDefault();
          items[focusedIndex]?.click();
        }
        break;
      case "Escape":
        window.close();
        break;
      default: {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 5 && search.value === "") {
          e.preventDefault();
          items[num - 1]?.click();
        }
      }
    }
  });

  search.focus();

  document.querySelectorAll(".col-hd").forEach((col) => {
    col.addEventListener("click", () => {
      const field = col.dataset.sort;
      if (field === currentSort) {
        currentDir = currentDir === "asc" ? "desc" : "asc";
      } else {
        currentSort = field;
        currentDir = field === "duration" ? "desc" : "asc";
      }
      updateColHeaders(currentSort, currentDir);
      renderTabs(tabData, currentSort, currentDir, currentQuery);
    });
  });
}

init();
