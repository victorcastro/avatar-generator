const {
  ROLE_CONFIG,
  FONT_AWESOME_GLYPHS,
  getCompositionMetrics: getCoreCompositionMetrics,
  getFittedTitle: getCoreFittedTitle,
  getImageDrawBounds,
  getDownloadFilename,
  getPanBounds,
  clampLayerOffsets,
  clampScaleMultiplier,
  getZoomAtPoint,
  getWheelScaleMultiplier,
  getCanvasPointerScale,
  getCanvasPoint,
  getKeyboardPanStep,
  getActiveLayer,
  getDropTargetLayer,
  getLayerHint,
  getDefaultLayerTransform,
  isAcceptedImageType
} = window.AvatarCore;

const canvas = document.getElementById("avatarCanvas");
const context = canvas.getContext("2d");
const lucideLibrary = window.lucide;

const state = {
  role: "ios",
  titleText: "Tech Lead iOS",
  backgroundScale: 1,
  backgroundOffsetX: 0,
  backgroundOffsetY: 0,
  backgroundImage: null,
  portraitScale: 1,
  portraitOffsetX: 0,
  portraitOffsetY: 12,
  portraitImage: null
};

const controls = {
  role: document.getElementById("role"),
  titleText: document.getElementById("titleText"),
  backgroundUpload: document.getElementById("backgroundUpload"),
  backgroundScale: document.getElementById("backgroundScale"),
  portraitUpload: document.getElementById("portraitUpload"),
  portraitScale: document.getElementById("portraitScale"),
  downloadButton: document.getElementById("downloadButton"),
  canvasFrame: document.getElementById("canvasFrame"),
  canvasHint: document.getElementById("canvasHint"),
  canvasStatus: document.getElementById("canvasStatus"),
  backgroundDropzone: document.getElementById("backgroundDropzone"),
  portraitDropzone: document.getElementById("portraitDropzone"),
  backgroundFileName: document.getElementById("backgroundFileName"),
  portraitFileName: document.getElementById("portraitFileName")
};

const LAYER_KEYS = {
  background: {
    image: "backgroundImage",
    scale: "backgroundScale",
    offsetX: "backgroundOffsetX",
    offsetY: "backgroundOffsetY",
    scaleControl: "backgroundScale",
    fileName: "backgroundFileName"
  },
  portrait: {
    image: "portraitImage",
    scale: "portraitScale",
    offsetX: "portraitOffsetX",
    offsetY: "portraitOffsetY",
    scaleControl: "portraitScale",
    fileName: "portraitFileName"
  }
};

const gesture = {
  pointerId: null,
  layer: null,
  lastClientX: 0,
  lastClientY: 0,
  pointerScale: { x: 1, y: 1 },
  travelled: 0,
  lastTravelled: 0
};

const DRAG_THRESHOLD = 4;

const CHECKER_TILE = 16;
const CHECKER_LIGHT = "#2b3038";
const CHECKER_DARK = "#22262d";
const PLACEHOLDER_RING = "rgba(255, 255, 255, 0.16)";

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo cargar la imagen"));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

function getLucideData(name) {
  if (!lucideLibrary || !lucideLibrary.icons) {
    return null;
  }

  return lucideLibrary.icons[name] || null;
}

function drawFontAwesomeIcon(iconName, iconStyle, centerX, centerY, size, color) {
  const glyph = FONT_AWESOME_GLYPHS[iconName];

  if (!glyph) {
    return;
  }

  context.save();
  context.fillStyle = color;
  context.font = `${iconStyle === "solid" ? 900 : 400} ${size}px ${
    iconStyle === "solid" ? '"Font Awesome 7 Free"' : '"Font Awesome 7 Brands"'
  }`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(glyph, centerX, centerY);
  context.restore();
}

function getCompositionMetrics() {
  return getCoreCompositionMetrics(canvas.width);
}

function getFittedTitle(text, maxWidth) {
  return getCoreFittedTitle(text, maxWidth, ROLE_CONFIG[state.role].label, (content, fontSize) => {
    context.font = `700 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    return context.measureText(content).width;
  });
}

function drawLucideNode(tagName, attrs) {
  switch (tagName) {
    case "path":
      context.stroke(new Path2D(attrs.d));
      break;
    case "circle":
      context.beginPath();
      context.arc(Number(attrs.cx), Number(attrs.cy), Number(attrs.r), 0, Math.PI * 2);
      context.stroke();
      break;
    case "rect":
      context.strokeRect(
        Number(attrs.x),
        Number(attrs.y),
        Number(attrs.width),
        Number(attrs.height)
      );
      break;
    default:
      break;
  }
}

function drawRoleIcon(role, centerX, centerY, size, color) {
  if (role.iconProvider === "fontawesome") {
    drawFontAwesomeIcon(role.iconName, role.iconStyle, centerX, centerY, size, color);
    return;
  }

  const iconData = getLucideData(role.iconName);

  if (!iconData) {
    return;
  }

  context.save();
  context.translate(centerX - size / 2, centerY - size / 2);
  context.scale(size / 24, size / 24);
  context.strokeStyle = color;
  context.lineWidth = 1.9;
  context.lineCap = "round";
  context.lineJoin = "round";

  iconData.forEach(([tagName, attrs]) => {
    drawLucideNode(tagName, attrs);
  });

  context.restore();
}

function withCircularClip(metrics, drawFn) {
  context.save();
  context.beginPath();
  context.arc(metrics.centerX, metrics.centerY, metrics.clipRadius, 0, Math.PI * 2);
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

// layer-background
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

// layer-blur
function drawLayerBlur(metrics) {
  if (!state.backgroundImage) {
    return;
  }

  withCircularClip(metrics, () => {
    context.fillStyle = "rgba(51, 51, 51, 0.35)";
    context.fillRect(0, 0, canvas.width, canvas.height);
  });
}

// layer-user
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

// layer-footer
function drawLayerFooter(metrics) {
  const footerPadding = metrics.clipRadius * 0.06;
  const footerWidth = metrics.clipRadius * 2 - footerPadding * 2;
  const titlePaddingX = metrics.clipRadius * 0.14;
  const titleMetrics = getFittedTitle(state.titleText, footerWidth - titlePaddingX * 4);
  const role = ROLE_CONFIG[state.role];

  withCircularClip(metrics, () => {
    context.fillStyle = "#090909";
    context.fillRect(
      metrics.centerX - footerWidth / 2,
      metrics.footerTop,
      footerWidth,
      metrics.footerHeight + 26
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
    context.fillText(titleMetrics.text, metrics.centerX, metrics.footerTop + metrics.footerHeight * 0.38);

    drawRoleIcon(
      role,
      metrics.centerX,
      metrics.footerTop + metrics.footerHeight * 0.74,
      metrics.clipRadius * 0.18,
      "#c8102e"
    );
  });
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
  if (state.backgroundImage || state.portraitImage) {
    return;
  }

  withCircularClip(metrics, () => {
    context.fillStyle = getCheckerPattern();
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = PLACEHOLDER_RING;
    context.lineWidth = 2;
    context.setLineDash([10, 8]);
    context.beginPath();
    context.arc(metrics.centerX, metrics.centerY, metrics.clipRadius - 1, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  });
}

function drawAvatar(options) {
  const metrics = getCompositionMetrics();
  const showPlaceholder = !options || options.showPlaceholder !== false;

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (showPlaceholder) {
    drawLayerPlaceholder(metrics);
  }

  drawLayerBackground(metrics);
  drawLayerBlur(metrics);
  drawLayerUser(metrics);
  drawLayerFooter(metrics);
}

let pendingFrame = 0;

function requestRender() {
  if (pendingFrame) {
    return;
  }

  pendingFrame = window.requestAnimationFrame(() => {
    pendingFrame = 0;
    drawAvatar();
  });
}

function renderNow(options) {
  if (pendingFrame) {
    window.cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
  }

  drawAvatar(options);
}

function updateState(key, value) {
  state[key] = value;
  requestRender();
}

function setStatus(message) {
  controls.canvasStatus.textContent = message;
}

function hasLayerImage(layer) {
  return Boolean(state[LAYER_KEYS[layer].image]);
}

function resolveActiveLayer(altKey) {
  return getActiveLayer({
    altKey,
    hasPortrait: hasLayerImage("portrait"),
    hasBackground: hasLayerImage("background")
  });
}

function refreshHint(altKey) {
  const layer = resolveActiveLayer(altKey);
  let canPan = true;

  if (layer) {
    const keys = LAYER_KEYS[layer];
    const bounds = getPanBounds(state[keys.image], state[keys.scale], getCompositionMetrics());
    canPan = bounds.maxOffsetX > 0 || bounds.maxOffsetY > 0;
  }

  const hint = getLayerHint({
    layer,
    hasPortrait: hasLayerImage("portrait"),
    hasBackground: hasLayerImage("background"),
    canPan
  });

  if (controls.canvasHint.textContent !== hint) {
    controls.canvasHint.textContent = hint;
  }
}

function applyLayerTransform(layer, next) {
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

function applyZoom(layer, nextScale, pointerX, pointerY) {
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

function panLayer(layer, dx, dy) {
  const keys = LAYER_KEYS[layer];

  applyLayerTransform(layer, {
    scale: state[keys.scale],
    offsetX: state[keys.offsetX] + dx,
    offsetY: state[keys.offsetY] + dy
  });
}

async function handleImageInput(file, layer) {
  if (!file) {
    return;
  }

  const keys = LAYER_KEYS[layer];

  if (!isAcceptedImageType(layer, file.type)) {
    const message = `That file type is not supported for the ${layer}`;
    controls[keys.fileName].textContent = message;
    setStatus(message);
    return;
  }

  try {
    const image = await loadImageFromFile(file);
    state[keys.image] = image;
    applyLayerTransform(layer, getDefaultLayerTransform(layer));
    controls[keys.fileName].textContent = file.name;
    setStatus(`${file.name} loaded as the ${layer}`);
  } catch (error) {
    window.alert(error.message);
  }
}

controls.role.addEventListener("change", (event) => {
  updateState("role", event.target.value);
});

controls.titleText.addEventListener("input", (event) => {
  updateState("titleText", event.target.value);
});

function bindScaleControl(layer) {
  const keys = LAYER_KEYS[layer];

  controls[keys.scaleControl].addEventListener("input", (event) => {
    const metrics = getCompositionMetrics();
    applyZoom(layer, Number(event.target.value), metrics.centerX, metrics.centerY);
  });
}

bindScaleControl("background");
bindScaleControl("portrait");

function bindUploadControl(layer) {
  controls[`${layer}Upload`].addEventListener("change", (event) => {
    handleImageInput(event.target.files[0], layer);
    event.target.value = "";
  });
}

bindUploadControl("background");
bindUploadControl("portrait");

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
  gesture.pointerScale = getCanvasPointerScale(rect, canvas.width);
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
    const point = getCanvasPoint(event.clientX, event.clientY, rect, canvas.width);
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

function bindDropTarget(element, resolveLayer, activeClass, activeElement) {
  let enterCount = 0;
  const target = activeElement || element;

  element.addEventListener("dragenter", (event) => {
    event.preventDefault();
    enterCount += 1;
    target.classList.add(activeClass);
  });

  element.addEventListener("dragover", (event) => {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  });

  element.addEventListener("dragleave", () => {
    enterCount = Math.max(0, enterCount - 1);

    if (enterCount === 0) {
      target.classList.remove(activeClass);
    }
  });

  element.addEventListener("drop", (event) => {
    event.preventDefault();
    enterCount = 0;
    target.classList.remove(activeClass);

    const file = event.dataTransfer && event.dataTransfer.files[0];
    handleImageInput(file, resolveLayer(event));
  });
}

bindDropTarget(controls.backgroundDropzone, () => "background", "is-dragover");
bindDropTarget(controls.portraitDropzone, () => "portrait", "is-dragover");
bindDropTarget(
  canvas,
  (event) => getDropTargetLayer(event.altKey),
  "is-dropping",
  controls.canvasFrame
);

document.addEventListener("dragover", (event) => {
  event.preventDefault();
});

document.addEventListener("drop", (event) => {
  event.preventDefault();
});

controls.downloadButton.addEventListener("click", () => {
  renderNow({ showPlaceholder: false });
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = getDownloadFilename(state.titleText, ROLE_CONFIG[state.role].label);
  link.click();
  renderNow();
});

lucideLibrary.createIcons({
  attrs: {
    "stroke-width": 2.1
  }
});

refreshHint(false);
drawAvatar();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    requestRender();
  });
}
