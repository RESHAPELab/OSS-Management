const express = require("express");
const router = express.Router(); 

const { taskAnswer, taskCompletion, generateNextTask, taskNextHint, questCompletion, generateNextQuest, dynamicComment, updateReadme, unlockQuest, triggerCacheCommand, deployQuestToClass, unlockQuestForStudents, purpleDeployQuest, updateLiveTaskConfig } = require("../controllers/gamificationController")

router.route("/createTask").post(generateNextTask);
router.route("/closeTask").post(taskCompletion);
router.route("/hint").post(taskNextHint);
router.route("/updateReadme").post(updateReadme);
router.route("/unlockQuest").post(unlockQuest);
router.route("/cache").post(triggerCacheCommand);
router.route("/deployQuest").post(deployQuestToClass);
router.route("/purpleDeployQuest").post(purpleDeployQuest);
router.route("/unlockQuestForStudents").post(unlockQuestForStudents);
router.route("/update-live-task-config").post(updateLiveTaskConfig);

module.exports = router;