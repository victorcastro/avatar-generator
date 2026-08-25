import { CANVAS_SIZE } from "../core/composition.js";
import {
  getCanvasPoint,
  getCanvasPointerScale,
  getKeyboardPanStep,
  getWheelScaleMultiplier
} from "../core/framing.js";
import { getDefaultLayerTransform } from "../core/layers.js";
import { canvas } from "./dom.js";
import { LAYER_KEYS, setStatus, state } from "./state.js";
import {
  applyLayerTransform,
  applyZoom,
  gesture,
  panLayer,
  refreshHint,
  resolveActiveLayer
} from "./transform.js";

const DRAG_THRESHOLD = 4;

function endGesture(event) {
  if (event.pointerId !== gesture.pointerId) {
    return;
  }

  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch {
    gesture.pointerId = null;
  }

  gesture.lastTravelled = gesture.travelled;
  gesture.pointerId = null;
  gesture.layer = null;
  gesture.travelled = 0;
  canvas.classList.remove("is-grabbing");
}

export function bindGestures() {
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (gesture.pointerId !== null) {
      return;
    }

    const layer = resolveActiveLayer(event.altKey);

    if (!layer) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    gesture.pointerId = event.pointerId;
    gesture.layer = layer;
    gesture.lastClientX = event.clientX;
    gesture.lastClientY = event.clientY;
    gesture.pointerScale = getCanvasPointerScale(rect, CANVAS_SIZE);
    gesture.travelled = 0;

    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    canvas.classList.add("is-grabbing");
  });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== gesture.pointerId) {
      return;
    }

    const dx = (event.clientX - gesture.lastClientX) * gesture.pointerScale.x;
    const dy = (event.clientY - gesture.lastClientY) * gesture.pointerScale.y;

    gesture.lastClientX = event.clientX;
    gesture.lastClientY = event.clientY;
    gesture.travelled += Math.abs(dx) + Math.abs(dy);

    panLayer(gesture.layer, dx, dy);
  });

  canvas.addEventListener("pointerup", endGesture);
  canvas.addEventListener("pointercancel", endGesture);

  canvas.addEventListener(
    "wheel",
    (event) => {
      const layer = resolveActiveLayer(event.altKey);

      if (!layer) {
        return;
      }

      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const point = getCanvasPoint(event.clientX, event.clientY, rect, CANVAS_SIZE);
      const nextScale = getWheelScaleMultiplier(
        state[LAYER_KEYS[layer].scale],
        event.deltaY,
        event.deltaMode
      );

      applyZoom(layer, nextScale, point.x, point.y);
    },
    { passive: false }
  );

  canvas.addEventListener("dblclick", (event) => {
    if (gesture.lastTravelled > DRAG_THRESHOLD) {
      return;
    }

    const layer = resolveActiveLayer(event.altKey);

    if (!layer) {
      return;
    }

    applyLayerTransform(layer, getDefaultLayerTransform(layer));
    setStatus(`The ${layer} is centered again`);
  });

  canvas.addEventListener("keydown", (event) => {
    const step = getKeyboardPanStep(event.key, event.shiftKey);

    if (!step) {
      return;
    }

    const layer = resolveActiveLayer(event.altKey);

    if (!layer) {
      return;
    }

    event.preventDefault();
    panLayer(layer, step.dx, step.dy);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Alt") {
      refreshHint(event.getModifierState("Alt"));
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "Alt") {
      refreshHint(event.getModifierState("Alt"));
    }
  });

  window.addEventListener("blur", () => {
    refreshHint(false);
  });
}
