export const CANVAS_SIZE = 640;

export const EXPORT_SIZE = 700;

const FOOTER_LAYOUT = {
  heightRatio: 0.56,
  titleCenterRatio: 0.38,
  titleAloneCenterRatio: 0.45,
  titleMaxFontRatio: 0.36,
  titleDescentRatio: 0.36,
  titlePaddingRatio: 0.04,
  sidePaddingRatio: 0.06,
  titleMinFontPoints: 10,
  iconCenterRatio: 0.74,
  iconSizeRatio: 0.18
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

function getTitleMaxWidth(metrics, fontSize) {
  const bottomY = metrics.titleCenterY + fontSize * FOOTER_LAYOUT.titleDescentRatio;
  const distanceY = Math.min(Math.abs(bottomY - metrics.centerY), metrics.radius);
  const chord = 2 * Math.sqrt(metrics.radius * metrics.radius - distanceY * distanceY);
  const padding = metrics.radius * FOOTER_LAYOUT.titlePaddingRatio;

  return Math.max(chord - padding * 2, 0);
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

  return {
    text: content,
    fontSize: Math.max(fontSize, minFontSize)
  };
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
