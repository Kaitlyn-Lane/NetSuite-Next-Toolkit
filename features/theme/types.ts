export const THEME_COLORS_STORAGE_KEY = "themeColors";

export interface ThemeColors {
  text: string;
  background: string;
  accent: string;
}

// text/background match the vertical-hover flyout's current hardcoded
// look (see features/nav/vertical-hover/styles.css) so nothing changes
// visually until a user actually picks colors. accent matches
// core/theme.css's own --nst-accent so the flyout ties into the rest of
// the toolkit's UI by default.
export const DEFAULT_THEME_COLORS: ThemeColors = {
  text: "#ffffff",
  background: "#1F3A4B",
  accent: "#E2C06B",
};
