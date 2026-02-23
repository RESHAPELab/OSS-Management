/**
 * Find student data using the EXACT SAME pipeline as README SVG generation
 * This replicates the logic from OSS-Doorway/src/gamification.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from OSS-Doorway
const ossEnvPath = resolve(__dirname, '../OSS-Doorway/.env');
dotenv.config({ path: ossEnvPath });

const DOORWAY_DB_URI = process.env.URI;  // Use URI, not OSS_DOORWAY_DB_URI
const DOORWAY_DB_NAME = process.env.DB_NAME;  // Use DB_NAME

// Target student info from the URL: https://github.com/OSS-Doorway-Dev/qmisandftc-open-source-software-dev/issues/2
const TARGET_OWNER = 'OSS-Doorway-Dev';
const TARGET_REPO = 'qmisandftc-open-source-software-dev';
const CLASS_ID = '696ebe63b1aef30efd02e0f8';

console.log(`🔍 ===== FINDING STUDENT USING README PIPELINE =====`);
console.log(`📂 Target: ${TARGET_OWNER}/${TARGET_REPO}`);
console.log(`🎓 Class ID: ${CLASS_ID}`);
console.log(`\n`);

/**
 * Calculate overall completion percentage
 * From gamification.js lines ~1808-1840
 */
function calculateOverallCompletion(user_data, questConfig) {
  try {
    if (!user_data || !questConfig) {
      return 0;
    }

    // Support both 'completed' and 'accepted' field names for backwards compatibility
    const completionData = user_data.completed || user_data.accepted;
    
    if (!completionData) {
      return 0;
    }

    let totalTasksInConfig = 0;
    let completedTasksCount = 0;

    const questKeys = Object.keys(questConfig).filter(
      (key) => key.startsWith("Q") && questConfig[key] && typeof questConfig[key] === "object"
    );

    for (const questKey of questKeys) {
      const quest = questConfig[questKey];
      const taskKeys = Object.keys(quest).filter((key) => key !== "metadata");
      totalTasksInConfig += taskKeys.length;

      if (completionData && completionData[questKey]) {
        for (const taskKey of taskKeys) {
          if (completionData[questKey][taskKey]?.completed) {
            completedTasksCount++;
          }
        }
      }
    }

    if (totalTasksInConfig === 0) {
      return 0;
    }

    return completedTasksCount / totalTasksInConfig;
  } catch (error) {
    console.error(`[calculateOverallCompletion] Error:`, error);
    return 0;
  }
}

/**
 * Calculate class percentile and rank
 * From gamification.js lines ~1843-1888
 */
function calculateClassPercentile(userCompletion, classStudents, userPoints) {
  try {
    if (!classStudents || classStudents.length === 0) {
      return {
        display: 'N/A',
        percentile: 0,
        medal: '',
        color: '#888888',
        topPercent: 0
      };
    }

    const studentsBetter = classStudents.filter(s => {
      if (s.completion > userCompletion) return true;
      if (s.completion === userCompletion && s.points > userPoints) return true;
      return false;
    }).length;

    const studentsAbovePercent = (studentsBetter / classStudents.length) * 100;
    let topPercent = 100 - studentsAbovePercent;

    let display, color, medal;
    if (topPercent >= 90) {
      display = `Top ${Math.round(topPercent)}%`;
      color = '#FFD700';
      medal = '🥇';
    } else if (topPercent >= 75) {
      display = `Top ${Math.round(topPercent)}%`;
      color = '#FFA500';
      medal = '🥈';
    } else if (topPercent >= 50) {
      display = `Top ${Math.round(topPercent)}%`;
      color = '#2f80ed';
      medal = '🥉';
    } else {
      display = `Top ${Math.round(topPercent)}%`;
      color = '#00C853';
      medal = '🏅';
    }

    return {
      display,
      percentile: 100 - studentsAbovePercent,
      medal,
      color,
      topPercent: Math.round(topPercent)
    };
  } catch (error) {
    console.error(`[calculateClassPercentile] Error:`, error);
    return {
      display: 'Error',
      percentile: 0,
      medal: '',
      color: '#888888',
      topPercent: 0
    };
  }
}

/**
 * Fetch class data from local database
 * From gamification.js lines ~1949-2003
 */
async function generateClassDataFromLocal(classId, db) {
  try {
    console.log(`📊 [generateClassDataFromLocal] Fetching class data for: ${classId}`);
    
    const collection = db.collection('user_data');  // Correct collection name
    const baseClassId = classId.split('_')[0];
    
    const allUsers = await collection.find({
      $or: [
        { 'user_data.customGroupId': classId },
        { 'user_data.customGroupId': baseClassId },
        { 'user_data.customGroupId': { $regex: baseClassId } }  // Also search for variations
      ]
    }).toArray();
    
    console.log(`📊 [generateClassDataFromLocal] Found ${allUsers.length} users in class`);
    
    const classStudents = allUsers.map(doc => {
      const userData = doc.user_data;
      const username = userData?.username || userData?.github || doc._id;
      const points = Number(userData?.points || 0);
      
      // Calculate completion for this student
      // Support both 'completed' and 'accepted' fields
      const completionData = userData?.completed || userData?.accepted;
      let completion = 0;
      
      if (completionData) {
        const questKeys = Object.keys(completionData);
        let totalTasks = 0;
        let completedTasks = 0;
        
        for (const questKey of questKeys) {
          if (completionData[questKey] && typeof completionData[questKey] === 'object') {
            const tasks = completionData[questKey];
            const taskKeys = Object.keys(tasks).filter(k => k !== 'metadata');
            totalTasks += taskKeys.length;
            completedTasks += taskKeys.filter(k => tasks[k]?.completed).length;
          }
        }
        
        if (totalTasks > 0) {
          completion = (completedTasks / totalTasks) * 100;
        }
      }
      
      return {
        username,
        points,
        completion
      };
    });
    
    return classStudents;
  } catch (error) {
    console.error(`[generateClassDataFromLocal] Error:`, error);
    return [];
  }
}

async function main() {
  let doorwayClient;
  
  try {
    // Connect to OSS-Doorway database
    console.log(`🔌 Connecting to OSS-Doorway database...`);
    doorwayClient = await MongoClient.connect(DOORWAY_DB_URI);
    const doorwayDb = doorwayClient.db(DOORWAY_DB_NAME);
    console.log(`   ✅ Connected to OSS-Doorway: ${DOORWAY_DB_NAME}\n`);
    
    // STEP 1: Find user_data using the SAME KEY as the bot
    // The bot uses the full repo name as the database key for custom repos
    // From OSS-Doorway/index.js line 210: let dbUser = repo;
    console.log(`📂 STEP 1: Looking up user_data...`);
    console.log(`   Using repo name as database key: ${TARGET_REPO}`);
    
    const userDataCollection = doorwayDb.collection('user_data');  // Correct collection name
    
    // Try multiple possible keys in order of priority
    const possibleKeys = [
      TARGET_REPO,  // Full repo name (most likely for custom repos)
      `${TARGET_OWNER}/${TARGET_REPO}`,  // Full path
      TARGET_REPO.split('-')[0],  // Just username (qmisandftc)
    ];
    
    console.log(`   Note: Found in database exploration that key should be: ${TARGET_REPO}`);
    
    let userDocument = null;
    let usedKey = null;
    
    for (const key of possibleKeys) {
      console.log(`   Trying key: ${key}`);
      userDocument = await userDataCollection.findOne({ _id: key });
      if (userDocument) {
        usedKey = key;
        console.log(`   ✅ Found user with key: ${key}\n`);
        break;
      }
    }
    
    if (!userDocument) {
      console.log(`   ❌ User not found with any key\n`);
      
      // List first 10 users to debug
      console.log(`📋 Listing first 10 users in database for debugging:`);
      const sampleUsers = await userDataCollection.find({}).limit(10).toArray();
      if (sampleUsers.length > 0) {
        sampleUsers.forEach(u => {
          console.log(`   - ${u._id} (customGroupId: ${u.user_data?.customGroupId})`);
        });
      } else {
        console.log(`   ⚠️  Database appears to be empty`);
      }
      
      return;
    }
    
    const user_data = userDocument.user_data;
    console.log(`📊 User data found:`);
    console.log(`   Database key: ${usedKey}`);
    console.log(`   Username: ${user_data?.username || user_data?.github || 'N/A'}`);
    console.log(`   Custom Group ID: ${user_data?.customGroupId || 'N/A'}`);
    console.log(`   Points: ${user_data?.points || 0}`);
    console.log(`   XP: ${user_data?.xp || 0}`);
    console.log(`\n`);
    
    // STEP 2: Get quest config from the class configuration
    console.log(`📚 STEP 2: Loading quest configuration for class...`);
    
    // Get the class quest config from the database
    const classGroupId = user_data.customGroupId;
    const baseClassId = classGroupId.split('_')[0];  // Remove purple/test suffix
    
    // Try to load quest config from questconfigs collection
    const questconfigsCollection = doorwayDb.collection('questconfigs');
    let questConfigDoc = await questconfigsCollection.findOne({ 
      groupId: { $in: [classGroupId, baseClassId] }
    });
    
    // Fallback: try to find by regex if exact match fails
    if (!questConfigDoc) {
      questConfigDoc = await questconfigsCollection.findOne({
        groupId: { $regex: baseClassId }
      });
    }
    
    let questConfig = {};
    
    if (questConfigDoc && questConfigDoc.questSequence) {
      console.log(`   ✅ Found quest config with ${questConfigDoc.questSequence.length} quests`);
      
      // Convert questSequence format to legacy format
      for (const quest of questConfigDoc.questSequence) {
        const questId = quest.questId || quest.metadata?.questId;
        if (questId && quest.tasks) {
          questConfig[questId] = quest.tasks;
        }
      }
    } else {
      console.log(`   ⚠️  No quest config found, using user's accepted tasks structure`);
      // Fallback: build from accepted data
      const completionData = user_data.completed || user_data.accepted;
      if (completionData) {
        for (const questKey of Object.keys(completionData)) {
          if (questKey.startsWith('Q')) {
            questConfig[questKey] = completionData[questKey] || {};
          }
        }
      }
    }
    
    const questCount = Object.keys(questConfig).length;
    console.log(`   Quest config has ${questCount} quests\n`);
    
    // STEP 3: Calculate user's progress (LIVE data)
    console.log(`📈 STEP 3: Calculating user progress...`);
    const userCompletion = calculateOverallCompletion(user_data, questConfig) * 100;
    const points = Number(user_data?.points || 0);
    console.log(`   Overall Completion: ${userCompletion.toFixed(1)}%`);
    console.log(`   Points: ${points}`);
    console.log(`\n`);
    
    // STEP 4: Fetch class data and calculate rank
    console.log(`📊 STEP 4: Fetching class data and calculating rank...`);
    let classStudents = [];
    
    try {
      classStudents = await generateClassDataFromLocal(CLASS_ID, doorwayDb);
      console.log(`   Class has ${classStudents.length} students`);
    } catch (error) {
      console.warn(`   ⚠️  Could not fetch class data: ${error.message}`);
    }
    
    const classRank = calculateClassPercentile(userCompletion, classStudents, points);
    console.log(`   Class Rank: ${classRank.display} ${classRank.medal}`);
    console.log(`   Percentile: ${classRank.percentile.toFixed(1)}`);
    console.log(`\n`);
    
    // STEP 5: Get streak data
    console.log(`🔥 STEP 5: Retrieving streak data...`);
    const currentStreak = user_data?.currentStreak || 0;
    const streakCount = user_data?.streakCount || 0;
    console.log(`   Current Streak: ${currentStreak}/3`);
    console.log(`   Total Streaks: ${streakCount}`);
    console.log(`\n`);
    
    // FINAL SUMMARY
    console.log(`\n`);
    console.log(`🎯 ===== FINAL RESULTS =====`);
    console.log(`Student: ${user_data?.username || user_data?.github || usedKey}`);
    console.log(`Repository: ${TARGET_OWNER}/${TARGET_REPO}`);
    console.log(`\n📊 Statistics:`);
    console.log(`   Progress: ${userCompletion.toFixed(1)}%`);
    console.log(`   Class Rank: ${classRank.display} ${classRank.medal}`);
    console.log(`   Current Streak: ${currentStreak}/3`);
    console.log(`   Total Streaks: ${streakCount}`);
    console.log(`   Points: ${points}`);
    console.log(`   XP: ${user_data?.xp || 0}`);
    console.log(`\n✅ Data retrieved using README SVG pipeline`);
    
  } catch (error) {
    console.error(`\n❌ Error:`, error);
    throw error;
  } finally {
    if (doorwayClient) {
      await doorwayClient.close();
      console.log(`\n🔌 Database connection closed`);
    }
  }
}

main().catch(console.error);
