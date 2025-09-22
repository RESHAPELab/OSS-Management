const { MongoClient } = require('mongodb');

async function checkCollections() {
    const client = new MongoClient('mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification');
    
    try {
        await client.connect();
        console.log('✅ Connected to database');
        
        const db = client.db('test');
        
        // Check both collection names
        const collections = ['quest_configs', 'questconfigs'];
        
        for (const collectionName of collections) {
            console.log(`\n🔍 Checking collection: ${collectionName}`);
            
            try {
                const config = await db.collection(collectionName).findOne({
                    $or: [
                        { groupId: '68a770b8140b9c0174c13ce7' },
                        { configId: '68a770b8140b9c0174c13ce7' },
                        { classId: '68a770b8140b9c0174c13ce7' }
                    ]
                });
                
                if (config) {
                    console.log(`✅ Found config in ${collectionName}`);
                    console.log(`   Document _id: ${config._id}`);
                    console.log(`   Updated at: ${config.updatedAt}`);
                    console.log(`   Quest keys: ${Object.keys(config.questConfig || config.config || {}).filter(k => k.startsWith('Q'))}`);
                    console.log(`   Q2 exists: ${!!(config.questConfig && config.questConfig.Q2)}`);
                } else {
                    console.log(`❌ No config found in ${collectionName}`);
                }
            } catch (error) {
                console.log(`❌ Error checking ${collectionName}: ${error.message}`);
            }
        }
        
        // List all collections to see what's available
        console.log('\n📋 All collections in database:');
        const allCollections = await db.listCollections().toArray();
        allCollections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.close();
        console.log('\n🔌 Database connection closed');
    }
}

checkCollections();


