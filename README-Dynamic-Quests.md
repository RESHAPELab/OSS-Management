# Dynamic Quest System Integration

## Overview

The OSS-Doorway bot now supports dynamic quest configurations that can be customized per class. This system allows professors to create custom quests and arrange them in any order, with the bot automatically using the appropriate configuration for each student repository.

## How It Works

### 1. **Quest Creation & Management**
- Professors create custom MCQ quests through the management interface
- Quests are stored in MongoDB with full task details
- Quest order can be customized with drag-and-drop interface
- Dynamic prerequisites are automatically generated based on quest order

### 2. **Dynamic Config Generation**
- When quests are created, edited, or reordered, a dynamic config is automatically generated
- Config includes both fixed quests (Q0, Q4, Q1, Q2, Q3) and custom quests in the correct order
- Config is saved as `quest_config_{classId}.json` in the bot's config directory

### 3. **Bot Integration**
- Bot detects repository name pattern (e.g., `cs-277-oss-in-theory-username`)
- Bot looks up the corresponding class ID via management API
- Bot loads the class-specific dynamic config if available
- Bot falls back to default config if no dynamic config exists

## File Structure

```
OSS-Management/
├── backend/
│   ├── services/DynamicQuestConfigGenerator.js  # Generates dynamic configs
│   ├── controllers/groupController.js           # Handles quest order
│   └── routes/questConfigRoutes.js              # API endpoints
└── frontend/
    └── src/pages/class-view/ClassView.jsx       # Quest management UI

OSS-Doorway/
├── src/
│   ├── config/
│   │   ├── generated/                           # Dynamic configs stored here
│   │   │   └── quest_config_{classId}.json
│   │   └── quest_config.json                    # Default fallback config
│   ├── gamification.js                          # Updated quest loading
│   └── index.js                                 # Updated main entry point
```

## API Endpoints

### Quest Management
- `POST /api/quest/upload-mcq` - Create new MCQ quest
- `GET /api/quest/professor/:professorId` - Get professor's quests
- `PUT /api/quest/:questId` - Update quest
- `DELETE /api/quest/:questId` - Delete quest

### Quest Order Management
- `POST /api/group/:classId/quest-order` - Save quest order
- `GET /api/group/:classId/quest-order` - Get quest order
- `POST /api/group/:classId/quest-order/reset` - Reset to default

### Dynamic Config Generation
- `POST /api/quest-config/generate/:classId` - Generate dynamic config
- `GET /api/quest-config/:classId` - Get generated config

### Class Lookup
- `GET /api/group/repo/:repoName/class` - Get class ID from repository name

## Configuration

### Environment Variables

**Management Backend (.env):**
```bash
PORT=8080
MONGODB_URI=your_mongodb_uri
```

**Bot (.env):**
```bash
MANAGEMENT_API_URL=http://localhost:8080
URI=your_mongodb_uri
DB_NAME=your_database_name
```

### Repository Naming Convention

The system expects repositories to follow this pattern:
```
cs-{courseNumber}-{subject}-{courseName}-{username}
```

Example: `cs-277-oss-in-theory-johndoe`

## Testing

Run the integration test to verify everything works:

```bash
cd OSS-Management/backend
node test-dynamic-integration.js
```

## Troubleshooting

### Common Issues

1. **Bot can't find dynamic config**
   - Check that the management API is running
   - Verify the config file exists in `OSS-Doorway/src/config/generated/`
   - Check repository naming pattern matches expected format

2. **Dynamic config not generated**
   - Ensure quest order is saved in the database
   - Check that custom quests exist for the class
   - Verify the dynamic config generator service is working

3. **Class ID lookup fails**
   - Check that the class exists in the database
   - Verify the class code matches the repository pattern
   - Ensure the class is marked as active

### Debug Logs

The bot will log its quest loading process:
```
🎯 Loading quest config for class 507f1f77bcf86cd799439011 (repo: cs-277-oss-in-theory-johndoe)
📁 Loading dynamic quest config for class 507f1f77bcf86cd799439011
✅ Dynamic quest config loaded for class 507f1f77bcf86cd799439011
```

## Future Enhancements

1. **Real-time Config Updates**: WebSocket integration for instant config updates
2. **Multiple Quest Types**: Support for different quest formats beyond MCQ
3. **Advanced Prerequisites**: Score-based and custom prerequisite logic
4. **Quest Templates**: Pre-built quest templates for common scenarios
5. **Analytics**: Track quest completion rates and student progress

## Support

For issues or questions about the dynamic quest system, check:
1. Management backend logs
2. Bot logs
3. Database connectivity
4. File permissions for config directory 