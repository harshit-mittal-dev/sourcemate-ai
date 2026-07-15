const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

function applySecurityMiddleware(app) {
  app.use(helmet());

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        success: false,
        message: "Too many requests. Please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

module.exports = applySecurityMiddleware;