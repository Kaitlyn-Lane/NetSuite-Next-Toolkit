import type { ThemeColors } from "./types";

// Set on document.documentElement (the NetSuite page's <html>) rather than
// the flyout's own mount point, since react-aria-components' Popover
// portals outside of it — this is the one scope both the portal and the
// trigger button share.
export function applyThemeColors(colors: ThemeColors): void {
  const root = document.documentElement.style;
  root.setProperty("--nst-flyout-text", colors.text);
  root.setProperty("--nst-flyout-bg", colors.background);
  root.setProperty("--nst-flyout-accent", colors.accent);
}
