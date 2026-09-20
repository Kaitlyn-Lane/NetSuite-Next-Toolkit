// The orchestrator

import { waitForElement } from "@/core/utils";
import { extractNav, type MenuNode, type NavExtraction } from "./extractor";

const MENU_BUTTON_SELECTOR = 'button[aria-label="Menu"][telemetryid="menu-bar-button-menu"]';
const CLOSE_BUTTON_SELECTOR = "a#ask-oracle-main_ao-close";
const NAV_PANEL_SELECTOR = 'div[slot="askOracleCustom"]';
const COLLAPSIBLE_SELECTOR = 'div[role="button"][aria-controls^="oj-collapsible-content"]';
const COLLAPSED_SELECTOR = `${COLLAPSIBLE_SELECTOR}[aria-expanded="false"]`;

const EXPAND_MAX_ITERATIONS = 20;
const EXPAND_SETTLE_DELAY_MS = 75;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMenuButton(): HTMLButtonElement {
  const button = document.querySelector<HTMLButtonElement>(MENU_BUTTON_SELECTOR);
  if (!button) {
    throw new Error(`Could not find nav menu button (selector: ${MENU_BUTTON_SELECTOR})`);
  }
  return button;
}

function getCloseButton(): HTMLElement {
  const button = document.querySelector<HTMLElement>(CLOSE_BUTTON_SELECTOR);
  if (!button) {
    throw new Error(`Could not find nav close button (selector: ${CLOSE_BUTTON_SELECTOR})`);
  }
  return button;
}

async function expandAllCollapsedContainers(root: Element): Promise<void> {
  for (let iteration = 0; iteration < EXPAND_MAX_ITERATIONS; iteration++) {
    const collapsed = root.querySelectorAll<HTMLElement>(COLLAPSED_SELECTOR);
    if (collapsed.length === 0) {
      return;
    }

    for (const el of Array.from(collapsed)) {
      el.click();
    }

    await sleep(EXPAND_SETTLE_DELAY_MS);
  }

  throw new Error(
    `Nav menu did not finish expanding after ${EXPAND_MAX_ITERATIONS} iterations (collapsed containers kept appearing)`
  );
}

function countMenuLeaves(nodes: MenuNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "leaf") {
      return total + 1;
    }
    return total + countMenuLeaves(node.children);
  }, 0);
}

function countNavLinks(result: NavExtraction): number {
  return countMenuLeaves([...result.menu, ...result.shortcuts, ...result.create]);
}

export async function buildNavMenu(): Promise<{ result: NavExtraction; count: number }> {
  const menuButton = getMenuButton();
  let opened = false;

  try {
    menuButton.click();
    opened = true;

    const navPanel = await waitForElement(NAV_PANEL_SELECTOR, { timeout: 5000 });
    await expandAllCollapsedContainers(navPanel);

    const result = extractNav();

    getCloseButton().click();
    opened = false;

    await chrome.storage.local.set({ navMenu: result });
    const count = countNavLinks(result);

    return { result, count };
  } finally {
    if (opened) {
      // Best-effort cleanup: never leave NetSuite's nav stuck open because
      // of a mid-sequence failure.
      try {
        getCloseButton().click();
      } catch {
        // Ignore — we're already unwinding from an earlier error.
      }
    }
  }
}
