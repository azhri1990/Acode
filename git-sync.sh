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

function llm_commit() {
    echo -e "${BLUE}=== LLM-Assisted Commit ===${NC}"
    
    # Get staged changes
    CHANGES=$(git diff --cached --stat 2>/dev/null)
    if [ -z "$CHANGES" ]; then
        echo -e "${YELLOW}⚠ No staged changes found${NC}"
        echo -e "${YELLOW}Use 'git add' to stage changes first${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Staged changes:${NC}"
    echo "$CHANGES"
    echo ""
    
    # Try to use OpenAI API for commit message generation
    if [ -n "$OPENAI_API_KEY" ]; then
        echo -e "${BLUE}Generating AI commit message...${NC}"
        # TODO: Integrate with OpenAI API via MCP bridge
        echo -e "${YELLOW}⚠ LLM commit message generation not yet implemented${NC}"
        echo -e "${YELLOW}Set OPENAI_API_KEY environment variable to enable${NC}"
    else
        echo -e "${YELLOW}⚠ OPENAI_API_KEY not set${NC}"
    fi
    
    echo ""
    read -p "Enter commit message: " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        echo -e "${RED}Error: Commit message required${NC}"
        return 1
    fi
    
    git commit -m "$COMMIT_MSG" && \
        echo -e "${GREEN}✓ Commit successful${NC}" || \
        echo -e "${RED}✗ Commit failed${NC}"
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
    llm-commit)
        llm_commit
        ;;
    *)
        echo "Acode Git-Sync Helper"
        echo ""
        echo "Usage: $0 {status|pull|push|full|llm-commit}"
        echo ""
        echo "Commands:"
        echo "  status      - Show current sync status"
        echo "  pull        - Pull latest changes from remote"
        echo "  push        - Push local changes to remote"
        echo "  full        - Run full sync (pull + status)"
        echo "  llm-commit  - Create commit with AI-generated message"
        echo ""
        exit 1
        ;;
esac
