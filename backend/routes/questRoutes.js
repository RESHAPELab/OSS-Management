const express = require('express');
const router = express.Router();
const { uploadMCQQuest, getQuestsByProfessor, deleteQuest, updateQuest } = require('../controllers/questController');

// Upload MCQ Quest
router.post('/upload-mcq', uploadMCQQuest);

// Get quests by professor
router.get('/professor/:professorId', getQuestsByProfessor);

// Update quest
router.put('/:questId', updateQuest);

// Delete quest
router.delete('/:questId', deleteQuest);

module.exports = router; 