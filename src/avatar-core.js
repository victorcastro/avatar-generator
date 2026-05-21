(function (globalScope) {
  const ROLE_CONFIG = {
    ios: {
      label: "iOS",
      iconProvider: "fontawesome",
      iconStyle: "brands",
      iconName: "swift",
      iconLabel: "Swift"
    },
    android: {
      label: "Android",
      iconProvider: "fontawesome",
      iconStyle: "brands",
      iconName: "android",
      iconLabel: "Android"
    },
    react: {
      label: "React",
      iconProvider: "fontawesome",
      iconStyle: "brands",
      iconName: "react",
      iconLabel: "React"
    },
    qa: {
      label: "QA",
      iconProvider: "fontawesome",
      iconStyle: "solid",
      iconName: "bug",
      iconLabel: "Bug"
    },
    adm: {
      label: "ADM",
      iconProvider: "fontawesome",
      iconStyle: "solid",
      iconName: "compass",
      iconLabel: "Compass"
    },
    pm: {
      label: "PM",
      iconProvider: "fontawesome",
      iconStyle: "solid",
      iconName: "briefcase",
      iconLabel: "Briefcase"
    },
    po: {
      label: "PO",
      iconProvider: "fontawesome",
      iconStyle: "solid",
      iconName: "bullseye",
      iconLabel: "Bullseye"
    }
  };

  const FONT_AWESOME_GLYPHS = {
    swift: "\uf8e1",
    android: "\uf17b",
    react: "\uf41b",
    bug: "\uf188",
    compass: "\uf14e",
    briefcase: "\uf0b1",
    bullseye: "\uf140"
  };

  function ptToPx(points) {
    return points * (96 / 72);
  }

  function getCompositionMetrics(canvasSize) {
    const size = canvasSize;
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

  function getFittedTitle(text, maxWidth, roleLabel, measureTextWidth) {
    const content = text.trim() || roleLabel;
    const maxFontSize = ptToPx(26);
    const minFontSize = ptToPx(10);
    let fontSize = maxFontSize;

    while (fontSize >= minFontSize) {
      if (measureTextWidth(content, fontSize) <= maxWidth) {
        break;
      }

      fontSize -= 1;
    }

    return {
      text: content,
      fontSize: Math.max(fontSize, minFontSize)
    };
  }

  function getImageDrawBounds(image, scaleMultiplier, offsetX, offsetY, metrics) {
    const baseScale = Math.max(
      (metrics.clipRadius * 2) / image.width,
      (metrics.clipRadius * 2) / image.height
    );
    const scale = baseScale * scaleMultiplier;
    const width = image.width * scale;
    const height = image.height * scale;
    const left = metrics.centerX - width / 2 + offsetX;
    const top = metrics.centerY - height / 2 + offsetY;

    return {
      left,
      top,
      width,
      height,
      scale
    };
  }

  function getPortraitOffsetYFromSlider(value) {
    return -Number(value);
  }

  function getDownloadFilename(titleText, roleLabel) {
    const safeRole = roleLabel.toLowerCase();
    const safeTitle = (titleText.trim() || safeRole).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `avatar-${safeTitle || safeRole}.png`;
  }

  const api = {
    ROLE_CONFIG,
    FONT_AWESOME_GLYPHS,
    ptToPx,
    getCompositionMetrics,
    getFittedTitle,
    getImageDrawBounds,
    getPortraitOffsetYFromSlider,
    getDownloadFilename
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.AvatarCore = api;
})(typeof window !== "undefined" ? window : globalThis);
