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

  document.addEventListener("keydown", (event) => {
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
  });
}
