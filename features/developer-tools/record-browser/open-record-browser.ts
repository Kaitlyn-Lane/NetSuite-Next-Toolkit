// The record-browser page's own URL param: the id of the NetSuite tab to
// load the record from. The page is a tab of its own, so it can't just
// ask for "the active tab" the way the popup can.
export const SOURCE_TAB_PARAM = "tabId";

// Opens the Record Browser page in a new tab next to the current one,
// pointed at the current tab. The popup only passes the tab id along
// rather than fetching the record itself: opening a tab takes focus,
// which closes the popup, so anything still awaiting in it would be cut
// off. The new page does the actual GET_RECORD round trip instead.
export async function openRecordBrowser(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) {
    throw new Error("Couldn't find the active tab.");
  }

  const url = new URL(chrome.runtime.getURL("/record-browser.html"));
  url.searchParams.set(SOURCE_TAB_PARAM, String(tab.id));
  await chrome.tabs.create({ url: url.toString(), index: tab.index + 1, openerTabId: tab.id });
}

// Popup's Actions-section body for this feature: just the button. Vanilla
// (no React) — the popup no longer renders the tree itself.
export function mountRecordBrowserAction(container: HTMLElement): void {
  container.innerHTML = `
    <button type="button" id="record-browser-open-btn" class="btn btn-primary">Load Record</button>
    <p id="record-browser-status" class="status"></p>
  `;

  const button = container.querySelector<HTMLButtonElement>("#record-browser-open-btn")!;
  const status = container.querySelector<HTMLParagraphElement>("#record-browser-status")!;
  button.addEventListener("click", () => {
    openRecordBrowser().catch((error: unknown) => {
      status.textContent = error instanceof Error ? error.message : String(error);
    });
  });
}
