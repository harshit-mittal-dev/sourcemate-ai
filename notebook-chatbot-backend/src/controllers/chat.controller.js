const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response.util");

const chunkRepository = require("../repositories/chunk.repository");
const sourceRepository = require("../repositories/source.repository");

const { searchRelevantChunks } = require("../services/search.service");
const {
  createLLMAnswer,
  streamLLMAnswer,
  writeSseEvent,
} = require("../services/llm.service");
const { createCitationsFromChunks } = require("../services/citation.service");

function validateSourceIds(sourceIds) {
  const selectedSourceIds = Array.isArray(sourceIds) ? sourceIds : [];

  selectedSourceIds.forEach((sourceId) => {
    const source = sourceRepository.getSourceById(sourceId);

    if (!source) {
      throw new ApiError(404, `Source not found: ${sourceId}`);
    }
  });

  return selectedSourceIds;
}

function getRelevantChunks(question, selectedSourceIds) {
  const allChunks = chunkRepository.getAllChunks();

  if (allChunks.length === 0) {
    throw new ApiError(
      400,
      "No processed source chunks found. Upload and process a source first."
    );
  }

  return searchRelevantChunks(question, allChunks, {
    sourceIds: selectedSourceIds,
    limit: 5,
  });
}

function toClientRelevantChunks(relevantChunks) {
  return relevantChunks.map((chunk) => ({
    id: chunk.id,
    sourceId: chunk.sourceId,
    sourceName: chunk.sourceName,
    pageNumber: chunk.pageNumber,
    chunkIndex: chunk.chunkIndex,
    score: chunk.score,
    text: chunk.text,
  }));
}

const chatWithSources = asyncHandler(async (req, res) => {
  const { question, sourceIds } = req.body;

  if (!question || !question.trim()) {
    throw new ApiError(400, "Question is required.");
  }

  const selectedSourceIds = validateSourceIds(sourceIds);
  const relevantChunks = getRelevantChunks(question, selectedSourceIds);

  const { answer, mode } = await createLLMAnswer(question, relevantChunks);
  const citations = createCitationsFromChunks(relevantChunks);

  return sendSuccess(res, 200, "Chat response generated successfully.", {
    question,
    answer,
    citations,
    relevantChunks: toClientRelevantChunks(relevantChunks),
    mode,
  });
});

const streamChatWithSources = asyncHandler(async (req, res) => {
  const { question, sourceIds } = req.body;

  if (!question || !question.trim()) {
    throw new ApiError(400, "Question is required.");
  }

  const selectedSourceIds = validateSourceIds(sourceIds);
  const relevantChunks = getRelevantChunks(question, selectedSourceIds);
  const citations = createCitationsFromChunks(relevantChunks);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  try {
    writeSseEvent(res, {
      type: "start",
      question,
    });

    const { mode } = await streamLLMAnswer(res, question, relevantChunks);

    writeSseEvent(res, {
      type: "end",
      mode,
      citations,
      relevantChunks: toClientRelevantChunks(relevantChunks),
    });

    res.end();
  } catch (error) {
    writeSseEvent(res, {
      type: "error",
      message: error.message || "Streaming failed.",
    });

    res.end();
  }
});

module.exports = {
  chatWithSources,
  streamChatWithSources,
};