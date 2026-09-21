# Nav keybindings: Alt+0–9 jump-to-link

Lets the user bind any nav link (anything with an `href`) to one of ten
fixed shortcuts — Alt+1 through Alt+9, Alt+0 — from a dropdown in the
Customize Nav tree. Pressing the shortcut on a NetSuite page navigates
straight there.

## Why a fixed Alt+0–9 set, not an arbitrary recorded keystroke

Recording an arbitrary key combo isn't the hard part (a "press any key"
capture field is a well-known pattern) — the real cost is everything that
comes after: guarding against binding something a browser/OS already
reserves, and making sure a shortcut doesn't fire while the user is typing
in a NetSuite form field. A fixed Alt+digit set sidesteps both: it's not
commonly reserved, and nobody produces "Alt+3" by typing normally, so
there's no need to check for focus in an input at all.

`event.code` (not `event.key`) is what `listen.ts` matches against —
`event.key` for Option+digit on macOS produces a different character
entirely depending on layout (e.g. Option+1 → "¡" in a US layout), while
`event.code` reports the physical key ("Digit1") regardless of modifiers or
layout. The listener also rejects the combo if `ctrlKey` is also set, since
browsers commonly report AltGr (used to type symbols on European layouts)
as Ctrl+Alt together — without that check, typing certain symbols could
misfire a shortcut.

The listener is registered on `window`, in the capture phase (the third
`addEventListener` argument), not the default bubble phase on `document`.
NetSuite's `oj-c-*` elements (see `features/nav/build-menu/extractor.ts`'s
selectors) are Oracle JET web components, which commonly manage their own
keyboard interaction internally and can call `stopPropagation()` on a
keydown before it would otherwise reach a normal bubble-phase listener —
the leading suspect for an early report of shortcuts silently doing
nothing (binding saved correctly, keypress reached nothing, no error).
Capture phase on `window` is the earliest point in the event's path, so we
see it regardless of what anything downstream does with it afterward. This
is safe for every other keystroke either way: we only ever call
`preventDefault()` (never `stopPropagation()`), and only once we've
actually matched a bound key, so nothing we don't care about is affected.

## Storage design

`chrome.storage.local["navKeyBindings"]` is its own key, entirely separate
from `navMenu` — a `Partial<Record<KeyBinding, string>>` mapping each
binding directly to the href it opens. This is deliberate: both operations
this feature actually needs — "what does Alt+3 open" (the keydown listener)
and "does this href already have a binding, and does this binding already
point somewhere else" (reassigning one from the tree UI) — are then a
lookup or a scan over a map with at most 10 entries, never a walk over the
(potentially much larger) nav tree the way hide flags in
`features/nav/customize-nav` are.

A link holds at most one binding, and a binding points at most one link:
`setKeyBinding(binding, href)` clears both directions before writing, so
assigning an already-used binding to a new link silently steals it from
whichever link had it — there's no "already used by" indicator in the UI,
since building one would mean looking up the label of whichever other node
holds a given binding, which (unlike the map operations above) would mean
walking the tree. Considered out of scope for the same reason a fixed
key set was: keep the common case cheap and simple.

## Files

- `types.ts` — `KEY_BINDINGS` (the fixed set), `KeyBinding`, `KeyBindingMap`.
- `storage.ts` — `getKeyBindingMap`/`setKeyBinding`/`clearBindingForHref`
  over the `navKeyBindings` key.
- `listen.ts` — `runKeybindingListener()`, registered unconditionally from
  `entrypoints/nav.content.ts` (`safeInit("nav-keybindings", ...)`, no
  `isFeatureEnabled(...)` check) — this is a detail of navigation
  customization, not a feature a user would toggle on its own, so unlike
  `vertical-hover` it has no entry in `core/feature-flags.ts` at all. It
  still lives in its own folder for organization, same as any other nav
  sub-feature.
- `KeyBindingSelect.tsx` — the per-row `<select>` in the Customize Nav
  tree (`features/nav/customize-nav/NodeRow.tsx`) for assigning a binding
  to that node's `href`. Rendered only for nodes that have one — there's
  nothing to jump to otherwise.
- `filter.ts` — `filterToKeyBound(nodes, keyBindingMap)`, used by
  `CustomizeNavTable`'s "show only keybound" toggle to keep a node visible
  if it (or anything nested under it) has a binding, dropping the rest.

Unlike hide flags (batched behind a Save button, since each save writes the
whole nav tree), a keybinding change is persisted immediately —
`navKeyBindings` is tiny, so there's no batching win to be had, and
matches how feature flags and theme colors already save on change
elsewhere in this app.
