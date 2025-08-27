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

}

const updateReadme = async(req, res) => {
    const { studentId, groupId } = req.body;
    const readme = await Readme.findOne({ group: groupId });
    const userRepo = await UserRepo.findOne({ student: studentId, group: groupId });
    
    let fileContent = readme.content
    const currentQuestsDescription = await CurrentQuestDescription(studentId, groupId);
    
    fileContent = fileContent + currentQuestsDescription;

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
            const issuesResponse = await axios.get(`https://api.github.com/repos/${org}/${repoName}/issues`, {
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

            if (!issuesResponse.data || issuesResponse.data.length === 0) {
                return res.status(404).json({ message: "No open issues found in repository. Student may not have started any quests yet." });
            }

            // Use the most recently updated issue
            const latestIssue = issuesResponse.data[0];
            console.log(`📝 Found issue #${latestIssue.number}: ${latestIssue.title}`);

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

module.exports.deployQuestToClass = deployQuestToClass;
module.exports.unlockQuestForStudents = unlockQuestForStudents;