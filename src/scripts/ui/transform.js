import { clampLayerOffsets, clampScaleMultiplier, getZoomAtPoint } from "../core/framing.js";
import { getActiveLayer, getLayerHint } from "../core/layers.js";
import { controls } from "./dom.js";
import { LAYER_KEYS, hasLayerImage, state } from "./state.js";
import { getCompositionMetrics, requestRender } from "./render.js";

export const gesture = {
  pointerId: null,
  layer: null,
  lastClientX: 0,
  lastClientY: 0,
  pointerScale: { x: 1, y: 1 },
  travelled: 0,
  lastTravelled: 0
};

export function resolveActiveLayer(altKey) {
  return getActiveLayer({
    altKey,
    hasPortrait: hasLayerImage("portrait"),
    hasBackground: hasLayerImage("background")
  });
}

export function refreshHint(altKey) {
  const layer = resolveActiveLayer(altKey);
  const hint = getLayerHint({
    layer,
    hasPortrait: hasLayerImage("portrait"),
    hasBackground: hasLayerImage("background")
  });

  if (controls.canvasHint.textContent !== hint) {
    controls.canvasHint.textContent = hint;
  }
}

export function applyLayerTransform(layer, next) {
  const keys = LAYER_KEYS[layer];
  const scale = clampScaleMultiplier(next.scale);
  const offsets = clampLayerOffsets(
    state[keys.image],
    scale,
    next.offsetX,
    next.offsetY,
    getCompositionMetrics()
  );

  state[keys.scale] = scale;
  state[keys.offsetX] = offsets.offsetX;
  state[keys.offsetY] = offsets.offsetY;
  controls[keys.scaleControl].value = String(scale);

  requestRender();
  refreshHint(gesture.layer === "background");
}

export function applyZoom(layer, nextScale, pointerX, pointerY) {
  const keys = LAYER_KEYS[layer];
  const zoomed = getZoomAtPoint({
    image: state[keys.image],
    metrics: getCompositionMetrics(),
    scaleMultiplier: state[keys.scale],
    offsetX: state[keys.offsetX],
    offsetY: state[keys.offsetY],
    nextScaleMultiplier: nextScale,
    pointerX,
    pointerY
  });

  applyLayerTransform(layer, {
    scale: zoomed.scaleMultiplier,
    offsetX: zoomed.offsetX,
    offsetY: zoomed.offsetY
  });
}

export function panLayer(layer, dx, dy) {
  const keys = LAYER_KEYS[layer];

  applyLayerTransform(layer, {
    scale: state[keys.scale],
    offsetX: state[keys.offsetX] + dx,
    offsetY: state[keys.offsetY] + dy
  });
}
