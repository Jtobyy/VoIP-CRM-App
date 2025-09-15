#!/bin/bash

echo "🧹 Starting complete project cleanup..."

# Navigate to project root (adjust path as needed)
cd /Users/apple/Dev/NativetalkBusiness

# Clean React Native
echo "📱 Cleaning React Native..."
npx react-native clean

# Clean npm/yarn cache
# echo "📦 Cleaning package manager cache..."
# npm cache clean --force
# If using yarn: yarn cache clean

# Remove node_modules and reinstall
# echo "🗑️  Removing node_modules..."
# rm -rf node_modules
# echo "📥 Reinstalling dependencies..."
# npm install
# If using yarn: yarn install

# Navigate to iOS directory
cd ios

# Clean CocoaPods
echo "🍫 Cleaning CocoaPods..."
rm -rf Pods
rm -rf Podfile.lock
rm -rf build
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Reinstall pods
echo "📲 Reinstalling pods..."
pod deintegrate
pod cache clean --all
pod install

echo "✅ Cleanup complete! Try building again."