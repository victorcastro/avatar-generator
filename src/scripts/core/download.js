function toFilenameSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDownloadFilename(titleText, roleLabel) {
  const safeTitle = toFilenameSlug(titleText);
  const safeRole = toFilenameSlug(roleLabel);

  return `avatar-${safeTitle || safeRole || "avatar"}.png`;
}
