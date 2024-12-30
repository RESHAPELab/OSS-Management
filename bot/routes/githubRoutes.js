const express = require("express");
const router = express.Router();
const githubController = require("../controllers/githubController");
const githubMiddleware = require("../middleware/githubMiddleware");

router.post("/webhook", githubMiddleware.verifyWebhook, githubController.handleWebhook);

router.post("/createIssue", githubController.createIssueInProject);
router.post("/createRepo", githubController.createRepo);
router.delete("/dropRepo", githubController.dropRepo);
router.post("/addUserToRepo", githubController.addUserToProject);
router.post("/commentIssue", githubController.createCommentInIssue);
router.patch("/closeIssue", githubController.closeIssue);

module.exports = router;