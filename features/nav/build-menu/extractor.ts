// Ported from a plain-JS script that was hand-validated by pasting into the
// DevTools console on a real NetSuite page with the nav bar visible. The
// selectors and extraction logic here must stay the same

import type { MenuContainerNode, MenuLeafNode, MenuNode, NavExtraction } from "@/features/nav/types";

function extractShortcutAndCreateSections(): MenuContainerNode[] {
  const sections = document.querySelectorAll(
    'div.ns-ui-ask-oracle-product-map-group > oj-c-collapsible.oj-complete'
  );

  return Array.from(sections).map((section) => {
    const label = section
      .querySelector('div.ns-ui-ask-oracle-product-map-group-heading span')
      ?.textContent
      ?.trim();

    const children: MenuLeafNode[] = Array.from(
      section.querySelectorAll('a[data-automation-type]')
    ).map((a) => ({
      type: 'leaf',
      label: a.querySelector('span')?.textContent?.trim(),
      automationType: a.getAttribute('data-automation-type'),
      href: a.getAttribute('href'),
    }));

    return { type: 'container', label, automationType: null, href: null, children };
  });
}

// The "Shortcuts" and "Create" sections come from a single DOM query and are
// only distinguishable by their heading text, so bucket each extracted
// section into the matching output field based on that text. A section
// whose heading matches neither is dropped (with a warning) rather than
// silently merged into one of the two, since we can't tell where it belongs.
function splitShortcutsAndCreate(sections: MenuContainerNode[]): {
  shortcuts: MenuNode[];
  create: MenuNode[];
} {
  const shortcuts: MenuNode[] = [];
  const create: MenuNode[] = [];

  for (const section of sections) {
    const title = section.label?.trim().toLowerCase();
    if (title === 'shortcuts') {
      shortcuts.push(section);
    } else if (title === 'create') {
      create.push(section);
    } else {
      console.warn(`extractNav: unrecognized shortcuts/create section title: ${section.label}`);
    }
  }

  return { shortcuts, create };
}

export function extractMenuNode(el: Element): MenuNode {
  const headerSlot = el.querySelector('span[slot="header"]');

  if (headerSlot) {
    const label = headerSlot.querySelector('div > span')?.textContent?.trim();
    const headerLink =
      headerSlot.querySelector('a[data-automation-type]') ??
      headerSlot.closest('a[data-automation-type]');
    const contentDiv = el.querySelector('div:has(> .ns-ui-flex-container__item)');
    let children: MenuNode[] = contentDiv
      ? Array.from(contentDiv.querySelectorAll(':scope > .ns-ui-flex-container__item')).map(extractMenuNode)
      : [];

    // NetSuite sometimes wraps a single child in a redundant layout div
    // (seen with class `ns-ui-flex-container__item--grow`) that repeats
    // this same header — unwrap it instead of nesting a duplicate level.
    const onlyChild = children.length === 1 ? children[0] : undefined;
    if (onlyChild && onlyChild.type === 'container' && onlyChild.label === label) {
      children = onlyChild.children;
    }

    return {
      type: 'container',
      label,
      automationType: headerLink?.getAttribute('data-automation-type') ?? null,
      href: headerLink?.getAttribute('href') ?? null,
      children,
    };
  }

  const link = el.querySelector('a[data-automation-type]');
  return {
    type: 'leaf',
    label: link?.textContent?.trim(),
    automationType: link?.getAttribute('data-automation-type') ?? null,
    href: link?.getAttribute('href') ?? null,
  };
}

export function extractMenu(): MenuNode[] {
  const menus = document.querySelectorAll('div[data-automation-id*="workarea-"]');
  return Array.from(menus).map(extractMenuNode);
}

// `sections` is 0 or more containers already labeled `label` (see
// splitShortcutsAndCreate) wrapping the section's real links — unwrap so
// this doesn't end up double-nested under a second container with the same
// label.
function buildTopLevelSection(label: string, sections: MenuNode[]): MenuContainerNode {
  return {
    type: 'container',
    label,
    automationType: null,
    href: null,
    children: sections.flatMap((section) => (section.type === 'container' ? section.children : [section])),
  };
}

// Order here is the visual stacking order vertical-hover renders these in
// (top of stack first, closest to the nav button last) — Shortcuts, Menu,
// Create.
export function extractNav(): NavExtraction {
  const { shortcuts, create } = splitShortcutsAndCreate(extractShortcutAndCreateSections());
  return [
    buildTopLevelSection('Shortcuts', shortcuts),
    { type: 'container', label: 'Menu', automationType: null, href: null, children: extractMenu() },
    buildTopLevelSection('Create', create),
  ];
}
