const mammoth = require("mammoth");

async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value || "";

  return {
    text,
    pageCount: 1,
    pages: [
      {
        pageNumber: 1,
        text,
      },
    ],
    meta: {
      warnings: result.messages || [],
    },
  };
}

module.exports = {
  extractDocxText,
};