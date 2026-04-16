#!/bin/bash

# Clean console.log statements from API routes
echo "🧹 Cleaning console.log statements from API routes..."

# Function to remove specific console.log lines while keeping console.error
clean_logs() {
    local file=$1
    echo "Cleaning $file..."
    
    # Remove console.log and console.info but keep console.error and console.warn
    sed -i '' '/console\.log(/d' "$file"
    sed -i '' '/console\.info(/d' "$file"
}

# Clean specific API route files
clean_logs "src/app/api/sessions/create-new/route.ts"
clean_logs "src/app/api/sessions/route.ts" 
clean_logs "src/app/api/sessions/message/route.ts"
clean_logs "src/app/api/test-eden/route.ts"
clean_logs "src/app/api/test-session/route.ts"

echo ""
echo "✅ Console.log cleanup completed!"
echo ""
echo "📋 What was cleaned:"
echo "   - Removed console.log() statements from API routes"
echo "   - Removed console.info() statements"
echo "   - Kept console.error() and console.warn() for production debugging"
echo ""
echo "🔍 Remaining console statements are error/warning logs only"