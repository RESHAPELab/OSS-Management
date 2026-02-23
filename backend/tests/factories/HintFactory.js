const mongoose = require("mongoose");
const Hint = require("../../models/HintModel");

async function createHint(overrides = {}) {
    const {
        task = null,
        sequence = 1,
        penalty = 10,
        content = "This is a hint used for testing!"
    } = overrides; 

    const hint = new Hint({
        task,
        sequence,
        penalty,
        content
    });

    await hint.save();
    return hint;
}

module.exports = { createHint };