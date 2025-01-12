const { request } = require('../../bot/server');
const {signPayload} = require('../../utils/botMessage');

const UserTaskProgress = require("../models/UserTaskProgress");
const Hint = require("../models/HintModel");

const taskAnswer = async(req, res) => {

}

const taskCompletion = async(req, res) => {
    const issueUrl = req.body.issue.url;
    const parts = issueUrl.split('/');
    const org = parts[4];
    const repo = parts[5];
    const issueNumber = parts[7]; 
    // const commentBody = await dynamicComment(req, res);

    const signatureComment = signPayload({ org, repo, issueNumber, commentBody });
    const signatureClose = signPayload({ org, repo, issueNumber });

    const responseConclusionText = await request
    .post('/github/commentIssue') // Modify for bot url
    .set("x-bot-signature", signatureComment)
    .send({
        org, 
        repo, 
        issueNumber,
        commentBody
    });

    const responseClosedIssue = await request
    .post('/github/closeIssue') // Modify for bot url
    .set("x-bot-signature", signatureClose)
    .send({
        org,
        repoName,
        issueNumber
    });

    // const responseNextTask = await generateNextTask(req, res);

    res.status(201);
}

const generateNextTask = async(req, res) => {

}

const taskFailure = async(req, res) => {

}

const taskNextHint = async(req, res) => {
    const issueUrl = req.body.issue.url;
    const parts = issueUrl.split('/');
    const org = parts[4];
    const repo = parts[5];
    const issueNumber = parts[7]; 

    const userTaskProgress = await UserTaskProgress.findOne({
        githubUrl: issueUrl,
    });

    const NextHint = await Hint.findOne({
        quest: userTaskProgress.task.quest,
        task: userTaskProgress.task.id,
        sequence: userTaskProgress.hintsUsed.length + 1
    });
    
    const commentBody = NextHint.content;
    const signatureComment = signPayload({ org, repo, issueNumber, commentBody });

    const responseHint = await request
    .post('/github/commentIssue') // Modify for bot url
    .set("x-bot-signature", signatureComment)
    .send({
        org, 
        repo, 
        issueNumber,
        commentBody
    });

    userTaskProgress.xp = userTaskProgress.xp - NextHint.penalty
    userTaskProgress.hintsUsed.push(NextHint.id);
    
    res.status(201);
}

const questCompletion = async(req, res) => {

}

const generateNextQuest = async(req, res) => {
    
}

const dynamicComment = async(req, res) => {

}

module.exports = {
    taskCompletion
}