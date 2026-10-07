# Record Browser: the current record as a searchable JSON tree

Popup-triggered ("Load current record" inside the Record Browser card,
under Developer Tools). Fetches the current record's XML view — the same
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

## Why the fetch runs in the content script

The popup only knows the tab's URL, not what's inside the page, so
something in the page has to read `#classicIframe` anyway. Doing the
fetch there too means it's a request from NetSuite's own origin, so the
session cookies go along with it under the default same-origin
credentials, without leaning on the extension's `host_permissions`. The
content script parses the XML (`DOMParser`) and sends the popup the
finished `RecordData` object over the `GET_RECORD` message
(`types/messages.ts`, the same request/response pattern as build-menu).

That lives in its own entrypoint, `entrypoints/developer-tools.content.ts`,
rather than `nav.content.ts`, since this isn't a nav feature. It's top
frame only for the same reason `nav.content.ts` is: with a listener in
every frame, an iframe with no `#classicIframe` could answer "no record"
before the top frame's real reply got to the popup.

## Why no feature flag

Nothing here runs unless the user clicks, so there's nothing to gate (see
`core/feature-flags.ts`'s own comment). The card is dropdown-only, with no
toggle.

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
- `RecordBrowser.tsx`: the popup UI (load button, filter box, tree).
- `mount.tsx`: `mountRecordBrowserPopupBody` (the React tree) and
  `mountRecordBrowserOptionsNote` (plain HTML). The options page gets a
  how-to note instead of the browser because it's its own tab, with no
  "current record" to load. That's the inverse of Customize Nav, which
  links the popup out to options because the popup is too narrow for it.
- `styles.css`: `rb-*` styles on top of `core/theme.css`.

`index.ts` re-exports the public surface. The content script imports
`fetch-record.ts` and `types/messages.ts` directly, not the barrel, so it
doesn't pull in React or the tree library.

## Tree library: react-json-view-lite

[react-json-view-lite](https://github.com/AnyRoad/react-json-view-lite)
(MIT): no runtime dependencies, a stable release with React 18/19 as its
peer, and built-in light and dark styles. `@uiw/react-json-view` has more
features (editing, copy buttons), but its current line is an alpha and
needs `@babel/runtime` as a peer. A read-only viewer doesn't need any of
that. Filtering is our own (`filter-record.ts`). On a search the tree is
remounted with every node expanded, since `JsonView` only reads
`shouldExpandNode` on mount.
