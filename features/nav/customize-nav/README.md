# Customize nav: hide flags + the UI that edits them

Lets the user hide any top-level layer (Create/Shortcuts/Menu), any child
container, or any child link. Hiding a container implies hiding everything
nested under it. Changes are read by `features/nav/vertical-hover` at render
time — they only take effect after the user refreshes the NetSuite tab,
there's no live-reload wiring here.

## Storage design

Hide flags are embedded directly on the scraped tree itself — `MenuNode.hidden`
and `NavExtraction.hiddenSections` (both in `features/nav/build-menu/extractor.ts`)
— and persisted back under the same single `chrome.storage.local["navMenu"]`
key that `build-menu`/`vertical-hover` already read and write. There's
deliberately no second storage key or content-derived key scheme to keep in
sync with the tree: toggling a node just flips its own `hidden` field and
writes the whole `NavExtraction` back.

**Known, accepted limitation**: re-running "Create Menu Nav" overwrites
`navMenu` wholesale with a fresh scrape, which has no `hidden` flags set —
so today, a rebuild silently clears all hidden preferences. Preserving them
across a rebuild (e.g. snapshotting the old tree, re-pairing hidden state
back onto the new one by matching content) was discussed and intentionally
left out of scope for now, not overlooked.

## Files

- `filterHidden.ts` — `filterHiddenExtraction(extraction)`, applies the
  embedded hide flags to a scraped `NavExtraction`, dropping hidden nodes
  (and everything nested under a hidden container) and emptying any section
  whose `hiddenSections` flag is set. Used by `vertical-hover`, not by this
  UI.
- `storage.ts` — `getNavMenu`/`setNavMenu` over the shared `navMenu` key.
- `CustomizeNavTable.tsx` — top-level component. Loads `navMenu` on mount,
  renders one `SectionRow` per top-level layer, and shows a message (no
  button of its own) if nothing has been scraped yet. Owns the two toggle
  handlers: `handleToggleSection` (immutable — writes into
  `hiddenSections`) and `handleToggleNode` (mutates the target node's own
  `hidden` field in place — every row below was handed that exact node
  object by reference through the recursion, not a copy — then
  shallow-clones the top-level object so React re-renders and persists the
  whole tree).
- `SectionRow.tsx` / `NodeRow.tsx` — one row per section / per node,
  recursing to arbitrary depth. Neither writes to a descendant when
  toggled — only the row's own node/section. The cascade is shown visually
  instead: `NodeRow` threads an `ancestorHidden` boolean down through the
  recursion, dimming + disabling the switch on anything under a hidden
  ancestor, since toggling it individually would have no effect while the
  ancestor stays hidden (`filterHiddenExtraction` drops the whole subtree
  regardless of a descendant's own flag).
- `CreateNavMenuButton.tsx` — the "Create Menu Nav" scrape trigger, pulled
  out of `entrypoints/popup/main.ts` into a shared component so both the
  popup and the options page can trigger a re-scrape without duplicating the
  `BUILD_NAV_MENU` messaging logic.

`index.ts` re-exports the above as this feature's public surface.

## Data flow

`chrome.storage.local["navMenu"]` → `CustomizeNavTable` loads it on mount →
renders the tree, each row disabled/dimmed if some ancestor is already
hidden → toggling a row updates local state and persists the full,
updated `NavExtraction` back to the same key → next time `vertical-hover`
runs (i.e. after a tab refresh), `filterHiddenExtraction` reads the same
object and drops the flagged nodes/sections.

Not yet mounted anywhere — wiring `CreateNavMenuButton` and `CustomizeNavTable`
into `entrypoints/popup/` and a new `entrypoints/options/` is being handled
separately (a "make it pretty" branch owns the popup/options UI). This
feature only owns the hide-flag logic and the tree/table UI, exported as its
public surface via `index.ts`.
