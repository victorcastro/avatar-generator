export const CANVAS_SIZE = 640;

export const EXPORT_SIZE = 700;

const FOOTER_LAYOUT = {
  heightRatio: 0.48,
  titleCenterRatio: 0.38,
  titleAloneCenterRatio: 0.45,
  titleMaxFontRatio: 0.36,
  titleDescentRatio: 0.36,
  titlePaddingRatio: 0.12,
  sidePaddingRatio: 0.06,
  titleMinFontPoints: 10,
  iconCenterRatio: 0.74,
  iconSizeRatio: 0.18,
  twoLineMaxFontRatio: 0.24,
  twoLineHeightRatio: 1.15,
  dividerThickness: 4
};

export function ptToPx(points) {
  return points * (96 / 72);
}

export function getExportScale() {
  return EXPORT_SIZE / CANVAS_SIZE;
}

export function getCompositionMetrics(canvasSize, showIcon) {
  const size = Number(canvasSize) > 0 ? Number(canvasSize) : CANVAS_SIZE;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2;
  const footerHeight = radius * FOOTER_LAYOUT.heightRatio;
  const footerTop = centerY + radius - footerHeight;
  const withIcon = showIcon !== false;
  const titleRatio = withIcon
    ? FOOTER_LAYOUT.titleCenterRatio
    : FOOTER_LAYOUT.titleAloneCenterRatio;

  return {
    size,
    centerX,
    centerY,
    radius,
    footerHeight,
    footerTop,
    showIcon: withIcon,
    footerPadding: radius * FOOTER_LAYOUT.sidePaddingRatio,
    titleCenterY: footerTop + footerHeight * titleRatio,
    iconCenterY: footerTop + footerHeight * FOOTER_LAYOUT.iconCenterRatio,
    iconSize: radius * FOOTER_LAYOUT.iconSizeRatio
  };
}

function getChordWidth(metrics, bottomY) {
  const distanceY = Math.min(Math.abs(bottomY - metrics.centerY), metrics.radius);
  const chord = 2 * Math.sqrt(metrics.radius * metrics.radius - distanceY * distanceY);
  const padding = metrics.radius * FOOTER_LAYOUT.titlePaddingRatio;

  return Math.max(chord - padding * 2, 0);
}

function getTitleMaxWidth(metrics, fontSize) {
  return getChordWidth(metrics, metrics.titleCenterY + fontSize * FOOTER_LAYOUT.titleDescentRatio);
}

function splitInTwoLines(content, fontSize, measureTextWidth) {
  const words = content.split(/\s+/).filter(Boolean);
  let best = null;

  for (let index = 1; index < words.length; index += 1) {
    const lines = [words.slice(0, index).join(" "), words.slice(index).join(" ")];
    const width = Math.max(measureTextWidth(lines[0], fontSize), measureTextWidth(lines[1], fontSize));

    if (!best || width < best.width) {
      best = { lines, width };
    }
  }

  return best;
}

function getTwoLineTitle(content, metrics, minFontSize, measureTextWidth) {
  const maxFontSize = metrics.footerHeight * FOOTER_LAYOUT.twoLineMaxFontRatio;
  const blockTop = metrics.footerTop + FOOTER_LAYOUT.dividerThickness;
  const blockBottom = metrics.showIcon
    ? metrics.iconCenterY - metrics.iconSize / 2
    : metrics.size;

  for (let fontSize = Math.max(maxFontSize, minFontSize); ; fontSize -= 1) {
    const size = Math.max(fontSize, minFontSize);
    const split = splitInTwoLines(content, size, measureTextWidth);

    if (!split) {
      return null;
    }

    const lineHeight = size * FOOTER_LAYOUT.twoLineHeightRatio;
    const firstY = metrics.titleCenterY - lineHeight / 2;
    const secondY = metrics.titleCenterY + lineHeight / 2;
    const descent = size * FOOTER_LAYOUT.titleDescentRatio;
    const fits =
      firstY - size / 2 >= blockTop &&
      secondY + size / 2 <= blockBottom &&
      measureTextWidth(split.lines[0], size) <= getChordWidth(metrics, firstY + descent) &&
      measureTextWidth(split.lines[1], size) <= getChordWidth(metrics, secondY + descent);

    if (fits || size <= minFontSize) {
      return { text: content, lines: split.lines, lineHeight, fontSize: size };
    }
  }
}

export function getFittedTitle(text, metrics, roleLabel, measureTextWidth) {
  const content = text.trim() || roleLabel;
  const minFontSize = ptToPx(FOOTER_LAYOUT.titleMinFontPoints);
  let fontSize = metrics.footerHeight * FOOTER_LAYOUT.titleMaxFontRatio;

  while (
    fontSize > minFontSize &&
    measureTextWidth(content, fontSize) > getTitleMaxWidth(metrics, fontSize)
  ) {
    fontSize -= 1;
  }

  fontSize = Math.max(fontSize, minFontSize);

  if (measureTextWidth(content, fontSize) > getTitleMaxWidth(metrics, fontSize)) {
    const twoLines = getTwoLineTitle(content, metrics, minFontSize, measureTextWidth);

    if (twoLines) {
      return twoLines;
    }
  }

  return { text: content, lines: [content], lineHeight: 0, fontSize };
}

export function getImageDrawBounds(image, scaleMultiplier, offsetX, offsetY, metrics) {
  const baseScale = Math.max(
    (metrics.radius * 2) / image.width,
    (metrics.radius * 2) / image.height
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
