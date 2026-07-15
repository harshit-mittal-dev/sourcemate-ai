const fs = require("fs");

const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response.util");

const sourceRepository = require("../repositories/source.repository");
const chunkRepository = require("../repositories/chunk.repository");

const {
  createSourceFromUploadedFile,
  createSourceFromTextInput,
  createSourceFromLinkInput,
  toClientSource,
} = require("../services/file.service");

const { extractTextFromSource } = require("../services/text.service");
const { extractTextFromLink } = require("../services/link.service");
const {
  cleanText,
  createChunksFromExtraction,
} = require("../services/chunk.service");

function safeDeleteFile(filePath) {
  try {
    if (filePath && typeof filePath === "string" && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn("Upload cleanup warning:", error.message);
  }
}

function saveProcessedSourceWithChunks(source, extraction) {
  const extractedText = cleanText(extraction.text);

  if (!extractedText) {
    throw new ApiError(422, "No readable text was found in this source.");
  }

  const chunks = createChunksFromExtraction(source, {
    ...extraction,
    text: extractedText,
  });

  if (chunks.length === 0) {
    throw new ApiError(422, "Text was extracted, but no chunks were created.");
  }

  source.status = "processed";
  source.processingStatus = "completed";
  source.pages = extraction.pageCount || 1;
  source.totalCharacters = extractedText.length;
  source.totalChunks = chunks.length;
  source.textPreview = extractedText.slice(0, 300);
  source.updatedAt = new Date().toISOString();

  const savedSource = sourceRepository.addSource(source);
  chunkRepository.replaceChunksForSource(source.id, chunks);

  return {
    savedSource,
    chunks,
  };
}

const uploadSingleFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded.");
  }

  const source = createSourceFromUploadedFile(req.file);

  try {
    const extraction = await extractTextFromSource(source);
    const { savedSource, chunks } = saveProcessedSourceWithChunks(
      source,
      extraction
    );

    return sendSuccess(
      res,
      201,
      "File uploaded and text extracted successfully.",
      {
        source: toClientSource(savedSource),
        chunksCreated: chunks.length,
      }
    );
  } catch (error) {
    safeDeleteFile(source.uploadPath);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      `File upload failed during processing: ${error.message}`
    );
  }
});

const uploadTextSource = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, "Text source title is required.");
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, "Text source content is required.");
  }

  if (content.length > 150000) {
    throw new ApiError(413, "Text source is too large.");
  }

  const source = createSourceFromTextInput(title, content);

  const extraction = {
    text: cleanText(content),
    pageCount: 1,
    pages: [
      {
        pageNumber: 1,
        text: cleanText(content),
      },
    ],
    meta: {},
  };

  const { savedSource, chunks } = saveProcessedSourceWithChunks(
    source,
    extraction
  );

  return sendSuccess(res, 201, "Text source added successfully.", {
    source: toClientSource(savedSource),
    chunksCreated: chunks.length,
  });
});

const uploadLinkSource = asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url || !url.trim()) {
    throw new ApiError(400, "Link URL is required.");
  }

  const extraction = await extractTextFromLink(url);
  const source = createSourceFromLinkInput(
    extraction.url,
    extraction.title,
    extraction.text
  );

  const { savedSource, chunks } = saveProcessedSourceWithChunks(
    source,
    extraction
  );

  return sendSuccess(res, 201, "Link source added successfully.", {
    source: toClientSource(savedSource),
    chunksCreated: chunks.length,
  });
});

module.exports = {
  uploadSingleFile,
  uploadTextSource,
  uploadLinkSource,
};