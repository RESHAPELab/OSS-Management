// const { request } = require('../../bot/server'); // Removed unused import
const { sendMessageToBot } = require('../utils/botMessage');
const { multipleAnswersValidation, singleAnswerValidation, metricAnswerValidation } = require('../utils/validateAnswer');
const { CurrentQuestDescription, CompletedQuestsDescription } = require('../utils/gamificationContent');

const UserTaskProgress = require("../models/UserTaskProgressModel");
const Quest = require("../models/QuestModel");
const Task = require("../models/TaskModel");
const Hint = require("../models/HintModel");
const Readme = require("../models/ReadmeModel");
const UserQuestProgress = require("../models/UserQuestProgressModel");
const UserRepo = require("../models/UserRepoModel");

const generateNextTask = async (req, res) => {
    const { userId, questId } = req.body;

    try {
        const quest = await Quest.findById(questId);
        if (!quest) { return res.status(404).json({ message: "Quest not found." }); }

        let userQuestProgress = await UserQuestProgress.findOne({ user: userId, quest: questId });
        
        if (!userQuestProgress) {
            userQuestProgress = new UserQuestProgress({
                user: userId,
                quest: questId,
                group: quest.group,
                status: "active"
            });

            await userQuestProgress.save();
        }

        const tasks = await Task.find({ quest: questId });
        const taskIds = tasks.map(task => task._id.toString());

        const taskProgresses = await UserTaskProgress.find({ user: userId, task: { $in: taskIds } });

        const completedTaskIds = taskProgresses
            .filter(taskProgress => taskProgress.status === "completed")
            .map(taskProgress => taskProgress.task.toString());

        const activeTaskIds = taskProgresses
            .filter(taskProgress => taskProgress.status === "active")
            .map(taskProgress => taskProgress.task.toString());

        for (const task of tasks) {
            const taskId = task._id;
            const taskTitle = task.taskTitle;
            const taskPrerequisite = task.prerequisite || [];

            const prerequisitesCompleted = taskPrerequisite.every(
                prereqId => completedTaskIds.some(completedId => completedId.toString() === prereqId.toString())
            );
            
            if (activeTaskIds.includes(
                taskId.toString()) || 
                completedTaskIds.includes(taskId.toString()) || 
                prerequisitesCompleted === false
            ) { continue; }

            const userRepo = await UserRepo.findOne({ student: userId, group: quest.group });
            if (!userRepo) { continue; }

            const { repository_url: repoName, org } = userRepo;

            const responseIssue = await sendMessageToBot(
                'github/createIssue', 
                { org, repoName, title: taskTitle, body: task.desc }
            );

            const githubUrl = responseIssue.data.url;

            const newTaskProgress = new UserTaskProgress({
                user: userId,
                task: taskId,
                githubUrl,
                hintsUsed: [],
                status: "active",
                xp: 10,
            });
            await newTaskProgress.save();
        }

        const mockRes = {
            status: function (code) { this.statusCode = code; return this; },
            json: function (data) { this.data = data; return this; },
            statusCode: null,
            data: null,
        };

        await updateReadme(
            { body: { studentId: userId, groupId: quest.group } },
            mockRes
        );

        res.status(201).json({
            message: "Tasks processed successfully",
            notOpenedTaskIds: tasks.filter(
                task => !completedTaskIds.includes(task._id.toString()) 
                    && !activeTaskIds.includes(task._id.toString())
                ).map(task => task._id.toString()),
            activeTaskIds,
            completedTaskIds
        });
    } catch (error) {
        console.error("Error generating next task:", error);
        res.status(500).json({ message: "Internal server error.", error });
    }
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

    if (answerApproved === true) { taskCompletion(req, res); } 
    else { taskFailure(req, res); }
}

const taskCompletion = async(req, res) => {
    const { issueUrl, commentBody } = req.body;
    const parts = issueUrl.split('/');
    let org = parts[4];
    let repoName = parts[5];
    let issueNumber = parts[7]; 
    const answerCommentBody = "Congratulations. You are wrong!";

    const responseConclusionText = await sendMessageToBot(
        'github/commentIssue',
        { org,  repoName,  issueNumber, commentBody: answerCommentBody }
    );

    const responseClosedIssue = await sendMessageToBot(
        'github/closeIssue',
        { org, repoName, issueNumber }
    );

    const userTaskProgress = await UserTaskProgress.findOne({ githubUrl: issueUrl });
    const task = await Task.findById(userTaskProgress.task);

    userTaskProgress.status = "completed";
    await userTaskProgress.save();

    const mockRes = {
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; },
        statusCode: null,
        data: null,
    };

    const responseNextTask = await generateNextTask(
        { body: { userId: userTaskProgress.user, questId: task.quest } }, 
        mockRes
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
    try {
        const { studentId, groupId, questId } = req.body;
        
        if (!studentId || !groupId || !questId) {
            return res.status(400).json({ message: "Missing required fields: studentId, groupId, questId" });
        }
        
        console.log(`🎯 [QUEST-COMPLETION] Student ${studentId} completed quest ${questId} in group ${groupId}`);
        
        // Get the quest configuration for this group
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification');
        
        try {
            await client.connect();
            const db = client.db(process.env.OSS_DOORWAY_DB_NAME || 'test');
            const questConfigsCollection = db.collection('questconfigs');
            const userDataCollection = db.collection('user_data');
            
            // Find the quest configuration for this group
            const questConfig = await questConfigsCollection.findOne({
                $or: [
                    { configId: groupId },
                    { classId: groupId }
                ]
            });
            
            if (!questConfig || !questConfig.config) {
                console.log(`❌ [QUEST-COMPLETION] No quest configuration found for group ${groupId}`);
                return res.status(404).json({ message: "Quest configuration not found" });
            }
            
            // Get all quest IDs from the configuration
            const questIds = Object.keys(questConfig.config).filter(key => 
                key.startsWith('Q') && questConfig.config[key].metadata
            );
            
            // Sort quests by their number (Q1, Q2, Q3, etc.)
            questIds.sort((a, b) => {
                const aNum = parseInt(a.substring(1));
                const bNum = parseInt(b.substring(1));
                return aNum - bNum;
            });
            
            console.log(`📋 [QUEST-COMPLETION] Available quests: ${questIds.join(', ')}`);
            
            // Find the current quest index
            const currentQuestIndex = questIds.indexOf(questId);
            if (currentQuestIndex === -1) {
                console.log(`❌ [QUEST-COMPLETION] Quest ${questId} not found in configuration`);
                return res.status(404).json({ message: "Quest not found in configuration" });
            }
            
            // Check if there's a next quest
            if (currentQuestIndex < questIds.length - 1) {
                const nextQuestId = questIds[currentQuestIndex + 1];
                console.log(`🚀 [QUEST-COMPLETION] Next quest available: ${nextQuestId}`);
                
                // Get user's repository information
                const userData = await userDataCollection.findOne({ _id: studentId });
                if (!userData || !userData.user_data) {
                    console.log(`❌ [QUEST-COMPLETION] User data not found for ${studentId}`);
                    return res.status(404).json({ message: "User data not found" });
                }
                
                // Check if user has a repository
                const userRepo = userData.user_data.github?.repository_url;
                if (!userRepo) {
                    console.log(`❌ [QUEST-COMPLETION] No repository found for user ${studentId}`);
                    return res.status(404).json({ message: "User repository not found" });
                }
                
                // Extract org and repo name from repository URL
                const repoMatch = userRepo.match(/github\.com\/([^\/]+)\/([^\/]+)/);
                if (!repoMatch) {
                    console.log(`❌ [QUEST-COMPLETION] Invalid repository URL format: ${userRepo}`);
                    return res.status(400).json({ message: "Invalid repository URL format" });
                }
                
                const org = repoMatch[1];
                const repoName = repoMatch[2];
                
                console.log(`🔓 [QUEST-COMPLETION] Auto-unlocking ${nextQuestId} for ${org}/${repoName}`);
                
                // Auto-unlock the next quest by posting the accept command
                try {
                    const { getGithubAppInstallationAccessToken } = require('../utils/botMessage');
                    const accessToken = await getGithubAppInstallationAccessToken();
                    
                    // Find an issue to post the comment on
                    const axios = require('axios');
                    let issuesResponse = await axios.get(`https://api.github.com/repos/${org}/${repoName}/issues`, {
                        headers: {
                            'Authorization': `token ${accessToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'OSS-Management-Backend'
                        },
                        params: {
                            state: 'open',
                            sort: 'updated',
                            direction: 'desc'
                        }
                    });
                    
                    // If no open issues, try closed issues
                    if (!issuesResponse.data || issuesResponse.data.length === 0) {
                        issuesResponse = await axios.get(`https://api.github.com/repos/${org}/${repoName}/issues`, {
                            headers: {
                                'Authorization': `token ${accessToken}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'User-Agent': 'OSS-Management-Backend'
                            },
                            params: {
                                state: 'closed',
                                sort: 'updated',
                                direction: 'desc'
                            }
                        });
                    }
                    
                    if (issuesResponse.data && issuesResponse.data.length > 0) {
                        const latestIssue = issuesResponse.data[0];
                        
                        // Post the accept command
                        await axios.post(`https://api.github.com/repos/${org}/${repoName}/issues/${latestIssue.number}/comments`, {
                            body: `/accept ${nextQuestId}`
                        }, {
                            headers: {
                                'Authorization': `token ${accessToken}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'User-Agent': 'OSS-Management-Backend'
                            }
                        });
                        
                        console.log(`✅ [QUEST-COMPLETION] Successfully auto-unlocked ${nextQuestId} for ${org}/${repoName}`);
                        
                        return res.status(200).json({ 
                            message: `Quest ${questId} completed successfully. Next quest ${nextQuestId} has been auto-unlocked.`,
                            nextQuestId: nextQuestId,
                            autoUnlocked: true
                        });
                    } else {
                        console.log(`⚠️ [QUEST-COMPLETION] No issues found for auto-unlock in ${org}/${repoName}`);
                        return res.status(200).json({ 
                            message: `Quest ${questId} completed successfully. Next quest ${nextQuestId} is available but could not be auto-unlocked (no issues found).`,
                            nextQuestId: nextQuestId,
                            autoUnlocked: false
                        });
                    }
                    
                } catch (unlockError) {
                    console.error(`❌ [QUEST-COMPLETION] Error auto-unlocking ${nextQuestId}:`, unlockError.message);
                    return res.status(200).json({ 
                        message: `Quest ${questId} completed successfully. Next quest ${nextQuestId} is available but could not be auto-unlocked.`,
                        nextQuestId: nextQuestId,
                        autoUnlocked: false,
                        error: unlockError.message
                    });
                }
                
            } else {
                console.log(`🎉 [QUEST-COMPLETION] Quest ${questId} completed - this was the final quest!`);
                return res.status(200).json({ 
                    message: `Quest ${questId} completed successfully. This was the final quest in the sequence.`,
                    nextQuestId: null,
                    autoUnlocked: false
                });
            }
            
        } finally {
            await client.close();
        }
        
    } catch (error) {
        console.error(`❌ [QUEST-COMPLETION] Error:`, error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

const updateReadme = async(req, res) => {
    const { studentId, groupId } = req.body;
    const readme = await Readme.findOne({ group: groupId });
    const userRepo = await UserRepo.findOne({ student: studentId, group: groupId });
    
    let fileContent = readme.content
    
    // Generate quest progress section
    const availableQuestsDescription = await CurrentQuestDescription(studentId, groupId);
    const completedQuestsDescription = await CompletedQuestsDescription(studentId, groupId);
    
    const questProgressSection = `\n\n⚙️ Available Quests\n${availableQuestsDescription}\n✅ Completed Quests\n${completedQuestsDescription}`;
    
    fileContent = fileContent + questProgressSection;

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
    taskAnswer, taskCompletion, generateNextTask, taskNextHint, questCompletion, updateReadme
}

// Unlock a quest by posting an admin command to the student's active issue
// Expected body: { org, repoName, questId }
const unlockQuest = async (req, res) => {
    try {
        const { org, repoName, questId } = req.body;

        if (!org || !repoName || !questId) {
            return res.status(400).json({ message: "Missing required fields: org, repoName, questId" });
        }

        // For OSS-Doorway repos, we need to find an open issue in the repo to post the command
        // Use GitHub API to get open issues for this repository
        const { getGithubAppInstallationAccessToken } = require('../utils/botMessage');
        
        try {
            console.log(`🔑 [unlockQuest] Getting GitHub access token for ${org}/${repoName}...`);
            const accessToken = await getGithubAppInstallationAccessToken();
            console.log(`✅ [unlockQuest] GitHub access token obtained successfully`);
            
            // Get open issues from the repository
            const axios = require('axios');
            console.log(`📋 [unlockQuest] Fetching open issues from ${org}/${repoName}...`);
            let issuesResponse = await axios.get(`https://api.github.com/repos/${org}/${repoName}/issues`, {
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'OSS-Management-Backend'
                },
                params: {
                    state: 'open',
                    sort: 'updated',
                    direction: 'desc'
                }
            });
            console.log(`✅ [unlockQuest] Found ${issuesResponse.data.length} open issues`);

            // If no open issues, try closed issues
            if (!issuesResponse.data || issuesResponse.data.length === 0) {
                console.log(`📋 [unlockQuest] No open issues found, trying closed issues...`);
                issuesResponse = await axios.get(`https://api.github.com/repos/${org}/${repoName}/issues`, {
                    headers: {
                        'Authorization': `token ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OSS-Management-Backend'
                    },
                    params: {
                        state: 'closed',
                        sort: 'updated',
                        direction: 'desc'
                    }
                });
                console.log(`✅ [unlockQuest] Found ${issuesResponse.data.length} closed issues`);
            }

            if (!issuesResponse.data || issuesResponse.data.length === 0) {
                return res.status(404).json({ message: "No issues found in repository. Student may not have started any quests yet." });
            }

            // Use the most recently updated issue
            const latestIssue = issuesResponse.data[0];
            const issueState = latestIssue.state;
            console.log(`📝 Found ${issueState} issue #${latestIssue.number}: ${latestIssue.title}`);

            // Post the admin command comment directly via GitHub API
            console.log(`💬 [unlockQuest] Posting comment '/accept ${questId}' to issue #${latestIssue.number}...`);
            
            const commentResponse = await axios.post(`https://api.github.com/repos/${org}/${repoName}/issues/${latestIssue.number}/comments`, {
                body: `/accept ${questId}`
            }, {
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'OSS-Management-Backend'
                }
            });
            
            console.log(`✅ [unlockQuest] Comment posted successfully via GitHub API`);

            return res.status(200).json({ 
                message: `Unlock command sent for ${questId} on ${org}/${repoName}#${latestIssue.number}`,
                issueTitle: latestIssue.title,
                issueNumber: latestIssue.number
            });
        } catch (githubError) {
            console.error("❌ [unlockQuest] GitHub API error:", githubError.message);
            console.error("❌ [unlockQuest] Full error:", githubError);
            if (githubError.response) {
                console.error("❌ [unlockQuest] Response status:", githubError.response.status);
                console.error("❌ [unlockQuest] Response data:", githubError.response.data);
            }
            return res.status(500).json({ 
                message: "Failed to access repository or post comment", 
                error: githubError.message,
                details: githubError.response?.data || 'No additional details'
            });
        }
    } catch (error) {
        console.error("Error unlocking quest:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

module.exports.unlockQuest = unlockQuest;

// Trigger cache operations on the OSS-Doorway bot by posting a /cache command
// Expected body: { org, repoName, command } where command is one of:
//   "clear-all" | "delete <groupId>" | "reload <groupId>"
const triggerCacheCommand = async (req, res) => {
    try {
        const { org, repoName, command } = req.body;
        if (!org || !repoName || !command) {
            return res.status(400).json({ message: "Missing required fields: org, repoName, command" });
        }

        const { getGithubAppInstallationAccessToken } = require('../utils/botMessage');
        const axios = require('axios');

        const accessToken = await getGithubAppInstallationAccessToken();

        // Find latest open issue to comment on
        const issuesResponse = await axios.get(`https://api.github.com/repos/${org}/${repoName}/issues`, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'OSS-Management-Backend'
            },
            params: { state: 'open', sort: 'updated', direction: 'desc' }
        });

        if (!issuesResponse.data || issuesResponse.data.length === 0) {
            return res.status(404).json({ message: "No open issues found to post admin command." });
        }

        const issue = issuesResponse.data[0];
        const body = `/cache ${command}`;

        await axios.post(`https://api.github.com/repos/${org}/${repoName}/issues/${issue.number}/comments`, {
            body
        }, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'OSS-Management-Backend'
            }
        });

        return res.status(200).json({ message: `Sent '${body}' to ${org}/${repoName}#${issue.number}` });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to trigger cache command', error: error.message, details: error.response?.data });
    }
};

module.exports.triggerCacheCommand = triggerCacheCommand;

// Deploy a quest from draft to main config and update all class users
// Expected body: { classId, draftQuestData }
const deployQuestToClass = async (req, res) => {
    try {
        const { classId, draftQuestData } = req.body;
        
        console.log(`🚀 [QUEST-DEPLOYMENT] Starting quest deployment for class: ${classId}`);
        console.log(`📋 [QUEST-DEPLOYMENT] Draft quest data:`, {
            title: draftQuestData?.title,
            draftIndex: draftQuestData?.draftIndex,
            nextQuestId: draftQuestData?.nextQuestId,
            taskCount: Object.keys(draftQuestData?.tasks || {}).length
        });
        
        if (!classId || !draftQuestData) {
            console.log(`❌ [QUEST-DEPLOYMENT] Missing required fields:`, { classId: !!classId, draftQuestData: !!draftQuestData });
            return res.status(400).json({ message: "Missing required fields: classId, draftQuestData" });
        }

        // Import required modules
        const Group = require('../models/GroupModel');
        const { MongoClient } = require('mongodb');
        const mongoose = require('mongoose');
        
        // Connect to OSS-Doorway database for quest configs
        const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
        const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';
        
        console.log(`🔗 [QUEST-DEPLOYMENT] Connecting to OSS-Doorway database: ${ossDoorwayDbName}`);
        
        // Declare variables outside all try blocks so they're accessible throughout
        let ossDoorwayClient = null;
        let classInfo = null;
        let newConfigId = null;
        let newQuestId = null;
        let nextQuestNumber = null;
        let existingConfig = null;
        
        try {
            ossDoorwayClient = new MongoClient(ossDoorwayUri);
            await ossDoorwayClient.connect();
            const ossDoorwayDb = ossDoorwayClient.db(ossDoorwayDbName);
            
            console.log(`🔍 [QUEST-DEPLOYMENT] Step 1: Fetching class information...`);
            // 1. Get class information
            classInfo = await Group.findById(classId);
            if (!classInfo) {
                console.log(`❌ [QUEST-DEPLOYMENT] Class not found: ${classId}`);
                return res.status(404).json({ message: "Class not found" });
            }
            console.log(`✅ [QUEST-DEPLOYMENT] Class found: "${classInfo.groupName}" (ID: ${classId})`);

            console.log(`🔍 [QUEST-DEPLOYMENT] Step 2: Loading existing quest configuration...`);
            // 2. Load existing quest config for this class from OSS-Doorway DB
            existingConfig = await ossDoorwayDb.collection('questconfigs').findOne({ groupId: classId });
            
            // If not found in database, try to load from local generated files as fallback
            if (!existingConfig) {
                console.log(`⚠️ [QUEST-DEPLOYMENT] No quest config found in database for class: ${classId}`);
                console.log(`🔍 [QUEST-DEPLOYMENT] Trying local generated files as fallback...`);
                
                try {
                    const fs = require('fs');
                    const path = require('path');
                    
                    // Path to oss-doorway generated configs
                    const generatedConfigPath = path.join(__dirname, '../../../OSS-Doorway/src/config/generated');
                    const configFileName = `quest_config_${classId}.json`;
                    const configFilePath = path.join(generatedConfigPath, configFileName);
                    
                    if (fs.existsSync(configFilePath)) {
                        console.log(`📁 [QUEST-DEPLOYMENT] Found config in local file: ${configFileName}`);
                        const fileContent = fs.readFileSync(configFilePath, 'utf8');
                        const configData = JSON.parse(fileContent);
                        
                        // Create a mock existingConfig object from the file
                        existingConfig = {
                            groupId: classId,
                            configId: classId,
                            configData: JSON.stringify(configData)
                        };
                        console.log(`✅ [QUEST-DEPLOYMENT] Loaded config from local file with ${Object.keys(configData).length} quests`);
                    } else {
                        console.log(`❌ [QUEST-DEPLOYMENT] No quest config found in database OR local files for class: ${classId}`);
                        return res.status(404).json({ message: "No quest config found for this class in database or local files" });
                    }
                } catch (fileError) {
                    console.log(`❌ [QUEST-DEPLOYMENT] Error reading local config file:`, fileError.message);
                    return res.status(404).json({ message: "No quest config found for this class in database or local files" });
                }
            } else {
                console.log(`✅ [QUEST-DEPLOYMENT] Existing config found in database with ID: ${existingConfig.groupId}`);
            }

        console.log(`🔍 [QUEST-DEPLOYMENT] Step 3: Analyzing existing quest sequence...`);
        // 3. Parse the existing config and append the new quest
        let configData = existingConfig.configData;
        if (typeof configData === 'string') {
            configData = JSON.parse(configData);
        }

        // Find the next quest number
        const existingQuests = configData.questSequence || [];
        const questNumbers = existingQuests.map(q => {
            const match = (q.questId || q.id || '').match(/Q(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }).filter(n => n > 0);
        
        nextQuestNumber = questNumbers.length > 0 ? Math.max(...questNumbers) + 1 : 2;
        newQuestId = `Q${nextQuestNumber}`;
        
        console.log(`📊 [QUEST-DEPLOYMENT] Quest analysis:`, {
            existingQuests: existingQuests.length,
            questNumbers: questNumbers,
            nextQuestNumber,
            newQuestId
        });

        console.log(`🔍 [QUEST-DEPLOYMENT] Step 4: Creating new quest configuration...`);
        // 4. Create the new quest with the next quest ID
        const newQuest = {
            ...draftQuestData,
            questId: newQuestId,
            id: newQuestId,
            metadata: {
                ...draftQuestData.metadata,
                prerequisite: nextQuestNumber > 1 ? `Q${nextQuestNumber - 1}` : null
            }
        };

        console.log(`✅ [QUEST-DEPLOYMENT] New quest created:`, {
            questId: newQuest.questId,
            title: newQuest.title,
            prerequisite: newQuest.metadata.prerequisite,
            taskCount: Object.keys(newQuest.tasks || {}).length
        });

        // 5. Append to quest sequence
        configData.questSequence = [...existingQuests, newQuest];
        console.log(`📝 [QUEST-DEPLOYMENT] Quest sequence updated: ${existingQuests.length} → ${configData.questSequence.length} quests`);

        console.log(`🔍 [QUEST-DEPLOYMENT] Step 5: Saving new quest configuration to OSS-Doorway database...`);
        // 6. Save the updated config to OSS-Doorway database
        newConfigId = `${classId}_v${Date.now()}`;
        const newQuestConfig = {
            groupId: newConfigId,
            configId: newConfigId, // Ensure configId is set to prevent duplicate key errors
            configData: JSON.stringify(configData, null, 2),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await ossDoorwayDb.collection('questconfigs').insertOne(newQuestConfig);
        console.log(`✅ [QUEST-DEPLOYMENT] New config saved to database with ID: ${newConfigId}`);
        
        // Also save as JSON file in oss-doorway/src/config/generated for fallback
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Path to oss-doorway generated configs
            const generatedConfigPath = path.join(__dirname, '../../../OSS-Doorway/src/config/generated');
            
            // Ensure directory exists
            if (!fs.existsSync(generatedConfigPath)) {
                fs.mkdirSync(generatedConfigPath, { recursive: true });
            }
            
            // Save config as JSON file
            const configFileName = `quest_config_${newConfigId}.json`;
            const configFilePath = path.join(generatedConfigPath, configFileName);
            
            fs.writeFileSync(configFilePath, JSON.stringify(configData, null, 2));
            console.log(`📁 [QUEST-DEPLOYMENT] Config also saved as JSON file: ${configFileName}`);
            
            // Note: OSS-Doorway bot will now find this config in:
            // 1. Database (primary) - oss-doorway DB questconfigs collection
            // 2. Generated files (fallback) - oss-doorway/src/config/generated/
            // 3. Default configs (last resort) - if nothing else exists
        } catch (fileError) {
            console.warn(`⚠️ [QUEST-DEPLOYMENT] Could not save JSON file (non-critical):`, fileError.message);
        }

        } catch (dbError) {
            console.error(`❌ [QUEST-DEPLOYMENT] Database connection failed:`, dbError.message);
            return res.status(500).json({ message: 'Failed to connect to database', error: dbError.message });
        }

        console.log(`🔍 [QUEST-DEPLOYMENT] Step 6: Connecting to OSS-Doorway database...`);
        // 7. Connect to OSS-Doorway database to update user customGroupId
        const URI = process.env.URI || process.env.OSS_DOORWAY_DB_URI;
        const DB_NAME = process.env.DB_NAME || process.env.OSS_DOORWAY_DB_NAME;
        
        console.log(`🔗 [QUEST-DEPLOYMENT] Database connection: ${DB_NAME} on ${URI ? 'configured URI' : 'OSS_DOORWAY_DB_URI'}`);
        const ossDoorwayConnection = mongoose.createConnection(`${URI}/${DB_NAME}`);
        
        const userSchema = new mongoose.Schema({
            _id: String,
            user_data: {
                github: String,
                username: String,
                customGroupId: String,
                accepted: [String],
                completed: [String],
                current: {
                    quest: String,
                    task: String
                }
            }
        }, { collection: 'user_data', strict: false });

        const User = ossDoorwayConnection.model('User', userSchema);

        console.log(`🔍 [QUEST-DEPLOYMENT] Step 7: Finding students in class...`);
        // 8. Get formatted class name
        const formattedClassName = classInfo.groupName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const searchSuffix = `-${formattedClassName}`;
        console.log(`🔍 [QUEST-DEPLOYMENT] Class name formatting: "${classInfo.groupName}" → "${formattedClassName}" → suffix: "${searchSuffix}"`);
        
        // 9. Find and update all students in this class
        const studentsToUpdate = await User.find({
            _id: { $regex: new RegExp(`${searchSuffix}$`, 'i') }
        });
        console.log(`✅ [QUEST-DEPLOYMENT] Found ${studentsToUpdate.length} students to update`);

        console.log(`🔍 [QUEST-DEPLOYMENT] Step 8: Updating student configurations...`);
        let updatedStudents = 0;
        let studentsReadyForNewQuest = [];

        for (const student of studentsToUpdate) {
            const oldGroupId = student.user_data?.customGroupId;
            student.user_data = student.user_data || {};
            student.user_data.customGroupId = newConfigId;
            await student.save();
            updatedStudents++;

            // Check if student has completed all previous quests
            // Note: completed is an OBJECT, not an array, like { Q1: { title, points, xp }, Q2: { ... } }
            const completed = student.user_data.completed || {};
            const completedQuestIds = Object.keys(completed);
            const previousQuestId = `Q${nextQuestNumber - 1}`;
            const hasCompletedPrevious = nextQuestNumber === 1 || completedQuestIds.includes(previousQuestId);
            
            if (hasCompletedPrevious) {
                studentsReadyForNewQuest.push({
                    username: student._id,
                    repo: student._id.replace(`-${formattedClassName}`, '')
                });
                console.log(`🎯 [QUEST-DEPLOYMENT] Student ready for ${newQuestId}: ${student._id} (completed: ${completedQuestIds.join(', ')})`);
            } else {
                console.log(`⏳ [QUEST-DEPLOYMENT] Student not ready for ${newQuestId}: ${student._id} (completed: ${completedQuestIds.join(', ')}, needs: ${previousQuestId})`);
            }
        }
        
        console.log(`📊 [QUEST-DEPLOYMENT] Student update summary:`, {
            totalStudents: studentsToUpdate.length,
            updatedStudents,
            readyForNewQuest: studentsReadyForNewQuest.length,
            notReady: studentsToUpdate.length - studentsReadyForNewQuest.length
        });

        await ossDoorwayConnection.close();
        console.log(`🔌 [QUEST-DEPLOYMENT] Disconnected from OSS-Doorway database`);

        // 10. Clear cache for old config to force reload
        if (existingConfig.groupId !== newConfigId) {
                    console.log(`🔍 [QUEST-DEPLOYMENT] Step 9: Clearing old configuration cache...`);
        try {
            const { getGithubAppInstallationAccessToken } = require('../utils/botMessage');
            const axios = require('axios');
            
            console.log(`🔑 [QUEST-DEPLOYMENT] Getting GitHub App access token for cache clearing...`);
            const accessToken = await getGithubAppInstallationAccessToken();
            console.log(`✅ [QUEST-DEPLOYMENT] GitHub access token obtained for cache clearing`);
            
            // Find any student repo to post cache command
            if (studentsToUpdate.length > 0) {
                const sampleStudent = studentsToUpdate[0];
                const sampleRepo = sampleStudent._id;
                console.log(`📋 [QUEST-DEPLOYMENT] Using sample repo for cache command: ${sampleRepo}`);
                
                const issuesResponse = await axios.get(`https://api.github.com/repos/OSS-Doorway-Dev/${sampleRepo}/issues`, {
                    headers: {
                        'Authorization': `token ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OSS-Management-Backend'
                    },
                    params: { state: 'open', sort: 'updated', direction: 'desc' }
                });

                if (issuesResponse.data && issuesResponse.data.length > 0) {
                    const issue = issuesResponse.data[0];
                    console.log(`💬 [QUEST-DEPLOYMENT] Posting cache reload command to issue #${issue.number}: /cache reload ${existingConfig.groupId}`);
                    
                    await axios.post(`https://api.github.com/repos/OSS-Doorway-Dev/${sampleRepo}/issues/${issue.number}/comments`, {
                        body: `/cache reload ${existingConfig.groupId}`
                    }, {
                        headers: {
                            'Authorization': `token ${accessToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'OSS-Management-Backend'
                        }
                    });
                    
                    console.log(`✅ [QUEST-DEPLOYMENT] Cache reload command posted successfully`);
                } else {
                    console.log(`⚠️ [QUEST-DEPLOYMENT] No open issues found in ${sampleRepo} for cache command`);
                }
            }
            
            // AUTO-UNLOCK: Now unlock the new quest for students who are ready
            if (studentsReadyForNewQuest.length > 0) {
                console.log(`🚀 [QUEST-DEPLOYMENT] Step 10: Auto-unlocking ${newQuestId} for ${studentsReadyForNewQuest.length} ready students...`);
                
                let successCount = 0;
                let unlockErrors = [];
                
                for (const student of studentsReadyForNewQuest) {
                    try {
                        const studentRepo = student.username; // Full repo name like "username-classname"
                        console.log(`🔓 [QUEST-DEPLOYMENT] Auto-unlocking ${newQuestId} for ${studentRepo}...`);
                        
                        // Get open issues for this student's repo
                        const studentIssuesResponse = await axios.get(`https://api.github.com/repos/OSS-Doorway-Dev/${studentRepo}/issues`, {
                            headers: {
                                'Authorization': `token ${accessToken}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'User-Agent': 'OSS-Management-Backend'
                            },
                            params: { state: 'open', sort: 'updated', direction: 'desc' }
                        });

                        if (studentIssuesResponse.data && studentIssuesResponse.data.length > 0) {
                            const studentIssue = studentIssuesResponse.data[0];
                            console.log(`📝 [QUEST-DEPLOYMENT] Found issue #${studentIssue.number} for ${studentRepo}: "${studentIssue.title}"`);
                            
                            // Post unlock command
                            await axios.post(`https://api.github.com/repos/OSS-Doorway-Dev/${studentRepo}/issues/${studentIssue.number}/comments`, {
                                body: `/accept ${newQuestId}`
                            }, {
                                headers: {
                                    'Authorization': `token ${accessToken}`,
                                    'Accept': 'application/vnd.github.v3+json',
                                    'User-Agent': 'OSS-Management-Backend'
                                }
                            });
                            
                            successCount++;
                            console.log(`✅ [QUEST-DEPLOYMENT] Successfully auto-unlocked ${newQuestId} for ${studentRepo}`);
                        } else {
                            const errorMsg = `${studentRepo}: No open issues found for auto-unlock`;
                            console.log(`⚠️ [QUEST-DEPLOYMENT] ${errorMsg}`);
                            unlockErrors.push(errorMsg);
                        }
                    } catch (studentError) {
                        const errorMsg = `${student.username}: ${studentError.message}`;
                        console.error(`❌ [QUEST-DEPLOYMENT] Error auto-unlocking for ${student.username}:`, studentError.message);
                        unlockErrors.push(errorMsg);
                    }
                }
                
                console.log(`🎯 [QUEST-DEPLOYMENT] Auto-unlock summary:`, {
                    targetStudents: studentsReadyForNewQuest.length,
                    successCount,
                    errorCount: unlockErrors.length,
                    successRate: `${Math.round((successCount / studentsReadyForNewQuest.length) * 100)}%`
                });
                
                if (unlockErrors.length > 0) {
                    console.log(`⚠️ [QUEST-DEPLOYMENT] Auto-unlock errors:`, unlockErrors);
                }
            } else {
                console.log(`ℹ️ [QUEST-DEPLOYMENT] No students ready for auto-unlock of ${newQuestId}`);
            }
            
        } catch (cacheError) {
            console.error(`❌ [QUEST-DEPLOYMENT] Failed to clear cache, but deployment succeeded:`, cacheError.message);
        }
        } else {
            console.log(`ℹ️ [QUEST-DEPLOYMENT] No cache clearing needed (same config ID)`);
        }

        console.log(`🎉 [QUEST-DEPLOYMENT] Deployment completed successfully!`);
        console.log(`📊 [QUEST-DEPLOYMENT] Final summary:`, {
            newQuestId,
            newConfigId,
            updatedStudents,
            studentsReadyForNewQuest: studentsReadyForNewQuest.length,
            totalStudents: studentsToUpdate.length,
            class: classInfo.groupName
        });
        
        // Close OSS-Doorway database connection
        await ossDoorwayClient.close();
        console.log(`🔗 [QUEST-DEPLOYMENT] Database connection closed`);
        
        return res.status(200).json({
            message: `Successfully deployed ${newQuestId} to class ${classInfo.groupName}`,
            newQuestId,
            newConfigId,
            updatedStudents,
            studentsReadyForNewQuest,
            totalStudents: studentsToUpdate.length
        });

    } catch (error) {
        console.error(`❌ [QUEST-DEPLOYMENT] Deployment failed:`, error);
        console.error(`❌ [QUEST-DEPLOYMENT] Error details:`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Close OSS-Doorway database connection on error
        if (ossDoorwayClient) {
            try {
                await ossDoorwayClient.close();
                console.log(`🔗 [QUEST-DEPLOYMENT] Database connection closed on error`);
            } catch (closeError) {
                console.error(`❌ [QUEST-DEPLOYMENT] Error closing database connection:`, closeError);
            }
        }
        
        return res.status(500).json({ 
            message: 'Failed to deploy quest', 
            error: error.message 
        });
    }
};

// Unlock a specific quest for students who are ready
// Expected body: { org, students, questId } where students is array of { username, repo }
const unlockQuestForStudents = async (req, res) => {
    console.log(`🔓 [QUEST-UNLOCK] Starting quest unlock for ${students.length} students`);
    console.log(`📋 [QUEST-UNLOCK] Details:`, { org, questId, studentCount: students.length });
    
    try {
        const { org, students, questId } = req.body;
        
        if (!org || !students || !questId || !Array.isArray(students)) {
            console.log(`❌ [QUEST-UNLOCK] Missing required fields:`, { org: !!org, students: !!students, questId: !!questId, isArray: Array.isArray(students) });
            return res.status(400).json({ message: "Missing required fields: org, students (array), questId" });
        }

        console.log(`🔑 [QUEST-UNLOCK] Getting GitHub App access token...`);
        const { getGithubAppInstallationAccessToken } = require('../utils/botMessage');
        const axios = require('axios');
        
        const accessToken = await getGithubAppInstallationAccessToken();
        console.log(`✅ [QUEST-UNLOCK] GitHub access token obtained`);
        
        let successCount = 0;
        let errors = [];
        console.log(`🔄 [QUEST-UNLOCK] Processing ${students.length} students...`);

        for (const student of students) {
            try {
                const { username, repo } = student;
                console.log(`🔍 [QUEST-UNLOCK] Processing student: ${username} (repo: ${repo})`);
                
                // Get open issues for this student's repo
                const issuesResponse = await axios.get(`https://api.github.com/repos/${org}/${repo}/issues`, {
                    headers: {
                        'Authorization': `token ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'OSS-Management-Backend'
                    },
                    params: { state: 'open', sort: 'updated', direction: 'desc' }
                });

                if (issuesResponse.data && issuesResponse.data.length > 0) {
                    const issue = issuesResponse.data[0];
                    console.log(`📝 [QUEST-UNLOCK] Found issue #${issue.number} for ${username}: "${issue.title}"`);
                    
                    // Post unlock command
                    console.log(`💬 [QUEST-UNLOCK] Posting unlock command to ${username}: /accept ${questId}`);
                    await axios.post(`https://api.github.com/repos/${org}/${repo}/issues/${issue.number}/comments`, {
                        body: `/accept ${questId}`
                    }, {
                        headers: {
                            'Authorization': `token ${accessToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'OSS-Management-Backend'
                        }
                    });
                    
                    successCount++;
                    console.log(`✅ [QUEST-UNLOCK] Successfully unlocked ${questId} for ${username}`);
                } else {
                    const errorMsg = `${username}: No open issues found`;
                    console.log(`⚠️ [QUEST-UNLOCK] ${errorMsg}`);
                    errors.push(errorMsg);
                }
            } catch (studentError) {
                const errorMsg = `${student.username}: ${studentError.message}`;
                console.error(`❌ [QUEST-UNLOCK] Error processing ${student.username}:`, studentError.message);
                errors.push(errorMsg);
            }
        }

        console.log(`🎉 [QUEST-UNLOCK] Quest unlock completed!`);
        console.log(`📊 [QUEST-UNLOCK] Final summary:`, {
            questId,
            successCount,
            totalStudents: students.length,
            errorCount: errors.length,
            successRate: `${Math.round((successCount / students.length) * 100)}%`
        });
        
        if (errors.length > 0) {
            console.log(`⚠️ [QUEST-UNLOCK] Errors encountered:`, errors);
        }
        
        return res.status(200).json({
            message: `Unlocked ${questId} for ${successCount}/${students.length} students`,
            successCount,
            totalStudents: students.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error(`❌ [QUEST-UNLOCK] Quest unlock failed:`, error);
        console.error(`❌ [QUEST-UNLOCK] Error details:`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return res.status(500).json({ 
            message: 'Failed to unlock quest for students', 
            error: error.message 
        });
    }
};

// Purple Deploy Quest - Creates new config with appended quest while keeping original
// Expected body: { classId, draftQuestData }
const purpleDeployQuest = async (req, res) => {
    try {
        const { classId, draftQuestData } = req.body;
        
        console.log(`🟣 [PURPLE-DEPLOYMENT] Starting purple quest deployment for class: ${classId}`);
        console.log(`📋 [PURPLE-DEPLOYMENT] Draft quest data:`, {
            title: draftQuestData?.title,
            draftIndex: draftQuestData?.draftIndex,
            nextQuestId: draftQuestData?.nextQuestId,
            taskCount: Object.keys(draftQuestData?.tasks || {}).length
        });
        
        if (!classId || !draftQuestData) {
            console.log(`❌ [PURPLE-DEPLOYMENT] Missing required fields:`, { classId: !!classId, draftQuestData: !!draftQuestData });
            return res.status(400).json({ message: "Missing required fields: classId, draftQuestData" });
        }

        // Import required modules
        const Group = require('../models/GroupModel');
        const { MongoClient } = require('mongodb');
        const mongoose = require('mongoose');
        
        // Connect to OSS-Doorway database for quest configs
        const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
        const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';
        
        console.log(`🔗 [PURPLE-DEPLOYMENT] Connecting to OSS-Doorway database: ${ossDoorwayDbName}`);
        
        // Declare variables outside all try blocks so they're accessible throughout
        let migratedUsers = 0;
        let usersWithNewQuestAccess = [];
        let ossDoorwayClient = null;
        let classInfo = null;
        let newConfigId = null;
        let newQuestId = null;
        let nextQuestNumber = null;
        let existingConfig = null;
        let originalConfigId = null;
        let studentsReadyForNewQuest = [];
        
        try {
            // Connect to OSS-Doorway database
            ossDoorwayClient = new MongoClient(ossDoorwayUri);
            await ossDoorwayClient.connect();
            console.log(`✅ [PURPLE-DEPLOYMENT] Connected to OSS-Doorway database`);
            
            const ossDoorwayDb = ossDoorwayClient.db(ossDoorwayDbName);
            const questConfigsCollection = ossDoorwayDb.collection('questconfigs');
            const userDataCollection = ossDoorwayDb.collection('user_data');
            
            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 1: Getting class information...`);
            // 1. Get class information
            classInfo = await Group.findById(classId);
            if (!classInfo) {
                throw new Error(`Class with ID ${classId} not found`);
            }
            console.log(`✅ [PURPLE-DEPLOYMENT] Found class: ${classInfo.groupName}`);
            
            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 2: Finding existing quest configuration...`);
            // 2. Find existing quest configuration for this class
            existingConfig = await questConfigsCollection.findOne({
                $or: [
                    { classId: classId },
                    { groupId: classId },
                    { configId: classId }
                ]
            });
            
            if (!existingConfig) {
                throw new Error(`No quest configuration found for class ${classId}`);
            }
            
            originalConfigId = existingConfig._id.toString();
            console.log(`✅ [PURPLE-DEPLOYMENT] Found existing config: ${originalConfigId}`);
            
            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 3: Analyzing existing quests...`);
            // 3. Analyze existing quests to determine the next quest number
            let existingQuests = [];
            let configData = null;
            
            // First, check if there's a more recent purple config that might have more quests
            const latestPurpleConfig = await questConfigsCollection.findOne(
                { classId: { $regex: new RegExp(`^${classId}_purple_`) } },
                { sort: { createdAt: -1 } }
            );
            
            // Use the latest purple config if it exists, otherwise use the original config
            const configToAnalyze = latestPurpleConfig || existingConfig;
            console.log(`🔍 [PURPLE-DEPLOYMENT] Analyzing config: ${configToAnalyze.classId} (${latestPurpleConfig ? 'latest purple' : 'original'})`);
            
            if (configToAnalyze.questSequence && Array.isArray(configToAnalyze.questSequence)) {
                // New format: questSequence array
                existingQuests = configToAnalyze.questSequence;
                configData = configToAnalyze;
                console.log(`📋 [PURPLE-DEPLOYMENT] Using questSequence format with ${existingQuests.length} quests`);
            } else {
                // Old format: individual quest objects
                // Check if quests are in config.config (legacy format) or directly in config
                const configToSearch = configToAnalyze.config || configToAnalyze;
                const questKeys = Object.keys(configToSearch).filter(key => key.startsWith('Q') && key !== 'map_repo_link');
                existingQuests = questKeys.map(key => ({
                            questId: key,
                    title: configToSearch[key].metadata?.title || key,
                    sequenceNumber: parseInt(key.slice(1)) - 1
                })).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
                console.log(`📋 [PURPLE-DEPLOYMENT] Using legacy format with ${existingQuests.length} quests`);
            }

            // Calculate the next quest number
            nextQuestNumber = existingQuests.length + 1;
            newQuestId = `Q${nextQuestNumber}`;

            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 4: Creating new quest configuration with appended quest...`);
            // 4. Create new quest with proper metadata
            const newQuest = {
                ...draftQuestData,
                questId: newQuestId,
                sequenceNumber: nextQuestNumber - 1,
                metadata: {
                    title: `${newQuestId}: ${draftQuestData.title}`,
                    description: draftQuestData.metadata?.description || draftQuestData.title,
                    prerequisite: existingQuests.length > 0 ? existingQuests[existingQuests.length - 1].questId : null,
                    type: draftQuestData.metadata?.type || 'general'
                }
            };

            console.log(`✅ [PURPLE-DEPLOYMENT] New quest created:`, {
                questId: newQuest.questId,
                title: newQuest.title,
                sequenceNumber: newQuest.sequenceNumber,
                prerequisite: newQuest.metadata.prerequisite
            });

            // Create the updated config with the new quest appended
            let updatedConfig;
            if (configData) {
                // New format: append to questSequence
                updatedConfig = {
                    ...configData,
                    questSequence: [...existingQuests, newQuest]
                };
            } else {
                // Old format: append as new quest object
                const newQuestData = {
                        metadata: newQuest.metadata,
                        ...draftQuestData.tasks
                };
                
                // For legacy format, we need to merge into the actual config data, not the document wrapper
                const configToUpdate = configToAnalyze.config || configToAnalyze;
                const updatedConfigData = {
                    ...configToUpdate,
                    [newQuestId]: newQuestData
                };
                
                updatedConfig = {
                    ...configToAnalyze,
                    config: updatedConfigData
                };
                
                // Debug: Log what we're actually adding
                console.log(`🔍 [PURPLE-DEPLOYMENT] Debug - draftQuestData.tasks:`, Object.keys(draftQuestData.tasks || {}));
                console.log(`🔍 [PURPLE-DEPLOYMENT] Debug - newQuestId: ${newQuestId}`);
                console.log(`🔍 [PURPLE-DEPLOYMENT] Debug - newQuestData keys:`, Object.keys(newQuestData));
                console.log(`🔍 [PURPLE-DEPLOYMENT] Debug - updatedConfig keys:`, Object.keys(updatedConfig));
            }

            console.log(`📝 [PURPLE-DEPLOYMENT] Quest sequence updated: ${existingQuests.length} → ${existingQuests.length + 1} quests`);

            // Verify the quest was actually added
            let finalQuestKeys;
            if (configData) {
                // New format: check questSequence
                finalQuestKeys = updatedConfig.questSequence?.map(q => q.questId || q.id) || [];
            } else {
                // Legacy format: check config object
                const configToCheck = updatedConfig.config || updatedConfig;
                finalQuestKeys = Object.keys(configToCheck).filter(key => key.startsWith('Q'));
            }
            console.log(`🔍 [PURPLE-DEPLOYMENT] Final quest keys in updatedConfig: [${finalQuestKeys.join(', ')}]`);
            
            if (!finalQuestKeys.includes(newQuestId)) {
                console.error(`❌ [PURPLE-DEPLOYMENT] CRITICAL ERROR: ${newQuestId} was not added to the config!`);
                throw new Error(`Failed to add ${newQuestId} to quest configuration`);
            }

            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 5: Creating new quest configuration (keeping original intact)...`);
            // 5. Create new quest configuration (keeping original intact)
            const newConfig = {
                ...updatedConfig,
                _id: new mongoose.Types.ObjectId(),
                classId: `${classId}_purple_${Date.now()}`,
                groupId: `${classId}_purple_${Date.now()}`,
                configId: `${classId}_purple_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                isPurpleDeployment: true,
                baseConfigId: originalConfigId,
                deployedQuestId: newQuestId,
                deployedAt: new Date()
            };
            
            newConfigId = newConfig._id.toString();
            const newTotalQuests = existingQuests.length + 1;
            
            console.log(`✅ [PURPLE-DEPLOYMENT] New config created: ${newConfigId}`);
            console.log(`📊 [PURPLE-DEPLOYMENT] Quest count: ${existingQuests.length} → ${newTotalQuests}`);

            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 6: Saving new quest configuration...`);
            // 6. Save the new quest configuration
            console.log(`🔍 [PURPLE-DEPLOYMENT] Debug - newConfig structure before save:`);
            console.log(`   - _id: ${newConfig._id}`);
            console.log(`   - classId: ${newConfig.classId}`);
            console.log(`   - has config field: ${!!newConfig.config}`);
            if (newConfig.config) {
                console.log(`   - config keys: [${Object.keys(newConfig.config).join(', ')}]`);
                const questKeys = Object.keys(newConfig.config).filter(key => key.startsWith('Q'));
                console.log(`   - quest keys in config: [${questKeys.join(', ')}]`);
            }
            
            await questConfigsCollection.insertOne(newConfig);
            console.log(`✅ [PURPLE-DEPLOYMENT] New quest configuration saved`);

            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 7: Finding users who completed the prerequisite quest...`);
            // 7. Find users who completed the prerequisite quest
            // First, find what quests students have actually completed to determine the correct prerequisite
            const allUsers = await userDataCollection.find({
                $or: [
                    { 'user_data.customGroupId': classId },
                    { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}_purple_`) } }
                ]
            }).toArray();
            
            // Find the highest quest number that any student has completed
            let highestCompletedQuest = null;
            allUsers.forEach(user => {
                const userData = user.user_data || {};
                const completedQuests = Object.keys(userData.completed || {});
                completedQuests.forEach(questId => {
                    if (questId.startsWith('Q')) {
                        const questNumber = parseInt(questId.slice(1));
                        if (!highestCompletedQuest || questNumber > highestCompletedQuest) {
                            highestCompletedQuest = questNumber;
                        }
                    }
                });
            });
            
            // Use the highest completed quest as prerequisite, or fall back to the one from config
            const actualPrerequisiteQuestId = highestCompletedQuest ? `Q${highestCompletedQuest}` : newQuest.metadata.prerequisite;
            console.log(`🎯 [PURPLE-DEPLOYMENT] Actual prerequisite based on student progress: ${actualPrerequisiteQuestId}`);
            
            // Special case: If this is the first quest (Q1), look for users with no completed quests
            if (newQuestId === 'Q1') {
                console.log(`🎯 [PURPLE-DEPLOYMENT] This is Q1 (first quest) - looking for users with no completed quests`);
                
                // Find users in this class who have no completed quests
                const eligibleUsers = await userDataCollection.find({
                    $or: [
                        { 'user_data.customGroupId': classId },
                        { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}_purple_`) } }
                    ],
                    $or: [
                        { 'user_data.completed': { $exists: false } },
                        { 'user_data.completed': {} },
                        { 'user_data.completed': null }
                    ]
                }).toArray();
                
                console.log(`✅ [PURPLE-DEPLOYMENT] Found ${eligibleUsers.length} users with no completed quests`);
                
                // Filter out users who already have Q1 accepted or completed
                const readyUsers = eligibleUsers.filter(user => {
                    const userData = user.user_data || {};
                    const hasQ1Accepted = userData.accepted && userData.accepted.Q1;
                    const hasQ1Completed = userData.completed && userData.completed.Q1;
                    return !hasQ1Accepted && !hasQ1Completed;
                });
                
                console.log(`🎯 [PURPLE-DEPLOYMENT] ${readyUsers.length} users ready for Q1`);
                studentsReadyForNewQuest = readyUsers.map(user => ({
                    username: user._id,
                    repo: user._id
                }));
            } else if (actualPrerequisiteQuestId) {
                console.log(`🎯 [PURPLE-DEPLOYMENT] Looking for users who completed: ${actualPrerequisiteQuestId}`);
                
                // Find users in this class who completed the prerequisite quest
                // Include both original classId and purple deployment groupIds
                const eligibleUsers = await userDataCollection.find({
                    $or: [
                        { 'user_data.customGroupId': classId },
                        { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}_purple_`) } }
                    ],
                    [`user_data.completed.${actualPrerequisiteQuestId}`]: { $exists: true }
                }).toArray();
                
                console.log(`✅ [PURPLE-DEPLOYMENT] Found ${eligibleUsers.length} users who completed ${actualPrerequisiteQuestId}`);
                
                // Filter out users who already have the new quest accepted or completed
                const readyUsers = eligibleUsers.filter(user => {
                    const userData = user.user_data || {};
                    const hasNewQuestAccepted = userData.accepted && userData.accepted[newQuestId];
                    const hasNewQuestCompleted = userData.completed && userData.completed[newQuestId];
                    return !hasNewQuestAccepted && !hasNewQuestCompleted;
                });
                
                console.log(`🎯 [PURPLE-DEPLOYMENT] ${readyUsers.length} users ready for ${newQuestId}`);
                studentsReadyForNewQuest = readyUsers.map(user => ({
                    username: user._id,
                    repo: user._id // For OSS-Doorway repos, username is the repo name
                }));
            }
            
            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 9: Updating class information...`);
            // 8. Update class information to reference the new config
            await Group.findByIdAndUpdate(classId, {
                $set: {
                    questJsonConfig: newConfig,
                    questJsonLastUpdated: new Date(),
                    'questOrderLastUpdated': new Date()
                }
            });
            console.log(`✅ [PURPLE-DEPLOYMENT] Class information updated`);

            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 10: Migrating users to new configuration...`);
            // 9. Migrate users to the new configuration BEFORE posting comments
            // Include both original classId and purple deployment groupIds
            const usersToMigrate = await userDataCollection.find({
                $or: [
                    { 'user_data.customGroupId': classId },
                    { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}_purple_`) } }
                ]
            }).toArray();
            
            console.log(`👥 [PURPLE-DEPLOYMENT] Found ${usersToMigrate.length} users to migrate`);
            
            // Track migration failures for comprehensive error handling
            const migrationFailures = [];
            const migrationSuccesses = [];
            
            for (const user of usersToMigrate) {
                try {
                    const updateResult = await userDataCollection.updateOne(
                            { _id: user._id },
                        { 
                            $set: { 
                                'user_data.customGroupId': newConfig.classId,
                                'user_data.customSequenceFile': `${newConfig.classId}.json`
                            }
                        }
                    );
                    
                    if (updateResult.modifiedCount > 0) {
                            migratedUsers++;
                        usersWithNewQuestAccess.push(user._id);
                        migrationSuccesses.push(user._id);
                        console.log(`✅ [PURPLE-DEPLOYMENT] Migrated user: ${user._id}`);
                        } else {
                        const errorMsg = `No changes made to user ${user._id} (may already be migrated)`;
                        console.log(`⚠️ [PURPLE-DEPLOYMENT] ${errorMsg}`);
                        migrationFailures.push({ user: user._id, error: errorMsg });
                    }
                } catch (migrationError) {
                    const errorMsg = `Failed to migrate user ${user._id}: ${migrationError.message}`;
                    console.error(`❌ [PURPLE-DEPLOYMENT] ${errorMsg}`);
                    migrationFailures.push({ user: user._id, error: errorMsg });
                }
            }
            
            console.log(`✅ [PURPLE-DEPLOYMENT] Migration completed: ${migratedUsers} successful, ${migrationFailures.length} failed`);
            
            // VERIFICATION: Double-check that all users are properly migrated
            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 10.5: Verifying migration...`);
            const verificationQuery = await userDataCollection.find({
                $or: [
                    { 'user_data.customGroupId': classId },
                    { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}_purple_(?!${newConfig.classId.split('_purple_')[1]})`) } }
                ]
            }).toArray();
            
            if (verificationQuery.length > 0) {
                console.error(`❌ [PURPLE-DEPLOYMENT] VERIFICATION FAILED: ${verificationQuery.length} users still not migrated:`);
                for (const user of verificationQuery) {
                    console.error(`  - ${user._id}: customGroupId=${user.user_data?.customGroupId}`);
                }
                
                // Attempt to fix remaining users
                console.log(`🔧 [PURPLE-DEPLOYMENT] Attempting to fix remaining users...`);
                for (const user of verificationQuery) {
                    try {
                        await userDataCollection.updateOne(
                            { _id: user._id },
                            { 
                                $set: { 
                                    'user_data.customGroupId': newConfig.classId,
                                    'user_data.customSequenceFile': `${newConfig.classId}.json`
                                }
                            }
                        );
                        console.log(`🔧 [PURPLE-DEPLOYMENT] Fixed user: ${user._id}`);
                        migratedUsers++;
                    } catch (fixError) {
                        console.error(`❌ [PURPLE-DEPLOYMENT] Failed to fix user ${user._id}:`, fixError.message);
                    }
                }
            } else {
                console.log(`✅ [PURPLE-DEPLOYMENT] Verification passed: All users properly migrated`);
            }
            
            // Log detailed migration summary
            console.log(`📊 [PURPLE-DEPLOYMENT] Migration Summary:`);
            console.log(`  - Total users found: ${usersToMigrate.length}`);
            console.log(`  - Successfully migrated: ${migratedUsers}`);
            console.log(`  - Migration failures: ${migrationFailures.length}`);
            if (migrationFailures.length > 0) {
                console.log(`  - Failed users:`, migrationFailures.map(f => f.user).join(', '));
            }

            console.log(`🔍 [PURPLE-DEPLOYMENT] Step 11: Clearing bot cache for new configuration...`);
            // Get GitHub access token for both cache clearing and auto-unlock
            const { getGithubAppInstallationAccessToken } = require('../utils/botMessage');
            const axios = require('axios');
            let accessToken = null;
            
            try {
                accessToken = await getGithubAppInstallationAccessToken();
                console.log(`✅ [PURPLE-DEPLOYMENT] GitHub access token obtained`);
                
                // Cache clearing
                if (usersToMigrate.length > 0) {
                    const sampleUser = usersToMigrate[0];
                    const sampleRepo = sampleUser._id;
                    
                    const issuesResponse = await axios.get(`https://api.github.com/repos/OSS-Doorway-Dev/${sampleRepo}/issues`, {
                        headers: {
                            'Authorization': `token ${accessToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'OSS-Management-Backend'
                        },
                        params: { state: 'open', sort: 'updated', direction: 'desc', per_page: 1 }
                    });
                    
                    if (issuesResponse.data && issuesResponse.data.length > 0) {
                        const issue = issuesResponse.data[0];
                        console.log(`💬 [PURPLE-DEPLOYMENT] Posting cache clear command to ${sampleRepo}#${issue.number}: /cache clear-all`);
                        
                        await axios.post(`https://api.github.com/repos/OSS-Doorway-Dev/${sampleRepo}/issues/${issue.number}/comments`, {
                            body: `/cache clear-all`
                        }, {
                            headers: {
                                'Authorization': `token ${accessToken}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'User-Agent': 'OSS-Management-Backend'
                            }
                        });
                        
                        console.log(`✅ [PURPLE-DEPLOYMENT] Cache clear command posted - bot will reload all configs`);
                    }
                }
            } catch (cacheError) {
                console.warn(`⚠️ [PURPLE-DEPLOYMENT] Failed to clear bot cache (non-critical):`, cacheError.message);
            }

                // AUTO-UNLOCK: Now unlock the new quest for all migrated users by posting /accept to their repo
                {
                    const targetUsers = usersWithNewQuestAccess || [];
                    console.log(`🚀 [PURPLE-DEPLOYMENT] Step 12: Auto-accepting ${newQuestId} for ${targetUsers.length} users (override prerequisite)`);
                    
                    let autoUnlockSuccess = 0;
                    
                    try {
                        if (!accessToken) {
                            console.log(`❌ [PURPLE-DEPLOYMENT] No GitHub access token available for auto-unlock`);
                            return;
                        }
                        console.log(`✅ [PURPLE-DEPLOYMENT] Using GitHub access token for auto-unlock`);
                        
                        let successCount = 0;
                        let unlockErrors = [];
                        
                        for (const student of targetUsers) {
                            try {
                                // student is a string (user ID), not an object
                                const username = student;
                                const repo = student; // For OSS-Doorway repos, username is the repo name
                                console.log(`🔓 [PURPLE-DEPLOYMENT] Auto-accepting ${newQuestId} for ${username}...`);
                                
                                // Prefer latest closed issue; fallback to latest open
                                const closedIssuesResponse = await axios.get(`https://api.github.com/repos/OSS-Doorway-Dev/${repo}/issues`, {
                                     headers: {
                                         'Authorization': `token ${accessToken}`,
                                         'Accept': 'application/vnd.github.v3+json',
                                         'User-Agent': 'OSS-Management-Backend'
                                     },
                                     params: { state: 'closed', sort: 'updated', direction: 'desc', per_page: 10 }
                                 });

                                let targetIssue = closedIssuesResponse.data && closedIssuesResponse.data[0];
                                if (!targetIssue) {
                                    const openIssuesResponse = await axios.get(`https://api.github.com/repos/OSS-Doorway-Dev/${repo}/issues`, {
                                        headers: {
                                            'Authorization': `token ${accessToken}`,
                                            'Accept': 'application/vnd.github.v3+json',
                                            'User-Agent': 'OSS-Management-Backend'
                                        },
                                        params: { state: 'open', sort: 'updated', direction: 'desc', per_page: 10 }
                                    });
                                    targetIssue = openIssuesResponse.data && openIssuesResponse.data[0];
                                }

                                if (targetIssue) {
                                    console.log(`📝 [PURPLE-DEPLOYMENT] Using issue #${targetIssue.number} for ${username}: "${targetIssue.title}"`);
                                    console.log(`💬 [PURPLE-DEPLOYMENT] Posting "/accept ${newQuestId}" to ${username}'s issue...`);
                                    await axios.post(`https://api.github.com/repos/OSS-Doorway-Dev/${repo}/issues/${targetIssue.number}/comments`, {
                                        body: `/accept ${newQuestId}`
                                    }, {
                                        headers: {
                                            'Authorization': `token ${accessToken}`,
                                            'Accept': 'application/vnd.github.v3+json',
                                            'User-Agent': 'OSS-Management-Backend'
                                        }
                                    });
                                    
                                    successCount++;
                                    console.log(`✅ [PURPLE-DEPLOYMENT] Successfully unlocked ${newQuestId} for ${username}`);
            } else {
                                    const errorMsg = `${username}: No issues found (open or closed)`;
                                    console.log(`⚠️ [PURPLE-DEPLOYMENT] ${errorMsg}`);
                                    unlockErrors.push(errorMsg);
                                }
                            } catch (studentError) {
                                const errorMsg = `${student}: ${studentError.message}`;
                                console.error(`❌ [PURPLE-DEPLOYMENT] Error processing ${student}:`, studentError.message);
                                unlockErrors.push(errorMsg);
                            }
                        }
                        
                        autoUnlockSuccess = successCount;
                        
                        console.log(`🎉 [PURPLE-DEPLOYMENT] Auto-unlock completed!`);
                        console.log(`📊 [PURPLE-DEPLOYMENT] Unlock summary:`, {
                            questId: newQuestId,
                            successCount,
                            totalStudents: targetUsers.length,
                            errorCount: unlockErrors.length,
                            successRate: `${targetUsers.length > 0 ? Math.round((successCount / targetUsers.length) * 100) : 0}%`
                        });
                        
                        if (unlockErrors.length > 0) {
                            console.log(`⚠️ [PURPLE-DEPLOYMENT] Unlock errors:`, unlockErrors);
                        }
                        
                    } catch (unlockError) {
                        console.error(`❌ [PURPLE-DEPLOYMENT] Auto-unlock failed:`, unlockError.message);
                        console.log(`⚠️ [PURPLE-DEPLOYMENT] Quest deployed but auto-unlock failed - students will need to unlock manually`);
                    }
                
                    // Close database connection
            await ossDoorwayClient.close();
            console.log(`🔗 [PURPLE-DEPLOYMENT] Database connection closed`);
            
            return res.status(200).json({
                message: `Successfully created new configuration with appended quest ${newQuestId} and migrated ${migratedUsers} users`,
                baseConfigId: originalConfigId, // The config we built from (could be original or previous purple)
                newConfigId,
                newQuestId,
                baseQuests: existingQuests.length, // Quests in the config we built from
                newTotalQuests: newTotalQuests,   // Total quests in new config
                migratedUsers,
                        migrationFailures: migrationFailures.length,
                        migrationFailureDetails: migrationFailures,
                usersWithNewQuestAccess: usersWithNewQuestAccess.length,
                        studentsReadyForNewQuest: studentsReadyForNewQuest.length,
                        autoUnlockedCount: autoUnlockSuccess,
                class: classInfo.groupName,
                isPurpleDeployment: true,
                // Legacy fields for compatibility
                originalConfigId,
                originalQuests: existingQuests.length
            });
                }

        } catch (error) {
            console.error(`❌ [PURPLE-DEPLOYMENT] Error:`, error);
                if (ossDoorwayClient) {
                    await ossDoorwayClient.close();
                }
            return res.status(500).json({ message: 'Failed to deploy quest', error: error.message });
        }
    } catch (error) {
        console.error(`❌ [PURPLE-DEPLOYMENT] Error:`, error);
        return res.status(500).json({ message: 'Failed to deploy quest', error: error.message });
    }
};

// Update live task config for current users using Purple Deploy approach
const updateLiveTaskConfig = async (req, res) => {
    try {
        const { classId, questIndex, taskId, updatedTask } = req.body;
        
        console.log(`🟣 [PURPLE-TASK-EDIT] Starting purple deployment for task edit`);
        console.log(`📋 [PURPLE-TASK-EDIT] Class: ${classId}, Quest ${questIndex + 1}, Task ${taskId}`);
        
        if (!classId || questIndex === undefined || !taskId || !updatedTask) {
            console.log(`❌ [PURPLE-TASK-EDIT] Missing required fields`);
            return res.status(400).json({ 
                success: false,
                message: "Missing required fields: classId, questIndex, taskId, updatedTask" 
            });
        }

        // Import required modules
        const Group = require('../models/GroupModel');
        const { MongoClient } = require('mongodb');
        const mongoose = require('mongoose');
        
        // Connect to OSS-Doorway database for quest configs
        const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
        const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';
        
        console.log(`🔗 [PURPLE-TASK-EDIT] Connecting to OSS-Doorway database: ${ossDoorwayDbName}`);
        
        let ossDoorwayClient = null;
        let migratedUsers = 0;
        let originalConfigId = null;
        let newConfigId = null;
        
        try {
            // Connect to OSS-Doorway database
            ossDoorwayClient = new MongoClient(ossDoorwayUri);
            await ossDoorwayClient.connect();
            console.log(`✅ [PURPLE-TASK-EDIT] Connected to OSS-Doorway database`);
            
            const ossDoorwayDb = ossDoorwayClient.db(ossDoorwayDbName);
            const questConfigsCollection = ossDoorwayDb.collection('questconfigs');
            const userDataCollection = ossDoorwayDb.collection('user_data');
            
            console.log(`🔍 [PURPLE-TASK-EDIT] Step 1: Finding existing quest configuration...`);
            // Step 1: Find existing quest configuration (same logic as purple deploy)
            const existingConfig = await questConfigsCollection.findOne({
                $or: [
                    { classId: classId },
                    { groupId: classId },
                    { configId: classId }
                ]
            });
            
            if (!existingConfig) {
                throw new Error(`No quest configuration found for class ${classId}`);
            }
            
            // Check for latest purple config
            const latestPurpleConfig = await questConfigsCollection.findOne(
                { classId: { $regex: new RegExp(`^${classId}_purple_`) } },
                { sort: { createdAt: -1 } }
            );
            
            // Use the latest purple config if it exists, otherwise use the original config
            const configToModify = latestPurpleConfig || existingConfig;
            originalConfigId = configToModify._id.toString();
            
            console.log(`✅ [PURPLE-TASK-EDIT] Found config to modify: ${configToModify.classId}`);
            console.log(`📋 [PURPLE-TASK-EDIT] Config ID: ${originalConfigId}`);
            
            console.log(`🔍 [PURPLE-TASK-EDIT] Step 2: Creating modified configuration...`);
            // Step 2: Create modified configuration with updated task
            const modifiedConfig = { ...configToModify };
            
            // Handle both legacy format and new questSequence format
            if (modifiedConfig.config) {
                // Legacy format: config.Q1.T1, config.Q2.T3, etc.
                const questKeys = Object.keys(modifiedConfig.config).filter(key => key.startsWith('Q'));
                const questKey = questKeys[questIndex];
                
                if (questKey && modifiedConfig.config[questKey] && modifiedConfig.config[questKey][taskId]) {
                    console.log(`🔄 [PURPLE-TASK-EDIT] Updating legacy format: ${questKey}.${taskId}`);
                    modifiedConfig.config[questKey][taskId] = updatedTask;
                } else {
                    console.log(`❌ [PURPLE-TASK-EDIT] Task not found in legacy format: ${questKey}.${taskId}`);
                    return res.status(404).json({ 
                        success: false,
                        message: `Task not found: ${questKey}.${taskId}` 
                    });
                }
            } else if (modifiedConfig.questSequence && Array.isArray(modifiedConfig.questSequence)) {
                // New format: questSequence array
                if (modifiedConfig.questSequence[questIndex] && modifiedConfig.questSequence[questIndex].tasks[taskId]) {
                    console.log(`🔄 [PURPLE-TASK-EDIT] Updating questSequence format: Quest ${questIndex}.${taskId}`);
                    modifiedConfig.questSequence[questIndex].tasks[taskId] = updatedTask;
                } else {
                    console.log(`❌ [PURPLE-TASK-EDIT] Task not found in questSequence format: Quest ${questIndex}.${taskId}`);
                    return res.status(404).json({ 
                        success: false,
                        message: `Task not found: Quest ${questIndex}.${taskId}` 
                    });
                }
            } else {
                console.log(`❌ [PURPLE-TASK-EDIT] Unknown config format`);
                return res.status(400).json({ 
                    success: false,
                    message: "Unknown config format" 
                });
            }
            
            console.log(`🔍 [PURPLE-TASK-EDIT] Step 3: Creating new purple configuration...`);
            // Step 3: Create new quest configuration (keeping original intact)
            const newConfig = {
                ...modifiedConfig,
                _id: new mongoose.Types.ObjectId(),
                classId: `${classId}_purple_${Date.now()}`,
                groupId: `${classId}_purple_${Date.now()}`,
                configId: `${classId}_purple_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                isPurpleDeployment: true,
                isTaskEdit: true,
                baseConfigId: originalConfigId,
                editedTask: { questIndex, taskId },
                editedAt: new Date()
            };
            
            newConfigId = newConfig._id.toString();
            console.log(`✅ [PURPLE-TASK-EDIT] New config created: ${newConfigId}`);
            console.log(`📊 [PURPLE-TASK-EDIT] Config name: ${newConfig.classId}`);
            
            console.log(`🔍 [PURPLE-TASK-EDIT] Step 4: Saving new quest configuration...`);
            // Step 4: Save the new quest configuration
            await questConfigsCollection.insertOne(newConfig);
            console.log(`✅ [PURPLE-TASK-EDIT] New quest configuration saved`);
            
            console.log(`🔍 [PURPLE-TASK-EDIT] Step 5: Updating class information...`);
            // Step 5: Update class information to reference the new config
            await Group.findByIdAndUpdate(classId, {
                $set: {
                    questJsonConfig: newConfig,
                    questJsonLastUpdated: new Date(),
                    'questOrderLastUpdated': new Date()
                }
            });
            console.log(`✅ [PURPLE-TASK-EDIT] Class information updated`);
            
            console.log(`🔍 [PURPLE-TASK-EDIT] Step 6: Migrating users to new configuration...`);
            // Step 6: Migrate users to the new configuration
            const usersToMigrate = await userDataCollection.find({
                $or: [
                    { 'user_data.customGroupId': classId },
                    { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}_purple_`) } }
                ]
            }).toArray();
            
            console.log(`👥 [PURPLE-TASK-EDIT] Found ${usersToMigrate.length} users to migrate`);
            
            // Track migration failures
            const migrationFailures = [];
            
            for (const user of usersToMigrate) {
                try {
                    const updateResult = await userDataCollection.updateOne(
                        { _id: user._id },
                        { 
                            $set: { 
                                'user_data.customGroupId': newConfig.classId,
                                'user_data.customSequenceFile': `${newConfig.classId}.json`
                            }
                        }
                    );
                    
                    if (updateResult.modifiedCount > 0) {
                        migratedUsers++;
                        console.log(`✅ [PURPLE-TASK-EDIT] Migrated user: ${user._id}`);
                    } else {
                        const errorMsg = `No changes made to user ${user._id} (may already be migrated)`;
                        console.log(`⚠️ [PURPLE-TASK-EDIT] ${errorMsg}`);
                        migrationFailures.push({ user: user._id, error: errorMsg });
                    }
                } catch (migrationError) {
                    const errorMsg = `Failed to migrate user ${user._id}: ${migrationError.message}`;
                    console.error(`❌ [PURPLE-TASK-EDIT] ${errorMsg}`);
                    migrationFailures.push({ user: user._id, error: errorMsg });
                }
            }
            
            console.log(`✅ [PURPLE-TASK-EDIT] Migration completed: ${migratedUsers} successful, ${migrationFailures.length} failed`);
            
            // VERIFICATION: Double-check that all users are properly migrated
            console.log(`🔍 [PURPLE-TASK-EDIT] Step 7: Verifying migration...`);
            const verificationQuery = await userDataCollection.find({
                $or: [
                    { 'user_data.customGroupId': classId },
                    { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}_purple_(?!${newConfig.classId.split('_purple_')[1]})`) } }
                ]
            }).toArray();
            
            if (verificationQuery.length > 0) {
                console.error(`❌ [PURPLE-TASK-EDIT] VERIFICATION FAILED: ${verificationQuery.length} users still not migrated`);
                
                // Attempt to fix remaining users
                console.log(`🔧 [PURPLE-TASK-EDIT] Attempting to fix remaining users...`);
                for (const user of verificationQuery) {
                    try {
                        await userDataCollection.updateOne(
                            { _id: user._id },
                            { 
                                $set: { 
                                    'user_data.customGroupId': newConfig.classId,
                                    'user_data.customSequenceFile': `${newConfig.classId}.json`
                                }
                            }
                        );
                        console.log(`🔧 [PURPLE-TASK-EDIT] Fixed user: ${user._id}`);
                        migratedUsers++;
                    } catch (fixError) {
                        console.error(`❌ [PURPLE-TASK-EDIT] Failed to fix user ${user._id}:`, fixError.message);
                    }
                }
            } else {
                console.log(`✅ [PURPLE-TASK-EDIT] Verification passed: All users properly migrated`);
            }
            
            console.log(`🎉 [PURPLE-TASK-EDIT] Purple deployment completed successfully!`);
            
            return res.status(200).json({
                success: true,
                message: `Successfully created new configuration with updated task and migrated ${migratedUsers} users`,
                data: {
                    baseConfigId: originalConfigId,
                    newConfigId: newConfigId,
                    configName: newConfig.classId,
                    questIndex: questIndex,
                    taskId: taskId,
                    migratedUsers: migratedUsers,
                    migrationFailures: migrationFailures.length,
                    isPurpleDeployment: true,
                    isTaskEdit: true,
                    updatedAt: newConfig.updatedAt
                }
            });
            
        } finally {
            if (ossDoorwayClient) {
                await ossDoorwayClient.close();
            }
        }
        
    } catch (error) {
        console.error(`❌ [PURPLE-TASK-EDIT] Error:`, error);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error", 
            error: error.message 
        });
    }
};

// Update live quest configuration (creates new purple config)
const updateLiveQuestConfig = async (req, res) => {
    try {
        const { classId, questIndex, updatedQuest } = req.body;
        
        console.log(`🟣 [PURPLE-QUEST-EDIT] Starting purple deployment for quest edit`);
        console.log(`📋 [PURPLE-QUEST-EDIT] Class: ${classId}, Quest ${questIndex + 1}`);
        
        if (!classId || questIndex === undefined || !updatedQuest) {
            console.log(`❌ [PURPLE-QUEST-EDIT] Missing required fields`);
            return res.status(400).json({ 
                success: false,
                message: "Missing required fields: classId, questIndex, updatedQuest" 
            });
        }

        // Import required modules
        const Group = require('../models/GroupModel');
        const { MongoClient } = require('mongodb');
        const mongoose = require('mongoose');
        
        // Connect to OSS-Doorway database for quest configs
        const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
        const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';
        
        console.log(`🔗 [PURPLE-QUEST-EDIT] Connecting to OSS-Doorway database: ${ossDoorwayDbName}`);
        
        let ossDoorwayClient = null;
        let migratedUsers = 0;
        let originalConfigId = null;
        let newConfigId = null;
        
        try {
            // Connect to OSS-Doorway database
            ossDoorwayClient = new MongoClient(ossDoorwayUri);
            await ossDoorwayClient.connect();
            console.log(`✅ [PURPLE-QUEST-EDIT] Connected to OSS-Doorway database`);
            
            const ossDoorwayDb = ossDoorwayClient.db(ossDoorwayDbName);
            const questConfigsCollection = ossDoorwayDb.collection('questconfigs');
            const userDataCollection = ossDoorwayDb.collection('user_data');
            
            console.log(`🔍 [PURPLE-QUEST-EDIT] Step 1: Finding existing quest configuration...`);
            // Step 1: Find existing quest configuration (same logic as purple deploy)
            const existingConfig = await questConfigsCollection.findOne({
                $or: [
                    { classId: classId },
                    { groupId: classId },
                    { configId: classId }
                ]
            });
            
            if (!existingConfig) {
                throw new Error(`No quest configuration found for class ${classId}`);
            }
            
            // Check for latest purple config
            const latestPurpleConfig = await questConfigsCollection.findOne(
                { classId: { $regex: new RegExp(`^${classId}_purple_`) } },
                { sort: { createdAt: -1 } }
            );
            
            // Use the latest purple config if it exists, otherwise use the original config
            const configToModify = latestPurpleConfig || existingConfig;
            originalConfigId = configToModify._id.toString();
            
            console.log(`✅ [PURPLE-QUEST-EDIT] Found config to modify: ${configToModify.classId}`);
            console.log(`📋 [PURPLE-QUEST-EDIT] Config ID: ${originalConfigId}`);
            
            console.log(`🔍 [PURPLE-QUEST-EDIT] Step 2: Creating modified configuration...`);
            // Step 2: Create modified configuration with updated quest
            const modifiedConfig = { ...configToModify };
            
            // Handle both legacy format and new questSequence format
            if (modifiedConfig.config) {
                // Legacy format: config.Q1, config.Q2, etc.
                const questKeys = Object.keys(modifiedConfig.config).filter(key => key.startsWith('Q'));
                const questKey = questKeys[questIndex];
                
                if (questKey && modifiedConfig.config[questKey]) {
                    console.log(`🔄 [PURPLE-QUEST-EDIT] Updating legacy format: ${questKey}`);
                    modifiedConfig.config[questKey].metadata = {
                        ...modifiedConfig.config[questKey].metadata,
                        title: updatedQuest.title,
                        description: updatedQuest.description
                    };
                } else {
                    console.log(`❌ [PURPLE-QUEST-EDIT] Quest not found in legacy format: ${questKey}`);
                    return res.status(404).json({ 
                        success: false,
                        message: `Quest not found: ${questKey}` 
                    });
                }
            } else if (modifiedConfig.questSequence && Array.isArray(modifiedConfig.questSequence)) {
                // New format: questSequence array
                if (modifiedConfig.questSequence[questIndex]) {
                    console.log(`🔄 [PURPLE-QUEST-EDIT] Updating questSequence format: Quest ${questIndex}`);
                    modifiedConfig.questSequence[questIndex].title = updatedQuest.title;
                    if (!modifiedConfig.questSequence[questIndex].metadata) {
                        modifiedConfig.questSequence[questIndex].metadata = {};
                    }
                    modifiedConfig.questSequence[questIndex].metadata.description = updatedQuest.description;
                } else {
                    console.log(`❌ [PURPLE-QUEST-EDIT] Quest not found in questSequence format: Quest ${questIndex}`);
                    return res.status(404).json({ 
                        success: false,
                        message: `Quest not found: Quest ${questIndex}` 
                    });
                }
            } else {
                console.log(`❌ [PURPLE-QUEST-EDIT] Unknown config format`);
                return res.status(400).json({ 
                    success: false,
                    message: "Unknown config format" 
                });
            }
            
            console.log(`🔍 [PURPLE-QUEST-EDIT] Step 3: Creating new purple configuration...`);
            // Step 3: Create new quest configuration (keeping original intact)
            const newConfig = {
                ...modifiedConfig,
                _id: new mongoose.Types.ObjectId(),
                classId: `${classId}_purple_${Date.now()}`,
                groupId: `${classId}_purple_${Date.now()}`,
                configId: `${classId}_purple_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
                isPurpleDeployment: true,
                isQuestEdit: true,
                baseConfigId: originalConfigId,
                editedQuest: { questIndex },
                editedAt: new Date()
            };
            
            newConfigId = newConfig._id.toString();
            console.log(`✅ [PURPLE-QUEST-EDIT] New config created: ${newConfigId}`);
            console.log(`📊 [PURPLE-QUEST-EDIT] Config name: ${newConfig.classId}`);
            
            console.log(`🔍 [PURPLE-QUEST-EDIT] Step 4: Saving new quest configuration...`);
            // Step 4: Save the new quest configuration
            await questConfigsCollection.insertOne(newConfig);
            console.log(`✅ [PURPLE-QUEST-EDIT] New quest configuration saved`);
            
            console.log(`🔍 [PURPLE-QUEST-EDIT] Step 5: Updating class information...`);
            // Step 5: Update class information to reference the new config
            await Group.findByIdAndUpdate(classId, {
                $set: {
                    questJsonConfig: newConfig,
                    questJsonLastUpdated: new Date(),
                    'questOrderLastUpdated': new Date()
                }
            });
            console.log(`✅ [PURPLE-QUEST-EDIT] Class information updated`);
            
            console.log(`🔍 [PURPLE-QUEST-EDIT] Step 6: Migrating users to new configuration...`);
            // Step 6: Migrate users to the new configuration
            const usersToMigrate = await userDataCollection.find({
                $or: [
                    { 'user_data.customGroupId': classId },
                    { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}_purple_`) } }
                ]
            }).toArray();
            
            console.log(`👥 [PURPLE-QUEST-EDIT] Found ${usersToMigrate.length} users to migrate`);
            
            // Track migration failures
            const migrationFailures = [];
            
            for (const user of usersToMigrate) {
                try {
                    const updateResult = await userDataCollection.updateOne(
                        { _id: user._id },
                        { 
                            $set: { 
                                'user_data.customGroupId': newConfig.classId,
                                'user_data.customSequenceFile': `${newConfig.classId}.json`
                            }
                        }
                    );
                    
                    if (updateResult.modifiedCount > 0) {
                        migratedUsers++;
                        console.log(`✅ [PURPLE-QUEST-EDIT] Migrated user: ${user._id}`);
                    } else {
                        const errorMsg = `No changes made to user ${user._id} (may already be migrated)`;
                        console.log(`⚠️ [PURPLE-QUEST-EDIT] ${errorMsg}`);
                        migrationFailures.push({ user: user._id, error: errorMsg });
                    }
                } catch (migrationError) {
                    const errorMsg = `Failed to migrate user ${user._id}: ${migrationError.message}`;
                    console.error(`❌ [PURPLE-QUEST-EDIT] ${errorMsg}`);
                    migrationFailures.push({ user: user._id, error: errorMsg });
                }
            }
            
            console.log(`✅ [PURPLE-QUEST-EDIT] Migration completed: ${migratedUsers} successful, ${migrationFailures.length} failed`);
            
            // VERIFICATION: Double-check that all users are properly migrated
            console.log(`🔍 [PURPLE-QUEST-EDIT] Step 7: Verifying migration...`);
            const verificationQuery = await userDataCollection.find({
                $or: [
                    { 'user_data.customGroupId': classId },
                    { 'user_data.customGroupId': { $regex: new RegExp(`^${classId}_purple_(?!${newConfig.classId.split('_purple_')[1]})`) } }
                ]
            }).toArray();
            
            if (verificationQuery.length > 0) {
                console.error(`❌ [PURPLE-QUEST-EDIT] VERIFICATION FAILED: ${verificationQuery.length} users still not migrated`);
                
                // Attempt to fix remaining users
                console.log(`🔧 [PURPLE-QUEST-EDIT] Attempting to fix remaining users...`);
                for (const user of verificationQuery) {
                    try {
                        await userDataCollection.updateOne(
                            { _id: user._id },
                            { 
                                $set: { 
                                    'user_data.customGroupId': newConfig.classId,
                                    'user_data.customSequenceFile': `${newConfig.classId}.json`
                                }
                            }
                        );
                        console.log(`🔧 [PURPLE-QUEST-EDIT] Fixed user: ${user._id}`);
                        migratedUsers++;
                    } catch (fixError) {
                        console.error(`❌ [PURPLE-QUEST-EDIT] Failed to fix user ${user._id}:`, fixError.message);
                    }
                }
            } else {
                console.log(`✅ [PURPLE-QUEST-EDIT] Verification passed: All users properly migrated`);
            }
            
            console.log(`🎉 [PURPLE-QUEST-EDIT] Purple deployment completed successfully!`);
            
            return res.status(200).json({
                success: true,
                message: `Successfully created new configuration with updated quest and migrated ${migratedUsers} users`,
                data: {
                    baseConfigId: originalConfigId,
                    newConfigId: newConfigId,
                    configName: newConfig.classId,
                    questIndex: questIndex,
                    migratedUsers: migratedUsers,
                    migrationFailures: migrationFailures.length,
                    isPurpleDeployment: true,
                    isQuestEdit: true,
                    updatedAt: newConfig.updatedAt
                }
            });
            
        } finally {
            if (ossDoorwayClient) {
                await ossDoorwayClient.close();
            }
        }
        
    } catch (error) {
        console.error(`❌ [PURPLE-QUEST-EDIT] Error:`, error);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error", 
            error: error.message 
        });
    }
};

module.exports.deployQuestToClass = deployQuestToClass;
module.exports.unlockQuestForStudents = unlockQuestForStudents;
module.exports.purpleDeployQuest = purpleDeployQuest;
module.exports.updateLiveTaskConfig = updateLiveTaskConfig;
module.exports.updateLiveQuestConfig = updateLiveQuestConfig;



