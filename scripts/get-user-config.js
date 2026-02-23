// get-user-config.js
// Usage: node get-user-config.js <repoId>
// Example: node get-user-config.js CocoCrispy95-cs386-software-engineering

const { MongoClient } = require('mongodb');

async function main() {
  const repoId = process.argv[2];
  if (!repoId) {
    console.error('Usage: node get-user-config.js <repoId>');
    process.exit(1);
  }

  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);

    const userDataCol = db.collection('user_data');
    const questConfigsCol = db.collection('questconfigs');

    const user = await userDataCol.findOne({ _id: repoId });
    if (!user) {
      console.log(`User not found: ${repoId}`);
      return;
    }

    const customGroupId = user?.user_data?.customGroupId;
    const customSequenceFile = user?.user_data?.customSequenceFile;
    console.log('🔎 Repo:', repoId);
    console.log('🔎 customGroupId:', customGroupId);
    console.log('🔎 customSequenceFile:', customSequenceFile);

    if (!customGroupId) {
      console.log('No customGroupId set for this user.');
      return;
    }

    const config = await questConfigsCol.findOne(
      { classId: customGroupId },
      { projection: { classId: 1, config: 1, questSequence: 1, createdAt: 1 } }
    );
    if (!config) {
      console.log(`No quest config found for classId: ${customGroupId}`);
      return;
    }

    const legacyKeys = config?.config ? Object.keys(config.config) : [];
    const questIds = legacyKeys.filter(k => k.startsWith('Q'));
    const seqIds = Array.isArray(config.questSequence)
      ? config.questSequence.map(q => q.questId || q.metadata?.questId || q.metadata?.title).filter(Boolean)
      : [];

    console.log('✅ Found quest config for classId:', config.classId);
    console.log('   Created at:', config.createdAt);
    console.log('   Legacy quest keys:', questIds);
    console.log('   Sequence questIds:', seqIds);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    if (client) await client.close();
  }
}

main();


