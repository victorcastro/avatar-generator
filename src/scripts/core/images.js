import { clampNumber } from "./math.js";

const ACCEPTED_IMAGE_TYPES = {
  background: ["image/png", "image/jpeg", "image/webp"],
  portrait: ["image/png", "image/jpeg", "image/webp"]
};

const IMAGE_MIME_ALIASES = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png"
};

const IMAGE_EXTENSIONS = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg", ".jpe"],
  "image/webp": [".webp"]
};

export const BACKGROUND_REMOVAL = {
  model: "isnet_quint8",
  outputFormat: "image/png",
  alphaSampleSize: 256
};

const CUTOUT_PHASE_LABELS = {
  fetch: "Downloading the background remover",
  compute: "Removing the background"
};

function normalizeImageMimeType(mimeType) {
  const normalized = String(mimeType || "").trim().toLowerCase();

  return IMAGE_MIME_ALIASES[normalized] || normalized;
}

export function isAcceptedImageType(layer, mimeType, fileName) {
  const accepted = ACCEPTED_IMAGE_TYPES[layer];

  if (!accepted) {
    return false;
  }

  const normalized = normalizeImageMimeType(mimeType);

  if (normalized) {
    return accepted.includes(normalized);
  }

  const name = String(fileName || "").trim().toLowerCase();

  if (!name) {
    return false;
  }

  return accepted.some((type) =>
    (IMAGE_EXTENSIONS[type] || []).some((extension) => name.endsWith(extension))
  );
}

export function hasAlphaChannel(pixels) {
  if (!pixels || typeof pixels.length !== "number") {
    return false;
  }

  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) {
      return true;
    }
  }

  return false;
}

export function getAlphaSampleSize(width, height) {
  const largestSide = Math.max(Number(width) || 0, Number(height) || 0);

  if (largestSide <= 0) {
    return { width: 0, height: 0 };
  }

  const ratio = Math.min(1, BACKGROUND_REMOVAL.alphaSampleSize / largestSide);

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
}

export function getCutoutProgressMessage(key, current, total) {
  const phase = String(key || "").split(":")[0];
  const label = CUTOUT_PHASE_LABELS[phase] || CUTOUT_PHASE_LABELS.compute;
  const ratio = Number(total) > 0 ? Number(current) / Number(total) : 0;
  const percent = clampNumber(Math.round(ratio * 100), 0, 100);

  return `${label} ${percent}%`;
}
