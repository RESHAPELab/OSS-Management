require('dotenv').config();
const mongoose = require('mongoose');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

console.log('='.repeat(80));
console.log('🔬 FINAL COMPREHENSIVE TEST');
console.log('='.repeat(80));
console.log('');

async function test() {
  try {
    // EXACT bot connection method from ConfigService.loadConfigFromDatabase
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    
    console.log('1️⃣  ENVIRONMENT VARIABLES');
    console.log('-'.repeat(80));
    console.log(`URI: ${ossDoorwayURI?.substring(0, 60)}...`);
    console.log(`DB_NAME: ${ossDoorwayDBName}`);
    console.log('');
    
    console.log('2️⃣  CONNECTION METHOD (EXACT BOT METHOD)');
    console.log('-'.repeat(80));
    // This is line 135 in configService.js:
    // const connection = mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`);
    const connectionString = `${ossDoorwayURI}/${ossDoorwayDBName}`;
    console.log(`Connection string: ${connectionString.substring(0, 100)}...`);
    console.log('');
    
    const connection = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    console.log('✅ Connected');
    console.log('');
    
    console.log('3️⃣  SCHEMA (EXACT BOT SCHEMA)');
    console.log('-'.repeat(80));
    // Lines 138-150 in configService.js
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
    }, { collection: 'questconfigs' });
    
    const QuestConfig = connection.model('QuestConfig', questConfigSchema);
    console.log('✅ Schema created: collection="questconfigs"');
    console.log('');
    
    console.log('4️⃣  QUERY (EXACT BOT QUERY)');
    console.log('-'.repeat(80));
    // Lines 155-161 in configService.js
    console.log(`Query: findOne({`);
    console.log(`  $or: [`);
    console.log(`    { groupId: "${CLASS_ID}" },`);
    console.log(`    { configId: "${CLASS_ID}" },`);
    console.log(`    { classId: "${CLASS_ID}" }`);
    console.log(`  ]`);
    console.log(`})`);
    console.log('');
    
    const config = await QuestConfig.findOne({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    });
    
    if (!config) {
      console.log('❌❌❌ CONFIG NOT FOUND!');
      console.log('Bot will NOT find this config in database!');
      console.log('Bot will fall back to file (if exists) or default config.');
      await connection.close();
      return;
    }
    
    console.log('✅ CONFIG FOUND!');
    console.log('');
    
    console.log('5️⃣  CONFIG DETAILS');
    console.log('-'.repeat(80));
    console.log(`_id: ${config._id}`);
    console.log(`configId: ${config.configId}`);
    console.log(`classId: ${config.classId}`);
    console.log(`groupId: ${config.groupId}`);
    console.log(`updatedAt: ${config.updatedAt}`);
    console.log(`createdBy: ${config.createdBy}`);
    console.log('');
    
    console.log('6️⃣  EXTRACT CONFIG DATA (EXACT BOT METHOD)');
    console.log('-'.repeat(80));
    // Lines 169-183 in configService.js
    let configData = config.configData || config.config;
    console.log(`Using field: ${config.configData ? 'configData' : 'config'}`);
    
    if (typeof configData === 'string') {
      console.log('Config is string, parsing...');
      configData = JSON.parse(configData);
    } else {
      console.log('Config is already object');
    }
    console.log('');
    
    console.log('7️⃣  VERIFY STRUCTURE');
    console.log('-'.repeat(80));
    console.log(`Keys: ${Object.keys(configData).join(', ')}`);
    console.log(`Has questSequence: ${Array.isArray(configData?.questSequence)}`);
    
    if (Array.isArray(configData?.questSequence)) {
      console.log(`Quest count: ${configData.questSequence.length}`);
      
      const q1 = configData.questSequence[0];
      if (q1) {
        console.log(`Q1 questId: ${q1.questId}`);
        console.log(`Q1 title: ${q1.title}`);
        console.log(`Q1 tasks: ${Object.keys(q1.tasks).length}`);
        
        const t1 = q1.tasks?.T1;
        if (t1) {
          console.log(`Q1.T1 type: ${t1.type}`);
          console.log(`Q1.T1 desc: ${t1.desc}`);
          console.log('');
          
          if (t1.type === 'get-issue-count') {
            console.log('8️⃣  FINAL RESULT');
            console.log('-'.repeat(80));
            console.log('✅✅✅ SUCCESS! Config is CORRECT!');
            console.log('✅✅✅ Bot WILL find it using this exact method!');
            console.log('✅✅✅ T1 type is "get-issue-count"');
            console.log('✅✅✅ Will route to handleIssueCount!');
            console.log('');
            console.log('⏳ When cache expires or bot restarts:');
            console.log('   1. Bot checks cache → miss');
            console.log('   2. Bot queries database → finds this config');
            console.log('   3. Bot converts questSequence → legacy format');
            console.log('   4. Bot caches converted config');
            console.log('   5. Tasks route correctly!');
          } else {
            console.log('❌❌❌ ERROR!');
            console.log(`❌❌❌ T1 type is "${t1.type}" - should be "get-issue-count"`);
          }
        } else {
          console.log('❌ Q1.T1 not found');
        }
      } else {
        console.log('❌ Q1 not found in questSequence');
      }
    } else {
      console.log('❌ Config does not have questSequence array');
    }
    
    await connection.close();
    console.log('');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
}

test();


