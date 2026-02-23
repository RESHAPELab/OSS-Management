const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target student repository
const TARGET_STUDENT_REPO = '8-Nate-cs386-software-engineering';

async function checkNateTasks() {
    console.log(`🔍 Checking loaded tasks for student: ${TARGET_STUDENT_REPO}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // First, find the student in user_data collection
        console.log(`🔍 Searching for student in user_data collection...`);
        const userData = await db.collection('user_data').findOne({
            _id: TARGET_STUDENT_REPO
        });
        
        if (!userData) {
            console.log(`❌ Student ${TARGET_STUDENT_REPO} not found in user_data collection`);
            
            // List some available students for reference
            console.log(`\n📋 Available students (first 10):`);
            const students = await db.collection('user_data').find({}).limit(10).toArray();
            students.forEach(student => {
                console.log(`   - ${student._id}`);
            });
            return;
        }
        
        console.log(`✅ Found student: ${TARGET_STUDENT_REPO}`);
        console.log(`📊 Student data:`);
        console.log(`   Custom Group ID: ${userData.user_data?.customGroupId || 'Not set'}`);
        console.log(`   Current Quest: ${userData.user_data?.current?.quest || 'Not set'}`);
        console.log(`   Current Task: ${userData.user_data?.current?.task || 'Not set'}`);
        console.log(`   Points: ${userData.user_data?.points || 0}`);
        console.log(`   XP: ${userData.user_data?.xp || 0}`);
        console.log(`   Completion: ${userData.user_data?.completion || 0}%`);
        
        // Completed quests
        const completed = userData.user_data?.completed || {};
        console.log(`\n✅ COMPLETED QUESTS:`);
        console.log(`=====================================`);
        if (Object.keys(completed).length === 0) {
            console.log(`No completed quests`);
        } else {
            Object.keys(completed).forEach(questId => {
                const questData = completed[questId];
                console.log(`\n${questId}:`);
                if (typeof questData === 'object' && questData !== null) {
                    Object.keys(questData).forEach(taskId => {
                        const taskData = questData[taskId];
                        if (taskData && typeof taskData === 'object') {
                            console.log(`   ${taskId}:`);
                            console.log(`     - Completed: ${taskData.completed || false}`);
                            console.log(`     - Issue #: ${taskData.issueNum || 'Not set'}`);
                            console.log(`     - Attempts: ${taskData.attempts || 0}`);
                            console.log(`     - Hints: ${taskData.hints || 0}`);
                            console.log(`     - Time Start: ${taskData.timeStart ? new Date(taskData.timeStart).toISOString() : 'Not set'}`);
                            console.log(`     - Time End: ${taskData.timeEnd ? new Date(taskData.timeEnd).toISOString() : 'Not set'}`);
                        } else {
                            console.log(`   ${taskId}: ${JSON.stringify(taskData)}`);
                        }
                    });
                } else {
                    console.log(`   Data: ${JSON.stringify(questData)}`);
                }
            });
        }
        
        // Accepted quests (currently working on)
        const accepted = userData.user_data?.accepted || {};
        console.log(`\n🔓 ACCEPTED QUESTS (Currently Working On):`);
        console.log(`=====================================`);
        if (Object.keys(accepted).length === 0) {
            console.log(`No accepted quests`);
        } else {
            Object.keys(accepted).forEach(questId => {
                const questData = accepted[questId];
                console.log(`\n${questId}:`);
                if (typeof questData === 'object' && questData !== null) {
                    Object.keys(questData).forEach(taskId => {
                        const taskData = questData[taskId];
                        if (taskData && typeof taskData === 'object') {
                            console.log(`   ${taskId}:`);
                            console.log(`     - Completed: ${taskData.completed || false}`);
                            console.log(`     - Issue #: ${taskData.issueNum || 'Not set'}`);
                            console.log(`     - Attempts: ${taskData.attempts || 0}`);
                            console.log(`     - Hints: ${taskData.hints || 0}`);
                            console.log(`     - Time Start: ${taskData.timeStart ? new Date(taskData.timeStart).toISOString() : 'Not set'}`);
                            console.log(`     - Time End: ${taskData.timeEnd ? new Date(taskData.timeEnd).toISOString() : 'Not set'}`);
                        } else {
                            console.log(`   ${taskId}: ${JSON.stringify(taskData)}`);
                        }
                    });
                } else {
                    console.log(`   Data: ${JSON.stringify(questData)}`);
                }
            });
        }
        
        // Summary of loaded tasks
        console.log(`\n📋 SUMMARY OF LOADED TASKS:`);
        console.log(`=====================================`);
        
        const allTasks = [];
        
        // Collect completed tasks
        Object.keys(completed).forEach(questId => {
            const questData = completed[questId];
            if (typeof questData === 'object' && questData !== null) {
                Object.keys(questData).forEach(taskId => {
                    const taskData = questData[taskId];
                    if (taskData && typeof taskData === 'object' && taskData.completed) {
                        allTasks.push({
                            quest: questId,
                            task: taskId,
                            status: 'COMPLETED',
                            issueNum: taskData.issueNum,
                            timeEnd: taskData.timeEnd
                        });
                    }
                });
            }
        });
        
        // Collect accepted tasks
        Object.keys(accepted).forEach(questId => {
            const questData = accepted[questId];
            if (typeof questData === 'object' && questData !== null) {
                Object.keys(questData).forEach(taskId => {
                    const taskData = questData[taskId];
                    if (taskData && typeof taskData === 'object') {
                        allTasks.push({
                            quest: questId,
                            task: taskId,
                            status: taskData.completed ? 'COMPLETED' : 'IN_PROGRESS',
                            issueNum: taskData.issueNum,
                            timeEnd: taskData.timeEnd
                        });
                    }
                });
            }
        });
        
        // Sort tasks by quest and task number
        allTasks.sort((a, b) => {
            const questCompare = a.quest.localeCompare(b.quest);
            if (questCompare !== 0) return questCompare;
            return a.task.localeCompare(b.task);
        });
        
        console.log(`Total tasks loaded: ${allTasks.length}`);
        console.log(`\nTask breakdown:`);
        allTasks.forEach(task => {
            const statusIcon = task.status === 'COMPLETED' ? '✅' : '🔄';
            const issueInfo = task.issueNum ? `(Issue #${task.issueNum})` : '(No issue)';
            const timeInfo = task.timeEnd ? ` - Completed: ${new Date(task.timeEnd).toLocaleString()}` : '';
            console.log(`   ${statusIcon} ${task.quest}.${task.task} ${issueInfo}${timeInfo}`);
        });
        
        // Check for quest configuration
        if (userData.user_data?.customGroupId) {
            console.log(`\n🔍 QUEST CONFIGURATION:`);
            console.log(`=====================================`);
            console.log(`Custom Group ID: ${userData.user_data.customGroupId}`);
            
            // Try to find the quest configuration
            const questConfig = await db.collection('questconfigs').findOne({
                classId: userData.user_data.customGroupId
            });
            
            if (questConfig) {
                console.log(`✅ Quest configuration found`);
                console.log(`   Config ID: ${questConfig.configId}`);
                console.log(`   Created: ${questConfig.createdAt ? new Date(questConfig.createdAt).toISOString() : 'Unknown'}`);
                console.log(`   Available quests: ${Object.keys(questConfig.config).filter(key => key !== 'map_repo_link').join(', ')}`);
            } else {
                console.log(`❌ Quest configuration not found for customGroupId: ${userData.user_data.customGroupId}`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Checking 8-Nate's loaded tasks...`);
checkNateTasks().catch(console.error);
