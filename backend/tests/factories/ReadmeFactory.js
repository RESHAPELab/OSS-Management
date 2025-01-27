const mongoose = require("mongoose");
const Readme = require("../../models/ReadmeModel");

async function createReadme(overrides = {}) {
    const {
        group = null,
        content = null,
        dynamicContent = []
    } = overrides;

    const readme = new Readme({
        group,
        content,
        dynamicContent,
    });

    await readme.save();
    return readme;
}

module.exports = { createReadme }