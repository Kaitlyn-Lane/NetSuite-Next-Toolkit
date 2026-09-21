# Customize nav: hide flags + the UI that edits them

Lets the user hide any top-level layer (Create/Shortcuts/Menu), any child
container, or any child link. Hiding a container implies hiding everything
nested under it. Changes are read by `features/nav/vertical-hover` at render
time — they only take effect after the user saves and refreshes the
NetSuite tab, there's no live-reload wiring here.

This tree is also where a link gets an Alt+0–9 keyboard shortcut — that's
a separate feature, `features/nav/keybindings`, whose `KeyBindingSelect`
this feature's `NodeRow` renders per row. See that feature's own README for
why it's a genuinely separate concern (its own storage key, its own
immediate-save behavior, no Save-button batching) rather than another field
alongside `hidden`.

## Storage design

`NavExtraction` (in `features/nav/types.ts`, shared by every nav
sub-feature — see that file, not owned by this one) is just `MenuNode[]` —
the three top-level layers (Shortcuts, Menu, Create) are the first three
entries of that array, real `MenuContainerNode`s built by `build-menu`'s
`extractNav()`, not a separate named shape. That means hiding a top-level
layer uses the exact same `MenuNode.hidden` field as hiding anything else
in the tree — no parallel per-section flag, no second storage key, nothing
to reconcile. Toggling a node just flips its own `hidden` field and, on
Save, writes the whole tree back via `features/nav/storage.ts`'s
`setNavMenu`, under the single `chrome.storage.local["navMenu"]` key that
`build-menu` and `vertical-hover` also read/write through that same module.

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
  (`getNavMenu`/`setNavMenu` themselves live in `features/nav/storage.ts`,
  not here — this feature just calls them.)
- `CustomizeNavTable.tsx` — top-level component. Loads `navMenu` on mount
  and renders one `NodeRow` per top-level entry — no special-casing for
  which three entries are "sections," they're rendered in whatever order
  the scraper produced them in. Shows a message (no button of its own) if
  nothing has been scraped yet. Toggling a node mutates it in place (every
  row was handed that exact node object by reference through the
  recursion, not a copy) and marks the tree dirty; a Save button persists
  the whole tree in one write, rather than writing on every toggle. A
  "show only keybound entries" switch above the tree filters it through
  `features/nav/keybindings`' `filterToKeyBound` — display-only (it never
  mutates `navMenu`), and threaded down through `NodeRow` so a container's
  own expand chevron and child count agree with what's actually rendered
  under it.
- `NodeRow.tsx` — one row per node, recursing to arbitrary depth starting
  at the top-level array itself (depth 0). Toggling a row never writes to
  its descendants — only its own node. The cascade is shown visually
  instead: `NodeRow` threads an `ancestorHidden` boolean down through the
  recursion, dimming + disabling the switch on anything under a hidden
  ancestor, since toggling it individually would have no effect while the
  ancestor stays hidden (`filterHiddenExtraction` drops the whole subtree
  regardless of a descendant's own flag). A depth-0 row (a top-level layer)
  gets a bold label to stay visually distinct from what's nested under it.
  Also renders `features/nav/keybindings`' `KeyBindingSelect` for any node
  with an `href` (there's nothing to bind otherwise), right-aligned; a
  click landing on it is excluded from the row's own click-to-toggle
  handler the same way clicks on the switch and the expand button are.
- `PopupTile.ts` — `mountCustomizeNavTile(container)`, a small vanilla
  (non-React) card in the popup that links to the options page's section.
  The popup is too narrow for the tree itself (arbitrary depth, a switch
  per row), so it doesn't try. Opens via `chrome.tabs.create` with a
  `?section=customize-nav` URL param (not `chrome.runtime.openOptionsPage()`,
  which has no way to pass one) — also exports `CUSTOMIZE_NAV_SECTION_ID`,
  the id shared with `OptionsSection.tsx` so the two always agree on the
  same string.
- `OptionsSection.tsx` — `mountCustomizeNavSection(container)`, builds the
  whole collapsible `<details id="customize-nav" class="collapsible
  cn-nested-section">` section (matching the popup's own `.collapsible`
  pattern) and mounts `CustomizeNavTable` inside it — nested inside the
  options page's Features panel (see `entrypoints/options/main.ts`), not
  its own top-level `.panel`, but `.cn-nested-section` (`styles.css`) gives
  it a `.feature-card`-style box of its own anyway, so it visually matches
  Vertical Hover Nav's own row in the toggle list above rather than reading
  as a different kind of UI. The description lives inside `<summary>` itself (`.cn-section-intro`
  in `styles.css` undoes the uppercase/bold `.section-label` styling it'd
  otherwise inherit there), not as a sibling after it, since a native
  `<details>` hides everything after `<summary>` while collapsed and the
  description should stay readable either way. Collapsed by default;
  `core/section-params.ts`'s `expandSectionFromUrl()` (called generically
  from `entrypoints/options/main.ts`, not specific to this section) opens
  and focuses it when arriving via the popup tile's URL param. This is the
  one place `entrypoints/options/main.ts` (otherwise plain vanilla TS)
  pulls in React — kept self-contained here so `main.ts` never needs JSX.
  There's no "Create Menu Nav" trigger on this page — the options page
  isn't a NetSuite tab, so that action would have nothing to scrape;
  `CustomizeNavTable`'s empty state instead points back at the
  "Instructions" panel above.

`index.ts` re-exports the above as this feature's public surface.

Visual styling (the tree rows, switch, save row) reuses the shared
`--nst-*` CSS variables and the `.switch`/`.switch-track`/`.btn`/
`.collapsible` primitives from `core/theme.css`, rather than hand-rolling
separate colors — see that file and `entrypoints/options/style.css`'s
`.panel` for the surrounding chrome this tree renders inside of. Note:
`react-aria-components`' `<Switch>` wraps its native input in its own
extra hidden `<span>`, so it and `.switch-track` aren't DOM siblings —
`core/theme.css`'s `.switch[data-selected]`/`[data-disabled]` rules (a
descendant selector against the data attributes RAC puts on the outer
`.switch` label) are what actually style it, not the `:checked ~` sibling
rules that work for a hand-built `<span class="switch"><input/>...`
elsewhere in the app.

## Data flow

`chrome.storage.local["navMenu"]` → `CustomizeNavTable` loads it on mount →
renders the tree, each row disabled/dimmed if some ancestor is already
hidden → toggling a row updates local state (marking it dirty) without
writing to storage → clicking Save persists the whole updated tree back to
the same key → next time `vertical-hover` runs (i.e. after a tab refresh),
`filterHiddenExtraction` reads that tree and drops the flagged
nodes/subtrees.

Mounted from `entrypoints/popup/main.ts` (`mountCustomizeNavTile`, just a
link out) and `entrypoints/options/main.ts` (`mountCustomizeNavSection`, the
actual tree) — both entrypoints stay thin, importing only from this
feature's `index.ts`. In both, it's nested inside the existing "Features"
section/panel rather than a separate top-level one — it's a detail of the
Vertical Hover Nav feature, not a feature of its own.
