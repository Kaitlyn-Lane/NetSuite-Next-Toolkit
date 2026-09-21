import type { NavExtraction } from "@/features/nav/build-menu/extractor";

// Same key features/nav/build-menu and features/nav/vertical-hover already
// read/write — hide flags live directly on this tree (see extractor.ts's
// `MenuNode.hidden` field) rather than in a second storage key, so there's
// nothing to reconcile between two independent stores.
export const NAV_MENU_STORAGE_KEY = "navMenu";

export async function getNavMenu(): Promise<NavExtraction | undefined> {
  const stored = await chrome.storage.local.get(NAV_MENU_STORAGE_KEY);
  return stored[NAV_MENU_STORAGE_KEY] as NavExtraction | undefined;
}

export async function setNavMenu(navMenu: NavExtraction): Promise<void> {
  await chrome.storage.local.set({ [NAV_MENU_STORAGE_KEY]: navMenu });
}
