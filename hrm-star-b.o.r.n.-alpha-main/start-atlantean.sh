#!/bin/bash

# Start Atlantean Backend Server

set -e

echo "🧠 Starting Atlantean Intelligence Backend..."
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 not found"
    exit 1
fi

# Check for required modules
python3 -c "import flask, torch, numpy" 2>/dev/null || {
    echo "Installing dependencies..."
    pip install -q -r requirements.txt
}

# Create data directory
mkdir -p data

# Start server
python3 atlantean_backend.py
