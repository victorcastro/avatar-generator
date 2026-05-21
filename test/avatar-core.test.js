const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ROLE_CONFIG,
  FONT_AWESOME_GLYPHS,
  getCompositionMetrics,
  getFittedTitle,
  getImageDrawBounds,
  getPortraitOffsetYFromSlider,
  getDownloadFilename
} = require("../avatar-core.js");

test("role config keeps every supported selector option mapped to a Font Awesome icon", () => {
  const expectedRoles = ["ios", "android", "react", "qa", "adm", "pm", "po"];

  assert.deepEqual(Object.keys(ROLE_CONFIG), expectedRoles);

  for (const [roleKey, role] of Object.entries(ROLE_CONFIG)) {
    assert.equal(role.iconProvider, "fontawesome");
    assert.ok(role.iconName);
    assert.ok(FONT_AWESOME_GLYPHS[role.iconName], `Missing glyph for ${roleKey}`);
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

test("portrait vertical slider maps upward movement to a negative canvas offset", () => {
  assert.equal(getPortraitOffsetYFromSlider(40), -40);
  assert.equal(getPortraitOffsetYFromSlider(-12), 12);
});

test("download filename sanitizes the title and falls back to the role label", () => {
  assert.equal(getDownloadFilename("Tech Lead iOS", ROLE_CONFIG.ios.label), "avatar-tech-lead-ios.png");
  assert.equal(getDownloadFilename("   ", ROLE_CONFIG.pm.label), "avatar-pm.png");
  assert.equal(getDownloadFilename("QA / Mobile + Web", ROLE_CONFIG.qa.label), "avatar-qa-mobile-web.png");
});
