const fs = require('fs');
const path = require('path');

function displayMarcogerosaQuestConfig() {
    console.log('🎯 Quest Configuration for marcogerosa-cs386-software-engineering');
    console.log('=' .repeat(60));
    
    try {
        // Read the quest configuration file
        const configPath = path.join(__dirname, '../../OSS-Doorway/src/config/generated/quest_config_68a770b8140b9c0174c13ce7.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        console.log(`📋 Group ID: 68a770b8140b9c0174c13ce7`);
        console.log(`🗺️ Map Repo Link: ${config.map_repo_link}`);
        console.log('');
        
        // Display Q1 information
        const q1 = config.Q1;
        console.log('📚 QUEST Q1: A-0.1 - Intro to the Course');
        console.log('=' .repeat(50));
        
        Object.keys(q1).forEach(taskKey => {
            if (taskKey === 'metadata') {
                console.log(`📖 Metadata: ${q1.metadata.title}`);
                console.log(`📝 Description: ${q1.metadata.description || 'N/A'}`);
                console.log('');
            } else if (taskKey.startsWith('T')) {
                const task = q1[taskKey];
                console.log(`🎯 ${taskKey}: ${task.desc || 'No description'}`);
                console.log(`   Points: ${task.points}, XP: ${task.xp}`);
                console.log(`   Type: ${task.type}`);
                
                if (task.type === 'llm-text-validation') {
                    console.log(`   Question: ${task.accept}`);
                    console.log(`   Validation Parameters: ${task.llmTextValidation.validationParameters.join(', ')}`);
                    console.log(`   Temperature: ${task.llmTextValidation.temperature}`);
                    console.log(`   Detailed Feedback: ${task.llmTextValidation.enableDetailedFeedback}`);
                } else if (task.type === 'multiple-choice') {
                    console.log(`   Question: ${task.question}`);
                    console.log(`   Correct Answer: ${task.answer}`);
                    console.log(`   Options:`);
                    task.options.forEach(opt => {
                        console.log(`     ${opt.label}) ${opt.value}`);
                    });
                }
                
                if (task.detailedHints && task.detailedHints.length > 0) {
                    console.log(`   Hints: ${task.detailedHints.length} hint(s) available`);
                }
                
                console.log('');
            }
        });
        
        console.log('✅ Quest configuration loaded successfully!');
        console.log(`📊 Total tasks in Q1: ${Object.keys(q1).filter(key => key.startsWith('T')).length}`);
        
    } catch (error) {
        console.error('❌ Error reading quest configuration:', error.message);
    }
}

displayMarcogerosaQuestConfig();
