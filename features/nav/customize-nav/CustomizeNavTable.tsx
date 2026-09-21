import { useCallback, useEffect, useState } from "react";
import { Button } from "react-aria-components";

import type { MenuNode, NavExtraction } from "@/features/nav/build-menu/extractor";

import { NodeRow } from "./NodeRow";
import { getNavMenu, setNavMenu } from "./storage";
import "./styles.css";

// `undefined` = still loading, `null` = loaded but nothing scraped yet.
type LoadState = NavExtraction | null | undefined;

export function CustomizeNavTable() {
  const [navMenu, setNavMenuState] = useState<LoadState>(undefined);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const reload = useCallback(async () => {
    setNavMenuState((await getNavMenu()) ?? null);
    setDirty(false);
    setSaveStatus("");
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Mutates the node in place (it's the same object living inside `navMenu`
  // — every row below was handed this exact reference through the
  // recursion, not a copy). Toggling only updates local state; the
  // chrome.storage.local write happens once, on Save, rather than on every
  // toggle, since each write persists the whole tree.
  const handleToggleNode = useCallback((node: MenuNode, hidden: boolean) => {
    node.hidden = hidden;
    setNavMenuState((prev) => (prev ? [...prev] : prev));
    setDirty(true);
    setSaveStatus("");
  }, []);

  const handleSave = useCallback(() => {
    if (!navMenu) return;
    setNavMenu(navMenu)
      .then(() => {
        setDirty(false);
        setSaveStatus("Saved — refresh the NetSuite tab to apply.");
      })
      .catch((error: unknown) => {
        console.error("[NST] customize-nav: failed to save nav menu", error);
        setSaveStatus("Failed to save — see the console for details.");
      });
  }, [navMenu]);

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
      <ul className="cn-tree" role="tree">
        {navMenu.map((node, i) => (
          <NodeRow key={i} node={node} depth={0} ancestorHidden={false} onToggle={handleToggleNode} />
        ))}
      </ul>
      <div className="cn-save-row">
        <Button type="button" isDisabled={!dirty} onPress={handleSave}>
          Save
        </Button>
        <p className="cn-status-message">
          {saveStatus || "Save, then refresh the NetSuite tab to apply changes."}
        </p>
      </div>
    </div>
  );
}
