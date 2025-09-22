const fs = require('fs');
const path = require('path');

/**
 * Fix quiz tasks by updating their accept field to include the questions
 * This script processes all generated quest configuration files and updates
 * quiz tasks to include questions in the accept field
 */

function fixQuizQuestions(config) {
    let updated = false;
    
    // Process each quest in the configuration
    for (const [questId, questData] of Object.entries(config)) {
        if (questId === 'map_repo_link') continue;
        
        // Process each task in the quest
        for (const [taskId, taskData] of Object.entries(questData)) {
            if (taskId === 'metadata') continue;
            
            // Check if this is a quiz task
            if (taskData.type === 'quiz' && taskData.questions && Array.isArray(taskData.questions)) {
                console.log(`🔧 Fixing quiz task ${questId}.${taskId}...`);
                
                // Build the quiz content
                let quizContent = taskData.accept || '';
                
                // Add instructions for quiz format if not already present
                if (!quizContent.includes('format [a,b,c,d,e]')) {
                    quizContent += `\n\n**Instructions:** Answer all questions and submit your answers in the format [a,b,c,d,e] where each letter corresponds to your answer for each question.\n\n**Example:** If you think the answers are A, C, B, D, E, type: [a,c,b,d,e]\n\n`;
                }
                
                // Add each question
                taskData.questions.forEach((question, index) => {
                    if (question.question) {
                        quizContent += `**Question ${index + 1}:** ${question.question}\n\n`;
                        if (question.optionA) quizContent += `A) ${question.optionA}\n`;
                        if (question.optionB) quizContent += `B) ${question.optionB}\n`;
                        if (question.optionC) quizContent += `C) ${question.optionC}\n`;
                        if (question.optionD) quizContent += `D) ${question.optionD}\n`;
                        quizContent += `\n`;
                    }
                });
                
                // Add submission instructions if not already present
                if (!quizContent.includes('Submit your answers')) {
                    quizContent += `Submit your answers in the format [a,b,c,d,e] where each letter is your answer choice.`;
                }
                
                // Update the accept field
                taskData.accept = quizContent;
                updated = true;
                
                console.log(`✅ Fixed quiz task ${questId}.${taskId}`);
            }
        }
    }
    
    return updated;
}

function processGeneratedConfigs() {
    const generatedDir = path.join(__dirname, '../OSS-Doorway/src/config/generated');
    
    if (!fs.existsSync(generatedDir)) {
        console.log('❌ Generated config directory not found');
        return;
    }
    
    const files = fs.readdirSync(generatedDir).filter(file => file.endsWith('.json'));
    console.log(`📁 Found ${files.length} generated config files`);
    
    let totalFixed = 0;
    
    for (const file of files) {
        const filePath = path.join(generatedDir, file);
        console.log(`\n📄 Processing ${file}...`);
        
        try {
            const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const wasUpdated = fixQuizQuestions(config);
            
            if (wasUpdated) {
                // Create backup
                const backupPath = filePath + '.backup.' + new Date().toISOString().replace(/[:.]/g, '-');
                fs.writeFileSync(backupPath, JSON.stringify(config, null, 2));
                console.log(`💾 Created backup: ${path.basename(backupPath)}`);
                
                // Write updated config
                fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
                console.log(`✅ Updated ${file}`);
                totalFixed++;
            } else {
                console.log(`ℹ️  No quiz tasks found in ${file}`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
        }
    }
    
    console.log(`\n🎉 Fixed ${totalFixed} config files`);
}

// Also fix the default quest configuration files
function processDefaultConfigs() {
    const configDir = path.join(__dirname, '../OSS-Doorway/src/config');
    
    const defaultFiles = [
        'quest-sequence.json',
        'reshape2.json'
    ];
    
    console.log('\n📁 Processing default config files...');
    
    for (const file of defaultFiles) {
        const filePath = path.join(configDir, file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  ${file} not found, skipping`);
            continue;
        }
        
        console.log(`\n📄 Processing ${file}...`);
        
        try {
            const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const wasUpdated = fixQuizQuestions(config);
            
            if (wasUpdated) {
                // Create backup
                const backupPath = filePath + '.backup.' + new Date().toISOString().replace(/[:.]/g, '-');
                fs.writeFileSync(backupPath, JSON.stringify(config, null, 2));
                console.log(`💾 Created backup: ${path.basename(backupPath)}`);
                
                // Write updated config
                fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
                console.log(`✅ Updated ${file}`);
            } else {
                console.log(`ℹ️  No quiz tasks found in ${file}`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
        }
    }
}

// Run the fix
console.log('🔧 Starting quiz questions fix...\n');

processGeneratedConfigs();
processDefaultConfigs();

console.log('\n🎉 Quiz questions fix completed!');
console.log('\n📝 Next steps:');
console.log('1. Restart the bot server to load the updated configurations');
console.log('2. Test a quiz task to verify questions are now displayed');
console.log('3. If needed, manually update any remaining quiz tasks'); 