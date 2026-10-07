import { isFeatureEnabled } from "@/core/feature-flags";
import { NETSUITE_MATCHES } from "@/core/matches";
import { safeInit } from "@/core/safe-init";
import { applyHeaderBanners } from "@/features/appearance/header-banner";

// Separate entrypoint from nav.content.ts for the same reason
// nav-keybindings.content.ts is: allFrames: true. NetSuite Next's record
// content — where .uir-field-group-title bars live — renders inside an
// iframe, not the top frame (see nav-keybindings.content.ts's own
// comment for the fuller story on why that split exists). Nav features
// don't have this problem and stay in nav.content.ts without allFrames;
// this is where appearance effects that DO need it live instead, kept
// separate from nav-keybindings.content.ts since the two are unrelated
// concerns.
export default defineContentScript({
  matches: NETSUITE_MATCHES,
  allFrames: true,
  async main() {
    if (await isFeatureEnabled("headerBanners")) {
      safeInit("header-banners", applyHeaderBanners);
    }
  },
});
