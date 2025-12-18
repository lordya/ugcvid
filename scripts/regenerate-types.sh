#!/bin/bash

# Script to regenerate Supabase TypeScript types
# Usage: ./scripts/regenerate-types.sh

echo "Regenerating Supabase TypeScript types..."

# Check if project ID is provided as argument
if [ -z "$1" ]; then
  # Use the project ID from the codebase
  PROJECT_ID="bnmnohmyvsukrwsqvdci"
  echo "Using project ID: $PROJECT_ID"
  npx supabase gen types typescript --project-id $PROJECT_ID > src/types/supabase.ts
else
  # Use provided project ID
  echo "Using project ID: $1"
  npx supabase gen types typescript --project-id $1 > src/types/supabase.ts
fi

if [ $? -eq 0 ]; then
  echo "✅ Types regenerated successfully!"
  echo "📁 Output: src/types/supabase.ts"
else
  echo "❌ Failed to regenerate types"
  exit 1
fi

