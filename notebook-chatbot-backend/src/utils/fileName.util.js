const path = require("path");

function getFileExtension(fileName) {
  return path.extname(fileName).toLowerCase();
}

function sanitizeFileName(fileName) {
  const extension = getFileExtension(fileName);
  const nameWithoutExtension = path.basename(fileName, extension);

  const safeName = nameWithoutExtension
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `${safeName || "uploaded-file"}${extension}`;
}

function getFileType(fileName) {
  const extension = getFileExtension(fileName);

  if (extension === ".pdf") return "PDF";
  if (extension === ".txt") return "TXT";
  if (extension === ".docx") return "DOCX";

  return "UNKNOWN";
}

module.exports = {
  getFileExtension,
  sanitizeFileName,
  getFileType,
};