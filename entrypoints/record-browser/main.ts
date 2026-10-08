import "@/core/theme.css";
import { mountRecordBrowserPage, SOURCE_TAB_PARAM } from "@/features/developer-tools/record-browser";

// Opened by the popup's Load Record button (features/developer-tools/
// record-browser/open-record-browser.ts) with ?tabId= pointing at the
// NetSuite tab to read from. Everything else — loading, search, the tree
// — lives in the feature folder; this just reads the param and mounts.
const app = document.querySelector<HTMLDivElement>("#app")!;
const sourceTabId = Number(new URLSearchParams(window.location.search).get(SOURCE_TAB_PARAM));

if (Number.isInteger(sourceTabId) && sourceTabId > 0) {
  mountRecordBrowserPage(app, sourceTabId);
} else {
  app.innerHTML = `<p class="rb-status">Open this from the extension popup's Load Record button on a NetSuite record.</p>`;
}
