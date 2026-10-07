import { createRoot } from "react-dom/client";

import { CustomizeNavTable } from "./CustomizeNavTable";

// Mounts the Customize Nav tree into the options page's feature card
// dropdown body (core/feature-card.ts owns the card chrome — name,
// description, and the expand/collapse disclosure — around this now;
// this only ever renders the tree itself).
export function mountCustomizeNavSection(container: HTMLElement): void {
  createRoot(container).render(<CustomizeNavTable />);
}
