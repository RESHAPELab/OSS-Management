/**
 * Force update the purple config questSequence with the correct Q1T7 text
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
const PURPLE_ID = `${CLASS_ID}_purple_1769407805219`;
const LIVE_CONFIG_PATH = resolve(__dirname, 'shared-quest-configs', `quest_config_${CLASS_ID}-LIVE.json`);

async function main() {
  const client = await MongoClient.connect(DB_URI);
  const db = client.db(DB_NAME);
  const questconfigsCollection = db.collection('questconfigs');
  
  console.log(`🔄 Force updating purple config: ${PURPLE_ID}\n`);
  
  // Read LIVE config
  const liveConfigContent = fs.readFileSync(LIVE_CONFIG_PATH, 'utf8');
  const liveConfig = JSON.parse(liveConfigContent);
  
  console.log(`✅ Loaded LIVE config with ${liveConfig.questSequence?.length || 0} quests`);
  
  // Verify Q1T7 has correct text
  const q1t7 = liveConfig.questSequence?.[0]?.tasks?.T7;
  if (q1t7) {
    if (q1t7.accept?.includes('B.py')) {
      console.log(`✅ LIVE config has correct text: "B.py" (Python)\n`);
    } else {
      console.log(`❌ LIVE config has wrong text!`);
      await client.close();
      return;
    }
  }
  
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
  
  // Update the purple config
  console.log(`📝 Updating purple config in database...`);
  const updateResult = await questconfigsCollection.updateOne(
    {
      $or: [
        { classId: PURPLE_ID },
        { groupId: PURPLE_ID },
        { configId: PURPLE_ID }
      ]
    },
    {
      $set: {
        questSequence: liveConfig.questSequence,  // Force update questSequence
        config: legacyConfig,                      // Update legacy format
        configData: liveConfig,                    // Update configData
        updatedAt: new Date()
      }
    }
  );
  
  if (updateResult.matchedCount > 0) {
    console.log(`   ✅ Updated ${updateResult.modifiedCount} document(s)\n`);
  } else {
    console.log(`   ⚠️  No document matched - creating new one...`);
    await questconfigsCollection.insertOne({
      classId: PURPLE_ID,
      groupId: PURPLE_ID,
      configId: PURPLE_ID,
      questSequence: liveConfig.questSequence,
      config: legacyConfig,
      configData: liveConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPurpleDeployment: true
    });
    console.log(`   ✅ Created new document\n`);
  }
  
  // Verify the update
  const verifyConfig = await questconfigsCollection.findOne({
    $or: [
      { classId: PURPLE_ID },
      { groupId: PURPLE_ID },
      { configId: PURPLE_ID }
    ]
  });
  
  if (verifyConfig) {
    const t7 = verifyConfig.questSequence?.[0]?.tasks?.T7;
    if (t7) {
      console.log(`✅ Verification:`);
      if (t7.accept?.includes('B.py')) {
        console.log(`   ✅ questSequence has correct text: "B.py"`);
      } else if (t7.accept?.includes('B.java')) {
        console.log(`   ❌ questSequence STILL has old text: "B.java"`);
      }
    }
  }
  
  await client.close();
  console.log(`\n✅ Done! The cache will refresh on next load (or wait ~1 hour for expiration)`);
}

main().catch(console.error);
