/**
 * Verify purple config save logic
 * This script traces through the exact code path to see what gets saved
 */

console.log('🔍 Analyzing Purple Config Save Logic');
console.log('='.repeat(80));

console.log('\n📋 STEP 1: Find Existing Config');
console.log('Code: Line 1215-1221');
console.log(`
existingConfig = await questConfigsCollection.findOne({
    $or: [
        { classId: classId },
        { groupId: classId },
        { configId: classId }
    ]
});
`);
console.log('✅ This finds the original config (not purple)');

console.log('\n📋 STEP 2: Check for Latest Purple Config');
console.log('Code: Line 1236-1239');
console.log(`
const latestPurpleConfig = await questConfigsCollection.findOne(
    { classId: { $regex: new RegExp(\`^\${classId}_purple_\`) } },
    { sort: { createdAt: -1 } }
);
`);
console.log('✅ This finds the most recent purple config if it exists');

console.log('\n📋 STEP 3: Determine Config Format');
console.log('Code: Line 1245-1261');
console.log(`
if (configToAnalyze.questSequence && Array.isArray(configToAnalyze.questSequence)) {
    existingQuests = configToAnalyze.questSequence;
    configData = configToAnalyze;  // ⚠️ THIS IS THE KEY!
} else {
    // Legacy format
    configData = null;  // ⚠️ configData is NOT set!
}
`);
console.log('⚠️ ISSUE: If config is in legacy format, configData is null!');

console.log('\n📋 STEP 4: Create updatedConfig');
console.log('Code: Line 1302-1332');
console.log(`
if (configData) {
    // New format: append to questSequence
    updatedConfig = {
        ...configData,  // ⚠️ Spreads entire MongoDB document!
        questSequence: [...existingQuests, newQuest]
    };
} else {
    // Legacy format
    updatedConfig = {
        ...configToAnalyze,  // ⚠️ Spreads entire MongoDB document!
        config: updatedConfigData
    };
}
`);
console.log('⚠️ ISSUE: Spreading configData/configToAnalyze includes MongoDB _id and other fields!');

console.log('\n📋 STEP 5: Create newConfig');
console.log('Code: Line 1355-1367');
console.log(`
const newConfig = {
    ...updatedConfig,  // ⚠️ Includes _id from original config!
    _id: new mongoose.Types.ObjectId(),  // ✅ Overwrites _id
    classId: \`\${classId}_purple_\${Date.now()}\`,
    // ... other fields
};
`);
console.log('⚠️ ISSUE: newConfig might have duplicate/conflicting fields from spread!');

console.log('\n📋 STEP 6: Save to Database');
console.log('Code: Line 1387');
console.log(`
await questConfigsCollection.insertOne(newConfig);
`);
console.log('✅ This should save the config');

console.log('\n\n🔴 POTENTIAL ISSUES:');
console.log('='.repeat(80));

console.log('\n1. configData Structure Issue');
console.log('   - If config has questSequence: configData = full MongoDB document');
console.log('   - Spreading configData includes: _id, createdAt, updatedAt, etc.');
console.log('   - These get overwritten, but might cause issues');

console.log('\n2. Legacy Format Issue');
console.log('   - If config is legacy format: configData = null');
console.log('   - Uses configToAnalyze.config instead');
console.log('   - But configToAnalyze is the full MongoDB document');
console.log('   - Spreading it includes all MongoDB fields');

console.log('\n3. Missing Format Fields');
console.log('   - If original config only has "config" field (legacy)');
console.log('   - newConfig will have "config" but might not have "questSequence"');
console.log('   - This could cause issues when frontend tries to read it');

console.log('\n4. Database Connection');
console.log('   - Uses: process.env.OSS_DOORWAY_DB_URI');
console.log('   - Database: process.env.OSS_DOORWAY_DB_NAME (default: "test")');
console.log('   - Collection: "questconfigs"');
console.log('   - If wrong database/collection, configs won\'t be found');

console.log('\n5. Error Handling');
console.log('   - If insertOne fails, error is caught at line 1789');
console.log('   - But error might not show what actually failed');
console.log('   - No verification query after insert');

console.log('\n\n✅ RECOMMENDED FIXES:');
console.log('='.repeat(80));

console.log('\n1. Clean up configData before spreading');
console.log(`
// Instead of:
updatedConfig = { ...configData, questSequence: [...] };

// Do:
const { _id, createdAt, updatedAt, ...cleanConfigData } = configData;
updatedConfig = {
    ...cleanConfigData,
    questSequence: [...existingQuests, newQuest]
};
`);

console.log('\n2. Ensure all formats are included');
console.log(`
// When creating newConfig, ensure it has:
- questSequence (modern format)
- config (legacy format)  
- configData (full copy)
`);

console.log('\n3. Add verification after save');
console.log(`
const verifyConfig = await questConfigsCollection.findOne({
    classId: newConfig.classId
});
if (!verifyConfig) {
    throw new Error('Config was not saved!');
}
`);

console.log('\n4. Add better error logging');
console.log(`
try {
    await questConfigsCollection.insertOne(newConfig);
} catch (insertError) {
    console.error('Insert failed:', insertError);
    console.error('Config classId:', newConfig.classId);
    console.error('Config keys:', Object.keys(newConfig));
    throw insertError;
}
`);
