const express = require("express");
const router = express.Router();
const { createRepo, getProductionStatus, createMultipleRepos, getRepoCollaborationStatus, listOrganizationRepos } = require("../controllers/repoController");

router.route("/repository").post(createRepo);
router.route("/createRepos").post(createMultipleRepos);
router.route("/prodStatus").get(getProductionStatus);
router.route("/collaborationStatus").post(getRepoCollaborationStatus);
router.route("/listRepos").get(listOrganizationRepos);

module.exports = router;