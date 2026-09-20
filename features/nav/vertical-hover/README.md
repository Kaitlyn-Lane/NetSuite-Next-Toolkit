# Why this ended up on react-aria-components (React), not hand-rolled

This feature went through several implementations before landing here. Worth
knowing why, so nobody re-litigates this from scratch later.

## Why the hand-rolled version didn't work out

The first working version was pure CSS `:hover` cascading — worked, until a
large real menu started running off the edge of the screen, since CSS can't
reposition dynamically. Fixing that meant computing position in JS
(`@floating-ui/dom`), which meant hand-rolling show/hide too, since Floating
UI only does positioning, nothing else.

From there it was a chain of increasingly careful hand-rolled hover-state
bugs, each fixed and each revealing the next:

- A deeper flyout opening could visually overlap its own trigger, causing a
  spurious `mouseleave` with the cursor never actually moving.
- Each level only knew about its own hover state, so leaving one flyout to
  reach a nested one (a separately positioned/portaled element, not a DOM
  descendant) looked identical to leaving the whole menu.
- Fixing that (a shared "is any descendant open" check) created the
  opposite bug — closing the deepest level didn't tell its ancestors to
  reconsider, so leaving the whole menu could leave stale levels open
  forever if the mouse stopped moving before another event fired.
- Switching to `@floating-ui/react`'s `safePolygon` (the industry-standard
  answer to exactly this problem, not something more custom) still hit
  random closes on fast movement through deep menus — traced to a genuine
  race: `safePolygon`'s "is a child open" check runs synchronously inside a
  raw `mousemove` listener, outside React/Preact's render cycle, so fast
  enough movement can outrun a child's just-triggered state commit.

That last one was confirmed **in complete isolation**, outside NetSuite
entirely, using the exact same component code
(`mockup-test/` — see the root of the repo, or its git history) — so this
wasn't environmental, and it wasn't a mistake in our wiring either
(verified by reading `@floating-ui/react`'s actual source, not just its
docs). It's an inherent characteristic of continuous polygon-tracking
hover-intent at real-world depth (our menu goes 4-5 levels deep). Every
fix was correct for the bug it targeted; the pattern itself has a ceiling.

**The throughline: we kept re-implementing hover-intent state machines that
a mature library already solves.** `react-aria-components`' `SubmenuTrigger`
takes a different approach — a plain delay before opening/closing, not
continuous geometric tracking — which sidesteps this whole class of race
by construction, not by being cleverer about the same mechanism.

## Why not Preact

Preact itself was never the problem — nothing here is a confirmed Preact
bug. The issue is narrower: the best-fit library for this exact interaction
(`react-aria-components`, built by Adobe's accessibility/interaction team)
is React-only, no framework-agnostic version exists. `preact/compat` can run
a lot of React libraries unmodified, but we'd already been burned once by an
unverified compatibility assumption (the original switch to
`@floating-ui/react` under Preact) and didn't want to stack a second one on
top of an already fragile problem. Real React removes that variable
entirely, at the cost of extension bundle size (React + ReactDOM +
react-aria-components add real weight vs. Preact's ~4KB) — a deliberate
trade of size for certainty, given how much time the previous uncertainty
had already cost.

## The hover-close concession

The original goal was fully hover-driven: open on hover, close on hover-off,
at every level. That held up fine for nested submenus (`SubmenuTrigger`'s
delay-based model handles it well) but not for the top-level trigger
(NetSuite's real nav button, external to our component tree). A reliable
hover-off-to-close there needs either continuous tracking (the same
mechanism that caused the reliability problems above) or accepting a
simpler model.

We chose simpler: the top level still **opens on hover**, but **closes via
react-aria's native dismiss behavior** (click outside, Escape) instead of
hover-off. This was an explicit, deliberate trade — not the purest
"everything is hover" design, but it means the menu never disappears out
from under you while you're using it, and closing behavior is fully
predictable rather than depending on cursor timing. If a future case
specifically needs hover-off-to-close at the top level too, that's a real
option to revisit, not something ruled out — just not worth the same
reliability risk we just spent this many iterations getting away from.
