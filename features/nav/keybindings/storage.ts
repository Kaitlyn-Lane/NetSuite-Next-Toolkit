import type { KeyBinding, KeyBindingMap } from "./types";

// Deliberately its own storage key, separate from navMenu — reassigning a
// binding or listening for a keypress only ever needs this small map, not
// a walk over the (potentially large) nav tree.
const KEY_BINDINGS_STORAGE_KEY = "navKeyBindings";

export async function getKeyBindingMap(): Promise<KeyBindingMap> {
  const stored = await chrome.storage.local.get(KEY_BINDINGS_STORAGE_KEY);
  return (stored[KEY_BINDINGS_STORAGE_KEY] as KeyBindingMap | undefined) ?? {};
}

async function setKeyBindingMap(map: KeyBindingMap): Promise<void> {
  await chrome.storage.local.set({ [KEY_BINDINGS_STORAGE_KEY]: map });
}

// Assigns `binding` to `href` — a link holds at most one binding, and a
// binding points at most one link, so this first clears `binding` from
// wherever it currently points (stealing it, if it was already assigned
// elsewhere) and clears any other binding this same `href` already had.
// Both are a plain scan over this map (at most 10 entries), never the nav
// tree.
export async function setKeyBinding(binding: KeyBinding, href: string): Promise<void> {
  const map = await getKeyBindingMap();

  for (const key of Object.keys(map) as KeyBinding[]) {
    if (key === binding || map[key] === href) {
      delete map[key];
    }
  }

  map[binding] = href;
  await setKeyBindingMap(map);
}

export async function clearBindingForHref(href: string): Promise<void> {
  const map = await getKeyBindingMap();

  for (const key of Object.keys(map) as KeyBinding[]) {
    if (map[key] === href) {
      delete map[key];
    }
  }

  await setKeyBindingMap(map);
}
