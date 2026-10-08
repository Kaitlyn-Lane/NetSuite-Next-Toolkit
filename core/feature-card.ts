// Shared markup/wiring for the popup's and options page's feature lists.
// Every control in either page is framed as a "feature" living inside a
// category (e.g. Navigation, Appearance) — a feature card declares at
// least one of a toggle (plain on/off) and/or a dropdown (a disclosure
// revealing whatever feature-specific content the caller mounts into
// #feature-body-<id> afterward — a React tree, more form fields,
// whatever; this module only owns the chrome around it, never the
// content itself). Different features source their on/off state from
// different places (core/feature-flags.ts, features/appearance/
// color-override/appearance-toggle.ts, ...) — this module never reads/writes storage
// itself, callers wire that through wireFeatureCardToggle's onChange.
export interface FeatureCardSpec {
  id: string;
  name: string;
  description: string;
  hasToggle: boolean;
  hasDropdown: boolean;
  toggleChecked?: boolean;
}

export function featureCardHTML(spec: FeatureCardSpec): string {
  const expandControl = spec.hasDropdown
    ? `<button type="button" class="feature-expand-btn" id="feature-expand-${spec.id}" aria-expanded="false" aria-controls="feature-body-${spec.id}" aria-label="Expand ${spec.name}">›</button>`
    : `<span class="feature-expand-spacer" aria-hidden="true"></span>`;

  const toggleControl = spec.hasToggle
    ? `
      <label class="switch">
        <input type="checkbox" id="feature-toggle-${spec.id}" ${spec.toggleChecked ? "checked" : ""} />
        <span class="switch-track"></span>
      </label>
    `
    : "";

  return `
    <div class="feature-card" id="feature-card-${spec.id}">
      <div class="feature-card-header">
        <div class="feature-card-heading">
          ${expandControl}
          <span class="flag-name">${spec.name}</span>
        </div>
        ${toggleControl}
      </div>
      <p class="flag-desc">${spec.description}</p>
      ${spec.hasDropdown ? `<div class="feature-card-body" id="feature-body-${spec.id}" hidden></div>` : ""}
    </div>
  `;
}

// Each category is its own collapsible section (collapsed by default, so
// the popup opens to a short list of category names rather than every
// card at once) rather than a plain labeled group — there's no outer
// "Features" heading wrapping all of them, each one stands as its own
// section on the page.
export function featureCategoryHTML(label: string, cardsHtml: string): string {
  return `
    <details class="feature-category">
      <summary class="feature-category-label">${label}</summary>
      <div class="feature-category-list">${cardsHtml}</div>
    </details>
  `;
}

// Generic across every dropdown-having card regardless of what ends up
// mounted inside its body.
export function wireFeatureCardExpand(id: string): void {
  const button = document.getElementById(`feature-expand-${id}`) as HTMLButtonElement | null;
  const body = document.getElementById(`feature-body-${id}`) as HTMLDivElement | null;
  if (!button || !body) return;

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.classList.toggle("expanded", !expanded);
    body.hidden = expanded;
  });
}

// Expands a card's dropdown programmatically (deep-linking via
// core/section-params.ts) without faking a click — same end state either
// way, since this sets the exact same attributes the click handler above
// does. Also opens the card's enclosing category — categories start
// collapsed, and an expanded card inside a closed one is still invisible.
export function expandFeatureCard(id: string): HTMLElement | null {
  const button = document.getElementById(`feature-expand-${id}`) as HTMLButtonElement | null;
  const body = document.getElementById(`feature-body-${id}`) as HTMLDivElement | null;
  if (!button || !body) return null;

  const category = body.closest<HTMLDetailsElement>("details.feature-category");
  if (category) category.open = true;

  button.setAttribute("aria-expanded", "true");
  button.classList.add("expanded");
  body.hidden = false;
  return body;
}

export function wireFeatureCardToggle(id: string, onChange: (checked: boolean) => void): void {
  const checkbox = document.getElementById(`feature-toggle-${id}`) as HTMLInputElement | null;
  if (!checkbox) return;
  checkbox.addEventListener("change", () => {
    onChange(checkbox.checked);
  });
}
