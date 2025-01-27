const Quest = require('../models/QuestModel');
const Task = require('../models/TaskModel');
const Student = require('../models/StudentModel');
const UserQuestProgress = require('../models/UserQuestProgressModel');
const UserTaskProgress = require('../models/UserTaskProgressModel');

async function CurrentQuestDescription(studentId, groupId) {
    let currentQuestDescription = "";
    const userQuestProgress = await UserQuestProgress.findOne({ user: studentId, status: "active", group: groupId});
    
    if (!userQuestProgress) { throw new Error("No active quest found for this student."); }

    const quest = await Quest.findById(userQuestProgress.quest);

    currentQuestDescription += `- ${quest.questTitle}\n`;

    const tasks = await Task.find({ quest: quest.id });
    const taskIds = tasks.map(task => task.id);

    const taskProgresses = await UserTaskProgress.find({
        user: studentId,
        task: { $in: taskIds }
    });

    const taskProgressMap = taskProgresses.reduce((map, progress) => {
        map[progress.task] = progress;
        return map;
    }, {});

    let githubTaskUrl;
    tasks.forEach(task => {
        const progress = taskProgressMap[task.id];
        if (progress) {
            githubTaskUrl = progress.githubUrl.replace(
                "https://api.github.com/repos/",
                "https://github.com/"
            );

            if (progress.status === "completed") {
                currentQuestDescription += `  - ~${task.taskTitle}~ [[COMPLETED](${githubTaskUrl})]\n`;
            } else if (progress.status === "active") {
                currentQuestDescription += `  - ${task.taskTitle} [[Click here to start](${githubTaskUrl})]\n`;
            } else {
                currentQuestDescription += `  - ${task.taskTitle}\n`;
            }
        } else {
            currentQuestDescription += `  - ${task.taskTitle}\n`;
        }
    });

    return currentQuestDescription;
}

async function CompletedQuestsDescription (studentId) {
    
}

module.exports = {
    CurrentQuestDescription, CompletedQuestsDescription
}