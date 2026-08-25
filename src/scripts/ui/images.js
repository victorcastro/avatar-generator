import { getAlphaSampleSize, hasAlphaChannel } from "../core/images.js";

export function loadImageFromBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo cargar la imagen"));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export function imageHasTransparency(image) {
  const sample = getAlphaSampleSize(image.width, image.height);

  if (!sample.width || !sample.height) {
    return false;
  }

  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sample.width;
  sampleCanvas.height = sample.height;

  const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
  sampleContext.drawImage(image, 0, 0, sample.width, sample.height);

  return hasAlphaChannel(sampleContext.getImageData(0, 0, sample.width, sample.height).data);
}
