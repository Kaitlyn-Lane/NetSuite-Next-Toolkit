import { applyOceanShades } from "./ocean-shades";
import { applyOmniBoxOverrides } from "./overwrite-omni-box";
import type { ThemeColors } from "./types";

// Set on document.documentElement (the NetSuite page's <html>) rather than
// the flyout's own mount point, since react-aria-components' Popover
// portals outside of it — this is the one scope both the portal and the
// trigger button share.
export function applyThemeColors(colors: ThemeColors): void {
  const root = document.documentElement.style;
  root.setProperty("--nst-flyout-bg", colors.background);
  root.setProperty("--nst-flyout-accent", colors.accent);
  // Reuses the same "Background" color the user already picks — it's the
  // nav's main color, so it doubles as the base NetSuite's own
  // --ns-ui-token-light-ocean-* scale gets generated from (see
  // ocean-shades.ts for why 150 specifically).
  applyOceanShades(colors.background);
  // Pushes the nav's own gradient/accent look onto NetSuite's native
  // omni-box search dropdown too (see overwrite-omni-box.ts).
  applyOmniBoxOverrides(colors);
}
