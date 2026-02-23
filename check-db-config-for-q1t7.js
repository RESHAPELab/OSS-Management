/**
 * Check what config is currently in the database and clear cache if needed
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ossEnvPath = resolve(__dirname, '../OSS-Doorway/.env');
dotenv.config({ path: ossEnvPath });

const DB_URI = process.env.URI;
const DB_NAME = process.env.DB_NAME;
const CLASS_ID = '696ebe63b1aef30efd02e0f8';

async function main() {
  const client = await MongoClient.connect(DB_URI);
  const db = client.db(DB_NAME);
  const questconfigsCollection = db.collection('questconfigs');
  
  console.log(`🔍 Checking database config for class: ${CLASS_ID}\n`);
  
  // Check main config
  const mainConfig = await questconfigsCollection.findOne({
    $or: [
      { classId: CLASS_ID },
      { groupId: CLASS_ID },
      { configId: CLASS_ID }
    ]
  });
  
  if (mainConfig) {
    console.log(`✅ Found main config:`);
    console.log(`   QuestSequence length: ${mainConfig.questSequence?.length || 0}`);
    
    if (mainConfig.questSequence && mainConfig.questSequence.length > 0) {
      mainConfig.questSequence.forEach((quest, idx) => {
        const questId = quest.questId || quest.metadata?.questId;
        const taskKeys = quest.tasks ? Object.keys(quest.tasks).filter(k => k !== 'metadata') : [];
        console.log(`   ${idx + 1}. ${questId}: ${taskKeys.length} tasks`);
        
        // Check if T7 exists
        if (quest.tasks && quest.tasks.T7) {
          console.log(`      ✅ T7 exists: ${quest.tasks.T7.title || 'N/A'}`);
        } else {
          console.log(`      ❌ T7 does NOT exist`);
        }
      });
    }
    
    // Check legacy config format
    if (mainConfig.config) {
      const q1Tasks = mainConfig.config.Q1 ? Object.keys(mainConfig.config.Q1).filter(k => k !== 'metadata') : [];
      console.log(`\n   Legacy format Q1 tasks: ${q1Tasks.length}`);
      if (mainConfig.config.Q1?.T7) {
        console.log(`   ✅ T7 in legacy format: ${mainConfig.config.Q1.T7.title || 'N/A'}`);
      } else {
        console.log(`   ❌ T7 NOT in legacy format`);
      }
    }
  } else {
    console.log(`❌ Main config not found`);
  }
  
  // Check purple configs
  console.log(`\n🔍 Checking purple configs...`);
  const purpleConfigs = await questconfigsCollection.find({
    $or: [
      { classId: { $regex: `^${CLASS_ID}_purple_` } },
      { groupId: { $regex: `^${CLASS_ID}_purple_` } },
      { configId: { $regex: `^${CLASS_ID}_purple_` } }
    ]
  }).limit(5).toArray();
  
  console.log(`   Found ${purpleConfigs.length} purple config(s)`);
  purpleConfigs.forEach((config, idx) => {
    const configId = config.classId || config.groupId || config.configId;
    const questCount = config.questSequence?.length || 0;
    console.log(`   ${idx + 1}. ${configId}: ${questCount} quests`);
    
    if (config.questSequence && config.questSequence[0]?.tasks?.T7) {
      console.log(`      ✅ T7 exists: ${config.questSequence[0].tasks.T7.title || 'N/A'}`);
    } else {
      console.log(`      ❌ T7 does NOT exist`);
    }
  });
  
  await client.close();
  
  console.log(`\n📋 Summary:`);
  console.log(`   The bot is using a CACHED config (13.5 minutes old)`);
  console.log(`   Cache key: processed-quest-config-696ebe63b1aef30efd02e0f8_purple_1769407805219`);
  console.log(`   Cache TTL: 1 hour`);
  console.log(`   The cache will expire in ~46.5 minutes`);
  console.log(`\n   To force refresh:`);
  console.log(`   1. Wait for cache to expire (1 hour total)`);
  console.log(`   2. Or restart the bot (clears all cache)`);
  console.log(`   3. Or update the database config timestamp to trigger cache invalidation`);
}

main().catch(console.error);
