const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// New quest config ID after migration
const QUEST_CONFIG_ID = '68a770b8140b9c0174c13ce8';

async function checkQ2T1Completion() {
    console.log(`🔍 Checking Q2T1 completion for quest config: ${QUEST_CONFIG_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Find all students with the new quest config
        const students = await db.collection('user_data').find({
            'user_data.customGroupId': QUEST_CONFIG_ID
        }).toArray();
        
        console.log(`✅ Found ${students.length} students in the class`);
        
        // Analyze each student's progress
        console.log(`\n📊 Q2T1 COMPLETION STATUS:`);
        console.log(`=====================================`);
        
        let completedQ2T1 = [];
        let workingOnQ2 = [];
        let completedQ1NotStartedQ2 = [];
        let stillOnQ1 = [];
        let otherStatus = [];
        
        for (const student of students) {
            const username = student._id;
            const userData = student.user_data || {};
            const completed = userData.completed || {};
            const accepted = userData.accepted || {};
            const current = userData.current || {};
            
            // Extract repo name (remove class suffix if present)
            const repoName = username.includes('-') ? username.split('-').slice(0, -1).join('-') : username;
            
            // Check Q2T1 completion status
            let status = '';
            let category = '';
            
            // Check if Q2T1 is completed
            if (completed.Q2 && completed.Q2.T1) {
                status = '✅ Completed Q2T1';
                category = 'completed_q2t1';
                completedQ2T1.push({
                    username,
                    repoName,
                    status,
                    points: userData.points || 0,
                    xp: userData.xp || 0,
                    completion: userData.completion || 0
                });
            }
            // Check if working on Q2 (accepted or current quest is Q2)
            else if (accepted.Q2 || current.quest === 'Q2') {
                status = `🔄 Working on Q2 (Current: ${current.quest || 'None'} → ${current.task || 'None'})`;
                category = 'working_on_q2';
                workingOnQ2.push({
                    username,
                    repoName,
                    status,
                    currentTask: current.task || 'None',
                    points: userData.points || 0,
                    xp: userData.xp || 0
                });
            }
            // Check if completed Q1 but not started Q2
            else if (completed.Q1 && !accepted.Q2 && current.quest !== 'Q2') {
                status = '🎯 Completed Q1, Ready for Q2';
                category = 'ready_for_q2';
                completedQ1NotStartedQ2.push({
                    username,
                    repoName,
                    status,
                    points: userData.points || 0,
                    xp: userData.xp || 0
                });
            }
            // Check if still working on Q1
            else if (accepted.Q1 || current.quest === 'Q1') {
                status = `🔄 Working on Q1 (Task: ${current.task || 'None'})`;
                category = 'working_on_q1';
                stillOnQ1.push({
                    username,
                    repoName,
                    status,
                    currentTask: current.task || 'None',
                    points: userData.points || 0
                });
            }
            // Other status
            else {
                status = '❓ No quest started or unclear status';
                category = 'other';
                otherStatus.push({
                    username,
                    repoName,
                    status,
                    points: userData.points || 0
                });
            }
        }
        
        // Display results by category
        console.log(`\n✅ COMPLETED Q2T1 (${completedQ2T1.length} students):`);
        console.log(`=====================================`);
        if (completedQ2T1.length > 0) {
            completedQ2T1.forEach(student => {
                console.log(`👤 ${student.username}`);
                console.log(`   📁 Repo: ${student.repoName}`);
                console.log(`   🎯 Status: ${student.status}`);
                console.log(`   💰 Points: ${student.points} | XP: ${student.xp} | Completion: ${student.completion}%\n`);
            });
        } else {
            console.log(`ℹ️ No students have completed Q2T1 yet`);
        }
        
        console.log(`\n🔄 WORKING ON Q2 (${workingOnQ2.length} students):`);
        console.log(`=====================================`);
        workingOnQ2.forEach(student => {
            console.log(`👤 ${student.username} - ${student.status}`);
        });
        
        console.log(`\n🎯 READY FOR Q2 (${completedQ1NotStartedQ2.length} students):`);
        console.log(`=====================================`);
        completedQ1NotStartedQ2.forEach(student => {
            console.log(`👤 ${student.username} - ${student.status}`);
        });
        
        console.log(`\n🔄 WORKING ON Q1 (${stillOnQ1.length} students):`);
        console.log(`=====================================`);
        stillOnQ1.forEach(student => {
            console.log(`👤 ${student.username} - ${student.status}`);
        });
        
        if (otherStatus.length > 0) {
            console.log(`\n❓ OTHER STATUS (${otherStatus.length} students):`);
            console.log(`=====================================`);
            otherStatus.forEach(student => {
                console.log(`👤 ${student.username} - ${student.status}`);
            });
        }
        
        // Summary
        console.log(`\n📊 SUMMARY:`);
        console.log(`=====================================`);
        console.log(`Total Students: ${students.length}`);
        console.log(`✅ Completed Q2T1: ${completedQ2T1.length}`);
        console.log(`🔄 Working on Q2: ${workingOnQ2.length}`);
        console.log(`🎯 Ready for Q2: ${completedQ1NotStartedQ2.length}`);
        console.log(`🔄 Working on Q1: ${stillOnQ1.length}`);
        console.log(`❓ Other: ${otherStatus.length}`);
        
        const q2EngagementRate = ((completedQ2T1.length + workingOnQ2.length) / students.length * 100).toFixed(1);
        console.log(`📈 Q2 Engagement Rate: ${q2EngagementRate}%`);
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Checking Q2T1 completion status...`);
checkQ2T1Completion();


