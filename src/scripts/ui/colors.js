import {
  DIVIDER_SWATCHES,
  LABEL_SWATCHES,
  normalizeHexColor
} from "../core/colors.js";
import { controls } from "./dom.js";
import { state } from "./state.js";
import { updateState } from "./render.js";

const PICKERS = {
  dividerColor: {
    swatches: DIVIDER_SWATCHES,
    group: "dividerSwatches",
    hex: "dividerHex",
    name: "dividerColor"
  },
  labelBackground: {
    swatches: LABEL_SWATCHES,
    group: "labelBackgroundSwatches",
    hex: "labelBackgroundHex",
    name: "labelBackground"
  }
};

function renderSwatches(picker) {
  const group = controls[picker.group];

  picker.swatches.forEach((color) => {
    const label = document.createElement("label");
    label.className = "swatch";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = picker.name;
    input.value = color;

    const chip = document.createElement("span");
    chip.style.setProperty("--swatch", color);

    label.append(input, chip);
    group.append(label);
  });
}

function syncPicker(key) {
  const picker = PICKERS[key];
  const group = controls[picker.group];

  group.querySelectorAll("input").forEach((input) => {
    input.checked = input.value === state[key];
  });

  if (document.activeElement !== controls[picker.hex]) {
    controls[picker.hex].value = state[key];
  }

  controls[picker.hex].classList.remove("is-invalid");
}

function applyColor(key, value) {
  updateState(key, value);
  syncPicker(key);
}

function bindPicker(key) {
  const picker = PICKERS[key];

  renderSwatches(picker);

  controls[picker.group].addEventListener("change", (event) => {
    applyColor(key, event.target.value);
  });

  controls[picker.hex].addEventListener("input", (event) => {
    const color = normalizeHexColor(event.target.value);

    if (!color) {
      event.target.classList.add("is-invalid");
      return;
    }

    event.target.classList.remove("is-invalid");
    applyColor(key, color);
  });

  controls[picker.hex].addEventListener("blur", () => {
    syncPicker(key);
  });

  syncPicker(key);
}

export function bindColorPickers() {
  Object.keys(PICKERS).forEach(bindPicker);
}
