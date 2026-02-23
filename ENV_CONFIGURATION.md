# Environment Configuration Guide

This document contains the environment variables needed to run both OSS-Doorway projects.

## 📁 OSS-Doorway (.env)

Create a `.env` file in the `OSS-Doorway/` directory with the following variables:

```env
# GitHub App Configuration
WEBHOOK_PROXY_URL=https://smee.io/lVDFUmXMr2lbe0PD
APP_ID=YOUR_GITHUB_APP_ID
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END RSA PRIVATE KEY-----\n"
WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE

# GitHub OAuth
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET

# Database Configuration
# ⚠️ SECURITY: Replace with your actual MongoDB connection string
URI="mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification"
DB_NAME="test"

# Repository Configuration
OSS_REPO=OSS-Doorway-Dev/test-repo
```

## 📁 OSS-Management (.env)

Create a `.env` file in the `OSS-Management/` directory with the following variables:

```env
# Database Configuration
# ⚠️ SECURITY: Replace with your actual MongoDB connection string
URI="mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/management?retryWrites=true&w=majority&appName=gamification"
DB_NAME="gamification-management"

# Security
# ⚠️ SECURITY: Generate your own secure random secrets
JWT_SECRET="YOUR_JWT_SECRET_HERE"
BOT_SECRET="YOUR_BOT_SECRET_HERE"

# Email Configuration
# ⚠️ SECURITY: Use your actual email app password
MAIL_PASSWORD="YOUR_EMAIL_APP_PASSWORD"

# Environment
NODE_ENV="development"

# GitHub App IDs
APP_ID_DEV="1088526"
USER_AGENT_DEV="OSS-Doorway-Development"
APP_ID_PROD="1109432"
USER_AGENT_PROD="OSS-Doorway-Dev"

# OSS-Doorway Integration
# ⚠️ SECURITY: Use your actual GitHub App credentials
OSS_DOORWAY_APP_ID="YOUR_GITHUB_APP_ID"
OSS_DOORWAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END RSA PRIVATE KEY-----\n"

# GitHub Organization
GITHUB_ORG="OSS-Doorway-Dev"

# OSS-Doorway Database Connection
# ⚠️ SECURITY: Replace with your actual MongoDB connection string
OSS_DOORWAY_DB_URI="mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority&appName=gamification"
OSS_DOORWAY_DB_NAME="test"
```

## 🔐 Security Notes

- **Keep these files private** - Never commit `.env` files to version control
- **Private Keys**: The RSA private keys are for GitHub App authentication
- **Database Credentials**: MongoDB connection strings with embedded credentials
- **Webhook Secret**: Used to verify GitHub webhook authenticity
- **JWT Secret**: Used for session management in the web interface

## 📂 File Placement

```
OSS-Doorway/
├── .env                    # OSS-Doorway environment variables
├── ... other files

OSS-Management/
├── .env                    # OSS-Management environment variables
├── ... other files
```

## ⚠️ Important

1. Create these `.env` files before running the applications
2. Ensure MongoDB is accessible with the provided credentials
3. The GitHub App must be properly configured in your GitHub organization
4. Webhook URLs should be accessible from GitHub (use ngrok or smee.io for local development)

## �� After Configuration

Once both `.env` files are in place, you can run the applications using the commands in [SETUP.md](./SETUP.md).
