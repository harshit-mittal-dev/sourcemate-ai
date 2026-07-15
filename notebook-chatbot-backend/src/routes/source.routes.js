const express = require("express");

const {
  getAllSources,
  getSourceById,
  deleteSourceById,
  deleteAllSources,
} = require("../controllers/source.controller");

const router = express.Router();

router.get("/", getAllSources);
router.delete("/", deleteAllSources);
router.get("/:sourceId", getSourceById);
router.delete("/:sourceId", deleteSourceById);

module.exports = router;