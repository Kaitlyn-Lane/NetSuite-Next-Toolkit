import { withSectionParam } from "@/core/section-params";

import "./styles.css";

// The id of the <details> section OptionsSection.tsx builds on the options
// page — shared between the two so the popup's link and the options page's
// section-to-expand always agree on the same string.
export const CUSTOMIZE_NAV_SECTION_ID = "customize-nav";

// A narrow popup has no room for the tree itself (arbitrary depth, per-row
// toggles) — this is just a link out to the options page's "Customize Nav"
// section, styled like the rest of the popup's card-based sections (see
// ./styles.css's .nav-tile rules — this is the popup's only importer of that
// file, since CustomizeNavTable never mounts there). Opens via
// chrome.tabs.create rather than chrome.runtime.openOptionsPage()
// specifically so it can carry the ?section= param that expands and
// focuses that section on arrival — openOptionsPage() has no way to pass a
// URL.
export function mountCustomizeNavTile(container: HTMLElement): void {
  container.innerHTML = `
    <button type="button" id="customize-nav-tile" class="nav-tile">
      <span class="nav-tile-text">
        <span class="nav-tile-title">Customize Nav</span>
        <span class="nav-tile-desc">Hide menu items and assign Alt+ shortcuts</span>
      </span>
      <span class="nav-tile-chevron" aria-hidden="true">›</span>
    </button>
  `;

  container.querySelector<HTMLButtonElement>("#customize-nav-tile")!.addEventListener("click", () => {
    const url = withSectionParam(chrome.runtime.getURL("options.html"), CUSTOMIZE_NAV_SECTION_ID);
    chrome.tabs.create({ url });
  });
}
