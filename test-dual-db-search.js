#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testDualDbSearch() {
    console.log('🔍 Testing Dual Database Search for Stored Values');
    console.log('='.repeat(60));
    
    const classId = '68aa7f5a8a69e6a01577e368';
    
    // Test both databases
    const databases = [
        { uri: process.env.URI, dbName: process.env.DB_NAME, name: 'Main DB (gamification-management)' },
        { uri: process.env.OSS_DOORWAY_DB_URI, dbName: process.env.OSS_DOORWAY_DB_NAME, name: 'OSS-Doorway Bot DB (test)' }
    ];
    
    console.log(`📋 Testing for Class ID: ${classId}`);
    console.log();
    
    const allValuesByUser = {};
    
    for (const dbConfig of databases) {
        console.log(`🔍 ${dbConfig.name}`);
        console.log(`   URI: ${dbConfig.uri ? 'Set' : 'NOT SET'}`);
        console.log(`   DB: ${dbConfig.dbName || 'NOT SET'}`);
        
        if (!dbConfig.uri || !dbConfig.dbName) {
            console.log(`   ❌ Environment variables missing`);
            continue;
        }
        
        try {
            const client = new MongoClient(dbConfig.uri);
            await client.connect();
            console.log(`   ✅ Connected successfully`);
            
            const db = client.db(dbConfig.dbName);
            const collection = db.collection('user_data');
            
            // Strategy 1: Find by customGroupId
            console.log(`   🔍 Strategy 1: Finding users by customGroupId: ${classId}`);
            let docs = await collection.find({ 'user_data.customGroupId': classId }, { projection: { user_data: 1, _id: 1 } }).toArray();
            console.log(`   📊 Found ${docs.length} users by customGroupId`);
            
            for (const doc of docs) {
                const stored = (doc.user_data && doc.user_data.storedValues) || {};
                if (Object.keys(stored).length > 0) {
                    allValuesByUser[doc._id] = stored;
                    console.log(`   ✅ User ${doc._id}: ${Object.keys(stored).join(', ')}`);
                    
                    // Show actual values
                    Object.entries(stored).forEach(([key, value]) => {
                        console.log(`      🎯 ${key}: "${value}"`);
                    });
                }
            }
            
            // Strategy 2: Find any users with stored values
            console.log(`   🔍 Strategy 2: Finding any users with stored values...`);
            const docsWithValues = await collection.find(
                { 'user_data.storedValues': { $exists: true, $ne: {} } },
                { projection: { user_data: 1, _id: 1 } }
            ).limit(10).toArray();
            
            console.log(`   📊 Found ${docsWithValues.length} users with stored values`);
            
            for (const doc of docsWithValues) {
                const stored = (doc.user_data && doc.user_data.storedValues) || {};
                if (Object.keys(stored).length > 0) {
                    if (!allValuesByUser[doc._id]) {
                        allValuesByUser[doc._id] = stored;
                        console.log(`   ✅ User ${doc._id}: ${Object.keys(stored).join(', ')}`);
                        
                        // Show actual values
                        Object.entries(stored).forEach(([key, value]) => {
                            console.log(`      🎯 ${key}: "${value}"`);
                        });
                    }
                }
            }
            
            // Strategy 3: Look for the specific user we know has data
            console.log(`   🔍 Strategy 3: Looking for specific user with collect-info data...`);
            const specificUser = 'acadcadcadcadcadcadcadcad-messages';
            const specificDoc = await collection.findOne({ _id: specificUser }, { projection: { user_data: 1, _id: 1 } });
            
            if (specificDoc) {
                console.log(`   ✅ Found specific user: ${specificUser}`);
                const stored = (specificDoc.user_data && specificDoc.user_data.storedValues) || {};
                if (Object.keys(stored).length > 0) {
                    if (!allValuesByUser[specificUser]) {
                        allValuesByUser[specificUser] = stored;
                    }
                    console.log(`   📊 Stored values: ${Object.keys(stored).join(', ')}`);
                    
                    Object.entries(stored).forEach(([key, value]) => {
                        console.log(`      🎯 ${key}: "${value}"`);
                    });
                } else {
                    console.log(`   ⚠️ User found but has no stored values`);
                }
            } else {
                console.log(`   ❌ Specific user not found: ${specificUser}`);
            }
            
            await client.close();
            console.log(`   ✅ Connection closed`);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log();
    }
    
    console.log('📊 FINAL RESULTS:');
    console.log(`   Total users found: ${Object.keys(allValuesByUser).length}`);
    
    if (Object.keys(allValuesByUser).length > 0) {
        console.log('   📋 All stored values:');
        Object.entries(allValuesByUser).forEach(([user, values]) => {
            console.log(`      👤 ${user}:`);
            Object.entries(values).forEach(([key, value]) => {
                console.log(`         🔑 ${key}: "${value}"`);
            });
        });
    } else {
        console.log('   ❌ No users with stored values found in either database');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Test completed');
}

testDualDbSearch().catch(console.error);
