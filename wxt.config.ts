import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "NetSuite Next Toolkit",
    description: "Restores and adds capability to NetSuite Next.",
    permissions: ["storage"],
    host_permissions: ["https://*.app.netsuite.com/*"],
  },
});
