# Privacy Policy — TabWatch

_Last updated: February 2026_

## Summary

TabWatch does not collect, transmit, or share any data. Everything stays in your browser.

## Data Collected

TabWatch stores the following data **locally in your browser** using `chrome.storage.local`:

| Data                          | Purpose                                | Stored where          |
| ----------------------------- | -------------------------------------- | --------------------- |
| Tab open timestamp            | Calculate how long a tab has been open | Local browser storage |
| Theme preference (dark/light) | Remember your display preference       | Local browser storage |

No personally identifiable information is stored. Timestamps are keyed by tab ID and URL and are automatically deleted when a tab is closed.

## Data Sharing

TabWatch does not:

- Transmit any data to external servers
- Use analytics or tracking of any kind
- Access browsing history beyond what is visible in your currently open tabs
- Store any data beyond your current browser profile

## Permissions

| Permission | Why it's needed                                                       |
| ---------- | --------------------------------------------------------------------- |
| `tabs`     | Read open tab titles, URLs, and favicons to display them in the popup |
| `storage`  | Save timestamps and theme preference locally in your browser          |
| `windows`  | Focus the correct browser window when you click a tab in the popup    |

## Changes

If this policy changes, the _Last updated_ date above will be revised and a new version will be published to the Chrome Web Store.

## Contact

For questions or concerns, open an issue at [github.com/shadoath/tab-watch](https://github.com/shadoath/tab-watch).
