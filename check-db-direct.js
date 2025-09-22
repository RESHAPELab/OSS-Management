const { MongoClient } = require('mongodb');

async function checkDB() {
    const client = new MongoClient('mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification');
    
    try {
        await client.connect();
        console.log('✅ Connected to database');
        
        const db = client.db('test');
        
        const config = await db.collection('quest_configs').findOne({
            $or: [
                { groupId: '68a770b8140b9c0174c13ce7' },
                { configId: '68a770b8140b9c0174c13ce7' },
                { classId: '68a770b8140b9c0174c13ce7' }
            ]
        });
        
        if (config) {
            console.log('✅ Found config in database');
            console.log('Document _id:', config._id);
            console.log('Updated at:', config.updatedAt);
            console.log('Last modified:', config.lastModified);
            console.log('Quest keys:', Object.keys(config.questConfig).filter(k => k.startsWith('Q')));
            console.log('All questConfig keys:', Object.keys(config.questConfig));
            console.log('Q1 exists:', !!config.questConfig.Q1);
            console.log('Q2 exists:', !!config.questConfig.Q2);
            
            if (config.questConfig.Q2) {
                console.log('Q2 metadata:', config.questConfig.Q2.metadata);
                console.log('Q2 task count:', Object.keys(config.questConfig.Q2).filter(k => k.startsWith('T')).length);
            }
        } else {
            console.log('❌ No config found in database');
        }
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.close();
        console.log('🔌 Database connection closed');
    }
}

checkDB();


