const STYLE_ELEMENT_ID = "nst-header-banners";

// Widens NetSuite's own field-group header bars to full width with a
// light ocean-tinted background. .uir-field-group-title is NetSuite's
// own (undocumented, possibly version-specific) class for these — not
// ours. Reads --ns-ui-token-light-ocean-50 live rather than a fixed
// color, so this automatically tracks whatever Color Override
// (overwrite-omni-box.ts/ocean-shades.ts) has set it to, or NetSuite's
// own native value if that feature is off — no direct coupling between
// the two needed. !important on both properties because every other
// attempt at overriding NetSuite's own CSS this way in this codebase has
// needed it (see overwrite-omni-box.ts) — NetSuite's own rule for this
// class may or may not actually require it, untested.
export function applyHeaderBanners(): void {
  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
.uir-field-group-title {
  width: 100% !important;
  background: var(--ns-ui-token-light-ocean-50, #d6e4ea) !important;
}
`;
  document.head.appendChild(style);
}
