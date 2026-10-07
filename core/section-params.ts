import { expandFeatureCard } from "./feature-card";

// Generic support for deep-linking into one feature card's dropdown (see
// core/feature-card.ts) via a URL query param, e.g.
// options.html?section=customizeNav opens with that card's id="customizeNav"
// dropdown already expanded and scrolled into view. Not tied to any one
// card — any id works, and any page can call expandSectionFromUrl() once
// its cards exist in the DOM.
const SECTION_PARAM = "section";

export function withSectionParam(url: string, sectionId: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set(SECTION_PARAM, sectionId);
  return parsed.toString();
}

export function expandSectionFromUrl(): void {
  const sectionId = new URLSearchParams(window.location.search).get(SECTION_PARAM);
  if (!sectionId) return;

  const body = expandFeatureCard(sectionId);
  if (!body) return;

  body.scrollIntoView({ behavior: "smooth", block: "start" });

  // Not focusable by default — make it a one-off focus target so
  // keyboard/screen-reader users land here too, not just visually.
  body.setAttribute("tabindex", "-1");
  body.focus({ preventScroll: true });
}
