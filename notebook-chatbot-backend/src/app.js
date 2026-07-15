const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const env = require("./config/env");
const corsOptions = require("./config/cors");
const applySecurityMiddleware = require("./middleware/security.middleware");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");

const healthRoutes = require("./routes/health.routes");
const uploadRoutes = require("./routes/upload.routes");
const sourceRoutes = require("./routes/source.routes");
const chatRoutes = require("./routes/chat.routes");

const { getRoot } = require("./controllers/health.controller");

const app = express();

const frontendDistPath = path.resolve(
  __dirname,
  "..",
  "..",
  "notebook-chatbot-frontend",
  "dist"
);

const frontendIndexPath = path.join(frontendDistPath, "index.html");

const isProductionFrontendReady =
  env.nodeEnv === "production" && fs.existsSync(frontendIndexPath);

console.log("NODE_ENV:", env.nodeEnv);
console.log("Frontend dist path:", frontendDistPath);
console.log("Frontend index exists:", fs.existsSync(frontendIndexPath));

if (isProductionFrontendReady) {
  app.use(
    "/assets",
    express.static(path.join(frontendDistPath, "assets"), {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript");
        }

        if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        }

        if (filePath.endsWith(".svg")) {
          res.setHeader("Content-Type", "image/svg+xml");
        }
      },
    })
  );

  app.use(
    express.static(frontendDistPath, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript");
        }

        if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        }

        if (filePath.endsWith(".svg")) {
          res.setHeader("Content-Type", "image/svg+xml");
        }
      },
    })
  );

  app.get("/favicon.ico", (req, res) => {
    const faviconPath = path.join(frontendDistPath, "favicon.svg");

    if (fs.existsSync(faviconPath)) {
      return res.type("image/svg+xml").sendFile(faviconPath);
    }

    return res.status(204).end();
  });
}

applySecurityMiddleware(app);

app.use(cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.get("/api/root", getRoot);

app.use("/api", healthRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/sources", sourceRoutes);
app.use("/api/chat", chatRoutes);

if (isProductionFrontendReady) {
  app.get("/", (req, res) => {
    return res.sendFile(frontendIndexPath);
  });

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.path.includes(".")) {
      return res.status(404).send("Static file not found");
    }

    return res.sendFile(frontendIndexPath);
  });
} else {
  app.get("/", getRoot);
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;