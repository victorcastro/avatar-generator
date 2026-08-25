import { ROLE_CONFIG } from "../core/roles.js";
import {
  CANVAS_SIZE,
  getCompositionMetrics as getCoreCompositionMetrics,
  getFittedTitle as getCoreFittedTitle,
  getImageDrawBounds
} from "../core/composition.js";
import { context } from "./dom.js";
import { state } from "./state.js";
import { drawRoleIcon } from "./icons.js";

const CHECKER_TILE = 16;
const CHECKER_LIGHT = "#2b3038";
const CHECKER_DARK = "#22262d";
const PLACEHOLDER_RING = "rgba(255, 255, 255, 0.16)";

export function getCompositionMetrics() {
  return getCoreCompositionMetrics(CANVAS_SIZE, state.showIcon);
}

function getFittedTitle(text, metrics) {
  return getCoreFittedTitle(text, metrics, ROLE_CONFIG[state.role].label, (content, fontSize) => {
    context.font = `700 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    return context.measureText(content).width;
  });
}

function withCircularClip(metrics, drawFn) {
  context.save();
  context.beginPath();
  context.arc(metrics.centerX, metrics.centerY, metrics.radius, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  drawFn();
  context.restore();
}

function drawLayerImage(image, scaleMultiplier, offsetX, offsetY, metrics) {
  const { left, top, width, height } = getImageDrawBounds(
    image,
    scaleMultiplier,
    offsetX,
    offsetY,
    metrics
  );

  context.drawImage(image, left, top, width, height);
}

let checkerPattern = null;

function getCheckerPattern() {
  if (checkerPattern) {
    return checkerPattern;
  }

  const tile = document.createElement("canvas");
  tile.width = CHECKER_TILE * 2;
  tile.height = CHECKER_TILE * 2;

  const tileContext = tile.getContext("2d");
  tileContext.fillStyle = CHECKER_LIGHT;
  tileContext.fillRect(0, 0, tile.width, tile.height);
  tileContext.fillStyle = CHECKER_DARK;
  tileContext.fillRect(0, 0, CHECKER_TILE, CHECKER_TILE);
  tileContext.fillRect(CHECKER_TILE, CHECKER_TILE, CHECKER_TILE, CHECKER_TILE);

  checkerPattern = context.createPattern(tile, "repeat");
  return checkerPattern;
}

function drawLayerPlaceholder(metrics) {
  const isEmpty = !state.backgroundImage && !state.portraitImage;

  withCircularClip(metrics, () => {
    context.fillStyle = getCheckerPattern();
    context.fillRect(0, 0, metrics.size, metrics.size);

    if (!isEmpty) {
      return;
    }

    context.strokeStyle = PLACEHOLDER_RING;
    context.lineWidth = 2;
    context.setLineDash([10, 8]);
    context.beginPath();
    context.arc(metrics.centerX, metrics.centerY, metrics.radius - 1, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  });
}

function drawLayerBackground(metrics) {
  if (!state.backgroundImage) {
    return;
  }

  withCircularClip(metrics, () => {
    drawLayerImage(
      state.backgroundImage,
      state.backgroundScale,
      state.backgroundOffsetX,
      state.backgroundOffsetY,
      metrics
    );
  });
}

function drawLayerBlur(metrics) {
  if (!state.backgroundImage) {
    return;
  }

  withCircularClip(metrics, () => {
    context.fillStyle = "rgba(51, 51, 51, 0.35)";
    context.fillRect(0, 0, metrics.size, metrics.size);
  });
}

function drawLayerUser(metrics) {
  if (!state.portraitImage) {
    return;
  }

  withCircularClip(metrics, () => {
    drawLayerImage(
      state.portraitImage,
      state.portraitScale,
      state.portraitOffsetX,
      state.portraitOffsetY,
      metrics
    );
  });
}

function drawLayerFooter(metrics) {
  const footerWidth = metrics.radius * 2 - metrics.footerPadding * 2;
  const titleMetrics = getFittedTitle(state.titleText, metrics);
  const role = ROLE_CONFIG[state.role];

  withCircularClip(metrics, () => {
    context.fillStyle = "#090909";
    context.fillRect(
      metrics.centerX - footerWidth / 2,
      metrics.footerTop,
      footerWidth,
      metrics.size - metrics.footerTop
    );

    context.fillStyle = "#c8102e";
    context.fillRect(
      metrics.centerX - footerWidth / 2,
      metrics.footerTop,
      footerWidth,
      4
    );

    context.fillStyle = "#d4d4d4";
    context.font = `700 ${titleMetrics.fontSize}px "Segoe UI", Arial, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(titleMetrics.text, metrics.centerX, metrics.titleCenterY);

    if (metrics.showIcon) {
      drawRoleIcon(role, metrics.centerX, metrics.iconCenterY, metrics.iconSize, "#c8102e");
    }
  });
}

export function drawAvatar(options) {
  const metrics = getCompositionMetrics();
  const showPlaceholder = !options || options.showPlaceholder !== false;

  context.clearRect(0, 0, metrics.size, metrics.size);

  if (showPlaceholder) {
    drawLayerPlaceholder(metrics);
  }

  drawLayerBackground(metrics);
  drawLayerBlur(metrics);
  drawLayerUser(metrics);
  drawLayerFooter(metrics);
}

let pendingFrame = 0;

export function requestRender() {
  if (pendingFrame) {
    return;
  }

  pendingFrame = window.requestAnimationFrame(() => {
    pendingFrame = 0;
    drawAvatar();
  });
}

export function renderNow(options) {
  if (pendingFrame) {
    window.cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
  }

  drawAvatar(options);
}

export function updateState(key, value) {
  state[key] = value;
  requestRender();
}
