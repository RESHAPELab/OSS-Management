const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function findStudentConfig() {
    console.log(`🔍 Finding quest config for student: dcsfdcdscdscsdc-cs386-test-test`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Find the student
        const student = await db.collection('user_data').findOne({ 
            _id: 'dcsfdcdscdscsdc-cs386-test-test' 
        });
        
        if (student) {
            console.log('✅ Student found:', student._id);
            console.log('📋 Custom Group ID:', student.user_data?.customGroupId);
            
            const groupId = student.user_data?.customGroupId;
            
            // Get their quest config
            const questConfig = await db.collection('questconfigs').findOne({
                $or: [
                    { groupId: groupId },
                    { configId: groupId },
                    { classId: groupId }
                ]
            });
            
            if (questConfig) {
                console.log('✅ Quest config found:', questConfig._id);
                console.log('📋 Config ID:', questConfig.configId);
                console.log('📋 Group ID:', questConfig.groupId);
                
                // Save to file
                const fs = require('fs');
                fs.writeFileSync(
                    `quest_config_${groupId}.json`,
                    JSON.stringify(questConfig, null, 2)
                );
                console.log(`💾 Quest config saved to: quest_config_${groupId}.json`);
                
                return questConfig;
            } else {
                console.log('❌ No quest config found');
            }
        } else {
            console.log('❌ Student not found');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

findStudentConfig();
