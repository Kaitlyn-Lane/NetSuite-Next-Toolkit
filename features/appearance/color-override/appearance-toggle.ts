// One-click kill switch for everything in this feature that overwrites
// NetSuite's own look (ocean-shades.ts, overwrite-omni-box.ts) and the
// vertical-hover flyout's own color-picker-driven styling
// (apply-theme-colors.ts) — separate from the "Vertical Hover Nav"
// feature flag, which controls whether the nav replacement runs at all.
// This one only controls whether its *appearance* gets customized; with
// it off, the nav (if enabled) and NetSuite's own omni-box both fall
// back to NetSuite's native look, since nothing overwrites their tokens.
const STORAGE_KEY = "customAppearanceEnabled";

export async function isCustomAppearanceEnabled(): Promise<boolean> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return (stored[STORAGE_KEY] as boolean | undefined) ?? true;
}

export async function setCustomAppearanceEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: enabled });
}
