import { useState } from "react";
import { Switch } from "react-aria-components";

import type { MenuNode, NavSection } from "@/features/nav/build-menu/extractor";

import { NodeRow } from "./NodeRow";

interface SectionRowProps {
  section: NavSection;
  label: string;
  nodes: MenuNode[];
  hidden: boolean;
  onToggleSection: (section: NavSection, hidden: boolean) => void;
  onToggleNode: (node: MenuNode, hidden: boolean) => void;
}

// Create/Shortcuts/Menu are synthetic top-level layers (the three fields of
// NavExtraction), not real MenuNodes — their hide flag lives in
// NavExtraction.hiddenSections rather than on a node's own `hidden` field.
export function SectionRow({ section, label, nodes, hidden, onToggleSection, onToggleNode }: SectionRowProps) {
  const hasChildren = nodes.length > 0;
  const [expanded, setExpanded] = useState(true);

  return (
    <li className="cn-row" role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div className={hidden ? "cn-row-content cn-row-dimmed" : "cn-row-content"}>
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
          isSelected={!hidden}
          onChange={(selected) => onToggleSection(section, !selected)}
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
              node={node}
              depth={1}
              ancestorHidden={hidden}
              onToggle={onToggleNode}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
