const fs = require("fs");

let pdfParse = require("pdf-parse");

if (typeof pdfParse !== "function" && pdfParse.default) {
  pdfParse = pdfParse.default;
}

async function extractPdfText(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const parsedPdf = await pdfParse(fileBuffer);

  const text = parsedPdf.text || "";

  return {
    text,
    pageCount: parsedPdf.numpages || 1,
    pages: [
      {
        pageNumber: 1,
        text,
      },
    ],
    meta: {
      title: parsedPdf.info?.Title || null,
      author: parsedPdf.info?.Author || null,
    },
  };
}

module.exports = {
  extractPdfText,
};