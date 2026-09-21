import { KEY_BINDINGS, type KeyBinding } from "./types";

const NONE_VALUE = "";

function bindingLabel(binding: KeyBinding): string {
  return `Alt+${binding.slice("alt+".length)}`;
}

export function KeyBindingSelect({
  currentBinding,
  onChange,
}: {
  currentBinding: KeyBinding | undefined;
  onChange: (binding: KeyBinding | undefined) => void;
}) {
  return (
    <select
      className="cn-keybinding-select"
      value={currentBinding ?? NONE_VALUE}
      onChange={(event) => {
        const value = event.target.value;
        onChange(value === NONE_VALUE ? undefined : (value as KeyBinding));
      }}
      aria-label="Keyboard shortcut"
    >
      <option value={NONE_VALUE}>No shortcut</option>
      {KEY_BINDINGS.map((binding) => (
        <option key={binding} value={binding}>
          {bindingLabel(binding)}
        </option>
      ))}
    </select>
  );
}
