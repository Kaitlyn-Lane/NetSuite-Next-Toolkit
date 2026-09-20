import "./styles.css";

import { computePosition, flip, offset, shift } from "@floating-ui/dom";

import { NAV_MENU_BUTTON_SELECTOR } from "@/core/selectors";
import { waitForElement } from "@/core/utils";
import type { MenuContainerNode, MenuNode, NavExtraction } from "@/features/nav/build-menu/extractor";

const NAV_MENU_STORAGE_KEY = "navMenu";
const HIDE_DELAY_MS = 150;

// Class toggled on <html> for as long as our wrapper is hovered — see the
// matching CSS rule that only suppresses NetSuite's tooltip content while
// this is present, instead of hiding that (shared) popup class everywhere.
const TOOLTIP_SUPPRESS_CLASS = "nst-suppress-tooltip";

// Recursive: builds one <ul> per level, nested inside its trigger <li>.
// Positioning is handled separately by activateFlyouts()/wireLevel() via
// Floating UI (position: fixed against the viewport), not by this nesting.
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

// Recursively wires up show/hide + Floating UI positioning, level by
// level, parent before children. Submenus stay nested inside their
// trigger <li> — position: fixed places them against the viewport
// regardless of DOM nesting, so no document.body portaling is needed.
//
// Two separate rules govern closing:
//  - Switching siblings (e.g. Shortcuts -> Menu) closes the old sibling's
//    whole subtree immediately, no delay.
//  - Leaving the tree entirely closes everything after a grace period —
//    one shared timer threaded through every level (not a per-level
//    timer), so hovering *anywhere* in the tree keeps the whole thing
//    alive, and the grace period only elapses once nothing anywhere is
//    being hovered. See scheduleGlobalHide in activateFlyouts for why
//    that timer double-checks cursor position before actually closing.
function wireLevel(
  trigger: HTMLElement,
  flyout: HTMLUListElement,
  placement: "top-start" | "right-start",
  cancelGlobalHide: () => void,
  scheduleGlobalHide: () => void,
): void {
  async function updatePosition(): Promise<void> {
    const { x, y } = await computePosition(trigger, flyout, {
      strategy: "fixed",
      placement,
      // offset: small gap from the trigger. flip: swap to the opposite
      // side if there's no room. shift: nudge within the viewport if it
      // still doesn't fully fit — this is what actually fixes the
      // "long menu overflows the page" problem, regardless of menu size
      // or where the trigger sits on screen.
      middleware: [offset(4), flip(), shift({ padding: 8 })],
    });
    flyout.style.left = `${x}px`;
    flyout.style.top = `${y}px`;
  }

  trigger.addEventListener("mouseenter", () => {
    cancelGlobalHide();
    flyout.style.display = "block";
    void updatePosition();
  });
  trigger.addEventListener("mouseleave", scheduleGlobalHide);
  flyout.addEventListener("mouseenter", cancelGlobalHide);
  flyout.addEventListener("mouseleave", scheduleGlobalHide);

  const childEntries: { trigger: HTMLElement; submenu: HTMLUListElement }[] = [];
  for (const li of Array.from(flyout.children)) {
    const submenu = li.querySelector<HTMLUListElement>(":scope > .nst-vh-submenu");
    if (submenu) {
      childEntries.push({ trigger: li as HTMLElement, submenu });
    }
  }

  for (const { trigger: childTrigger, submenu: childSubmenu } of childEntries) {
    childTrigger.addEventListener("mouseenter", () => {
      for (const sibling of childEntries) {
        if (sibling.submenu === childSubmenu) continue;
        sibling.submenu.style.display = "none";
        for (const nested of sibling.submenu.querySelectorAll<HTMLElement>(".nst-vh-submenu")) {
          nested.style.display = "none";
        }
      }
    });
    wireLevel(childTrigger, childSubmenu, "right-start", cancelGlobalHide, scheduleGlobalHide);
  }
}

function activateFlyouts(wrapper: HTMLElement, topLevel: HTMLUListElement): void {
  wrapper.appendChild(topLevel);

  // Tracked so the close timer can double-check the cursor's actual
  // position before trusting a mouseleave — see scheduleGlobalHide below.
  // mousemove stops firing once the cursor leaves the document entirely
  // (up into the browser's own chrome, or off-window), which would
  // otherwise freeze lastMouseX/Y at a stale in-page position — track
  // that separately so a real leave isn't mistaken for "still hovering"
  // using coordinates that no longer mean anything.
  let lastMouseX = 0;
  let lastMouseY = 0;
  let cursorInDocument = true;
  document.addEventListener(
    "mousemove",
    (event) => {
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      cursorInDocument = true;
    },
    { passive: true },
  );
  document.documentElement.addEventListener(
    "mouseleave",
    () => {
      cursorInDocument = false;
    },
    { passive: true },
  );

  let globalHideTimer: ReturnType<typeof setTimeout> | undefined;

  function cancelGlobalHide(): void {
    clearTimeout(globalHideTimer);
  }

  function scheduleGlobalHide(): void {
    clearTimeout(globalHideTimer);
    console.debug("[NST debug] scheduleGlobalHide armed");
    globalHideTimer = setTimeout(() => {
      // A mouseleave fired, but that can happen even while the cursor is
      // still visually on our UI — e.g. a newly-opened deeper flyout
      // rendering adjacent to (or slightly overlapping) its own trigger,
      // or a flyout nudged by `shift()` right up against another one's
      // edge. Rather than chase every individual boundary case, verify
      // against where the cursor actually is before trusting the leave —
      // unless it's left the document entirely, in which case there's
      // nothing on-page to check against and it's an unambiguous leave.
      const atCursor = cursorInDocument ? document.elementsFromPoint(lastMouseX, lastMouseY) : [];
      const matched = atCursor.find((el) => el.closest(".nst-vh-root, .nst-vh-list") !== null);
      console.debug("[NST debug] hide check", {
        cursorInDocument,
        lastMouseX,
        lastMouseY,
        matchedRect: matched?.closest(".nst-vh-root, .nst-vh-list")?.getBoundingClientRect(),
        topLevelRect: topLevel.getBoundingClientRect(),
        atCursor: atCursor.map((el) => `${el.tagName}.${el.className}`),
        matched: matched ? `${matched.tagName}.${matched.className}` : null,
      });

      if (matched) {
        return;
      }

      console.debug("[NST debug] CLOSING EVERYTHING");
      topLevel.style.display = "none";
      for (const el of topLevel.querySelectorAll<HTMLElement>(".nst-vh-submenu")) {
        el.style.display = "none";
      }
    }, HIDE_DELAY_MS);
  }

  wireLevel(wrapper, topLevel, "top-start", cancelGlobalHide, scheduleGlobalHide);
}

// Wraps the existing nav button in a positioned container purely so we
// have a stable trigger element to attach hover listeners to — it doesn't
// need to be a positioning context anymore now that flyouts are
// viewport-positioned via Floating UI.
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

  activateFlyouts(wrapper, topLevelMenu);
}
