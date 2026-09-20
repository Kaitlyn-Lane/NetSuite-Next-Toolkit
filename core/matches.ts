// Shared `matches` pattern for every NetSuite Next content script. Import
// this instead of repeating the literal pattern in each entrypoint — when
// the target domain changes, it's a one-line edit instead of an N-file one.
export const NETSUITE_MATCHES = ["https://*.app.netsuite.com/*"];
