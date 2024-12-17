const express = require("express");
const router = express.Router();
const githubController = require("../controllers/githubController");
const githubMiddleware = require("../middleware/githubMiddleware");

router.post("/webhook", githubMiddleware.verifyWebhook, githubController.handleWebhook);

router.post("/createIssue", githubController.createIssue);
router.post("/updateIssue", githubController.updateIssue);
router.post("/closeIssue", githubController.closeIssue);
router.post("/createIssueComment", githubController.createComment);
router.post("/updateIssueComment", githubController.updateComment);
router.post("/deleteIssueComment", githubController.deleteComment);
router.get("/numberIssues", githubController.getNumberIssues);
router.get("/numberPullRequests", githubController.getNumberPullRequests);
router.get("/topConributor", githubController.getTopConributor);

module.exports = router;