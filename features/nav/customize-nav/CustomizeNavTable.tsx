import { useCallback, useEffect, useState } from "react";
import { Button, Switch } from "react-aria-components";

import { clearBindingForHref, filterToKeyBound, getKeyBindingMap, setKeyBinding } from "@/features/nav/keybindings";
import type { KeyBinding, KeyBindingMap } from "@/features/nav/keybindings";
import { getNavMenu, setNavMenu } from "@/features/nav/storage";
import type { MenuNode, NavExtraction } from "@/features/nav/types";

import { NodeRow } from "./NodeRow";
import "./styles.css";

// `undefined` = still loading, `null` = loaded but nothing scraped yet.
type LoadState = NavExtraction | null | undefined;

// Rendered both above and below the tree — a long tree shouldn't force a
// scroll back to the bottom (or top) just to find the Save button.
function SaveRow({
  dirty,
  status,
  onSave,
  position,
}: {
  dirty: boolean;
  status: string;
  onSave: () => void;
  position: "top" | "bottom";
}) {
  return (
    <div className={`cn-save-row cn-save-row-${position}`}>
      <Button type="button" className="btn btn-primary" isDisabled={!dirty} onPress={onSave}>
        Save
      </Button>
      <p className="cn-status-message">
        {status || "Save, then refresh the NetSuite tab to apply changes."}
      </p>
    </div>
  );
}

export function CustomizeNavTable() {
  const [navMenu, setNavMenuState] = useState<LoadState>(undefined);
  const [keyBindingMap, setKeyBindingMapState] = useState<KeyBindingMap>({});
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showOnlyKeyBound, setShowOnlyKeyBound] = useState(false);

  const reload = useCallback(async () => {
    setNavMenuState((await getNavMenu()) ?? null);
    setKeyBindingMapState(await getKeyBindingMap());
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

  // Persists immediately, unlike hide flags — navKeyBindings is its own
  // tiny storage key (at most 10 entries), so there's no whole-tree write
  // to batch behind a Save button here. Re-reads the map after writing
  // rather than predicting the result locally, since assigning a binding
  // can also silently clear it from whichever other link held it (see
  // features/nav/keybindings/storage.ts's setKeyBinding).
  const handleAssignKeyBinding = useCallback((href: string, binding: KeyBinding | undefined) => {
    const persist = binding ? setKeyBinding(binding, href) : clearBindingForHref(href);
    persist
      .then(getKeyBindingMap)
      .then(setKeyBindingMapState)
      .catch((error: unknown) => {
        console.error("[NST] customize-nav: failed to save key binding", error);
      });
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
        No nav menu saved yet — see "Instructions" above to run "Create Menu Nav" from the popup on a
        NetSuite tab, then reload this page.
      </p>
    );
  }

  // Prunes branches that have neither a binding themselves nor a bound
  // descendant — an ancestor leading to a bound leaf stays visible so the
  // tree structure around it still makes sense.
  const visibleNodes = showOnlyKeyBound ? filterToKeyBound(navMenu, keyBindingMap) : navMenu;

  return (
    <div className="cn-customize-nav">
      <SaveRow dirty={dirty} status={saveStatus} onSave={handleSave} position="top" />
      <div className="cn-filter-row">
        <Switch className="switch" isSelected={showOnlyKeyBound} onChange={setShowOnlyKeyBound}>
          <span className="switch-track" />
        </Switch>
        <span className="cn-filter-label">Show only keybound entries</span>
      </div>
      <ul className="cn-tree" role="tree">
        {visibleNodes.map((node, i) => (
          <NodeRow
            key={i}
            node={node}
            depth={0}
            ancestorHidden={false}
            onToggle={handleToggleNode}
            keyBindingMap={keyBindingMap}
            onAssignKeyBinding={handleAssignKeyBinding}
            showOnlyKeyBound={showOnlyKeyBound}
          />
        ))}
      </ul>
      <SaveRow dirty={dirty} status={saveStatus} onSave={handleSave} position="bottom" />
    </div>
  );
}
