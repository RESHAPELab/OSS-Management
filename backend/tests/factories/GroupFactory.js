const mongoose = require("mongoose");
const Group = require("../../models/GroupModel");

async function createGroup(overrides = {}) {
    const {
        groupName = "Test Group",
        members = [],
        admin = [],
        professor = [],
        quests = [],
        classCode = "1",
        students = []
    } = overrides; 

    const group = new Group({
        groupName,
        members,
        admin,
        professor,
        quests,
        classCode,
        students
    });

    await group.save();
    return group;
}

module.exports = { createGroup };