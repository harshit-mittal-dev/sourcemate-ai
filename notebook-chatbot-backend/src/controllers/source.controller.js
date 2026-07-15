const fs = require("fs");

const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response.util");

const sourceRepository = require("../repositories/source.repository");
const chunkRepository = require("../repositories/chunk.repository");
const { toClientSource } = require("../services/file.service");

function toClientChunk(chunk) {
  return {
    id: chunk.id,
    sourceId: chunk.sourceId,
    sourceName: chunk.sourceName,
    chunkIndex: chunk.chunkIndex,
    pageNumber: chunk.pageNumber,
    text: chunk.text,
    charCount: chunk.charCount,
    createdAt: chunk.createdAt,
  };
}

const getAllSources = asyncHandler(async (req, res) => {
  const sources = sourceRepository.getAllSources();

  const clientSources = sources
    .map(toClientSource)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return sendSuccess(res, 200, "Sources fetched successfully.", {
    sources: clientSources,
    count: clientSources.length,
  });
});

const getSourceById = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;

  const source = sourceRepository.getSourceById(sourceId);

  if (!source) {
    throw new ApiError(404, "Source not found.");
  }

  const chunks = chunkRepository.getChunksBySourceId(sourceId).map(toClientChunk);

  return sendSuccess(res, 200, "Source fetched successfully.", {
    source: toClientSource(source),
    chunks,
    chunksCount: chunks.length,
  });
});

const deleteSourceById = asyncHandler(async (req, res) => {
  const { sourceId } = req.params;

  const deletedSource = sourceRepository.deleteSourceById(sourceId);

  if (!deletedSource) {
    throw new ApiError(404, "Source not found.");
  }

  const deletedChunksCount = chunkRepository.deleteChunksBySourceId(sourceId);

  try {
    if (
      deletedSource.uploadPath &&
      typeof deletedSource.uploadPath === "string" &&
      fs.existsSync(deletedSource.uploadPath)
    ) {
      fs.unlinkSync(deletedSource.uploadPath);
    }
  } catch (error) {
    console.warn("File delete warning:", error.message);
  }

  return sendSuccess(res, 200, "Source deleted successfully.", {
    source: toClientSource(deletedSource),
    deletedChunksCount,
  });
});

const deleteAllSources = asyncHandler(async (req, res) => {
  const sources = sourceRepository.getAllSources();

  sources.forEach((source) => {
    try {
      if (
        source.uploadPath &&
        typeof source.uploadPath === "string" &&
        fs.existsSync(source.uploadPath)
      ) {
        fs.unlinkSync(source.uploadPath);
      }
    } catch (error) {
      console.warn("File delete warning:", error.message);
    }
  });

  sourceRepository.deleteAllSources();
  chunkRepository.deleteAllChunks();

  return sendSuccess(res, 200, "All sources cleared successfully.", {
    deletedSourcesCount: sources.length,
  });
});

module.exports = {
  getAllSources,
  getSourceById,
  deleteSourceById,
  deleteAllSources,
};