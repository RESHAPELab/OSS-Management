# Environment Configuration Guide

This document contains the environment variables needed to run both OSS-Doorway projects.

## 📁 OSS-Doorway (.env)

Create a `.env` file in the `OSS-Doorway/` directory with the following variables:

```env
# GitHub App Configuration
WEBHOOK_PROXY_URL=https://smee.io/lVDFUmXMr2lbe0PD
APP_ID=1430666
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAtvVu4WWtRpyN/sVghuJzf62elHfIKRWeKavvWKPyJZ7eF5xZ\n2g+/y8l93uYcxZS98vSodwwiE5cGR0RKwPG4kuvmLgflxeYz724H9B/HkPAGlNCq\nU+6UNCT9TRsDaxhj24I1cHZKIZ84uSIbbcZV9EYPV+dbH5uk+UE1lCUpp3bVbVEd\nB+J55GaVwBoF+2I+TiTVFt+BDLtsrhL29K40sz5pK0vEPDoRjvXfgnlwWDTCp/gv\nyg0yOawCzrsppflYJLnRR0TsRSyldSSMOeNK736ka00M9GJrWmJ9ZELepKh47mID\nvaOdOLQOU2ztlC3m0J7rIvzmiPdhJGEMCzx0LQIDAQABAoIBAGbCWOGd4wGa4qHq\np/l6bNaUZFINKM3yh1/uYsMNae65WRI3zbuNRvMlm127LwPGNB2mTox2sxj/pRYY\nBEh0O2/BsQm/g81wK1FaInt58fO07G1e+Zukj3buI5rQBk57Z3Kdongk6CQUMp7A\nylkQoaxOQUXk+qg5GiKo/nfTm56jS3gv+jtTQ+nJPwmNcI37Y6JbkvHh7y2KxyL0\nwBrjaJO03MIhPgkhqNAA0XSifoKZ+YJ49K3kavNtsYrx5RHvEwE8uJa5XXwZFCNd\nHl5XvLw/vMmgH7Y5dOWs9aomdk+cjRdkIBXIXS0NlvS+/BdqzpvS+b2w1A6dPivB\nPdrPht0CgYEA441Sn7f4an7V8VBGf0HqIutCWhL84nVxid8UmXGWEobQ2mlQTOWj\n9BpnSCJNvuU/aeCiOmTK0N68Wr5ahogBECoZENI3PUzaVXsv/6zv3N4vqHaIQZLy\nEODl/LaFw4ZrwJvoClDu7kMcvkir3XXVJeq0uzjilAyiuytrZe3mqkcCgYEAzdTt\nBeVSPeAdY2WQiWRnt5YbAdhZUScWOIkZNBlAkpHRuYXiu9HbEo83pyHT+JNJuM7G\nMcV6g4Szy+sowU1b5wbSV0Mx1Ut4LgUWkSFvgqdrCGHCIqd8lgqrUfSWKaVu0xlA\nLStMrmvBTkl8ry3wqt/vwQk8T+qP/syrHB3eM+sCgYEA0QyUS4eIAM5lXjyRh3fW\n0h2v53BqQuICXNdE5XMknACe/wihbQPLjAZ1vB9HrYiOqYZlg5/1c84s3HDkWZO4\n5lDGll2JwhdIvh9eCVWnRxIYVnwO0a9eE4OJxpEocmibtWeF1XRlDR862NWKjvoh\nx6PIRfgMsFaraaiKEiptLyECgYEArA6EP3xtXfm8tzzMMH000drxIn62UscIpSO9\nZLaDKsIn/Rw05unKZd5AGD6H0W9Vnd2DAVHhUpUYMqqVe9htrVYfeABcZL7cbCOm\ntJStgRrvtqb5QDyfQVET2sNIzvFSDbY61kcup1K92PJG/qy5VC0zXjqZJvide9Gc\nazlwaBcCgYAyv7pvTk0PJEjgMNXgxRUO8aGVv3iAMZeOkcv8+C3ErhmCZ4nRS3Um\n/6RGGkEyPIYqDBrqlUIg39ngTnxrwUrMmg8YYnfnTHiSPzEjEz6LzKgzfSEi9Mn9\nN3OPGMblpSj869YI8Qeo8ObjVsBmTqW6dLSfPDDMp/mchx2gAPAQ5A==\n-----END RSA PRIVATE KEY-----\n"
WEBHOOK_SECRET=cc6c4778d0629e389e78922ce4554c57b38b8f37

# GitHub OAuth
GITHUB_CLIENT_ID=Iv23liySjKF71MKt3oe5
GITHUB_CLIENT_SECRET=def8096fd88e3ae980a53740efaf7b4875516665

# Database Configuration
URI="mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification"
DB_NAME="test"

# Repository Configuration
OSS_REPO=OSS-Doorway-Dev/test-repo
```

## 📁 OSS-Management (.env)

Create a `.env` file in the `OSS-Management/` directory with the following variables:

```env
# Database Configuration
URI="mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification"
DB_NAME="gamification-management"

# Security
JWT_SECRET="d8fc039ec10c8242260492a6efc608f3bf886fd3ffa649502f644020318929daa4863c84a1279ffd333992a79659ea4e2f3bd2220262ba1348bb6a69f4214c77"
BOT_SECRET="d8fc039ec10c8242260492a6efc608f3bf886fd3ffa649502f6440203189"

# Email Configuration
MAIL_PASSWORD="fcmv kldq gcvp okkf"

# Environment
NODE_ENV="development"

# GitHub App IDs
APP_ID_DEV="1088526"
USER_AGENT_DEV="OSS-Doorway-Development"
APP_ID_PROD="1109432"
USER_AGENT_PROD="OSS-Doorway-Dev"

# OSS-Doorway Integration
OSS_DOORWAY_APP_ID="1430666"
OSS_DOORWAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAtvVu4WWtRpyN/sVghuJzf62elHfIKRWeKavvWKPyJZ7eF5xZ\n2g+/y8l93uYcxZS98vSodwwiE5cGR0RKwPG4kuvmLgflxeYz724H9B/HkPAGlNCq\nU+6UNCT9TRsDaxhj24I1cHZKIZ84uSIbbcZV9EYPV+dbH5uk+UE1lCUpp3bVbVEd\nB+J55GaVwBoF+2I+TiTVFt+BDLtsrhL29K40sz5pK0vEPDoRjvXfgnlwWDTCp/gv\nyg0yOawCzrsppflYJLnRR0TsRSyldSSMOeNK736ka00M9GJrWmJ9ZELepKh47mID\nvaOdOLQOU2ztlC3m0J7rIvzmiPdhJGEMCzx0LQIDAQABAoIBAGbCWOGd4wGa4qHq\np/l6bNaUZFINKM3yh1/uYsMNae65WRI3zbuNRvMlm127LwPGNB2mTox2sxj/pRYY\nBEh0O2/BsQm/g81wK1FaInt58fO07G1e+Zukj3buI5rQBk57Z3Kdongk6CQUMp7A\nylkQoaxOQUXk+qg5GiKo/nfTm56jS3gv+jtTQ+nJPwmNcI37Y6JbkvHh7y2KxyL0\nwBrjaJO03MIhPgkhqNAA0XSifoKZ+YJ49K3kavNtsYrx5RHvEwE8uJa5XXwZFCNd\nHl5XvLw/vMmgH7Y5dOWs9aomdk+cjRdkIBXIXS0NlvS+/BdqzpvS+b2w1A6dPivB\nPdrPht0CgYEA441Sn7f4an7V8VBGf0HqIutCWhL84nVxid8UmXGWEobQ2mlQTOWj\n9BpnSCJNvuU/aeCiOmTK0N68Wr5ahogBECoZENI3PUzaVXsv/6zv3N4vqHaIQZLy\nEODl/LaFw4ZrwJvoClDu7kMcvkir3XXVJeq0uzjilAyiuytrZe3mqkcCgYEAzdTt\nBeVSPeAdY2WQiWRnt5YbAdhZUScWOIkZNBlAkpHRuYXiu9HbEo83pyHT+JNJuM7G\nMcV6g4Szy+sowU1b5wbSV0Mx1Ut4LgUWkSFvgqdrCGHCIqd8lgqrUfSWKaVu0xlA\nLStMrmvBTkl8ry3wqt/vwQk8T+qP/syrHB3eM+sCgYEA0QyUS4eIAM5lXjyRh3fW\n0h2v53BqQuICXNdE5XMknACe/wihbQPLjAZ1vB9HrYiOqYZlg5/1c84s3HDkWZO4\n5lDGll2JwhdIvh9eCVWnRxIYVnwO0a9eE4OJxpEocmibtWeF1XRlDR862NWKjvoh\nx6PIRfgMsFaraaiKEiptLyECgYEArA6EP3xtXfm8tzzMMH000drxIn62UscIpSO9\nZLaDKsIn/Rw05unKZd5AGD6H0W9Vnd2DAVHhUpUYMqqVe9htrVYfeABcZL7cbCOm\ntJStgRrvtqb5QDyfQVET2sNIzvFSDbY61kcup1K92PJG/qy5VC0zXjqZJvide9Gc\nazlwaBcCgYAyv7pvTk0PJEjgMNXgxRUO8aGVv3iAMZeOkcv8+C3ErhmCZ4nRS3Um\n/6RGGkEyPIYqDBrqlUIg39ngTnxrwUrMmg8YYnfnTHiSPzEjEz6LzKgzfSEi9Mn9\nN3OPGMblpSj869YI8Qeo8ObjVsBmTqW6dLSfPDDMp/mchx2gAPAQ5A==\n-----END RSA PRIVATE KEY-----\n"

# GitHub Organization
GITHUB_ORG="OSS-Doorway-Dev"

# OSS-Doorway Database Connection
OSS_DOORWAY_DB_URI="mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification"
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
