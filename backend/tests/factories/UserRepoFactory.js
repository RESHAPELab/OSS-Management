const mongoose = require("mongoose");
const UserRepo = require("../../models/UserRepoModel");

async function createUserRepo(overrides = {}) {
    const {
        student = 1,
        group = 1,
        repository_url = "example.com",
        org = 'OSS-Doorway-Development'
    } = overrides;

    const userRepo = new UserRepo({
        student, 
        group, 
        repository_url,
        org
    });

    await userRepo.save();
    return userRepo;
}

module.exports = { createUserRepo };