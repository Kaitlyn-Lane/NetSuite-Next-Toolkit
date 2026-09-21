// The nav menu tree's data model, shared by every nav sub-feature:
// build-menu produces it, vertical-hover renders it, customize-nav edits
// the `hidden` flags on it. Lives here rather than under any one of those
// so none of them owns a shape the others depend on.

export interface MenuContainerNode {
  type: "container";
  label: string | undefined;
  automationType: string | null;
  href: string | null;
  children: MenuNode[];
  // Set by features/nav/customize-nav, not by extraction — omitted (not
  // false) means visible. Hiding a container hides everything under it.
  hidden?: boolean;
}

export interface MenuLeafNode {
  type: "leaf";
  label: string | undefined;
  automationType: string | null;
  href: string | null;
  // Set by features/nav/customize-nav, not by extraction.
  hidden?: boolean;
}

export type MenuNode = MenuContainerNode | MenuLeafNode;

// The top-level layers (Shortcuts, Menu, Create) are just the first three
// entries of this array — each a MenuContainerNode like any other, built by
// build-menu's extractNav() — not a separate named shape. That means hiding
// one of them uses the exact same `MenuNode.hidden` field as hiding
// anything else, with no parallel per-section flag to keep in sync.
export type NavExtraction = MenuNode[];
