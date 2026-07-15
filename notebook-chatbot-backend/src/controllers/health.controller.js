const env = require("../config/env");
const { sendSuccess } = require("../utils/response.util");

function getRoot(req, res) {
  return sendSuccess(res, 200, "SourceMate AI backend is running", {
    app: "SourceMate AI Backend",
    version: "1.0.0",
  });
}

function getHealth(req, res) {
  return sendSuccess(res, 200, "Backend health check passed", {
    status: "running",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    llmProvider: env.llmProvider,
    apiKeyLoaded:
      Boolean(env.llmApiKey) && env.llmApiKey !== "your_llm_api_key_here",
  });
}

module.exports = {
  getRoot,
  getHealth,
};