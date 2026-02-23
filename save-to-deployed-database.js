require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

async function saveToDeployedDatabase() {
  console.log('='.repeat(80));
  console.log('💾 SAVING TO DEPLOYED DATABASE');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Load correct config
    const configPath = path.join(__dirname, 'shared-quest-configs', 'q1-github-basics-config.json');
    const correctConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('✅ Loaded correct config');
    console.log(`   Q1.T1 type: ${correctConfig.questSequence[0].tasks.T1.type}`);
    console.log('');
    
    // Check ALL possible database URIs
    const databases = [
      { name: 'URI/DB_NAME (bot uses)', uri: process.env.URI, dbName: process.env.DB_NAME },
      { name: 'OSS_DOORWAY_DB', uri: process.env.OSS_DOORWAY_DB_URI, dbName: process.env.OSS_DOORWAY_DB_NAME },
      { name: 'MONGODB_URI', uri: process.env.MONGODB_URI, dbName: 'management' }
    ];
    
    for (const db of databases) {
      if (!db.uri || !db.dbName) {
        console.log(`⚠️  ${db.name}: Missing credentials, skipping`);
        console.log('');
        continue;
      }
      
      console.log(`📡 Trying ${db.name}...`);
      console.log(`   URI: ${db.uri.substring(0, 60)}...`);
      console.log(`   DB: ${db.dbName}`);
      
      try {
        // Use EXACT bot connection method
        const connectionString = `${db.uri}/${db.dbName}`;
        const connection = await mongoose.createConnection(connectionString, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }).asPromise();
        
        console.log(`   ✅ Connected`);
        
        // EXACT schema
        const questConfigSchema = new mongoose.Schema({
          groupId: String,
          configId: String,
          classId: String,
          configData: Object,
          config: mongoose.Schema.Types.Mixed,
          createdAt: Date,
          updatedAt: Date,
          source: String,
          createdBy: String,
          originalFilePath: String,
          version: Number
        }, { collection: 'questconfigs', strict: false });
        
        const QuestConfig = connection.model('QuestConfig', questConfigSchema);
        
        // Check if already exists
        const existing = await QuestConfig.findOne({
          $or: [
            { groupId: CLASS_ID },
            { configId: CLASS_ID },
            { classId: CLASS_ID }
          ]
        });
        
        if (existing) {
          console.log(`   ℹ️  Config already exists (id: ${existing._id})`);
          // Delete it
          await QuestConfig.deleteMany({
            $or: [
              { groupId: CLASS_ID },
              { configId: CLASS_ID },
              { classId: CLASS_ID }
            ]
          });
          console.log(`   🗑️  Deleted old config`);
        }
        
        // Insert new config
        const now = new Date();
        const newConfig = await QuestConfig.create({
          configId: CLASS_ID,
          classId: CLASS_ID,
          groupId: CLASS_ID,
          config: correctConfig,
          configData: correctConfig,
          createdAt: now,
          updatedAt: now,
          createdBy: `save-to-deployed-${db.name}`,
          source: 'database',
          originalFilePath: `quest_config_${CLASS_ID}.json`,
          version: 10
        });
        
        console.log(`   ✅ Config saved (id: ${newConfig._id})`);
        
        // Verify
        const verify = await QuestConfig.findOne({
          $or: [
            { groupId: CLASS_ID },
            { configId: CLASS_ID },
            { classId: CLASS_ID }
          ]
        });
        
        if (verify) {
          const verifyData = verify.configData || verify.config;
          if (verifyData?.questSequence?.[0]?.tasks?.T1?.type === 'get-issue-count') {
            console.log(`   ✅ Verified: Q1.T1 type is get-issue-count`);
            console.log(`   ✅✅✅ Config is CORRECT in ${db.name}!`);
          } else {
            console.log(`   ❌ Verification failed: Wrong type`);
          }
        } else {
          console.log(`   ❌ Verification failed: Config not found after save`);
        }
        
        await connection.close();
        console.log(`   🔌 Closed connection`);
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log('');
      }
    }
    
    console.log('='.repeat(80));
    console.log('✅ Config saved to all available databases!');
    console.log('The deployed bot should now find it when cache expires.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
}

saveToDeployedDatabase();


