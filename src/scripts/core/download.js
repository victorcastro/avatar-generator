function toFilenameSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

export function getFilenameTimestamp(date) {
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

  return `${day}-${time}`;
}

export function getDownloadFilename(titleText, roleLabel, date = new Date()) {
  const safeTitle = toFilenameSlug(titleText);
  const safeRole = toFilenameSlug(roleLabel);

  return `avatar-${safeTitle || safeRole || "avatar"}-${getFilenameTimestamp(date)}.png`;
}
