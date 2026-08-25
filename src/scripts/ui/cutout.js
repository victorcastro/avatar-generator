import { BACKGROUND_REMOVAL, getCutoutProgressMessage } from "../core/images.js";
import { controls } from "./dom.js";
import { portraitSource, setStatus, state } from "./state.js";
import { imageHasTransparency, loadImageFromBlob } from "./images.js";
import { applyLayerTransform } from "./transform.js";

let backgroundRemoval = null;

function loadBackgroundRemoval() {
  if (!backgroundRemoval) {
    backgroundRemoval = import(window.AVATAR_BACKGROUND_REMOVAL_URL);
  }

  return backgroundRemoval;
}

export function setCutoutStatus(message) {
  controls.portraitCutoutStatus.textContent = message;
  controls.portraitCutoutStatus.hidden = !message;
}

function setCutoutError(message) {
  setCutoutStatus(`${message} `);

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.className = "cutout-block__retry";
  retryButton.textContent = "Retry";
  retryButton.addEventListener("click", () => {
    runBackgroundRemoval();
  });

  controls.portraitCutoutStatus.appendChild(retryButton);
}

export function setCutoutBusy(busy) {
  portraitSource.busy = busy;
  controls.portraitCutout.disabled = busy;
  controls.portraitDropzone.classList.toggle("is-busy", busy);
}

export function setPortraitImage(image) {
  state.portraitImage = image;
  applyLayerTransform("portrait", {
    scale: state.portraitScale,
    offsetX: state.portraitOffsetX,
    offsetY: state.portraitOffsetY
  });
}

export async function runBackgroundRemoval() {
  if (!portraitSource.file || portraitSource.busy) {
    return;
  }

  if (portraitSource.cutoutImage) {
    setPortraitImage(portraitSource.cutoutImage);
    setCutoutStatus("Background removed");
    return;
  }

  if (imageHasTransparency(portraitSource.originalImage)) {
    portraitSource.cutoutImage = portraitSource.originalImage;
    setCutoutStatus("The image already has transparency");
    return;
  }

  portraitSource.requestId += 1;
  const requestId = portraitSource.requestId;

  setCutoutBusy(true);
  setCutoutStatus("Preparing the background remover");

  try {
    const { removeBackground } = await loadBackgroundRemoval();
    const cutout = await removeBackground(portraitSource.file, {
      model: BACKGROUND_REMOVAL.model,
      output: { format: BACKGROUND_REMOVAL.outputFormat },
      progress: (key, current, total) => {
        if (requestId === portraitSource.requestId) {
          setCutoutStatus(getCutoutProgressMessage(key, current, total));
        }
      }
    });

    const image = await loadImageFromBlob(cutout);

    if (requestId !== portraitSource.requestId) {
      return;
    }

    portraitSource.cutoutImage = image;

    if (state.removePortraitBackground) {
      setPortraitImage(image);
      setCutoutStatus("Background removed");
      setStatus("The portrait background was removed");
    }
  } catch (error) {
    backgroundRemoval = null;

    if (requestId !== portraitSource.requestId) {
      return;
    }

    setCutoutError("Background removal failed, keeping the original image.");
    setStatus(`Background removal failed: ${error.message}`);
  } finally {
    if (requestId === portraitSource.requestId) {
      setCutoutBusy(false);
    }
  }
}

export function resetPortraitSource(file, image) {
  portraitSource.file = file;
  portraitSource.originalImage = image;
  portraitSource.cutoutImage = null;
  portraitSource.requestId += 1;

  setCutoutBusy(false);
  setCutoutStatus("");

  if (state.removePortraitBackground) {
    runBackgroundRemoval();
  }
}
