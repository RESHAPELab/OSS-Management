const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// MongoDB connections
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oss-management';
const OSS_DOORWAY_DB_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

const SEARCH_TERM = '68c1377d73acd40854c5671a';

async function searchAllClasses() {
    let ossManagementClient, ossDoorwayClient;
    
    try {
        console.log('🔍 Searching for classes with term:', SEARCH_TERM);
        
        // Search in OSS-Management database
        console.log('\n📡 Searching in OSS-Management database...');
        ossManagementClient = new MongoClient(MONGODB_URI);
        await ossManagementClient.connect();
        const ossManagementDb = ossManagementClient.db();
        
        const groups = await ossManagementDb.collection('groups').find({}).toArray();
        console.log(`Found ${groups.length} groups in OSS-Management:`);
        groups.forEach(group => {
            const idMatch = group._id.toString().includes(SEARCH_TERM.substring(0, 10));
            const nameMatch = group.groupName && group.groupName.toLowerCase().includes(SEARCH_TERM.substring(0, 10).toLowerCase());
            if (idMatch || nameMatch) {
                console.log(`  ✅ MATCH: ${group._id} - ${group.groupName}`);
            } else {
                console.log(`  - ${group._id} - ${group.groupName}`);
            }
        });
        
        // Search in OSS-Doorway database
        console.log('\n📡 Searching in OSS-Doorway database...');
        ossDoorwayClient = new MongoClient(OSS_DOORWAY_DB_URI);
        await ossDoorwayClient.connect();
        const ossDoorwayDb = ossDoorwayClient.db(OSS_DOORWAY_DB_NAME);
        
        // Search quest_configs collection
        const questConfigs = await ossDoorwayDb.collection('quest_configs').find({}).limit(50).toArray();
        console.log(`\nFound ${questConfigs.length} quest configs in OSS-Doorway:`);
        questConfigs.forEach(config => {
            const idMatch = config.classId && config.classId.includes(SEARCH_TERM.substring(0, 10));
            if (idMatch) {
                console.log(`  ✅ MATCH: ${config.classId} (${config._id})`);
            } else {
                console.log(`  - ${config.classId} (${config._id})`);
            }
        });
        
        // Search users collection
        const users = await ossDoorwayDb.collection('users').find({
            $or: [
                { classId: { $regex: SEARCH_TERM.substring(0, 10), $options: 'i' } },
                { 'classId': { $regex: SEARCH_TERM.substring(0, 10), $options: 'i' } }
            ]
        }).limit(10).toArray();
        
        if (users.length > 0) {
            console.log(`\nFound ${users.length} users with matching classId:`);
            users.forEach(user => {
                console.log(`  - ${user.username} - ${user.classId}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (ossManagementClient) {
            await ossManagementClient.close();
            console.log('\n🔌 Disconnected from OSS-Management database');
        }
        if (ossDoorwayClient) {
            await ossDoorwayClient.close();
            console.log('🔌 Disconnected from OSS-Doorway database');
        }
    }
}

// Run the script
searchAllClasses();



