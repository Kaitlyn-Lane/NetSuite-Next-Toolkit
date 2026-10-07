import { Menu, MenuItem as AriaMenuItem, Popover, SubmenuTrigger } from "react-aria-components";

import type { MenuNode } from "@/features/nav/types";

// Recursive: one item per node, rendering its own Popover<Menu> (and,
// inside that, more MenuItems) if it has children. react-aria-components'
// SubmenuTrigger owns the nested-menu interaction entirely — hover-intent,
// delay, tree-aware open/close coordination across arbitrary depth — none
// of that is hand-rolled here. See ../README.md for why.
//
// A container flagged `autoExpanded` (toggled in customize-nav, defaulted
// true for the top-level "Menu" section by build-menu's extractNav())
// skips the hover-flyout for itself — its children render inline, right
// after its own row in the same list, instead of needing a hover to
// reveal them. `indentLevel` marks every item under an auto-expanded
// parent (not the parent's own row) with the "nst-indented" class, kept
// alongside react-aria's own default className rather than replacing it
// (components here don't merge classNames automatically) — styles.css
// uses the class both to show the hierarchy that a separate flyout panel
// would otherwise have conveyed, and in a `.react-aria-Popover:has(.nst-
// indented)` check to widen the root popover past its fixed search-bar
// width once it contains inline content that might need more room. The
// actual indent amount is an inline `paddingLeft`, not a fixed class
// value, so it scales with `indentLevel` — nested auto-expand (a
// container under an already-indented one also set to autoExpanded)
// increments it each time it recurses through one, compounding the
// indent to arbitrary depth instead of capping at one level.
export function MenuItem({ node, indentLevel = 0 }: { node: MenuNode; indentLevel?: number }) {
  const children = node.type === "container" ? node.children : [];
  const hasChildren = children.length > 0;
  const itemProps =
    indentLevel > 0
      ? { className: "react-aria-MenuItem nst-indented", style: { paddingLeft: 16 + indentLevel * 12 } }
      : {};

  if (!hasChildren) {
    return (
      <AriaMenuItem href={node.href ?? undefined} {...itemProps}>
        {node.label ?? "(untitled)"}
      </AriaMenuItem>
    );
  }

  if (node.type === "container" && node.autoExpanded) {
    return (
      <>
        <AriaMenuItem href={node.href ?? undefined} {...itemProps}>
          {node.label ?? "(untitled)"}
        </AriaMenuItem>
        {children.map((child, i) => (
          <MenuItem key={i} node={child} indentLevel={indentLevel + 1} />
        ))}
      </>
    );
  }

  return (
    <SubmenuTrigger>
      <AriaMenuItem href={node.href ?? undefined} {...itemProps}>
        {node.label ?? "(untitled)"}
      </AriaMenuItem>
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
