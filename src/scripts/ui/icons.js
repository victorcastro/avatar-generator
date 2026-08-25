import { FONT_AWESOME_GLYPHS } from "../core/roles.js";
import { context } from "./dom.js";

const svgIcons = new Map();

let notifyIconLoaded = () => {};

export function setIconLoadHandler(handler) {
  notifyIconLoaded = handler;
}

export function preloadSvgIcon(source) {
  if (svgIcons.has(source)) {
    return svgIcons.get(source);
  }

  const image = new Image();
  svgIcons.set(source, image);
  image.addEventListener("load", () => notifyIconLoaded());
  image.src = source;

  return image;
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

function drawSvgIcon(source, centerX, centerY, size) {
  const icon = preloadSvgIcon(source);

  if (!icon.complete || icon.naturalWidth === 0) {
    return false;
  }

  context.drawImage(icon, centerX - size / 2, centerY - size / 2, size, size);
  return true;
}

export function drawRoleIcon(role, centerX, centerY, size, color) {
  if (role.iconSrc && drawSvgIcon(role.iconSrc, centerX, centerY, size)) {
    return;
  }

  drawFontAwesomeIcon(role.iconName, role.iconStyle, centerX, centerY, size, color);
}
