import { NETSUITE_MATCHES } from "@/core/matches";
import { safeInit } from "@/core/safe-init";
import { runKeybindingListener } from "@/features/nav/keybindings";

// Separate entrypoint from nav.content.ts specifically for allFrames: true.
// NetSuite Next's main content area lives inside an iframe (confirmed:
// shortcuts fired fine in the top-frame header, never in the content
// area) — a keydown listener registered only in the top frame, the
// default, simply never sees a keystroke while focus is inside that
// iframe, since it's an entirely separate document with its own event
// path. vertical-hover/build-menu don't have this problem (the nav button
// and nav panel both live in the top frame), so they stay in nav.content.ts
// without allFrames — see the comment there for why turning it on there
// too would cause its own problems.
export default defineContentScript({
  matches: NETSUITE_MATCHES,
  allFrames: true,
  main() {
    safeInit("nav-keybindings", runKeybindingListener);
  },
});
