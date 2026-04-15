#!/bin/bash

# HRM STAR B.O.R.N. + Atlantean Intelligence Full Stack Startup

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🧠  HRM STAR B.O.R.N. + Atlantean Intelligence Startup"
echo "════════════════════════════════════════════════════════════════"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python
echo -e "${YELLOW}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found${NC}"

# Check Node
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
pip install -q -r requirements.txt 2>/dev/null || {
    echo -e "${RED}Failed to install Python dependencies${NC}"
    exit 1
}
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Install Node dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Node dependencies...${NC}"
    npm install -q 2>/dev/null || {
        echo -e "${RED}Failed to install Node dependencies${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Node dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Node dependencies already installed${NC}"
fi

# Create data directory
mkdir -p data

# Check environment
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local from template...${NC}"
    cp .env.example .env.local
    echo -e "${YELLOW}Please edit .env.local and add your GEMINI_API_KEY${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🚀 Ready to start!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "In separate terminals, run:"
echo ""
echo "  Terminal 1 (Atlantean Backend):"
echo "    python3 atlantean_backend.py"
echo ""
echo "  Terminal 2 (Express + Frontend):"
echo "    npm run dev"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
