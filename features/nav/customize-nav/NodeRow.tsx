import { useState, type MouseEvent } from "react";
import { Switch } from "react-aria-components";

import { KeyBindingSelect } from "@/features/nav/keybindings";
import type { KeyBinding, KeyBindingMap } from "@/features/nav/keybindings";
import type { MenuNode } from "@/features/nav/types";

interface NodeRowProps {
  node: MenuNode;
  depth: number;
  // Whether some ancestor container above this node is itself hidden.
  // Purely a display concern: filterHiddenExtraction already treats a
  // hidden ancestor as hiding this whole subtree at read time, so this
  // only drives dimming + disabling the switch here — it must never be
  // written as this node's own `hidden` flag.
  ancestorHidden: boolean;
  onToggle: (node: MenuNode, hidden: boolean) => void;
  keyBindingMap: KeyBindingMap;
  onAssignKeyBinding: (href: string, binding: KeyBinding | undefined) => void;
}

export function NodeRow({
  node,
  depth,
  ancestorHidden,
  onToggle,
  keyBindingMap,
  onAssignKeyBinding,
}: NodeRowProps) {
  const isHidden = node.hidden === true;
  const effectivelyHidden = ancestorHidden || isHidden;
  const children = node.type === "container" ? node.children : [];
  const hasChildren = children.length > 0;
  const [expanded, setExpanded] = useState(true);
  const label = node.label ?? "(untitled)";
  const href = node.href;

  // The binding, if any, currently pointing at this node's own href — a
  // plain scan over keyBindingMap (at most 10 entries), not a tree walk.
  const currentBinding = href
    ? (Object.keys(keyBindingMap) as KeyBinding[]).find((key) => keyBindingMap[key] === href)
    : undefined;

  // Lets a click anywhere on the row toggle it, not just the switch itself
  // — except clicks that land on the switch, the expand/collapse button, or
  // the keybinding select, which already handle themselves (the switch's
  // own onChange would otherwise double-fire alongside this).
  function handleRowClick(event: MouseEvent<HTMLDivElement>) {
    if (ancestorHidden) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(".switch") ||
      target.closest(".cn-expand-btn") ||
      target.closest(".cn-keybinding-select")
    ) {
      return;
    }
    onToggle(node, !isHidden);
  }

  const rowContentClassName = [
    "cn-row-content",
    effectivelyHidden && "cn-row-dimmed",
    ancestorHidden && "cn-row-locked",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className="cn-row" role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div className={rowContentClassName} style={{ paddingLeft: depth * 20 }} onClick={handleRowClick}>
        {hasChildren ? (
          <button
            type="button"
            className={expanded ? "cn-expand-btn expanded" : "cn-expand-btn"}
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            ›
          </button>
        ) : (
          <span className="cn-expand-spacer" aria-hidden="true" />
        )}
        <Switch
          className="switch"
          isSelected={!isHidden}
          isDisabled={ancestorHidden}
          onChange={(selected) => onToggle(node, !selected)}
          aria-label={`Show "${label}" in nav`}
        >
          <span className="switch-track" />
        </Switch>
        <span
          className={depth === 0 ? "cn-row-label cn-section-label" : "cn-row-label"}
          title={href ?? undefined}
        >
          {label}
        </span>
        {href && (
          <KeyBindingSelect currentBinding={currentBinding} onChange={(binding) => onAssignKeyBinding(href, binding)} />
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="cn-tree-children" role="group">
          {children.map((child, i) => (
            <NodeRow
              key={i}
              node={child}
              depth={depth + 1}
              ancestorHidden={effectivelyHidden}
              onToggle={onToggle}
              keyBindingMap={keyBindingMap}
              onAssignKeyBinding={onAssignKeyBinding}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
