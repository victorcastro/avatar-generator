import { ROLE_CONFIG } from "../core/roles.js";
import { CANVAS_SIZE, EXPORT_SIZE, getExportScale } from "../core/composition.js";
import { getDownloadFilename } from "../core/download.js";
import { canvas, context, controls } from "./dom.js";
import { state } from "./state.js";
import { drawAvatar, renderNow } from "./render.js";

export function getExportDataUrl() {
  const exportScale = getExportScale();

  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  context.scale(exportScale, exportScale);
  drawAvatar({ showPlaceholder: false });

  const dataUrl = canvas.toDataURL("image/png");

  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  renderNow();

  return dataUrl;
}

export function bindExport() {
  controls.downloadButton.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = getExportDataUrl();
    link.download = getDownloadFilename(state.titleText, ROLE_CONFIG[state.role].label);
    link.click();
  });
}
