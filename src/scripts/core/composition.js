export const CANVAS_SIZE = 640;

export const EXPORT_SIZE = 700;

// Spacing follows an 8 px grid with a 4 px half step (4, 8, 16, 24, 32, 40, 56...), in pixels of
// the working canvas (CANVAS_SIZE). They are scaled by size / CANVAS_SIZE only so the export
// matches the preview. None of them is derived from another or from a ratio.
//
// Vertical layout of the footer band, top to bottom (px at 640):
//    4  divider                       (half step)
//   16  padding                       (2 units)
//   44  title area                    (5.5 units; holds the title block, centred)
//   16  padding
//   56  icon box                      (7 units; the paddings are measured to the visible glyph,
//                                      which sits `iconInset` inside the box, set per role)
//   16  padding down to the circle's bottom edge
//  152  band height                   (19 units, 23.75% of the canvas)
// Without the icon the title area grows down to the bottom padding.
// Horizontally the band keeps 16 px from the circle and the title 40 px from the band's chord.
const FOOTER_LAYOUT = {
  heightPx: 152,
  dividerThicknessPx: 4,
  paddingPx: 16,
  iconSizePx: 56,
  sidePaddingPx: 16,
  titleSidePaddingPx: 40,
  titleMaxFontPx: 56,
  twoLineMaxFontPx: 24,
  titleCapHeightRatio: 0.72,
  titleDescentRatio: 0.36,
  titleMinFontPoints: 10,
  twoLineHeightRatio: 1.15
};

export function ptToPx(points) {
  return points * (96 / 72);
}

export function getExportScale() {
  return EXPORT_SIZE / CANVAS_SIZE;
}

// `iconInset` is the empty margin a role's glyph leaves inside its square box, as a fraction of the
// box on the top and on the bottom, so the paddings are measured to the visible glyph.
export function getCompositionMetrics(canvasSize, showIcon, iconInset = 0) {
  const size = Number(canvasSize) > 0 ? Number(canvasSize) : CANVAS_SIZE;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2;
  const bottom = centerY + radius;
  const withIcon = showIcon !== false;
  const pixelScale = size / CANVAS_SIZE;
  const footerHeight = FOOTER_LAYOUT.heightPx * pixelScale;
  const footerTop = bottom - footerHeight;
  const verticalPadding = FOOTER_LAYOUT.paddingPx * pixelScale;
  const dividerThickness = FOOTER_LAYOUT.dividerThicknessPx * pixelScale;
  const dividerBottom = footerTop + dividerThickness;
  const iconSize = FOOTER_LAYOUT.iconSizePx * pixelScale;
  const inset = Math.min(Math.max(Number(iconInset) || 0, 0), 0.45) * iconSize;
  const iconInkTop = bottom - verticalPadding - (iconSize - inset * 2);
  const iconTop = iconInkTop - inset;

  return {
    size,
    centerX,
    centerY,
    radius,
    footerHeight,
    footerTop,
    showIcon: withIcon,
    footerPadding: FOOTER_LAYOUT.sidePaddingPx * pixelScale,
    titleSidePadding: FOOTER_LAYOUT.titleSidePaddingPx * pixelScale,
    pixelScale,
    verticalPadding,
    dividerThickness,
    dividerBottom,
    titleAreaTop: dividerBottom + verticalPadding,
    titleAreaBottom: (withIcon ? iconInkTop : bottom) - verticalPadding,
    iconTop,
    iconInkTop,
    iconCenterY: iconTop + iconSize / 2,
    iconSize
  };
}

function layoutTitleLines(metrics, fontSize, lineCount) {
  const capHeight = fontSize * FOOTER_LAYOUT.titleCapHeightRatio;
  const lineHeight = lineCount > 1 ? fontSize * FOOTER_LAYOUT.twoLineHeightRatio : 0;
  const blockHeight = capHeight + lineHeight * (lineCount - 1);
  const areaHeight = metrics.titleAreaBottom - metrics.titleAreaTop;
  const top = metrics.titleAreaTop + (areaHeight - blockHeight) / 2;

  return {
    lineHeight,
    baselines: Array.from({ length: lineCount }, (_, index) => top + capHeight + lineHeight * index)
  };
}

function getChordWidth(metrics, bottomY) {
  const distanceY = Math.min(Math.abs(bottomY - metrics.centerY), metrics.radius);
  const chord = 2 * Math.sqrt(metrics.radius * metrics.radius - distanceY * distanceY);
  return Math.max(chord - metrics.titleSidePadding * 2, 0);
}

function linesFit(metrics, lines, fontSize, measureTextWidth) {
  const { baselines } = layoutTitleLines(metrics, fontSize, lines.length);
  const descent = fontSize * FOOTER_LAYOUT.titleDescentRatio;

  return lines.every(
    (line, index) =>
      measureTextWidth(line, fontSize) <= getChordWidth(metrics, baselines[index] + descent)
  );
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
  const areaHeight = metrics.titleAreaBottom - metrics.titleAreaTop;
  const maxFontSize = Math.min(
    FOOTER_LAYOUT.twoLineMaxFontPx * metrics.pixelScale,
    areaHeight / (FOOTER_LAYOUT.titleCapHeightRatio + FOOTER_LAYOUT.twoLineHeightRatio)
  );

  for (let fontSize = Math.max(maxFontSize, minFontSize); ; fontSize -= 1) {
    const size = Math.max(fontSize, minFontSize);
    const split = splitInTwoLines(content, size, measureTextWidth);

    if (!split) {
      return null;
    }

    if (size <= minFontSize || linesFit(metrics, split.lines, size, measureTextWidth)) {
      return { text: content, lines: split.lines, fontSize: size, ...layoutTitleLines(metrics, size, 2) };
    }
  }
}

export function getFittedTitle(text, metrics, roleLabel, measureTextWidth) {
  const content = text.trim() || roleLabel;
  const minFontSize = ptToPx(FOOTER_LAYOUT.titleMinFontPoints);
  const areaHeight = metrics.titleAreaBottom - metrics.titleAreaTop;
  let fontSize = Math.min(
    FOOTER_LAYOUT.titleMaxFontPx * metrics.pixelScale,
    areaHeight / FOOTER_LAYOUT.titleCapHeightRatio
  );

  while (fontSize > minFontSize && !linesFit(metrics, [content], fontSize, measureTextWidth)) {
    fontSize -= 1;
  }

  fontSize = Math.max(fontSize, minFontSize);

  if (!linesFit(metrics, [content], fontSize, measureTextWidth)) {
    const twoLines = getTwoLineTitle(content, metrics, minFontSize, measureTextWidth);

    if (twoLines) {
      return twoLines;
    }
  }

  return { text: content, lines: [content], fontSize, ...layoutTitleLines(metrics, fontSize, 1) };
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
