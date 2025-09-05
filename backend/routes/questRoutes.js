const express = require('express');
const router = express.Router();
const { uploadMCQQuest, getQuestsByProfessor, deleteQuest, updateQuest, getQuestById, getQuestTaskTypes, getAllQuests } = require('../controllers/questController');

// Upload MCQ Quest
router.post('/upload-mcq', uploadMCQQuest);

// Get all quests (for importing)
router.get('/all', getAllQuests);

// Get quests by professor
router.get('/professor/:professorId', getQuestsByProfessor);

// Get quest task types analysis
router.get('/:questId/task-types', getQuestTaskTypes);

// Get individual quest by ID
router.get('/:questId', getQuestById);

// Update quest
router.put('/:questId', updateQuest);

// Delete quest
router.delete('/:questId', deleteQuest);

module.exports = router; 