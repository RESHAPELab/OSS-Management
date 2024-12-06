const express = require("express");
const router = express.Router(); 
const { signup, verifyCode, login, generatePasswordRecoveringCode, recoverPassword } = require("../controllers/authController");

router.route("/").post(signup); 
router.route("/verifyCode").put(verifyCode);
router.route("/login").post(login);
router.route("/recoverPasswordCode").post(generatePasswordRecoveringCode);
router.route("/recoverPassword").post(recoverPassword);

module.exports = router; 
