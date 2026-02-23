const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target student repository
const TARGET_STUDENT_REPO = '8-Nate-cs386-software-engineering';
const GITHUB_REPO = 'OSS-Doorway-Dev/8-Nate-cs386-software-engineering';

async function checkDatabaseSync() {
    console.log(`🔍 Checking database sync for: ${TARGET_STUDENT_REPO}`);
    console.log(`📁 GitHub repo: ${GITHUB_REPO}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Get user data from database
        console.log(`\n🔍 Fetching user data from database...`);
        const userData = await db.collection('user_data').findOne({
            _id: TARGET_STUDENT_REPO
        });
        
        if (!userData) {
            console.log(`❌ Student ${TARGET_STUDENT_REPO} not found in database`);
            return;
        }
        
        console.log(`✅ Found user in database`);
        
        // Collect all tasks with issue numbers from database
        const dbTasks = [];
        
        // Completed tasks
        const completed = userData.user_data?.completed || {};
        Object.keys(completed).forEach(questId => {
            const questData = completed[questId];
            if (typeof questData === 'object' && questData !== null) {
                Object.keys(questData).forEach(taskId => {
                    const taskData = questData[taskId];
                    if (taskData && typeof taskData === 'object' && taskData.issueNum) {
                        dbTasks.push({
                            quest: questId,
                            task: taskId,
                            issueNum: taskData.issueNum,
                            completed: taskData.completed,
                            status: 'COMPLETED',
                            timeEnd: taskData.timeEnd
                        });
                    }
                });
            }
        });
        
        // Accepted tasks (currently working on)
        const accepted = userData.user_data?.accepted || {};
        Object.keys(accepted).forEach(questId => {
            const questData = accepted[questId];
            if (typeof questData === 'object' && questData !== null) {
                Object.keys(questData).forEach(taskId => {
                    const taskData = questData[taskId];
                    if (taskData && typeof taskData === 'object' && taskData.issueNum) {
                        dbTasks.push({
                            quest: questId,
                            task: taskId,
                            issueNum: taskData.issueNum,
                            completed: taskData.completed,
                            status: taskData.completed ? 'COMPLETED' : 'IN_PROGRESS',
                            timeEnd: taskData.timeEnd
                        });
                    }
                });
            }
        });
        
        // Sort by issue number
        dbTasks.sort((a, b) => a.issueNum - b.issueNum);
        
        console.log(`\n📊 DATABASE TASKS (${dbTasks.length} total):`);
        console.log(`=====================================`);
        
        const completedTasks = dbTasks.filter(task => task.status === 'COMPLETED');
        const inProgressTasks = dbTasks.filter(task => task.status === 'IN_PROGRESS');
        
        console.log(`✅ Completed tasks: ${completedTasks.length}`);
        console.log(`🔄 In progress tasks: ${inProgressTasks.length}`);
        
        console.log(`\n📋 DETAILED BREAKDOWN:`);
        console.log(`=====================================`);
        
        // Group by quest
        const tasksByQuest = {};
        dbTasks.forEach(task => {
            if (!tasksByQuest[task.quest]) {
                tasksByQuest[task.quest] = [];
            }
            tasksByQuest[task.quest].push(task);
        });
        
        Object.keys(tasksByQuest).sort().forEach(questId => {
            const questTasks = tasksByQuest[questId];
            const completedCount = questTasks.filter(t => t.status === 'COMPLETED').length;
            const totalCount = questTasks.length;
            
            console.log(`\n${questId}: ${completedCount}/${totalCount} completed`);
            questTasks.forEach(task => {
                const statusIcon = task.status === 'COMPLETED' ? '✅' : '🔄';
                const timeInfo = task.timeEnd ? ` (${new Date(task.timeEnd).toLocaleString()})` : '';
                console.log(`   ${statusIcon} ${task.task} - Issue #${task.issueNum}${timeInfo}`);
            });
        });
        
        // Check for potential sync issues
        console.log(`\n🔍 SYNC ANALYSIS:`);
        console.log(`=====================================`);
        
        // Check for gaps in issue numbers
        const issueNumbers = dbTasks.map(task => task.issueNum).sort((a, b) => a - b);
        const gaps = [];
        for (let i = 1; i < issueNumbers.length; i++) {
            if (issueNumbers[i] - issueNumbers[i-1] > 1) {
                gaps.push({
                    from: issueNumbers[i-1],
                    to: issueNumbers[i],
                    missing: issueNumbers[i] - issueNumbers[i-1] - 1
                });
            }
        }
        
        if (gaps.length > 0) {
            console.log(`⚠️ Found gaps in issue numbers:`);
            gaps.forEach(gap => {
                console.log(`   Gap between #${gap.from} and #${gap.to} (${gap.missing} missing)`);
            });
        } else {
            console.log(`✅ No gaps found in issue numbers`);
        }
        
        // Check for duplicate issue numbers
        const issueCounts = {};
        issueNumbers.forEach(num => {
            issueCounts[num] = (issueCounts[num] || 0) + 1;
        });
        
        const duplicates = Object.entries(issueCounts).filter(([num, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log(`⚠️ Found duplicate issue numbers:`);
            duplicates.forEach(([num, count]) => {
                console.log(`   Issue #${num} appears ${count} times`);
            });
        } else {
            console.log(`✅ No duplicate issue numbers found`);
        }
        
        // Summary
        console.log(`\n📈 SYNC SUMMARY:`);
        console.log(`=====================================`);
        console.log(`Total tasks tracked: ${dbTasks.length}`);
        console.log(`Completed tasks: ${completedTasks.length}`);
        console.log(`In progress tasks: ${inProgressTasks.length}`);
        console.log(`Issue number range: #${Math.min(...issueNumbers)} - #${Math.max(...issueNumbers)}`);
        console.log(`Database sync status: ${gaps.length === 0 && duplicates.length === 0 ? '✅ SYNCED' : '⚠️ NEEDS REVIEW'}`);
        
        // Expected GitHub closed issues
        console.log(`\n🔗 EXPECTED GITHUB CLOSED ISSUES:`);
        console.log(`=====================================`);
        console.log(`Based on database, these issues should be CLOSED on GitHub:`);
        completedTasks.forEach(task => {
            console.log(`   Issue #${task.issueNum}: ${task.quest}.${task.task} (${new Date(task.timeEnd).toLocaleString()})`);
        });
        
        console.log(`\n🔗 EXPECTED GITHUB OPEN ISSUES:`);
        console.log(`=====================================`);
        console.log(`Based on database, these issues should be OPEN on GitHub:`);
        inProgressTasks.forEach(task => {
            console.log(`   Issue #${task.issueNum}: ${task.quest}.${task.task}`);
        });
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Checking database sync for 8-Nate...`);
checkDatabaseSync().catch(console.error);
