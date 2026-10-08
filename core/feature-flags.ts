// Central registry for features that can be toggled on/off from the popup
// or the options page. Two kinds live here: features that get
// auto-injected into NetSuite pages and need to be lockable behind a
// setting (vertical-hover, header banners), and opt-in popup actions whose
// button only appears in the popup's Actions section once enabled (Record
// Browser). Core actions everyone needs (e.g. the "Create Menu Nav"
// button) are never gated and don't need an entry.
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
}

export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: "verticalHoverNav",
    name: "Vertical Hover Nav",
    description:
      "Replaces NetSuite's default nav menu with a hover flyout built from the scraped menu data.",
    defaultEnabled: true,
  },
  {
    id: "headerBanners",
    name: "Header Banners",
    description:
      "Widens NetSuite's field-group header bars to full width with an ocean-tinted background.",
    defaultEnabled: true,
  },
  {
    id: "recordBrowser",
    name: "Record Browser",
    description:
      "Adds a Load Record button to the popup's Actions section: view the current record as a searchable JSON tree, built from NetSuite's own XML view of it.",
    // Off by default — a developer tool, so it stays out of the popup's
    // Actions section until someone opts in.
    defaultEnabled: false,
  },
];

const STORAGE_KEY = "featureFlags";

type FeatureFlagState = Record<string, boolean>;

function withDefaults(stored: FeatureFlagState | undefined): FeatureFlagState {
  const defaults = Object.fromEntries(FEATURE_FLAGS.map((flag) => [flag.id, flag.defaultEnabled]));
  return { ...defaults, ...stored };
}

// Content scripts only need a yes/no for one flag at page-load time —
// exposed separately so callers don't have to pull in the whole state
// shape just to gate a safeInit(...) call.
export async function isFeatureEnabled(id: string): Promise<boolean> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return withDefaults(stored[STORAGE_KEY] as FeatureFlagState | undefined)[id] ?? false;
}

// Popup/options UIs render the full toggle list, so they need every flag's
// current state at once rather than one lookup per checkbox.
export async function getFeatureFlagState(): Promise<FeatureFlagState> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return withDefaults(stored[STORAGE_KEY] as FeatureFlagState | undefined);
}

export async function setFeatureEnabled(id: string, enabled: boolean): Promise<void> {
  const current = await getFeatureFlagState();
  await chrome.storage.local.set({ [STORAGE_KEY]: { ...current, [id]: enabled } });
}
