// fix-q4-all-points.js
// Fix all Q4 tasks to have 1 point and correct success message

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

    console.log('🔧 FIXING ALL Q4 TASKS TO 1 POINT');
    console.log('=' .repeat(50));

    // Get the current config
    const config = await questConfigsCol.findOne({ classId: targetPurpleConfigId });
    
    if (!config) {
      console.error('❌ Config not found:', targetPurpleConfigId);
      return;
    }

    console.log('✅ Config found, updating all Q4 tasks...');

    // Correct success message for all tasks
    const correctSuccessMessage = "✅ **Correct!**\n\nExcellent! You've answered correctly.\n\n**Points earned:** 1\n\nGo to next task";
    const correctErrorMessage = "❌ **Incorrect Answer**\n\nThat's not the right answer. Please review the question and try again.\n\n**Hint:** Think carefully about the options.\n\nGreat contribution! 📋";

    // Build update object for all Q4 tasks
    const updateFields = {
      updatedAt: new Date()
    };

    // Update all Q4 tasks (T1-T12)
    for (let i = 1; i <= 12; i++) {
      const taskId = `T${i}`;
      updateFields[`config.Q4.${taskId}.points`] = 1;
      updateFields[`config.Q4.${taskId}.xp`] = 1;
      updateFields[`config.Q4.${taskId}.success`] = correctSuccessMessage;
      updateFields[`config.Q4.${taskId}.error`] = correctErrorMessage;
    }

    // Update the config
    const updateResult = await questConfigsCol.updateOne(
      { classId: targetPurpleConfigId },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('✅ Successfully updated all Q4 tasks');
    } else {
      console.log('⚠️ No changes made');
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const updatedConfig = await questConfigsCol.findOne({ classId: targetPurpleConfigId });
    
    if (updatedConfig && updatedConfig.config && updatedConfig.config.Q4) {
      console.log('✅ Q4 tasks after fix:');
      
      // Check a few tasks to verify
      const tasksToCheck = ['T1', 'T5', 'T12'];
      for (const taskId of tasksToCheck) {
        if (updatedConfig.config.Q4[taskId]) {
          const task = updatedConfig.config.Q4[taskId];
          console.log(`  - ${taskId}: ${task.points} points, ${task.xp} XP`);
          console.log(`    Success: ${task.success?.substring(0, 50)}...`);
        }
      }
    }

    console.log('\n🎉 Fix complete!');
    console.log('All Q4 tasks now have 1 point and correct success/error messages.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) await client.close();
  }
}

main();
