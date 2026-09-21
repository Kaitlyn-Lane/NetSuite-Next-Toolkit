import { createRoot } from "react-dom/client";

import { NAV_MENU_BUTTON_SELECTOR } from "@/core/selectors";
import { waitForElement } from "@/core/utils";
import type { MenuContainerNode, MenuNode, NavExtraction } from "@/features/nav/build-menu/extractor";
import { applyThemeColors } from "@/features/theme/apply-theme-colors";
import { DEFAULT_THEME_COLORS, THEME_COLORS_STORAGE_KEY, type ThemeColors } from "@/features/theme/types";

import { RootMenu } from "./RootMenu";
import "./styles.css";

const NAV_MENU_STORAGE_KEY = "navMenu";
const TOOLTIP_SUPPRESS_CLASS = "nst-suppress-tooltip";

// nav.shortcuts/nav.create each already contain a container node labeled
// "Shortcuts"/"Create" (the section itself, with its real links as
// children) — use its children directly instead of wrapping it again
// under a second synthetic group with the same label, which just
// double-nests.
function flattenSectionChildren(sections: MenuNode[]): MenuNode[] {
  return sections.flatMap((section) => (section.type === "container" ? section.children : [section]));
}

// The three stored fields become the top-level hover groups. Order here
// is the visual stacking order (top of stack first, closest to the
// button last) — Shortcuts, Menu, Create matches what was asked for.
function buildTopLevelGroups(nav: NavExtraction): MenuContainerNode[] {
  return [
    {
      type: "container",
      label: "Shortcuts",
      automationType: null,
      href: null,
      children: flattenSectionChildren(nav.shortcuts),
    },
    { type: "container", label: "Menu", automationType: null, href: null, children: nav.menu },
    {
      type: "container",
      label: "Create",
      automationType: null,
      href: null,
      children: flattenSectionChildren(nav.create),
    },
  ];
}

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
  const stored = await chrome.storage.local.get([NAV_MENU_STORAGE_KEY, THEME_COLORS_STORAGE_KEY]);
  const navMenu = stored[NAV_MENU_STORAGE_KEY] as NavExtraction | undefined;
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

  applyThemeColors(themeColors);

  const button = (await waitForElement(NAV_MENU_BUTTON_SELECTOR, { timeout: 10000 })) as HTMLElement;
  suppressNativeTooltip(button);

  const mountPoint = document.createElement("div");
  document.body.appendChild(mountPoint);

  createRoot(mountPoint).render(<RootMenu button={button} groups={buildTopLevelGroups(navMenu)} />);
}
