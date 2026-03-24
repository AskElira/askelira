#!/bin/bash
set -e

echo "Deploying AskElira 2.1..."

# Build locally first
npm run build

# Deploy to Vercel
vercel --prod

echo "Deployment complete!"
echo "Visit: https://www.askelira.com"
