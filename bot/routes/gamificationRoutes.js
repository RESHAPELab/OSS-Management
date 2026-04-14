const express = require("express");
const router = express.Router();
const gamificationController = require("../controllers/gamificationController");
const authMiddleware = require('../middleware/authMiddleware');

router.post("/createRepos", authMiddleware.verifyBackendRequest, gamificationController.createRepos);

module.exports = router; 