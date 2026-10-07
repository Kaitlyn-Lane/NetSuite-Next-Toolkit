export const THEME_COLORS_STORAGE_KEY = "themeColors";

export interface ThemeColors {
  background: string;
  accent: string;
}

// background matches the vertical-hover flyout's current hardcoded look
// (see features/nav/vertical-hover/styles.css) so nothing changes
// visually until a user actually picks colors. accent matches NetSuite's
// own --ns-ui-omni-box-popup-border-color-active (overwrite-omni-box.ts
// sets that token, and --ns-ui-omni-box-popup-bg-active, from this same
// color) so nothing changes there by default either.
export const DEFAULT_THEME_COLORS: ThemeColors = {
  background: "#1F3A4B",
  accent: "#f0cc72",
};
