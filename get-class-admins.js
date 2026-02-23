/**
 * Get class admins for a given class ID
 * Usage: node get-class-admins.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { MongoClient, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const managementEnvPath = resolve(__dirname, '.env');
dotenv.config({ path: managementEnvPath });

// SECURITY: Never hardcode credentials. Always use environment variables.
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable is required');
  console.error('   Please set it in your .env file');
  process.exit(1);
}
const MANAGEMENT_DB_URI = process.env.MONGODB_URI;
const MANAGEMENT_DB_NAME = process.env.MONGODB_DB_NAME || 'management';
const CLASS_ID = '696ebe63b1aef30efd02e0f8';

console.log(`🔍 Getting admins for class: ${CLASS_ID}\n`);

async function main() {
  const client = await MongoClient.connect(MANAGEMENT_DB_URI);
  
  try {
    const db = client.db(MANAGEMENT_DB_NAME);
    const groupsCollection = db.collection('groups');
    
    console.log(`✅ Connected to management database: ${MANAGEMENT_DB_NAME}`);
    
    // Try to find the group by _id (as ObjectId first, then as string)
    let group = null;
    
    try {
      group = await groupsCollection.findOne({ _id: new ObjectId(CLASS_ID) });
      if (group) {
        console.log(`✅ Found group using ObjectId`);
      }
    } catch (e) {
      // Try as string
      group = await groupsCollection.findOne({ _id: CLASS_ID });
      if (group) {
        console.log(`✅ Found group using string ID`);
      }
    }
    
    if (!group) {
      console.log(`❌ Group not found with ID: ${CLASS_ID}`);
      console.log(`\n💡 Trying to find by classCode or groupName...`);
      
      // Try to find by classCode
      group = await groupsCollection.findOne({ classCode: CLASS_ID });
      if (group) {
        console.log(`✅ Found group by classCode`);
      }
    }
    
    if (!group) {
      console.log(`❌ Group not found. Please verify the class ID.`);
      return;
    }
    
    console.log(`\n📋 GROUP INFORMATION:`);
    console.log(`=====================================`);
    console.log(`   ID: ${group._id}`);
    console.log(`   Name: ${group.groupName || 'N/A'}`);
    console.log(`   Class Code: ${group.classCode || 'N/A'}`);
    console.log(`   Active: ${group.active !== false ? 'Yes' : 'No'}`);
    
    // Display admins
    console.log(`\n👥 ADMINS (${group.admins?.length || 0}):`);
    console.log(`=====================================`);
    
    if (!group.admins || !Array.isArray(group.admins) || group.admins.length === 0) {
      console.log(`   ⚠️  No admins found for this class.`);
    } else {
      group.admins.forEach((admin, index) => {
        console.log(`\n   ${index + 1}. ${admin.githubUsername || 'N/A'}`);
        console.log(`      Role: ${admin.role || 'N/A'}`);
        if (admin.addedAt) {
          console.log(`      Added: ${new Date(admin.addedAt).toLocaleString()}`);
        }
        if (admin.addedBy) {
          console.log(`      Added By: ${admin.addedBy}`);
        }
      });
    }
    
    // Also check the old 'admin' field (if it exists)
    if (group.admin && Array.isArray(group.admin) && group.admin.length > 0) {
      console.log(`\n⚠️  Found ${group.admin.length} admin(s) in legacy 'admin' field:`);
      group.admin.forEach((adminId, index) => {
        console.log(`   ${index + 1}. ${adminId}`);
      });
    }
    
    console.log(`\n✅ Done!`);
    
  } catch (error) {
    console.error(`❌ Error:`, error);
  } finally {
    await client.close();
    console.log(`\n🔗 Database connection closed`);
  }
}

main();
