require('dotenv').config();
const mongoose = require('mongoose');

const CLASS_ID = '691b7f64528ddbaa6810aa3f';

async function forceClearAll() {
  console.log('🔥 FORCE CLEARING ALL CONFIGS FOR CLASS 691b7f64528ddbaa6810aa3f');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // Connect using EXACT bot method
    const ossDoorwayURI = process.env.URI;
    const ossDoorwayDBName = process.env.DB_NAME;
    const connectionString = `${ossDoorwayURI}/${ossDoorwayDBName}`;
    
    console.log('📡 Connecting to:', ossDoorwayDBName);
    const connection = await mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    // Schema
    const questConfigSchema = new mongoose.Schema({}, { collection: 'questconfigs', strict: false });
    const QuestConfig = connection.model('QuestConfig', questConfigSchema);
    
    // Find ALL configs for this class
    console.log('🔍 Finding ALL configs...');
    const allConfigs = await QuestConfig.find({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID },
        { _id: CLASS_ID }
      ]
    });
    
    console.log(`   Found ${allConfigs.length} config(s)`);
    
    if (allConfigs.length > 0) {
      console.log('');
      allConfigs.forEach((cfg, idx) => {
        console.log(`   Config ${idx + 1}:`);
        console.log(`      _id: ${cfg._id}`);
        console.log(`      configId: ${cfg.configId}`);
        console.log(`      classId: ${cfg.classId}`);
        console.log(`      groupId: ${cfg.groupId}`);
        console.log(`      updatedAt: ${cfg.updatedAt}`);
        console.log(`      createdBy: ${cfg.createdBy || cfg.source}`);
        
        const configData = cfg.config || cfg.configData;
        if (configData) {
          if (configData.questSequence) {
            console.log(`      ✅ Has questSequence (NEW FORMAT)`);
          } else {
            const keys = Object.keys(configData).filter(k => k !== 'map_repo_link' && k !== 'readme');
            console.log(`      ⚠️  FLAT FORMAT - Keys: ${keys.slice(0, 10).join(', ')}`);
          }
        }
        console.log('');
      });
    }
    
    // Delete ALL
    console.log('🗑️  DELETING ALL CONFIGS...');
    const deleteResult = await QuestConfig.deleteMany({
      $or: [
        { groupId: CLASS_ID },
        { configId: CLASS_ID },
        { classId: CLASS_ID }
      ]
    });
    console.log(`   Deleted ${deleteResult.deletedCount} config(s)`);
    console.log('');
    
    await connection.close();
    
    console.log('✅ All configs deleted');
    console.log('');
    console.log('⚠️  THE BOT CACHE MUST BE CLEARED OR BOT MUST BE RESTARTED');
    console.log('   The config is gone from database');
    console.log('   The bot will fall back to file or default config');
    console.log('   This will force a cache refresh with the file config');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceClearAll();


