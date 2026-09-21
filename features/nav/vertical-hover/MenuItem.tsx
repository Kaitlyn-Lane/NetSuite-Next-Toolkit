import { Menu, MenuItem as AriaMenuItem, Popover, SubmenuTrigger } from "react-aria-components";

import type { MenuNode } from "@/features/nav/build-menu/extractor";

// Recursive: one item per node, rendering its own Popover<Menu> (and,
// inside that, more MenuItems) if it has children. react-aria-components'
// SubmenuTrigger owns the nested-menu interaction entirely — hover-intent,
// delay, tree-aware open/close coordination across arbitrary depth — none
// of that is hand-rolled here. See ../README.md for why.
export function MenuItem({ node }: { node: MenuNode }) {
  const children = node.type === "container" ? node.children : [];
  const hasChildren = children.length > 0;

  if (!hasChildren) {
    return (
      <AriaMenuItem href={node.href ?? undefined}>{node.label ?? "(untitled)"}</AriaMenuItem>
    );
  }

  return (
    <SubmenuTrigger>
      <AriaMenuItem href={node.href ?? undefined}>{node.label ?? "(untitled)"}</AriaMenuItem>
      {/* Default offset (~8px) left a visible gap between nested layers —
          tightened here. Not visually verified against a live NetSuite
          page in this environment; adjust if it looks off. */}
      <Popover offset={2}>
        <Menu>
          {children.map((child, i) => (
            <MenuItem key={i} node={child} />
          ))}
        </Menu>
      </Popover>
    </SubmenuTrigger>
  );
}
