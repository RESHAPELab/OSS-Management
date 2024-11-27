const express = require("express");
const router = express.Router(); 
const { signup, verifyCode, login } = require("../controllers/authController");

router.route("/").post(signup); 
router.route("/verifyCode").put(verifyCode);
router.route("/login").post(login)

module.exports = router; 
