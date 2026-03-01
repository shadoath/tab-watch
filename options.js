const DEFAULTS = {
  opt_badge:            true,
  opt_groups:           true,
  opt_warn:             true,
  opt_warn_days:        7,
  opt_animations:       true,
  opt_refresh:          true,
  opt_refresh_interval: 5,
};

let savedTimer = null;

function showSaved() {
  const el = document.getElementById("saved");
  el.classList.add("show");
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => el.classList.remove("show"), 1500);
}

function syncThresholdRow(warnEnabled) {
  document.getElementById("threshold-row").classList.toggle("disabled", !warnEnabled);
}

function syncIntervalRow(refreshEnabled) {
  document.getElementById("interval-row").classList.toggle("disabled", !refreshEnabled);
}

async function init() {
  const storage = await new Promise((resolve) =>
    chrome.storage.local.get(null, resolve)
  );

  // Apply theme
  if (storage.theme === "light") document.body.classList.add("light");

  // Set initial values from storage, falling back to defaults
  const keys = ["opt_badge", "opt_groups", "opt_warn", "opt_animations", "opt_refresh"];
  keys.forEach((key) => {
    const el = document.getElementById(key);
    el.checked = storage[key] !== undefined ? storage[key] : DEFAULTS[key];
  });

  const daysEl = document.getElementById("opt_warn_days");
  daysEl.value = storage.opt_warn_days ?? DEFAULTS.opt_warn_days;

  // Set active interval radio
  const savedInterval = storage.opt_refresh_interval ?? DEFAULTS.opt_refresh_interval;
  const intervalRadio = document.querySelector(`input[name="opt_refresh_interval"][value="${savedInterval}"]`);
  if (intervalRadio) intervalRadio.checked = true;

  syncThresholdRow(document.getElementById("opt_warn").checked);
  syncIntervalRow(document.getElementById("opt_refresh").checked);

  // Save on toggle change
  keys.forEach((key) => {
    document.getElementById(key).addEventListener("change", (e) => {
      chrome.storage.local.set({ [key]: e.target.checked });
      if (key === "opt_warn") syncThresholdRow(e.target.checked);
      if (key === "opt_refresh") syncIntervalRow(e.target.checked);
      showSaved();
    });
  });

  // Save interval on radio change
  document.querySelectorAll("input[name='opt_refresh_interval']").forEach((radio) => {
    radio.addEventListener("change", () => {
      chrome.storage.local.set({ opt_refresh_interval: parseInt(radio.value, 10) });
      showSaved();
    });
  });

  // Save threshold on input (debounced)
  let daysTimer = null;
  daysEl.addEventListener("input", () => {
    clearTimeout(daysTimer);
    daysTimer = setTimeout(() => {
      const val = Math.max(1, Math.min(365, parseInt(daysEl.value, 10) || 7));
      daysEl.value = val;
      chrome.storage.local.set({ opt_warn_days: val });
      showSaved();
    }, 600);
  });
}

init();
