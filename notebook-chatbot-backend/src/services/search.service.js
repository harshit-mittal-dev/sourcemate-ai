function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const stopWords = new Set([
    "the",
    "is",
    "are",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "what",
    "why",
    "how",
    "explain",
    "tell",
    "me",
    "about",
    "this",
    "that",
  ]);

  return normalizeText(text)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function scoreChunk(questionTokens, chunk) {
  const chunkText = normalizeText(chunk.text);
  let score = 0;

  questionTokens.forEach((token) => {
    if (chunkText.includes(token)) {
      score += 3;
    }

    const occurrences = chunkText.split(token).length - 1;
    score += occurrences;
  });

  return score;
}

function searchRelevantChunks(question, chunks, options = {}) {
  const limit = options.limit || 5;
  const sourceIds = options.sourceIds || [];

  const questionTokens = tokenize(question);

  if (questionTokens.length === 0) {
    return [];
  }

  const filteredChunks =
    sourceIds.length > 0
      ? chunks.filter((chunk) => sourceIds.includes(chunk.sourceId))
      : chunks;

  const scoredChunks = filteredChunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(questionTokens, chunk),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scoredChunks;
}

module.exports = {
  searchRelevantChunks,
};