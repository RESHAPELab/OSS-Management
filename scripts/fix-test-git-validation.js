const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target test class ID
const TARGET_TEST_CLASS_ID = '68bb9a7573acd40854c54ec5-test';

async function fixTestGitValidation() {
    console.log(`🔧 Fixing git command validation for test class: ${TARGET_TEST_CLASS_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Find the quest config for the test class
        console.log(`🔍 Finding quest config for test class: ${TARGET_TEST_CLASS_ID}`);
        const questConfig = await db.collection('questconfigs').findOne({
            $or: [
                { groupId: TARGET_TEST_CLASS_ID },
                { configId: TARGET_TEST_CLASS_ID },
                { classId: TARGET_TEST_CLASS_ID }
            ]
        });
        
        if (!questConfig) {
            console.log(`❌ No quest config found for test class ${TARGET_TEST_CLASS_ID}`);
            return;
        }
        
        console.log(`✅ Found quest config: ${questConfig._id}`);
        
        // Get the config object
        const config = questConfig.config || questConfig.questConfig || {};
        let updatedCount = 0;
        
        // Find all quest keys (should be TEMP_...)
        const questKeys = Object.keys(config);
        console.log(`📋 Found quest keys: ${questKeys.join(', ')}`);
        
        for (const questKey of questKeys) {
            if (questKey === 'map_repo_link') continue; // Skip non-quest keys
            
            const questBlock = config[questKey];
            if (!questBlock || typeof questBlock !== 'object') continue;
            
            console.log(`🔍 Processing quest: ${questKey}`);
            
            // Update all LLM text validation tasks
            const taskKeys = Object.keys(questBlock);
            for (const taskKey of taskKeys) {
                if (taskKey === 'metadata') continue; // Skip metadata
                
                const task = questBlock[taskKey];
                if (task && task.type === 'llm-text-validation') {
                    console.log(`🔧 Updating ${questKey}.${taskKey} validation parameters`);
                    
                    // Determine validation parameters based on task content
                    let validationConfig;
                    
                    // Check if this is an image task (look for screenshot, image, or visual content)
                    const acceptText = task.accept || '';
                    const isImageTask = acceptText.toLowerCase().includes('screenshot') || 
                                      acceptText.toLowerCase().includes('image') || 
                                      acceptText.toLowerCase().includes('visual') ||
                                      acceptText.toLowerCase().includes('picture');
                    
                    if (isImageTask) {
                        console.log(`📸 Detected image task: ${questKey}.${taskKey}`);
                        validationConfig = {
                            question: "The student should provide an image. Accept ANY format that contains an image - this includes Markdown ![Image](url), HTML img tags, direct image URLs, GitHub attachments, or any other image format. The key is that there must be an image present.",
                            validationParameters: [
                                "Accept ANY image format (Markdown, HTML, direct URLs, GitHub attachments, etc.)",
                                "Must contain an image reference or URL",
                                "Be very lenient - accept any reasonable image submission",
                                "Focus on presence of image, not specific format"
                            ],
                            temperature: 0.1,
                            enableDetailedFeedback: true
                        };
                    } else {
                        console.log(`💻 Detected git/command task: ${questKey}.${taskKey}`);
                        validationConfig = {
                            question: "Validate that the student provided appropriate git commands for the task. Accept typos and variations as long as the intent is clear.",
                            validationParameters: [
                                "Answer must be relevant to git commands",
                                "Accept typos in git commands (e.g., 'chickout' instead of 'checkout')",
                                "Accept different separators or formatting in commands",
                                "Answer must show understanding of git concepts",
                                "Accept variations as long as intent is clear"
                            ],
                            temperature: 0.1,
                            enableDetailedFeedback: true
                        };
                    }
                    
                    task.llmTextValidation = validationConfig;
                    updatedCount++;
                    console.log(`✅ Updated ${questKey}.${taskKey} validation parameters`);
                }
            }
        }
        
        if (updatedCount === 0) {
            console.log('⚠️ No LLM text validation tasks found to update');
            return;
        }
        
        // Update the database
        const result = await db.collection('questconfigs').updateOne(
            { _id: questConfig._id },
            { 
                $set: { 
                    config: config,
                    updatedAt: new Date()
                } 
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`✅ Successfully updated ${updatedCount} tasks in database`);
            console.log(`📊 Modified ${result.modifiedCount} document(s)`);
            
            // Save updated config to file
            const fs = require('fs');
            const outputFile = `quest_config_${TARGET_TEST_CLASS_ID}_fixed.json`;
            fs.writeFileSync(outputFile, JSON.stringify({ ...questConfig, config: config }, null, 2));
            console.log(`💾 Saved updated config to: ${outputFile}`);
        } else {
            console.log('❌ No documents were modified');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('🔌 Database connection closed');
    }
}

fixTestGitValidation();
