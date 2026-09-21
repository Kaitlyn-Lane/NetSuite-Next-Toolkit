import iro from "@jaames/iro";

import { DEFAULT_THEME_COLORS, THEME_COLORS_STORAGE_KEY, type ThemeColors } from "./types";

interface ColorField {
  key: keyof ThemeColors;
  label: string;
}

const FIELDS: ColorField[] = [
  { key: "text", label: "Text" },
  { key: "background", label: "Background" },
  { key: "accent", label: "Accent" },
];

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

// One shared iro.js instance reused across all three fields, rather than
// three mounted canvases, to keep the popup's DOM footprint small.
export async function mountThemeColorPicker(container: HTMLElement): Promise<void> {
  const stored = await chrome.storage.local.get(THEME_COLORS_STORAGE_KEY);
  const colors: ThemeColors = {
    ...DEFAULT_THEME_COLORS,
    ...(stored[THEME_COLORS_STORAGE_KEY] as Partial<ThemeColors> | undefined),
  };

  container.innerHTML = `
    ${FIELDS.map(
      (field) => `
        <div class="color-row">
          <span class="flag-name">${field.label}</span>
          <input
            type="text"
            class="hex-input"
            id="hex-${field.key}"
            value="${colors[field.key]}"
            maxlength="7"
            spellcheck="false"
            aria-label="${field.label} color hex value"
          />
          <button
            type="button"
            class="swatch"
            id="swatch-${field.key}"
            style="background:${colors[field.key]}"
            aria-label="Choose ${field.label.toLowerCase()} color"
          ></button>
        </div>
      `,
    ).join("")}
    <div id="wheel-panel" class="wheel-panel" hidden></div>
    <div id="theme-preview" class="theme-preview">
      <div class="preview-item">Normal</div>
      <div class="preview-item preview-hover">Hover / Active</div>
    </div>
  `;

  const wheelPanel = container.querySelector<HTMLDivElement>("#wheel-panel")!;
  const preview = container.querySelector<HTMLDivElement>("#theme-preview")!;
  const colorPicker = iro.ColorPicker(wheelPanel, { width: 140, color: colors.accent });

  let activeKey: keyof ThemeColors | null = null;

  function updatePreview(): void {
    preview.style.setProperty("--nst-flyout-text", colors.text);
    preview.style.setProperty("--nst-flyout-bg", colors.background);
    preview.style.setProperty("--nst-flyout-accent", colors.accent);
  }

  // Shared by the wheel's input:end and the hex inputs, so both paths
  // update the swatch/hex-field/preview the same way and persist once.
  function commitColor(key: keyof ThemeColors, hex: string): void {
    colors[key] = hex;
    container.querySelector<HTMLButtonElement>(`#swatch-${key}`)!.style.background = hex;
    container.querySelector<HTMLInputElement>(`#hex-${key}`)!.value = hex;
    updatePreview();
    void chrome.storage.local.set({ [THEME_COLORS_STORAGE_KEY]: colors });
  }

  updatePreview();

  colorPicker.on("color:change", (color: { hexString: string }) => {
    if (!activeKey) return;
    container.querySelector<HTMLButtonElement>(`#swatch-${activeKey}`)!.style.background = color.hexString;
    container.querySelector<HTMLInputElement>(`#hex-${activeKey}`)!.value = color.hexString;
  });

  // Fires once per drag gesture (mouseup/touchend), so this is the point
  // to persist — no separate debounce needed for the drag itself.
  colorPicker.on("input:end", (color: { hexString: string }) => {
    if (!activeKey) return;
    commitColor(activeKey, color.hexString);
  });

  for (const field of FIELDS) {
    const swatch = container.querySelector<HTMLButtonElement>(`#swatch-${field.key}`)!;
    const hexInput = container.querySelector<HTMLInputElement>(`#hex-${field.key}`)!;

    swatch.addEventListener("click", () => {
      if (activeKey === field.key && !wheelPanel.hidden) {
        wheelPanel.hidden = true;
        activeKey = null;
        return;
      }
      activeKey = field.key;
      colorPicker.color.hexString = colors[field.key];
      wheelPanel.hidden = false;
    });

    function commitHexInput(): void {
      const value = hexInput.value.trim();
      if (!HEX_PATTERN.test(value)) {
        hexInput.value = colors[field.key];
        return;
      }
      const normalized = value.toLowerCase();
      commitColor(field.key, normalized);
      if (activeKey === field.key) {
        colorPicker.color.hexString = normalized;
      }
    }

    hexInput.addEventListener("change", commitHexInput);
    hexInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        hexInput.blur();
      }
    });
  }
}
