export const DIVIDER_SWATCHES = ["#c8102e", "#f08c00", "#2f9e44", "#1971c2", "#7048e8"];

export const LABEL_SWATCHES = ["#090909", "#1f2933", "#14213d", "#3d1220", "#f2f2f2"];

export const DEFAULT_DIVIDER_COLOR = DIVIDER_SWATCHES[0];

export const DEFAULT_LABEL_BACKGROUND = LABEL_SWATCHES[0];

const TITLE_ON_DARK = "#d4d4d4";

const TITLE_ON_LIGHT = "#1a1a1a";

export function normalizeHexColor(value) {
  const digits = String(value || "").trim().replace(/^#/, "").toLowerCase();

  if (!/^[0-9a-f]{3}$/.test(digits) && !/^[0-9a-f]{6}$/.test(digits)) {
    return null;
  }

  const expanded = digits.length === 3
    ? digits.split("").map((digit) => digit + digit).join("")
    : digits;

  return `#${expanded}`;
}

function getChannelLuminance(channel) {
  const ratio = channel / 255;

  return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

export function getRelativeLuminance(color) {
  const hex = normalizeHexColor(color);

  if (!hex) {
    return 0;
  }

  const red = getChannelLuminance(parseInt(hex.slice(1, 3), 16));
  const green = getChannelLuminance(parseInt(hex.slice(3, 5), 16));
  const blue = getChannelLuminance(parseInt(hex.slice(5, 7), 16));

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function getReadableTextColor(background) {
  return getRelativeLuminance(background) > 0.35 ? TITLE_ON_LIGHT : TITLE_ON_DARK;
}
