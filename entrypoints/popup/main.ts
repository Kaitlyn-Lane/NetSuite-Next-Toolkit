import "@/core/theme.css";
import "./style.css";
import {
  BUILD_NAV_MENU_MESSAGE,
  type BuildNavMenuRequest,
  type BuildNavMenuResponse,
} from "@/features/nav/build-menu/types/messages";
import { FEATURE_FLAGS, getFeatureFlagState, setFeatureEnabled } from "@/core/feature-flags";
import { featureCardHTML, featureCategoryHTML, wireFeatureCardExpand, wireFeatureCardToggle } from "@/core/feature-card";
import { CUSTOMIZE_NAV_SECTION_ID, mountCustomizeNavPopupBody } from "@/features/nav/customize-nav";
import { isCustomAppearanceEnabled, mountThemeColorPicker, setCustomAppearanceEnabled } from "@/features/appearance/color-override";
// Directly, not via the feature's index.ts barrel — the barrel also
// re-exports the record-browser page's React tree (react-json-view-lite +
// its stylesheet), which the popup never renders.
import { mountRecordBrowserAction } from "@/features/developer-tools/record-browser/open-record-browser";

const COLOR_OVERRIDE_ID = "colorOverride";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="popup">
    <header class="popup-header">
      <h1>NetSuite Next Toolkit</h1>
    </header>

    <section class="popup-section">
      <h2 class="section-label">Actions</h2>
      <div class="action-section">
        <button id="create-nav-menu-btn" type="button" class="btn btn-primary">Create Menu Nav</button>
        <p id="status" class="status"></p>
      </div>
      <div id="record-browser-action" class="action-section" hidden></div>
    </section>

    <section class="popup-section">
      <h2 class="section-label">Feature Enablement</h2>
      <div id="feature-categories" class="feature-categories"></div>
      <p class="hint">Changes take effect after refreshing NetSuite tabs.</p>
    </section>

    <footer class="popup-footer">
      <button id="options-btn" type="button" class="btn btn-link">Full instructions</button>
    </footer>
  </div>
`;

const button = document.querySelector<HTMLButtonElement>("#create-nav-menu-btn")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const optionsButton = document.querySelector<HTMLButtonElement>("#options-btn")!;

function setStatus(message: string): void {
  status.textContent = message;
}

button.addEventListener("click", async () => {
  button.disabled = true;
  setStatus("Working…");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      setStatus("Couldn't find the active tab.");
      return;
    }

    const request: BuildNavMenuRequest = { type: BUILD_NAV_MENU_MESSAGE };

    let response: BuildNavMenuResponse;
    try {
      response = await chrome.tabs.sendMessage<BuildNavMenuRequest, BuildNavMenuResponse>(
        tab.id,
        request,
      );
    } catch {
      setStatus("Couldn't reach the page — make sure you're on a NetSuite tab and try reloading it.");
      return;
    }

    if (response.ok) {
      setStatus(`Done — ${response.count} links extracted`);
    } else {
      setStatus(`Error: ${response.error}`);
    }
  } finally {
    button.disabled = false;
  }
});

optionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// The Actions section holds one-click actions against the current tab.
// Create Menu Nav is always there; opt-in actions (Record Browser) only
// appear while their feature flag is on. Unlike every other toggle in the
// popup, this one takes effect immediately — it only shows/hides a button
// in this popup, nothing injected into NetSuite tabs — so the toggle's
// onChange calls this directly too. Mounted on first enable; after that
// it's only shown/hidden. The button opens the tree in its own tab (see
// features/developer-tools/record-browser/open-record-browser.ts).
const recordBrowserAction = document.querySelector<HTMLDivElement>("#record-browser-action")!;
let recordBrowserMounted = false;

function setRecordBrowserActionVisible(visible: boolean): void {
  if (visible && !recordBrowserMounted) {
    mountRecordBrowserAction(recordBrowserAction);
    recordBrowserMounted = true;
  }
  recordBrowserAction.hidden = !visible;
}

// Everything in the popup/options pages is framed as a "feature" living
// inside a category — Navigation (Vertical Hover Nav: toggle only;
// Customize Nav: dropdown only, since there's no simple on/off, just
// config) and Appearance (Color Override: both — the toggle is on/off,
// the dropdown reveals the actual color fields, independent of whether
// that toggle is on) and Developer Tools (Record Browser: toggle only —
// enabling it adds its Load Record button to the popup's Actions
// section; the tree itself lives there, not in this card).
// core/feature-card.ts owns the shared card/category chrome; this only
// decides what goes in which category and wires each card's specific
// behavior.
async function renderFeatureCategories(): Promise<void> {
  const container = document.querySelector<HTMLDivElement>("#feature-categories")!;
  const flagState = await getFeatureFlagState();
  const colorOverrideEnabled = await isCustomAppearanceEnabled();
  const verticalHoverFlag = FEATURE_FLAGS.find((flag) => flag.id === "verticalHoverNav")!;
  const headerBannersFlag = FEATURE_FLAGS.find((flag) => flag.id === "headerBanners")!;
  const recordBrowserFlag = FEATURE_FLAGS.find((flag) => flag.id === "recordBrowser")!;

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
            "Hide any top-level layer, container, or link from the vertical hover nav, and bind any link to Alt+1–Alt+9 or Alt+0 to jump straight to it.",
          hasToggle: false,
          hasDropdown: true,
        }),
      ].join(""),
    ) +
    featureCategoryHTML(
      "Appearance",
      [
        featureCardHTML({
          id: COLOR_OVERRIDE_ID,
          name: "Color Override",
          description:
            "Overwrite NetSuite's own colors — the omni-box search dropdown and the vertical hover nav — with colors you pick.",
          hasToggle: true,
          hasDropdown: true,
          toggleChecked: colorOverrideEnabled,
        }),
        featureCardHTML({
          id: headerBannersFlag.id,
          name: headerBannersFlag.name,
          description: headerBannersFlag.description,
          hasToggle: true,
          hasDropdown: false,
          toggleChecked: flagState[headerBannersFlag.id],
        }),
      ].join(""),
    ) +
    featureCategoryHTML(
      "Developer Tools",
      featureCardHTML({
        id: recordBrowserFlag.id,
        name: recordBrowserFlag.name,
        description: recordBrowserFlag.description,
        hasToggle: true,
        hasDropdown: false,
        toggleChecked: flagState[recordBrowserFlag.id],
      }),
    );

  wireFeatureCardToggle(verticalHoverFlag.id, (checked) => {
    void setFeatureEnabled(verticalHoverFlag.id, checked);
  });
  wireFeatureCardExpand(CUSTOMIZE_NAV_SECTION_ID);
  mountCustomizeNavPopupBody(document.getElementById(`feature-body-${CUSTOMIZE_NAV_SECTION_ID}`)!);

  wireFeatureCardToggle(COLOR_OVERRIDE_ID, (checked) => {
    void setCustomAppearanceEnabled(checked);
  });
  wireFeatureCardExpand(COLOR_OVERRIDE_ID);
  void mountThemeColorPicker(document.getElementById(`feature-body-${COLOR_OVERRIDE_ID}`)!);

  wireFeatureCardToggle(headerBannersFlag.id, (checked) => {
    void setFeatureEnabled(headerBannersFlag.id, checked);
  });

  wireFeatureCardToggle(recordBrowserFlag.id, (checked) => {
    void setFeatureEnabled(recordBrowserFlag.id, checked);
    setRecordBrowserActionVisible(checked);
  });
  setRecordBrowserActionVisible(flagState[recordBrowserFlag.id] ?? false);
}

void renderFeatureCategories();
