const express = require("express");
const router = express.Router(); 
const { getProfessor, createGroup, getGroup, getGroups, getGroupByCode, deleteGroup, createQuest, addQuestToGroup, removeQuestFromGroup, getQuests, getQuestsInGroup, updateQuest, deleteQuest, getQuest, addTask,
    getTasks, updateTask, deleteTask, getTask, addHint, getHints, updateHint, deleteHint, getHint, saveGroupReadme, getGroupReadme, updateReadmeAcrossRepos, saveQuestOrder, getQuestOrder, resetQuestOrder, getClassIdFromRepo, saveQuestJsonConfig, getQuestJsonConfig, saveDraftQuestConfig, getDraftQuestConfig, deleteDraftQuest, getStoredValuesForClass, upsertStoredValue, getStoredValuesBackend, getCollectedInfoForClass, createTestRepo, deployQuestToRepo } = require("../controllers/groupController")
const { generateHint } = require("../controllers/aiController")
const { getStudents } = require("../controllers/studentController")


//api/group

router.route('/:professorID').get(getProfessor)

router.route("/:professorID/groups").post(createGroup).get(getGroups)
router.route("/class/:groupID").get(getGroup).delete(deleteGroup)
router.route("/code/groupByCode/:classCode").get(getGroupByCode)

router.route("/:professorID/quests").get(getQuests).post(createQuest)
router.route("/:professorID/quest/:questID").get(getQuest).put(updateQuest).delete(deleteQuest)
router.route("/:professorID/group/:groupID/quests").get(getQuestsInGroup)
router.route("/:professorID/group/:groupID/quest/:questID").patch(addQuestToGroup).put(removeQuestFromGroup)

router.route("/:professorID/group/:groupID/tasks").post(addTask).get(getTasks)
router.route("/:professorID/group/:groupID/task/:taskID").put(updateTask).delete(deleteTask).get(getTask)

router.route("/:professorID/group/:groupID/hints").post(addHint).get(getHints)
router.route("/:professorID/group/:groupID/hint/:hintID").put(updateHint).delete(deleteHint).get(getHint)

router.route("/:groupId/students").get(getStudents);
router.route("/:groupId/readme").post(saveGroupReadme).get(getGroupReadme);
router.route("/:groupId/readme/batch-update").post(updateReadmeAcrossRepos);

// Quest Order Management Routes
router.route("/:groupId/quest-order").post(saveQuestOrder).get(getQuestOrder);
router.route("/:groupId/quest-order/reset").post(resetQuestOrder);

// Get class ID from repository name
router.get('/repo/:repoName/class', getClassIdFromRepo);

// Quest JSON Configuration Routes
router.route("/:classId/quest-json-config").post(saveQuestJsonConfig).get(getQuestJsonConfig);

// Draft Quest Configuration Routes
router.route("/:classId/draft-quest-config").post(saveDraftQuestConfig).get(getDraftQuestConfig);
router.route("/:classId/draft-quest-config/:questIndex").delete(deleteDraftQuest);

// Test repository creation using draft quest configuration
router.route("/:classId/create-test-repo").post(createTestRepo);
router.route("/:classId/stored-values").get(getStoredValuesForClass);
router.route("/:classId/stored-values/backend").get(getStoredValuesBackend);
router.route("/:classId/stored-values").post(upsertStoredValue);
router.route("/:classId/collected-info").get(getCollectedInfoForClass);

// AI hint generation
router.post('/:classId/ai/generate-hint', generateHint);

// Deploy a new MCQ quest to an existing repo
// router.post('/:classId/deploy-quest-to-repo', deployQuestToRepo);

module.exports = router;