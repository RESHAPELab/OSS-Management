const fs = require('fs');
const path = require('path');

function displayMarcogerosaTestConfig() {
    console.log('🎯 Quest Configuration for marcogerosa (68accc656847fdb7c19b1f0a-test)');
    console.log('=' .repeat(70));
    
    try {
        // Read the quest configuration file
        const configPath = path.join(__dirname, '../quest_config_68accc656847fdb7c19b1f0a-test.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        console.log(`📋 Config ID: ${config.configId}`);
        console.log(`📋 Class ID: ${config.classId}`);
        console.log(`🗺️ Map Repo Link: ${config.config.map_repo_link}`);
        console.log('');
        
        // Display quest information
        Object.keys(config.config).forEach(questKey => {
            if (questKey === 'map_repo_link') return;
            
            const quest = config.config[questKey];
            console.log(`📚 QUEST ${questKey}: ${quest.metadata?.title || questKey}`);
            console.log('=' .repeat(60));
            
            if (quest.metadata) {
                console.log(`📖 Description: ${quest.metadata.description || 'N/A'}`);
                console.log(`📝 Type: ${quest.metadata.type || 'N/A'}`);
                console.log(`🔢 Sequence: ${quest.metadata.sequenceNumber || 'N/A'}`);
                console.log('');
            }
            
            // Display tasks
            Object.keys(quest).forEach(taskKey => {
                if (taskKey === 'metadata') return;
                
                const task = quest[taskKey];
                console.log(`🎯 ${taskKey}: ${task.title || task.taskTitle || 'No title'}`);
                console.log(`   Points: ${task.points}, XP: ${task.xp}`);
                console.log(`   Type: ${task.type}`);
                
                if (task.type === 'llm-text-validation') {
                    console.log(`   Question: ${task.accept.substring(0, 100)}...`);
                    if (task.llmTextValidation?.question) {
                        console.log(`   Validation: ${task.llmTextValidation.question.substring(0, 80)}...`);
                    }
                    console.log(`   Temperature: ${task.llmTextValidation?.temperature || 'N/A'}`);
                    console.log(`   Detailed Feedback: ${task.llmTextValidation?.enableDetailedFeedback || false}`);
                } else if (task.type === 'multiple-choice') {
                    console.log(`   Question: ${task.question}`);
                    console.log(`   Correct Answer: ${task.correctAnswer}`);
                    if (task.options && task.options.length > 0) {
                        console.log(`   Options: ${task.options.length} options available`);
                    }
                } else if (task.type === 'collect-info') {
                    console.log(`   Question: ${task.accept.substring(0, 100)}...`);
                    console.log(`   Save Data: ${task.saveValidatedData ? 'Yes' : 'No'}`);
                    if (task.saveValidatedData) {
                        console.log(`   Data Name: ${task.savedDataName}`);
                    }
                }
                
                if (task.detailedHints && task.detailedHints.length > 0) {
                    console.log(`   Hints: ${task.detailedHints.length} hint(s) available`);
                }
                
                console.log('');
            });
            
            console.log(`📊 Total tasks in ${questKey}: ${Object.keys(quest).filter(key => key !== 'metadata').length}`);
            console.log('');
        });
        
        console.log('✅ Quest configuration loaded successfully!');
        
    } catch (error) {
        console.error('❌ Error reading quest configuration:', error.message);
    }
}

displayMarcogerosaTestConfig();
