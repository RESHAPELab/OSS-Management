/*
Maybe one day we need to implement the creation of a repo
for different organizations. Now, I am not going to 
implement the logic. Time costs :(
*/
const UserRepo = require("../models/UserRepoModel");
require("dotenv").config();


const axios = require('axios');
const { sendMessageToBot } = require('../utils/botMessage');
const { recoverPassword } = require("./authController");

const createRepo = async (req, res) => {
    const { organizationGh, studentId, studentGithubUsername, groupId, groupName } = req.body;

    console.log(req.body);
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
    console.log('response', responseCreateRepo);
    
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

const getProductionStatus = async (req, res) => { 
    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'production') {
        res.status(200).json({organizationGh: process.env.USER_AGENT_PROD});
    } else { 
       res.status(200).json({organizationGh: process.env.USER_AGENT_DEV});
   }
}

module.exports = {
    createRepo,
    getProductionStatus
}