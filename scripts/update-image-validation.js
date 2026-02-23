const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function updateImageValidation() {
    console.log(`🔧 Updating image validation for test student quest config`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Find the quest config
        const questConfig = await db.collection('questconfigs').findOne({
            configId: '68accc656847fdb7c19b1f0a-test'
        });
        
        if (!questConfig) {
            console.log('❌ Quest config not found');
            return;
        }
        
        console.log('✅ Found quest config:', questConfig._id);
        
        // Update T4 validation parameters
        const updatedConfig = { ...questConfig };
        
        // Update T4
        if (updatedConfig.config.TEMP_1756847144814.T4) {
            updatedConfig.config.TEMP_1756847144814.T4.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T4 validation parameters');
        }
        
        // Update T5
        if (updatedConfig.config.TEMP_1756847144814.T5) {
            updatedConfig.config.TEMP_1756847144814.T5.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T5 validation parameters');
        }
        
        // Update T6
        if (updatedConfig.config.TEMP_1756847144814.T6) {
            updatedConfig.config.TEMP_1756847144814.T6.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T6 validation parameters');
        }
        
        // Update T7
        if (updatedConfig.config.TEMP_1756847144814.T7) {
            updatedConfig.config.TEMP_1756847144814.T7.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T7 validation parameters');
        }
        
        // Update T8
        if (updatedConfig.config.TEMP_1756847144814.T8) {
            updatedConfig.config.TEMP_1756847144814.T8.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T8 validation parameters');
        }
        
        // Update T9
        if (updatedConfig.config.TEMP_1756847144814.T9) {
            updatedConfig.config.TEMP_1756847144814.T9.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T9 validation parameters');
        }
        
        // Update T10
        if (updatedConfig.config.TEMP_1756847144814.T10) {
            updatedConfig.config.TEMP_1756847144814.T10.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T10 validation parameters');
        }
        
        // Update T11
        if (updatedConfig.config.TEMP_1756847144814.T11) {
            updatedConfig.config.TEMP_1756847144814.T11.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T11 validation parameters');
        }
        
        // Update T12
        if (updatedConfig.config.TEMP_1756847144814.T12) {
            updatedConfig.config.TEMP_1756847144814.T12.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T12 validation parameters');
        }
        
        // Update T13
        if (updatedConfig.config.TEMP_1756847144814.T13) {
            updatedConfig.config.TEMP_1756847144814.T13.llmTextValidation = {
                "question": "The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.",
                "validationParameters": [
                    "Must contain image URL in ![Image](url) format",
                    "Must include valid URL link"
                ],
                "temperature": 0.1,
                "enableDetailedFeedback": true
            };
            console.log('✅ Updated T13 validation parameters');
        }
        
        // Update the database
        const result = await db.collection('questconfigs').updateOne(
            { _id: questConfig._id },
            { $set: { config: updatedConfig.config, updatedAt: new Date() } }
        );
        
        if (result.modifiedCount > 0) {
            console.log('✅ Successfully updated quest config in database');
            
            // Save updated config to file
            const fs = require('fs');
            fs.writeFileSync(
                'quest_config_68accc656847fdb7c19b1f0a-test_updated.json',
                JSON.stringify(updatedConfig, null, 2)
            );
            console.log('💾 Updated quest config saved to: quest_config_68accc656847fdb7c19b1f0a-test_updated.json');
        } else {
            console.log('❌ No changes made to database');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

updateImageValidation();
