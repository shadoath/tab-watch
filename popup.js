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
  const list = document.getElementById("tab-list");
  list.innerHTML = "";

  let sorted = [...tabData];

  if (sortBy === "duration") {
    sorted.sort((a, b) => {
      if (a.timestamp == null && b.timestamp == null) return 0;
      if (a.timestamp == null) return 1;
      if (b.timestamp == null) return -1;
      // desc = longest open first = smaller timestamp first
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

  filtered.forEach(({ tabId, windowId, title, hostname, favicon, duration, hasTimestamp }) => {
    const item = document.createElement("div");
    item.className = "tab-item";

    item.innerHTML = `
      ${favicon}
      <div class="tab-info">
        <div class="tab-title" title="${title.replace(/"/g, "&quot;")}">${escapeHtml(title)}</div>
        <div class="tab-url">${escapeHtml(hostname)}</div>
      </div>
      <div class="tab-duration ${hasTimestamp ? "" : "unknown"}">
        ${hasTimestamp ? duration : "—"}
      </div>
    `;

    item.addEventListener("click", () => {
      chrome.tabs.update(tabId, { active: true });
      chrome.windows.update(windowId, { focused: true });
      window.close();
    });

    list.appendChild(item);
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
  const [tabs, storage] = await Promise.all([
    chrome.tabs.query({}),
    new Promise((resolve) => chrome.storage.local.get(null, resolve)),
  ]);

  const isLight = storage["theme"] === "light";
  applyTheme(isLight);

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const nowLight = !document.body.classList.contains("light");
    applyTheme(nowLight);
    chrome.storage.local.set({ theme: nowLight ? "light" : "dark" });
  });

  const now = Date.now();

  // Build a plain data array — all rendering reads from this
  const tabData = tabs.map((tab) => {
    const key = `${tab.id}_${tab.url}`;
    const timestamp = storage[key] ?? null;
    const hasTimestamp = timestamp !== null;
    const title = tab.title || "Untitled";
    const hostname = getHostname(tab.url || "");

    return {
      tabId: tab.id,
      windowId: tab.windowId,
      title,
      hostname,
      search: `${title} ${hostname}`.toLowerCase(),
      timestamp,
      hasTimestamp,
      duration: hasTimestamp ? formatDuration(now - timestamp) : null,
      favicon: tab.favIconUrl
        ? `<img class="favicon" src="${tab.favIconUrl}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className: 'favicon-placeholder'}))">`
        : `<div class="favicon-placeholder"></div>`,
    };
  });

  let currentSort = "duration";
  let currentDir = "desc"; // longest open first
  let currentQuery = "";

  renderTabs(tabData, currentSort, currentDir, currentQuery);
  updateColHeaders(currentSort, currentDir);

  // Search
  const search = document.getElementById("search");
  search.addEventListener("input", () => {
    currentQuery = search.value.trim().toLowerCase();
    renderTabs(tabData, currentSort, currentDir, currentQuery);
  });
  search.focus();

  // Column header sort
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
