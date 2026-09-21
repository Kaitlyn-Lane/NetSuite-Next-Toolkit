import { useCallback, useEffect, useState } from "react";

import type { NavExtraction } from "@/features/nav/build-menu/extractor";

import { NAV_SECTIONS } from "./nodeKey";
import { SectionRow } from "./SectionRow";
import { getHiddenKeys, setNodeHidden } from "./storage";
import "./styles.css";

// Duplicated literal — "navMenu" is already duplicated as a literal in both
// features/nav/build-menu/index.ts and features/nav/vertical-hover/index.tsx,
// so a third copy here follows the existing pattern rather than introducing
// a shared constant unprompted.
const NAV_MENU_STORAGE_KEY = "navMenu";

const SECTION_LABELS: Record<(typeof NAV_SECTIONS)[number], string> = {
  menu: "Menu",
  shortcuts: "Shortcuts",
  create: "Create",
};

// `undefined` = still loading, `null` = loaded but nothing scraped yet.
type LoadState = NavExtraction | null | undefined;

export function CustomizeNavTable() {
  const [navMenu, setNavMenu] = useState<LoadState>(undefined);
  const [hiddenKeys, setHiddenKeysState] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    const stored = await chrome.storage.local.get(NAV_MENU_STORAGE_KEY);
    const extraction = stored[NAV_MENU_STORAGE_KEY] as NavExtraction | undefined;
    setNavMenu(extraction ?? null);
    setHiddenKeysState(await getHiddenKeys());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Optimistic update, then persist. Per the storage contract, this writes
  // only the toggled node's own key — never fans out to descendants.
  // filterHiddenExtraction already treats a hidden ancestor as hiding its
  // whole subtree at read time, so descendant writes would be redundant and
  // would make it impossible to independently re-show a child later.
  const handleToggle = useCallback((key: string, hidden: boolean) => {
    setHiddenKeysState((prev) => {
      const next = new Set(prev);
      if (hidden) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

    setNodeHidden(key, hidden).catch((error: unknown) => {
      console.error("[NST] customize-nav: failed to save hide flag", error);
    });
  }, []);

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
            hiddenKeys={hiddenKeys}
            onToggle={handleToggle}
          />
        ))}
      </ul>
    </div>
  );
}
