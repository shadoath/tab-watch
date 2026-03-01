# CLAUDE.md — TabWatch

Instructions for Claude Code when working on this project.

## Project Structure

```
tab-timer/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker — tracks tab open timestamps
├── popup.html          # Popup UI + all CSS (inline, no external stylesheet)
├── popup.js            # Popup logic — rendering, search, sort, theme, navigation
├── icons/
│   ├── icon.svg        # Source icon — edit this, then regenerate PNGs
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── CLAUDE.md           # This file
├── DEV.md              # Development and deploy reference
├── README.md           # Public-facing docs
└── LICENSE             # MIT
```

## Key Conventions

- **No build step.** Plain HTML, CSS, and JS only. Do not introduce bundlers, TypeScript, or npm.
- **All CSS lives in `popup.html`** as an inline `<style>` block using CSS custom properties for theming.
- **All popup logic lives in `popup.js`.** Keep it as a single file.
- **Colors are defined once** in `:root` (dark) and `body.light` (light) in `popup.html`. Never hardcode colors elsewhere — always use a `var(--token)`.

## Storage Schema

`chrome.storage.local` keys:

| Key | Value | Set by |
|---|---|---|
| `{tabId}_{url}` | `timestamp (ms)` | `background.js` on `tabs.onUpdated` |
| `theme` | `"light"` or `"dark"` | `popup.js` on toggle click |

## Icons

The source file is `icons/icon.svg`. After editing it, regenerate all PNG sizes with:

```bash
for size in 16 32 48 128; do
  rsvg-convert -w $size -h $size icons/icon.svg -o icons/icon${size}.png
done
```

Requires `rsvg-convert` (`brew install librsvg`).

## Color Palette

| Token | Dark | Light |
|---|---|---|
| `--accent` | `#1a6bff` | `#1a6bff` |
| `--bg` | `#0d1117` | `#f0f4ff` |
| `--border` | `#1a2235` | `#d0daf5` |
| `--text-title` | `#ccd6f6` | `#1a2455` |

## Permissions

Only request what is used. Current permissions and their purpose:
- `tabs` — query tab titles, URLs, favicons
- `storage` — persist timestamps + theme preference
- `windows` — focus the correct window on tab click
