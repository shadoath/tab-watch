# TabWatch

> See how long every browser tab has been open — search, sort, jump to or close any tab without leaving the popup.

---

## Features

### Core
- **Time per tab** — tracks how long each tab has been open, persisted across browser sessions
- **Sort by duration or title** — click column headers to toggle sort direction (↑ ↓)
- **Search** — filter tabs by title or URL instantly
- **Jump to tab** — click any row to focus that tab and window, closing the popup
- **Close tab** — hover a row to reveal an × button; closes the tab without switching to it
- **Dark / light mode** — toggle in the toolbar, preference saved automatically

### Options
All of the below are configurable via the ⚙ settings page (right-click extension icon → Options):

- **Badge count** — shows the number of open tabs on the extension icon
- **Tab groups** — displays each tab's Chrome group name and color as a pill
- **Tab limit warning** — dims tabs open longer than a configurable threshold (default 7 days)
- **Auto-refresh** — keeps durations updating live while the popup is open; interval configurable: 1s / 3s / 5s / 10s
- **Animations** — subtle fade-in cascade when the popup opens

### Keyboard shortcuts
| Key | Action |
|---|---|
| `↓` / `↑` | Move focus through the tab list |
| `Enter` | Jump to the focused tab |
| `Escape` | Close the popup |
| `1` – `5` | Jump directly to that row (only when search is empty) |

---

## Install

### Chrome Web Store
*(Coming soon)*

### Load from source

1. Clone the repo:
   ```bash
   git clone https://github.com/shadoath/tab-watch.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right)
4. Click **Load unpacked** and select the `tab-timer` folder

---

## How it works

- A background service worker listens for `tabs.onUpdated` events. When a page finishes loading it stores `tabId + URL → timestamp` in `chrome.storage.local`.
- When you open the popup, it reads all open tabs, fetches stored timestamps, and calculates elapsed time.
- Navigating to a new URL in a tab resets that tab's timer. Refreshing the same page does not.
- The auto-refresh ticker updates duration text in-place (no DOM rebuild) to avoid flicker.
- Timestamps are removed automatically when a tab is closed.

All data is stored locally in your browser. Nothing is ever sent anywhere.

---

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Read tab titles, URLs, favicons, and close tabs |
| `storage` | Persist timestamps and preferences locally |
| `windows` | Focus the correct window when jumping to a tab |
| `tabGroups` | Read Chrome tab group names and colors |

---

## Contributing

Pull requests are welcome. For significant changes please open an issue first.

---

## License

[MIT](LICENSE) — © [Your Name]
