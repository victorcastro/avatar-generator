export function clampNumber(value, minValue, maxValue) {
  if (!Number.isFinite(value)) {
    return minValue;
  }

  return Math.min(Math.max(value, minValue), maxValue);
}
