const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  llmProvider: process.env.LLM_PROVIDER || "demo",
  llmModel: process.env.LLM_MODEL || "gpt-4.1-mini",
  llmApiKey: process.env.LLM_API_KEY || "",
};

module.exports = env;