# Purple Deploy with Auto-Unlock Feature

## Overview

The Purple Deploy feature has been enhanced to automatically unlock new quests for students who have completed the prerequisite quest. When you deploy a new quest (e.g., Q7), the system will:

1. **Find students who completed the prerequisite quest** (e.g., Q6)
2. **Locate their last closed issue** from the prerequisite quest
3. **Post an "accept Q7" comment** to that issue
4. **Automatically trigger quest acceptance** for those students

## How It Works

### Backend Process (`purpleDeployQuest`)

1. **Quest Deployment**: Creates new quest configuration with appended quest
2. **Prerequisite Analysis**: Identifies the prerequisite quest (e.g., Q6 for Q7)
3. **Student Discovery**: Finds all students who completed the prerequisite quest
4. **Auto-Unlock**: For each eligible student:
   - Gets their last 10 closed issues
   - Finds the most recent issue related to the prerequisite quest
   - Posts `/accept Q7` comment to that issue
   - Triggers automatic quest acceptance

### Frontend Integration

The frontend now shows detailed deployment information including:
- Number of students ready for the new quest
- Number of students automatically unlocked
- Success/failure status for auto-unlock

## Usage

### Via Frontend (GenerateJson.jsx)

1. Navigate to the class view
2. Go to "Generate JSON" section
3. Create a draft quest
4. Click "Purple Deploy" button
5. View deployment results with auto-unlock information

### Via API

```javascript
POST /api/gamification/purpleDeployQuest
{
  "classId": "your-class-id",
  "draftQuestData": {
    "title": "Advanced GitHub Collaboration",
    "metadata": {
      "type": "general",
      "description": "Learn advanced GitHub collaboration techniques"
    },
    "tasks": {
      "T1": {
        "desc": "Advanced Code Review",
        "points": 30,
        "xp": 30,
        "type": "mcq",
        // ... task configuration
      }
    }
  }
}
```

### Response Format

```json
{
  "message": "Successfully created new configuration with appended quest Q7 and migrated 25 users",
  "newQuestId": "Q7",
  "studentsReadyForNewQuest": 15,
  "autoUnlockedCount": 12,
  "migratedUsers": 25,
  "baseQuests": 6,
  "newTotalQuests": 7,
  "isPurpleDeployment": true
}
```

## Testing

Use the test script to verify the functionality:

```bash
node scripts/test-purple-deploy-with-auto-unlock.js
```

## Example Scenarios

### Scenario 1: Deploying Q7 when students completed Q6

1. **Input**: Deploy Q7 quest
2. **System Action**: 
   - Finds students who completed Q6
   - Posts `/accept Q7` to their last Q6 issue
   - Automatically accepts Q7 for those students
3. **Result**: Students immediately see Q7 available

### Scenario 2: Deploying Q7 when no students completed Q6

1. **Input**: Deploy Q7 quest
2. **System Action**: 
   - Finds no students who completed Q6
   - No auto-unlock performed
3. **Result**: Q7 will unlock automatically when students complete Q6

### Scenario 3: Deploying Q7 when some students completed Q6

1. **Input**: Deploy Q7 quest
2. **System Action**: 
   - Finds students who completed Q6
   - Auto-unlocks Q7 for those students
   - Other students remain unaffected
3. **Result**: Mixed state - some students have Q7, others don't

## Error Handling

- **No closed issues found**: Student won't be auto-unlocked
- **GitHub API errors**: Individual student failures logged
- **Database errors**: Deployment continues with partial success
- **Missing prerequisites**: Quest deployed but no auto-unlock

## Benefits

1. **Immediate Availability**: Students get new quests instantly
2. **Reduced Manual Work**: No need to manually unlock quests
3. **Consistent Experience**: All eligible students get the quest at the same time
4. **Audit Trail**: Comments provide clear history of quest unlocks
5. **Fallback Safety**: Students can still unlock manually if auto-unlock fails

## Configuration

The feature uses existing quest configuration with prerequisite metadata:

```json
{
  "questId": "Q7",
  "metadata": {
    "prerequisite": "Q6",
    "title": "Q7: Advanced GitHub Collaboration"
  }
}
```

## Monitoring

Check backend logs for detailed deployment information:
- `[PURPLE-DEPLOYMENT]` prefixed messages
- Auto-unlock success/failure counts
- Individual student processing results
- GitHub API interaction logs
