import type { MenuNode } from "@/features/nav/build-menu/extractor";

export type NavSection = "create" | "shortcuts" | "menu";

export const NAV_SECTIONS: readonly NavSection[] = ["create", "shortcuts", "menu"];

function escapeSignaturePart(value: string | null | undefined): string {
  return (value ?? "").replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

function nodeSignature(node: MenuNode): string {
  return [
    node.type,
    escapeSignaturePart(node.automationType),
    escapeSignaturePart(node.href),
    escapeSignaturePart(node.label),
  ].join("|");
}

// A hide flag for the whole top-level layer (Create/Shortcuts/Menu) — these
// three are synthetic groups assembled at render time, not nodes that exist
// in the stored NavExtraction, so they need their own key separate from
// getNodeKey.
export function getSectionKey(section: NavSection): string {
  return `section::${section}`;
}

// `path` is the chain of nodes from a section's top level down to and
// including the node itself. Keys are derived from node content
// (type/automationType/href/label), not array position, so a saved hide flag
// survives a re-scrape as long as the underlying NetSuite item is unchanged
// — sibling reordering won't invalidate it, but relabeling or moving the
// item will (NetSuite gives us no stable id to key on instead).
export function getNodeKey(section: NavSection, path: MenuNode[]): string {
  return [section, ...path.map(nodeSignature)].join("::");
}
