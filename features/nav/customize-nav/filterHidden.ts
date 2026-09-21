import type { MenuNode, NavExtraction, NavSection } from "@/features/nav/build-menu/extractor";

function filterNodes(nodes: MenuNode[]): MenuNode[] {
  const visible: MenuNode[] = [];

  for (const node of nodes) {
    if (node.hidden) {
      continue; // drops this node and, for a container, everything under it
    }

    if (node.type === "container") {
      visible.push({ ...node, children: filterNodes(node.children) });
    } else {
      visible.push(node);
    }
  }

  return visible;
}

// Applies hide flags already embedded in a scraped NavExtraction (see
// extractor.ts). A container that ends up with zero children after
// filtering is left in place rather than dropped — MenuItem already renders
// a childless container as a plain link using its own href, so that falls
// out of existing render behavior instead of needing special-casing here.
export function filterHiddenExtraction(extraction: NavExtraction): NavExtraction {
  const isSectionHidden = (section: NavSection) => extraction.hiddenSections?.[section] === true;

  return {
    menu: isSectionHidden("menu") ? [] : filterNodes(extraction.menu),
    shortcuts: isSectionHidden("shortcuts") ? [] : filterNodes(extraction.shortcuts),
    create: isSectionHidden("create") ? [] : filterNodes(extraction.create),
  };
}
