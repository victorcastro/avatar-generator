import { AUTO_ZOOM_ON_LOAD } from "./framing.js";

const LAYER_DEFAULTS = {
  background: { offsetX: 0, offsetY: 0, scale: AUTO_ZOOM_ON_LOAD },
  portrait: { offsetX: 0, offsetY: 12, scale: AUTO_ZOOM_ON_LOAD }
};

export function getActiveLayer(options) {
  const { altKey, hasPortrait, hasBackground } = options;

  if (altKey) {
    return hasBackground ? "background" : null;
  }

  if (hasPortrait) {
    return "portrait";
  }

  if (hasBackground) {
    return "background";
  }

  return null;
}

export function getDropTargetLayer(altKey) {
  return altKey ? "background" : "portrait";
}

export function getLayerHint(options) {
  const { layer, hasPortrait, hasBackground } = options;

  if (!hasPortrait && !hasBackground) {
    return "Add a portrait or a background to start composing";
  }

  if (!layer) {
    return "Add a background image to move it with Alt";
  }

  if (layer === "background") {
    return hasPortrait
      ? "Moving the background — release Alt to move the portrait"
      : "Drag to move the background — scroll to zoom, double-click to center";
  }

  if (hasBackground) {
    return "Drag to move the portrait — hold Alt to move the background";
  }

  return "Drag to move the portrait — scroll to zoom, double-click to center";
}

export function getDefaultLayerTransform(layer) {
  const defaults = LAYER_DEFAULTS[layer] || LAYER_DEFAULTS.portrait;

  return { offsetX: defaults.offsetX, offsetY: defaults.offsetY, scale: defaults.scale };
}
