const { MongoClient } = require('mongodb');

// Configuration
const OSS_DOORWAY_URI = process.env.OSS_DOORWAY_DB_URI || 'mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification';
const OSS_DOORWAY_DB_NAME = process.env.OSS_DOORWAY_DB_NAME || 'test';

// Target class ID
const TARGET_CLASS_ID = '68af6952c6701208c3163453';

// Q2 Quest to append
const Q2_QUEST = {
  "Q2": {
    "metadata": {
      "title": "wdxcxaxdaxdaxddaxw",
      "description": "wqdxqxqxqxq",
      "prerequisite": "Q1",
      "type": "custom",
      "groupId": TARGET_CLASS_ID
    },
    "T1": {
      "type": "collect-info",
      "title": "xwdxqdxqdxw",
      "taskTitle": "xwdxqdxqdxw",
      "desc": "xwdxqdxqdxw",
      "points": 20,
      "xp": 20,
      "accept": "xwxqxqsxqsxqdxdq",
      "success": "✅ **Information Collected!**\n\nThank you for providing the requested information!\n\n**What you learned:** Information sharing is an important part of collaborative work.\n\n**Points earned:** 20\n\nGreat contribution! 📋",
      "error": "❌ **No Response Detected**\n\nIt looks like you haven't provided any information yet.\n\n**Please:** Type your response in the comment box below.\n\n**Note:** This is a non-graded task - any response will be accepted.",
      "answer": "",
      "correctAnswer": "",
      "question": "",
      "options": [
        {
          "label": "A",
          "value": ""
        },
        {
          "label": "B",
          "value": ""
        }
      ],
      "repository": "",
      "ossRepository": "",
      "issueNumber": "",
      "apiEndpoint": "",
      "responsePath": "",
      "expectedAnswerType": "Number",
      "enableTolerance": false,
      "toleranceRange": 10,
      "saveValidatedData": true,
      "savedDataName": "collected_info",
      "questions": [],
      "hints": [],
      "detailedHints": [],
      "llmTextValidation": {
        "question": "",
        "validationParameters": [],
        "temperature": 0.1,
        "enableDetailedFeedback": false
      },
      "questNotes": "",
      "answerType": ""
    }
  }
};

async function appendQ2Quest() {
    console.log(`🔍 Appending Q2 quest to class ID: ${TARGET_CLASS_ID}`);
    
    const client = new MongoClient(OSS_DOORWAY_URI);
    
    try {
        await client.connect();
        console.log(`✅ Connected to OSS-Doorway database`);
        
        const db = client.db(OSS_DOORWAY_DB_NAME);
        
        // Find the existing quest config
        const existingConfig = await db.collection('questconfigs').findOne({
            configId: TARGET_CLASS_ID
        });
        
        if (!existingConfig) {
            console.log(`❌ No existing quest config found for class ${TARGET_CLASS_ID}`);
            return;
        }
        
        console.log(`✅ Found existing quest config: ${existingConfig._id}`);
        console.log(`📋 Current quests: ${Object.keys(existingConfig.config).join(', ')}`);
        
        // Check if Q2 already exists
        if (existingConfig.config.Q2) {
            console.log(`⚠️ Q2 already exists in the configuration`);
            console.log(`Current Q2: ${JSON.stringify(existingConfig.config.Q2, null, 2)}`);
            return;
        }
        
        // Append Q2 to the existing config
        const updatedConfig = {
            ...existingConfig.config,
            ...Q2_QUEST
        };
        
        // Update the database
        const result = await db.collection('questconfigs').updateOne(
            { configId: TARGET_CLASS_ID },
            { 
                $set: { 
                    config: updatedConfig,
                    updatedAt: new Date(),
                    version: (existingConfig.version || 1) + 1
                }
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`✅ Successfully appended Q2 quest to the configuration`);
            console.log(`📊 Updated quests: ${Object.keys(updatedConfig).join(', ')}`);
            console.log(`🔄 Version updated to: ${(existingConfig.version || 1) + 1}`);
            
            // Save the updated config to a file
            const fs = require('fs');
            const filename = `updated_quest_config_${TARGET_CLASS_ID}.json`;
            fs.writeFileSync(filename, JSON.stringify({
                ...existingConfig,
                config: updatedConfig,
                updatedAt: new Date(),
                version: (existingConfig.version || 1) + 1
            }, null, 2));
            console.log(`💾 Updated config saved to: ${filename}`);
            
        } else {
            console.log(`❌ Failed to update the configuration`);
        }
        
    } catch (error) {
        console.error(`❌ Error:`, error);
    } finally {
        await client.close();
    }
}

console.log(`🚀 Appending Q2 quest to class ID: ${TARGET_CLASS_ID}`);
appendQ2Quest();
