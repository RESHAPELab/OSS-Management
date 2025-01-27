const express = require("express");
const router = express.Router();
const { createRepo, getProductionStatus} = require("../controllers/repoController");

router.route("/repository").post(createRepo);
router.route("/prodStatus").get(getProductionStatus);

module.exports = router;