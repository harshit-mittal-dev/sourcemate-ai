const fs = require("fs");
const path = require("path");

const sourcesFilePath = path.join(__dirname, "..", "data", "sources.json");

function ensureSourcesFile() {
  const dataDirectory = path.dirname(sourcesFilePath);

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(sourcesFilePath)) {
    fs.writeFileSync(sourcesFilePath, "[]", "utf-8");
  }
}

function readSources() {
  ensureSourcesFile();

  try {
    const rawData = fs.readFileSync(sourcesFilePath, "utf-8");
    return JSON.parse(rawData || "[]");
  } catch (error) {
    return [];
  }
}

function writeSources(sources) {
  ensureSourcesFile();
  fs.writeFileSync(sourcesFilePath, JSON.stringify(sources, null, 2), "utf-8");
}

function addSource(source) {
  const sources = readSources();
  sources.push(source);
  writeSources(sources);
  return source;
}

function getAllSources() {
  return readSources();
}

function getSourceById(sourceId) {
  const sources = readSources();
  return sources.find((source) => source.id === sourceId) || null;
}

function deleteSourceById(sourceId) {
  const sources = readSources();
  const sourceToDelete = sources.find((source) => source.id === sourceId);

  if (!sourceToDelete) {
    return null;
  }

  const remainingSources = sources.filter((source) => source.id !== sourceId);
  writeSources(remainingSources);

  return sourceToDelete;
}

function deleteAllSources() {
  writeSources([]);
}

module.exports = {
  addSource,
  getAllSources,
  getSourceById,
  deleteSourceById,
  deleteAllSources,
};