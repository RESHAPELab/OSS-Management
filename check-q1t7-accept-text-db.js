/**
 * Check what Q1T7 accept text is in the database
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
const PURPLE_ID = `${CLASS_ID}_purple_1769407805219`;

async function main() {
  const client = await MongoClient.connect(DB_URI);
  const db = client.db(DB_NAME);
  const questconfigsCollection = db.collection('questconfigs');
  
  console.log(`🔍 Checking Q1T7 accept text in database...\n`);
  
  // Check the specific purple config that's being cached
  const purpleConfig = await questconfigsCollection.findOne({
    $or: [
      { classId: PURPLE_ID },
      { groupId: PURPLE_ID },
      { configId: PURPLE_ID }
    ]
  });
  
  if (purpleConfig) {
    console.log(`✅ Found purple config: ${PURPLE_ID}`);
    
    if (purpleConfig.questSequence && purpleConfig.questSequence[0]?.tasks?.T7) {
      const t7 = purpleConfig.questSequence[0].tasks.T7;
      console.log(`\n📝 Q1T7 accept text from questSequence:`);
      console.log(`   ${t7.accept?.substring(0, 200)}...`);
      
      // Check if it contains Java or Python
      if (t7.accept?.includes('B.java')) {
        console.log(`\n   ❌ CONTAINS OLD TEXT: "B.java" (Java)`);
      } else if (t7.accept?.includes('B.py')) {
        console.log(`\n   ✅ CONTAINS NEW TEXT: "B.py" (Python)`);
      }
    } else {
      console.log(`   ❌ T7 not found in questSequence`);
    }
    
    // Also check legacy format
    if (purpleConfig.config?.Q1?.T7) {
      const t7Legacy = purpleConfig.config.Q1.T7;
      console.log(`\n📝 Q1T7 accept text from legacy config:`);
      console.log(`   ${t7Legacy.accept?.substring(0, 200)}...`);
      
      if (t7Legacy.accept?.includes('B.java')) {
        console.log(`\n   ❌ CONTAINS OLD TEXT: "B.java" (Java)`);
      } else if (t7Legacy.accept?.includes('B.py')) {
        console.log(`\n   ✅ CONTAINS NEW TEXT: "B.py" (Python)`);
      }
    }
    
    // Check configData
    if (purpleConfig.configData?.questSequence?.[0]?.tasks?.T7) {
      const t7Data = purpleConfig.configData.questSequence[0].tasks.T7;
      console.log(`\n📝 Q1T7 accept text from configData:`);
      console.log(`   ${t7Data.accept?.substring(0, 200)}...`);
      
      if (t7Data.accept?.includes('B.java')) {
        console.log(`\n   ❌ CONTAINS OLD TEXT: "B.java" (Java)`);
      } else if (t7Data.accept?.includes('B.py')) {
        console.log(`\n   ✅ CONTAINS NEW TEXT: "B.py" (Python)`);
      }
    }
    
    console.log(`\n📅 Config updatedAt: ${purpleConfig.updatedAt || 'N/A'}`);
  } else {
    console.log(`❌ Purple config not found: ${PURPLE_ID}`);
    
    // Check main config
    const mainConfig = await questconfigsCollection.findOne({
      $or: [
        { classId: CLASS_ID },
        { groupId: CLASS_ID },
        { configId: CLASS_ID }
      ]
    });
    
    if (mainConfig && mainConfig.questSequence?.[0]?.tasks?.T7) {
      const t7 = mainConfig.questSequence[0].tasks.T7;
      console.log(`\n📝 Main config Q1T7 accept text:`);
      console.log(`   ${t7.accept?.substring(0, 200)}...`);
      
      if (t7.accept?.includes('B.java')) {
        console.log(`\n   ❌ CONTAINS OLD TEXT: "B.java" (Java)`);
      } else if (t7.accept?.includes('B.py')) {
        console.log(`\n   ✅ CONTAINS NEW TEXT: "B.py" (Python)`);
      }
    }
  }
  
  await client.close();
}

main().catch(console.error);
