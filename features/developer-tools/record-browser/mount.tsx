import { createRoot } from "react-dom/client";

import { RecordBrowser } from "./RecordBrowser";
import "./styles.css";

// Mounts the Record Browser into its own extension page
// (entrypoints/record-browser/), opened in a new tab by the popup's Load
// Record button. A tab instead of the popup itself: records routinely
// have hundreds of fields, far more than a 300px popup can show usefully.
export function mountRecordBrowserPage(container: HTMLElement, sourceTabId: number): void {
  createRoot(container).render(<RecordBrowser sourceTabId={sourceTabId} />);
}
