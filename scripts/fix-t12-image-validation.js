const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target test class ID
const TARGET_TEST_CLASS_ID = '68bb9a7573acd40854c54ec5-test';

async function fixT12ImageValidation() {
    console.log(`🔧 Fixing T12 to accept images for test class: ${TARGET_TEST_CLASS_ID}`);
    
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
            
            // Update T12 specifically
            if (questBlock.T12) {
                const task = questBlock.T12;
                console.log(`🔧 Updating ${questKey}.T12 from ${task.type} to llm-text-validation`);
                
                // Change task type to llm-text-validation
                task.type = 'llm-text-validation';
                
                // Add proper LLM validation configuration for images
                task.llmTextValidation = {
                    question: "The student should provide a screenshot of the issue tracker showing closed issues. Accept ANY format that contains an image - this includes Markdown ![Image](url), HTML img tags, direct image URLs, GitHub attachments, or any other image format. The key is that there must be an image present.",
                    validationParameters: [
                        "Accept ANY image format (Markdown, HTML, direct URLs, GitHub attachments, etc.)",
                        "Must contain an image reference or URL",
                        "Be very lenient - accept any reasonable image submission",
                        "Focus on presence of image, not specific format",
                        "Image should show issue tracker or closed issues"
                    ],
                    temperature: 0.1,
                    enableDetailedFeedback: true
                };
                
                updatedCount++;
                console.log(`✅ Updated ${questKey}.T12 to llm-text-validation with image validation parameters`);
            }
        }
        
        if (updatedCount === 0) {
            console.log('⚠️ No T12 tasks found to update');
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
            console.log(`✅ Successfully updated ${updatedCount} T12 tasks in database`);
            console.log(`📊 Modified ${result.modifiedCount} document(s)`);
            
            // Save updated config to file
            const fs = require('fs');
            const outputFile = `quest_config_${TARGET_TEST_CLASS_ID}_t12_fixed.json`;
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

fixT12ImageValidation();
