const express = require("express");
const router = express.Router();
const { createRepo } = require("../controllers/repoController");

router.route("/repository").post(createRepo);

module.exports = router;