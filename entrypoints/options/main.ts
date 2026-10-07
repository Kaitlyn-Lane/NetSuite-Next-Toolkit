import "@/core/theme.css";
import "./style.css";
import { FEATURE_FLAGS, getFeatureFlagState, setFeatureEnabled } from "@/core/feature-flags";
import { featureCardHTML, featureCategoryHTML, wireFeatureCardExpand, wireFeatureCardToggle } from "@/core/feature-card";
import { expandSectionFromUrl } from "@/core/section-params";
import { CUSTOMIZE_NAV_SECTION_ID, mountCustomizeNavSection } from "@/features/nav/customize-nav";
import { isCustomAppearanceEnabled, setCustomAppearanceEnabled } from "@/features/theme/appearance-toggle";
import { mountThemeColorPicker } from "@/features/theme/popup-color-picker";

const COLOR_OVERRIDE_ID = "colorOverride";

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

    <div id="feature-categories" class="feature-categories"></div>
  </div>
`;

// Everything in the popup/options pages is framed as a "feature" living
// inside a category — Navigation (Vertical Hover Nav: toggle only;
// Customize Nav: dropdown only, since there's no simple on/off, just
// config) and Appearance (Color Override: both — the toggle is on/off,
// the dropdown reveals the actual color fields, independent of whether
// that toggle is on). core/feature-card.ts owns the shared card/category
// chrome; this only decides what goes in which category and wires each
// card's specific behavior.
async function renderFeatureCategories(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>("#feature-categories")!;
  const flagState = await getFeatureFlagState();
  const colorOverrideEnabled = await isCustomAppearanceEnabled();
  const verticalHoverFlag = FEATURE_FLAGS.find((flag) => flag.id === "verticalHoverNav")!;

  container.innerHTML =
    featureCategoryHTML(
      "Navigation",
      [
        featureCardHTML({
          id: verticalHoverFlag.id,
          name: verticalHoverFlag.name,
          description: verticalHoverFlag.description,
          hasToggle: true,
          hasDropdown: false,
          toggleChecked: flagState[verticalHoverFlag.id],
        }),
        featureCardHTML({
          id: CUSTOMIZE_NAV_SECTION_ID,
          name: "Customize Nav",
          description:
            "Hide any top-level layer, container, or link from the vertical hover nav (hiding a container hides everything nested under it), and bind any link to Alt+1–Alt+9 or Alt+0 to jump straight to it.",
          hasToggle: false,
          hasDropdown: true,
        }),
      ].join(""),
    ) +
    featureCategoryHTML(
      "Appearance",
      featureCardHTML({
        id: COLOR_OVERRIDE_ID,
        name: "Color Override",
        description:
          "Overwrite NetSuite's own colors — the omni-box search dropdown and the vertical hover nav — with colors you pick. The toggle is a one-click way to fall back to NetSuite's stock look without losing your picked colors.",
        hasToggle: true,
        hasDropdown: true,
        toggleChecked: colorOverrideEnabled,
      }),
    );

  wireFeatureCardToggle(verticalHoverFlag.id, (checked) => {
    void setFeatureEnabled(verticalHoverFlag.id, checked);
  });
  wireFeatureCardExpand(CUSTOMIZE_NAV_SECTION_ID);
  mountCustomizeNavSection(document.getElementById(`feature-body-${CUSTOMIZE_NAV_SECTION_ID}`)!);

  wireFeatureCardToggle(COLOR_OVERRIDE_ID, (checked) => {
    void setCustomAppearanceEnabled(checked);
  });
  wireFeatureCardExpand(COLOR_OVERRIDE_ID);
  void mountThemeColorPicker(document.getElementById(`feature-body-${COLOR_OVERRIDE_ID}`)!);

  // Runs only after the cards above exist in the DOM — generic, not
  // specific to Customize Nav: expands + focuses whichever feature card
  // matches this page's ?section= param, if any.
  expandSectionFromUrl();
}

void renderFeatureCategories();
