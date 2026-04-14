const express = require("express");
const router = express.Router();
const githubController = require("../controllers/githubController");
const githubMiddleware = require("../middleware/githubMiddleware");
const authMiddleware = require('../middleware/authMiddleware');
const { getGithubAppInstallationAccessToken } = require('../controllers/githubAppAuth');

// Add this new route for backend service to get GitHub App token
router.get('/installation-token', async (req, res) => {
  try {
    // Verify the request is from the backend service
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.BACKEND_API_KEY}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = await getGithubAppInstallationAccessToken();
    res.json({ token });
  } catch (error) {
    console.error('Error getting GitHub App installation token:', error);
    res.status(500).json({ error: 'Failed to get installation token' });
  }
});

router.post("/webhook", githubMiddleware.verifyWebhook, githubController.handleWebhook);

router.post("/createIssue", authMiddleware.verifyBackendRequest, githubController.createIssueInProject);
router.post("/createRepo", authMiddleware.verifyBackendRequest, githubController.createRepo);
router.post("/dropRepo", authMiddleware.verifyBackendRequest, githubController.dropRepo);
router.post("/addUserToRepo", authMiddleware.verifyBackendRequest, githubController.addUserToProject);
router.post("/commentIssue", authMiddleware.verifyBackendRequest, githubController.createCommentInIssue);
router.post("/checkCollaboration", authMiddleware.verifyBackendRequest, githubController.checkCollaboration);
router.post("/listRepos", authMiddleware.verifyBackendRequest, githubController.listRepos);
router.post("/checkReadme", authMiddleware.verifyBackendRequest, githubController.checkReadmeExists);
router.post("/classGrades", authMiddleware.verifyBackendRequest, githubController.getClassGrades);

module.exports = router;