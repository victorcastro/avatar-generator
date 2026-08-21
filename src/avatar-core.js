(function (globalScope) {
  const ROLE_CONFIG = {
    ios: {
      label: "iOS",
      iconProvider: "svg",
      iconSrc: "icons/swift.svg",
      iconStyle: "brands",
      iconName: "swift",
      iconLabel: "Swift"
    },
    android: {
      label: "Android",
      iconProvider: "fontawesome",
      iconStyle: "brands",
      iconName: "android",
      iconLabel: "Android"
    },
    react: {
      label: "React",
      iconProvider: "fontawesome",
      iconStyle: "brands",
      iconName: "react",
      iconLabel: "React"
    },
    qa: {
      label: "QA",
      iconProvider: "fontawesome",
      iconStyle: "solid",
      iconName: "bug",
      iconLabel: "Bug"
    },
    adm: {
      label: "ADM",
      iconProvider: "fontawesome",
      iconStyle: "solid",
      iconName: "compass",
      iconLabel: "Compass"
    },
    pm: {
      label: "PM",
      iconProvider: "fontawesome",
      iconStyle: "solid",
      iconName: "briefcase",
      iconLabel: "Briefcase"
    },
    po: {
      label: "PO",
      iconProvider: "fontawesome",
      iconStyle: "solid",
      iconName: "bullseye",
      iconLabel: "Bullseye"
    }
  };

  const FONT_AWESOME_GLYPHS = {
    swift: "\uf8e1",
    android: "\uf17b",
    react: "\uf41b",
    bug: "\uf188",
    compass: "\uf14e",
    briefcase: "\uf0b1",
    bullseye: "\uf140"
  };

  const SCALE_LIMITS = { min: 1, max: 1.8, step: 0.01 };

  const AUTO_ZOOM_ON_LOAD = 1.1;

  const LAYER_DEFAULTS = {
    background: { offsetX: 0, offsetY: 0, scale: AUTO_ZOOM_ON_LOAD },
    portrait: { offsetX: 0, offsetY: 12, scale: AUTO_ZOOM_ON_LOAD }
  };

  const KEYBOARD_PAN_STEP = { normal: 1, fast: 10 };

  const ACCEPTED_IMAGE_TYPES = {
    background: ["image/png", "image/jpeg", "image/webp"],
    portrait: ["image/png"]
  };

  const WHEEL_ZOOM_SENSITIVITY = 0.0015;
  const WHEEL_LINE_HEIGHT = 16;
  const WHEEL_PAGE_HEIGHT = 400;

  function ptToPx(points) {
    return points * (96 / 72);
  }

  function getCompositionMetrics(canvasSize) {
    const size = canvasSize;
    const centerX = size / 2;
    const centerY = size / 2;
    const borderWidth = 4;
    const radius = size * 0.36;
    const clipRadius = radius - borderWidth / 2;
    const footerHeight = radius * 0.56;
    const footerTop = centerY + clipRadius - footerHeight;

    return {
      size,
      centerX,
      centerY,
      radius,
      clipRadius,
      borderWidth,
      footerHeight,
      footerTop
    };
  }

  function getFittedTitle(text, maxWidth, roleLabel, measureTextWidth) {
    const content = text.trim() || roleLabel;
    const maxFontSize = ptToPx(26);
    const minFontSize = ptToPx(10);
    let fontSize = maxFontSize;

    while (fontSize >= minFontSize) {
      if (measureTextWidth(content, fontSize) <= maxWidth) {
        break;
      }

      fontSize -= 1;
    }

    return {
      text: content,
      fontSize: Math.max(fontSize, minFontSize)
    };
  }

  function getImageDrawBounds(image, scaleMultiplier, offsetX, offsetY, metrics) {
    const baseScale = Math.max(
      (metrics.clipRadius * 2) / image.width,
      (metrics.clipRadius * 2) / image.height
    );
    const scale = baseScale * scaleMultiplier;
    const width = image.width * scale;
    const height = image.height * scale;
    const left = metrics.centerX - width / 2 + offsetX;
    const top = metrics.centerY - height / 2 + offsetY;

    return {
      left,
      top,
      width,
      height,
      scale
    };
  }

  function clampNumber(value, minValue, maxValue) {
    if (!Number.isFinite(value)) {
      return minValue;
    }

    return Math.min(Math.max(value, minValue), maxValue);
  }

  function getPanBounds(image, scaleMultiplier, metrics) {
    if (!image) {
      return { maxOffsetX: 0, maxOffsetY: 0 };
    }

    const bounds = getImageDrawBounds(image, scaleMultiplier, 0, 0, metrics);
    const diameter = metrics.clipRadius * 2;

    return {
      maxOffsetX: Math.max(0, (bounds.width - diameter) / 2),
      maxOffsetY: Math.max(0, (bounds.height - diameter) / 2)
    };
  }

  function clampLayerOffsets(image, scaleMultiplier, offsetX, offsetY, metrics) {
    const { maxOffsetX, maxOffsetY } = getPanBounds(image, scaleMultiplier, metrics);

    return {
      offsetX: clampNumber(offsetX, -maxOffsetX, maxOffsetX),
      offsetY: clampNumber(offsetY, -maxOffsetY, maxOffsetY)
    };
  }

  function clampScaleMultiplier(value) {
    return clampNumber(Number(value), SCALE_LIMITS.min, SCALE_LIMITS.max);
  }

  function getZoomAtPoint(options) {
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

  function getWheelScaleMultiplier(scaleMultiplier, deltaY, deltaMode) {
    let normalized = Number(deltaY) || 0;

    if (deltaMode === 1) {
      normalized *= WHEEL_LINE_HEIGHT;
    } else if (deltaMode === 2) {
      normalized *= WHEEL_PAGE_HEIGHT;
    }

    const current = Number(scaleMultiplier);

    if (!(current > 0)) {
      return SCALE_LIMITS.min;
    }

    return clampScaleMultiplier(current * Math.exp(-normalized * WHEEL_ZOOM_SENSITIVITY));
  }

  function getCanvasPointerScale(rect, canvasSize) {
    return {
      x: rect.width ? canvasSize / rect.width : 1,
      y: rect.height ? canvasSize / rect.height : 1
    };
  }

  function getCanvasPoint(clientX, clientY, rect, canvasSize) {
    const pointerScale = getCanvasPointerScale(rect, canvasSize);

    return {
      x: (clientX - rect.left) * pointerScale.x,
      y: (clientY - rect.top) * pointerScale.y
    };
  }

  function getKeyboardPanStep(key, shiftKey) {
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

  function getActiveLayer(options) {
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

  function getDropTargetLayer(altKey) {
    return altKey ? "background" : "portrait";
  }

  function getLayerHint(options) {
    const { layer, hasPortrait, hasBackground, canPan } = options;

    if (!hasPortrait && !hasBackground) {
      return "Add a portrait or a background to start composing";
    }

    if (!layer) {
      return "Add a background image to move it with Alt";
    }

    if (canPan === false) {
      return `Zoom in to unlock panning on the ${layer}`;
    }

    if (layer === "background") {
      return "Moving the background — release Alt to move the portrait";
    }

    if (hasBackground) {
      return "Drag to move the portrait — hold Alt to move the background";
    }

    return "Drag to move the portrait — scroll to zoom, double-click to center";
  }

  function getDefaultLayerTransform(layer) {
    const defaults = LAYER_DEFAULTS[layer] || LAYER_DEFAULTS.portrait;

    return { offsetX: defaults.offsetX, offsetY: defaults.offsetY, scale: defaults.scale };
  }

  function isAcceptedImageType(layer, mimeType) {
    const accepted = ACCEPTED_IMAGE_TYPES[layer];

    if (!accepted || !mimeType) {
      return false;
    }

    return accepted.includes(mimeType);
  }

  function getDownloadFilename(titleText, roleLabel) {
    const safeRole = roleLabel.toLowerCase();
    const safeTitle = (titleText.trim() || safeRole).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `avatar-${safeTitle || safeRole}.png`;
  }

  const api = {
    ROLE_CONFIG,
    FONT_AWESOME_GLYPHS,
    SCALE_LIMITS,
    AUTO_ZOOM_ON_LOAD,
    LAYER_DEFAULTS,
    KEYBOARD_PAN_STEP,
    ACCEPTED_IMAGE_TYPES,
    ptToPx,
    getCompositionMetrics,
    getFittedTitle,
    getImageDrawBounds,
    getDownloadFilename,
    clampNumber,
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
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.AvatarCore = api;
})(typeof window !== "undefined" ? window : globalThis);
