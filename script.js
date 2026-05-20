const ROLE_CONFIG = {
  ios: {
    label: "iOS",
    lucideName: "Bird",
    iconLabel: "Bird"
  },
  android: {
    label: "Android",
    lucideName: "Bot",
    iconLabel: "Bot"
  },
  qa: {
    label: "QA",
    lucideName: "Bug",
    iconLabel: "Bug"
  },
  adm: {
    label: "ADM",
    lucideName: "Compass",
    iconLabel: "Compass"
  },
  pm: {
    label: "PM",
    lucideName: "BriefcaseBusiness",
    iconLabel: "BriefcaseBusiness"
  },
  po: {
    label: "PO",
    lucideName: "Target",
    iconLabel: "Target"
  }
};

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

const ui = {
  roleChipIcon: document.getElementById("roleChipIcon"),
  roleChipLabel: document.getElementById("roleChipLabel"),
  selectedRoleIcon: document.getElementById("selectedRoleIcon"),
  selectedRoleText: document.getElementById("selectedRoleText")
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

function ptToPx(points) {
  return points * (96 / 72);
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

function syncLucideUi() {
  const role = ROLE_CONFIG[state.role];

  ui.roleChipLabel.textContent = role.label;
  ui.selectedRoleText.textContent = `${role.iconLabel} para ${role.label}`;
  ui.roleChipIcon.innerHTML = renderLucideMarkup(role.lucideName, {
    width: "20",
    height: "20",
    "stroke-width": "2.1"
  });
  ui.selectedRoleIcon.innerHTML = renderLucideMarkup(role.lucideName, {
    width: "24",
    height: "24",
    "stroke-width": "2.1"
  });
}

function getCompositionMetrics() {
  const size = canvas.width;
  const centerX = size / 2;
  const centerY = size / 2;
  const borderWidth = 4;
  const radius = size * 0.36;
  const clipRadius = radius - borderWidth / 2;
  const footerHeight = radius * 0.56;
  const footerTop = centerY + clipRadius - footerHeight;

  return {
    size,
    centerX,
    centerY,
    radius,
    clipRadius,
    borderWidth,
    footerHeight,
    footerTop
  };
}

function getFittedTitle(text, maxWidth) {
  const content = text.trim() || ROLE_CONFIG[state.role].label;
  const maxFontSize = ptToPx(26);
  const minFontSize = ptToPx(10);
  let fontSize = maxFontSize;

  while (fontSize >= minFontSize) {
    context.font = `700 ${fontSize}px "Segoe UI", Arial, sans-serif`;

    if (context.measureText(content).width <= maxWidth) {
      break;
    }

    fontSize -= 1;
  }

  return {
    text: content,
    fontSize: Math.max(fontSize, minFontSize)
  };
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

function drawRoleIcon(iconName, centerX, centerY, size, color) {
  const iconData = getLucideData(iconName);

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
  const baseScale = Math.max(
    (metrics.clipRadius * 2) / image.width,
    (metrics.clipRadius * 2) / image.height
  );
  const scale = baseScale * scaleMultiplier;
  const width = image.width * scale;
  const height = image.height * scale;
  const left = metrics.centerX - width / 2 + offsetX;
  const top = metrics.centerY - height / 2 + offsetY;

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
      role.lucideName,
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
  syncLucideUi();
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
  updateState("portraitOffsetY", Number(event.target.value));
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
  const safeRole = ROLE_CONFIG[state.role].label.toLowerCase();
  const safeTitle = (state.titleText.trim() || safeRole).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  link.href = canvas.toDataURL("image/png");
  link.download = `avatar-${safeTitle || safeRole}.png`;
  link.click();
});

lucideLibrary.createIcons({
  attrs: {
    "stroke-width": 2.1
  }
});
syncLucideUi();
drawAvatar();
