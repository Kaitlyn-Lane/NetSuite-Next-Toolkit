import "@/core/theme.css";
import "./style.css";
import {
  BUILD_NAV_MENU_MESSAGE,
  type BuildNavMenuRequest,
  type BuildNavMenuResponse,
} from "@/features/nav/build-menu/types/messages";
import { FEATURE_FLAGS, getFeatureFlagState, setFeatureEnabled } from "@/core/feature-flags";
import { mountCustomizeNavTile } from "@/features/nav/customize-nav";
import { mountThemeColorPicker } from "@/features/theme/popup-color-picker";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="popup">
    <header class="popup-header">
      <h1>NetSuite Next Toolkit</h1>
    </header>

    <section class="action-section">
      <button id="create-nav-menu-btn" type="button" class="btn btn-primary">Create Menu Nav</button>
      <p id="status" class="status"></p>
    </section>

    <section class="features-section">
      <h2 class="section-label">Features</h2>
      <p class="hint">Changes take effect after refreshing NetSuite tabs.</p>
      <div id="feature-flags" class="feature-list"></div>
      <div id="customize-nav-tile"></div>
    </section>

    <section class="appearance-section">
      <details class="collapsible">
        <summary class="section-label">Appearance</summary>
        <div id="theme-colors" class="theme-colors"></div>
        <p class="hint">Changes take effect after refreshing NetSuite tabs.</p>
      </details>
    </section>

    <footer class="popup-footer">
      <button id="options-btn" type="button" class="btn btn-link">Full instructions</button>
    </footer>
  </div>
`;

const button = document.querySelector<HTMLButtonElement>("#create-nav-menu-btn")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const featureFlagsContainer = document.querySelector<HTMLDivElement>("#feature-flags")!;
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

async function renderFeatureFlags(): Promise<void> {
  const state = await getFeatureFlagState();

  featureFlagsContainer.innerHTML = FEATURE_FLAGS.map(
    (flag) => `
      <label class="flag-row" for="flag-${flag.id}">
        <div class="flag-text">
          <span class="flag-name">${flag.name}</span>
          <span class="flag-desc">${flag.description}</span>
        </div>
        <span class="switch">
          <input type="checkbox" id="flag-${flag.id}" ${state[flag.id] ? "checked" : ""} />
          <span class="switch-track"></span>
        </span>
      </label>
    `,
  ).join("");

  for (const flag of FEATURE_FLAGS) {
    const checkbox = document.querySelector<HTMLInputElement>(`#flag-${flag.id}`)!;
    checkbox.addEventListener("change", () => {
      void setFeatureEnabled(flag.id, checkbox.checked);
    });
  }
}

void renderFeatureFlags();
void mountThemeColorPicker(document.querySelector<HTMLDivElement>("#theme-colors")!);
mountCustomizeNavTile(document.querySelector<HTMLDivElement>("#customize-nav-tile")!);
