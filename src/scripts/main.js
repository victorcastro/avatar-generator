import { ROLE_CONFIG } from "./core/roles.js";
import { controls } from "./ui/dom.js";
import { state } from "./ui/state.js";
import { preloadSvgIcon, setIconLoadHandler } from "./ui/icons.js";
import { drawAvatar, requestRender } from "./ui/render.js";
import { refreshHint } from "./ui/transform.js";
import { bindControls } from "./ui/controls.js";
import { bindGestures } from "./ui/gestures.js";
import { bindDropzones } from "./ui/dropzone.js";
import { bindExport } from "./ui/export.js";

setIconLoadHandler(requestRender);

window.lucide.createIcons({
  attrs: {
    "stroke-width": 2.1
  }
});

Object.values(ROLE_CONFIG).forEach((role) => {
  if (role.iconSrc) {
    preloadSvgIcon(role.iconSrc);
  }
});

bindControls();
bindGestures();
bindDropzones();
bindExport();

state.removePortraitBackground = controls.portraitCutout.checked;
state.showIcon = !controls.hideIcon.checked;

refreshHint(false);
drawAvatar();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    requestRender();
  });
}
