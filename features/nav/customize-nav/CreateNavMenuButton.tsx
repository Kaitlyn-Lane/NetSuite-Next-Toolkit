import { useState } from "react";
import { Button } from "react-aria-components";

import {
  BUILD_NAV_MENU_MESSAGE,
  type BuildNavMenuRequest,
  type BuildNavMenuResponse,
} from "@/features/nav/build-menu/types/messages";

// Ports the exact scrape-trigger behavior that used to live directly in
// entrypoints/popup/main.ts (message the active tab's content script,
// report count/error), as a shared component so both the popup and the
// options page can trigger a re-scrape without duplicating the messaging
// logic.
export function CreateNavMenuButton({ onSuccess }: { onSuccess?: () => void }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function handlePress() {
    setBusy(true);
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
        onSuccess?.();
      } else {
        setStatus(`Error: ${response.error}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cn-create-nav-menu">
      <Button type="button" isDisabled={busy} onPress={() => void handlePress()}>
        Create Menu Nav
      </Button>
      <p className="cn-status-message">{status}</p>
    </div>
  );
}
