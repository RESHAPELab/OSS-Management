const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target class ID (shared by all students)
const TARGET_CLASS_ID = '68a770b8140b9c0174c13ce8';

async function updateT8Hints() {
    console.log(`🔧 Updating T8 hints for class: ${TARGET_CLASS_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Find the quest config in questconfigs collection
        console.log(`🔍 Finding quest config for class: ${TARGET_CLASS_ID}`);
        const questConfig = await db.collection('questconfigs').findOne({
            $or: [
                { groupId: TARGET_CLASS_ID },
                { configId: TARGET_CLASS_ID },
                { classId: TARGET_CLASS_ID }
            ]
        });
        
        if (!questConfig) {
            console.log(`❌ No quest config found for class ${TARGET_CLASS_ID}`);
            return;
        }
        
        console.log(`✅ Found quest config: ${questConfig._id}`);
        
        // Check current T8 configuration
        const currentT8 = questConfig.config?.Q2?.T8;
        console.log(`📋 Current T8 hints: ${currentT8?.detailedHints?.length || 0} hints`);
        
        // Define new detailed hints for T8
        const newDetailedHints = [
            {
                "content": "Consider fundamental ethical principles: Privacy (protecting user data), Security (preventing harm), Transparency (being honest about system capabilities), and Accountability (taking responsibility for system outcomes).",
                "image": "",
                "video": null,
                "sequence": 1,
                "penalty": 0
            },
            {
                "content": "As systems scale, consider: Bias and Fairness (ensuring systems don't discriminate), Accessibility (making systems usable by diverse populations), Environmental Impact (energy consumption, carbon footprint), and Social Impact (how systems affect society).",
                "image": "",
                "video": null,
                "sequence": 2,
                "penalty": 0
            },
            {
                "content": "Think about professional obligations: Code of Ethics (following ACM/IEEE guidelines), Continuous Learning (staying updated on best practices), Whistleblowing (reporting unethical practices), and Advocacy (promoting ethical development practices).",
                "image": "",
                "video": null,
                "sequence": 3,
                "penalty": 0
            },
            {
                "content": "Provide specific examples: Social media algorithms affecting mental health, autonomous vehicles making life-or-death decisions, AI systems used in hiring/justice, and surveillance systems impacting privacy rights.",
                "image": "",
                "video": null,
                "sequence": 4,
                "penalty": 0
            },
            {
                "content": "Discuss practical actions: Ethical Design (building ethics into the development process), Testing for Bias (evaluating systems for discrimination), Documentation (clearly explaining system limitations), and User Consent (ensuring informed user agreement).",
                "image": "",
                "video": null,
                "sequence": 5,
                "penalty": 0
            }
        ];
        
        // Define new validation parameters
        const newValidationParameters = [
            "Must discuss at least 3 ethical responsibilities",
            "Must explain why these responsibilities become more important at scale",
            "Must provide specific examples of ethical concerns",
            "Must suggest practical actions engineers can take"
        ];
        
        // Update the quest config
        const updateResult = await db.collection('questconfigs').updateOne(
            { _id: questConfig._id },
            {
                $set: {
                    "config.Q2.T8.detailedHints": newDetailedHints,
                    "config.Q2.T8.llmTextValidation.validationParameters": newValidationParameters,
                    "config.Q2.T8.llmTextValidation.enableDetailedFeedback": true,
                    "updatedAt": new Date()
                }
            }
        );
        
        if (updateResult.modifiedCount > 0) {
            console.log(`✅ Successfully updated T8 hints and validation parameters`);
            console.log(`📊 Added ${newDetailedHints.length} detailed hints`);
            console.log(`📊 Added ${newValidationParameters.length} validation parameters`);
            
            // Count affected students
            const affectedStudents = await db.collection('user_data').countDocuments({
                'user_data.customGroupId': TARGET_CLASS_ID
            });
            
            console.log(`👥 This update affects ${affectedStudents} students in the class`);
            
            // List some affected students
            const students = await db.collection('user_data').find({
                'user_data.customGroupId': TARGET_CLASS_ID
            }).limit(5).toArray();
            
            console.log(`📋 Sample affected students:`);
            students.forEach(student => {
                console.log(`   - ${student._id}`);
            });
            
        } else {
            console.log(`❌ No changes made to quest config`);
        }
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
    }
}

console.log(`🚀 Updating T8 hints for class: ${TARGET_CLASS_ID}`);
updateT8Hints();
