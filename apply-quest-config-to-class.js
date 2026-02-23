const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Load the quest config
const questConfigPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
const newQuestConfig = JSON.parse(fs.readFileSync(questConfigPath, 'utf8'));

// Define models
const GroupSchema = new mongoose.Schema({}, { strict: false });
const QuestConfigSchema = new mongoose.Schema({}, { strict: false });

async function applyQuestConfigToClass() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const Group = mongoose.model('Group', GroupSchema);
    const QuestConfig = mongoose.model('QuestConfig', QuestConfigSchema);

    // Get all groups
    const groups = await Group.find({});
    console.log(`📚 Found ${groups.length} class(es) in database`);

    let updatedCount = 0;
    let configsCreated = 0;

    for (const group of groups) {
      const groupId = group._id.toString();
      const className = group.groupName || 'Unknown';

      console.log(`\n📖 Processing class: "${className}" (${groupId})`);

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
      console.log(`  ✅ Updated group quest config`);

      // Check if QuestConfig document exists for this group
      let questConfig = await QuestConfig.findOne({ groupId: groupId });
      
      if (questConfig) {
        // Update existing config
        await QuestConfig.updateOne(
          { groupId: groupId },
          {
            $set: {
              configData: newQuestConfig,
              updatedAt: new Date()
            }
          }
        );
        console.log(`  ✅ Updated existing QuestConfig document`);
      } else {
        // Use upsert to avoid duplicate key errors
        await QuestConfig.updateOne(
          { groupId: groupId },
          {
            $set: {
              groupId: groupId,
              configData: newQuestConfig,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
        console.log(`  ✅ Created new QuestConfig document`);
        configsCreated++;
      }

      updatedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Quest Configuration Applied Successfully!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Classes updated: ${updatedCount}`);
    console.log(`   - New QuestConfig documents created: ${configsCreated}`);
    console.log(`   - Quest config file: q1-github-basics-config.json`);
    console.log('\n📋 Quest Details:');
    console.log(`   - Quest ID: Q1`);
    console.log(`   - Title: Understanding OSS Projects and GitHub Basics`);
    console.log(`   - Total Tasks: 6`);
    console.log(`     • T1: get-issue-count (dynamic)`);
    console.log(`     • T2: get-pr-count (dynamic)`);
    console.log(`     • T3: multiple-choice (Fork button)`);
    console.log(`     • T4: multiple-choice (README)`);
    console.log(`     • T5: get-top-contributor (dynamic)`);
    console.log(`     • T6: quiz (5 questions)`);
    console.log(`   - Total Points: 120`);
    console.log(`   - Repository: probot-test-org/test-repo`);
    console.log('\n🎓 All students in these classes will now use this quest config!');
    console.log('='.repeat(60));

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying quest configuration:', error);
    process.exit(1);
  }
}

applyQuestConfigToClass();

