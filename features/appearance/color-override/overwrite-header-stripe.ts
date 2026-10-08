import { generateOceanShades } from "./ocean-shades";
import type { ThemeColors } from "./types";

const STYLE_ELEMENT_ID = "nst-header-stripe-override";
// How strongly the tint shows through — 1 is the full ocean-150 hue,
// lower lets more of the image's original color back in.
const TINT_OPACITY = 0.5;

// .ns-ui-host-header-stripe is NetSuite's own class for the decorative
// image strip along the top of the page — an <img>, not a background, so
// there's no token to overwrite. Instead this lays an ocean-150 layer
// over it via ::after. mix-blend-mode: color keeps the image's own
// light/dark detail and only swaps its hue/saturation for ours, so it
// reads as a tint rather than a flat bar. pointer-events: none keeps the
// overlay from swallowing clicks on anything inside the stripe. The
// stripe's own position is deliberately left alone — NetSuite already
// positions it, and forcing position: relative shrank it so the overlay
// only covered part of the image.
function getOrCreateOverrideStyleElement(): HTMLStyleElement {
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  return style;
}

export function applyHeaderStripeOverride(colors: ThemeColors): void {
  // Same noUncheckedIndexedAccess-only fallback as overwrite-omni-box.ts.
  const shade150 = generateOceanShades(colors.background)[150] ?? colors.background;

  getOrCreateOverrideStyleElement().textContent = `
.ns-ui-host-header-stripe::after {
  width: 100% !important;
  content: "";
  position: absolute;
  inset: 0;
  background: ${shade150};
  mix-blend-mode: color;
  opacity: ${TINT_OPACITY};
  pointer-events: none;
}
`;
}
