import { createRoot } from "react-dom/client";

import { RecordBrowser } from "./RecordBrowser";
import "./styles.css";

// Mounts the Record Browser (load button, filter box, tree) into the
// popup's Actions section. Popup only — "the current record" means the
// active NetSuite tab, which the options page (a tab of its own) doesn't
// have; there the feature is just its enable toggle.
export function mountRecordBrowserAction(container: HTMLElement): void {
  createRoot(container).render(<RecordBrowser />);
}
