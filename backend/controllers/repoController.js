/*
Maybe one day we need to implement the creation of a repo
for different organizations. Now, I am not going to 
implement the logic. Time costs :(
*/
const UserRepo = require("../models/UserRepoModel");
const axios = require('axios');
const { sendMessageToBot } = require('../utils/botMessage');

const createRepo = async (req, res) => {
    const { organizationGh, studentId, studentGithubUsername, groupId, groupName } = req.body;

    const repoName = groupName + "-" + studentGithubUsername + "-" + Date.now();
    const repoDescription = "Gamified Repository (OSS Management)";
    const privateRepo = true;
    const role = "push";
    const org = organizationGh;
    const username = studentGithubUsername;

    const responseCreateRepo = await sendMessageToBot(
        "github/createRepo", 
        { org, repoName, repoDescription, privateRepo },
    )
    
    const repository_url = responseCreateRepo.data.name
    const group = groupId
    const student = studentId

    let userRepo = new UserRepo({ student, group, repository_url, org });
    await userRepo.save();

    const responseAddUserToRepo = await sendMessageToBot(
        "github/addUserToRepo",
        { org, repoName, username, role },
    );
    
    res.status(201).json({message: "Repository created and user added successfully"});
}

module.exports = {
    createRepo
}