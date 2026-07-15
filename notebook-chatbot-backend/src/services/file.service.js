const crypto = require("crypto");

const { getFileExtension, getFileType } = require("../utils/fileName.util");
const { cleanText } = require("./chunk.service");

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB"];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, unitIndex);

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function createSourceFromUploadedFile(file) {
  const now = new Date().toISOString();

  return {
    id: `source_${crypto.randomUUID()}`,
    name: file.originalname,
    storedName: file.filename,
    type: getFileType(file.originalname),
    extension: getFileExtension(file.originalname),
    mimeType: file.mimetype,
    sizeBytes: file.size,
    sizeReadable: formatBytes(file.size),
    uploadPath: file.path,
    url: null,
    status: "uploaded",
    processingStatus: "pending_extraction",
    pages: 0,
    totalCharacters: 0,
    totalChunks: 0,
    textPreview: "",
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createSourceFromTextInput(title, content) {
  const now = new Date().toISOString();
  const cleanedText = cleanText(content);

  return {
    id: `source_${crypto.randomUUID()}`,
    name: title.trim(),
    storedName: null,
    type: "TEXT",
    extension: ".txt",
    mimeType: "text/plain",
    sizeBytes: Buffer.byteLength(cleanedText, "utf-8"),
    sizeReadable: formatBytes(Buffer.byteLength(cleanedText, "utf-8")),
    uploadPath: null,
    url: null,
    status: "processed",
    processingStatus: "completed",
    pages: 1,
    totalCharacters: cleanedText.length,
    totalChunks: 0,
    textPreview: cleanedText.slice(0, 300),
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createSourceFromLinkInput(url, title, text) {
  const now = new Date().toISOString();
  const cleanedText = cleanText(text);

  return {
    id: `source_${crypto.randomUUID()}`,
    name: title || url,
    storedName: null,
    type: "LINK",
    extension: ".url",
    mimeType: "text/html",
    sizeBytes: Buffer.byteLength(cleanedText, "utf-8"),
    sizeReadable: formatBytes(Buffer.byteLength(cleanedText, "utf-8")),
    uploadPath: null,
    url,
    status: "processed",
    processingStatus: "completed",
    pages: 1,
    totalCharacters: cleanedText.length,
    totalChunks: 0,
    textPreview: cleanedText.slice(0, 300),
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
}

function toClientSource(source) {
  return {
    id: source.id,
    name: source.name,
    type: source.type,
    extension: source.extension,
    url: source.url,
    sizeBytes: source.sizeBytes,
    sizeReadable: source.sizeReadable,
    status: source.status,
    processingStatus: source.processingStatus,
    pages: source.pages,
    totalCharacters: source.totalCharacters,
    totalChunks: source.totalChunks,
    textPreview: source.textPreview,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

module.exports = {
  createSourceFromUploadedFile,
  createSourceFromTextInput,
  createSourceFromLinkInput,
  toClientSource,
};