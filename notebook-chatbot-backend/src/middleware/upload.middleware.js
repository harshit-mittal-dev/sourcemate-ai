const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const ApiError = require("../utils/ApiError");
const { getFileExtension, sanitizeFileName } = require("../utils/fileName.util");

const uploadsDirectory = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const allowedExtensions = [".pdf", ".txt", ".docx"];

const allowedMimeTypes = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
];

const storage = multer.diskStorage({
  destination(req, file, callback) {
    if (!fs.existsSync(uploadsDirectory)) {
      fs.mkdirSync(uploadsDirectory, { recursive: true });
    }

    callback(null, uploadsDirectory);
  },

  filename(req, file, callback) {
    const safeFileName = sanitizeFileName(file.originalname);
    const uniqueId = crypto.randomUUID();
    const finalFileName = `${uniqueId}-${safeFileName}`;

    callback(null, finalFileName);
  },
});

function fileFilter(req, file, callback) {
  const extension = getFileExtension(file.originalname);

  const isExtensionAllowed = allowedExtensions.includes(extension);
  const isMimeAllowed =
    allowedMimeTypes.includes(file.mimetype) || file.mimetype === "";

  if (!isExtensionAllowed) {
    callback(
      new ApiError(
        400,
        "Invalid file extension. Only PDF, TXT, and DOCX files are allowed."
      )
    );
    return;
  }

  if (!isMimeAllowed) {
    callback(
      new ApiError(
        400,
        "Invalid file type. Only PDF, TXT, and DOCX files are allowed."
      )
    );
    return;
  }

  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;