# 5 Places Where OSS-Doorway Pulls Config From Database

## Location 1: PRIMARY DATABASE QUERY
**File:** `OSS-Doorway/src/services/configService.js`  
**Function:** `loadConfigFromDatabase(groupId)`  
**Lines:** 121-192

```javascript
static async loadConfigFromDatabase(groupId) {
  // Line 135: EXACT connection method
  const connection = mongoose.createConnection(`${ossDoorwayURI}/${ossDoorwayDBName}`);
  
  // Lines 138-150: EXACT schema
  const questConfigSchema = new mongoose.Schema({
    groupId: String,
    configId: String,
    classId: String,
    configData: Object,
    config: mongoose.Schema.Types.Mixed,
    // ... other fields
  }, { collection: 'questconfigs' });
  
  // Lines 155-161: EXACT query
  const config = await QuestConfig.findOne({
    $or: [
      { groupId: groupId },
      { configId: groupId },
      { classId: groupId }
    ]
  });
  
  // Lines 169-183: Extract config data
  let configData = config.configData || config.config;
  if (typeof configData === 'string') {
    configData = JSON.parse(configData);
  }
  return configData;
}
```

**This is the ONLY place that actually queries the database.**

---

## Location 2: CALLED FROM loadConfig (Priority 1)
**File:** `OSS-Doorway/src/services/configService.js`  
**Function:** `loadConfig(groupId)`  
**Lines:** 216-295

```javascript
static async loadConfig(groupId) {
  // Line 221-227: Check cache first
  const cacheKey = `quest-config-${groupId}`;
  if (questConfigCache.has(cacheKey)) {
    return cachedConfig; // Returns cached, NO database query
  }
  
  // Lines 229-250: Try database (Priority 1)
  try {
    const dbConfig = await this.retryWithBackoff(
      async () => await this.loadConfigFromDatabase(groupId), // <-- CALLS Location 1
      `database lookup for ${groupId}`,
      { retries: 4, baseDelayMs: 250, factor: 2, maxDelayMs: 2000, jitter: true }
    );
    
    if (dbConfig) {
      questConfigCache.set(cacheKey, dbConfig, 3600000); // Cache for 1 hour
      return dbConfig;
    }
  } catch (error) {
    // Falls back to file
  }
  
  // Lines 255-286: Fallback to file (Priority 2)
  // ...
}
```

**This calls Location 1 with retry logic.**

---

## Location 3: CALLED FROM getGroupQuestConfig
**File:** `OSS-Doorway/src/config/questConfigGenerator.js`  
**Function:** `getGroupQuestConfig(groupId)`  
**Lines:** 165-183

```javascript
export async function getGroupQuestConfig(groupId) {
  try {
    console.log(`🔍 [QUEST-CONFIG-LOAD] Loading config for group: ${groupId}`);
    
    // Line 170: Calls ConfigService.loadConfig which calls Location 2
    const config = await ConfigService.loadConfig(groupId);
    // ConfigService.loadConfig -> calls loadConfigFromDatabase (Location 1)
    
    if (config) {
      return config;
    }
    
    throw new Error(`No config found for group: ${groupId}`);
  } catch (error) {
    throw error;
  }
}
```

**This calls Location 2, which calls Location 1.**

---

## Location 4: CALLED FROM getQuestConfigForUser
**File:** `OSS-Doorway/src/gamification.js`  
**Function:** `getQuestConfigForUser(user_data)`  
**Lines:** 175-266

```javascript
async function getQuestConfigForUser(user_data) {
  // Line 181-186: Check processed cache first
  const cacheKey = `processed-quest-config-${user_data?.customGroupId || 'default'}`;
  if (ConfigService.has(cacheKey)) {
    return cachedConfig; // Returns cached, NO database query
  }
  
  // Lines 193-216: Load group config
  if (user_data && user_data.customGroupId) {
    try {
      // Line 198: Calls getGroupQuestConfig (Location 3)
      const result = await getGroupQuestConfig(user_data.customGroupId);
      // getGroupQuestConfig -> ConfigService.loadConfig -> loadConfigFromDatabase (Location 1)
      
      if (result) {
        questConfig = result;
        
        // Lines 205-209: Convert questSequence if needed
        if (Array.isArray(questConfig?.questSequence)) {
          questConfig = await convertQuestSequenceToLegacy(questConfig);
        }
      }
    } catch (error) {
      // Falls back to default
    }
  }
  
  // Line 258-261: Cache processed config
  ConfigService.set(cacheKey, questConfig, 3600000);
  return questConfig;
}
```

**This calls Location 3, which calls Location 2, which calls Location 1.**

---

## Location 5: USED IN validateTask (Most Common Call Site)
**File:** `OSS-Doorway/src/gamification.js`  
**Function:** `validateTask(user_data, context, user, db)`  
**Lines:** 1324-1601

```javascript
async function validateTask(user_data, context, user, db) {
  // ... task detection logic ...
  
  // Line 1409: Get quest config for user
  const userQuestConfig = await getQuestConfigForUser(user_data);
  // getQuestConfigForUser -> getGroupQuestConfig -> ConfigService.loadConfig -> loadConfigFromDatabase (Location 1)
  
  // Line 1410: Build dynamic task mapping
  const dynamicTaskMapping = buildDynamicTaskMapping(userQuestConfig);
  
  // Line 1419: Get task handler
  const taskHandler = dynamicTaskMapping[quest]?.[task] || taskMapping[quest]?.[task];
  
  // Line 1426: Get response from quest config
  const taskQuestData = userQuestConfig[quest];
  // ...
}
```

**This calls Location 4, which calls Location 3, which calls Location 2, which calls Location 1.**

---

## Summary: The Call Chain

```
validateTask() [Location 5]
  ↓
getQuestConfigForUser() [Location 4]
  ↓ (checks processed cache first)
getGroupQuestConfig() [Location 3]
  ↓
ConfigService.loadConfig() [Location 2]
  ↓ (checks raw cache first)
  ↓ (tries database with retry)
loadConfigFromDatabase() [Location 1] ⭐ ACTUAL DATABASE QUERY
  ↓
QuestConfig.findOne({ $or: [{groupId}, {configId}, {classId}] })
```

## Key Points:

1. **Location 1** is the ONLY place that actually queries MongoDB
2. **Location 2** adds caching and retry logic
3. **Locations 3-5** are wrapper functions that eventually call Location 1
4. **Two cache layers:**
   - `quest-config-{groupId}` - Raw config (Location 2)
   - `processed-quest-config-{groupId}` - Converted config (Location 4)
5. **Database query happens ONLY if:**
   - Both caches miss
   - Database query succeeds (with retries)
   - Returns config data

## The Exact Database Query:

```javascript
// File: OSS-Doorway/src/services/configService.js
// Lines: 155-161

const config = await QuestConfig.findOne({
  $or: [
    { groupId: groupId },
    { configId: groupId },
    { classId: groupId }
  ]
});
```

**This is the query that finds your config in the database.**


