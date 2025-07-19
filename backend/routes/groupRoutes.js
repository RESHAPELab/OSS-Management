const express = require("express");
const router = express.Router(); 
const { getProfessor, createGroup, getGroup, getGroups, getGroupByCode, deleteGroup, createQuest, addQuestToGroup, removeQuestFromGroup, getQuests, getQuestsInGroup, updateQuest, deleteQuest, getQuest, addTask,
    getTasks, updateTask, deleteTask, getTask, addHint, getHints, updateHint, deleteHint, getHint, saveGroupReadme, getGroupReadme, saveQuestOrder, getQuestOrder, resetQuestOrder, getClassIdFromRepo } = require("../controllers/groupController")
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

// Quest Order Management Routes
router.route("/:groupId/quest-order").post(saveQuestOrder).get(getQuestOrder);
router.route("/:groupId/quest-order/reset").post(resetQuestOrder);

// Get class ID from repository name
router.get('/repo/:repoName/class', getClassIdFromRepo);

module.exports = router;