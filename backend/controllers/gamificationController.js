const { request } = require('../../bot/server');
const { sendMessageToBot } = require('../utils/botMessage');
const { multipleAnswersValidation, singleAnswerValidation, metricAnswerValidation } = require('../utils/validateAnswer');
const { CurrentQuestDescription, CompletedQuestsDescription } = require('../utils/gamificationContent');

const UserTaskProgress = require("../models/UserTaskProgressModel");
const Quest = require("../models/QuestModel");
const Task = require("../models/TaskModel");
const Hint = require("../models/HintModel");
const UserRepo = require("../models/UserRepoModel");
const Readme = require("../models/ReadmeModel");
const UserQuestProgress = require("../models/UserQuestProgressModel");

const generateNextTask = async (req, res) => {
    const { userId, questId } = req.body;

    const quest = await Quest.findById(questId);

    const userQuestProgress = await UserQuestProgress.findOne({ user: userId, quest: questId });
    if (userQuestProgress === null) {
        let userQuestProgress = new UserQuestProgress({ user: userId, quest: questId, group: quest.group, status: "active"});
        await userQuestProgress.save();
    }

    const tasks = await Task.find({ quest: questId });
    const taskIds = tasks.map(task => task.id);

    const taskProgresses = await UserTaskProgress.find({
        user: userId,
        task: { $in: taskIds }
    });

    let prerequisiteVector = [];
    if (taskProgresses.length > 0) {
        const taskIdsInProgress = taskProgresses.map(taskProgress => taskProgress.task);
        const tasksInProgress = await Task.find({ _id: { $in: taskIdsInProgress } });

        prerequisiteVector = tasksInProgress
            .map(task => task.prerequisite || [])
            .flat(); 
    }

    let notOpenedTaskIds = [];

    if (prerequisiteVector.length > 0) {
        const dependentTasks = await Task.find({ $expr: { $not: { $gt: [ { $size: { $setDifference: ["$prerequisite", prerequisiteVector] } }, 0 ] } } });
        const dependentTaskIds = dependentTasks.map(task => task._id.toString());
        const userTaskProgresses = await UserTaskProgress.find({ user: userId, task: { $in: dependentTaskIds } });
        const openedTaskIds = userTaskProgresses.map(progress => progress.task.toString());
        
        notOpenedTaskIds = dependentTaskIds.filter(taskId => !openedTaskIds.includes(taskId));
    } else {
        const tasksWithoutDependencies = await Task.find({ quest: questId, prerequisite: null });
        const tasksWithoutDependenciesIds = tasksWithoutDependencies.map(task => task._id.toString());
        const userTaskProgresses = await UserTaskProgress.find({ user: userId, task: { $in: tasksWithoutDependenciesIds } });
        const openedTaskIds = userTaskProgresses.map(progress => progress.task.toString());

        notOpenedTaskIds = tasksWithoutDependenciesIds.filter(taskId => !openedTaskIds.includes(taskId));
    }
    
    for (const taskId of notOpenedTaskIds) {
        const task = await Task.findById(taskId);
        const title = task.taskTitle;
        const body = task.desc;

        const allUserRepos = await UserRepo.find({});
        const userRepo = await UserRepo.findOne({ student: userId, group: quest.group })

        const repoName = userRepo.repository_url;
        const org = userRepo.org;

        const responseIssue = await sendMessageToBot(
            'github/createIssue',
            { org, repoName, title, body }
        );
        
        const githubUrl = responseIssue.data.url;

        const newTaskProgress = new UserTaskProgress({
            user: userId,
            task: taskId,
            githubUrl: githubUrl,
            hintsUsed: [],
            status: "active",
            xp: 10,
        });

        await newTaskProgress.save();
    }

    const questForReadme = await Quest.findById(questId);

    const mockRes = {
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; },
        statusCode: null,
        data: null,
    };

    const responseReadme = await updateReadme(
        { body: { studentId: userId, groupId: questForReadme.group } }, 
        mockRes
    );

    res.status(201).json({
        message: "Tasks processed successfully",
        notOpenedTaskIds,
    });
};

const taskAnswer = async(req, res) => {
    let answerApproved = false;
    const { issueUrl, commentBody } = req.body;

    const userTaskProgress = await UserTaskProgress.findOne({ githubUrl: issueUrl });
    const task = await Task.findOne({ id: userTaskProgress.task });
    const taskAnswerType = task.answerType;

    if (taskAnswerType === "singleAnswer") {
        answerApproved = singleAnswerValidation(task.answer, commentBody);
    } 
    else if (taskAnswerType === "multipleAnswers") {
        answerApproved = multipleAnswersValidation(task.answer, commentBody);
    } 
    else if (taskAnswerType === "metric") {
        answerApproved = metricAnswerValidation(answerRepoReference, task.answer, commentBody);
    } 
    else if (taskAnswerType === "closePullRequest") {
        // Needs to be implemented (future work)
    } 
    else if (taskAnswerType === "closeIssue") {
        // Needs to be implemented (future work)
    }

    if (answerApproved === true) {
        taskCompletion(req, res);
    } else {
        taskFailure(req, res); 
    }
}

const taskCompletion = async(req, res) => {
    const { issueUrl } = req.body;
    const parts = issueUrl.split('/');
    let org = parts[4];
    let repoName = parts[5];
    let issueNumber = parts[7]; 
    const commentBody = "Congratulations. You are wrong!";

    const responseConclusionText = await sendMessageToBot(
        'github/commentIssue',
        { org,  repoName,  issueNumber, commentBody }
    );

    const responseClosedIssue = await sendMessageToBot(
        'github/closeIssue',
        { org, repoName, issueNumber }
    );

    res.status(201).json({ message: "Task completed successfully" });
}

const taskFailure = async(req, res) => {
    const { issueUrl } = req.body;
    const parts = issueUrl.split('/');
    let org = parts[4];
    let repoName = parts[5];
    let issueNumber = parts[7]; 
    const commentBody = "This is not the correctly answer! Do you need a hint to help in the process?";

    const responseText = await sendMessageToBot(
        'github/commentIssue',
        { org,  repoName,  issueNumber, commentBody }
    );

    res.status(201).json({ message: "Task updated successfully" });
}

const taskNextHint = async(req, res) => {
    const { issueUrl } = req.body;

    const parts = issueUrl.split('/');
    const org = parts[4];
    const repoName = parts[5];
    const issueNumber = parts[7]; 

    const userTaskProgress = await UserTaskProgress.findOne({ githubUrl: issueUrl });
    const taskId = userTaskProgress.task;

    const task = await Task.findById(taskId);
    const sequence = userTaskProgress.hintsUsed.length + 1

    const nextHint = await Hint.findOne({
        task: taskId,
        sequence: sequence
    });
    
    const commentBody = nextHint.content;

    const responseConclusionText = await sendMessageToBot(
        'github/commentIssue',
        { org,  repoName,  issueNumber, commentBody }
    );

    userTaskProgress.xp = userTaskProgress.xp - nextHint.penalty
    userTaskProgress.hintsUsed.push(nextHint.id);
    
    await userTaskProgress.save();
    
    res.status(201).json({message: "Next Hint Successfuly Implemented"});
}

const questCompletion = async(req, res) => {

}

const generateNextQuest = async(req, res) => {
    
}

const dynamicComment = async(req, res) => {

}

const updateReadme = async(req, res) => {
    const { studentId, groupId } = req.body;
    const readme = await Readme.findOne({ group: groupId });
    const userRepo = await UserRepo.findOne({ student: studentId, group: groupId });
    
    let fileContent = readme.content
    const currentQuestsDescription = await CurrentQuestDescription(studentId, groupId);
    
    fileContent = fileContent + currentQuestsDescription;
    console.log(fileContent);

    const org = userRepo.org; 
    const repoName = userRepo.repository_url; 
    const filePath = 'readme.md';
    const commitMessage = "Add or update readme file"; 
    const branch = 'main';

    const responseText = await sendMessageToBot(
        'github/commitFile',
        { org, repoName, filePath, fileContent, commitMessage, branch }
    );

    res.status(201).json({message: responseText.data});
}

module.exports = {
    taskAnswer, taskCompletion, generateNextTask, taskNextHint, questCompletion, generateNextQuest, dynamicComment, updateReadme
}