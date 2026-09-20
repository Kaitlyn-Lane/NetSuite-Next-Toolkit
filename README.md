# NetSuite-Next-Toolkit
Chrome extension focused on adding/restoring capabilities to NetSuite Next.

## Features

### Build Menu Nav
Scrapes NetSuite Next's nav bar (Shortcuts, Menu, Create) into a JSON
representation of the whole menu tree, stored via `chrome.storage.local`.
Triggered from the extension popup ("Create Menu Nav" button): opens the
nav, expands every collapsed section, extracts the tree, then closes it
again. See `features/nav/build-menu/README.md` for the approach and
`features/nav/build-menu/extractor.ts` for the extraction logic.

**Known limitation:** does not support multiple NetSuite roles — the
extracted menu reflects whichever role is active when you run it. Switching
roles means re-running it to pick up that role's menu.

### Vertical Hover Nav
A proof-of-concept replacement nav: reads the stored menu JSON and renders
it as a recursive hover flyout anchored to the existing nav button, instead
of NetSuite's default menu. Functional — see
`features/nav/vertical-hover/README.md` for the interaction-library
history — but the styling right now is an ugly, unpolished recreation. It
works correctly, it's just not pretty yet.

## mockup-test/
A standalone, disposable playground for testing UI/interaction code in
isolation (outside NetSuite's page) before porting it into the real
extension — see `features/nav/vertical-hover/README.md` for why that
mattered. It's gitignored, not version controlled, and safe to delete and
recreate at any time.
