# Customize nav: hide flags + the UI that edits them

Lets the user hide any top-level layer (Create/Shortcuts/Menu), any child
container, or any child link. Hiding a container implies hiding everything
nested under it. Changes are read by `features/nav/vertical-hover` at render
time — they only take effect after the user refreshes the NetSuite tab,
there's no live-reload wiring here.

## Files

Low-level contract (content-derived keys + storage helpers — treat as a
fixed API, the pieces below don't reimplement any of this):

- `nodeKey.ts` — `NavSection`, `getSectionKey` (a whole top-level layer),
  `getNodeKey` (one node, keyed on `section` + the chain of ancestor nodes
  down to it, not array position, so reordering siblings doesn't invalidate
  a saved flag).
- `storage.ts` — `getHiddenKeys`/`setHiddenKeys`/`setNodeHidden` over
  `chrome.storage.local["navHiddenKeys"]`.
- `filterHidden.ts` — `filterHiddenExtraction`, applies the hidden-key set to
  a scraped `NavExtraction`. Used by `vertical-hover`, not by this UI.

UI (reads `navMenu` + the hidden-key set, renders the tree, writes back on
toggle):

- `CustomizeNavTable.tsx` — top-level component. Loads `navMenu` from
  `chrome.storage.local` and the hidden-key set, renders one `SectionRow`
  per top-level layer, and shows a message (no button of its own) if nothing
  has been scraped yet.
- `SectionRow.tsx` / `NodeRow.tsx` — one row per section / per node,
  recursing to arbitrary depth. Each row's own switch writes **only that
  node's own key** via `setNodeHidden` — never fans out to descendants.
  `filterHiddenExtraction` already treats a hidden ancestor as hiding its
  whole subtree at read time, so a cascading write would be redundant, would
  bloat storage, and would make it impossible to independently re-show a
  child later. The cascade is still shown visually though: `NodeRow` threads
  an `ancestorHidden` boolean down through the recursion, and dims +
  disables the switch on anything under a hidden ancestor, since toggling it
  individually would have no effect while the ancestor stays hidden.
- `CreateNavMenuButton.tsx` — the "Create Menu Nav" scrape trigger, pulled
  out of `entrypoints/popup/main.ts` into a shared component so both the
  popup and the options page can trigger a re-scrape without duplicating the
  `BUILD_NAV_MENU` messaging logic.

`index.ts` re-exports the above (including the fixed contract files) as this
feature's public surface.

## Data flow

`chrome.storage.local` (`navMenu`, `navHiddenKeys`) → `CustomizeNavTable`
loads both on mount → renders the tree, each row disabled/dimmed if some
ancestor's key is already in the hidden set → toggling a row updates local
state optimistically and calls `setNodeHidden(key, hidden)` → next time
`vertical-hover` runs (i.e. after a tab refresh), `filterHiddenExtraction`
reads the same `navHiddenKeys` and drops the matching nodes.

Not yet mounted anywhere — wiring `CreateNavMenuButton` and `CustomizeNavTable`
into `entrypoints/popup/` and a new `entrypoints/options/` is being handled
separately (a "make it pretty" branch owns the popup/options UI). This
feature only owns the hide-flag logic and the tree/table UI, exported as its
public surface via `index.ts`.
