/**
 * Test which environment variables are actually used by the application
 * This helps identify if we're missing any required variables
 */

// Simulate what the app does
const testVariables = {
  // Database connections
  URI: process.env.URI,
  MONGODB_URI: process.env.MONGODB_URI,
  OSS_DOORWAY_DB_URI: process.env.OSS_DOORWAY_DB_URI,
  DB_NAME: process.env.DB_NAME,
  OSS_DOORWAY_DB_NAME: process.env.OSS_DOORWAY_DB_NAME,
  
  // App config
  NODE_ENV: process.env.NODE_ENV,
  DISABLE_LOGS: process.env.DISABLE_LOGS,
  
  // GitHub
  GITHUB_APP_INSTALLATION_ID: process.env.GITHUB_APP_INSTALLATION_ID,
  OSS_DOORWAY_APP_ID: process.env.OSS_DOORWAY_APP_ID,
  GITHUB_ORG: process.env.GITHUB_ORG,
  
  // Other
  TASK_BUFFER_SIZE: process.env.TASK_BUFFER_SIZE,
  ENABLE_ENHANCED_QUESTS: process.env.ENABLE_ENHANCED_QUESTS,
};

console.log('🔍 Checking which environment variables are set:\n');

const required = [
  'URI',  // Used by OSS-Management/backend/config/db.js
  'OSS_DOORWAY_DB_URI',  // Used for OSS-Doorway connections
];

const optional = [
  'MONGODB_URI',
  'DB_NAME',
  'OSS_DOORWAY_DB_NAME',
  'NODE_ENV',
  'DISABLE_LOGS',
  'GITHUB_APP_INSTALLATION_ID',
  'OSS_DOORWAY_APP_ID',
  'GITHUB_ORG',
  'TASK_BUFFER_SIZE',
  'ENABLE_ENHANCED_QUESTS',
];

console.log('📋 REQUIRED VARIABLES:');
required.forEach(varName => {
  const value = testVariables[varName];
  if (value) {
    // Mask sensitive values
    let displayValue = value;
    if (varName.includes('URI') && value.includes('mongodb+srv://')) {
      const match = value.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/);
      if (match) {
        displayValue = `mongodb+srv://${match[1]}:***@${value.split('@')[1]}`;
      }
    }
    console.log(`  ✅ ${varName} = ${displayValue.substring(0, 80)}...`);
  } else {
    console.log(`  ❌ ${varName} = NOT SET`);
  }
});

console.log('\n📋 OPTIONAL VARIABLES:');
optional.forEach(varName => {
  const value = testVariables[varName];
  if (value) {
    console.log(`  ✅ ${varName} = ${value}`);
  } else {
    console.log(`  ⚠️  ${varName} = NOT SET (optional)`);
  }
});

// Check what the app actually uses
console.log('\n🔍 What the app code uses:');
console.log('  - OSS-Management/backend/config/db.js uses: process.env.URI');
console.log('  - OSS-Doorway connections use: process.env.OSS_DOORWAY_DB_URI');

// Recommendations
console.log('\n💡 RECOMMENDATIONS:');
const missingRequired = required.filter(v => !testVariables[v]);
if (missingRequired.length > 0) {
  console.log(`  ❌ Missing required variables: ${missingRequired.join(', ')}`);
} else {
  console.log('  ✅ All required variables are set');
}

// Check for potential issues
console.log('\n⚠️  POTENTIAL ISSUES:');
if (testVariables.URI && testVariables.MONGODB_URI && testVariables.URI !== testVariables.MONGODB_URI) {
  console.log('  ⚠️  URI and MONGODB_URI are different - make sure this is intentional');
}

if (testVariables.NODE_ENV === 'production' && !testVariables.DISABLE_LOGS) {
  console.log('  ℹ️  NODE_ENV is production but DISABLE_LOGS is not set');
}
