const fs = require("fs");
const path = require("path");

const chunksFilePath = path.join(__dirname, "..", "data", "chunks.json");

function ensureChunksFile() {
  const dataDirectory = path.dirname(chunksFilePath);

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(chunksFilePath)) {
    fs.writeFileSync(chunksFilePath, "[]", "utf-8");
  }
}

function readChunks() {
  ensureChunksFile();

  try {
    const rawData = fs.readFileSync(chunksFilePath, "utf-8");
    return JSON.parse(rawData || "[]");
  } catch (error) {
    return [];
  }
}

function writeChunks(chunks) {
  ensureChunksFile();
  fs.writeFileSync(chunksFilePath, JSON.stringify(chunks, null, 2), "utf-8");
}

function replaceChunksForSource(sourceId, newChunks) {
  const chunks = readChunks();
  const filteredChunks = chunks.filter((chunk) => chunk.sourceId !== sourceId);
  const updatedChunks = [...filteredChunks, ...newChunks];

  writeChunks(updatedChunks);

  return newChunks;
}

function getChunksBySourceId(sourceId) {
  const chunks = readChunks();
  return chunks.filter((chunk) => chunk.sourceId === sourceId);
}

function getAllChunks() {
  return readChunks();
}

function deleteChunksBySourceId(sourceId) {
  const chunks = readChunks();
  const chunksToDelete = chunks.filter((chunk) => chunk.sourceId === sourceId);
  const remainingChunks = chunks.filter((chunk) => chunk.sourceId !== sourceId);

  writeChunks(remainingChunks);

  return chunksToDelete.length;
}

function deleteAllChunks() {
  writeChunks([]);
}

module.exports = {
  replaceChunksForSource,
  getChunksBySourceId,
  getAllChunks,
  deleteChunksBySourceId,
  deleteAllChunks,
};