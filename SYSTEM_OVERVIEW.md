# OSS-Management System - Complete Overview

## 🎯 System Purpose

The **OSS-Management** (Open Source Software Management) system is a comprehensive gamified learning platform that helps professors create, manage, and deploy quest-based curricula for teaching open-source software development. Students complete quests (educational tasks) through GitHub interactions, earning points, XP, and badges as they progress.

---

## 🏗️ System Architecture

### **Multi-Service Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    OSS-Management System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │   Frontend       │    │   Backend API    │               │
│  │   (React)        │◄───┤   (Express.js)   │               │
│  │   Port 3000      │    │   Port 8080      │               │
│  └──────────────────┘    └────────┬─────────┘               │
│                                    │                          │
│                          ┌─────────┴─────────┐               │
│                          │                   │               │
│                  ┌───────▼──────┐  ┌────────▼─────────┐     │
│                  │   MongoDB    │  │  Bot Service     │     │
│                  │  Database    │  │  Port 10000      │     │
│                  │              │  └────────┬─────────┘     │
│                  └──────────────┘           │                │
│                                              │                │
│                                     ┌────────▼─────────┐     │
│                                     │   GitHub API     │     │
│                                     │  (GitHub App)    │     │
│                                     └──────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              OSS-Doorway (Separate Service)                   │
│              Handles quest execution via webhooks             │
└─────────────────────────────────────────────────────────────┘
```

### **Key Services**

1. **Frontend (React.js)** - Port 3000
   - User interface for professors and students
   - React Router for navigation
   - Material-UI components
   - Real-time updates via Socket.IO

2. **Backend API (Express.js)** - Port 8080
   - RESTful API endpoints
   - Authentication & authorization
   - Business logic & data management
   - Socket.IO server for real-time updates
   - MongoDB integration

3. **Bot Service** - Port 10000 (Self-contained)
   - GitHub repository operations
   - Repository creation & management
   - GitHub App authentication
   - Independent deployment capability

4. **OSS-Doorway Bot** - Port 4000 (External)
   - Quest execution & validation
   - GitHub webhook handling
   - Student progress tracking
   - Task validation logic

5. **MongoDB Database**
   - Stores all application data
   - Separate databases for OSS-Management and OSS-Doorway
   - In-memory database for testing

---

## 👥 User Roles & Workflows

### **1. Professor Workflow**

#### **Registration & Authentication**
- Receives invitation code via email
- Verifies code → Creates account with email, name, password
- Email verification required
- JWT-based authentication with cookies

#### **Class Management**
- **Create Class/Group**: Sets up a new class with unique class code
- **Configure Quest Sequence**: 
  - Uses `GenerateJson.jsx` to create quest configurations
  - Supports both fixed quests (Q0, Q1, Q2...) and custom quests
  - Draft quest system for work-in-progress quests
  - Quest prerequisites and dependencies
- **Manage Students**: Add students individually or via CSV import
- **Manage Admins**: Add teaching assistants, graders, etc.
- **Deploy Quest Config**: Publish quest configurations to students

#### **Key Professor Pages**
- **Home** (`Home.jsx`): Dashboard showing all classes
- **ClassView** (`ClassView.jsx`): Main class management interface
- **GenerateJson** (`GenerateJson.jsx`): Quest configuration builder
- **QuestRoadmap** (`QuestRoadmap.jsx`): Visual quest dependency graph
- **ManageQuests** (`ManageQuests.jsx`): Quest editing and management
- **ManageStudents** (`ManageStudents.jsx`): Student roster management
- **ManageAdmins** (`ManageAdmins.jsx`): Admin/TA management

### **2. Student Workflow**

#### **Registration**
- Uses class code from professor
- Registers with: first name, last name, GitHub username, email
- System automatically:
  1. Creates student account
  2. Adds student to class/group
  3. Creates GitHub repository (via Bot Service)
  4. Sets up initial quest structure (via OSS-Doorway)

#### **Quest Execution**
- Receives quest instructions via GitHub issues
- Completes tasks by:
  - Creating pull requests
  - Answering multiple-choice questions
  - Submitting code
  - Completing GitHub operations
- Progress tracked automatically via GitHub webhooks
- Receives feedback and unlocks next quests

---

## 📊 Data Models

### **Core Models**

#### **1. Group/Class Model** (`GroupModel.js`)
```javascript
{
  groupName: String,
  classCode: String (unique),
  professor: ObjectId (ref: Professor),
  students: [ObjectId] (ref: Student),
  admins: [{githubUsername, role, addedAt, addedBy}],
  questOrder: [{
    questId: String,
    questType: 'fixed' | 'custom',
    sequenceNumber: Number,
    title: String,
    isQ0: Boolean,
    prerequisites: [...]
  }],
  questJsonConfig: Object,  // Published quest config
  draftQuestConfig: Object, // Work-in-progress quests
  repositoryPattern: String, // e.g., 'cs-{classCode}-{username}'
  active: Boolean
}
```

#### **2. Quest Model** (`QuestModel.js`)
```javascript
{
  questTitle: String,
  professor: ObjectId,
  tasks: [ObjectId] (ref: Task),
  questType: 'fixed' | 'custom',
  metadata: {
    title: String,
    prerequisite: String | null,
    description: String,
    type: String
  }
}
```

#### **3. Task Model** (`TaskModel.js`)
```javascript
{
  quest: ObjectId (ref: Quest),
  professor: ObjectId,
  title: String,
  desc: String,
  type: String,  // See Task Types below
  points: Number,
  xp: Number,
  answer: String,
  answerType: String,
  // ... task-specific configuration
}
```

#### **4. Student Model** (`StudentModel.js`)
```javascript
{
  firstName: String,
  lastName: String,
  githubUsername: String,
  studentEmail: String (unique),
  groups: [ObjectId] (ref: Group)
}
```

#### **5. Professor Model** (`ProfessorModel.js`)
```javascript
{
  email: String (unique),
  name: String,
  password: String (hashed),
  githubUsername: String,
  verified: Boolean,
  isAdmin: Boolean,
  verificationCode: String
}
```

#### **6. QuestConfig Model** (`QuestConfigModel.js`)
```javascript
{
  groupId: String (unique),
  configData: Mixed,  // Complete quest JSON configuration
  createdAt: Date,
  updatedAt: Date
}
```

#### **7. Progress Tracking Models**
- **UserQuestProgressModel**: Student progress per quest
- **UserTaskProgressModel**: Student progress per task
- **UserRepoModel**: Student repository information
- **UserStoredData**: Data saved across tasks (for collect-info tasks)
- **QuestCompletionModel**: Quest completion records

---

## 🎮 Quest System

### **Quest Types**

#### **1. Fixed Quests**
- Pre-defined quests (Q0, Q1, Q2, etc.)
- Standard structure across all classes
- Examples: Q0 (Setup), Q1 (GitHub Basics), Q2 (Contributions)

#### **2. Custom Quests**
- Professor-created quests
- Unique quest IDs (MongoDB ObjectIds)
- Fully customizable tasks and content

### **Quest Structure**

```javascript
{
  questId: "Q1" or ObjectId,
  title: "Quest Title",
  questType: "fixed" | "custom",
  isQ0: Boolean,
  sequenceNumber: Number,
  metadata: {
    title: String,
    description: String,
    prerequisite: "Q0" | null,  // Previous quest ID
    type: "general" | "custom"
  },
  badgeDescription: String,
  tasks: {
    "T1": { /* Task configuration */ },
    "T2": { /* Task configuration */ }
  }
}
```

### **Task Types**

#### **1. Multiple Choice** (`multiple-choice`)
- Single correct answer
- Options A, B, C, D
- Answer format: "A", "B", "C", or "D"

#### **2. Quiz** (`quiz`)
- Multiple questions in one task
- Array of correct answers
- Answer format: "[a,b,c]" (comma-separated)

#### **3. Text Input** (`text-input`)
- Free-form text answer
- Exact or fuzzy matching
- Answer format: Plain text

#### **4. LLM Text Validation** (`llm-text-validation`)
- AI-powered text validation
- No static answer required
- Uses OpenAI/LM for validation
- Supports detailed feedback

#### **5. Image Validation** (`imageValidation`)
- Image submission validation
- AI-powered image analysis
- Supports detailed feedback

#### **6. Collect Info** (`collect-info`)
- Information gathering tasks
- Data stored for later tasks
- No immediate validation

#### **7. Custom API Call** (`custom-api-call`)
- Custom validation logic
- External API integration
- Flexible validation rules

#### **8. GitHub Metrics** 
- `get-issue-count`: Count repository issues
- `get-pr-count`: Count pull requests
- `get-open-issue`: Get specific open issue
- `get-top-contributor`: Find top contributor
- `get-issue-title`: Get issue title

#### **9. General** (`general`)
- Standard GitHub operations
- PR creation, issue comments, etc.
- Validated by OSS-Doorway bot

### **Quest Prerequisites**

- **Prerequisite Quest**: Must complete previous quest first
- **Prerequisite Score**: Minimum score required
- **Empty Prerequisite**: Connects to "START" node
- Visualized in QuestRoadmap component

---

## 🔧 Key Features

### **1. Quest Configuration Builder** (`GenerateJson.jsx`)

**Features:**
- **Draft System**: Save work-in-progress quests
- **Duplicate Detection**: Warns about duplicate quest/task titles
- **Real-time Updates**: Socket.IO notifications when quests are updated
- **Task Builder**: Comprehensive UI for creating all task types
- **Validation**: Checks for required fields before deployment
- **Purple Deploy**: Deploy quest configuration to students

**Key Functionality:**
- Create/edit quests with rich metadata
- Add multiple tasks per quest
- Configure task-specific settings
- Preview quest structure
- Export/import quest configurations

### **2. Quest Roadmap** (`QuestRoadmap.jsx`)

**Features:**
- **Visual Dependency Graph**: Shows quest prerequisites
- **Minimap**: Navigation helper for large quest sequences
- **Auto-save**: Automatically saves prerequisite changes
- **Draft Quests**: Separate visualization for unpublished quests
- **START Node**: Visual starting point for quest chains
- **Dynamic Styling**: Color-coded quest types and states

**Key Functionality:**
- Drag-and-drop quest ordering
- Edit quest prerequisites
- Visualize quest dependencies
- Deploy quest configurations

### **3. Real-time Updates** (Socket.IO)

**Channels:**
- Class-specific rooms: `class:{classId}`
- Events:
  - `draft-quest-config-updated`: Notifies when draft quests change
  - `quest-config-updated`: Notifies when quest config is deployed

**Use Cases:**
- Collaborative quest editing
- Live updates when others make changes
- Synchronization across multiple tabs

### **4. Repository Management** (`repoController.js`)

**Features:**
- **Automatic Creation**: Creates student repos via Bot Service
- **Repository Pattern**: Customizable naming convention
- **Collaboration Management**: Adds students as collaborators
- **Status Tracking**: Monitors repository creation status

### **5. Student Management** (`studentController.js`)

**Features:**
- **Individual Registration**: Add students one by one
- **CSV Import**: Bulk student registration
- **Progress Tracking**: View student progress and scores
- **Repository Links**: Direct links to student repositories

### **6. Authentication & Authorization**

**Professor Authentication:**
- Email/password login
- JWT tokens stored in HTTP-only cookies
- Email verification required
- Password recovery via OTP

**Student Authentication:**
- Simple registration via class code
- No login required (GitHub-based workflow)
- Linked via GitHub username

**Admin Roles:**
- Professor (full access)
- Assistant, Grader, Mentor, Moderator (limited access)

---

## 📡 API Endpoints

### **Authentication** (`/api/auth`)
- `POST /signup` - Professor registration
- `POST /login` - Professor login
- `PUT /verifyCode` - Verify invitation code
- `POST /student` - Student registration
- `POST /verify` - Email verification
- `POST /recoverPassword` - Password recovery

### **Groups/Classes** (`/api/group`)
- `POST /create` - Create new class
- `GET /:groupId` - Get class details
- `GET /code/groupByCode/:classCode` - Get class by code
- `PUT /:groupId` - Update class
- `POST /:groupId/students` - Add student to class
- `PUT /:groupId/questOrder` - Update quest order
- `GET /:groupId/questConfig` - Get quest configuration
- `PUT /:groupId/questConfig` - Update quest configuration
- `PUT /:groupId/draftQuestConfig` - Update draft quests

### **Quests** (`/api/quest`)
- `GET /:groupId` - Get all quests for a class
- `POST /create` - Create new quest
- `PUT /:questId` - Update quest
- `DELETE /:questId` - Delete quest

### **Generate JSON** (`/api/generatejson`)
- `POST /quest` - Create quest
- `GET /quests/:professorId` - Get professor's quests
- `GET /quest/:questId` - Get quest by ID
- `PUT /quest/:questId` - Update quest
- `DELETE /quest/:questId` - Delete quest
- `GET /group/:groupId/config` - Get quest config for group
- `POST /group/:groupId/deploy` - Deploy quest configuration

### **Repository** (`/api/repo`)
- `POST /repository` - Create student repository
- `GET /prodStatus` - Get production status (organization)
- `GET /:groupId/students` - Get student repositories

### **Students** (`/api/student`)
- `GET /:groupId` - Get all students in class
- `POST /csv` - Bulk import students via CSV
- `GET /:studentId/progress` - Get student progress

### **Gamification** (`/api/gamification`)
- `GET /:groupId/leaderboard` - Get class leaderboard
- `GET /:studentId/stats` - Get student statistics

### **Admin** (`/api/admin`)
- `GET /groups` - Get all groups (admin only)
- `POST /generateCode` - Generate invitation codes

---

## 🔐 Security

### **Authentication**
- **JWT Tokens**: Secure, HTTP-only cookies
- **Password Hashing**: bcrypt with salt rounds
- **Email Verification**: OTP codes for account activation
- **Invitation Codes**: Required for professor registration

### **Authorization**
- **Role-based Access**: Professor, Assistant, Grader, etc.
- **Middleware**: `authMiddleware.js` checks JWT tokens
- **Class Access**: Users can only access their own classes

### **GitHub Integration**
- **GitHub App Authentication**: OAuth via GitHub App
- **HMAC Signatures**: Bot service validates requests
- **Webhook Secrets**: GitHub webhook verification

### **API Security**
- **CORS**: Configured for frontend origin
- **Error Handling**: Generic error messages to prevent information leakage
- **Input Validation**: Required fields validated before processing

---

## 🗄️ Database Schema

### **Database Connections**

**OSS-Management Database:**
- Connection: `process.env.URI`
- Database: `process.env.DB_NAME` (default: "gamification-management")
- Collections: Groups, Professors, Students, Quests, Tasks, Progress models

**OSS-Doorway Database** (Read-only access):
- Connection: `process.env.OSS_DOORWAY_DB_URI`
- Database: `process.env.OSS_DOORWAY_DB_NAME` (default: "test")
- Used for: Reading quest execution data

### **Key Collections**

1. **groups**: Class/group information
2. **professors**: Professor accounts
3. **students**: Student accounts
4. **quests**: Quest definitions
5. **tasks**: Task definitions
6. **questconfigs**: Published quest configurations
7. **userquestprogresses**: Student quest progress
8. **usertaskprogresses**: Student task progress
9. **userrepos**: Student repository information

---

## 🚀 Deployment & Environment

### **Environment Variables**

**OSS-Management Backend** (`.env`):
```env
URI=mongodb+srv://...
DB_NAME=gamification-management
JWT_SECRET=...
BOT_SECRET=...
MAIL_PASSWORD=...
NODE_ENV=development|production
OSS_DOORWAY_APP_ID=...
OSS_DOORWAY_PRIVATE_KEY=...
GITHUB_ORG=...
OSS_DOORWAY_DB_URI=...
OSS_DOORWAY_DB_NAME=...
```

**Bot Service** (`.env`):
```env
PORT=10000
OSS_DOORWAY_APP_ID=...
OSS_DOORWAY_PRIVATE_KEY=...
GITHUB_ORG=...
BOT_SECRET=...
NODE_ENV=...
```

### **Running the System**

1. **Install Dependencies**:
   ```bash
   cd OSS-Management
   npm install
   cd frontend && npm install
   ```

2. **Set Up Environment**:
   - Create `.env` file in `OSS-Management/`
   - Configure all required variables

3. **Start Backend**:
   ```bash
   npm start  # Port 8080
   ```

4. **Start Frontend**:
   ```bash
   cd frontend
   npm start  # Port 3000
   ```

5. **Start Bot Service** (if needed):
   ```bash
   npm run bot  # Port 10000
   ```

---

## 🔄 Integration with OSS-Doorway

### **Quest Deployment Flow**

1. **Professor Creates Quest** (OSS-Management):
   - Uses `GenerateJson.jsx` to build quest configuration
   - Saves draft or publishes to `questJsonConfig`

2. **Student Registration** (OSS-Management):
   - Student registers with class code
   - OSS-Management calls Bot Service to create GitHub repo
   - Bot Service creates repo and initial setup issue

3. **Quest Execution** (OSS-Doorway):
   - OSS-Doorway bot monitors GitHub webhooks
   - Detects student actions (PRs, issues, comments)
   - Validates tasks based on quest configuration
   - Updates progress in OSS-Doorway database

4. **Progress Tracking**:
   - OSS-Doorway tracks student progress
   - OSS-Management can read progress via API (if integrated)
   - Students see progress in their GitHub repository

### **Data Flow**

```
OSS-Management (Quest Config)
    ↓ (GitHub Repository)
OSS-Doorway (Reads Config)
    ↓ (Validates Tasks)
OSS-Doorway (Updates Progress)
    ↓ (GitHub Issues/Comments)
Student (Sees Feedback)
```

---

## 📝 Key Files & Their Purpose

### **Frontend Pages**
- `App.jsx`: Main routing component
- `LandingPage.jsx`: Public landing page
- `LoginSignup.jsx`: Professor login/signup
- `Home.jsx`: Professor dashboard
- `ClassView.jsx`: Main class management interface
- `GenerateJson.jsx`: Quest configuration builder (10,000+ lines)
- `QuestRoadmap.jsx`: Visual quest dependency graph
- `ManageQuests.jsx`: Quest editing interface
- `ManageStudents.jsx`: Student management
- `ManageAdmins.jsx`: Admin/TA management
- `InviteByName.jsx`: Invite students by name
- `StudentRegister.jsx`: Student registration form

### **Backend Controllers**
- `authController.js`: Authentication & user management
- `groupController.js`: Class/group management (2,700+ lines)
- `generateJsonQuestController.js`: Quest CRUD operations
- `repoController.js`: Repository management (3,300+ lines)
- `studentController.js`: Student operations
- `questController.js`: Quest operations
- `gamificationController.js`: Leaderboards & stats
- `adminController.js`: Admin operations
- `aiController.js`: AI-powered validation

### **Backend Models**
- `GroupModel.js`: Class/group schema
- `QuestModel.js`: Quest schema
- `TaskModel.js`: Task schema
- `ProfessorModel.js`: Professor schema
- `StudentModel.js`: Student schema
- `QuestConfigModel.js`: Quest configuration storage
- Progress models: Track student advancement

### **Backend Routes**
- `authRoutes.js`: Authentication endpoints
- `groupRoutes.js`: Group/class endpoints
- `generatejsonRoutes.js`: Quest generation endpoints
- `questRoutes.js`: Quest endpoints
- `repoRoutes.js`: Repository endpoints
- `studentRoutes.js`: Student endpoints
- `gamificationRoutes.js`: Gamification endpoints
- `adminRoutes.js`: Admin endpoints

---

## 🎨 UI/UX Features

### **Material-UI Components**
- Consistent design system
- Responsive layout
- Theme customization
- Dialog modals for forms
- Data tables for student/progress lists
- Cards for quest visualization

### **Quest Roadmap Features**
- **Minimap**: Overview navigation
- **Auto-save**: Prerequisite changes saved automatically
- **Visual Feedback**: Color-coded quest states
- **Dependency Arrows**: Shows quest relationships
- **Drag-and-Drop**: Reorder quests (if implemented)

### **GenerateJson Features**
- **Form Validation**: Real-time validation feedback
- **Duplicate Detection**: Warns about duplicate titles
- **Draft System**: Save work in progress
- **Real-time Alerts**: Socket.IO notifications
- **Rich Task Builder**: Supports all task types
- **Checkbox Controls**: Modern UI for boolean settings

---

## 🧪 Testing

### **Test Infrastructure**
- **Jest**: Testing framework
- **MongoDB Memory Server**: In-memory database for tests
- **Supertest**: API endpoint testing
- **Test Factories**: Generate test data

### **Test Files**
- `backend/tests/unit/`: Unit tests
- `backend/tests/integration/`: Integration tests
- `backend/tests/factories/`: Test data factories

---

## 🔍 Monitoring & Debugging

### **Logging**
- Console logs for debugging
- Error tracking
- Request/response logging
- Socket.IO connection logs

### **Health Checks**
- `GET /health`: Server health endpoint
- Returns: status, port, PID, uptime

---

## 📚 Documentation

- **API Documentation**: Controllers have JSDoc comments
- **Quest Structure**: `backend/docs/mcq-quest-structure.md`
- **Custom API Examples**: `backend/docs/custom-api-call-examples.md`
- **Environment Setup**: `ENV_CONFIGURATION.md`

---

## 🎯 Future Enhancements

Based on recent commits and feature additions:
- **Enhanced Duplicate Detection**: Improved quest/task validation
- **Real-time Collaboration**: Multiple professors editing simultaneously
- **Advanced Analytics**: Detailed progress tracking and reports
- **AI-Powered Validation**: More sophisticated LLM validation
- **Mobile Support**: Responsive design improvements
- **Export/Import**: Quest configuration portability

---

## 🐛 Known Issues & Limitations

1. **Large Quest Sequences**: Performance may degrade with 50+ quests
2. **Concurrent Edits**: No conflict resolution for simultaneous quest edits
3. **GitHub Rate Limits**: Bot service may hit GitHub API limits with many students
4. **Database Sync**: OSS-Doorway progress not always synced with OSS-Management

---

## 🔗 Related Systems

1. **OSS-Doorway**: Quest execution bot (separate repository)
2. **Bot Service**: GitHub operations service (in `bot/` directory)
3. **GitHub Organization**: `OSS-Doorway-Dev` (or configured org)

---

## 📞 Support & Maintenance

- **Repository**: `RESHAPELab/OSS-Management`
- **Branches**: `purple-deploy-overlay`, `karissa-management`, `misan`
- **Deployment**: Production deployments via Render/other platforms
- **Environment**: Separate dev/prod configurations

---

This system represents a comprehensive solution for gamified open-source software education, combining quest-based learning, GitHub integration, and real-time progress tracking to create an engaging educational experience.

