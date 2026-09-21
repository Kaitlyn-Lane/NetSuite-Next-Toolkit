import { useCallback, useEffect, useState } from "react";

import type { MenuNode, NavExtraction, NavSection } from "@/features/nav/build-menu/extractor";

import { SectionRow } from "./SectionRow";
import { getNavMenu, setNavMenu } from "./storage";
import "./styles.css";

const NAV_SECTIONS: readonly NavSection[] = ["create", "shortcuts", "menu"];

const SECTION_LABELS: Record<NavSection, string> = {
  menu: "Menu",
  shortcuts: "Shortcuts",
  create: "Create",
};

// `undefined` = still loading, `null` = loaded but nothing scraped yet.
type LoadState = NavExtraction | null | undefined;

export function CustomizeNavTable() {
  const [navMenu, setNavMenuState] = useState<LoadState>(undefined);

  const reload = useCallback(async () => {
    setNavMenuState((await getNavMenu()) ?? null);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Persists the whole updated NavExtraction under the single "navMenu" key
  // — hide flags live directly on it (see extractor.ts), so there's no
  // second store to keep in sync.
  const persist = useCallback((updated: NavExtraction) => {
    setNavMenuState(updated);
    setNavMenu(updated).catch((error: unknown) => {
      console.error("[NST] customize-nav: failed to save nav menu", error);
    });
  }, []);

  const handleToggleSection = useCallback(
    (section: NavSection, hidden: boolean) => {
      if (!navMenu) return;
      persist({
        ...navMenu,
        hiddenSections: { ...navMenu.hiddenSections, [section]: hidden },
      });
    },
    [navMenu, persist],
  );

  // Mutates the node in place (it's the same object living inside `navMenu`
  // — every row below was handed this exact reference through the
  // recursion, not a copy), then shallow-clones the top-level object so
  // React sees a new reference and re-renders.
  const handleToggleNode = useCallback(
    (node: MenuNode, hidden: boolean) => {
      if (!navMenu) return;
      node.hidden = hidden;
      persist({ ...navMenu });
    },
    [navMenu, persist],
  );

  if (navMenu === undefined) {
    return <p className="cn-status-message">Loading…</p>;
  }

  if (navMenu === null) {
    return (
      <p className="cn-status-message">
        No stored nav menu found — run &quot;Create Menu Nav&quot; first.
      </p>
    );
  }

  return (
    <div className="cn-customize-nav">
      <p className="cn-refresh-note">Changes take effect after you refresh the NetSuite tab.</p>
      <ul className="cn-tree" role="tree">
        {NAV_SECTIONS.map((section) => (
          <SectionRow
            key={section}
            section={section}
            label={SECTION_LABELS[section]}
            nodes={navMenu[section]}
            hidden={navMenu.hiddenSections?.[section] === true}
            onToggleSection={handleToggleSection}
            onToggleNode={handleToggleNode}
          />
        ))}
      </ul>
    </div>
  );
}
