import { getImageDrawBounds } from "./composition.js";
import { clampNumber } from "./math.js";

export const SCALE_LIMITS = { min: 0.25, max: 1.8, step: 0.01 };

export const PAN_MIN_OVERLAP = 0.25;

export const AUTO_ZOOM_ON_LOAD = 1.1;

const KEYBOARD_PAN_STEP = { normal: 1, fast: 10 };

const WHEEL_ZOOM_SENSITIVITY = 0.0015;
const WHEEL_LINE_HEIGHT = 16;
const WHEEL_PAGE_HEIGHT = 400;

function getPanAxisBound(size, diameter) {
  return (size + diameter) / 2 - PAN_MIN_OVERLAP * Math.min(size, diameter);
}

export function getPanBounds(image, scaleMultiplier, metrics) {
  if (!image) {
    return { maxOffsetX: 0, maxOffsetY: 0 };
  }

  const bounds = getImageDrawBounds(image, scaleMultiplier, 0, 0, metrics);
  const diameter = metrics.radius * 2;

  return {
    maxOffsetX: getPanAxisBound(bounds.width, diameter),
    maxOffsetY: getPanAxisBound(bounds.height, diameter)
  };
}

export function clampLayerOffsets(image, scaleMultiplier, offsetX, offsetY, metrics) {
  const { maxOffsetX, maxOffsetY } = getPanBounds(image, scaleMultiplier, metrics);

  return {
    offsetX: clampNumber(offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clampNumber(offsetY, -maxOffsetY, maxOffsetY)
  };
}

export function clampScaleMultiplier(value) {
  return clampNumber(Number(value), SCALE_LIMITS.min, SCALE_LIMITS.max);
}

export function getZoomAtPoint(options) {
  const {
    image,
    metrics,
    scaleMultiplier,
    offsetX,
    offsetY,
    nextScaleMultiplier,
    pointerX,
    pointerY
  } = options;

  const currentScale = Number(scaleMultiplier);
  const nextScale = clampScaleMultiplier(nextScaleMultiplier);

  if (!(currentScale > 0)) {
    return { scaleMultiplier: nextScale, offsetX: 0, offsetY: 0 };
  }

  const ratio = nextScale / currentScale;
  const nextOffsetX = offsetX + (pointerX - metrics.centerX - offsetX) * (1 - ratio);
  const nextOffsetY = offsetY + (pointerY - metrics.centerY - offsetY) * (1 - ratio);
  const clamped = clampLayerOffsets(image, nextScale, nextOffsetX, nextOffsetY, metrics);

  return {
    scaleMultiplier: nextScale,
    offsetX: clamped.offsetX,
    offsetY: clamped.offsetY
  };
}

export function getWheelScaleMultiplier(scaleMultiplier, deltaY, deltaMode) {
  let normalized = Number(deltaY) || 0;

  if (deltaMode === 1) {
    normalized *= WHEEL_LINE_HEIGHT;
  } else if (deltaMode === 2) {
    normalized *= WHEEL_PAGE_HEIGHT;
  }

  const current = Number(scaleMultiplier);

  if (!(current > 0)) {
    return AUTO_ZOOM_ON_LOAD;
  }

  return clampScaleMultiplier(current * Math.exp(-normalized * WHEEL_ZOOM_SENSITIVITY));
}

export function getCanvasPointerScale(rect, canvasSize) {
  return {
    x: rect.width ? canvasSize / rect.width : 1,
    y: rect.height ? canvasSize / rect.height : 1
  };
}

export function getCanvasPoint(clientX, clientY, rect, canvasSize) {
  const pointerScale = getCanvasPointerScale(rect, canvasSize);

  return {
    x: (clientX - rect.left) * pointerScale.x,
    y: (clientY - rect.top) * pointerScale.y
  };
}

export function getKeyboardPanStep(key, shiftKey) {
  const amount = shiftKey ? KEYBOARD_PAN_STEP.fast : KEYBOARD_PAN_STEP.normal;

  if (key === "ArrowLeft") {
    return { dx: -amount, dy: 0 };
  }

  if (key === "ArrowRight") {
    return { dx: amount, dy: 0 };
  }

  if (key === "ArrowUp") {
    return { dx: 0, dy: -amount };
  }

  if (key === "ArrowDown") {
    return { dx: 0, dy: amount };
  }

  return null;
}
