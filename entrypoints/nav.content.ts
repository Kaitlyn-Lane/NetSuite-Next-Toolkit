import { isFeatureEnabled } from "@/core/feature-flags";
import { NETSUITE_MATCHES } from "@/core/matches";
import { safeInit } from "@/core/safe-init";
import { buildNavMenu } from "@/features/nav/build-menu";
import { isBuildNavMenuRequest, type BuildNavMenuResponse } from "@/features/nav/build-menu/types/messages";
import { runNavVerticalHover } from "@/features/nav/vertical-hover";

// Every nav feature shares NETSUITE_MATCHES, so they're registered from one
// content script instead of one file each. Add new nav features here as a
// safeInit(...) call (or a message listener, for RPC-style features like
// build-menu) rather than creating a new entrypoint file — a feature only
// needs its own entrypoint if it needs different matches/run_at timing (or
// allFrames — see nav-keybindings.content.ts, which needs exactly that and
// so isn't registered here).
//
// build-menu is deliberately never gated by a feature flag: it only runs
// when the user clicks the popup button, so there's nothing to lock behind
// a setting. Auto-injected features that should be independently toggle-
// able (vertical-hover today) check isFeatureEnabled(...) before their
// safeInit(...) call — flags are read once at content-script load, so
// toggling one requires a tab refresh, same as re-running the scraper.
//
// Both vertical-hover and build-menu only ever need the top frame (the nav
// button and nav panel both live there) — this script deliberately does
// NOT set allFrames, since build-menu's message listener would otherwise
// also run in every iframe and race the top frame's real response with a
// same-tab sendMessage (an iframe without the nav button rejects fast; if
// that reply reaches the popup before the real one, it'd show a bogus
// "menu button not found" error even though the scrape actually
// succeeded).
export default defineContentScript({
  matches: NETSUITE_MATCHES,
  async main() {
    if (await isFeatureEnabled("verticalHoverNav")) {
      safeInit("nav-vertical-hover", runNavVerticalHover);
    }

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!isBuildNavMenuRequest(message)) {
        return undefined;
      }

      buildNavMenu()
        .then(({ count }) => {
          sendResponse({ ok: true, count } satisfies BuildNavMenuResponse);
        })
        .catch((error: unknown) => {
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          } satisfies BuildNavMenuResponse);
        });

      // Keep the message channel open for the async sendResponse call above.
      return true;
    });
  },
});
