const express = require("express");
const router = express.Router(); 
const { signup, verifyCode } = require("../controllers/authController");

router.route("/").post(signup); 
router.route("/verifyCode").put(verifyCode);

module.exports = router; 
