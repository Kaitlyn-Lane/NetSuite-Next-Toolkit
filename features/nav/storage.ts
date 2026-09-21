import type { NavExtraction } from "./types";

// The one place that knows the storage key — build-menu writes here,
// vertical-hover and customize-nav both read (and customize-nav also
// writes, to persist hide flags), all through this module rather than each
// duplicating the key/raw chrome.storage.local calls.
export const NAV_MENU_STORAGE_KEY = "navMenu";

export async function getNavMenu(): Promise<NavExtraction | undefined> {
  const stored = await chrome.storage.local.get(NAV_MENU_STORAGE_KEY);
  return stored[NAV_MENU_STORAGE_KEY] as NavExtraction | undefined;
}

export async function setNavMenu(navMenu: NavExtraction): Promise<void> {
  await chrome.storage.local.set({ [NAV_MENU_STORAGE_KEY]: navMenu });
}
