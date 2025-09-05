const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findMarcogerosaTestConfig() {
    // Use the same database connection as OSS-Doorway
    const uri = process.env.URI || 'mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/oss-doorway?retryWrites=true&w=majority&appName=gamification';
    const dbName = process.env.DB_NAME || 'oss-doorway';
    
    console.log(`🔍 Looking for quest config for group: 68accc656847fdb7c19b1f0a-test`);
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        
        // Check the questconfigs collection for the specific group ID
        const questConfigs = db.collection('questconfigs');
        const config = await questConfigs.findOne({ groupId: '68accc656847fdb7c19b1f0a-test' });
        
        if (config) {
            console.log('✅ Found quest config!');
            console.log('\n📋 Quest Configuration:');
            console.log('=' .repeat(50));
            console.log(JSON.stringify(config, null, 2));
        } else {
            console.log('❌ No quest config found for group ID: 68accc656847fdb7c19b1f0a-test');
            
            // Let's check what quest configs exist
            const allConfigs = await questConfigs.find({}).toArray();
            console.log(`\n📊 Found ${allConfigs.length} quest configs in database:`);
            allConfigs.forEach((cfg, index) => {
                console.log(`${index + 1}. Group ID: ${cfg.groupId}`);
                console.log(`   Quest count: ${Object.keys(cfg.questSequence || {}).length}`);
                console.log(`   ---`);
            });
            
            // Also check if there are any configs with "test" in the group ID
            const testConfigs = await questConfigs.find({ 
                groupId: { $regex: /test/i } 
            }).toArray();
            
            if (testConfigs.length > 0) {
                console.log('\n🎯 Quest configs with "test" in group ID:');
                testConfigs.forEach((cfg, index) => {
                    console.log(`${index + 1}. Group ID: ${cfg.groupId}`);
                    console.log(`   Quest count: ${Object.keys(cfg.questSequence || {}).length}`);
                    console.log(`   ---`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error finding quest config:', error);
    } finally {
        await client.close();
    }
}

findMarcogerosaTestConfig();

