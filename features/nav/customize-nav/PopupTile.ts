// A narrow popup has no room for the tree itself (arbitrary depth, per-row
// toggles) — this is just a link out to the options page's full "Customize
// Nav" panel, styled like the rest of the popup's card-based sections
// (see entrypoints/popup/style.css's .nav-tile rules).
export function mountCustomizeNavTile(container: HTMLElement): void {
  container.innerHTML = `
    <button type="button" id="customize-nav-tile" class="nav-tile">
      <span class="nav-tile-text">
        <span class="nav-tile-title">Customize Nav</span>
        <span class="nav-tile-desc">Hide menu items, sections, and links</span>
      </span>
      <span class="nav-tile-chevron" aria-hidden="true">›</span>
    </button>
  `;

  container.querySelector<HTMLButtonElement>("#customize-nav-tile")!.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}
