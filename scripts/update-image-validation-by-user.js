const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Change this to target another student
const TARGET_USER_ID = process.argv[2] || 'marcogerosa-cs386-test-test';

async function updateImageValidationForUser() {
  console.log(`🔧 Updating image validation for user: ${TARGET_USER_ID}`);

  const client = new MongoClient(OSS_DOORWAY_URI);
  try {
    await client.connect();
    console.log(`✅ Connected to OSS-Doorway database`);

    const db = client.db(OSS_DOORWAY_DB_NAME);

    // 1) Find the student
    const student = await db.collection('user_data').findOne({ _id: TARGET_USER_ID });
    if (!student) {
      console.log('❌ Student not found');
      return;
    }

    const groupId = student.user_data?.customGroupId;
    console.log('📋 Custom Group ID:', groupId);
    if (!groupId) {
      console.log('❌ customGroupId not set for this user');
      return;
    }

    // 2) Find their quest config
    const questConfig = await db.collection('questconfigs').findOne({
      $or: [
        { groupId },
        { configId: groupId },
        { classId: groupId },
        { _id: groupId },
      ],
    });

    if (!questConfig) {
      console.log('❌ Quest config not found for this user');
      return;
    }

    console.log('✅ Found quest config:', questConfig._id);

    const cfg = questConfig.config || questConfig.questConfig || {};

    const ensureImageValidation = (task) => {
      if (!task) return false;
      const newCfg = {
        question:
          'The student should provide an image URL in the format ![Image](url). Validate that the response contains an image URL.',
        validationParameters: [
          'Must contain image URL in ![Image](url) format',
          'Must include valid URL link',
        ],
        temperature: 0.1,
        enableDetailedFeedback: true,
      };
      task.llmTextValidation = newCfg;
      return true;
    };

    let changed = false;

    // Try known quest key first (TEMP_...)
    const questKeys = Object.keys(cfg);
    for (const qKey of questKeys) {
      const questBlock = cfg[qKey];
      if (!questBlock || typeof questBlock !== 'object') continue;

      // Update T4–T13 if present
      for (let t = 4; t <= 13; t += 1) {
        const tk = `T${t}`;
        if (questBlock[tk] && questBlock[tk].type === 'llm-text-validation') {
          if (ensureImageValidation(questBlock[tk])) {
            console.log(`✅ Updated ${qKey}.${tk} validation parameters`);
            changed = true;
          }
        }
      }
    }

    if (!changed) {
      console.log('ℹ️ No matching tasks found to update in this config');
      return;
    }

    // 3) Persist changes
    const result = await db.collection('questconfigs').updateOne(
      { _id: questConfig._id },
      { $set: { config: cfg, updatedAt: new Date() } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Successfully updated quest config in database');
      const fs = require('fs');
      const out = `quest_config_${groupId}_updated.json`;
      fs.writeFileSync(out, JSON.stringify({ ...questConfig, config: cfg }, null, 2));
      console.log(`💾 Saved updated config to: ${out}`);
    } else {
      console.log('❌ No changes made to database');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

updateImageValidationForUser();

