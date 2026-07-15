const fs = require("fs");

const ApiError = require("../utils/ApiError");
const { extractPdfText } = require("./pdf.service");
const { extractDocxText } = require("./docx.service");

async function extractTxtText(filePath) {
  const text = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");

  return {
    text,
    pageCount: 1,
    pages: [
      {
        pageNumber: 1,
        text,
      },
    ],
    meta: {},
  };
}

async function extractTextFromSource(source) {
  if (source.type === "TXT") {
    return extractTxtText(source.uploadPath);
  }

  if (source.type === "PDF") {
    return extractPdfText(source.uploadPath);
  }

  if (source.type === "DOCX") {
    return extractDocxText(source.uploadPath);
  }

  throw new ApiError(400, "Unsupported file type for text extraction.");
}

module.exports = {
  extractTxtText,
  extractTextFromSource,
};