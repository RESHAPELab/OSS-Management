// check-class-config.js
// Usage: node check-class-config.js <classId>
// Example: node check-class-config.js 68a770b8140b9c0174c13ce7

const { MongoClient } = require('mongodb');

async function main() {
  const classId = process.argv[2];
  if (!classId) {
    console.error('Usage: node check-class-config.js <classId>');
    process.exit(1);
  }

  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);

    const groupsCol = db.collection('groups');
    const questConfigsCol = db.collection('questconfigs');

    console.log('🔎 Checking class:', classId);

    // 1. Check what's saved in the Group document
    const group = await groupsCol.findOne({ _id: classId });
    if (!group) {
      console.log('❌ Group not found:', classId);
      return;
    }

    console.log('📋 Group info:');
    console.log('  - groupName:', group.groupName);
    console.log('  - questJsonConfig:', group.questJsonConfig?.classId || 'not set');
    console.log('  - questJsonLastUpdated:', group.questJsonLastUpdated);

    // 2. Check all quest configs for this class
    const allConfigs = await questConfigsCol.find({ 
      $or: [
        { classId: classId },
        { classId: { $regex: new RegExp(`^${classId}_purple_`) } },
        { classId: { $regex: new RegExp(`^${classId}-`) } }
      ]
    }).sort({ createdAt: -1 }).toArray();

    console.log('\n📚 All quest configs for this class:');
    for (const config of allConfigs) {
      const legacyKeys = config?.config ? Object.keys(config.config) : [];
      const questIds = legacyKeys.filter(k => k.startsWith('Q'));
      const seqIds = Array.isArray(config.questSequence)
        ? config.questSequence.map(q => q.questId || q.metadata?.questId || q.metadata?.title).filter(Boolean)
        : [];

      console.log(`  - ${config.classId}`);
      console.log(`    Created: ${config.createdAt}`);
      console.log(`    Legacy quests: [${questIds.join(', ')}]`);
      console.log(`    Sequence quests: [${seqIds.join(', ')}]`);
      console.log(`    Is purple: ${config.classId.includes('_purple_')}`);
    }

    // 3. Check what purple deploy would use as base
    const baseConfig = await questConfigsCol.findOne({ classId: classId });
    if (baseConfig) {
      console.log('\n🟣 Purple deploy would use as base:', baseConfig.classId);
    } else {
      console.log('\n🟣 Purple deploy: No base config found for', classId);
    }

    // 4. Check what new repo creation would use
    const latestPurpleConfig = await questConfigsCol.findOne(
      { classId: { $regex: new RegExp(`^${classId}_purple_`) } },
      { sort: { createdAt: -1 } }
    );

    if (latestPurpleConfig) {
      console.log('\n🆕 New repo creation would use:', latestPurpleConfig.classId);
    } else {
      console.log('\n🆕 New repo creation would use:', classId, '(original - no purple config found)');
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    if (client) await client.close();
  }
}

main();
