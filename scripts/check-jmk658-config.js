import { MongoClient } from 'mongodb';

const DOORWAY_URI = "mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification";

async function checkJmk658Config() {
  console.log('🔍 Checking quest config for jmk658-cs386-software-engineering repo...');
  
  const doorwayClient = new MongoClient(DOORWAY_URI);
  
  try {
    await doorwayClient.connect();
    const doorwayDb = doorwayClient.db('gamification');
    
    // Search for jmk658 user in all possible collections
    const collections = ['user_data', 'userstoreddata', 'Quest'];
    
    for (const collectionName of collections) {
      console.log(`\n📋 Checking ${collectionName} collection for jmk658...`);
      
      try {
        const collection = doorwayDb.collection(collectionName);
        
        // Search for jmk658 user
        const jmkUser = await collection.findOne({
          $or: [
            { _id: 'jmk658-cs386-software-engineering' },
            { _id: 'jmk658' },
            { github: 'jmk658' },
            { username: 'jmk658' },
            { 'user_data.github': 'jmk658' },
            { 'user_data.repo': 'jmk658-cs386-software-engineering' },
            { repo: 'jmk658-cs386-software-engineering' }
          ]
        });
        
        if (jmkUser) {
          console.log(`✅ Found jmk658 in ${collectionName}:`);
          console.log(`   - ID: ${jmkUser._id}`);
          console.log(`   - GitHub: ${jmkUser.github || jmkUser.user_data?.github || 'N/A'}`);
          console.log(`   - Repo: ${jmkUser.repo || jmkUser.user_data?.repo || 'N/A'}`);
          console.log(`   - Group: ${jmkUser.group || jmkUser.user_data?.group || 'N/A'}`);
          console.log(`   - customGroupId: ${jmkUser.customGroupId || jmkUser.user_data?.customGroupId || 'N/A'}`);
          console.log(`   - Current quest: ${jmkUser.current?.quest || jmkUser.user_data?.current?.quest || 'N/A'}`);
          console.log(`   - Current task: ${jmkUser.current?.task || jmkUser.user_data?.current?.task || 'N/A'}`);
          
          // Check if they have embedded quest config
          const questConfig = jmkUser.questConfig || jmkUser.user_data?.questConfig;
          if (questConfig) {
            console.log('\n🔧 Found embedded quest config:');
            const quests = Object.keys(questConfig).filter(k => k.startsWith('Q'));
            console.log(`   - Quests available: ${quests.join(', ')}`);
            
            for (const quest of quests) {
              if (questConfig[quest] && typeof questConfig[quest] === 'object') {
                const tasks = Object.keys(questConfig[quest]).filter(k => k.startsWith('T'));
                console.log(`   - ${quest}: ${tasks.length} tasks`);
              }
            }
          }
          
          // Show all fields to understand structure
          console.log(`   - All fields: ${Object.keys(jmkUser).join(', ')}`);
          
          // Determine which config this user would use
          const configId = jmkUser.customGroupId || jmkUser.user_data?.customGroupId || 
                          jmkUser.group || jmkUser.user_data?.group;
          
          if (configId) {
            console.log(`\n🎯 This user would use config: ${configId}`);
            
            // Check if this matches any of our known configs
            if (configId.includes('68a770b8140b9c0174c13ce7')) {
              console.log('   ⭐ This is CS386 class related');
              if (configId.includes('purple')) {
                console.log('   🟣 Uses PURPLE config (updated with your preferred content)');
              } else if (configId.includes('with-q3')) {
                console.log('   ✅ Uses WITH-Q3 config (your preferred content)');
              } else if (configId === '68a770b8140b9c0174c13ce7') {
                console.log('   📋 Uses BASE config');
              } else {
                console.log(`   ❓ Uses custom config: ${configId}`);
              }
            }
          }
          
          break; // Found the user, no need to check other collections
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking ${collectionName}: ${error.message}`);
      }
    }
    
    // Also search more broadly for any CS386 users to understand the pattern
    console.log('\n🌐 Searching for other CS386 users for comparison...');
    
    try {
      const userDataCollection = doorwayDb.collection('user_data');
      const allUsers = await userDataCollection.find({}).limit(100).toArray();
      
      const cs386Users = allUsers.filter(user => {
        const userStr = JSON.stringify(user).toLowerCase();
        return userStr.includes('cs386') || userStr.includes('68a770b8140b9c0174c13ce');
      });
      
      if (cs386Users.length > 0) {
        console.log(`Found ${cs386Users.length} CS386 users in user_data:`);
        for (const user of cs386Users.slice(0, 5)) {
          console.log(`   - ${user._id}: group=${user.user_data?.group || 'N/A'}, customGroupId=${user.user_data?.customGroupId || 'N/A'}`);
        }
      }
      
      // Check userstoreddata too
      const storedDataCollection = doorwayDb.collection('userstoreddata');
      const storedUsers = await storedDataCollection.find({}).toArray();
      
      const cs386StoredUsers = storedUsers.filter(user => {
        const userStr = JSON.stringify(user).toLowerCase();
        return userStr.includes('cs386') || userStr.includes('68a770b8140b9c0174c13ce');
      });
      
      if (cs386StoredUsers.length > 0) {
        console.log(`Found ${cs386StoredUsers.length} CS386 users in userstoreddata:`);
        for (const user of cs386StoredUsers) {
          console.log(`   - ${user.username}: group=${user.user_data?.group || 'N/A'}`);
        }
      }
      
    } catch (error) {
      console.log(`Error in broad search: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await doorwayClient.close();
  }
}

checkJmk658Config();


