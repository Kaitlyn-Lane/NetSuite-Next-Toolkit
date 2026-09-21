# Customize nav: hide flags + the UI that edits them

Lets the user hide any top-level layer (Create/Shortcuts/Menu), any child
container, or any child link. Hiding a container implies hiding everything
nested under it. Changes are read by `features/nav/vertical-hover` at render
time — they only take effect after the user saves and refreshes the
NetSuite tab, there's no live-reload wiring here.

## Storage design

`NavExtraction` (in `features/nav/build-menu/extractor.ts`) is just
`MenuNode[]` — the three top-level layers (Shortcuts, Menu, Create) are the
first three entries of that array, real `MenuContainerNode`s built by
`extractNav()`, not a separate named shape. That means hiding a top-level
layer uses the exact same `MenuNode.hidden` field as hiding anything else
in the tree — no parallel per-section flag, no second storage key, nothing
to reconcile. Toggling a node just flips its own `hidden` field and, on
Save, writes the whole tree back under the single
`chrome.storage.local["navMenu"]` key that `build-menu`/`vertical-hover`
already use.

**Known, accepted limitation**: re-running "Create Menu Nav" overwrites
`navMenu` wholesale with a fresh scrape, which has no `hidden` flags set —
so today, a rebuild silently clears all hidden preferences. Preserving them
across a rebuild (e.g. snapshotting the old tree, re-pairing hidden state
back onto the new one by matching content) was discussed and intentionally
left out of scope for now, not overlooked.

## Files

- `filterHidden.ts` — `filterHiddenExtraction(nodes)`, applies the embedded
  `hidden` flags to a scraped tree, dropping hidden nodes and everything
  nested under a hidden container. Used by `vertical-hover`, not by this UI.
- `storage.ts` — `getNavMenu`/`setNavMenu` over the shared `navMenu` key.
- `CustomizeNavTable.tsx` — top-level component. Loads `navMenu` on mount
  and renders one `NodeRow` per top-level entry — no special-casing for
  which three entries are "sections," they're rendered in whatever order
  the scraper produced them in. Shows a message (no button of its own) if
  nothing has been scraped yet. Toggling a node mutates it in place (every
  row was handed that exact node object by reference through the
  recursion, not a copy) and marks the tree dirty; a Save button persists
  the whole tree in one write, rather than writing on every toggle.
- `NodeRow.tsx` — one row per node, recursing to arbitrary depth starting
  at the top-level array itself (depth 0). Toggling a row never writes to
  its descendants — only its own node. The cascade is shown visually
  instead: `NodeRow` threads an `ancestorHidden` boolean down through the
  recursion, dimming + disabling the switch on anything under a hidden
  ancestor, since toggling it individually would have no effect while the
  ancestor stays hidden (`filterHiddenExtraction` drops the whole subtree
  regardless of a descendant's own flag). A depth-0 row (a top-level layer)
  gets a bold label to stay visually distinct from what's nested under it.
- `CreateNavMenuButton.tsx` — the "Create Menu Nav" scrape trigger, pulled
  out of `entrypoints/popup/main.ts` into a shared component so both the
  popup and the options page can trigger a re-scrape without duplicating the
  `BUILD_NAV_MENU` messaging logic.
- `PopupTile.ts` — `mountCustomizeNavTile(container)`, a small vanilla
  (non-React) card in the popup that just links to the options page's
  panel via `chrome.runtime.openOptionsPage()`. The popup is too narrow for
  the tree itself (arbitrary depth, a switch per row), so it doesn't try.
- `OptionsPanel.tsx` — `mountCustomizeNavPanel(container)`, mounts
  `CreateNavMenuButton` + `CustomizeNavTable` together into a React root,
  remounting the table after a successful re-scrape so it doesn't show
  stale tree state. This is the one place `entrypoints/options/main.ts`
  (otherwise plain vanilla TS) pulls in React — kept self-contained here so
  `main.ts` never needs JSX.

`index.ts` re-exports the above as this feature's public surface.

Visual styling (the tree rows, switch, save row) reuses the shared
`--nst-*` CSS variables and the `.switch`/`.switch-track`/`.btn` primitives
from `core/theme.css`, rather than hand-rolling separate colors — see that
file and `entrypoints/options/style.css`'s `.panel` for the surrounding
chrome this tree renders inside of.

## Data flow

`chrome.storage.local["navMenu"]` → `CustomizeNavTable` loads it on mount →
renders the tree, each row disabled/dimmed if some ancestor is already
hidden → toggling a row updates local state (marking it dirty) without
writing to storage → clicking Save persists the whole updated tree back to
the same key → next time `vertical-hover` runs (i.e. after a tab refresh),
`filterHiddenExtraction` reads that tree and drops the flagged
nodes/subtrees.

Mounted from `entrypoints/popup/main.ts` (`mountCustomizeNavTile`, just a
link out) and `entrypoints/options/main.ts` (`mountCustomizeNavPanel`, the
actual tree) — both entrypoints stay thin, importing only from this
feature's `index.ts`.
