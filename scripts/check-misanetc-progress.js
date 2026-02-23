const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// New quest config ID after migration
const QUEST_CONFIG_ID = '68a770b8140b9c0174c13ce8';

async function checkMisanetcProgress() {
    console.log(`🔍 Checking detailed progress for misanetc user...`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Find misanetc user specifically
        const user = await db.collection('user_data').findOne({
            _id: 'misanetc-cs386-software-engineering'
        });
        
        if (user) {
            console.log(`✅ Found user: misanetc-cs386-software-engineering`);
            
            const userData = user.user_data || {};
            console.log(`\n📊 DETAILED USER DATA:`);
            console.log(`=====================================`);
            console.log(`Custom Group ID: ${userData.customGroupId}`);
            console.log(`Points: ${userData.points || 0}`);
            console.log(`XP: ${userData.xp || 0}`);
            console.log(`Completion: ${userData.completion || 0}%`);
            
            // Current quest/task
            const current = userData.current || {};
            console.log(`\n🎯 CURRENT STATUS:`);
            console.log(`Current Quest: ${current.quest || 'None'}`);
            console.log(`Current Task: ${current.task || 'None'}`);
            
            // Completed quests
            const completed = userData.completed || {};
            console.log(`\n✅ COMPLETED QUESTS:`);
            Object.keys(completed).forEach(questId => {
                const questData = completed[questId];
                console.log(`${questId}:`);
                if (typeof questData === 'object' && questData !== null) {
                    Object.keys(questData).forEach(taskId => {
                        const taskData = questData[taskId];
                        console.log(`   ${taskId}: ${JSON.stringify(taskData)}`);
                    });
                } else {
                    console.log(`   Data: ${JSON.stringify(questData)}`);
                }
            });
            
            // Accepted quests
            const accepted = userData.accepted || {};
            console.log(`\n🔓 ACCEPTED QUESTS:`);
            Object.keys(accepted).forEach(questId => {
                const questData = accepted[questId];
                console.log(`${questId}: ${JSON.stringify(questData)}`);
            });
            
            // Check for Q2T1 specifically
            console.log(`\n🔍 Q2T1 ANALYSIS:`);
            console.log(`=====================================`);
            const hasQ2Completed = !!completed.Q2;
            const hasQ2T1Completed = !!(completed.Q2 && completed.Q2.T1);
            const hasQ2Accepted = !!accepted.Q2;
            const isCurrentlyOnQ2 = current.quest === 'Q2';
            
            console.log(`Q2 in completed: ${hasQ2Completed}`);
            console.log(`Q2T1 in completed: ${hasQ2T1Completed}`);
            console.log(`Q2 in accepted: ${hasQ2Accepted}`);
            console.log(`Currently on Q2: ${isCurrentlyOnQ2}`);
            
            if (hasQ2T1Completed) {
                console.log(`✅ CONFIRMED: Q2T1 is completed in database`);
            } else if (isCurrentlyOnQ2 && current.task && current.task !== 'T1') {
                console.log(`🔄 LIKELY COMPLETED: Currently on Q2 task ${current.task}, suggesting T1 was completed`);
            } else if (hasQ2Accepted) {
                console.log(`🔄 IN PROGRESS: Q2 is accepted, may have completed T1`);
            } else {
                console.log(`❌ NOT FOUND: Q2T1 completion not clearly indicated in database`);
            }
            
        } else {
            console.log(`❌ User not found: misanetc-cs386-software-engineering`);
        }
        
        // Also check for any recent task responses or completions
        console.log(`\n📋 CHECKING TASK RESPONSES:`);
        console.log(`=====================================`);
        
        const taskResponses = await db.collection('taskresponses').find({
            username: 'misanetc-cs386-software-engineering'
        }).sort({ createdAt: -1 }).limit(10).toArray();
        
        console.log(`Found ${taskResponses.length} recent task responses:`);
        taskResponses.forEach((response, index) => {
            console.log(`${index + 1}. Quest: ${response.questId}, Task: ${response.taskId}, Created: ${response.createdAt}`);
        });
        
        // Check user task progress collection
        console.log(`\n📈 CHECKING USER TASK PROGRESS:`);
        console.log(`=====================================`);
        
        const taskProgress = await db.collection('usertaskprogresses').find({
            username: 'misanetc-cs386-software-engineering'
        }).sort({ updatedAt: -1 }).limit(10).toArray();
        
        console.log(`Found ${taskProgress.length} task progress records:`);
        taskProgress.forEach((progress, index) => {
            console.log(`${index + 1}. Quest: ${progress.questId}, Task: ${progress.taskId}, Completed: ${progress.completed}, Updated: ${progress.updatedAt}`);
        });
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Checking misanetc's detailed progress...`);
checkMisanetcProgress();


