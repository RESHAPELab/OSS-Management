# 🧪 Quick Test Guide

## Running the Elimination Tests

The test scripts are now in the `OSS-Management` directory where `mongodb` is installed.

### Option 1: Run All Tests (Recommended)

```bash
cd OSS-Management
./run-tests.sh
```

This will:
1. Load your `.env` file (if it exists)
2. Run all three test scripts
3. Show you which credentials work

### Option 2: Run Tests Individually

```bash
cd OSS-Management

# Load .env file first (if you have one)
export $(cat .env | grep -v '^#' | xargs)

# Then run tests
node test-env-changes.js
node test-step-by-step-env.js
node test-env-variable-usage.js
```

### Option 3: Test with Specific Credentials

If you want to test specific connection strings without a .env file:

```bash
cd OSS-Management

# Test old credentials
URI="mongodb+srv://jadyn:290794@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification" \
OSS_DOORWAY_DB_URI="mongodb+srv://cna93:gamification@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification" \
node test-env-changes.js

# Test new credentials
URI="mongodb+srv://feb16:KCILge3j9UtNunGF@gamification.nwes9ze.mongodb.net/management?retryWrites=true&w=majority&appName=gamification" \
OSS_DOORWAY_DB_URI="mongodb+srv://feb16:KCILge3j9UtNunGF@gamification.nwes9ze.mongodb.net/?retryWrites=true&w=majority&appName=gamification" \
node test-env-changes.js
```

## What Each Test Does

### `test-env-changes.js`
Tests all MongoDB connection strings:
- Old `jadyn` credentials
- New `feb16` credentials (both databases)
- Old `cna93` credentials

**Shows:** Which credentials actually work

### `test-step-by-step-env.js`
Changes one variable at a time to identify what breaks:
1. Base config (all old values)
2. Change only `URI` to new credentials
3. Change only `OSS_DOORWAY_DB_URI` to new credentials
4. Change both to new credentials

**Shows:** Exactly which change causes the failure

### `test-env-variable-usage.js`
Checks which environment variables are set and which are required.

**Shows:** Missing variables and configuration issues

## Expected Output

### ✅ Success Example:
```
✅ SUCCESS: Connection established!
✅ SUCCESS: Database ping successful!
✅ SUCCESS: Can list databases!
```

### ❌ Failure Examples:

**Authentication Error:**
```
❌ FAILED: bad auth : Authentication failed.
   Error code: 8000
   Error codeName: AtlasError
```
→ Wrong username/password or user doesn't exist

**Network Error:**
```
❌ FAILED: querySrv ECONNREFUSED
```
→ Network/DNS issue (might work from Railway but not locally)

**Permission Error:**
```
❌ FAILED: not authorized
```
→ User lacks proper permissions

## Troubleshooting

### If tests show "Cannot find module 'mongodb'":
```bash
cd OSS-Management
npm install
```

### If all tests fail with network errors:
- This is normal when running locally
- The tests will work from Railway where network access is available
- Focus on checking MongoDB Atlas directly:
  1. Does user `feb16` exist?
  2. Is password correct?
  3. Are permissions set correctly?

## Next Steps

After running tests:

1. **If new credentials work:**
   - Update Railway variables
   - Redeploy service

2. **If new credentials fail:**
   - Check MongoDB Atlas → Security → Database Access
   - Verify user `feb16` exists
   - Verify password is correct
   - Check user permissions

3. **If old credentials still work:**
   - You can temporarily use old credentials in Railway
   - But you MUST rotate them for security!
