import "@/core/theme.css";
import "./style.css";
import { FEATURE_FLAGS, getFeatureFlagState, setFeatureEnabled } from "@/core/feature-flags";
import { expandSectionFromUrl } from "@/core/section-params";
import { mountCustomizeNavSection } from "@/features/nav/customize-nav";
import { mountThemeColorPicker } from "@/features/theme/popup-color-picker";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="page">
    <header class="page-header">
      <h1>NetSuite Next Toolkit</h1>
      <p class="page-subtitle">Settings &amp; instructions</p>
    </header>

    <section class="panel">
      <h2 class="section-label">Instructions</h2>
      <ol class="steps">
        <li>Open a NetSuite page where the navigation bar is visible.</li>
        <li>
          Click <strong>Create Menu Nav</strong> in the extension popup. This
          scrapes the nav bar (Shortcuts, Menu, Create) for whichever role is
          currently active and saves it for the toolkit's features to use.
          You'll see the nav open and close briefly on its own while this
          runs — that's expected, it's how the scraper reads the menu.
        </li>
        <li>Refresh any NetSuite tabs you want the change to apply to.</li>
      </ol>
      <div class="callout">
        <strong>Known limitation:</strong> the scrape only reflects the role
        that was active when you ran it. If you switch NetSuite roles, run it
        again to pick up that role's menu.
      </div>
    </section>

    <section class="panel">
      <h2 class="section-label">Features</h2>
      <p class="panel-intro">
        Toggle which features run automatically on NetSuite pages. A toggle
        change only applies to tabs opened or refreshed after you change it.
      </p>
      <div id="feature-list" class="feature-list"></div>
      <div id="customize-nav-section"></div>
    </section>

    <section class="panel">
      <h2 class="section-label">Appearance</h2>
      <p class="panel-intro">
        Customize the colors used by the vertical hover nav (text,
        background, and the hover/active accent) — also available from the
        popup.
      </p>
      <div id="theme-colors" class="theme-colors"></div>
      <div class="callout">
        Color changes only apply to NetSuite tabs opened or refreshed after
        you change them — same as feature toggles above.
      </div>
    </section>
  </div>
`;

const featureList = document.querySelector<HTMLDivElement>("#feature-list")!;

async function renderFeatureList(): Promise<void> {
  const state = await getFeatureFlagState();

  featureList.innerHTML = FEATURE_FLAGS.map(
    (flag) => `
      <div class="feature-card">
        <div class="feature-card-header">
          <span class="flag-name">${flag.name}</span>
          <label class="switch">
            <input type="checkbox" id="flag-${flag.id}" ${state[flag.id] ? "checked" : ""} />
            <span class="switch-track"></span>
          </label>
        </div>
        <p class="flag-desc">${flag.description}</p>
      </div>
    `,
  ).join("");

  for (const flag of FEATURE_FLAGS) {
    const checkbox = document.querySelector<HTMLInputElement>(`#flag-${flag.id}`)!;
    checkbox.addEventListener("change", () => {
      void setFeatureEnabled(flag.id, checkbox.checked);
    });
  }
}

void renderFeatureList();
void mountThemeColorPicker(document.querySelector<HTMLDivElement>("#theme-colors")!);
mountCustomizeNavSection(document.querySelector<HTMLDivElement>("#customize-nav-section")!);

// Runs after every section above exists in the DOM — generic, not specific
// to Customize Nav: expands + focuses whichever <details id="..."> matches
// this page's ?section= param, if any.
expandSectionFromUrl();
