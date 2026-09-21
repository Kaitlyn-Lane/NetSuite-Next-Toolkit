export const KEY_BINDINGS = [
  "alt+1",
  "alt+2",
  "alt+3",
  "alt+4",
  "alt+5",
  "alt+6",
  "alt+7",
  "alt+8",
  "alt+9",
  "alt+0",
] as const;

export type KeyBinding = (typeof KEY_BINDINGS)[number];

// binding -> the href it jumps to. Keyed by binding, not by node or href,
// so both directions this feature actually needs are O(1) against a map
// with at most 10 entries: "what does Alt+3 open" (storage.ts's
// getKeyBindingMap, read by the keydown listener) and "does this href
// already have a binding" (a plain scan of this same small map — see
// storage.ts's setKeyBinding). Neither ever touches the nav tree itself.
export type KeyBindingMap = Partial<Record<KeyBinding, string>>;
