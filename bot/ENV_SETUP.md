# Bot Service Environment Variables Setup

## Issue
You're seeing this error:
```
Bot secret is not defined in the environment variables.
```

## Solution
Add the following environment variable to your `.env` file in the project root:

```env
BOT_SECRET="YOUR_BOT_SECRET_HERE"
```

## Complete Environment Variables Required

The bot service requires these environment variables in your `.env` file:

```env
# Bot Service Port
BOT_PORT=10000
PORT=10000

# GitHub App Configuration
OSS_DOORWAY_APP_ID="your_github_app_id"
OSS_DOORWAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your_private_key_here
-----END RSA PRIVATE KEY-----"
GITHUB_ORG="your_github_org"

# Bot Secret for Backend Authentication (REQUIRED)
# This secret is used to sign and verify HMAC signatures for requests between backend and bot
BOT_SECRET="YOUR_BOT_SECRET_HERE"

# Backend API Key for GitHub App Token Requests
BACKEND_API_KEY="your_backend_api_key"

# Node Environment
NODE_ENV="development"
```

## Why BOT_SECRET is Important

The `BOT_SECRET` is used for:
1. **HMAC Signature Authentication**: The backend signs requests to the bot service using this secret
2. **Request Verification**: The bot verifies incoming requests from the backend using the same secret
3. **Security**: Prevents unauthorized services from making requests to the bot

## Routes That Require BOT_SECRET

These routes use `authMiddleware.verifyBackendRequest`:
- `/github/createIssue`
- `/github/createRepo`
- `/github/dropRepo`
- `/github/addUserToRepo`
- `/github/commentIssue`
- `/github/checkCollaboration`
- `/github/listRepos`
- `/github/checkReadme`
- `/github/classGrades`
- `/gamification/createRepos`

## How to Fix

1. **Locate your `.env` file** in the project root (same level as `bot/` folder)
2. **Add the BOT_SECRET** variable:
   ```env
   BOT_SECRET="YOUR_BOT_SECRET_HERE"
   ```
3. **Restart the bot service**:
   ```bash
   npm run start
   ```

## Note

The `BOT_SECRET` value shown here is from the documentation. In production, you should:
- Use a different, secure secret
- Keep it synchronized between the backend and bot services
- Never commit it to version control

