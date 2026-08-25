export const canvas = document.getElementById("avatarCanvas");

export const context = canvas.getContext("2d");

export const controls = {
  role: document.getElementById("role"),
  hideIcon: document.getElementById("hideIcon"),
  titleText: document.getElementById("titleText"),
  backgroundUpload: document.getElementById("backgroundUpload"),
  backgroundScale: document.getElementById("backgroundScale"),
  portraitUpload: document.getElementById("portraitUpload"),
  portraitScale: document.getElementById("portraitScale"),
  portraitCutout: document.getElementById("portraitCutout"),
  portraitCutoutStatus: document.getElementById("portraitCutoutStatus"),
  downloadButton: document.getElementById("downloadButton"),
  canvasFrame: document.getElementById("canvasFrame"),
  canvasHint: document.getElementById("canvasHint"),
  canvasStatus: document.getElementById("canvasStatus"),
  backgroundDropzone: document.getElementById("backgroundDropzone"),
  portraitDropzone: document.getElementById("portraitDropzone"),
  backgroundFileName: document.getElementById("backgroundFileName"),
  portraitFileName: document.getElementById("portraitFileName"),
  backgroundClear: document.getElementById("backgroundClear"),
  portraitClear: document.getElementById("portraitClear"),
  titleTextCounter: document.getElementById("titleTextCounter")
};
