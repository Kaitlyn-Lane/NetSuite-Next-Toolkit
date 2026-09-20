import "./style.css";
import {
  BUILD_NAV_MENU_MESSAGE,
  type BuildNavMenuRequest,
  type BuildNavMenuResponse,
} from "@/features/nav/build-menu/types/messages";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <h1>NetSuite Next Toolkit</h1>
  <button id="create-nav-menu-btn" type="button">Create Menu Nav</button>
  <p id="status"></p>
`;

const button = document.querySelector<HTMLButtonElement>("#create-nav-menu-btn")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;

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
