# Record Browser: the current record as a searchable JSON tree

Opt-in: enable it under Feature Enablement → Developer Tools (popup or
options page), and a **Load Record** button appears in the popup's
Actions section. Clicking it opens the Record Browser in its own popup
window. It fetches the current record's XML view — the same
thing you'd get by appending `&xml=T` to a classic record URL — and shows
it as a collapsible, filterable tree:

```
{ recordType, id, bodyFields: { ... }, lineFields: { <sublist>: [ ...lines ] } }
```

## Credit

The fetch-the-XML-and-reshape-it approach (and the shape above) comes from
[michoelchaikin/netsuite-field-explorer](https://github.com/michoelchaikin/netsuite-field-explorer)
(MIT). `parse-record.ts` and `filter-record.ts` are TypeScript
reimplementations of its `formatRecord` and `filterRecord`; see
`THIRD_PARTY_NOTICES.md` at the repo root for the license.

## How it finds the URL

This is the one real difference from that extension. It fetches the tab's
own URL plus `&xml=T`, which works in classic NetSuite because the tab URL
*is* the record URL. In NetSuite Next it isn't: the shell's URL is
something else, and the classic record UI renders inside
`<iframe id="classicIframe">`. That iframe's `src` is the classic record
URL, already carrying `?id=`, so `fetch-record.ts` reads it, sets
`xml=T`, and fetches that. Reading an iframe's `src` never needs
cross-origin access (only reaching into its document would), so there's
no SuiteScript, no network sniffing, and no per-record-type URL mapping.

## Why it opens in its own window

Records routinely have hundreds of body fields, which is far more than a
300px popup can show usefully. So the popup's button only opens
`record-browser.html?tabId=<NetSuite tab>` (the `entrypoints/record-browser/`
page) via `chrome.windows.create({ type: "popup" })`. That gives a
960×800 window with no tab strip or address bar, which sits alongside
the NetSuite tab instead of replacing it on screen. That page asks the
NetSuite tab for the record itself. The popup can't do the fetch and
hand over the result, because opening a window takes focus, which closes
the popup and cuts off anything still awaiting in it. The page's **Reload Record** asks the same tab
again, so it picks up whatever record that tab is on by then. If that tab
has been closed, the page says so.

## Why the fetch runs in the content script

Neither the popup nor the Record Browser page can see inside the NetSuite
tab, not what's inside the page, so
something in the page has to read `#classicIframe` anyway. Doing the
fetch there too means it's a request from NetSuite's own origin, so the
session cookies go along with it under the default same-origin
credentials, without leaning on the extension's `host_permissions`. The
content script parses the XML (`DOMParser`) and sends the Record Browser
page the finished `RecordData` object over the `GET_RECORD` message
(`types/messages.ts`, the same request/response pattern as build-menu).

That lives in its own entrypoint, `entrypoints/developer-tools.content.ts`,
rather than `nav.content.ts`, since this isn't a nav feature. It's top
frame only for the same reason `nav.content.ts` is: with a listener in
every frame, an iframe with no `#classicIframe` could answer "no record"
before the top frame's real reply arrived.

## Feature flag

`recordBrowser` in `core/feature-flags.ts`, off by default. Unlike the
other flags it doesn't gate anything injected into NetSuite: it only
decides whether the popup's Actions section shows the Load Record button.
So toggling it takes effect immediately in the popup, with no tab
refresh. The content script's `GET_RECORD` listener stays registered
either way, but it does nothing until the Record Browser page sends that
message. The card is toggle-only, with no dropdown.

## Open questions (unverified — no live NetSuite access when written)

1. **Domain.** If `#classicIframe`'s `src` is on a different origin
   than the top frame (anything other than the same
   `<account>.app.netsuite.com`), the content-script `fetch` becomes
   cross-origin and CORS will block it. If that happens, move the fetch
   to the popup (extension pages bypass CORS for hosts in
   `host_permissions`) and add that domain to `wxt.config.ts`'s
   `host_permissions`.
2. **Frame nesting.** This assumes `#classicIframe` is in the top frame.
   If it's nested inside another iframe, `waitForElement` will time out
   with "No record found". The fix then is `allFrames: true` plus a guard
   so that only the frame that actually has `#classicIframe` answers
   (see the race described above).
3. **Timing.** `fetch-record.ts` waits up to 3s for `#classicIframe`
   (`core/utils.ts`'s `waitForElement`), on the assumption that it's
   normally already there by the time someone opens the popup. It also
   assumes the iframe's `src` changes when NetSuite Next navigates
   between records. If Next navigates the iframe some other way (for
   example its own `location`, leaving the attribute stale), this would
   fetch the previous record.

## Files

- `types/messages.ts`: the `GET_RECORD` request/response contract and
  the `RecordData` shape.
- `fetch-record.ts`: `getCurrentRecord()`. Finds `#classicIframe`, builds
  the `&xml=T` URL, fetches it, and parses the result. Runs in the content
  script.
- `parse-record.ts`: XML to `RecordData`. An x2js-style element-to-value
  conversion, then `formatRecord`. The attribution comment is at the top.
  One deliberate departure from the original is that a single-line
  sublist is still an array here (x2js collapses it to a bare object), so
  every `lineFields` entry has the same shape.
- `filter-record.ts`: the search filter. It keeps leaves whose key or
  value contains the term, plus the containers on the way to them.
- `open-record-browser.ts`: the popup side. `mountRecordBrowserAction`
  renders the Load Record button (vanilla, no React) into the popup's
  Actions section, and `openRecordBrowser()` opens the page in a popup
  window with the current tab's id as `?tabId=` (`SOURCE_TAB_PARAM`).
  `entrypoints/popup/main.ts` mounts the button the first time the flag
  is on and only shows or hides it after that.
- `RecordBrowser.tsx`: the page UI. It loads on mount and has the record
  type and id as a heading, a Reload button, a search box that stays
  visible while scrolling, a raw-XML link, and the tree.
- `mount.tsx`: `mountRecordBrowserPage(container, sourceTabId)`, called
  by `entrypoints/record-browser/main.ts` after it reads `?tabId=`.
- `styles.css`: `rb-*` styles for the page, on top of `core/theme.css`.

`index.ts` re-exports the public surface. The content script imports
`fetch-record.ts` and `types/messages.ts` directly, not the barrel, so it
doesn't pull in React or the tree library. The popup imports
`open-record-browser.ts` directly for the same reason.

## Tree library: react-json-view-lite

[react-json-view-lite](https://github.com/AnyRoad/react-json-view-lite)
(MIT): no runtime dependencies, a stable release with React 18/19 as its
peer, and built-in light and dark styles. `@uiw/react-json-view` has more
features (editing, copy buttons), but its current line is an alpha and
needs `@babel/runtime` as a peer. A read-only viewer doesn't need any of
that. Filtering is our own (`filter-record.ts`). On a search the tree is
remounted with every node expanded, since `JsonView` only reads
`shouldExpandNode` on mount.
