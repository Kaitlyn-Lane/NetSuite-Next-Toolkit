import { createRoot } from "react-dom/client";

import { NAV_MENU_BUTTON_SELECTOR } from "@/core/selectors";
import { waitForElement } from "@/core/utils";
import { filterHiddenExtraction } from "@/features/nav/customize-nav/filterHidden";
import { getNavMenu } from "@/features/nav/storage";
import { applyThemeColors } from "@/features/theme/apply-theme-colors";
import { DEFAULT_THEME_COLORS, THEME_COLORS_STORAGE_KEY, type ThemeColors } from "@/features/theme/types";

import { RootMenu } from "./RootMenu";
import "./styles.css";

const TOOLTIP_SUPPRESS_CLASS = "nst-suppress-tooltip";

// If NetSuite's hover tooltip here were driven by the `title` attribute,
// clearing it would be enough — it isn't (confirmed: it's a JET popup
// triggered by its own listener), so this alone doesn't stop it, but
// it's harmless to still clear in case some other tooltip path reads it.
// The tooltip itself renders via a shared JET popup primitive
// (.ns-ui-toolkit-popup-core__content), not something we can suppress by
// attribute — and that class is likely reused by other legitimate
// popups elsewhere in NetSuite Next. So only hide it while the mouse is
// actually over the button (i.e. exactly when it'd collide with our own
// flyout), rather than suppressing it globally — see the matching CSS
// rule in styles.css.
function suppressNativeTooltip(button: HTMLElement): void {
  button.removeAttribute("title");
  button.addEventListener("mouseenter", () => {
    document.documentElement.classList.add(TOOLTIP_SUPPRESS_CLASS);
  });
  button.addEventListener("mouseleave", () => {
    document.documentElement.classList.remove(TOOLTIP_SUPPRESS_CLASS);
  });
}

export async function runNavVerticalHover(): Promise<void> {
  const navMenu = await getNavMenu();
  const stored = await chrome.storage.local.get(THEME_COLORS_STORAGE_KEY);
  const themeColors: ThemeColors = {
    ...DEFAULT_THEME_COLORS,
    ...(stored[THEME_COLORS_STORAGE_KEY] as Partial<ThemeColors> | undefined),
  };

  if (!navMenu) {
    console.warn(
      '[NST] nav-vertical-hover: no stored nav menu found — run "Create Menu Nav" from the popup first',
    );
    return;
  }

  // Each top-level entry (Shortcuts/Menu/Create) is a synthetic wrapper
  // with no href of its own (see extractor.ts's buildTopLevelSection) —
  // unlike a nested container, if hiding leaves one with zero children,
  // render it as absent rather than as a dead-end flyout trigger.
  const groups = filterHiddenExtraction(navMenu).filter(
    (node) => node.type !== "container" || node.children.length > 0,
  );
  applyThemeColors(themeColors);

  const button = (await waitForElement(NAV_MENU_BUTTON_SELECTOR, { timeout: 10000 })) as HTMLElement;
  suppressNativeTooltip(button);

  const mountPoint = document.createElement("div");
  document.body.appendChild(mountPoint);

  createRoot(mountPoint).render(<RootMenu button={button} groups={groups} />);
}
