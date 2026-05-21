const {
  ROLE_CONFIG,
  FONT_AWESOME_GLYPHS,
  getCompositionMetrics: getCoreCompositionMetrics,
  getFittedTitle: getCoreFittedTitle,
  getImageDrawBounds,
  getPortraitOffsetYFromSlider,
  getDownloadFilename
} = window.AvatarCore;

const canvas = document.getElementById("avatarCanvas");
const context = canvas.getContext("2d");
const lucideLibrary = window.lucide;

const state = {
  role: "ios",
  titleText: "Tech Lead iOS",
  backgroundScale: 1,
  backgroundOffsetX: 0,
  backgroundOffsetY: 0,
  backgroundImage: null,
  portraitScale: 1,
  portraitOffsetX: 0,
  portraitOffsetY: 12,
  portraitImage: null
};

const controls = {
  role: document.getElementById("role"),
  titleText: document.getElementById("titleText"),
  backgroundUpload: document.getElementById("backgroundUpload"),
  backgroundScale: document.getElementById("backgroundScale"),
  backgroundOffsetX: document.getElementById("backgroundOffsetX"),
  backgroundOffsetY: document.getElementById("backgroundOffsetY"),
  portraitUpload: document.getElementById("portraitUpload"),
  portraitScale: document.getElementById("portraitScale"),
  portraitOffsetX: document.getElementById("portraitOffsetX"),
  portraitOffsetY: document.getElementById("portraitOffsetY"),
  downloadButton: document.getElementById("downloadButton")
};

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function getLucideData(name) {
  if (!lucideLibrary || !lucideLibrary.icons) {
    return null;
  }

  return lucideLibrary.icons[name] || null;
}

function renderLucideMarkup(name, attrs = {}) {
  const iconData = getLucideData(name);

  if (!iconData) {
    return "";
  }

  const baseAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  };

  const svgAttributes = { ...baseAttributes, ...attrs };
  const attributesText = Object.entries(svgAttributes)
    .map(([key, value]) => `${key}="${String(value)}"`)
    .join(" ");
  const children = iconData
    .map(([tagName, tagAttrs]) => {
      const tagAttributes = Object.entries(tagAttrs)
        .map(([key, value]) => `${key}="${String(value)}"`)
        .join(" ");
      return `<${tagName} ${tagAttributes}></${tagName}>`;
    })
    .join("");

  return `<svg ${attributesText}>${children}</svg>`;
}

function drawFontAwesomeIcon(iconName, iconStyle, centerX, centerY, size, color) {
  const glyph = FONT_AWESOME_GLYPHS[iconName];

  if (!glyph) {
    return;
  }

  context.save();
  context.fillStyle = color;
  context.font = `${iconStyle === "solid" ? 900 : 400} ${size}px ${
    iconStyle === "solid" ? '"Font Awesome 7 Free"' : '"Font Awesome 7 Brands"'
  }`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(glyph, centerX, centerY);
  context.restore();
}

function getCompositionMetrics() {
  return getCoreCompositionMetrics(canvas.width);
}

function getFittedTitle(text, maxWidth) {
  return getCoreFittedTitle(text, maxWidth, ROLE_CONFIG[state.role].label, (content, fontSize) => {
    context.font = `700 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    return context.measureText(content).width;
  });
}

function drawLucideNode(tagName, attrs) {
  switch (tagName) {
    case "path":
      context.stroke(new Path2D(attrs.d));
      break;
    case "circle":
      context.beginPath();
      context.arc(Number(attrs.cx), Number(attrs.cy), Number(attrs.r), 0, Math.PI * 2);
      context.stroke();
      break;
    case "rect":
      context.strokeRect(
        Number(attrs.x),
        Number(attrs.y),
        Number(attrs.width),
        Number(attrs.height)
      );
      break;
    default:
      break;
  }
}

function drawRoleIcon(role, centerX, centerY, size, color) {
  if (role.iconProvider === "fontawesome") {
    drawFontAwesomeIcon(role.iconName, role.iconStyle, centerX, centerY, size, color);
    return;
  }

  const iconData = getLucideData(role.iconName);

  if (!iconData) {
    return;
  }

  context.save();
  context.translate(centerX - size / 2, centerY - size / 2);
  context.scale(size / 24, size / 24);
  context.strokeStyle = color;
  context.lineWidth = 1.9;
  context.lineCap = "round";
  context.lineJoin = "round";

  iconData.forEach(([tagName, attrs]) => {
    drawLucideNode(tagName, attrs);
  });

  context.restore();
}

function withCircularClip(metrics, drawFn) {
  context.save();
  context.beginPath();
  context.arc(metrics.centerX, metrics.centerY, metrics.clipRadius, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  drawFn();
  context.restore();
}

function drawLayerImage(image, scaleMultiplier, offsetX, offsetY, metrics) {
  const { left, top, width, height } = getImageDrawBounds(
    image,
    scaleMultiplier,
    offsetX,
    offsetY,
    metrics
  );

  context.drawImage(image, left, top, width, height);
}

// layer-background
function drawLayerBackground(metrics) {
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.backgroundImage) {
    return;
  }

  withCircularClip(metrics, () => {
    drawLayerImage(
      state.backgroundImage,
      state.backgroundScale,
      state.backgroundOffsetX,
      state.backgroundOffsetY,
      metrics
    );
  });
}

// layer-blur
function drawLayerBlur(metrics) {
  if (!state.backgroundImage) {
    return;
  }

  withCircularClip(metrics, () => {
    context.fillStyle = "rgba(51, 51, 51, 0.35)";
    context.fillRect(0, 0, canvas.width, canvas.height);
  });
}

// layer-user
function drawLayerUser(metrics) {
  if (!state.portraitImage) {
    return;
  }

  withCircularClip(metrics, () => {
    drawLayerImage(
      state.portraitImage,
      state.portraitScale,
      state.portraitOffsetX,
      state.portraitOffsetY,
      metrics
    );
  });
}

// layer-footer
function drawLayerFooter(metrics) {
  const footerPadding = metrics.clipRadius * 0.06;
  const footerWidth = metrics.clipRadius * 2 - footerPadding * 2;
  const titlePaddingX = metrics.clipRadius * 0.14;
  const titleMetrics = getFittedTitle(state.titleText, footerWidth - titlePaddingX * 4);
  const role = ROLE_CONFIG[state.role];

  withCircularClip(metrics, () => {
    context.fillStyle = "#090909";
    context.fillRect(
      metrics.centerX - footerWidth / 2,
      metrics.footerTop,
      footerWidth,
      metrics.footerHeight + 26
    );

    context.fillStyle = "#c8102e";
    context.fillRect(
      metrics.centerX - footerWidth / 2,
      metrics.footerTop,
      footerWidth,
      4
    );

    context.fillStyle = "#d4d4d4";
    context.font = `700 ${titleMetrics.fontSize}px "Segoe UI", Arial, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(titleMetrics.text, metrics.centerX, metrics.footerTop + metrics.footerHeight * 0.38);

    drawRoleIcon(
      role,
      metrics.centerX,
      metrics.footerTop + metrics.footerHeight * 0.74,
      metrics.clipRadius * 0.18,
      "#c8102e"
    );
  });
}

// layer-mask
function drawLayerMask(metrics) {
  context.save();
  context.strokeStyle = "#090909";
  context.lineWidth = metrics.borderWidth;
  context.beginPath();
  context.arc(metrics.centerX, metrics.centerY, metrics.clipRadius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawAvatar() {
  const metrics = getCompositionMetrics();

  drawLayerBackground(metrics);
  drawLayerBlur(metrics);
  drawLayerUser(metrics);
  drawLayerFooter(metrics);
  drawLayerMask(metrics);
}

async function handleImageInput(file, target) {
  if (!file) {
    return;
  }

  try {
    const image = await loadImageFromFile(file);
    state[target] = image;
    drawAvatar();
  } catch (error) {
    window.alert(error.message);
  }
}

function updateState(key, value) {
  state[key] = value;
  drawAvatar();
}

controls.role.addEventListener("change", (event) => {
  updateState("role", event.target.value);
});

controls.titleText.addEventListener("input", (event) => {
  updateState("titleText", event.target.value);
});

controls.backgroundScale.addEventListener("input", (event) => {
  updateState("backgroundScale", Number(event.target.value));
});

controls.backgroundOffsetX.addEventListener("input", (event) => {
  updateState("backgroundOffsetX", Number(event.target.value));
});

controls.backgroundOffsetY.addEventListener("input", (event) => {
  updateState("backgroundOffsetY", Number(event.target.value));
});

controls.portraitScale.addEventListener("input", (event) => {
  updateState("portraitScale", Number(event.target.value));
});

controls.portraitOffsetX.addEventListener("input", (event) => {
  updateState("portraitOffsetX", Number(event.target.value));
});

controls.portraitOffsetY.addEventListener("input", (event) => {
  updateState("portraitOffsetY", getPortraitOffsetYFromSlider(event.target.value));
});

controls.backgroundUpload.addEventListener("change", (event) => {
  handleImageInput(event.target.files[0], "backgroundImage");
});

controls.portraitUpload.addEventListener("change", (event) => {
  handleImageInput(event.target.files[0], "portraitImage");
});

controls.downloadButton.addEventListener("click", () => {
  drawAvatar();
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = getDownloadFilename(state.titleText, ROLE_CONFIG[state.role].label);
  link.click();
});

lucideLibrary.createIcons({
  attrs: {
    "stroke-width": 2.1
  }
});

drawAvatar();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    drawAvatar();
  });
}
