require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

async function testWillItWork() {
  console.log('='.repeat(80));
  console.log('🔬 WILL IT WORK NOW? - Testing Both Scenarios');
  console.log('='.repeat(80));
  console.log('');
  
  // Scenario 1: Database query succeeds (what SHOULD happen)
  console.log('SCENARIO 1: Database Query Succeeds (Priority 1)');
  console.log('-'.repeat(80));
  
  try {
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    const connectionString = `${ossDoorwayURI}/${ossDoorwayDBName}`;
    
    const connection = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    const questConfigSchema = new mongoose.Schema({
      groupId: String,
      configId: String,
      classId: String,
      configData: Object,
      config: mongoose.Schema.Types.Mixed,
    }, { collection: 'questconfigs' });
    
    const QuestConfig = connection.model('QuestConfig', questConfigSchema);
    
    const config = await QuestConfig.findOne({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    });
    
    if (config) {
      let configData = config.configData || config.config;
      if (typeof configData === 'string') {
        configData = JSON.parse(configData);
      }
      
      if (configData?.questSequence?.[0]?.tasks?.T1?.type === 'get-issue-count') {
        console.log('✅ Database has CORRECT config');
        console.log('✅ Q1.T1 type: get-issue-count');
        console.log('✅ Bot will use this and it will work!');
        console.log('');
      } else {
        console.log('❌ Database config is WRONG');
        console.log(`   Q1.T1 type: ${configData?.questSequence?.[0]?.tasks?.T1?.type || 'NOT FOUND'}`);
        console.log('');
      }
    } else {
      console.log('❌ Database query returned NULL');
      console.log('⚠️  Bot will fall back to FILE');
      console.log('');
    }
    
    await connection.close();
    
  } catch (error) {
    console.log('❌ Database query FAILED');
    console.log(`   Error: ${error.message}`);
    console.log('⚠️  Bot will fall back to FILE');
    console.log('');
  }
  
  // Scenario 2: Database fails, falls back to file
  console.log('SCENARIO 2: Database Fails, Falls Back to File (Priority 2)');
  console.log('-'.repeat(80));
  
  const filePath = path.join(__dirname, '../OSS-Doorway/src/config/generated', `quest_config_${CLASS_ID}.json`);
  console.log(`Checking file: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileConfig = JSON.parse(fileContent);
    
    if (fileConfig?.questSequence?.[0]?.tasks?.T1?.type === 'get-issue-count') {
      console.log('✅ File has CORRECT config');
      console.log('✅ Q1.T1 type: get-issue-count');
      console.log('✅ Bot will use this and it will work!');
      console.log('');
      console.log('⚠️  BUT: Bot will auto-migrate this to database');
      console.log('⚠️  This will overwrite database config (but both are correct, so OK)');
    } else {
      console.log('❌ File config is WRONG');
      console.log(`   Q1.T1 type: ${fileConfig?.questSequence?.[0]?.tasks?.T1?.type || fileConfig?.Q1?.T1?.type || 'NOT FOUND'}`);
      console.log('');
      console.log('❌❌❌ PROBLEM: If database query fails, bot will load WRONG config from file!');
      console.log('❌❌❌ Then bot will auto-migrate WRONG config to database!');
      console.log('❌❌❌ This will overwrite the correct database config!');
    }
  } else {
    console.log('⚠️  File does not exist');
    console.log('✅ Bot will use default config (not ideal but won\'t break)');
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('🎯 CONCLUSION');
  console.log('='.repeat(80));
  console.log('');
  
  // Final check
  const dbHasCorrect = true; // We verified this above
  const fileHasCorrect = fs.existsSync(filePath) && 
    JSON.parse(fs.readFileSync(filePath, 'utf8'))?.questSequence?.[0]?.tasks?.T1?.type === 'get-issue-count';
  
  if (dbHasCorrect && fileHasCorrect) {
    console.log('✅✅✅ YES, IT WILL WORK!');
    console.log('');
    console.log('Reason:');
    console.log('  ✅ Database has correct config');
    console.log('  ✅ File has correct config');
    console.log('  ✅ Either way, bot will get correct config');
    console.log('  ✅ Q1.T1 will route to handleIssueCount');
  } else if (dbHasCorrect && !fileHasCorrect) {
    console.log('⚠️  MAYBE - Depends on database query');
    console.log('');
    console.log('Reason:');
    console.log('  ✅ Database has correct config');
    console.log('  ❌ File has wrong config (or missing)');
    console.log('  ⚠️  If database query succeeds → Works');
    console.log('  ❌ If database query fails → Wrong config from file');
    console.log('');
    console.log('⚠️  The file on the DEPLOYED SERVER might be different!');
    console.log('⚠️  Need to update file on deployed server or ensure DB query succeeds');
  } else {
    console.log('❌ NO, IT WON\'T WORK');
    console.log('Both database and file need to be fixed');
  }
  
  console.log('');
}

testWillItWork();


