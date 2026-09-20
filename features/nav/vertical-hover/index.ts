import "./styles.css";

import { NAV_MENU_BUTTON_SELECTOR } from "@/core/selectors";
import { waitForElement } from "@/core/utils";
import type { MenuContainerNode, MenuNode, NavExtraction } from "@/features/nav/build-menu/extractor";

const NAV_MENU_STORAGE_KEY = "navMenu";

// Recursive: builds one <ul> per level, whether it's the top-level
// shortcuts/menu/create groups or any nested container's children. Shown
// via pure CSS :hover — no click/mouseenter state to manage.
function buildMenuList(nodes: MenuNode[]): HTMLUListElement {
  const list = document.createElement("ul");
  list.className = "nst-vh-list";

  for (const node of nodes) {
    const item = document.createElement("li");
    item.className = "nst-vh-item";

    const label = document.createElement(node.href ? "a" : "span");
    label.className = "nst-vh-label";
    label.textContent = node.label ?? "(untitled)";
    if (node.href && label instanceof HTMLAnchorElement) {
      label.href = node.href;
    }
    item.appendChild(label);

    if (node.type === "container" && node.children.length > 0) {
      const submenu = buildMenuList(node.children);
      submenu.classList.add("nst-vh-submenu");
      item.appendChild(submenu);
    }

    list.appendChild(item);
  }

  return list;
}

// nav.shortcuts/nav.create each already contain a container node labeled
// "Shortcuts"/"Create" (the section itself, with its real links as
// children) — use its children directly instead of wrapping it again under
// a second synthetic group with the same label, which just double-nests.
function flattenSectionChildren(sections: MenuNode[]): MenuNode[] {
  return sections.flatMap((section) => (section.type === "container" ? section.children : [section]));
}

// The three stored fields become the top-level hover groups. Order here is
// the visual stacking order (top of stack first, closest to the button
// last) — Shortcuts, Menu, Create matches what was asked for.
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

// Class toggled on <html> for as long as our wrapper is hovered — see the
// matching CSS rule that only suppresses NetSuite's tooltip content while
// this is present, instead of hiding that (shared) popup class everywhere.
const TOOLTIP_SUPPRESS_CLASS = "nst-suppress-tooltip";

// Wraps the existing nav button in a positioned container so the flyout has
// something reliable to anchor to, without touching the button's own
// styling or its native click behavior.
function wrapButton(button: HTMLElement): HTMLDivElement {
  // If NetSuite's hover tooltip here were driven by the `title` attribute,
  // clearing it would be enough — it isn't (confirmed: it's a JET popup
  // triggered by its own listener), so this alone doesn't stop it, but
  // it's harmless to still clear in case some other tooltip path reads it.
  button.removeAttribute("title");

  const wrapper = document.createElement("div");
  wrapper.className = "nst-vh-root";
  button.parentElement?.insertBefore(wrapper, button);
  wrapper.appendChild(button);

  // The tooltip renders via a shared JET popup primitive
  // (.ns-ui-toolkit-popup-core__content), not something we can suppress by
  // attribute — and that class is likely reused by other legitimate
  // popups elsewhere in NetSuite Next. So only hide it while the mouse is
  // actually over our wrapper (i.e. exactly when it'd collide with our own
  // flyout), rather than suppressing it globally.
  wrapper.addEventListener("mouseenter", () => {
    document.documentElement.classList.add(TOOLTIP_SUPPRESS_CLASS);
  });
  wrapper.addEventListener("mouseleave", () => {
    document.documentElement.classList.remove(TOOLTIP_SUPPRESS_CLASS);
  });

  return wrapper;
}

export async function runNavVerticalHover(): Promise<void> {
  const stored = await chrome.storage.local.get(NAV_MENU_STORAGE_KEY);
  const navMenu = stored[NAV_MENU_STORAGE_KEY] as NavExtraction | undefined;

  if (!navMenu) {
    console.warn(
      '[NST] nav-vertical-hover: no stored nav menu found — run "Create Menu Nav" from the popup first',
    );
    return;
  }

  const button = (await waitForElement(NAV_MENU_BUTTON_SELECTOR, { timeout: 10000 })) as HTMLElement;
  const wrapper = wrapButton(button);

  const topLevelMenu = buildMenuList(buildTopLevelGroups(navMenu));
  topLevelMenu.classList.add("nst-vh-toplevel");
  wrapper.appendChild(topLevelMenu);
}
