#!/bin/bash

# CommandStack 아이콘 생성 스크립트
# 사용법: ./generate-icons.sh <source-icon.png>

set -e

if [ -z "$1" ]; then
  echo "사용법: ./generate-icons.sh <source-icon.png>"
  echo "예: ./generate-icons.sh ~/Downloads/my-icon.png"
  exit 1
fi

SOURCE_ICON="$1"

if [ ! -f "$SOURCE_ICON" ]; then
  echo "❌ 파일을 찾을 수 없습니다: $SOURCE_ICON"
  exit 1
fi

echo "🎨 CommandStack 아이콘 생성 중..."
echo "원본: $SOURCE_ICON"
echo ""

# electron-icon-builder 설치 확인
if ! command -v electron-icon-builder &> /dev/null; then
  echo "📦 electron-icon-builder 설치 중..."
  npm install -g electron-icon-builder
fi

# 아이콘 생성
echo "⚡ 아이콘 생성 중..."
cd electron
electron-icon-builder --input="$SOURCE_ICON" --output=assets --flatten

echo ""
echo "✅ 아이콘 생성 완료!"
echo ""
echo "생성된 파일:"
ls -lh assets/icon.*

echo ""
echo "📦 이제 다시 빌드하세요:"
echo "  ./build.sh mac"
