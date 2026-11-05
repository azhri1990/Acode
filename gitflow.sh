#!/bin/bash
# Acode Gitflow Helper Script
# Provides easy commands for gitflow operations

REPO_DIR="/data/user/0/com.foxdebug.acode/files/public/Acode"
cd "$REPO_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function show_branches() {
    echo -e "${BLUE}=== Branch Overview ===${NC}"
    echo ""
    echo "Current branch: $(git branch --show-current)"
    echo ""
    echo -e "${GREEN}Local branches:${NC}"
    git branch
    echo ""
    echo -e "${GREEN}Recent commits:${NC}"
    git log --oneline --graph --decorate -5
}

function feature_start() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Feature name required${NC}"
        echo "Usage: $0 feature-start <name>"
        exit 1
    fi
    
    FEATURE_NAME="$1"
    BRANCH_NAME="feature/$FEATURE_NAME"
    
    echo -e "${BLUE}=== Starting feature: $FEATURE_NAME ===${NC}"
    
    # Ensure we're on develop
    git checkout develop 2>/dev/null || {
        echo -e "${YELLOW}Develop branch not found. Creating from current branch...${NC}"
        git checkout -b develop
    }
    
    # Pull latest
    git pull origin develop 2>/dev/null || echo -e "${YELLOW}Could not pull from origin/develop${NC}"
    
    # Create feature branch
    git checkout -b "$BRANCH_NAME" && \
        echo -e "${GREEN}✓ Feature branch created: $BRANCH_NAME${NC}" || \
        echo -e "${RED}✗ Failed to create feature branch${NC}"
}

function feature_finish() {
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [[ ! "$CURRENT_BRANCH" =~ ^feature/ ]]; then
        echo -e "${RED}Error: Not on a feature branch${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}=== Finishing feature: $CURRENT_BRANCH ===${NC}"
    
    # Switch to develop
    git checkout develop || {
        echo -e "${RED}✗ Could not switch to develop${NC}"
        exit 1
    }
    
    # Merge feature
    git merge --no-ff "$CURRENT_BRANCH" && \
        echo -e "${GREEN}✓ Feature merged to develop${NC}" || {
        echo -e "${RED}✗ Merge failed - resolve conflicts manually${NC}"
        exit 1
    }
    
    # Optionally delete feature branch
    echo -e "${YELLOW}Delete feature branch? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git branch -d "$CURRENT_BRANCH" && \
            echo -e "${GREEN}✓ Feature branch deleted${NC}"
    fi
}

function release_start() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Version required${NC}"
        echo "Usage: $0 release-start <version>"
        exit 1
    fi
    
    VERSION="$1"
    BRANCH_NAME="release/$VERSION"
    
    echo -e "${BLUE}=== Starting release: $VERSION ===${NC}"
    
    # Ensure we're on develop
    git checkout develop || exit 1
    
    # Create release branch
    git checkout -b "$BRANCH_NAME" && \
        echo -e "${GREEN}✓ Release branch created: $BRANCH_NAME${NC}" || \
        echo -e "${RED}✗ Failed to create release branch${NC}"
}

function hotfix_start() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Version required${NC}"
        echo "Usage: $0 hotfix-start <version>"
        exit 1
    fi
    
    VERSION="$1"
    BRANCH_NAME="hotfix/$VERSION"
    
    echo -e "${BLUE}=== Starting hotfix: $VERSION ===${NC}"
    
    # Ensure we're on main
    git checkout main 2>/dev/null || {
        echo -e "${YELLOW}Main branch not found. Using current branch...${NC}"
    }
    
    # Create hotfix branch
    git checkout -b "$BRANCH_NAME" && \
        echo -e "${GREEN}✓ Hotfix branch created: $BRANCH_NAME${NC}" || \
        echo -e "${RED}✗ Failed to create hotfix branch${NC}"
}

function show_config() {
    echo -e "${BLUE}=== Gitflow Configuration ===${NC}"
    echo ""
    git config --get-regexp "gitflow\."
    echo ""
    echo -e "${BLUE}=== Git-Sync Configuration ===${NC}"
    echo ""
    git config --get-regexp "sync\."
}

# Main command handler
case "$1" in
    branches)
        show_branches
        ;;
    feature-start)
        feature_start "$2"
        ;;
    feature-finish)
        feature_finish
        ;;
    release-start)
        release_start "$2"
        ;;
    hotfix-start)
        hotfix_start "$2"
        ;;
    config)
        show_config
        ;;
    *)
        echo "Acode Gitflow Helper"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  branches         - Show branch overview"
        echo "  feature-start    - Start new feature branch"
        echo "  feature-finish   - Finish current feature branch"
        echo "  release-start    - Start new release branch"
        echo "  hotfix-start     - Start new hotfix branch"
        echo "  config           - Show gitflow configuration"
        echo ""
        echo "Examples:"
        echo "  $0 feature-start my-new-feature"
        echo "  $0 feature-finish"
        echo "  $0 release-start v1.14.0"
        echo "  $0 hotfix-start v1.13.6"
        echo ""
        exit 1
        ;;
esac
