const express = require("express");

const upload = require("../middleware/upload.middleware");
const {
  uploadSingleFile,
  uploadTextSource,
  uploadLinkSource,
} = require("../controllers/upload.controller");

const router = express.Router();

router.post("/file", upload.single("file"), uploadSingleFile);
router.post("/text", uploadTextSource);
router.post("/link", uploadLinkSource);

module.exports = router;