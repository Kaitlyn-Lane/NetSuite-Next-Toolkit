import { NETSUITE_MATCHES } from "@/core/matches";
import { safeInit } from "@/core/safe-init";
import { buildNavMenu } from "@/features/nav/build-menu";
import { isBuildNavMenuRequest, type BuildNavMenuResponse } from "@/features/nav/build-menu/types/messages";
import { runNavVerticalHover } from "@/features/nav/vertical-hover";

// Every nav feature shares NETSUITE_MATCHES, so they're registered from one
// content script instead of one file each. Add new nav features here as a
// safeInit(...) call (or a message listener, for RPC-style features like
// build-menu) rather than creating a new entrypoint file — a feature only
// needs its own entrypoint if it needs different matches/run_at timing.
export default defineContentScript({
  matches: NETSUITE_MATCHES,
  main() {
    safeInit("nav-vertical-hover", runNavVerticalHover);

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
