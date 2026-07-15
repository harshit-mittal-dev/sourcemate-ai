const env = require("./env");

const allowedOrigins = env.frontendUrl
  .split(",")
  .map((origin) => origin.trim());

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

module.exports = corsOptions;