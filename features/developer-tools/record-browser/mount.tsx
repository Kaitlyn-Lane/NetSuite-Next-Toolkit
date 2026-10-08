import { createRoot } from "react-dom/client";

import { RecordBrowser } from "./RecordBrowser";
import "./styles.css";

// Mounts the Record Browser into its own extension page
// (entrypoints/record-browser/), opened in its own popup window by the
// extension popup's Load Record button. A separate window instead of the
// extension popup itself: records routinely have hundreds of fields, far
// more than a 300px popup can show usefully.
export function mountRecordBrowserPage(container: HTMLElement, sourceTabId: number): void {
  createRoot(container).render(<RecordBrowser sourceTabId={sourceTabId} />);
}
