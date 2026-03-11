#!/bin/bash
# Build script for Vercel deployment
# Assembles a public/ directory from already-built package artifacts
# while preserving the relative path structure expected by demo/index.html.

set -e

if [ ! -f packages/core/dist/index.global.js ] || [ ! -f packages/chat/dist/index.global.js ]; then
  echo "❌ Missing built assets. Run the root build first so demo dependencies are compiled."
  exit 1
fi

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
