 const multer = require("multer");

const ApiError = require("../utils/ApiError");
const env = require("../config/env");

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong";

  if (error instanceof multer.MulterError) {
    statusCode = 400;

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Maximum allowed size is 10 MB.";
    } else {
      message = `Upload error: ${error.message}`;
    }
  }

  if (error.name === "SyntaxError" && error.status === 400 && "body" in error) {
    statusCode = 400;
    message = "Invalid JSON request body.";
  }

  const response = {
    success: false,
    message:
      statusCode === 500 && env.nodeEnv === "production"
        ? "Internal server error"
        : message,
  };

  if (error.details) {
    response.details = error.details;
  }

  if (env.nodeEnv === "development") {
    response.stack = error.stack;
  }

  console.error("Backend error:", {
    statusCode,
    message,
    path: req.originalUrl,
    method: req.method,
  });

  return res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};