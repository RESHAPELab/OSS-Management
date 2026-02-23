const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target student repository
const TARGET_STUDENT_REPO = '8-Nate-cs386-software-engineering';

async function testIssueBasedDetection() {
    console.log(`🔍 Testing issue-based quest/task detection for: ${TARGET_STUDENT_REPO}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Get user data from database
        const userData = await db.collection('user_data').findOne({
            _id: TARGET_STUDENT_REPO
        });
        
        if (!userData) {
            console.log(`❌ Student ${TARGET_STUDENT_REPO} not found in database`);
            return;
        }
        
        console.log(`✅ Found user in database`);
        
        // Simulate the detectQuestAndTaskFromIssue function
        function detectQuestAndTaskFromIssue(user_data, issueNumber) {
            console.log(`\n🔍 Detecting quest/task for issue #${issueNumber}`);
            
            // Search through all accepted and completed quests to find the issue
            const allQuests = { ...user_data.accepted, ...user_data.completed };
            
            for (const [questId, questData] of Object.entries(allQuests)) {
                if (questData && typeof questData === 'object') {
                    for (const [taskId, taskData] of Object.entries(questData)) {
                        if (taskData && typeof taskData === 'object' && taskData.issueNum === issueNumber) {
                            console.log(`✅ Found match: ${questId}.${taskId} for issue #${issueNumber}`);
                            return { quest: questId, task: taskId };
                        }
                    }
                }
            }
            
            console.log(`❌ No quest/task found for issue #${issueNumber}`);
            return null;
        }
        
        // Test detection for various issues
        console.log(`\n🧪 TESTING ISSUE DETECTION:`);
        console.log(`=====================================`);
        
        const testIssues = [1, 15, 23, 30, 35, 37, 50]; // Mix of completed, in-progress, and non-existent
        
        testIssues.forEach(issueNumber => {
            const detected = detectQuestAndTaskFromIssue(userData.user_data, issueNumber);
            if (detected) {
                const taskData = userData.user_data.accepted[detected.quest]?.[detected.task] || 
                                userData.user_data.completed[detected.quest]?.[detected.task];
                const status = taskData?.completed ? 'COMPLETED' : 'IN_PROGRESS';
                const statusIcon = taskData?.completed ? '✅' : '🔄';
                console.log(`   ${statusIcon} Issue #${issueNumber} → ${detected.quest}.${detected.task} (${status})`);
            } else {
                console.log(`   ❓ Issue #${issueNumber} → Not found`);
            }
        });
        
        // Show current vs detected
        console.log(`\n📊 CURRENT vs DETECTED COMPARISON:`);
        console.log(`=====================================`);
        
        const current = userData.user_data.current;
        console.log(`Current quest/task: ${current?.quest || 'None'}.${current?.task || 'None'}`);
        
        // Test with the current task's issue
        if (current && current.task) {
            const currentTaskData = userData.user_data.accepted[current.quest]?.[current.task];
            if (currentTaskData?.issueNum) {
                const detected = detectQuestAndTaskFromIssue(userData.user_data, currentTaskData.issueNum);
                console.log(`Current task issue #${currentTaskData.issueNum} detection: ${detected ? `${detected.quest}.${detected.task}` : 'Not found'}`);
            }
        }
        
        // Show all available issues for reference
        console.log(`\n📋 ALL AVAILABLE ISSUES:`);
        console.log(`=====================================`);
        
        const allQuests = { ...userData.user_data.accepted, ...userData.user_data.completed };
        const allIssues = [];
        
        for (const [questId, questData] of Object.entries(allQuests)) {
            if (questData && typeof questData === 'object') {
                for (const [taskId, taskData] of Object.entries(questData)) {
                    if (taskData && typeof taskData === 'object' && taskData.issueNum) {
                        allIssues.push({
                            quest: questId,
                            task: taskId,
                            issueNum: taskData.issueNum,
                            completed: taskData.completed
                        });
                    }
                }
            }
        }
        
        allIssues.sort((a, b) => a.issueNum - b.issueNum);
        
        allIssues.forEach(issue => {
            const statusIcon = issue.completed ? '✅' : '🔄';
            console.log(`   ${statusIcon} Issue #${issue.issueNum}: ${issue.quest}.${issue.task}`);
        });
        
        console.log(`\n🎯 BENEFITS OF ISSUE-BASED DETECTION:`);
        console.log(`=====================================`);
        console.log(`✅ Users can work on any task in any order`);
        console.log(`✅ No need to follow sequential T1 → T2 → T3 order`);
        console.log(`✅ Bot automatically detects which task user is replying to`);
        console.log(`✅ Works even if user_data.current is out of sync`);
        console.log(`✅ Handles parallel quest work (Q3 and Q4 simultaneously)`);
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Testing issue-based detection for 8-Nate...`);
testIssueBasedDetection().catch(console.error);
