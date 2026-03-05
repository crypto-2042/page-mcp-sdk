#!/bin/bash
# Build script for Vercel deployment
# Builds all packages, then assembles a public/ directory preserving
# the relative path structure so demo/index.html can reference
# ../packages/*/dist/* unchanged.

set -e

echo "🔨 Building all packages..."
pnpm run build

echo "📦 Assembling public directory..."
rm -rf public
mkdir -p public/demo
mkdir -p public/packages/core/dist
mkdir -p public/packages/chat/dist

# Copy demo page
cp demo/index.html public/demo/index.html

# Copy built assets (only the files needed by the demo)
cp packages/core/dist/index.global.js     public/packages/core/dist/
cp packages/core/dist/index.global.js.map public/packages/core/dist/
cp packages/chat/dist/index.global.js     public/packages/chat/dist/
cp packages/chat/dist/index.global.js.map public/packages/chat/dist/

echo "✅ Done! public/ directory ready for deployment."
echo ""
echo "   public/"
echo "   ├── demo/"
echo "   │   └── index.html"
echo "   └── packages/"
echo "       ├── core/dist/index.global.js"
echo "       └── chat/dist/index.global.js"
