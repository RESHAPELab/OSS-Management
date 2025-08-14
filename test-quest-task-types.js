const axios = require('axios');

// Test function to get task types for a specific quest
async function testGetQuestTaskTypes(questId) {
    try {
        console.log(`\n🔍 Analyzing task types for quest: ${questId}`);
        console.log('='.repeat(60));
        
        const response = await axios.get(`http://localhost:8080/api/quest/${questId}/task-types`);
        
        if (response.data.success) {
            const data = response.data.data;
            
            console.log(`📋 Quest Details:`);
            console.log(`   Title: ${data.questTitle}`);
            console.log(`   Total Tasks: ${data.totalTasks}`);
            console.log(`   Overall Type: ${data.questType.toUpperCase()}`);
            
            console.log(`\n📊 Task Type Breakdown:`);
            Object.entries(data.typeCounts).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} task(s)`);
            });
            
            console.log(`\n📝 Individual Tasks:`);
            data.taskTypes.forEach((task, index) => {
                console.log(`   ${index + 1}. ${task.taskTitle}`);
                console.log(`      Type: ${task.type || 'unknown'}`);
                console.log(`      Answer Type: ${task.answerType || 'unknown'}`);
                if (task.ossRepository) {
                    console.log(`      Repository: ${task.ossRepository}`);
                }
                console.log('');
            });
            
            // Return data for programmatic use
            return data;
            
        } else {
            console.error(`❌ Error: ${response.data.message}`);
            return null;
        }
        
    } catch (error) {
        console.error(`❌ Request failed:`, error.message);
        if (error.response?.data) {
            console.error(`   Server response:`, error.response.data);
        }
        return null;
    }
}

// Function to determine if quest would work with bot
function analyzeQuestCompatibility(questData) {
    if (!questData) return;
    
    console.log(`\n🤖 Bot Compatibility Analysis:`);
    console.log('='.repeat(60));
    
    const metricTypes = ['get-issue-count', 'get-pr-count', 'get-open-issue', 'get-top-contributor', 'get-issue-title'];
    const hasMetricTasks = questData.taskTypes.some(task => metricTypes.includes(task.type));
    const hasMissingRepo = questData.taskTypes.some(task => 
        metricTypes.includes(task.type) && !task.ossRepository
    );
    
    if (hasMetricTasks) {
        console.log(`✅ Quest contains metric tasks that require bot validation`);
        
        if (hasMissingRepo) {
            console.log(`⚠️  WARNING: Some metric tasks are missing ossRepository field`);
            console.log(`   These tasks will not work properly with the bot`);
        } else {
            console.log(`✅ All metric tasks have ossRepository specified`);
            console.log(`✅ Quest should work with the bot after recent fixes`);
        }
    } else {
        console.log(`ℹ️  Quest contains no metric tasks - bot validation not required`);
    }
    
    // Check for mixed types
    if (questData.questType === 'mixed') {
        console.log(`ℹ️  Mixed quest type detected - ensure proper button labeling in frontend`);
    }
}

// Test with the specific quest ID
async function main() {
    const questId = '687e5ff3c9dc7339577cdda0';
    
    console.log(`🚀 Testing Quest Task Type Analysis`);
    console.log(`📍 Quest ID: ${questId}`);
    
    const questData = await testGetQuestTaskTypes(questId);
    analyzeQuestCompatibility(questData);
}

// Export functions for use in other files
module.exports = {
    testGetQuestTaskTypes,
    analyzeQuestCompatibility
};

// Run test if called directly
if (require.main === module) {
    main().catch(console.error);
} 