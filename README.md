# TabWatch

> See how long every browser tab has been open — search, sort, and jump to any tab in one click.

---

## Features

- **Time per tab** — tracks how long each tab has been open, persisted across browser sessions
- **Sort by duration or title** — click column headers to toggle sort direction
- **Search** — filter tabs by title or URL instantly
- **Jump to tab** — clicking any row focuses that tab and window
- **Dark / light mode** — toggle in the toolbar, preference saved automatically
- **Lightweight** — no analytics, no network requests, all data stays local

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
4. Click **Load unpacked** and select the `tabwatch` folder

---

## How it works

- A background service worker listens for `tabs.onUpdated` events. When a page finishes loading, it stores `tabId + URL → timestamp` in `chrome.storage.local`.
- When you open the popup, it reads all open tabs and calculates elapsed time from the stored timestamps.
- Navigating to a new URL in a tab resets that tab's timer. Refreshing the same page does not.
- Timestamps are removed automatically when a tab is closed.

All data is stored locally in your browser. Nothing is ever sent anywhere.

---

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Read tab titles, URLs, and favicons |
| `storage` | Persist timestamps and theme preference locally |
| `windows` | Focus the correct window when jumping to a tab |

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first.

---

## License

[MIT](LICENSE) — © [Your Name]
