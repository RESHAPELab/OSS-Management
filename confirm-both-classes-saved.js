require('dotenv').config();
const mongoose = require('mongoose');

// Import the Group model
const Group = require('./backend/models/GroupModel');

const CLASS_IDS = [
  '692735b4668a78a28bcf7c3e', // At Last
  '691b7f64528ddbaa6810aa3f'  // OSS-Doorway Demo
];

async function confirmSaved() {
  console.log('='.repeat(80));
  console.log('🔍 CONFIRMING BOTH CLASSES ARE SAVED CORRECTLY');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // ========================================
    // PART 1: Check OSS-Management Database
    // ========================================
    console.log('PART 1: OSS-Management Database (management)');
    console.log('-'.repeat(80));
    
    const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to OSS-Management database\n');
    
    for (const classId of CLASS_IDS) {
      const group = await Group.findById(classId);
      
      if (!group) {
        console.log(`❌ Class ${classId} NOT FOUND\n`);
        continue;
      }
      
      console.log(`✅ Class: ${group.groupName} (${classId})`);
      console.log(`   Students: ${group.students ? group.students.length : 0}`);
      
      if (group.questJsonConfig) {
        if (group.questJsonConfig.questSequence) {
          const questCount = group.questJsonConfig.questSequence.length;
          console.log(`   ✅ Has questJsonConfig with ${questCount} quest(s)`);
          
          if (group.questJsonConfig.questSequence[0]) {
            const q1 = group.questJsonConfig.questSequence[0];
            const taskCount = q1.tasks ? Object.keys(q1.tasks).length : 0;
            console.log(`   ✅ Q1: "${q1.title}" with ${taskCount} tasks`);
            
            // List task types
            if (q1.tasks) {
              const taskTypes = Object.entries(q1.tasks).map(([id, task]) => `${id}:${task.type}`);
              console.log(`   ✅ Task types: ${taskTypes.join(', ')}`);
            }
          }
        } else {
          console.log(`   ⚠️  questJsonConfig exists but no questSequence array`);
        }
      } else {
        console.log(`   ❌ No questJsonConfig found`);
      }
      
      // Check students
      if (group.students && group.students.length > 0) {
        let studentsWithConfig = 0;
        group.students.forEach(student => {
          if (student.questJsonConfig && student.questJsonConfig.questSequence) {
            studentsWithConfig++;
          }
        });
        console.log(`   ✅ Students with config: ${studentsWithConfig}/${group.students.length}`);
      }
      
      console.log('');
    }
    
    await mongoose.connection.close();
    console.log('🔌 Closed OSS-Management database connection\n');
    
    // ========================================
    // PART 2: Check OSS-Doorway Database
    // ========================================
    console.log('PART 2: OSS-Doorway Database (gamification-management)');
    console.log('-'.repeat(80));
    
    const DOORWAY_URI = process.env.URI;
    const DOORWAY_DB_NAME = process.env.DB_NAME;
    
    const doorwayConnection = await mongoose.createConnection(DOORWAY_URI, {
      dbName: DOORWAY_DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    
    console.log('✅ Connected to OSS-Doorway database\n');
    
    const questConfigSchema = new mongoose.Schema({
      configId: String,
      classId: String,
      groupId: String,
      config: mongoose.Schema.Types.Mixed,
      configData: mongoose.Schema.Types.Mixed,
      createdAt: Date,
      updatedAt: Date,
      createdBy: String,
      source: String,
      originalFilePath: String,
      version: Number
    }, { collection: 'questconfigs' });
    
    const QuestConfig = doorwayConnection.model('QuestConfig', questConfigSchema);
    
    for (const classId of CLASS_IDS) {
      const config = await QuestConfig.findOne({
        $or: [
          { configId: classId },
          { classId: classId },
          { groupId: classId }
        ]
      });
      
      if (!config) {
        console.log(`❌ Config for ${classId} NOT FOUND in OSS-Doorway database\n`);
        continue;
      }
      
      console.log(`✅ Config found for: ${classId}`);
      console.log(`   Config ID: ${config.configId}`);
      console.log(`   Created by: ${config.createdBy || config.source || 'unknown'}`);
      console.log(`   Updated at: ${config.updatedAt}`);
      
      const configData = config.config || config.configData;
      
      if (configData) {
        if (typeof configData === 'string') {
          console.log(`   ⚠️  Config is stored as string (needs parsing)`);
        } else if (configData.questSequence) {
          const questCount = configData.questSequence.length;
          console.log(`   ✅ Has questSequence with ${questCount} quest(s)`);
          
          if (configData.questSequence[0]) {
            const q1 = configData.questSequence[0];
            const taskCount = q1.tasks ? Object.keys(q1.tasks).length : 0;
            console.log(`   ✅ Q1: "${q1.title}" with ${taskCount} tasks`);
            
            // Verify T1 specifically
            if (q1.tasks && q1.tasks.T1) {
              console.log(`   ✅ T1 type: ${q1.tasks.T1.type}`);
              if (q1.tasks.T1.type === 'get-issue-count') {
                console.log(`   ✅✅✅ T1 will route to handleIssueCount (CORRECT!)`);
              } else {
                console.log(`   ⚠️  T1 type is not get-issue-count`);
              }
            }
          }
        } else {
          console.log(`   ⚠️  Config exists but no questSequence array`);
          console.log(`   Keys: ${Object.keys(configData).join(', ')}`);
        }
      } else {
        console.log(`   ❌ No config data found`);
      }
      
      console.log('');
    }
    
    await doorwayConnection.close();
    console.log('🔌 Closed OSS-Doorway database connection\n');
    
    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('='.repeat(80));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log('Both classes should have:');
    console.log('  ✅ Config in OSS-Management database (Group.questJsonConfig)');
    console.log('  ✅ Config in OSS-Doorway database (questconfigs collection)');
    console.log('  ✅ Q1 with 6 tasks (T1-T6)');
    console.log('  ✅ T1 type: get-issue-count (routes to handleIssueCount)');
    console.log('');
    console.log('Classes:');
    console.log('  1. 692735b4668a78a28bcf7c3e (At Last)');
    console.log('  2. 691b7f64528ddbaa6810aa3f (OSS-Doorway Demo)');
    console.log('');
    console.log('⏳ Cache will expire within 1 hour, then bot will use new config.');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
}

confirmSaved();

