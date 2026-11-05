# Acode Gitflow & Git-Sync Configuration

## 📋 Overview

This document describes the gitflow branching model and git-sync automation configured for the Acode repository.

---

## 🌿 Gitflow Branching Model

### Branch Structure

```
main          ← Production-ready code
  │
  └── develop   ← Development branch (next release)
        │
        ├── feature/  ← New features
        ├── bugfix/   ← Bug fixes
        ├── release/  ← Release preparation
        └── hotfix/   ← Production hotfixes
```

### Branch Naming Conventions

| Branch Type | Prefix | Example |
|-------------|--------|---------|
| **Feature** | `feature/` | `feature/admob-integration` |
| **Bugfix** | `bugfix/` | `bugfix/login-crash` |
| **Release** | `release/` | `release/v1.13.5` |
| **Hotfix** | `hotfix/` | `hotfix/critical-patch` |

### Branch Lifecycle

1. **Feature Branch**
   - Created from: `develop`
   - Merged to: `develop`
   - Naming: `feature/<description>`

2. **Bugfix Branch**
   - Created from: `develop` or `main`
   - Merged to: `develop` or `main`
   - Naming: `bugfix/<description>`

3. **Release Branch**
   - Created from: `develop`
   - Merged to: `main` and `develop`
   - Naming: `release/v1.x.x`

4. **Hotfix Branch**
   - Created from: `main`
   - Merged to: `main` and `develop`
   - Naming: `hotfix/v1.x.x`

---

## 🔄 Git-Sync Automation

### Configuration Settings

| Setting | Value | Description |
|---------|-------|-------------|
| `sync.interval` | `300` | Sync every 5 minutes (300 seconds) |
| `sync.autopull` | `true` | Auto-pull before operations |
| `sync.autopush` | `false` | Manual push required (safe) |
| `sync.remote` | `origin` | Default remote repository |
| `sync.conflict` | `manual` | Manual conflict resolution |
| `sync.notify` | `true` | Enable sync notifications |

### Sync Workflow

#### Automatic Sync (Every 5 Minutes)
1. Pre-sync hook runs: "🔄 Starting git sync..."
2. Pulls latest changes from `origin` (if `sync.autopull` enabled)
3. Resolves any conflicts manually
4. Post-sync hook runs: "✅ Git sync completed!"

#### Manual Sync
```bash
# Pull latest changes
git pull origin develop

# OR sync with specific branch
git sync-develop
```

#### Push Operations
```bash
# Manual push (recommended)
git push origin fix/v1.13.5-review-findings

# Push with tags
git push origin --follow-tags
```

---

## 📦 Current Repository Status

### Branches
```bash
* fix/v1.13.5-review-findings  ← HEAD (active branch)
  main                         ← Production branch
  develop                      ← Development branch
```

### Commits (Recent)
```
ec8e29d - build(plugins): update plugin versions to match package.json
9391b32 - build(plugins): rebuild admob plugin and update cordova dependencies
b59406d - fix: update repository URLs to Acode-Foundation
ce48cd9 - fix(dev): add error handling for network interface access
3406a92 - fix(tabs): defer touch context menu past synthetic click
d1d10ca - fix(editor): preserve case-sensitive filename matchers
```

### Remote
```
origin  https://github.com/Acode-Foundation/Acode.git
```

---

## 🛠️ Usage Commands

### Gitflow Operations

```bash
# Start a new feature
git flow feature start feature/admob-integration

# Finish a feature
git flow feature finish feature/admob-integration

# Start a release
git flow release start release/v1.13.5

# Finish a release
git flow release finish release/v1.13.5

# Start a hotfix
git flow hotfix start hotfix/critical-patch v1.13.5

# Finish a hotfix
git flow hotfix finish hotfix/critical-patch
```

### Sync Operations

```bash
# Manual sync (pull latest)
git pull origin develop

# Push current branch
git push origin HEAD

# Push with tags
git push origin --follow-tags

# Check sync status
git config --get-regexp "sync\."
```

### Branch Management

```bash
# List all branches
git branch -a

# Create and switch to new branch
git checkout -b feature/new-plugin

# Switch to develop
git checkout develop

# Switch to main
git checkout main
```

---

## ⚠️ Important Notes

### 1. Push Requires Authentication
Due to GitHub authentication requirements:
- Use Personal Access Token (PAT) for push operations
- Or run `gh auth login` for interactive login
- Embed token in URL: `git push https://TOKEN@github.com/...`

### 2. Conflict Resolution
- Conflicts are set to `manual` resolution
- Always review merged changes carefully
- Test thoroughly after sync operations

### 3. Branch Protection
- `main` branch should only receive merges from `release` or `hotfix` branches
- `develop` branch is the integration point for all features
- Never push directly to `main` from feature branches

### 4. Recommended Workflow
```bash
# 1. Create feature branch from develop
git checkout develop
git checkout -b feature/some-feature

# 2. Develop and commit
git add .
git commit -m "feat: add some feature"

# 3. Push feature branch
git push origin feature/some-feature

# 4. Finish feature (merges to develop)
git flow feature finish feature/some-feature

# 5. Sync develop
git pull origin develop

# 6. Push develop
git push origin develop
```

---

## ✅ Summary

**Gitflow Setup:**
- ✅ Branch prefixes configured
- ✅ Branch lifecycle ready
- ✅ Operations documented

**Git-Sync Setup:**
- ✅ Auto-pull enabled (5 min interval)
- ✅ Manual push required (safe)
- ✅ Conflict resolution configured
- ✅ Hooks installed

**Your Acode repository is now fully configured with professional git workflow management!** 🎉

---

*Last updated: 2026-11-05*
*Repository: /data/user/0/com.foxdebug.acode/files/public/Acode*