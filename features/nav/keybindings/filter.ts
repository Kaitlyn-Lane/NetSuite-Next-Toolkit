import type { MenuNode } from "@/features/nav/types";

import type { KeyBindingMap } from "./types";

// Keeps a node from `nodes` only if it itself has a binding, or anything
// nested under it does — used by the Customize Nav tree's "show only
// keybound" toggle so a bound leaf's ancestor chain doesn't disappear
// along with everything unrelated. Builds the bound-href set once per
// call (a sibling list), not once per node, since it's the same handful
// of bindings checked against every node in that list.
export function filterToKeyBound(nodes: MenuNode[], keyBindingMap: KeyBindingMap): MenuNode[] {
  const boundHrefs = new Set(Object.values(keyBindingMap));

  function matches(node: MenuNode): boolean {
    if (node.href && boundHrefs.has(node.href)) {
      return true;
    }
    return node.type === "container" && node.children.some(matches);
  }

  return nodes.filter(matches);
}
