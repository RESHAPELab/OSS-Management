/**
 * Test isClassAdmin function with just a repository name
 * Usage: node test-is-class-admin.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { MongoClient } from 'mongodb';

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

// Test repository name
const TEST_REPO = 'Asa-Henry-open-source-software-dev';
const TEST_USER = 'misanetc'; // The admin we found from the previous script

console.log(`🧪 Testing isClassAdmin with repository: ${TEST_REPO}`);
console.log(`   User: ${TEST_USER}\n`);

// Helper function to escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to generate variations of group names (hyphens vs spaces)
function generateGroupNameVariations(groupName) {
  const variations = [groupName];
  
  // Replace hyphens with spaces
  variations.push(groupName.replace(/-/g, ' '));
  
  // Replace spaces with hyphens (if any)
  variations.push(groupName.replace(/\s+/g, '-'));
  
  return [...new Set(variations)]; // Remove duplicates
}

// Helper function to generate all possible group names from a repository name
function generatePossibleGroupNames(repoName) {
  const parts = repoName.split('-');
  
  if (parts.length < 2) {
    return [];
  }
  
  const possibleNames = [];
  // Try removing 1, 2, 3, ... parts from the beginning
  for (let i = 1; i < parts.length; i++) {
    possibleNames.push(parts.slice(i).join('-'));
  }
  
  return possibleNames;
}

async function testIsClassAdmin() {
  const client = await MongoClient.connect(MANAGEMENT_DB_URI);
  
  try {
    const db = client.db(MANAGEMENT_DB_NAME);
    const groupsCollection = db.collection('groups');
    
    console.log(`✅ Connected to management database: ${MANAGEMENT_DB_NAME}\n`);
    
    // Generate possible group names
    const possibleGroupNames = generatePossibleGroupNames(TEST_REPO);
    console.log(`📋 Generated ${possibleGroupNames.length} possible group name(s):`);
    possibleGroupNames.forEach((name, i) => {
      console.log(`   ${i + 1}. ${name}`);
    });
    console.log();
    
    let group = null;
    let matchedGroupName = null;
    
    // Try each possible group name
    for (const groupName of possibleGroupNames) {
      console.log(`🔍 Looking for group: ${groupName}`);
      
      // First try exact match
      group = await groupsCollection.findOne({ groupName: groupName });
      
      // If not found, try case-insensitive search
      if (!group) {
        group = await groupsCollection.findOne({ 
          groupName: { $regex: new RegExp(`^${escapeRegex(groupName)}$`, 'i') }
        });
      }
      
      // If still not found, try searching for variations with spaces instead of hyphens
      if (!group) {
        const spaceVariations = generateGroupNameVariations(groupName);
        
        for (const variation of spaceVariations) {
          group = await groupsCollection.findOne({ 
            groupName: { $regex: new RegExp(`^${escapeRegex(variation)}$`, 'i') }
          });
          if (group) {
            console.log(`   ✅ Found group with variation: "${variation}"`);
            matchedGroupName = variation;
            break;
          }
        }
      }
      
      // If we found a group, stop trying other possibilities
      if (group) {
        console.log(`   ✅ Found group: ${group.groupName} (matched from: ${groupName})`);
        matchedGroupName = groupName;
        break;
      } else {
        console.log(`   ❌ Not found`);
      }
    }
    
    console.log();
    
    if (!group) {
      console.log(`❌ Group not found for repo: ${TEST_REPO}`);
      console.log(`   Tried: ${possibleGroupNames.join(', ')}`);
      return false;
    }
    
    console.log(`📋 GROUP FOUND:`);
    console.log(`=====================================`);
    console.log(`   ID: ${group._id}`);
    console.log(`   Name: ${group.groupName}`);
    console.log(`   Class Code: ${group.classCode || 'N/A'}`);
    console.log(`   Matched from: ${matchedGroupName}`);
    
    // Check if user is an admin
    console.log(`\n👥 CHECKING ADMIN STATUS:`);
    console.log(`=====================================`);
    
    if (!group.admins || !Array.isArray(group.admins)) {
      console.log(`   ⚠️  No admins array found in group`);
      return false;
    }
    
    console.log(`   Total admins in group: ${group.admins.length}`);
    
    // Check if the user is in the admins array
    const isAdmin = group.admins.some(admin => {
      const adminUsername = admin.githubUsername?.toLowerCase();
      const testUsername = TEST_USER.toLowerCase();
      return adminUsername === testUsername;
    });
    
    if (isAdmin) {
      const adminInfo = group.admins.find(admin => 
        admin.githubUsername?.toLowerCase() === TEST_USER.toLowerCase()
      );
      console.log(`\n   ✅ ${TEST_USER} IS an admin!`);
      console.log(`      Role: ${adminInfo.role || 'N/A'}`);
      if (adminInfo.addedAt) {
        console.log(`      Added: ${new Date(adminInfo.addedAt).toLocaleString()}`);
      }
      return true;
    } else {
      console.log(`\n   ❌ ${TEST_USER} is NOT an admin`);
      console.log(`\n   Available admins:`);
      group.admins.forEach((admin, i) => {
        console.log(`      ${i + 1}. ${admin.githubUsername} (${admin.role || 'N/A'})`);
      });
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error:`, error);
    return false;
  } finally {
    await client.close();
    console.log(`\n🔗 Database connection closed`);
  }
}

// Run the test
testIsClassAdmin().then(result => {
  console.log(`\n${result ? '✅ TEST PASSED' : '❌ TEST FAILED'}`);
  process.exit(result ? 0 : 1);
});
