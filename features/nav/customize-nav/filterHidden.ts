import type { MenuNode } from "@/features/nav/build-menu/extractor";

// Applies hide flags already embedded in a scraped nav tree (see
// extractor.ts's MenuNode.hidden). A container that ends up with zero
// children after filtering is left in place rather than dropped — MenuItem
// already renders a childless container as a plain link using its own
// href, so that falls out of existing render behavior instead of needing
// special-casing here.
export function filterHiddenExtraction(nodes: MenuNode[]): MenuNode[] {
  const visible: MenuNode[] = [];

  for (const node of nodes) {
    if (node.hidden) {
      continue; // drops this node and, for a container, everything under it
    }

    if (node.type === "container") {
      visible.push({ ...node, children: filterHiddenExtraction(node.children) });
    } else {
      visible.push(node);
    }
  }

  return visible;
}
