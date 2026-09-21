import { useState } from "react";
import { Switch } from "react-aria-components";

import type { MenuNode } from "@/features/nav/build-menu/extractor";

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
}

export function NodeRow({ node, depth, ancestorHidden, onToggle }: NodeRowProps) {
  const isHidden = node.hidden === true;
  const effectivelyHidden = ancestorHidden || isHidden;
  const children = node.type === "container" ? node.children : [];
  const hasChildren = children.length > 0;
  const [expanded, setExpanded] = useState(true);
  const label = node.label ?? "(untitled)";

  return (
    <li className="cn-row" role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        className={effectivelyHidden ? "cn-row-content cn-row-dimmed" : "cn-row-content"}
        style={{ paddingLeft: depth * 20 }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="cn-expand-btn"
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="cn-expand-spacer" aria-hidden="true" />
        )}
        <Switch
          isSelected={!isHidden}
          isDisabled={ancestorHidden}
          onChange={(selected) => onToggle(node, !selected)}
          aria-label={`Show "${label}" in nav`}
        >
          <span className="cn-switch-indicator" />
        </Switch>
        <span
          className={depth === 0 ? "cn-row-label cn-section-label" : "cn-row-label"}
          title={node.href ?? undefined}
        >
          {label}
        </span>
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
            />
          ))}
        </ul>
      )}
    </li>
  );
}
