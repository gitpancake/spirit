#!/bin/bash

echo "🧹 Cleaning and setting up Vercel environment variables..."

# Step 1: Get all environment variable names and clean them
echo "Step 1: Removing all existing environment variables..."
vercel env ls --json | jq -r '.[].key' | grep -v '^VERCEL_' | sort | uniq | while read -r var; do
  if [[ ! -z "$var" ]]; then
    echo "Removing: $var"
    echo "y" | vercel env rm "$var" >/dev/null 2>&1 || echo "  (skipped - may not exist)"
  fi
done

echo ""
echo "Step 2: Adding fresh environment variables from .env.local..."

# Step 2: Add variables from .env.local with Vercel URLs
# Eden Configuration
printf "https://d14i3advvh2bvd.cloudfront.net/" | vercel env add NEXT_PUBLIC_EDEN_IMAGE_HOST preview --force
printf "6ce3b81bacf2fa08aa012362392f8b1a17c1b9357316fe67" | vercel env add EDEN_API_KEY preview --force

# Privy Configuration  
printf "cmevxnzfl00dsl40djn2byiy4" | vercel env add NEXT_PUBLIC_PRIVY_APP_ID preview --force
printf "2zXoDSbya8mZtx21WDeHe1zTsa7WAhTCjf9uXUmPTicLnDJtcT2xuPCBvFLy3zydPLxBJ6HqgLZ3sKtUDT8C9GCC" | vercel env add PRIVY_APP_SECRET preview --force

# Contract Configuration
printf "0x8EFceDA953e36b1510054f7Bb47A1f1Be51Edf94" | vercel env add NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS preview --force

# Ethereum Chain RPC URLs
printf "https://eth-sepolia.g.alchemy.com/v2/woj3USgV_BSc0xiC73SSn" | vercel env add NEXT_PUBLIC_SEPOLIA_RPC_URL preview --force
printf "https://eth-mainnet.g.alchemy.com/v2/woj3USgV_BSc0xiC73SSn" | vercel env add NEXT_PUBLIC_ETHEREUM_RPC_URL preview --force

# API Configuration (with correct Vercel URLs)
printf "https://test.api.eden-academy.xyz" | vercel env add NEXT_PUBLIC_API_URL preview --force
printf "https://test.eden-academy.xyz" | vercel env add NEXT_PUBLIC_BASE_URL preview --force
printf "11155111" | vercel env add NEXT_PUBLIC_DEFAULT_CHAIN_ID preview --force

# IPFS Configuration
printf "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2YmQxMzlhMC0wZWRiLTQ3OWMtYmY2YS00NDY2NmQ1ZDM3ODciLCJlbWFpbCI6InB5ZS5oZW5yeUBwcm90b25tYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJlM2MxZTM2ZTBiMDkzN2NhNjRlYiIsInNjb3BlZEtleVNlY3JldCI6ImIyNWYzZWNmNTVjNmVkNjE0NWZhYjA2YTI4ZmZmNDgyMzNhOGYwOWY3NjgyZDc2NTZmZWI0NDRjZDk5ZTU0NzkiLCJleHAiOjE3ODc4NDU3NTV9.l6jx13iEqsF09HaO23WjFVUBFUKVO197LuDjAXA8PMs" | vercel env add PINATA_JWT preview --force

echo ""
echo "✅ Vercel environment variables cleaned and configured!"
echo ""
echo "📋 Variables set for Preview environment:"
echo "   - NEXT_PUBLIC_EDEN_IMAGE_HOST"
echo "   - EDEN_API_KEY"
echo "   - NEXT_PUBLIC_PRIVY_APP_ID"
echo "   - PRIVY_APP_SECRET"
echo "   - NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS"
echo "   - NEXT_PUBLIC_SEPOLIA_RPC_URL"
echo "   - NEXT_PUBLIC_ETHEREUM_RPC_URL"  
echo "   - NEXT_PUBLIC_API_URL (https://test.api.eden-academy.xyz)"
echo "   - NEXT_PUBLIC_BASE_URL (https://test.eden-academy.xyz)"
echo "   - NEXT_PUBLIC_DEFAULT_CHAIN_ID"
echo "   - PINATA_JWT"
echo ""
echo "💡 Note: KV/Redis variables are managed by Vercel Storage integration"