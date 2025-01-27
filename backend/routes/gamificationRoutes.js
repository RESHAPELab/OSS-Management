const express = require("express");
const router = express.Router(); 

const { taskAnswer, taskCompletion, generateNextTask, taskNextHint, questCompletion, generateNextQuest, dynamicComment, updateReadme } = require("../controllers/gamificationController")

router.route("/createTask").post(generateNextTask);
router.route("/closeTask").post(taskCompletion);
router.route("/hint").post(taskNextHint);
router.route("/updateReadme").post(updateReadme);

module.exports = router;