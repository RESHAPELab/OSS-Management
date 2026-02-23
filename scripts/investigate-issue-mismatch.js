const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target student repository
const TARGET_STUDENT_REPO = '8-Nate-cs386-software-engineering';

async function investigateIssueMismatch() {
    console.log(`🔍 Investigating issue number mismatch for: ${TARGET_STUDENT_REPO}`);
    
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
        
        // Focus on Q3 tasks specifically
        console.log(`\n🔍 Q3 TASK ANALYSIS:`);
        console.log(`=====================================`);
        
        const accepted = userData.user_data?.accepted || {};
        const q3Tasks = accepted['Q3'] || {};
        
        console.log(`Q3 tasks in database:`);
        Object.keys(q3Tasks).sort().forEach(taskId => {
            const taskData = q3Tasks[taskId];
            if (taskData && typeof taskData === 'object') {
                const statusIcon = taskData.completed ? '✅' : '🔄';
                const timeInfo = taskData.timeEnd ? ` (${new Date(taskData.timeEnd).toLocaleString()})` : '';
                console.log(`   ${statusIcon} ${taskId} - Issue #${taskData.issueNum}${timeInfo}`);
            }
        });
        
        // Check for T13 specifically
        console.log(`\n🔍 T13 SPECIFIC ANALYSIS:`);
        console.log(`=====================================`);
        
        const t13Data = q3Tasks['T13'];
        if (t13Data) {
            console.log(`Database shows T13 as:`);
            console.log(`   Issue #: ${t13Data.issueNum}`);
            console.log(`   Completed: ${t13Data.completed}`);
            console.log(`   Time Start: ${t13Data.timeStart ? new Date(t13Data.timeStart).toISOString() : 'Not set'}`);
            console.log(`   Time End: ${t13Data.timeEnd ? new Date(t13Data.timeEnd).toISOString() : 'Not set'}`);
            console.log(`   Attempts: ${t13Data.attempts || 0}`);
            console.log(`   Hints: ${t13Data.hints || 0}`);
        } else {
            console.log(`❌ T13 not found in database`);
        }
        
        // Check all Q3 issue numbers
        console.log(`\n🔍 Q3 ISSUE NUMBER SEQUENCE:`);
        console.log(`=====================================`);
        
        const q3IssueNumbers = [];
        Object.keys(q3Tasks).forEach(taskId => {
            const taskData = q3Tasks[taskId];
            if (taskData && typeof taskData === 'object' && taskData.issueNum) {
                q3IssueNumbers.push({
                    task: taskId,
                    issueNum: taskData.issueNum,
                    completed: taskData.completed
                });
            }
        });
        
        q3IssueNumbers.sort((a, b) => a.issueNum - b.issueNum);
        
        console.log(`Q3 issue number sequence:`);
        q3IssueNumbers.forEach(item => {
            const statusIcon = item.completed ? '✅' : '🔄';
            console.log(`   ${statusIcon} ${item.task} - Issue #${item.issueNum}`);
        });
        
        // Check for gaps in Q3 sequence
        console.log(`\n🔍 Q3 GAP ANALYSIS:`);
        console.log(`=====================================`);
        
        const q3Numbers = q3IssueNumbers.map(item => item.issueNum);
        const gaps = [];
        for (let i = 1; i < q3Numbers.length; i++) {
            if (q3Numbers[i] - q3Numbers[i-1] > 1) {
                gaps.push({
                    from: q3Numbers[i-1],
                    to: q3Numbers[i],
                    missing: q3Numbers[i] - q3Numbers[i-1] - 1
                });
            }
        }
        
        if (gaps.length > 0) {
            console.log(`⚠️ Found gaps in Q3 issue numbers:`);
            gaps.forEach(gap => {
                console.log(`   Gap between #${gap.from} and #${gap.to} (${gap.missing} missing)`);
                console.log(`   Missing issue numbers: ${Array.from({length: gap.missing}, (_, i) => gap.from + i + 1).join(', ')}`);
            });
        } else {
            console.log(`✅ No gaps found in Q3 issue numbers`);
        }
        
        // Check if T13 is in the wrong position
        console.log(`\n🔍 T13 POSITION ANALYSIS:`);
        console.log(`=====================================`);
        
        const t13IssueNum = t13Data?.issueNum;
        if (t13IssueNum) {
            console.log(`T13 is stored as Issue #${t13IssueNum}`);
            console.log(`But GitHub shows T13 as Issue #35`);
            console.log(`This suggests a mismatch between database and GitHub`);
            
            // Check if there are other tasks with issue numbers around 35
            const tasksAround35 = q3IssueNumbers.filter(item => 
                Math.abs(item.issueNum - 35) <= 2
            );
            
            console.log(`\nTasks with issue numbers near #35:`);
            tasksAround35.forEach(item => {
                const statusIcon = item.completed ? '✅' : '🔄';
                console.log(`   ${statusIcon} ${item.task} - Issue #${item.issueNum}`);
            });
        }
        
        // Summary
        console.log(`\n📈 MISMATCH SUMMARY:`);
        console.log(`=====================================`);
        console.log(`Database shows T13 as Issue #${t13Data?.issueNum || 'Not found'}`);
        console.log(`GitHub shows T13 as Issue #35`);
        console.log(`Status: ${t13Data?.completed ? 'COMPLETED' : 'IN_PROGRESS'}`);
        console.log(`Mismatch detected: ${t13Data?.issueNum !== 35 ? 'YES' : 'NO'}`);
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Investigating issue mismatch for 8-Nate...`);
investigateIssueMismatch().catch(console.error);
