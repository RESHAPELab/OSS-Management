#!/bin/bash

# Load environment variables from .env if it exists
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "🧪 Running MongoDB connection tests..."
echo ""

# Run the tests
echo "1️⃣ Testing all MongoDB connection strings..."
node test-env-changes.js

echo ""
echo "2️⃣ Step-by-step elimination test..."
node test-step-by-step-env.js

echo ""
echo "3️⃣ Checking environment variables..."
node test-env-variable-usage.js

echo ""
echo "✅ All tests completed!"
