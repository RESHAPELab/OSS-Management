const express = require('express');
const router = express.Router();
const controller = require('../controllers/generateJsonQuestController');

router.post('/quest', controller.createQuest);
router.get('/quests/:professorId', controller.getQuestsByProfessor);
router.get('/quest/:questId', controller.getQuestById);
router.put('/quest/:questId', controller.updateQuest);
router.delete('/quest/:questId', controller.deleteQuest);

module.exports = router; 