const mongoose = require("mongoose");
const UserTaskProgress = require("../../models/UserTaskProgressModel");

async function createUserTaskProgress(overrides = {}) {
    const {
        user = 1,
        task = 1,
        githubUrl = "example.com",
        hintsUsed = [],
        status = "opened",
        xp = 10
    } = overrides;

    const userTaskProgress = new UserTaskProgress({
        user,
        task,
        githubUrl,
        hintsUsed,
        status,
        xp
    });

    await userTaskProgress.save();
    return userTaskProgress;
}

module.exports = { createUserTaskProgress };