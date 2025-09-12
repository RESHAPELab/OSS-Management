const Quest = require('../models/QuestModel');
const Task = require('../models/TaskModel');
const Student = require('../models/StudentModel');
const UserQuestProgress = require('../models/UserQuestProgressModel');
const UserTaskProgress = require('../models/UserTaskProgressModel');

async function CurrentQuestDescription(studentId, groupId) {
    let currentQuestDescription = "";
    
    // Get all quests for this group
    const allQuests = await Quest.find({ group: groupId }).sort({ questOrder: 1 });
    
    if (!allQuests || allQuests.length === 0) {
        return "No quests available yet.";
    }

    // Get all tasks for all quests
    const allTasks = await Task.find({ quest: { $in: allQuests.map(q => q._id) } });
    
    // Get all task progress for this user
    const allTaskProgresses = await UserTaskProgress.find({
        user: studentId,
        task: { $in: allTasks.map(t => t._id) }
    });

    // Create a map for quick lookup
    const taskProgressMap = allTaskProgresses.reduce((map, progress) => {
        map[progress.task.toString()] = progress;
        return map;
    }, {});

    // Get completed quests
    const completedQuests = await UserQuestProgress.find({ 
        user: studentId, 
        status: "completed", 
        group: groupId 
    });
    const completedQuestIds = new Set(completedQuests.map(q => q.quest.toString()));

    // Group tasks by quest
    const tasksByQuest = {};
    allTasks.forEach(task => {
        if (!tasksByQuest[task.quest]) {
            tasksByQuest[task.quest] = [];
        }
        tasksByQuest[task.quest].push(task);
    });

    // Show all quests that have any tasks with progress (active or completed tasks)
    for (const quest of allQuests) {
        const questTasks = tasksByQuest[quest._id] || [];
        if (questTasks.length === 0) continue;
        
        // Check if this quest has any tasks with progress (active or completed)
        const hasTasksWithProgress = questTasks.some(task => {
            const progress = taskProgressMap[task._id.toString()];
            return progress && (progress.status === "active" || progress.status === "completed");
        });
        
        // Only show quest if it has tasks with progress OR if it's not completed yet
        const isCompleted = completedQuestIds.has(quest._id.toString());
        if (!hasTasksWithProgress && isCompleted) continue;
        
        currentQuestDescription += `${quest.questTitle}\n`;
        
        questTasks.sort((a, b) => a.taskOrder - b.taskOrder);
        
        questTasks.forEach(task => {
            const progress = taskProgressMap[task._id.toString()];
            
            if (progress) {
                const githubTaskUrl = progress.githubUrl.replace(
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
        currentQuestDescription += "\n";
    }

    return currentQuestDescription;
}

async function CompletedQuestsDescription (studentId, groupId) {
    let completedDescription = "";
    
    // Get all completed quests for this user and group
    const completedQuests = await UserQuestProgress.find({ 
        user: studentId, 
        status: "completed", 
        group: groupId 
    });
    
    if (!completedQuests || completedQuests.length === 0) {
        return "  - None yet\n";
    }

    // Get all quests
    const allQuests = await Quest.find({ 
        _id: { $in: completedQuests.map(q => q.quest) } 
    });
    
    // Get all tasks for completed quests
    const allTasks = await Task.find({ 
        quest: { $in: allQuests.map(q => q._id) } 
    });
    
    // Get all task progress for this user
    const allTaskProgresses = await UserTaskProgress.find({
        user: studentId,
        task: { $in: allTasks.map(t => t._id) }
    });

    // Create a map for quick lookup
    const taskProgressMap = allTaskProgresses.reduce((map, progress) => {
        map[progress.task.toString()] = progress;
        return map;
    }, {});

    // Group tasks by quest
    const tasksByQuest = {};
    allTasks.forEach(task => {
        if (!tasksByQuest[task.quest]) {
            tasksByQuest[task.quest] = [];
        }
        tasksByQuest[task.quest].push(task);
    });

    // Show completed quests
    allQuests.sort((a, b) => a.questOrder - b.questOrder);
    
    for (const quest of allQuests) {
        completedDescription += `  - ${quest.questTitle}\n`;
        
        const questTasks = tasksByQuest[quest._id] || [];
        questTasks.sort((a, b) => a.taskOrder - b.taskOrder);
        
        questTasks.forEach(task => {
            const progress = taskProgressMap[task._id.toString()];
            
            if (progress && progress.status === "completed") {
                const githubTaskUrl = progress.githubUrl.replace(
                    "https://api.github.com/repos/",
                    "https://github.com/"
                );
                completedDescription += `    - ~${task.taskTitle}~ [[COMPLETED](${githubTaskUrl})]\n`;
            } else {
                completedDescription += `    - ~${task.taskTitle}~ [[COMPLETED]]\n`;
            }
        });
    }

    return completedDescription;
}

module.exports = {
    CurrentQuestDescription, CompletedQuestsDescription
}