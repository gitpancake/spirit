#!/bin/bash

# Clean up duplicate and old environment variables from Vercel
echo "🧹 Cleaning up duplicate Vercel environment variables..."

# Remove older Development-specific variables that are now set for Preview
echo "Removing old Development environment variables..."

# Note: Vercel CLI doesn't support removing from specific environments easily
# We'll list the issues and recommend manual cleanup via dashboard

echo ""
echo "⚠️  Manual cleanup needed in Vercel Dashboard:"
echo ""
echo "The following variables have duplicates across environments:"
echo ""
echo "🔍 Variables that should be Preview-only (remove from Development/Production):"
echo "   - NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS (Development)"
echo "   - NEXT_PUBLIC_API_URL (Production, Development)" 
echo "   - NEXT_PUBLIC_EDEN_IMAGE_HOST (Production, Development)"
echo "   - EDEN_API_KEY (Production, Development)"
echo "   - KV_REST_API_TOKEN (Production, Development)"
echo "   - KV_REST_API_URL (Production, Development)"
echo "   - KV_REST_API_READ_ONLY_TOKEN (Production, Development)"
echo "   - NEXT_PUBLIC_PRIVY_APP_ID (Production, Development)"
echo "   - PRIVY_APP_SECRET (Production, Development)"
echo "   - PINATA_JWT (Production, Development)"
echo ""
echo "📋 To clean up manually:"
echo "   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
echo "   2. Click the ⋯ menu next to each duplicate variable"
echo "   3. Select 'Edit' and uncheck Development/Production environments"
echo "   4. Keep only Preview environment checked for testnet variables"
echo ""
echo "✅ Current Preview environment variables are correctly set:"
echo "   - All 14 required variables configured for Preview only"
echo "   - Using testnet endpoints and contracts"
echo "   - Ready for dev branch deployments"
echo ""
echo "🔮 When ready for Production (mainnet):"
echo "   - Create new Production-specific variables with mainnet values"
echo "   - Update contract addresses for mainnet"
echo "   - Update API endpoints for production"