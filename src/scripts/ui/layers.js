import { isAcceptedImageType } from "../core/images.js";
import { getDefaultLayerTransform } from "../core/layers.js";
import { controls } from "./dom.js";
import { LAYER_KEYS, portraitSource, setStatus, state } from "./state.js";
import { loadImageFromBlob } from "./images.js";
import { requestRender } from "./render.js";
import { applyLayerTransform, refreshHint } from "./transform.js";
import { resetPortraitSource, setCutoutBusy, setCutoutStatus } from "./cutout.js";

export function setLayerFileName(layer, message) {
  const keys = LAYER_KEYS[layer];

  controls[keys.fileName].textContent = message;
  controls[keys.fileName].hidden = !message;
  controls[keys.clearButton].hidden = !state[keys.image];
}

export function clearLayer(layer) {
  const keys = LAYER_KEYS[layer];
  const defaults = getDefaultLayerTransform(layer);

  state[keys.image] = null;
  state[keys.scale] = defaults.scale;
  state[keys.offsetX] = defaults.offsetX;
  state[keys.offsetY] = defaults.offsetY;
  controls[keys.scaleControl].value = String(defaults.scale);

  if (layer === "portrait") {
    portraitSource.file = null;
    portraitSource.originalImage = null;
    portraitSource.cutoutImage = null;
    portraitSource.requestId += 1;
    setCutoutBusy(false);
    setCutoutStatus("");
  }

  setLayerFileName(layer, "");
  setStatus(`The ${layer} image was removed`);
  requestRender();
  refreshHint(false);
}

export async function handleImageInput(file, layer) {
  if (!file) {
    return;
  }

  const keys = LAYER_KEYS[layer];

  if (!isAcceptedImageType(layer, file.type, file.name)) {
    const message = `That file type is not supported for the ${layer}`;
    setLayerFileName(layer, message);
    setStatus(message);
    return;
  }

  try {
    const image = await loadImageFromBlob(file);
    state[keys.image] = image;
    applyLayerTransform(layer, getDefaultLayerTransform(layer));
    setLayerFileName(layer, file.name);
    setStatus(`${file.name} loaded as the ${layer}`);

    if (layer === "portrait") {
      resetPortraitSource(file, image);
    }
  } catch (error) {
    window.alert(error.message);
  }
}
