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
//
// The description lives inside <summary>, not as a sibling after it — a
// native <details> hides everything after <summary> while collapsed, and
// the description should stay readable either way. .cn-section-intro (in
// styles.css) resets the uppercase/bold styling .section-label would
// otherwise apply to it.
//
// No .panel class here (just .collapsible) — the container this mounts
// into already lives inside the Features section's own .panel, so this
// shouldn't draw a second nested card around itself.
export function mountCustomizeNavSection(container: HTMLElement): void {
  container.innerHTML = `
    <details id="${CUSTOMIZE_NAV_SECTION_ID}" class="collapsible">
      <summary class="section-label">
        Customize Nav
        <span class="cn-section-intro">
          Hide any top-level layer, container, or link from the vertical
          hover nav. Hiding a container hides everything nested under it.
        </span>
      </summary>
      <div id="customize-nav-tree"></div>
    </details>
  `;

  createRoot(container.querySelector<HTMLDivElement>("#customize-nav-tree")!).render(<CustomizeNavTable />);
}
