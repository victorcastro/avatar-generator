import { controls } from "./dom.js";

export const state = {
  role: "ios",
  titleText: "",
  showIcon: true,
  backgroundScale: 1,
  backgroundOffsetX: 0,
  backgroundOffsetY: 0,
  backgroundImage: null,
  portraitScale: 1,
  portraitOffsetX: 0,
  portraitOffsetY: 12,
  portraitImage: null,
  removePortraitBackground: true
};

export const portraitSource = {
  file: null,
  originalImage: null,
  cutoutImage: null,
  requestId: 0,
  busy: false
};

export const LAYER_KEYS = {
  background: {
    image: "backgroundImage",
    scale: "backgroundScale",
    offsetX: "backgroundOffsetX",
    offsetY: "backgroundOffsetY",
    scaleControl: "backgroundScale",
    fileName: "backgroundFileName",
    clearButton: "backgroundClear"
  },
  portrait: {
    image: "portraitImage",
    scale: "portraitScale",
    offsetX: "portraitOffsetX",
    offsetY: "portraitOffsetY",
    scaleControl: "portraitScale",
    fileName: "portraitFileName",
    clearButton: "portraitClear"
  }
};

export function hasLayerImage(layer) {
  return Boolean(state[LAYER_KEYS[layer].image]);
}

export function setStatus(message) {
  controls.canvasStatus.textContent = message;
}
