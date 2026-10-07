import { withSectionParam } from "@/core/section-params";

import "./styles.css";

// The id of the feature card (core/feature-card.ts) OptionsSection.tsx's
// tree mounts into on the options page — shared between the two so the
// popup's link and the options page's card-to-expand always agree on the
// same string.
export const CUSTOMIZE_NAV_SECTION_ID = "customizeNav";

// A narrow popup has no room for the tree itself (arbitrary depth, per-row
// toggles) — this is the popup's version of the Customize Nav feature
// card's dropdown body: just a link out to the options page's tree,
// rather than the tree itself (see OptionsSection.tsx for that one).
// Opens via chrome.tabs.create rather than chrome.runtime.openOptionsPage()
// specifically so it can carry the ?section= param that expands and
// focuses that card on arrival — openOptionsPage() has no way to pass a
// URL.
export function mountCustomizeNavPopupBody(container: HTMLElement): void {
  container.innerHTML = `
    <p class="cn-popup-note">
      The tree needs more room than the popup has — open it on the full
      options page to hide items or assign shortcuts.
    </p>
    <button type="button" id="customize-nav-open-options" class="btn btn-link">
      Open Customize Nav →
    </button>
  `;

  container.querySelector<HTMLButtonElement>("#customize-nav-open-options")!.addEventListener("click", () => {
    const url = withSectionParam(chrome.runtime.getURL("options.html"), CUSTOMIZE_NAV_SECTION_ID);
    chrome.tabs.create({ url });
  });
}
