const express = require("express");

const {
  chatWithSources,
  streamChatWithSources,
} = require("../controllers/chat.controller");

const router = express.Router();

router.post("/", chatWithSources);
router.post("/stream", streamChatWithSources);

module.exports = router;