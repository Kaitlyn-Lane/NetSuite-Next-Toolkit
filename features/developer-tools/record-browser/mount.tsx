import { createRoot } from "react-dom/client";

import { RecordBrowser } from "./RecordBrowser";
import "./styles.css";

// The id of this feature's card (core/feature-card.ts) on both the popup
// and the options page.
export const RECORD_BROWSER_SECTION_ID = "recordBrowser";

// Mounts the Record Browser into the popup's feature card dropdown body
// (core/feature-card.ts owns the card chrome around it). Popup only —
// "the current record" means the active NetSuite tab, which the options
// page (a tab of its own) doesn't have; mountRecordBrowserOptionsNote
// below is that page's version.
export function mountRecordBrowserPopupBody(container: HTMLElement): void {
  createRoot(container).render(<RecordBrowser />);
}

export function mountRecordBrowserOptionsNote(container: HTMLElement): void {
  container.innerHTML = `
    <p class="rb-note">
      Open a NetSuite record, then open this extension's popup and click
      <strong>Load current record</strong> under Record Browser. It loads
      the record's XML view (the same data as appending
      <code>&amp;xml=T</code> to a classic record URL) and shows it as a
      filterable tree: body fields, plus one list of lines per sublist.
    </p>
  `;
}
