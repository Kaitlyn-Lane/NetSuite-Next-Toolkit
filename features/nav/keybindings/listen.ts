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
export async function runKeybindingListener(): Promise<void> {
  const bindings = await getKeyBindingMap();

  // Capture phase, on window — the earliest possible point in the event's
  // path. NetSuite's `oj-c-*` elements are Oracle JET web components, which
  // commonly manage their own keyboard interaction and can call
  // stopPropagation() on a keydown before it would otherwise reach a
  // normal bubble-phase listener on document. Listening this early means
  // we see the event regardless of what anything downstream later does
  // with it — and since we only ever call preventDefault() (never
  // stopPropagation()) when we actually match a bound key, every other
  // keystroke still reaches the page exactly as before.
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
