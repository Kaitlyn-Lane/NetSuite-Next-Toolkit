import { useState } from "react";
import { Switch } from "react-aria-components";

import type { MenuNode } from "@/features/nav/build-menu/extractor";

import { getSectionKey, type NavSection } from "./nodeKey";
import { NodeRow } from "./NodeRow";

interface SectionRowProps {
  section: NavSection;
  label: string;
  nodes: MenuNode[];
  hiddenKeys: Set<string>;
  onToggle: (key: string, hidden: boolean) => void;
}

// Create/Shortcuts/Menu are synthetic top-level layers (the three fields of
// NavExtraction), not real MenuNodes — they get their own key via
// getSectionKey rather than going through getNodeKey/path like everything
// nested under them.
export function SectionRow({ section, label, nodes, hiddenKeys, onToggle }: SectionRowProps) {
  const key = getSectionKey(section);
  const isHidden = hiddenKeys.has(key);
  const hasChildren = nodes.length > 0;
  const [expanded, setExpanded] = useState(true);

  return (
    <li className="cn-row" role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div className={isHidden ? "cn-row-content cn-row-dimmed" : "cn-row-content"}>
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
          onChange={(selected) => onToggle(key, !selected)}
          aria-label={`Show ${label} in nav`}
        >
          <span className="cn-switch-indicator" />
        </Switch>
        <span className="cn-row-label cn-section-label">{label}</span>
      </div>
      {hasChildren && expanded && (
        <ul className="cn-tree-children" role="group">
          {nodes.map((node, i) => (
            <NodeRow
              key={i}
              section={section}
              path={[node]}
              node={node}
              depth={1}
              ancestorHidden={isHidden}
              hiddenKeys={hiddenKeys}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
