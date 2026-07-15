function createCitationsFromChunks(chunks) {
  const citationMap = new Map();

  chunks.forEach((chunk) => {
    const key = `${chunk.sourceId}-${chunk.pageNumber}`;

    if (!citationMap.has(key)) {
      citationMap.set(key, {
        sourceId: chunk.sourceId,
        sourceName: chunk.sourceName,
        page: chunk.pageNumber || 1,
        chunkId: chunk.id,
      });
    }
  });

  return Array.from(citationMap.values());
}

module.exports = {
  createCitationsFromChunks,
};