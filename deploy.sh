#!/bin/bash
# Automated Deployment Script for Dan Tranh Tablature
# Usage: ./deploy.sh "Your commit message"

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Dan Tranh Tablature Deployment${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if commit message provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a commit message${NC}"
    echo -e "${YELLOW}Usage: ./deploy.sh \"Your commit message\"${NC}"
    exit 1
fi

COMMIT_MSG="$1"

# Step 1: Check git status
echo -e "${YELLOW}Step 1: Checking git status...${NC}"
git status

# Step 2: Add all changes
echo -e "\n${YELLOW}Step 2: Adding all changes...${NC}"
git add .

# Step 3: Show what will be committed
echo -e "\n${YELLOW}Step 3: Changes to be committed:${NC}"
git status --short

# Step 4: Commit
echo -e "\n${YELLOW}Step 4: Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

# Step 5: Push to GitHub
echo -e "\n${YELLOW}Step 5: Pushing to GitHub (main branch)...${NC}"
git push origin main

# Success message
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Repository: https://github.com/Anhthupg/DanTranhTablature${NC}"
echo -e "${GREEN}Commit: $COMMIT_MSG${NC}\n"
