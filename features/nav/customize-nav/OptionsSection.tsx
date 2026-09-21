import { createRoot } from "react-dom/client";

import { CUSTOMIZE_NAV_SECTION_ID } from "./PopupTile";
import { CustomizeNavTable } from "./CustomizeNavTable";

// Builds the whole collapsible "Customize Nav" <details> section (matching
// the popup's .collapsible pattern — see entrypoints/popup/main.ts's
// Appearance section) and mounts the tree inside it. Kept entirely here so
// entrypoints/options/main.ts only needs a placeholder container + this one
// call, and never needs JSX itself. Collapsed by default; the popup's tile
// links here with a `?section=customize-nav` param that
// core/section-params.ts's expandSectionFromUrl() uses to open + focus it.
export function mountCustomizeNavSection(container: HTMLElement): void {
  container.innerHTML = `
    <details id="${CUSTOMIZE_NAV_SECTION_ID}" class="collapsible panel">
      <summary class="section-label">Customize Nav</summary>
      <p class="panel-intro">
        Hide any top-level layer, container, or link from the vertical hover
        nav. Hiding a container hides everything nested under it.
      </p>
      <div id="customize-nav-tree"></div>
    </details>
  `;

  createRoot(container.querySelector<HTMLDivElement>("#customize-nav-tree")!).render(<CustomizeNavTable />);
}
