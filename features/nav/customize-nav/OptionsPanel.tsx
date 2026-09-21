import { useCallback, useState } from "react";
import { createRoot } from "react-dom/client";

import { CreateNavMenuButton } from "./CreateNavMenuButton";
import { CustomizeNavTable } from "./CustomizeNavTable";

function CustomizeNavPanel() {
  // Bumping this remounts CustomizeNavTable, so a fresh scrape (which
  // overwrites navMenu wholesale) is picked up instead of showing stale
  // tree state.
  const [reloadToken, setReloadToken] = useState(0);
  const handleScraped = useCallback(() => setReloadToken((token) => token + 1), []);

  return (
    <>
      <CreateNavMenuButton onSuccess={handleScraped} />
      <CustomizeNavTable key={reloadToken} />
    </>
  );
}

// entrypoints/options/main.ts stays plain vanilla TS — this is the one spot
// where a React root gets mounted into that otherwise-vanilla page, kept
// self-contained here so main.ts never needs JSX.
export function mountCustomizeNavPanel(container: HTMLElement): void {
  createRoot(container).render(<CustomizeNavPanel />);
}
