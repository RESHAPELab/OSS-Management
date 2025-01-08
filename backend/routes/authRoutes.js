const express = require("express");
const router = express.Router(); 
const { signup, login, registerStudent, verifyEmail } = require("../controllers/authController");

// api/auth
router.route("/").post(signup); 
router.route("/verify").put(verifyEmail);
router.route("/login").post(login)
router.route("/student").post(registerStudent)

module.exports = router; 
