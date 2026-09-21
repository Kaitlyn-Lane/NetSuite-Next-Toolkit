// Generic support for deep-linking into a collapsible <details> section on
// a page via a URL query param, e.g. options.html?section=customize-nav
// opens with the <details id="customize-nav"> already expanded and
// scrolled into view. Not tied to any one section — any id works, and any
// page can call expandSectionFromUrl() once its sections exist in the DOM.
const SECTION_PARAM = "section";

export function withSectionParam(url: string, sectionId: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set(SECTION_PARAM, sectionId);
  return parsed.toString();
}

export function expandSectionFromUrl(): void {
  const sectionId = new URLSearchParams(window.location.search).get(SECTION_PARAM);
  if (!sectionId) return;

  const target = document.getElementById(sectionId);
  if (!(target instanceof HTMLDetailsElement)) return;

  target.open = true;
  target.scrollIntoView({ behavior: "smooth", block: "start" });

  // <details> isn't focusable by default — make it a one-off focus target
  // so keyboard/screen-reader users land here too, not just visually.
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}
