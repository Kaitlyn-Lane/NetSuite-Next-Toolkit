import { isFeatureEnabled } from "@/core/feature-flags";
import { NETSUITE_MATCHES } from "@/core/matches";
import { safeInit } from "@/core/safe-init";
// Importing these specific files directly, not the feature's own
// index.ts barrel — see vertical-hover/index.tsx's own comment on this
// same import for why (the barrel also re-exports mountThemeColorPicker,
// which pulls in the iro.js color-wheel library, and a content script
// can't shared-chunk-split that back out).
import { isCustomAppearanceEnabled } from "@/features/appearance/color-override/appearance-toggle";
import { applyThemeColors } from "@/features/appearance/color-override/apply-theme-colors";
import { DEFAULT_THEME_COLORS, THEME_COLORS_STORAGE_KEY, type ThemeColors } from "@/features/appearance/color-override/types";
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
    // Each frame is a wholly separate document — a custom property set
    // on the top frame's <html> (which is all vertical-hover's own
    // applyThemeColors call, running only in nav.content.ts without
    // allFrames, ever reaches) never crosses into this iframe's own
    // <html>. Header Banners' target lives here, not the top frame, so
    // this needs its own call, redundant with vertical-hover's in the
    // top frame but harmless (same color, same idempotent writes).
    if (await isCustomAppearanceEnabled()) {
      const stored = await chrome.storage.local.get(THEME_COLORS_STORAGE_KEY);
      const themeColors: ThemeColors = {
        ...DEFAULT_THEME_COLORS,
        ...(stored[THEME_COLORS_STORAGE_KEY] as Partial<ThemeColors> | undefined),
      };
      safeInit("color-override-frame", () => {
        applyThemeColors(themeColors);
      });
    }

    if (await isFeatureEnabled("headerBanners")) {
      safeInit("header-banners", applyHeaderBanners);
    }
  },
});
