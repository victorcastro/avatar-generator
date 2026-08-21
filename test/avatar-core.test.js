const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ROLE_CONFIG,
  FONT_AWESOME_GLYPHS,
  CANVAS_SIZE,
  EXPORT_SIZE,
  SCALE_LIMITS,
  AUTO_ZOOM_ON_LOAD,
  PAN_MIN_OVERLAP,
  getCompositionMetrics,
  getExportScale,
  getFittedTitle,
  getImageDrawBounds,
  getDownloadFilename,
  getPanBounds,
  clampLayerOffsets,
  clampScaleMultiplier,
  getZoomAtPoint,
  getWheelScaleMultiplier,
  getCanvasPoint,
  getKeyboardPanStep,
  getActiveLayer,
  getDropTargetLayer,
  getLayerHint,
  getDefaultLayerTransform,
  isAcceptedImageType,
  hasAlphaChannel,
  getAlphaSampleSize,
  getCutoutProgressMessage
} = require("../src/avatar-core.js");

test("role config keeps every supported selector option mapped to a drawable icon", () => {
  const expectedRoles = ["ios", "android", "react", "qa", "adm", "pm", "po"];

  assert.deepEqual(Object.keys(ROLE_CONFIG), expectedRoles);

  for (const [roleKey, role] of Object.entries(ROLE_CONFIG)) {
    assert.ok(["fontawesome", "svg"].includes(role.iconProvider), `Unknown provider for ${roleKey}`);
    assert.ok(role.iconName);
    assert.ok(FONT_AWESOME_GLYPHS[role.iconName], `Missing glyph for ${roleKey}`);
  }
});

test("svg roles carry a source path and keep a Font Awesome glyph as fallback", () => {
  assert.equal(ROLE_CONFIG.ios.iconProvider, "svg");
  assert.equal(ROLE_CONFIG.ios.iconSrc, "icons/swift.svg");
  assert.ok(FONT_AWESOME_GLYPHS[ROLE_CONFIG.ios.iconName]);

  for (const role of Object.values(ROLE_CONFIG)) {
    if (role.iconProvider === "svg") {
      assert.ok(role.iconSrc, "an svg role needs a source path");
    }
  }
});

test("composition metrics keep the footer inside the circular avatar", () => {
  const metrics = getCompositionMetrics(640);

  assert.equal(metrics.centerX, 320);
  assert.equal(metrics.centerY, 320);
  assert.equal(metrics.borderWidth, 4);
  assert.ok(metrics.clipRadius < metrics.radius);
  assert.ok(metrics.footerTop > metrics.centerY);
  assert.ok(metrics.footerTop < metrics.centerY + metrics.clipRadius);
  assert.ok(metrics.footerHeight > 0);
});

test("the download is exported as a 700px square scaled from the working canvas", () => {
  assert.equal(EXPORT_SIZE, 700);
  assert.equal(CANVAS_SIZE, 640);
  assert.equal(getExportScale(), EXPORT_SIZE / CANVAS_SIZE);
});

test("metrics built for a bigger canvas are not a pure scale of the working ones", () => {
  const working = getCompositionMetrics(CANVAS_SIZE);
  const resized = getCompositionMetrics(EXPORT_SIZE);
  const scale = getExportScale();

  assert.ok(Math.abs(resized.centerX - working.centerX * scale) < 0.000001);
  assert.notEqual(resized.clipRadius, working.clipRadius * scale);
  assert.equal(resized.borderWidth, working.borderWidth);
});

test("title fitting falls back to the role label and never shrinks below the minimum size", () => {
  const fitted = getFittedTitle("   ", 20, ROLE_CONFIG.ios.label, (text, fontSize) => text.length * fontSize);

  assert.equal(fitted.text, "iOS");
  assert.ok(Math.abs(fitted.fontSize - 13.333333333333334) < 0.000001);
});

test("title fitting reduces font size when the available width is smaller", () => {
  const roomy = getFittedTitle("Tech Lead iOS", 500, ROLE_CONFIG.ios.label, (text, fontSize) => text.length * fontSize * 0.45);
  const tight = getFittedTitle("Tech Lead iOS", 120, ROLE_CONFIG.ios.label, (text, fontSize) => text.length * fontSize * 0.45);

  assert.ok(tight.fontSize < roomy.fontSize);
});

test("image draw bounds cover the full circular clip area before offsets", () => {
  const metrics = getCompositionMetrics(640);
  const bounds = getImageDrawBounds({ width: 400, height: 200 }, 1, 0, 0, metrics);

  assert.ok(bounds.width >= metrics.clipRadius * 2);
  assert.ok(bounds.height >= metrics.clipRadius * 2);
  assert.equal(bounds.left, metrics.centerX - bounds.width / 2);
  assert.equal(bounds.top, metrics.centerY - bounds.height / 2);
});

test("a square image at scale 1 pans far past the exact cover instead of locking", () => {
  const metrics = getCompositionMetrics(640);
  const diameter = metrics.clipRadius * 2;
  const bounds = getPanBounds({ width: 1000, height: 1000 }, 1, metrics);
  const expected = diameter - PAN_MIN_OVERLAP * diameter;

  assert.ok(Math.abs(bounds.maxOffsetX - expected) < 0.000001);
  assert.equal(bounds.maxOffsetX, bounds.maxOffsetY);
});

test("zooming a square image unlocks symmetric panning slack on both axes", () => {
  const metrics = getCompositionMetrics(640);
  const bounds = getPanBounds({ width: 1000, height: 1000 }, 1.5, metrics);

  assert.ok(bounds.maxOffsetX > 0);
  assert.equal(bounds.maxOffsetX, bounds.maxOffsetY);
});

test("a wide image at scale 1 pans on both axes and travels further across the long side", () => {
  const metrics = getCompositionMetrics(640);
  const bounds = getPanBounds({ width: 400, height: 200 }, 1, metrics);

  assert.ok(bounds.maxOffsetY > 0);
  assert.ok(bounds.maxOffsetX > bounds.maxOffsetY);
});

test("a square image below scale 1 shrinks to a fraction of the clip diameter", () => {
  const metrics = getCompositionMetrics(640);
  const bounds = getImageDrawBounds({ width: 1000, height: 1000 }, 0.5, 0, 0, metrics);

  assert.ok(Math.abs(bounds.width - metrics.clipRadius) < 0.000001);
  assert.ok(Math.abs(bounds.height - metrics.clipRadius) < 0.000001);
});

test("a square image below scale 1 pans past the circle edge instead of locking", () => {
  const metrics = getCompositionMetrics(640);
  const bounds = getPanBounds({ width: 1000, height: 1000 }, 0.5, metrics);
  const expected = metrics.clipRadius * 1.25;

  assert.ok(Math.abs(bounds.maxOffsetX - expected) < 0.000001);
  assert.equal(bounds.maxOffsetX, bounds.maxOffsetY);
});

test("a fully panned image keeps the minimum overlap with the circular clip", () => {
  const metrics = getCompositionMetrics(640);
  const image = { width: 1000, height: 1000 };
  const { maxOffsetX, maxOffsetY } = getPanBounds(image, 0.5, metrics);
  const clamped = clampLayerOffsets(image, 0.5, 500, -500, metrics);
  const bounds = getImageDrawBounds(image, 0.5, clamped.offsetX, clamped.offsetY, metrics);
  const overlap = metrics.centerX + metrics.clipRadius - bounds.left;

  assert.deepEqual(clamped, { offsetX: maxOffsetX, offsetY: -maxOffsetY });
  assert.ok(Math.abs(overlap - PAN_MIN_OVERLAP * bounds.width) < 0.000001);
});

test("every supported zoom keeps panning available, including the lowest one", () => {
  const metrics = getCompositionMetrics(640);
  const image = { width: 1000, height: 1000 };

  assert.ok(getPanBounds(image, SCALE_LIMITS.min, metrics).maxOffsetX > 0);
  assert.ok(getPanBounds(image, SCALE_LIMITS.max, metrics).maxOffsetX > 0);
  assert.ok(
    getPanBounds(image, SCALE_LIMITS.max, metrics).maxOffsetX >
      getPanBounds(image, SCALE_LIMITS.min, metrics).maxOffsetX
  );
});

test("pan bounds collapse to zero when no image is loaded", () => {
  const metrics = getCompositionMetrics(640);

  assert.deepEqual(getPanBounds(null, 1.5, metrics), { maxOffsetX: 0, maxOffsetY: 0 });
});

test("offsets are clamped to the pan bounds in both directions", () => {
  const metrics = getCompositionMetrics(640);
  const image = { width: 1000, height: 1000 };
  const { maxOffsetX, maxOffsetY } = getPanBounds(image, 1.5, metrics);

  assert.deepEqual(clampLayerOffsets(image, 1.5, 500, 500, metrics), {
    offsetX: maxOffsetX,
    offsetY: maxOffsetY
  });
  assert.deepEqual(clampLayerOffsets(image, 1.5, -500, -500, metrics), {
    offsetX: -maxOffsetX,
    offsetY: -maxOffsetY
  });
  assert.deepEqual(clampLayerOffsets(image, 1.5, 5, -5, metrics), { offsetX: 5, offsetY: -5 });
});

test("offsets valid at high zoom are pulled back in when the zoom is reduced", () => {
  const metrics = getCompositionMetrics(640);
  const image = { width: 1000, height: 1000 };
  const wide = getPanBounds(image, 1.8, metrics);
  const tight = getPanBounds(image, 1, metrics);
  const reclamped = clampLayerOffsets(image, 1, wide.maxOffsetX, wide.maxOffsetY, metrics);

  assert.ok(wide.maxOffsetX > tight.maxOffsetX);
  assert.equal(reclamped.offsetX, tight.maxOffsetX);
  assert.equal(reclamped.offsetY, tight.maxOffsetY);
});

test("scale multiplier is clamped to the supported range", () => {
  assert.equal(clampScaleMultiplier(0.05), SCALE_LIMITS.min);
  assert.equal(clampScaleMultiplier(5), SCALE_LIMITS.max);
  assert.equal(clampScaleMultiplier(1.4), 1.4);
  assert.equal(clampScaleMultiplier(0.5), 0.5);
});

test("a corrupted scale recovers on the auto zoom instead of the lowest limit", () => {
  assert.equal(getWheelScaleMultiplier(0, -100, 0), AUTO_ZOOM_ON_LOAD);
  assert.equal(getWheelScaleMultiplier(Number.NaN, -100, 0), AUTO_ZOOM_ON_LOAD);
});

test("zooming at a pointer keeps the image point under the cursor pinned", () => {
  const metrics = getCompositionMetrics(640);
  const image = { width: 2000, height: 2000 };
  const pointerX = 360;
  const pointerY = 300;
  const before = getImageDrawBounds(image, 1.2, 10, -5, metrics);
  const zoomed = getZoomAtPoint({
    image,
    metrics,
    scaleMultiplier: 1.2,
    offsetX: 10,
    offsetY: -5,
    nextScaleMultiplier: 1.5,
    pointerX,
    pointerY
  });
  const after = getImageDrawBounds(image, zoomed.scaleMultiplier, zoomed.offsetX, zoomed.offsetY, metrics);

  const beforeRatioX = (pointerX - before.left) / before.width;
  const afterRatioX = (pointerX - after.left) / after.width;
  const beforeRatioY = (pointerY - before.top) / before.height;
  const afterRatioY = (pointerY - after.top) / after.height;

  assert.ok(Math.abs(beforeRatioX - afterRatioX) < 0.000001);
  assert.ok(Math.abs(beforeRatioY - afterRatioY) < 0.000001);
});

test("the pan clamp overrides the anchor when zooming out past the pan bounds", () => {
  const metrics = getCompositionMetrics(640);
  const image = { width: 1000, height: 1000 };
  const wide = getPanBounds(image, 1.8, metrics);
  const tight = getPanBounds(image, 1, metrics);
  const zoomed = getZoomAtPoint({
    image,
    metrics,
    scaleMultiplier: 1.8,
    offsetX: wide.maxOffsetX,
    offsetY: wide.maxOffsetY,
    nextScaleMultiplier: 1,
    pointerX: 600,
    pointerY: 600
  });

  assert.equal(zoomed.scaleMultiplier, 1);
  assert.equal(zoomed.offsetX, tight.maxOffsetX);
  assert.equal(zoomed.offsetY, tight.maxOffsetY);
});

test("zooming anchored at the canvas center scales the offsets proportionally", () => {
  const metrics = getCompositionMetrics(640);
  const image = { width: 2000, height: 2000 };
  const zoomed = getZoomAtPoint({
    image,
    metrics,
    scaleMultiplier: 1.2,
    offsetX: 30,
    offsetY: -20,
    nextScaleMultiplier: 1.5,
    pointerX: metrics.centerX,
    pointerY: metrics.centerY
  });
  const ratio = 1.5 / 1.2;

  assert.ok(Math.abs(zoomed.offsetX - 30 * ratio) < 0.000001);
  assert.ok(Math.abs(zoomed.offsetY - -20 * ratio) < 0.000001);
});

test("wheel zoom follows the scroll direction and is reversible", () => {
  const zoomedIn = getWheelScaleMultiplier(1.2, -100, 0);
  const zoomedOut = getWheelScaleMultiplier(1.2, 100, 0);

  assert.ok(zoomedIn > 1.2);
  assert.ok(zoomedOut < 1.2);
  assert.ok(Math.abs(getWheelScaleMultiplier(zoomedIn, 100, 0) - 1.2) < 0.000001);
});

test("wheel zoom normalizes line and page delta modes and stays within limits", () => {
  assert.ok(getWheelScaleMultiplier(1.2, -10, 1) > getWheelScaleMultiplier(1.2, -10, 0));
  assert.equal(getWheelScaleMultiplier(1.2, -10000, 0), SCALE_LIMITS.max);
  assert.equal(getWheelScaleMultiplier(1.2, 10000, 0), SCALE_LIMITS.min);
});

test("pointer coordinates are rescaled from CSS pixels to canvas pixels", () => {
  const rect = { left: 0, top: 0, width: 560, height: 560 };

  assert.deepEqual(getCanvasPoint(280, 280, rect, 640), { x: 320, y: 320 });

  const offsetRect = { left: 100, top: 40, width: 560, height: 560 };
  const point = getCanvasPoint(380, 320, offsetRect, 640);

  assert.equal(point.x, 320);
  assert.ok(Math.abs(point.y - 320) < 0.000001);
});

test("the active layer follows Alt and falls back so dragging is never dead", () => {
  const layerFor = (altKey, hasPortrait, hasBackground) =>
    getActiveLayer({ altKey, hasPortrait, hasBackground });

  assert.equal(layerFor(false, true, true), "portrait");
  assert.equal(layerFor(false, true, false), "portrait");
  assert.equal(layerFor(false, false, true), "background");
  assert.equal(layerFor(false, false, false), null);
  assert.equal(layerFor(true, true, true), "background");
  assert.equal(layerFor(true, false, true), "background");
  assert.equal(layerFor(true, true, false), null);
  assert.equal(layerFor(true, false, false), null);
});

test("a drop targets the layer chosen by Alt regardless of what is loaded", () => {
  assert.equal(getDropTargetLayer(true), "background");
  assert.equal(getDropTargetLayer(false), "portrait");
});

test("arrow keys pan by one pixel and by ten while shift is held", () => {
  assert.deepEqual(getKeyboardPanStep("ArrowLeft", false), { dx: -1, dy: 0 });
  assert.deepEqual(getKeyboardPanStep("ArrowRight", false), { dx: 1, dy: 0 });
  assert.deepEqual(getKeyboardPanStep("ArrowUp", false), { dx: 0, dy: -1 });
  assert.deepEqual(getKeyboardPanStep("ArrowDown", false), { dx: 0, dy: 1 });
  assert.deepEqual(getKeyboardPanStep("ArrowDown", true), { dx: 0, dy: 10 });
  assert.equal(getKeyboardPanStep("Enter", false), null);
});

test("both layers accept PNG, JPEG and WEBP and reject anything else", () => {
  assert.equal(isAcceptedImageType("portrait", "image/png"), true);
  assert.equal(isAcceptedImageType("portrait", "image/jpeg"), true);
  assert.equal(isAcceptedImageType("portrait", "image/webp"), true);
  assert.equal(isAcceptedImageType("background", "image/jpeg"), true);
  assert.equal(isAcceptedImageType("background", "image/webp"), true);
  assert.equal(isAcceptedImageType("background", ""), false);
  assert.equal(isAcceptedImageType("portrait", "application/pdf"), false);
});

test("non-standard image mime types are normalized before being matched", () => {
  assert.equal(isAcceptedImageType("background", "image/jpg"), true);
  assert.equal(isAcceptedImageType("background", "IMAGE/JPEG"), true);
  assert.equal(isAcceptedImageType("background", " image/pjpeg "), true);
  assert.equal(isAcceptedImageType("portrait", "image/x-png"), true);
});

test("a file with no mime type falls back to its extension", () => {
  assert.equal(isAcceptedImageType("background", "", "wallpaper.jpeg"), true);
  assert.equal(isAcceptedImageType("background", "", "WALLPAPER.JPG"), true);
  assert.equal(isAcceptedImageType("portrait", undefined, "cutout.webp"), true);
  assert.equal(isAcceptedImageType("background", "", "notes.pdf"), false);
  assert.equal(isAcceptedImageType("background", "", ""), false);
});

test("a declared mime type still wins over the extension", () => {
  assert.equal(isAcceptedImageType("background", "application/pdf", "fake.jpg"), false);
});

test("alpha detection only reports images that carry a non-opaque pixel", () => {
  const opaque = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]);
  const translucent = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 254]);
  const cutout = new Uint8ClampedArray([10, 20, 30, 0, 40, 50, 60, 255]);

  assert.equal(hasAlphaChannel(opaque), false);
  assert.equal(hasAlphaChannel(translucent), true);
  assert.equal(hasAlphaChannel(cutout), true);
  assert.equal(hasAlphaChannel(null), false);
});

test("the alpha sample is capped on its longest side and never collapses to zero", () => {
  assert.deepEqual(getAlphaSampleSize(4096, 2048), { width: 256, height: 128 });
  assert.deepEqual(getAlphaSampleSize(120, 60), { width: 120, height: 60 });
  assert.deepEqual(getAlphaSampleSize(4096, 1), { width: 256, height: 1 });
  assert.deepEqual(getAlphaSampleSize(0, 0), { width: 0, height: 0 });
});

test("cutout progress names the phase and clamps the percentage", () => {
  assert.equal(
    getCutoutProgressMessage("fetch:/models/isnet_quint8", 22, 44),
    "Downloading the background remover 50%"
  );
  assert.equal(getCutoutProgressMessage("compute:inference", 1, 1), "Removing the background 100%");
  assert.equal(getCutoutProgressMessage("compute:inference", 1, 0), "Removing the background 0%");
  assert.equal(getCutoutProgressMessage("", 3, 2), "Removing the background 100%");
});

test("the hint names the Alt shortcut only when a background is available", () => {
  const withBoth = getLayerHint({ layer: "portrait", hasPortrait: true, hasBackground: true });
  const portraitOnly = getLayerHint({ layer: "portrait", hasPortrait: true, hasBackground: false });
  const empty = getLayerHint({ layer: null, hasPortrait: false, hasBackground: false });

  assert.match(withBoth, /Alt/);
  assert.doesNotMatch(portraitOnly, /Alt/);
  assert.match(empty, /Add a portrait/);
});

test("a background left on its own is dragged without Alt", () => {
  const alone = getLayerHint({ layer: "background", hasPortrait: false, hasBackground: true });
  const withPortrait = getLayerHint({ layer: "background", hasPortrait: true, hasBackground: true });

  assert.doesNotMatch(alone, /Alt/);
  assert.match(withPortrait, /Alt/);
});

test("layer defaults preserve the portrait nudge and load images already zoomed", () => {
  const portrait = getDefaultLayerTransform("portrait");
  const background = getDefaultLayerTransform("background");

  assert.equal(portrait.offsetY, 12);
  assert.equal(portrait.scale, 1.1);
  assert.equal(background.offsetY, 0);
  assert.equal(background.scale, 1.1);
});

test("download filename sanitizes the title and falls back to the role label", () => {
  assert.equal(getDownloadFilename("Tech Lead iOS", ROLE_CONFIG.ios.label), "avatar-tech-lead-ios.png");
  assert.equal(getDownloadFilename("   ", ROLE_CONFIG.pm.label), "avatar-pm.png");
  assert.equal(getDownloadFilename("QA / Mobile + Web", ROLE_CONFIG.qa.label), "avatar-qa-mobile-web.png");
});
