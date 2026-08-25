import { controls } from "./dom.js";
import { LAYER_KEYS, portraitSource, state } from "./state.js";
import { getCompositionMetrics, updateState } from "./render.js";
import { applyZoom } from "./transform.js";
import { clearLayer, handleImageInput } from "./layers.js";
import {
  runBackgroundRemoval,
  setCutoutBusy,
  setCutoutStatus,
  setPortraitImage
} from "./cutout.js";

function updateTitleTextCounter() {
  controls.titleTextCounter.textContent = `${controls.titleText.value.length}/${controls.titleText.maxLength}`;
}

function bindScaleControl(layer) {
  const keys = LAYER_KEYS[layer];

  controls[keys.scaleControl].addEventListener("input", (event) => {
    const metrics = getCompositionMetrics();
    applyZoom(layer, Number(event.target.value), metrics.centerX, metrics.centerY);
  });
}

function bindUploadControl(layer) {
  controls[`${layer}Upload`].addEventListener("change", (event) => {
    handleImageInput(event.target.files[0], layer);
    event.target.value = "";
  });
}

function bindClearControl(layer) {
  controls[LAYER_KEYS[layer].clearButton].addEventListener("click", () => {
    clearLayer(layer);
  });
}

export function bindControls() {
  controls.role.addEventListener("change", (event) => {
    updateState("role", event.target.value);
  });

  controls.hideIcon.addEventListener("change", (event) => {
    updateState("showIcon", !event.target.checked);
  });

  controls.titleText.addEventListener("input", (event) => {
    updateState("titleText", event.target.value);
    updateTitleTextCounter();
  });

  controls.portraitCutout.addEventListener("change", (event) => {
    state.removePortraitBackground = event.target.checked;

    if (!portraitSource.file) {
      setCutoutStatus("");
      return;
    }

    if (state.removePortraitBackground) {
      runBackgroundRemoval();
      return;
    }

    portraitSource.requestId += 1;
    setCutoutBusy(false);
    setPortraitImage(portraitSource.originalImage);
    setCutoutStatus("Using the original image");
  });

  bindScaleControl("background");
  bindScaleControl("portrait");
  bindUploadControl("background");
  bindUploadControl("portrait");
  bindClearControl("background");
  bindClearControl("portrait");

  updateTitleTextCounter();
}
