const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target class ID
const TARGET_CLASS_ID = '68af5d5889ab74b26644347d';

async function getClassProgress() {
    console.log(`🔍 Getting progress for class ID: ${TARGET_CLASS_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Find students with this customGroupId
        const students = await db.collection('user_data').find({
            'user_data.customGroupId': TARGET_CLASS_ID
        }).toArray();
        
        console.log(`✅ Found ${students.length} students in class ${TARGET_CLASS_ID}`);
        
        // Show each student's progress
        console.log(`\n📊 CLASS STUDENT PROGRESS:`);
        console.log(`=====================================`);
        
        for (const student of students) {
            const username = student._id;
            const userData = student.user_data || {};
            const completed = userData.completed || {};
            const accepted = userData.accepted || {};
            const current = userData.current || {};
            const customGroupId = userData.customGroupId || 'None';
            const points = userData.points || 0;
            const xp = userData.xp || 0;
            const completion = userData.completion || 0;
            
            // Extract repo name (remove class suffix if present)
            const repoName = username.includes('-') ? username.split('-').slice(0, -1).join('-') : username;
            
            // Determine status
            const completedQuests = Object.keys(completed);
            const acceptedQuests = Object.keys(accepted);
            const currentQuest = current.quest || 'None';
            const currentTask = current.task || 'None';
            
            let status = '';
            if (completedQuests.includes('Q1')) {
                status = '✅ Completed Q1';
            } else if (acceptedQuests.includes('Q1') || currentQuest === 'Q1') {
                status = '🔄 Working on Q1';
            } else if (currentQuest && currentQuest !== 'None') {
                status = `🔄 Working on ${currentQuest}`;
            } else {
                status = '❓ No quest started';
            }
            
            console.log(`\n👤 ${username}`);
            console.log(`   📁 Repo: ${repoName}`);
            console.log(`   🔗 CustomGroupId: ${customGroupId}`);
            console.log(`   🎯 Status: ${status}`);
            console.log(`   💰 Points: ${points} | XP: ${xp} | Completion: ${completion}%`);
            console.log(`   ✅ Completed: ${completedQuests.length > 0 ? completedQuests.join(', ') : 'None'}`);
            console.log(`   🔓 Accepted: ${acceptedQuests.length > 0 ? acceptedQuests.join(', ') : 'None'}`);
            console.log(`   🎯 Current: ${currentQuest} → ${currentTask}`);
            
            // Show detailed completed quest info
            if (completedQuests.length > 0) {
                console.log(`   📋 Completion Details:`);
                completedQuests.forEach(questId => {
                    const questData = completed[questId];
                    if (questData) {
                        console.log(`      ${questId}: ${questData.title || 'No title'} (${questData.points || 0} points, ${questData.xp || 0} XP)`);
                    }
                });
            }
        }
        
        // Summary
        console.log(`\n📊 CLASS SUMMARY:`);
        console.log(`=====================================`);
        console.log(`Total Students: ${students.length}`);
        
        const completedQ1 = students.filter(s => Object.keys(s.user_data?.completed || {}).includes('Q1')).length;
        const onQ1 = students.filter(s => s.user_data?.current?.quest === 'Q1' || s.user_data?.accepted?.['Q1']).length;
        const otherStatus = students.length - completedQ1 - onQ1;
        
        console.log(`✅ Completed Q1: ${completedQ1}`);
        console.log(`🔄 Working on Q1: ${onQ1}`);
        console.log(`❓ Other status: ${otherStatus}`);
        
        // Quest deployment readiness
        if (completedQ1 > 0) {
            console.log(`\n🚀 QUEST DEPLOYMENT READINESS:`);
            console.log(`=====================================`);
            console.log(`When you deploy Q2:`);
            console.log(`• ${completedQ1} students will get Q2 auto-unlocked immediately`);
            console.log(`• ${onQ1 + otherStatus} students will continue their current quests`);
            console.log(`• All students will get the new quest configuration`);
        }
        
        // Show students eligible for Q2 unlock
        if (completedQ1 > 0) {
            console.log(`\n🎯 STUDENTS ELIGIBLE FOR Q2 UNLOCK:`);
            console.log(`=====================================`);
            students.forEach(student => {
                const userData = student.user_data || {};
                const hasCompletedQ1 = Object.keys(userData.completed || {}).includes('Q1');
                const hasQ2 = Object.keys(userData.completed || {}).includes('Q2') || Object.keys(userData.accepted || {}).includes('Q2');
                const hasCurrentQuest = userData.current && userData.current.quest;
                
                if (hasCompletedQ1 && !hasQ2 && !hasCurrentQuest) {
                    console.log(`• ${student._id} - Ready for Q2 unlock`);
                }
            });
        }
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
    }
}

console.log(`🚀 Getting class progress for ID: ${TARGET_CLASS_ID}`);
getClassProgress();
