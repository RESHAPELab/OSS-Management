const mongoose = require("mongoose");
const Quest = require("../../models/QuestModel");

async function createQuest(overrides = {}) {
    const {
        questTitle = "Quest Test 1",
        group = null,
        professor = null,
        prerequisite = null,
        tasks = [], 
        finalQuiz = null,
    } = overrides;

    const quest = new Quest({
        questTitle,
        group,
        professor,
        prerequisite,
        tasks,
        finalQuiz
    });

    await quest.save();
    return quest;
}

module.exports = { createQuest }