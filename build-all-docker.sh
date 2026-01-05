#!/bin/bash

set -e

echo "🐳 Docker를 사용한 크로스 플랫폼 빌드"
echo "======================================"
echo ""
echo "⚠️  요구사항: Docker Desktop 설치 필요"
echo ""

# Docker 확인
if ! command -v docker &> /dev/null; then
  echo "❌ Docker가 설치되어 있지 않습니다."
  echo "   https://www.docker.com/products/docker-desktop 에서 설치하세요."
  exit 1
fi

echo "1️⃣  macOS 빌드 (로컬)..."
./build.sh mac

echo ""
echo "2️⃣  Windows 빌드 (Docker)..."
docker run --rm -ti \
  --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}:/project \
  -v ${PWD##*/}-node-modules:/project/node_modules \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "cd /project/electron && npm install && npm run dist:win"

echo ""
echo "3️⃣  Linux 빌드 (Docker)..."
docker run --rm -ti \
  --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
  -v ${PWD}:/project \
  -v ${PWD##*/}-node-modules:/project/node_modules \
  electronuserland/builder:latest \
  /bin/bash -c "cd /project/electron && npm install && npm run dist -- --linux"

echo ""
echo "✅ 모든 플랫폼 빌드 완료!"
echo ""
echo "📦 생성된 파일:"
find electron/dist -type f \( -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" \)
