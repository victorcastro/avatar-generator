import { getDropTargetLayer } from "../core/layers.js";
import { canvas, controls } from "./dom.js";
import { handleImageInput } from "./layers.js";

function bindDropTarget(element, resolveLayer, activeClass, activeElement) {
  let enterCount = 0;
  const target = activeElement || element;

  element.addEventListener("dragenter", (event) => {
    event.preventDefault();
    enterCount += 1;
    target.classList.add(activeClass);
  });

  element.addEventListener("dragover", (event) => {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  });

  element.addEventListener("dragleave", () => {
    enterCount = Math.max(0, enterCount - 1);

    if (enterCount === 0) {
      target.classList.remove(activeClass);
    }
  });

  element.addEventListener("drop", (event) => {
    event.preventDefault();
    enterCount = 0;
    target.classList.remove(activeClass);

    const file = event.dataTransfer && event.dataTransfer.files[0];
    handleImageInput(file, resolveLayer(event));
  });
}

export function bindDropzones() {
  bindDropTarget(controls.backgroundDropzone, () => "background", "is-dragover");
  bindDropTarget(controls.portraitDropzone, () => "portrait", "is-dragover");
  bindDropTarget(
    canvas,
    (event) => getDropTargetLayer(event.altKey),
    "is-dropping",
    controls.canvasFrame
  );

  document.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  document.addEventListener("drop", (event) => {
    event.preventDefault();
  });
}
