#!/bin/bash

set -e

echo "🚀 Setting up Bunner Development Environment..."
echo "📦 Setting up system..."
echo "[SYSTEM] Updating packages..."
sudo apt-get update -qq -y

echo "[SYSTEM] Installing packages..."
sudo apt-get install -y -qq \
    protobuf-compiler

echo "[SYSTEM] Upgrading packages..."
sudo apt-get upgrade -qq -y

echo "🔧 Install project dependencies..."
rm -rf node_modules bun.lock bun.lockb
bun pm cache rm
bun install

echo ""
echo "🎉 Bunner Development Environment setup completed!"
echo "🚀 Ready to start development!"
