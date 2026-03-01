# DEV.md — TabWatch Developer Reference

## Local Development

**Load the extension in Chrome:**
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `tab-timer/` folder

**Reload after changes:**
- Changes to `popup.html` / `popup.js` — just close and reopen the popup
- Changes to `background.js` or `manifest.json` — click the reload icon on the extension card in `chrome://extensions`

**Inspect the popup:**
Right-click the toolbar icon → **Inspect popup**

**Inspect the service worker:**
`chrome://extensions` → TabWatch → **Service Worker** link

**View stored timestamps:**
In the service worker console:
```js
chrome.storage.local.get(null, console.log)
```

Clear all stored data:
```js
chrome.storage.local.clear()
```

---

## Icons

Source file: `icons/icon.svg`

After editing the SVG, regenerate all PNG sizes:
```bash
for size in 16 32 48 128; do
  rsvg-convert -w $size -h $size icons/icon.svg -o icons/icon${size}.png
done
```

Install `rsvg-convert` if needed:
```bash
brew install librsvg
```

---

## Versioning

Version is set in `manifest.json`:
```json
"version": "1.0.0"
```

Chrome Web Store requires incrementing this on every update submission.

---

## Packaging for the Chrome Web Store

Create a ZIP (exclude git history):
```bash
cd /Users/skylar/personal-code
zip -r tabwatch.zip tab-timer/ --exclude "tab-timer/.git/*"
```

Upload at: [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)

**Required assets for the store listing:**
| Asset | Size | Required |
|---|---|---|
| Extension ZIP | — | Yes |
| Screenshot | 1280×800 or 640×400 px | Yes (at least 1) |
| Small promo tile | 440×280 px | Recommended |
| Large promo tile | 920×680 px | Optional |

**Permission justifications** (copy-paste into the store form):
- `tabs` — Read tab titles, URLs, and favicons to display them in the popup
- `storage` — Persist tab open timestamps and the user's theme preference locally in the browser
- `windows` — Focus the correct browser window when the user clicks a tab in the popup

---

## Deployment Checklist

- [ ] Increment `version` in `manifest.json`
- [ ] Regenerate PNGs if icon was changed
- [ ] Test in Chrome with a clean reload of the extension
- [ ] Create the ZIP
- [ ] Upload to the Developer Dashboard
- [ ] Update store screenshots if UI changed
- [ ] Publish
