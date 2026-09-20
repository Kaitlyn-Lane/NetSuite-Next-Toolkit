import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";

// No official WXT module for React Aria specifically, but React itself has
// one (@wxt-dev/module-react) — using the plain Vite plugin instead since
// we don't need anything else the module wraps. See
// features/nav/vertical-hover/README.md for why this is real React and
// not Preact.
export default defineConfig({
  vite: () => ({
    plugins: [react()],
  }),
  manifest: {
    name: "NetSuite Next Toolkit",
    description: "Restores and adds capability to NetSuite Next.",
    permissions: ["storage"],
    host_permissions: ["https://*.app.netsuite.com/*"],
  },
});
