import type { MenuNode, NavExtraction } from "@/features/nav/build-menu/extractor";

import { getNodeKey, getSectionKey, type NavSection } from "./nodeKey";

function filterNodes(
  nodes: MenuNode[],
  section: NavSection,
  hiddenKeys: Set<string>,
  path: MenuNode[],
): MenuNode[] {
  const visible: MenuNode[] = [];

  for (const node of nodes) {
    const nodePath = [...path, node];
    if (hiddenKeys.has(getNodeKey(section, nodePath))) {
      continue; // drops this node and, for a container, everything under it
    }

    if (node.type === "container") {
      visible.push({ ...node, children: filterNodes(node.children, section, hiddenKeys, nodePath) });
    } else {
      visible.push(node);
    }
  }

  return visible;
}

// Applies saved hide flags to a scraped NavExtraction. A container that ends
// up with zero children after filtering is left in place rather than
// dropped — MenuItem already renders a childless container as a plain link
// using its own href, so this falls out of existing render behavior instead
// of needing special-casing here.
export function filterHiddenExtraction(extraction: NavExtraction, hiddenKeys: Set<string>): NavExtraction {
  const filterSection = (section: NavSection, nodes: MenuNode[]): MenuNode[] =>
    hiddenKeys.has(getSectionKey(section)) ? [] : filterNodes(nodes, section, hiddenKeys, []);

  return {
    menu: filterSection("menu", extraction.menu),
    shortcuts: filterSection("shortcuts", extraction.shortcuts),
    create: filterSection("create", extraction.create),
  };
}
