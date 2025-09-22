const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Purple deploy config ID we're looking for
const PURPLE_CONFIG_ID = '68c1d73bd9c02ffe31f56257';
const CLASS_ID = '68a770b8140b9c0174c13ce7';

async function findPurpleDeployInMongoDB() {
    console.log(`🔍 Looking for purple deploy config in MongoDB:`);
    console.log(`   Purple Config ID: ${PURPLE_CONFIG_ID}`);
    console.log(`   Class ID: ${CLASS_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Check all collections for this purple deploy config
        const collections = await db.listCollections().toArray();
        console.log(`\n📋 Available collections: ${collections.map(c => c.name).join(', ')}`);
        
        for (const collection of collections) {
            try {
                console.log(`\n🔍 Searching in collection: ${collection.name}`);
                
                // Search for the purple config ID
                const purpleConfig = await db.collection(collection.name).findOne({
                    _id: PURPLE_CONFIG_ID
                });
                
                if (purpleConfig) {
                    console.log(`✅ FOUND PURPLE DEPLOY CONFIG in ${collection.name}!`);
                    console.log(`   Document _id: ${purpleConfig._id}`);
                    console.log(`   Class ID: ${purpleConfig.classId}`);
                    console.log(`   Group ID: ${purpleConfig.groupId}`);
                    console.log(`   Config ID: ${purpleConfig.configId}`);
                    console.log(`   Created: ${purpleConfig.createdAt}`);
                    console.log(`   Updated: ${purpleConfig.updatedAt}`);
                    console.log(`   Is Purple Deployment: ${purpleConfig.isPurpleDeployment}`);
                    console.log(`   Base Config ID: ${purpleConfig.baseConfigId}`);
                    console.log(`   Deployed Quest ID: ${purpleConfig.deployedQuestId}`);
                    console.log(`   Deployed At: ${purpleConfig.deployedAt}`);
                    
                    // Show quest structure
                    const configData = purpleConfig.config || purpleConfig.configData || purpleConfig.questConfig || {};
                    const questKeys = Object.keys(configData).filter(k => k.startsWith('Q'));
                    console.log(`   Available quests: ${questKeys.join(', ')}`);
                    
                    return; // Found it, exit
                }
                
                // Also search by class ID with purple suffix
                const purpleByClass = await db.collection(collection.name).findOne({
                    classId: `${CLASS_ID}_purple_1757534011062`
                });
                
                if (purpleByClass) {
                    console.log(`✅ FOUND PURPLE DEPLOY CONFIG by class ID in ${collection.name}!`);
                    console.log(`   Document _id: ${purpleByClass._id}`);
                    console.log(`   Class ID: ${purpleByClass.classId}`);
                    console.log(`   Is Purple Deployment: ${purpleByClass.isPurpleDeployment}`);
                    return;
                }
                
                // Search for any purple deployments for this class
                const allPurpleForClass = await db.collection(collection.name).find({
                    $and: [
                        { classId: { $regex: `${CLASS_ID}_purple_` } },
                        { isPurpleDeployment: true }
                    ]
                }).toArray();
                
                if (allPurpleForClass.length > 0) {
                    console.log(`   Found ${allPurpleForClass.length} purple deployments for this class:`);
                    allPurpleForClass.forEach((config, index) => {
                        console.log(`     ${index + 1}. ID: ${config._id}, Class: ${config.classId}, Deployed: ${config.deployedQuestId}`);
                    });
                }
                
            } catch (error) {
                console.log(`   Error searching ${collection.name}: ${error.message}`);
            }
        }
        
        console.log(`\n❌ Purple deploy config not found in any collection`);
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
        console.log(`\n🔌 Database connection closed`);
    }
}

console.log(`🚀 Searching for purple deploy config in MongoDB...`);
findPurpleDeployInMongoDB();
