const { MongoClient } = require('mongodb');

const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

async function checkIm576UserData() {
  const client = new MongoClient(OSS_DOORWAY_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const db = client.db(OSS_DOORWAY_DB_NAME);
    
    // Check im576's user data
    const user = await db.collection('user_data').findOne({
      _id: 'im576-cs386-software-engineering'
    });
    
    if (!user) {
      console.log('❌ User im576-cs386-software-engineering not found');
      return;
    }
    
    console.log('📋 Found user:', user._id);
    console.log('📋 User data:', JSON.stringify(user.user_data, null, 2));
    
    const userData = user.user_data;
    if (userData) {
      console.log('📋 Custom Group ID:', userData.customGroupId);
      console.log('📋 Completed Quests:', userData.completedQuests || []);
      console.log('📋 Current Quest:', userData.currentQuest);
      console.log('📋 Available Quests:', userData.availableQuests || []);
      
      // Check if Q2 is completed
      const q2Completed = userData.completedQuests && userData.completedQuests.includes('Q2');
      console.log('✅ Q2 Completed:', q2Completed);
      
      // Check if Q3 is available
      const q3Available = userData.availableQuests && userData.availableQuests.includes('Q3');
      console.log('✅ Q3 Available:', q3Available);
    }
    
    // Also check the quest config they're using
    const configId = userData?.customGroupId;
    if (configId) {
      const questConfig = await db.collection('questconfigs').findOne({
        configId: configId
      });
      
      if (questConfig) {
        console.log('📋 Using config:', questConfig.configId);
        console.log('📋 Config has quests:', Object.keys(questConfig.config).filter(key => key.startsWith('Q')));
        
        if (questConfig.config.Q3) {
          console.log('✅ Q3 exists in config');
          console.log('📋 Q3 prerequisite:', questConfig.config.Q3.metadata.prerequisite);
        } else {
          console.log('❌ Q3 not found in config');
        }
      }
    }
    
    console.log('✅ Analysis complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkIm576UserData();


