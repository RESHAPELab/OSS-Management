const express = require("express");
const router = express.Router();
const { createRepo, getProductionStatus, createMultipleRepos, getRepoCollaborationStatus, listOrganizationRepos, checkRepoReadme, createCustomRepos, getStudentScores, deleteRepository, addUserAsCollaborator } = require("../controllers/repoController");
const { createRepo, getProductionStatus, createMultipleRepos, getRepoCollaborationStatus, listOrganizationRepos, checkRepoReadme, createCustomRepos, getStudentScores, deleteRepository, addUserAsCollaborator } = require("../controllers/repoController");

router.route("/repository").post(createRepo);
router.route("/createRepos").post(createMultipleRepos);
router.route("/createCustomRepos").post(createCustomRepos);
router.route("/collaborationStatus").post(getRepoCollaborationStatus);
router.route("/studentScores").post(getStudentScores);
router.route("/checkReadme").post(checkRepoReadme);
router.route("/prodStatus").get(getProductionStatus);
router.route("/listRepos").get(listOrganizationRepos);
router.route("/deleteRepo").post(deleteRepository);
router.route("/addCollaborator").post(addUserAsCollaborator);

module.exports = router;