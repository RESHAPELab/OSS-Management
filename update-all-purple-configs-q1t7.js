/**
 * Update ALL purple configs for this class with the correct Q1T7 text
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { MongoClient } from 'mongodb';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ossEnvPath = resolve(__dirname, '../OSS-Doorway/.env');
dotenv.config({ path: ossEnvPath });

const DB_URI = process.env.URI;
const DB_NAME = process.env.DB_NAME;
const CLASS_ID = '696ebe63b1aef30efd02e0f8';
const LIVE_CONFIG_PATH = resolve(__dirname, 'shared-quest-configs', `quest_config_${CLASS_ID}-LIVE.json`);

async function main() {
  const client = await MongoClient.connect(DB_URI);
  const db = client.db(DB_NAME);
  const questconfigsCollection = db.collection('questconfigs');
  
  console.log(`🔄 Updating ALL purple configs for class: ${CLASS_ID}\n`);
  
  // Read LIVE config
  const liveConfigContent = fs.readFileSync(LIVE_CONFIG_PATH, 'utf8');
  const liveConfig = JSON.parse(liveConfigContent);
  
  console.log(`✅ Loaded LIVE config with ${liveConfig.questSequence?.length || 0} quests`);
  
  // Convert to legacy format
  const legacyConfig = { map_repo_link: liveConfig.map_repo_link || "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map" };
  if (liveConfig.questSequence && Array.isArray(liveConfig.questSequence)) {
    liveConfig.questSequence.forEach((quest) => {
      const questId = quest.questId || quest.metadata?.questId;
      if (questId) {
        legacyConfig[questId] = {
          metadata: {
            title: quest.title || quest.metadata?.title || questId,
            description: quest.metadata?.description || quest.description || '',
            prerequisite: quest.metadata?.prerequisite || null,
            type: quest.metadata?.type || quest.questType || 'custom',
            questTitle: quest.title || quest.metadata?.title || questId
          },
          ...quest.tasks
        };
      }
    });
  }
  
  // Find all purple configs
  const purpleConfigs = await questconfigsCollection.find({
    $or: [
      { classId: { $regex: `^${CLASS_ID}_purple_` } },
      { groupId: { $regex: `^${CLASS_ID}_purple_` } },
      { configId: { $regex: `^${CLASS_ID}_purple_` } }
    ]
  }).toArray();
  
  console.log(`📊 Found ${purpleConfigs.length} purple config(s) to update\n`);
  
  let updated = 0;
  for (const config of purpleConfigs) {
    const configId = config.classId || config.groupId || config.configId;
    console.log(`📝 Updating: ${configId}`);
    
    const updateResult = await questconfigsCollection.updateOne(
      { _id: config._id },
      {
        $set: {
          questSequence: liveConfig.questSequence,
          config: legacyConfig,
          configData: liveConfig,
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      updated++;
      console.log(`   ✅ Updated`);
    } else {
      console.log(`   ⚠️  Already up to date`);
    }
  }
  
  console.log(`\n✅ Updated ${updated} purple config(s)`);
  console.log(`\n⚠️  IMPORTANT: The bot cache is still active!`);
  console.log(`   - Cache will expire in ~1 hour`);
  console.log(`   - OR restart the bot to clear cache immediately`);
  console.log(`   - The database now has the correct config with "B.py"`);
  
  await client.close();
}

main().catch(console.error);
