const mongoose = require("mongoose");
const Task = require("../../models/TaskModel");

async function createTask(overrides = {}) {
    const {
        taskTitle = "Task Test 1",
        desc = "How much is 2 + 2?",
        quest = null,
        group = null,
        professor = null,
        points = 10,
        xp = 10,
        hints = [],
        responses = {
            accept: "Accepted",
            error: "Error",
            success: "Success"
        },
        answer = "4",
        answerType = "singleAnswer",
        answerRepoReference = null,
        prerequisite = null
    } = overrides;

    const task = new Task({
        taskTitle,
        quest,
        group,
        professor,
        desc,
        points,
        xp,
        hints,
        responses,
        answer,
        answerType,
        answerRepoReference,
        prerequisite
    });

    await task.save();
    return task;
}

module.exports = { createTask };