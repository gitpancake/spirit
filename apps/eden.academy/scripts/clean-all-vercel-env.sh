#!/bin/bash

echo "🧹 Removing ALL environment variables from Vercel project..."

# List of environment variables to remove (everything except VERCEL_* system vars)
ENV_VARS=(
  "KV_URL"
  "KV_REST_API_READ_ONLY_TOKEN" 
  "REDIS_URL"
  "KV_REST_API_TOKEN"
  "KV_REST_API_URL"
  "PINATA_JWT"
  "NEXT_PUBLIC_EDEN_IMAGE_HOST"
  "EDEN_API_KEY"
  "NEXT_PUBLIC_SEPOLIA_RPC_URL"
  "NEXT_PUBLIC_ETHEREUM_RPC_URL"
  "NEXT_PUBLIC_SPIRIT_REGISTRY_ADDRESS"
  "NEXT_PUBLIC_DEFAULT_CHAIN_ID"
  "NEXT_PUBLIC_BASE_URL"
  "NEXT_PUBLIC_API_URL"
  "PRIVY_APP_SECRET"
  "NEXT_PUBLIC_PRIVY_APP_ID"
)

echo "Removing environment variables..."

for var in "${ENV_VARS[@]}"; do
  echo "Removing $var..."
  echo "y" | vercel env rm "$var" 2>/dev/null || echo "  (variable not found or already removed)"
done

echo ""
echo "✅ All custom environment variables removed from Vercel!"
echo "   (System variables like VERCEL_ENV are preserved)"