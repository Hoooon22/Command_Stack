#!/bin/bash

set -e

echo "🚀 CommandStack Build Script"
echo "=============================="

# 1. Clean previous builds
echo ""
echo "📦 Cleaning previous builds..."
rm -rf electron/dist
rm -rf client/dist
rm -rf server/build

# 2. Build React Client
echo ""
echo "⚛️  Building React client..."
cd client
npm install
npm run build
cd ..

# 3. Build Spring Boot Server
echo ""
echo "☕ Building Spring Boot server..."
cd server
./gradlew clean bootJar
cd ..

# 4. Install Electron dependencies
echo ""
echo "⚡ Installing Electron dependencies..."
cd electron
npm install
cd ..

# 5. Build Electron app
echo ""
echo "📦 Building Electron application..."
cd electron

if [ "$1" == "mac" ]; then
  echo "🍎 Building for macOS (DMG)..."
  npm run dist:mac
elif [ "$1" == "win" ]; then
  echo "🪟 Building for Windows (EXE)..."
  npm run dist:win
else
  echo "🔧 Building for all platforms..."
  npm run dist
fi

cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Distribution files:"
find electron/dist -type f \( -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" \) 2>/dev/null || echo "No distribution files found yet"
