#!/bin/bash

# Vercel Environment Variables Setup Script
# This script sets up environment variables for the Preview environment (dev branch)

echo "🚀 Setting up Vercel environment variables for Preview environment..."

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ Project not linked to Vercel. Please run 'vercel link' first."
    exit 1
fi

echo "📝 Setting environment variables..."

# Privy Configuration
echo "Setting Privy configuration..."
echo "cmevxnzfl00dsl40djn2byiy4" | vercel env add NEXT_PUBLIC_PRIVY_APP_ID preview --force
echo "2zXoDSbya8mZtx21WDeHe1zTsa7WAhTCjf9uXUmPTicLnDJtcT2xuPCBvFLy3zydPLxBJ6HqgLZ3sKtUDT8C9GCC" | vercel env add PRIVY_APP_SECRET preview --force

# API Configuration
echo "Setting API configuration..."
echo "https://test.api.eden-academy.xyz" | vercel env add NEXT_PUBLIC_API_URL preview --force
echo "https://academy.eden2.io" | vercel env add NEXT_PUBLIC_BASE_URL preview --force
echo "11155111" | vercel env add NEXT_PUBLIC_DEFAULT_CHAIN_ID preview --force

# Contract Configuration
echo "Setting contract configuration..."
echo "0x8EFceDA953e36b1510054f7Bb47A1f1Be51Edf94" | vercel env add NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS preview --force

# Ethereum RPC URLs
echo "Setting RPC URLs..."
echo "https://eth-mainnet.g.alchemy.com/v2/woj3USgV_BSc0xiC73SSn" | vercel env add NEXT_PUBLIC_ETHEREUM_RPC_URL preview --force
echo "https://eth-sepolia.g.alchemy.com/v2/woj3USgV_BSc0xiC73SSn" | vercel env add NEXT_PUBLIC_SEPOLIA_RPC_URL preview --force

# Eden API Integration
echo "Setting Eden API configuration..."
echo "6ce3b81bacf2fa08aa012362392f8b1a17c1b9357316fe67" | vercel env add EDEN_API_KEY preview --force
echo "https://d14i3advvh2bvd.cloudfront.net/" | vercel env add NEXT_PUBLIC_EDEN_IMAGE_HOST preview --force

# IPFS Storage
echo "Setting IPFS configuration..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2YmQxMzlhMC0wZWRiLTQ3OWMtYmY2YS00NDY2NmQ1ZDM3ODciLCJlbWFpbCI6InB5ZS5oZW5yeUBwcm90b25tYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJlM2MxZTM2ZTBiMDkzN2NhNjRlYiIsInNjb3BlZEtleVNlY3JldCI6ImIyNWYzZWNmNTVjNmVkNjE0NWZhYjA2YTI4ZmZmNDgyMzNhOGYwOWY3NjgyZDc2NTZmZWI0NDRjZDk5ZTU0NzkiLCJleHAiOjE3ODc4NDU3NTV9.l6jx13iEqsF09HaO23WjFVUBFUKVO197LuDjAXA8PMs" | vercel env add PINATA_JWT preview --force

# Redis/KV Database  
echo "Setting Redis/KV configuration..."
printf "https://on-dingo-20127.upstash.io" | vercel env add KV_REST_API_URL preview --force
printf "AU6fAAIncDFkMTBjZDBjZTQ0MDg0MWUwYjIzZWU1YjkxYzE4ZThiNnAxMjAxMjc" | vercel env add KV_REST_API_TOKEN preview --force
printf "Ak6fAAIgcDEfMpm4Pz-KzE3Hh10s8oskbjOY0Ls8jydLNFW-_bupmg" | vercel env add KV_REST_API_READ_ONLY_TOKEN preview --force

echo ""
echo "✅ All environment variables have been set for the Preview environment!"
echo ""
echo "📋 Variables set:"
echo "   - Privy authentication"
echo "   - API endpoints"  
echo "   - Contract addresses"
echo "   - RPC URLs"
echo "   - Eden API integration"
echo "   - IPFS storage"
echo "   - Redis/KV database"
echo ""
echo "🔄 Next steps:"
echo "   1. Deploy to verify everything works: vercel --prod=false"
echo "   2. Check your Vercel dashboard to confirm variables are set"
echo "   3. Test a preview deployment from the dev branch"
echo ""
echo "💡 Tip: You can view all environment variables with:"
echo "   vercel env ls"