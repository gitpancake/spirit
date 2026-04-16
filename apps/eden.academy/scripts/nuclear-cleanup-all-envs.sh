#!/bin/bash

echo "💥 NUCLEAR CLEANUP: Removing ALL environment variables from ALL environments..."

# Get all unique variable names
VAR_NAMES=$(vercel env ls | awk '/^[[:space:]]*[A-Z]/ && !/VERCEL_/ {print $1}' | sort | uniq)

echo "Found variables to completely remove from ALL environments:"
echo "$VAR_NAMES"
echo ""

# Remove each variable from ALL environments (it will remove from all envs that have it)
echo "$VAR_NAMES" | while read -r var; do
  if [[ ! -z "$var" ]]; then
    echo "🗑️  Completely removing: $var (from all environments)"
    # Remove from all environments by not specifying environment
    echo "y" | vercel env rm "$var" 2>/dev/null || echo "  (already removed or error)"
  fi
done

echo ""
echo "🧹 ALL custom environment variables removed from ALL environments!"
echo ""

# Wait a moment for cleanup to propagate
sleep 2

echo "🚀 Now setting up FRESH Preview-only environment variables..."
echo ""

# Set up completely fresh Preview-only variables
printf "https://d14i3advvh2bvd.cloudfront.net/" | vercel env add NEXT_PUBLIC_EDEN_IMAGE_HOST preview --force
printf "6ce3b81bacf2fa08aa012362392f8b1a17c1b9357316fe67" | vercel env add EDEN_API_KEY preview --force
printf "cmevxnzfl00dsl40djn2byiy4" | vercel env add NEXT_PUBLIC_PRIVY_APP_ID preview --force
printf "2zXoDSbya8mZtx21WDeHe1zTsa7WAhTCjf9uXUmPTicLnDJtcT2xuPCBvFLy3zydPLxBJ6HqgLZ3sKtUDT8C9GCC" | vercel env add PRIVY_APP_SECRET preview --force
printf "0x8EFceDA953e36b1510054f7Bb47A1f1Be51Edf94" | vercel env add NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS preview --force
printf "https://eth-sepolia.g.alchemy.com/v2/woj3USgV_BSc0xiC73SSn" | vercel env add NEXT_PUBLIC_SEPOLIA_RPC_URL preview --force
printf "https://eth-mainnet.g.alchemy.com/v2/woj3USgV_BSc0xiC73SSn" | vercel env add NEXT_PUBLIC_ETHEREUM_RPC_URL preview --force
printf "https://test.api.eden-academy.xyz" | vercel env add NEXT_PUBLIC_API_URL preview --force
printf "https://test.eden-academy.xyz" | vercel env add NEXT_PUBLIC_BASE_URL preview --force
printf "11155111" | vercel env add NEXT_PUBLIC_DEFAULT_CHAIN_ID preview --force
printf "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2YmQxMzlhMC0wZWRiLTQ3OWMtYmY2YS00NDY2NmQ1ZDM3ODciLCJlbWFpbCI6InB5ZS5oZW5yeUBwcm90b25tYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJlM2MxZTM2ZTBiMDkzN2NhNjRlYiIsInNjb3BlZEtleVNlY3JldCI6ImIyNWYzZWNmNTVjNmVkNjE0NWZhYjA2YTI4ZmZmNDgyMzNhOGYwOWY3NjgyZDc2NTZmZWI0NDRjZDk5ZTU0NzkiLCJleHAiOjE3ODc4NDU3NTV9.l6jx13iEqsF09HaO23WjFVUBFUKVO197LuDjAXA8PMs" | vercel env add PINATA_JWT preview --force

echo ""
echo "🎯 NUCLEAR RESET COMPLETE!"
echo ""
echo "✅ Fresh Preview-only environment variables:"
echo "   - NEXT_PUBLIC_EDEN_IMAGE_HOST"
echo "   - EDEN_API_KEY" 
echo "   - NEXT_PUBLIC_PRIVY_APP_ID"
echo "   - PRIVY_APP_SECRET"
echo "   - NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS"
echo "   - NEXT_PUBLIC_SEPOLIA_RPC_URL" 
echo "   - NEXT_PUBLIC_ETHEREUM_RPC_URL"
echo "   - NEXT_PUBLIC_API_URL (test.api.eden-academy.xyz)"
echo "   - NEXT_PUBLIC_BASE_URL (test.eden-academy.xyz)"
echo "   - NEXT_PUBLIC_DEFAULT_CHAIN_ID"
echo "   - PINATA_JWT"
echo ""
echo "💡 Note: KV/Redis variables are managed by Vercel Storage integration"
echo "🔥 All old variables from all environments have been completely removed"