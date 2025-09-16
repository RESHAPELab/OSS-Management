// fix-q4t5-message.js
// Fix Q4T5 success message in the purple config

const { MongoClient } = require('mongodb');

async function main() {
  const targetPurpleConfigId = '68a770b8140b9c0174c13ce7_purple_1757534011062';
  
  const ossDoorwayUri = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
  const ossDoorwayDbName = process.env.OSS_DOORWAY_DB_NAME || 'test';

  let client;
  try {
    client = new MongoClient(ossDoorwayUri);
    await client.connect();
    const db = client.db(ossDoorwayDbName);

    const questConfigsCol = db.collection('questconfigs');

    console.log('🔧 FIXING Q4T5 SUCCESS MESSAGE');
    console.log('=' .repeat(50));

    // Get the current config
    const config = await questConfigsCol.findOne({ classId: targetPurpleConfigId });
    
    if (!config) {
      console.error('❌ Config not found:', targetPurpleConfigId);
      return;
    }

    console.log('✅ Config found, updating Q4T5...');

    // Fix the success message for Q4T5
    const correctSuccessMessage = "✅ **Correct!**\n\nExcellent! You've answered correctly.\n\n**Points earned:** 20\n";
    const correctErrorMessage = "❌ **Incorrect Answer**\n\nThat's not the right answer. Please review the question and try again.\n\n**Hint:** Think carefully about the options.\n\nGreat contribution! 📋";

    // Update the config
    const updateResult = await questConfigsCol.updateOne(
      { classId: targetPurpleConfigId },
      {
        $set: {
          'config.Q4.T5.success': correctSuccessMessage,
          'config.Q4.T5.error': correctErrorMessage,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('✅ Successfully updated Q4T5 messages');
    } else {
      console.log('⚠️ No changes made');
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const updatedConfig = await questConfigsCol.findOne({ classId: targetPurpleConfigId });
    
    if (updatedConfig && updatedConfig.config && updatedConfig.config.Q4 && updatedConfig.config.Q4.T5) {
      console.log('✅ Q4T5 after fix:');
      console.log('  - Success message:', updatedConfig.config.Q4.T5.success);
      console.log('  - Error message:', updatedConfig.config.Q4.T5.error);
    }

    console.log('\n🎉 Fix complete!');
    console.log('Q4T5 now has the correct success/error messages.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) await client.close();
  }
}

main();


