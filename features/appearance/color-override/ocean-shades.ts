import { hexToRgb, mix, rgbToHex, type Rgb } from "./color-utils";

// NetSuite's own --ns-ui-token-light-ocean-* design tokens run 10
// (lightest) to 190 (darkest) in steps of 10 — a 19-step scale. Generates
// the whole scale from one base color placed exactly at 150, mixing
// toward white below it and toward black above it, so the user only has
// to pick one color rather than nineteen.
const SHADE_MIN = 10;
const SHADE_BASE = 150;
const SHADE_MAX = 190;
const SHADE_STEP = 10;

export function generateOceanShades(baseHex: string): Record<number, string> {
  const base = hexToRgb(baseHex);
  const white: Rgb = [255, 255, 255];
  const black: Rgb = [0, 0, 0];
  const shades: Record<number, string> = {};

  for (let shade = SHADE_MIN; shade <= SHADE_MAX; shade += SHADE_STEP) {
    if (shade === SHADE_BASE) {
      shades[shade] = baseHex;
    } else if (shade < SHADE_BASE) {
      const t = (SHADE_BASE - shade) / (SHADE_BASE - SHADE_MIN);
      shades[shade] = rgbToHex(mix(base, white, t));
    } else {
      const t = (shade - SHADE_BASE) / (SHADE_MAX - SHADE_BASE);
      shades[shade] = rgbToHex(mix(base, black, t));
    }
  }

  return shades;
}

// Overwrites NetSuite's own design tokens globally, on document.documentElement
// (the NetSuite page's <html>) — same scope applyThemeColors uses, and for
// the same reason (the one thing both the page and our portaled Popover
// share). 'important' priority is required here: manual testing confirmed
// a plain (non-important) override didn't take, almost certainly because
// NetSuite sets these tokens itself via inline style (element.style, most
// likely its own JS theming), and an inline style always wins over a
// stylesheet rule of equal or lower importance regardless of selector
// specificity.
export function applyOceanShades(baseHex: string): void {
  const shades = generateOceanShades(baseHex);
  const root = document.documentElement.style;
  for (const [shade, hex] of Object.entries(shades)) {
    root.setProperty(`--ns-ui-token-light-ocean-${shade}`, hex, "important");
  }
}
