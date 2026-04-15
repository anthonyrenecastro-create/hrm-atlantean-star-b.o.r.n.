#!/bin/bash

# Start Frontend + Express Server

set -e

echo "🎨 Starting Express + Frontend Server"
echo ""

# Check for Node
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install -q
fi

# Start dev server
npm run dev
