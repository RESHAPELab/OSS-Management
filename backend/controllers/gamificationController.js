const { request } = require('../../bot/server');
const { sendMessageToBot } = require('../utils/botMessage');
const { multipleAnswersValidation, singleAnswerValidation, metricAnswerValidation } = require('../utils/validateAnswer');

const UserTaskProgress = require("../models/UserTaskProgressModel");
const Quest = require("../models/QuestModel");
const Task = require("../models/TaskModel");
const Hint = require("../models/HintModel");
const UserRepo = require("../models/UserRepoModel");

const generateNextTask = async (req, res) => {
    const { userId, questId } = req.body;

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
        const quest = await Quest.findById(questId);

        console.log(userId, quest.group);

        const allUserRepos = await UserRepo.find({});
        console.log("All UserRepo documents:", allUserRepos);

        const userRepo = await UserRepo.findOne({ student: userId, group: quest.group })

        const repoName = userRepo.repository_url;
        const org = userRepo.org;
        
        console.log(org, repoName, title, body);

        const responseIssue = await sendMessageToBot(
            'github/createIssue',
            { org, repoName, title, body }
        );
        
        const newTaskProgress = new UserTaskProgress({
            user: userId,
            task: taskId,
            githubUrl: 'githubUrl',
            hintsUsed: [],
            status: "inProgress",
            xp: 10,
        });

        await newTaskProgress.save();
        console.log(`Task progress created for task ${taskId}`);
    }

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
    const org = parts[4];
    const repo = parts[5];
    const issueNumber = parts[7]; 
    const commentBody = "Congratulations. You are wrong!";

    const responseConclusionText = await sendMessageToBot(
        'github/commentIssue',
        { org,  repo,  issueNumber, commentBody }
    );

    const responseClosedIssue = await sendMessageToBot(
        'github/closeIssue',
        { org, repoName, issueNumber }
    );

    res.status(201).json({message: "Task completed successfully"});
}

const taskFailure = async(req, res) => {

}

const taskNextHint = async(req, res) => {
    const issueUrl = req.body.issue.url;
    const parts = issueUrl.split('/');
    const org = parts[4];
    const repo = parts[5];
    const issueNumber = parts[7]; 

    const userTaskProgress = await UserTaskProgress.findOne({ githubUrl: issueUrl });

    const NextHint = await Hint.findOne({
        quest: userTaskProgress.task.quest,
        task: userTaskProgress.task.id,
        sequence: userTaskProgress.hintsUsed.length + 1
    });
    
    const commentBody = NextHint.content;

    const responseHint = await sendMessageToBot(
        'github/commentIssue',
        { org,  repo,  issueNumber, commentBody }
    );

    userTaskProgress.xp = userTaskProgress.xp - NextHint.penalty
    userTaskProgress.hintsUsed.push(NextHint.id);
    
    res.status(201).json({message: "Next Hint Successfuly Implemented"});
}

const questCompletion = async(req, res) => {

}

const generateNextQuest = async(req, res) => {
    
}

const dynamicComment = async(req, res) => {

}

module.exports = {
    taskAnswer, taskCompletion, generateNextTask, taskNextHint, questCompletion, generateNextQuest, dynamicComment
}