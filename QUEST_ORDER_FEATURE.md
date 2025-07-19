# Quest Order Arrangement Feature

## Overview
This feature allows professors to reorder quests (both fixed Q0, Q4, Q1, Q2, Q3 and custom quests) and save the arrangement to MongoDB. The quest order is persisted per group/class and can be retrieved by the bot to present quests in the same order.

## Database Schema Changes

### Group Model Updates
Added to `OSS-Management/backend/models/GroupModel.js`:

```javascript
questOrder: [{
    questId: String, // "Q0", "Q1", etc. for fixed quests or ObjectId for custom quests
    questType: String, // "fixed" or "custom"
    sequenceNumber: Number,
    title: String,
    isQ0: Boolean
}],
questOrderLastUpdated: Date
```

## API Endpoints

### Save Quest Order
- **POST** `/api/group/:groupId/quest-order`
- **Body**: `{ questOrder: [...] }`
- **Response**: Success message with saved quest order

### Get Quest Order
- **GET** `/api/group/:groupId/quest-order`
- **Response**: Quest order array with metadata

### Reset Quest Order
- **POST** `/api/group/:groupId/quest-order/reset`
- **Response**: Success message with default quest order

## Frontend Integration

### Key Functions Added
1. `loadQuestOrderFromDatabase()` - Loads quest order from MongoDB
2. `saveQuestOrderToDatabase(questOrder)` - Saves quest order to MongoDB
3. `resetQuestOrderToDefault()` - Resets to default order

### Updated Move Functions
All quest move functions now automatically save changes to MongoDB:
- `moveQuestUp()`
- `moveQuestDown()`
- `moveFixedQuestUp()`
- `moveFixedQuestDown()`

### UI Enhancements
- Added "Reset Quest Order" button
- Added save status indicator
- Loading states for database operations

## Usage

### For Professors
1. **Reorder Quests**: Use up/down arrows to reorder quests in the Course Outline
2. **Save Automatically**: Changes are automatically saved to MongoDB
3. **Reset Order**: Click "Reset Quest Order" to return to default arrangement
4. **View Status**: See save status indicators during operations

### For Bot Integration
1. **Read Quest Order**: Bot can fetch quest order via API
2. **Present in Order**: Bot presents quests in the saved order
3. **Fallback**: If no custom order exists, use default Q0, Q4, Q1, Q2, Q3 order

## Data Flow

1. **Frontend Reorder** → **Save to MongoDB** → **Bot Reads Order** → **Present to Students**

2. **Quest Creation/Deletion** → **Refresh Order from DB** → **Update UI**

## Testing

Run the test script to verify functionality:
```bash
cd OSS-Management/backend
node test-quest-order.js
```

## Benefits

- **Persistence**: Quest order survives server restarts
- **Per-group Customization**: Each class can have unique quest order
- **Real-time Updates**: Changes immediately affect bot behavior
- **Backward Compatibility**: Falls back to default order if needed
- **Version Control**: Tracks when quest order was last updated

## Future Enhancements

- Quest order templates for different course types
- Bulk quest order operations
- Quest order validation (prerequisites, dependencies)
- Quest order analytics and reporting 