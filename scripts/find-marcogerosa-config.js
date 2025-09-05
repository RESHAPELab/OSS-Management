const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findMarcogerosaConfig() {
    // Use the same database connection as OSS-Doorway
    const uri = process.env.URI || 'mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/oss-doorway?retryWrites=true&w=majority&appName=gamification';
    const dbName = process.env.DB_NAME || 'oss-doorway';
    
    console.log(`🔍 Looking for user marcogerosa in database: ${dbName}`);
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        
        // Check the user_data collection
        const userData = db.collection('user_data');
        
        // Look for the specific user
        const user = await userData.findOne({ 
            $or: [
                { _id: { $regex: /marcogerosa/i } },
                { _id: { $regex: /marcogerosa-cs386/i } },
                { "user_data.username": { $regex: /marcogerosa/i } }
            ]
        });
        
        if (user) {
            console.log('✅ Found user marcogerosa!');
            console.log('📋 User data:');
            console.log('=' .repeat(50));
            console.log(`User ID: ${user._id}`);
            console.log(`Username: ${user.user_data?.username || 'N/A'}`);
            console.log(`Current Quest: ${user.user_data?.current?.quest || 'N/A'}`);
            console.log(`Current Task: ${user.user_data?.current?.task || 'N/A'}`);
            console.log(`Custom Group ID: ${user.user_data?.customGroupId || 'N/A'}`);
            
            if (user.user_data?.customGroupId) {
                console.log('\n🔍 Looking for quest config for group:', user.user_data.customGroupId);
                
                // Check the questconfigs collection
                const questConfigs = db.collection('questconfigs');
                const config = await questConfigs.findOne({ groupId: user.user_data.customGroupId });
                
                if (config) {
                    console.log('✅ Found quest config!');
                    console.log('\n📋 Quest Configuration:');
                    console.log('=' .repeat(50));
                    console.log(JSON.stringify(config, null, 2));
                } else {
                    console.log('❌ No quest config found for this group ID');
                    
                    // Let's check what quest configs exist
                    const allConfigs = await questConfigs.find({}).toArray();
                    console.log(`\n📊 Found ${allConfigs.length} quest configs in database:`);
                    allConfigs.forEach((cfg, index) => {
                        console.log(`${index + 1}. Group ID: ${cfg.groupId}`);
                        console.log(`   Quest count: ${Object.keys(cfg.questSequence || {}).length}`);
                        console.log(`   ---`);
                    });
                }
            }
        } else {
            console.log('❌ User marcogerosa not found');
            
            // Let's check what users exist
            const allUsers = await userData.find({}).toArray();
            console.log(`\n📊 Found ${allUsers.length} users in database:`);
            
            // Look for any users with "cs386" in their ID
            const cs386Users = allUsers.filter(u => 
                u._id && u._id.toString().includes('cs386')
            );
            
            if (cs386Users.length > 0) {
                console.log('\n🎯 Users with "cs386" in their ID:');
                cs386Users.forEach((u, index) => {
                    console.log(`${index + 1}. User ID: ${u._id}`);
                    console.log(`   Username: ${u.user_data?.username || 'N/A'}`);
                    console.log(`   Current Quest: ${u.user_data?.current?.quest || 'N/A'}`);
                    console.log(`   Current Task: ${u.user_data?.current?.task || 'N/A'}`);
                    console.log(`   Custom Group ID: ${u.user_data?.customGroupId || 'N/A'}`);
                    console.log(`   ---`);
                });
            } else {
                console.log('\n❌ No users with "cs386" found');
                
                // Show first few users as examples
                console.log('\n📋 Sample users in database:');
                allUsers.slice(0, 5).forEach((u, index) => {
                    console.log(`${index + 1}. User ID: ${u._id}`);
                    console.log(`   Username: ${u.user_data?.username || 'N/A'}`);
                    console.log(`   ---`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error finding marcogerosa config:', error);
    } finally {
        await client.close();
    }
}

findMarcogerosaConfig();

