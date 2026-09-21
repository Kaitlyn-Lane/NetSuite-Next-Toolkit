import { useState } from "react";
import { Switch } from "react-aria-components";

import type { MenuNode } from "@/features/nav/build-menu/extractor";

import { getNodeKey, type NavSection } from "./nodeKey";

interface NodeRowProps {
  section: NavSection;
  // Ancestors down to and including `node` — passed straight to getNodeKey,
  // so a saved hide flag is keyed on content, not position.
  path: MenuNode[];
  node: MenuNode;
  depth: number;
  // Whether some ancestor above this node (a section or a container) is
  // itself hidden. Purely a display concern: filterHiddenExtraction already
  // treats a hidden ancestor as hiding this whole subtree at read time, so
  // this only drives dimming + disabling the switch here — it must never be
  // written to storage as this node's own flag.
  ancestorHidden: boolean;
  hiddenKeys: Set<string>;
  onToggle: (key: string, hidden: boolean) => void;
}

export function NodeRow({ section, path, node, depth, ancestorHidden, hiddenKeys, onToggle }: NodeRowProps) {
  const key = getNodeKey(section, path);
  const isHidden = hiddenKeys.has(key);
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
          onChange={(selected) => onToggle(key, !selected)}
          aria-label={`Show "${label}" in nav`}
        >
          <span className="cn-switch-indicator" />
        </Switch>
        <span className="cn-row-label" title={node.href ?? undefined}>
          {label}
        </span>
      </div>
      {hasChildren && expanded && (
        <ul className="cn-tree-children" role="group">
          {children.map((child, i) => (
            <NodeRow
              key={i}
              section={section}
              path={[...path, child]}
              node={child}
              depth={depth + 1}
              ancestorHidden={effectivelyHidden}
              hiddenKeys={hiddenKeys}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
