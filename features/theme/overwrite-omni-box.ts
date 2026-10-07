import { darken, hexToRgb, rgbToRgba } from "./color-utils";
import { generateOceanShades } from "./ocean-shades";
import type { ThemeColors } from "./types";

// Same alpha the nav's own Popover background uses (vertical-hover/
// styles.css) — this pushes that exact look onto NetSuite's native
// omni-box search dropdown too, not just our own flyout.
const GRADIENT_ALPHA = 0.95;
const BG_ACTIVE_DARKEN = 0.5;
const STYLE_ELEMENT_ID = "nst-omni-box-override";

// Confirmed (by inspecting NetSuite's own ns_style.css) that these three
// tokens are declared directly on the omni-box popup's own .dark/.light
// modifier class, not on :root/<html> — so overwriting them via
// document.documentElement.style (the technique ocean-shades.ts's
// applyOceanShades uses) never takes effect here: custom-property
// resolution checks for an explicit declaration on the element itself
// before ever falling back to an ancestor's value, regardless of
// importance on that ancestor's declaration. Matching NetSuite's own
// selector in an injected <style> rule, with !important (NetSuite's own
// rule isn't), is what actually wins — !important always beats a
// non-important declaration regardless of specificity or source order.
// ".light" is a guess at the counterpart to the confirmed ".dark" class —
// flag if this still doesn't take in light mode, so the real selector
// can get confirmed the same way.
function getOrCreateOverrideStyleElement(): HTMLStyleElement {
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  return style;
}

export function applyOmniBoxOverrides(colors: ThemeColors): void {
  const shades = generateOceanShades(colors.background);
  // The 150/190 bounds are fixed in ocean-shades.ts's own loop, so these
  // keys always exist — the `?? colors.background` fallback is only to
  // satisfy noUncheckedIndexedAccess, not a real runtime case.
  const shade150 = shades[150] ?? colors.background;
  const shade170 = shades[170] ?? colors.background;
  const gradient = `linear-gradient(0deg, ${rgbToRgba(hexToRgb(shade150), GRADIENT_ALPHA)}, ${rgbToRgba(hexToRgb(shade170), GRADIENT_ALPHA)})`;
  const bgActive = darken(colors.accent, BG_ACTIVE_DARKEN);

  // Kept as a defensive fallback for anything that inherits these tokens
  // from :root without its own closer override (same scope/reasoning as
  // applyOceanShades) — harmless alongside the targeted rule below, which
  // is what actually wins for the omni-box popup itself.
  const root = document.documentElement.style;
  root.setProperty("--ns-ui-omni-box-popup-bg", gradient, "important");
  root.setProperty("--ns-ui-omni-box-popup-border-color-active", colors.accent, "important");
  root.setProperty("--ns-ui-omni-box-popup-bg-active", bgActive, "important");

  getOrCreateOverrideStyleElement().textContent = `
.ns-ui-omni-box-popup.dark,
.ns-ui-omni-box-popup.light {
  --ns-ui-omni-box-popup-bg: ${gradient} !important;
  --ns-ui-omni-box-popup-border-color-active: ${colors.accent} !important;
  --ns-ui-omni-box-popup-bg-active: ${bgActive} !important;
}
`;
}
