export const NAV_HIDDEN_KEYS_STORAGE_KEY = "navHiddenKeys";

export async function getHiddenKeys(): Promise<Set<string>> {
  const stored = await chrome.storage.local.get(NAV_HIDDEN_KEYS_STORAGE_KEY);
  const value = stored[NAV_HIDDEN_KEYS_STORAGE_KEY];
  return new Set(Array.isArray(value) ? value : []);
}

export async function setHiddenKeys(keys: Set<string>): Promise<void> {
  await chrome.storage.local.set({ [NAV_HIDDEN_KEYS_STORAGE_KEY]: Array.from(keys) });
}

export async function setNodeHidden(key: string, hidden: boolean): Promise<void> {
  const keys = await getHiddenKeys();
  if (hidden) {
    keys.add(key);
  } else {
    keys.delete(key);
  }
  await setHiddenKeys(keys);
}
