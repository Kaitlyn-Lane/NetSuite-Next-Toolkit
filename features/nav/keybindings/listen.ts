import { getKeyBindingMap } from "./storage";
import type { KeyBinding } from "./types";

const DIGIT_CODE_PREFIX = "Digit";

// event.code is the physical key, independent of layout/modifiers — unlike
// event.key, which on macOS turns Option+<digit> into a different
// character entirely (e.g. Option+1 → "¡" in a US layout), not "1".
function digitFromCode(code: string): string | undefined {
  return code.startsWith(DIGIT_CODE_PREFIX) ? code.slice(DIGIT_CODE_PREFIX.length) : undefined;
}

// Loaded once when the content script initializes and kept for the page's
// lifetime, same "refresh to apply changes" convention every other setting
// in this extension already follows — a keypress never touches storage.
//
// Registered from entrypoints/nav-keybindings.content.ts with
// allFrames: true — confirmed necessary: NetSuite Next's main content area
// renders inside an iframe, and this listener otherwise only ever saw
// keystrokes from the top frame (its header). See that entrypoint's
// comment for why vertical-hover/build-menu deliberately don't get the
// same treatment.
export async function runKeybindingListener(): Promise<void> {
  const bindings = await getKeyBindingMap();

  // Capture phase, on window — the earliest possible point in the event's
  // path. Defensive: NetSuite's `oj-c-*` elements are Oracle JET web
  // components, which commonly manage their own keyboard interaction and
  // could call stopPropagation() on a keydown before it reached a normal
  // bubble-phase listener. Harmless either way — we only ever call
  // preventDefault() (never stopPropagation()), and only once we've
  // actually matched a bound key, so no other keystroke is affected.
  window.addEventListener(
    "keydown",
    (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const digit = digitFromCode(event.code);
      if (!digit) {
        return;
      }

      const href = bindings[`alt+${digit}` as KeyBinding];
      if (!href) {
        return;
      }

      event.preventDefault();
      window.location.href = href;
    },
    true,
  );
}
