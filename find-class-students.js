/**
 * Find all students in class 696ebe63b1aef30efd02e0f8
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ossEnvPath = resolve(__dirname, '../OSS-Doorway/.env');
dotenv.config({ path: ossEnvPath });

const DB_URI = process.env.URI;
const DB_NAME = process.env.DB_NAME;
const CLASS_ID = '696ebe63b1aef30efd02e0f8';

console.log(`🔍 Searching for students in class: ${CLASS_ID}\n`);

async function main() {
  const client = await MongoClient.connect(DB_URI);
  const db = client.db(DB_NAME);
  const collection = db.collection('user_data');
  
  // Search for students with this customGroupId
  const students = await collection.find({
    'user_data.customGroupId': CLASS_ID
  }).toArray();
  
  console.log(`📊 Found ${students.length} students in class ${CLASS_ID}:\n`);
  
  if (students.length === 0) {
    console.log(`   ⚠️  No students found. Let me check for variations...`);
    
    // Check for any students with customGroupId containing the class ID
    const variationStudents = await collection.find({
      'user_data.customGroupId': { $regex: CLASS_ID }
    }).toArray();
    
    if (variationStudents.length > 0) {
      console.log(`\n   Found ${variationStudents.length} students with variations:`);
      variationStudents.forEach(doc => {
        console.log(`     - ${doc._id} (customGroupId: ${doc.user_data?.customGroupId})`);
      });
    } else {
      console.log(`   Still no students found.\n`);
      
      // Show all unique customGroupIds to help debug
      const allGroupIds = await collection.distinct('user_data.customGroupId');
      console.log(`   All unique customGroupIds in database (first 20):`);
      allGroupIds.slice(0, 20).forEach(id => {
        if (id) console.log(`     - ${id}`);
      });
    }
  } else {
    students.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc._id}`);
      console.log(`   customGroupId: ${doc.user_data?.customGroupId}`);
      console.log(`   username: ${doc.user_data?.username || doc.user_data?.github || 'N/A'}`);
      console.log(`   points: ${doc.user_data?.points || 0}`);
      console.log(`   xp: ${doc.user_data?.xp || 0}`);
      
      // Check if this is our target student
      if (doc._id.includes('qmisandftc') || 
          doc.user_data?.username?.includes('qmisandftc') ||
          doc.user_data?.github?.includes('qmisandftc')) {
        console.log(`   🎯 THIS IS OUR TARGET STUDENT!`);
      }
      
      console.log(``);
    });
  }
  
  await client.close();
  console.log(`✅ Done`);
}

main().catch(console.error);
