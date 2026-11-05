#!/bin/bash
# Acode Git-Sync Helper Script
# Provides easy commands for git sync operations

REPO_DIR="/data/user/0/com.foxdebug.acode/files/public/Acode"
cd "$REPO_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function sync_status() {
    echo -e "${BLUE}=== Git Sync Status ===${NC}"
    echo ""
    echo "Current branch: $(git branch --show-current)"
    echo "Remote: $(git config sync.remote)"
    echo "Auto-pull: $(git config sync.autopull)"
    echo "Auto-push: $(git config sync.autopush)"
    echo "Sync interval: $(git config sync.interval)s"
    echo ""
    echo -e "${GREEN}Local status:${NC}"
    git status -sb
}

function sync_pull() {
    echo -e "${BLUE}=== Pulling latest changes ===${NC}"
    REMOTE=$(git config sync.remote || echo "origin")
    BRANCH=$(git branch --show-current)
    
    echo "Pulling from $REMOTE/$BRANCH..."
    git pull "$REMOTE" "$BRANCH" && \
        echo -e "${GREEN}✓ Pull successful${NC}" || \
        echo -e "${RED}✗ Pull failed${NC}"
}

function sync_push() {
    echo -e "${BLUE}=== Pushing changes ===${NC}"
    REMOTE=$(git config sync.remote || echo "origin")
    BRANCH=$(git branch --show-current)
    
    echo "Pushing to $REMOTE/$BRANCH..."
    git push "$REMOTE" "$BRANCH" && \
        echo -e "${GREEN}✓ Push successful${NC}" || \
        echo -e "${RED}✗ Push failed - check authentication${NC}"
}

function sync_full() {
    echo -e "${BLUE}=== Running full sync ===${NC}"
    sync_pull
    echo ""
    sync_status
}

# Main command handler
case "$1" in
    status)
        sync_status
        ;;
    pull)
        sync_pull
        ;;
    push)
        sync_push
        ;;
    full)
        sync_full
        ;;
    *)
        echo "Acode Git-Sync Helper"
        echo ""
        echo "Usage: $0 {status|pull|push|full}"
        echo ""
        echo "Commands:"
        echo "  status  - Show current sync status"
        echo "  pull    - Pull latest changes from remote"
        echo "  push    - Push local changes to remote"
        echo "  full    - Run full sync (pull + status)"
        echo ""
        exit 1
        ;;
esac
