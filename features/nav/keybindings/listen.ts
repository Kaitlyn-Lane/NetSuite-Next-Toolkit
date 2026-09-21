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
// TEMPORARY: console logging at each stage while tracking down why
// shortcuts weren't firing (capture-phase-on-window fix didn't resolve it
// either) — remove once diagnosed. Check the NetSuite tab's console:
//   - No "listener attached" line at all → runKeybindingListener() itself
//     isn't running (safeInit swallowed a throw, or this content script
//     isn't matching/injecting on this page at all).
//   - "listener attached" but pressing Alt+<digit> logs nothing → the
//     keydown event genuinely never reaches window's capture phase here.
//     Likely cause: focus is inside an iframe, and content scripts only
//     run in the top frame by default — a separate document with its own
//     event path entirely.
//   - "alt+ keydown" logs but with an unexpected `code` → the browser/OS
//     isn't reporting the physical key the way this code assumes.
//   - "binding lookup" logs `href: undefined` → the loaded `bindings` map
//     doesn't have the expected key (stale load, or a key-string mismatch).
export async function runKeybindingListener(): Promise<void> {
  const bindings = await getKeyBindingMap();
  console.log("[NST] nav-keybindings: listener attached", bindings);

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
      if (event.altKey) {
        console.log("[NST] nav-keybindings: alt+ keydown", {
          code: event.code,
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
        });
      }

      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const digit = digitFromCode(event.code);
      if (!digit) {
        return;
      }

      const binding = `alt+${digit}` as KeyBinding;
      const href = bindings[binding];
      console.log("[NST] nav-keybindings: binding lookup", { binding, href, bindings });

      if (!href) {
        return;
      }

      event.preventDefault();
      window.location.href = href;
    },
    true,
  );
}
