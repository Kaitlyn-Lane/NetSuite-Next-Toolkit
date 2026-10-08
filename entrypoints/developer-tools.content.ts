import { NETSUITE_MATCHES } from "@/core/matches";
// Importing these specific files directly, not the feature's own
// index.ts barrel — the barrel also re-exports the popup's React UI
// (react-json-view-lite + its stylesheet), which a content script has no
// use for and can't shared-chunk-split back out (same reasoning as
// appearance.content.ts's color-override imports).
import { getCurrentRecord } from "@/features/developer-tools/record-browser/fetch-record";
import {
  isGetRecordRequest,
  type GetRecordResponse,
} from "@/features/developer-tools/record-browser/types/messages";

// Developer-tool actions: user-initiated from the popup, never auto-run.
// Record Browser's feature flag gates its button in the popup's Actions
// section, not this listener. The listener does nothing until the popup
// sends GET_RECORD, so there's nothing to gate here (and gating it would
// make the toggle need a tab refresh, which it otherwise doesn't).
// Separate from nav.content.ts since these aren't nav features, not
// because the matches/timing differ.
//
// Deliberately top frame only (no allFrames), for the same reason
// nav.content.ts is: this is a same-tab sendMessage RPC, and a listener
// in every iframe would race the top frame's real answer — an iframe
// without #classicIframe would reply "no record found" fast and could
// beat it to the popup. #classicIframe is expected to live in the top
// frame; if that turns out to be wrong (see the feature README's open
// questions), this is the file that needs to change.
export default defineContentScript({
  matches: NETSUITE_MATCHES,
  main() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!isGetRecordRequest(message)) {
        return undefined;
      }

      getCurrentRecord()
        .then(({ record, sourceUrl }) => {
          sendResponse({ ok: true, record, sourceUrl } satisfies GetRecordResponse);
        })
        .catch((error: unknown) => {
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          } satisfies GetRecordResponse);
        });

      // Keep the message channel open for the async sendResponse call above.
      return true;
    });
  },
});
