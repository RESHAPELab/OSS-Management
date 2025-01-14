const express = require("express");
const router = express.Router(); 

const { taskAnswer, taskCompletion, generateNextTask, taskNextHint, questCompletion, generateNextQuest, dynamicComment } = require("../controllers/gamificationController")

router.route("/createTask").post(generateNextTask);

module.exports = router;