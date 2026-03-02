let savedTimer = null

function showSaved() {
  const el = document.getElementById('saved')
  el.classList.add('show')
  clearTimeout(savedTimer)
  savedTimer = setTimeout(() => el.classList.remove('show'), 1500)
}

function syncThresholdRow(warnEnabled) {
  document
    .getElementById('threshold-row')
    .classList.toggle('disabled', !warnEnabled)
}

function syncIntervalRow(refreshEnabled) {
  document
    .getElementById('interval-row')
    .classList.toggle('disabled', !refreshEnabled)
}

async function init() {
  const storage = await new Promise((resolve) =>
    chrome.storage.local.get(null, resolve),
  )

  // Apply theme and wire toggle
  function applyTheme(isLight) {
    document.body.classList.toggle('light', isLight)
    const toggle = document.getElementById('theme-toggle')
    toggle.querySelector('.icon').textContent = isLight ? '☽' : '☀'
    toggle.querySelector('.label').textContent = isLight ? 'Dark' : 'Light'
  }

  applyTheme(storage.theme === 'light')

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const nowLight = !document.body.classList.contains('light')
    applyTheme(nowLight)
    chrome.storage.local.set({ theme: nowLight ? 'light' : 'dark' })
  })

  // Show extension version
  document.getElementById('version').textContent =
    'v' + chrome.runtime.getManifest().version

  // Set initial values from storage, falling back to defaults
  const keys = [
    'opt_badge',
    'opt_groups',
    'opt_warn',
    'opt_animations',
    'opt_refresh',
  ]
  keys.forEach((key) => {
    const el = document.getElementById(key)
    el.checked = storage[key] !== undefined ? storage[key] : DEFAULTS[key]
  })

  const daysEl = document.getElementById('opt_warn_days')
  daysEl.value = storage.opt_warn_days ?? DEFAULTS.opt_warn_days

  // Set active interval radio
  const savedInterval =
    storage.opt_refresh_interval ?? DEFAULTS.opt_refresh_interval
  const intervalRadio = document.querySelector(
    `input[name="opt_refresh_interval"][value="${savedInterval}"]`,
  )
  if (intervalRadio) intervalRadio.checked = true

  syncThresholdRow(document.getElementById('opt_warn').checked)
  syncIntervalRow(document.getElementById('opt_refresh').checked)

  // Save on toggle change
  keys.forEach((key) => {
    document.getElementById(key).addEventListener('change', (e) => {
      chrome.storage.local.set({ [key]: e.target.checked })
      if (key === 'opt_warn') syncThresholdRow(e.target.checked)
      if (key === 'opt_refresh') syncIntervalRow(e.target.checked)
      showSaved()
    })
  })

  // Save interval on radio change
  document
    .querySelectorAll("input[name='opt_refresh_interval']")
    .forEach((radio) => {
      radio.addEventListener('change', () => {
        chrome.storage.local.set({
          opt_refresh_interval: parseInt(radio.value, 10),
        })
        showSaved()
      })
    })

  // Save threshold on input (debounced)
  let daysTimer = null
  daysEl.addEventListener('input', () => {
    clearTimeout(daysTimer)
    daysTimer = setTimeout(() => {
      const val = Math.max(1, Math.min(365, parseInt(daysEl.value, 10) || 7))
      daysEl.value = val
      chrome.storage.local.set({ opt_warn_days: val })
      showSaved()
    }, 600)
  })

  // Clear tab history (timestamps + visit counts)
  document
    .getElementById('clear-storage')
    .addEventListener('click', async () => {
      const items = await new Promise((resolve) =>
        chrome.storage.local.get(null, resolve),
      )
      const keysToRemove = Object.keys(items).filter(
        (k) => /^\d+_/.test(k) || k.startsWith('v:'),
      )
      if (keysToRemove.length > 0) {
        await new Promise((resolve) =>
          chrome.storage.local.remove(keysToRemove, resolve),
        )
      }
      showSaved()
    })
}

init()

