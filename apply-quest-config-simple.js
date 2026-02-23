const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Load the quest config
const questConfigPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
const newQuestConfig = JSON.parse(fs.readFileSync(questConfigPath, 'utf8'));

async function applyQuestConfig() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false }));

    // Get all groups
    const groups = await Group.find({});
    console.log(`📚 Found ${groups.length} class(es) in database\n`);

    let updatedCount = 0;

    for (const group of groups) {
      const className = group.groupName || 'Unknown';
      console.log(`📖 Processing: "${className}"`);

      // Update the group's quest configuration
      await Group.updateOne(
        { _id: group._id },
        {
          $set: {
            questJsonConfig: newQuestConfig,
            questJsonLastUpdated: new Date()
          }
        }
      );
      
      updatedCount++;
      console.log(`   ✅ Updated\n`);
    }

    console.log('='.repeat(70));
    console.log('✅ Quest Configuration Applied Successfully!');
    console.log('='.repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   • Classes updated: ${updatedCount}`);
    console.log(`   • Config file: shared-quest-configs/q1-github-basics-config.json`);
    console.log('\n📋 Quest Details:');
    console.log(`   • Quest ID: Q1`);
    console.log(`   • Title: Understanding OSS Projects and GitHub Basics`);
    console.log(`   • Badge: Explorer 🚀`);
    console.log(`   • Total Tasks: 6`);
    console.log(`   • Total Points: 120 (20 per task)`);
    console.log('\n🎯 Task Breakdown:');
    console.log(`   1. T1 - Explore the issue tracker (get-issue-count) - Dynamic`);
    console.log(`   2. T2 - Explore pull requests (get-pr-count) - Dynamic`);
    console.log(`   3. T3 - Locate Fork button (multiple-choice) - Answer: C`);
    console.log(`   4. T4 - Explore README (multiple-choice) - Answer: D`);
    console.log(`   5. T5 - Discover contributors (get-top-contributor) - Dynamic`);
    console.log(`   6. T6 - Quiz (5 questions) - Multiple answers`);
    console.log('\n🔗 Target Repository:');
    console.log(`   • probot-test-org/test-repo`);
    console.log('\n🎓 Impact:');
    console.log(`   • All ${updatedCount} classes now use this quest configuration`);
    console.log(`   • All students in these classes will receive these quests`);
    console.log(`   • OSS-Doorway bot will validate tasks using this config`);
    console.log('='.repeat(70));

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Done! Your quest configuration is now live.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying quest configuration:', error);
    process.exit(1);
  }
}

applyQuestConfig();

