const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target class ID (shared by all students)
const TARGET_CLASS_ID = '68a770b8140b9c0174c13ce8';

async function updateT8ValidationParameters() {
    console.log(`🔧 Updating T8 validation parameters for class: ${TARGET_CLASS_ID}`);
    
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
        
        // Check current T8 validation parameters
        const currentT8 = questConfig.config?.Q2?.T8;
        console.log(`📋 Current T8 validation parameters: ${currentT8?.llmTextValidation?.validationParameters?.length || 0} parameters`);
        
        // Define new simplified validation parameters
        const newValidationParameters = [
            "Must discuss at least 1 ethical responsibilities",
            "Must explain why this responsibility has become more important at scale"
        ];
        
        // Update the quest config
        const updateResult = await db.collection('questconfigs').updateOne(
            { _id: questConfig._id },
            {
                $set: {
                    "config.Q2.T8.llmTextValidation.validationParameters": newValidationParameters,
                    "updatedAt": new Date()
                }
            }
        );
        
        if (updateResult.modifiedCount > 0) {
            console.log(`✅ Successfully updated T8 validation parameters`);
            console.log(`📊 New validation parameters:`);
            newValidationParameters.forEach((param, index) => {
                console.log(`   ${index + 1}. ${param}`);
            });
            
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

console.log(`🚀 Updating T8 validation parameters for class: ${TARGET_CLASS_ID}`);
updateT8ValidationParameters();
