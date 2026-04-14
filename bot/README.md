# OSS Management Bot Service (Self-Contained)

## 🎯 Overview

This is a **completely self-contained** GitHub operations service that handles repository management for the OSS-Management backend. It requires **no external dependencies** from other folders.

## 🏗️ Architecture

```
OSS-Management Backend (Port 8080)
    ↓ HTTP API calls
OSS-Management Bot (Port 10000) ← Self-contained service
    ↓ GitHub API calls  
GitHub (GitHub App Authentication)
```

## ✅ Self-Contained Features

- **✅ No external imports** - Does not import from OSS-Doorway, OSS-Management, or any other folder
- **✅ Built-in GitHub operations** - Repository creation, collaboration management, issue handling
- **✅ Standalone authentication** - Uses own GitHub App authentication
- **✅ Independent deployment** - Can run completely separately from other services

## 🔐 Authentication

The bot uses GitHub App authentication via environment variables:
- `OSS_DOORWAY_APP_ID` - GitHub App ID
- `OSS_DOORWAY_PRIVATE_KEY` - RSA Private Key (inline)
- `GITHUB_ORG` - Target GitHub organization

## 🚀 Running the Bot

### Prerequisites
1. Node.js 16+ installed
2. Environment variables configured
3. GitHub App properly set up

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server  
npm start
```

The bot will run on **port 10000** by default.

## 🛠️ API Endpoints

### GitHub Operations (`/github/`)
- `POST /github/createRepo` - Create repository
- `POST /github/addUserToRepo` - Add collaborator
- `POST /github/createIssue` - Create issue
- `POST /github/commentIssue` - Comment on issue
- `POST /github/listRepos` - List repositories
- `POST /github/checkCollaboration` - Check collaboration status
- `POST /github/closeIssue` - Close issue
- `POST /github/commitFile` - Create/update file

### Gamification Operations (`/gamification/`)
- `POST /gamification/createRepos` - Create repositories with basic setup

## 🔒 Security

All requests from the backend are authenticated using HMAC signatures with `BOT_SECRET`.

## 📝 Environment Variables

Create a `.env` file with:

```env
PORT=10000
OSS_DOORWAY_APP_ID="YOUR_GITHUB_APP_ID"
OSS_DOORWAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END RSA PRIVATE KEY-----"
GITHUB_ORG="YOUR_GITHUB_ORG"
BOT_SECRET="YOUR_BOT_SECRET_HERE"
NODE_ENV="development"
```

## 🎯 What the Bot Does

### Repository Creation Flow:
1. **Creates GitHub repository** using GitHub API
2. **Adds user as collaborator** with appropriate permissions
3. **Creates README file** with course information
4. **Creates setup issue** with `/new_user` command to trigger OSS-Doorway quest system
5. **Closes setup issue** to activate the quest workflow

### Quest System Integration:
- The bot creates a setup issue and posts `/new_user {username}` comment
- This triggers the **OSS-Doorway bot** (separate service) to initialize quests
- The OSS-Doorway bot handles all quest logic, task validation, and progress tracking
- This bot only handles the **initial repository setup**

## 🔄 Independence Status

✅ **Fully Independent** - No external folder dependencies  
✅ **Self-contained** - All logic contained within `bot/` folder  
✅ **Standalone deployment** - Can be deployed separately  
✅ **Minimal dependencies** - Only uses standard npm packages  
✅ **Clear boundaries** - Repository management only, no quest logic  

## 🎯 Integration

This bot integrates with:
- **OSS-Management Backend** - Receives API calls for repository operations
- **OSS-Doorway Bot** - Triggers quest system via GitHub comments (no direct communication)
- **GitHub API** - All repository and collaboration management

The bot maintains clean separation of concerns and requires no access to other project folders. 