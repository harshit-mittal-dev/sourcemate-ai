const crypto = require("crypto");

function cleanText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findGoodCut(text, start, proposedEnd, maxLength) {
  if (proposedEnd >= text.length) {
    return text.length;
  }

  const minimumEnd = start + Math.floor(maxLength * 0.65);
  const punctuationMarks = [". ", "? ", "! ", "\n"];

  let bestCut = -1;

  punctuationMarks.forEach((mark) => {
    const index = text.lastIndexOf(mark, proposedEnd);

    if (index > minimumEnd && index > bestCut) {
      bestCut = index + mark.length;
    }
  });

  if (bestCut !== -1) {
    return bestCut;
  }

  const lastSpace = text.lastIndexOf(" ", proposedEnd);

  if (lastSpace > minimumEnd) {
    return lastSpace;
  }

  return proposedEnd;
}

function createChunksFromExtraction(source, extraction, options = {}) {
  const maxLength = options.maxLength || 1200;
  const overlap = options.overlap || 150;

  const chunks = [];
  let globalChunkIndex = 0;

  const pages =
    extraction.pages && extraction.pages.length > 0
      ? extraction.pages
      : [
          {
            pageNumber: 1,
            text: extraction.text,
          },
        ];

  pages.forEach((page) => {
    const pageText = cleanText(page.text);

    if (!pageText) {
      return;
    }

    let start = 0;

    while (start < pageText.length) {
      const proposedEnd = Math.min(start + maxLength, pageText.length);
      const end = findGoodCut(pageText, start, proposedEnd, maxLength);

      const chunkText = cleanText(pageText.slice(start, end));

      if (chunkText) {
        chunks.push({
          id: `chunk_${crypto.randomUUID()}`,
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.type,
          chunkIndex: globalChunkIndex,
          pageNumber: page.pageNumber || 1,
          text: chunkText,
          charCount: chunkText.length,
          createdAt: new Date().toISOString(),
        });

        globalChunkIndex += 1;
      }

      if (end >= pageText.length) {
        break;
      }

      const nextStart = Math.max(0, end - overlap);

      if (nextStart <= start) {
        start = end;
      } else {
        start = nextStart;
      }
    }
  });

  return chunks;
}

module.exports = {
  cleanText,
  createChunksFromExtraction,
};