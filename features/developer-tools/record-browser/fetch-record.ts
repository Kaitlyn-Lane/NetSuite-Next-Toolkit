import { waitForElement } from "@/core/utils";

import { parseRecordXml } from "./parse-record";
import type { RecordData } from "./types/messages";

// NetSuite Next renders the classic record UI inside this iframe; its src
// is the classic-NetSuite URL for the current record (already carrying
// ?id=...). Reading the src attribute never needs cross-origin access —
// only reaching into the iframe's document would — so this works from the
// top frame regardless of what origin the iframe's content is on.
const CLASSIC_IFRAME_SELECTOR = "iframe#classicIframe";

// Short — this only runs when the user clicks the popup button, by which
// point the record page has almost always finished rendering. The wait
// just covers clicking mid-navigation, not a slow initial load.
const CLASSIC_IFRAME_TIMEOUT_MS = 3000;

async function getClassicRecordUrl(): Promise<URL> {
  let iframe: HTMLIFrameElement;
  try {
    iframe = (await waitForElement(CLASSIC_IFRAME_SELECTOR, {
      timeout: CLASSIC_IFRAME_TIMEOUT_MS,
    })) as HTMLIFrameElement;
  } catch {
    throw new Error("No record found on this page (couldn't find NetSuite's classic record iframe).");
  }

  // .src (the property) resolves a relative src attribute against the
  // page's own URL, so this is always absolute.
  const url = new URL(iframe.src);
  if (!url.searchParams.get("id")) {
    throw new Error("This page isn't showing a saved record (no record id in its URL).");
  }

  url.searchParams.set("xml", "T");
  return url;
}

// Runs in the content script, not the popup: fetch() from here is a
// request from the NetSuite page's own origin, so the user's session
// cookies go along with it (default same-origin credentials) without the
// extension needing anything beyond its existing host_permissions — as
// long as the iframe's src is same-origin with the top frame (see this
// feature's README, "Open questions").
export async function getCurrentRecord(): Promise<{ record: RecordData; sourceUrl: string }> {
  const url = await getClassicRecordUrl();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NetSuite responded ${response.status} ${response.statusText}`);
  }

  const record = parseRecordXml(await response.text());
  return { record, sourceUrl: url.toString() };
}
