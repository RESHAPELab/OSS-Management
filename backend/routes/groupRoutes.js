const express = require("express");
const router = express.Router(); 
const { getProfessor, createGroup, getGroup, getGroups, deleteGroup, createQuest, addQuestToGroup, removeQuestFromGroup, getQuests, getQuestsInGroup, updateQuest, deleteQuest, getQuest, addTask,
    getTasks, updateTask, deleteTask, getTask, addHint, getHints, updateHint, deleteHint, getHint } = require("../controllers/groupController")

router.route('/:professorID').get(getProfessor)

router.route("/:professorID/groups").post(createGroup).get(getGroups)
router.route("/:professorID/group/:groupID").get(getGroup).delete(deleteGroup)

router.route("/:professorID/quests").get(getQuests).post(createQuest)
router.route("/:professorID/quest/:questID").get(getQuest).put(updateQuest).delete(deleteQuest)
router.route("/:professorID/group/:groupID/quests").get(getQuestsInGroup)
router.route("/:professorID/group/:groupID/quest/:questID").patch(addQuestToGroup).put(removeQuestFromGroup)

router.route("/:professorID/group/:groupID/tasks").post(addTask).get(getTasks)
router.route("/:professorID/group/:groupID/task/:taskID").put(updateTask).delete(deleteTask).get(getTask)

router.route("/:professorID/group/:groupID/hints").post(addHint).get(getHints)
router.route("/:professorID/group/:groupID/hint/:hintID").put(updateHint).delete(deleteHint).get(getHint)

module.exports = router;