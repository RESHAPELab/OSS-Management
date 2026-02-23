# Prerequisite Save Feature Test Plan

## What Was Implemented

### Frontend Changes (`OSS-Management/frontend/src/pages/class-view/QuestRoadmap.jsx`)

1. **Added State Management:**
   - `isSaving` - tracks save operation status
   - `saveStatus` - displays save status message to user
   - `saveTimeout` - manages debounced auto-save

2. **Added `saveDraftQuests()` Function:**
   - Saves draft quest config to backend API
   - Displays save status to user
   - Handles errors gracefully

3. **Updated `handlePrerequisiteChange()` Function:**
   - Updates local state when dropdown changes
   - Triggers debounced auto-save (1 second delay)
   - Clears previous save timeout to avoid duplicate saves

4. **Updated Dropdown `onChange` Handler:**
   - Calls `handlePrerequisiteChange()` instead of inline logic
   - Disables dropdown while saving
   - Cleaner, more maintainable code

5. **Added Save Status Indicator:**
   - Fixed position indicator in top-right corner
   - Shows "Saving...", "✅ Saved", or "❌ Error"
   - Color-coded: green for success, red for error, orange for saving
   - Auto-hides after 2-3 seconds

6. **Added Cleanup Effect:**
   - Clears timeout on component unmount
   - Prevents memory leaks

### Backend Changes (`OSS-Management/backend/controllers/groupController.js`)

1. **Enhanced `saveDraftQuestConfig()` Function:**
   - Saves to MongoDB (existing functionality)
   - **NEW:** Also writes to JSON file in `shared-quest-configs/quest_config_{classId}.json`
   - **NEW:** Creates timestamped backup file
   - File writing is non-blocking (won't fail API response if file write fails)

## How It Works

1. **User changes prerequisite dropdown:**
   - Dropdown onChange fires
   - Local state updates immediately (instant UI feedback)
   - 1-second debounce timer starts

2. **After 1 second of no changes:**
   - Auto-save triggers
   - Frontend sends POST request to `/api/group/{classId}/draft-quest-config`
   - Save status shows "Saving..."

3. **Backend processes request:**
   - Saves to MongoDB group document
   - Writes to `shared-quest-configs/quest_config_{classId}.json`
   - Creates timestamped backup
   - Returns success response

4. **Frontend receives response:**
   - Shows "✅ Saved" indicator
   - Status auto-hides after 2 seconds
   - User can refresh page and see their changes persisted

## Testing Steps

1. **Open Quest Roadmap page** for a class with draft quests
2. **Find a draft quest** that is movable (leaf node - no dependents)
3. **Change the prerequisite dropdown** to a different quest
4. **Observe:**
   - Dropdown updates immediately
   - "Saving..." appears in top-right after 1 second
   - "✅ Saved" appears after save completes
   - Status disappears after 2 seconds
5. **Refresh the page**
6. **Verify:** Prerequisite change is still there

## File Locations

### Draft Config Files Saved To:
- `OSS-Management/backend/shared-quest-configs/quest_config_{classId}.json`
- Backup: Same path with `.{timestamp}` suffix

### Bot Reads From:
- MongoDB: `Group.draftQuestConfig` field
- Fallback: `shared-quest-configs/quest_config_{classId}.json`
- Via `getQuestConfigForUser()` in `OSS-Doorway/src/gamification.js`

## Expected Behavior

✅ Prerequisite changes save automatically (no manual save button needed)
✅ Debouncing prevents excessive saves when changing multiple times
✅ Visual feedback shows save status
✅ Changes persist on page refresh
✅ Bot can read from JSON file
✅ Timestamped backups created for recovery
✅ MongoDB also updated for reliability

## Troubleshooting

**If save fails:**
- Check console logs for error messages
- Verify backend is running
- Check MongoDB connection
- Verify file write permissions to shared-quest-configs directory

**If changes don't persist:**
- Check that classId is correct
- Verify JSON file was created in shared-quest-configs
- Check MongoDB document was updated
- Clear ConfigService cache if needed

