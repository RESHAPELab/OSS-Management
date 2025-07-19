const express = require("express");
const router = express.Router();
const { createRepo, getProductionStatus, createMultipleRepos, getRepoCollaborationStatus, listOrganizationRepos, checkRepoReadme, createCustomRepos, getStudentScores } = require("../controllers/repoController");

router.route("/repository").post(createRepo);
router.route("/createRepos").post(createMultipleRepos);
router.route("/createCustomRepos").post(createCustomRepos);
router.route("/collaborationStatus").post(getRepoCollaborationStatus);
router.route("/studentScores").post(getStudentScores);
router.route("/checkReadme").post(checkRepoReadme);
router.route("/prodStatus").get(getProductionStatus);
router.route("/listRepos").get(listOrganizationRepos);

module.exports = router;