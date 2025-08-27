const { MongoClient } = require('mongodb');

const ossDoorwayURI = 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const ossDoorwayDBName = 'test';

async function debugQuestConfig(classId) {
  console.log(`🔍 [DEBUG-CONFIG] Debugging quest config for class: ${classId}`);
  
  const client = new MongoClient(ossDoorwayURI);
  
  try {
    await client.connect();
    const db = client.db(ossDoorwayDBName);
    
    // Get quest config for this class
    const questConfig = await db.collection('questconfigs').findOne({
      $or: [
        { groupId: classId },
        { configId: classId },
        { classId: classId }
      ]
    });
    
    if (!questConfig) {
      console.log(`❌ No quest config found for class ${classId}`);
      return;
    }
    
    console.log(`📋 Quest Config Found:`);
    console.log(`   groupId: ${questConfig.groupId || 'N/A'}`);
    console.log(`   configId: ${questConfig.configId || 'N/A'}`);
    console.log(`   classId: ${questConfig.classId || 'N/A'}`);
    console.log(`   Created: ${questConfig.createdAt ? new Date(questConfig.createdAt).toLocaleDateString() : 'Unknown'}`);
    console.log(`---`);
    
    // Parse quest config to understand structure
    if (questConfig.configData) {
      try {
        const configData = typeof questConfig.configData === 'string' 
          ? JSON.parse(questConfig.configData) 
          : questConfig.configData;
        
        console.log(`📊 Config Data Structure:`);
        console.log(`   Type: ${typeof configData}`);
        console.log(`   Keys: ${Object.keys(configData).length}`);
        console.log(`   Top-level keys: ${Object.keys(configData).slice(0, 20).join(', ')}`);
        
        // Check if it's questSequence format
        if (configData.questSequence) {
          console.log(`\n📚 Quest Sequence Format Detected:`);
          console.log(`   Total quests: ${configData.questSequence.length}`);
          
          configData.questSequence.forEach((quest, index) => {
            console.log(`   ${index + 1}. ${quest.questId}: ${quest.metadata?.title || quest.title || 'No title'}`);
            console.log(`      Tasks: ${Object.keys(quest.tasks || {}).filter(key => key !== 'metadata').join(', ')}`);
            
            // Check for Q1 specifically
            if (quest.questId === 'Q1') {
              console.log(`      🔍 Q1 Found! Tasks:`, quest.tasks);
              if (quest.tasks?.T1) {
                console.log(`      ✅ T1 Found:`, quest.tasks.T1);
              } else {
                console.log(`      ❌ T1 NOT Found in Q1`);
              }
            }
          });
        } else {
          console.log(`\n🔧 Legacy Format Detected:`);
          
          // Look for Q1 in legacy format
          const questKeys = Object.keys(configData).filter(key => key.startsWith('Q'));
          console.log(`   Quest keys: ${questKeys.join(', ')}`);
          
          if (configData.Q1) {
            console.log(`   ✅ Q1 Found:`, Object.keys(configData.Q1));
            if (configData.Q1.T1) {
              console.log(`   ✅ T1 Found in Q1:`, configData.Q1.T1);
            } else {
              console.log(`   ❌ T1 NOT Found in Q1`);
            }
          } else {
            console.log(`   ❌ Q1 NOT Found`);
          }
        }
        
        // Look for any Q1 references
        console.log(`\n🔍 Searching for Q1 references...`);
        const q1References = [];
        const searchInObject = (obj, path = '') => {
          if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
              const currentPath = path ? `${path}.${key}` : key;
              if (key === 'Q1' || key === 'T1') {
                q1References.push({ path: currentPath, value: value });
              }
              if (typeof value === 'object' && value !== null) {
                searchInObject(value, currentPath);
              }
            });
          }
        };
        
        searchInObject(configData);
        
        if (q1References.length > 0) {
          console.log(`   Found Q1/T1 references:`);
          q1References.forEach(ref => {
            console.log(`      ${ref.path}: ${typeof ref.value}`);
          });
        } else {
          console.log(`   No Q1/T1 references found`);
        }
        
      } catch (e) {
        console.log(`⚠️ Could not parse configData: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error debugging quest config:`, error);
  } finally {
    await client.close();
  }
}

// Main execution
const classId = process.argv[2] || '68ab703e6ceb965e0759df11';

if (!classId) {
  console.log('❌ Please provide a class ID as an argument');
  console.log('Usage: node debug-quest-config.js <classId>');
  process.exit(1);
}

debugQuestConfig(classId)
  .then(() => {
    console.log('✅ Quest config debugging complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
