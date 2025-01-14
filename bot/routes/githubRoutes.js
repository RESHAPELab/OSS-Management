const express = require("express");
const router = express.Router();
const githubController = require("../controllers/githubController");
const githubMiddleware = require("../middleware/githubMiddleware");
const authMiddleware = require('../middleware/authMiddleware');

router.post("/webhook", githubMiddleware.verifyWebhook, githubController.handleWebhook);

router.post("/createIssue", authMiddleware.verifyBackendRequest, githubController.createIssueInProject);
router.post("/createRepo", authMiddleware.verifyBackendRequest, githubController.createRepo);
router.delete("/dropRepo", authMiddleware.verifyBackendRequest, githubController.dropRepo);
router.post("/addUserToRepo", authMiddleware.verifyBackendRequest, githubController.addUserToProject);
router.post("/commentIssue", authMiddleware.verifyBackendRequest, githubController.createCommentInIssue);
router.patch("/closeIssue", authMiddleware.verifyBackendRequest, githubController.closeIssue);

module.exports = router;