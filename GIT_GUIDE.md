# 📚 Git & GitHub Setup Guide

This guide will help you set up Git, push your code to GitHub, and manage your portfolio project.

## 🎯 What You'll Achieve

- ✅ Set up Git for version control
- ✅ Create a GitHub repository
- ✅ Push your code to GitHub
- ✅ Manage updates and changes
- ✅ Showcase your project for interviews

---

## Step 1: Verify Git Installation

Open PowerShell and run:

```powershell
git --version
```

If Git is not installed, download from: https://git-scm.com/download/win

---

## Step 2: Configure Git (First Time Only)

```powershell
# Set your name (shows on commits)
git config --global user.name "Your Name"

# Set your email (use your GitHub email)
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list
```

---

## Step 3: Initial Commit (Already Done ✅)

Your repository is already initialized! Now let's commit your code:

```powershell
# Check status
git status

# Add all files
git add .

# Create your first commit
git commit -m "Initial commit: Complete Daily Puzzle Retention Engine"
```

---

## Step 4: Create GitHub Repository

1. Go to: https://github.com
2. Login or create an account
3. Click the **"+" icon** (top right) → **"New repository"**
4. Configure:
   - **Repository name**: `daily-puzzle-retention-engine`
   - **Description**: "Daily puzzle game with offline support, streak tracking, and 365-day heatmap"
   - **Visibility**: Choose **Public** (for portfolio) or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

---

## Step 5: Connect Local Repository to GitHub

GitHub will show you commands. Use these:

```powershell
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/daily-puzzle-retention-engine.git

# Verify remote
git remote -v

# Push code to GitHub (first time)
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 6: Making Updates (Daily Workflow)

When you make changes to your code:

```powershell
# 1. Check what changed
git status

# 2. Add specific files
git add filename.tsx
# OR add all changes
git add .

# 3. Commit with a message
git commit -m "Add feature: Description of what you changed"

# 4. Push to GitHub
git push
```

### Good Commit Messages Examples:
```
✅ "Add Sudoku validation logic"
✅ "Fix: Streak calculation bug"
✅ "Update: Improve heatmap performance"
✅ "Feature: Add hint system"
❌ "Update" (too vague)
❌ "Fixed stuff" (not descriptive)
```

---

## Step 7: Common Git Commands

```powershell
# View commit history
git log --oneline

# View changes before committing
git diff

# Undo changes to a file (before add)
git checkout -- filename.tsx

# Undo last commit (keep changes)
git reset --soft HEAD~1

# See all branches
git branch

# Create new branch for feature
git checkout -b feature-name

# Switch back to main
git checkout main

# Merge feature branch
git merge feature-name
```

---

## Step 8: Portfolio Preparation

### Update README for Portfolio

Your README.md is the first thing recruiters see. Make sure it includes:

1. **Screenshots** (add to README):
   ```markdown
   ## Screenshots
   ![Puzzle Game](./screenshots/game.png)
   ![Heatmap](./screenshots/heatmap.png)
   ```

2. **Live Demo Link** (when deployed):
   ```markdown
   ## 🚀 Live Demo
   [View Live Application](https://your-app.vercel.app)
   ```

3. **Technical Highlights**:
   - Mention technologies used
   - Architecture decisions
   - Performance optimizations

### Add Screenshots

1. Create `screenshots` folder:
   ```powershell
   mkdir screenshots
   ```

2. Take screenshots of your app
3. Add them to the folder
4. Commit and push:
   ```powershell
   git add screenshots/
   git commit -m "Add application screenshots"
   git push
   ```

---

## Step 9: Deploy to Vercel (Free Hosting)

Make your app live for interviews:

1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click **"Import Project"**
4. Select your `daily-puzzle-retention-engine` repository
5. Vercel will auto-detect Next.js
6. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_PUZZLE_SECRET_KEY`
7. Click **"Deploy"**
8. Your app will be live in ~2 minutes!

Update README with live link:
```powershell
git add README.md
git commit -m "Add live demo link"
git push
```

---

## Step 10: Interview Talking Points

### When discussing this project:

**Architecture:**
- "Built with Next.js 14 for SSR and API routes"
- "Offline-first architecture using IndexedDB"
- "Client-side puzzle validation prevents tampering"
- "Prisma ORM with SQLite/PostgreSQL"

**Features:**
- "Deterministic puzzle generation using seed-based randomization"
- "GitHub-style 365-day activity heatmap"
- "Real-time streak tracking with local-first approach"
- "Background sync when connection restores"

**Challenges Solved:**
- "Optimized for low server costs using edge computing"
- "Designed retention mechanics similar to Duolingo/Wordle"
- "Mobile-responsive with smooth animations"
- "Handles offline scenarios gracefully"

**Scalability:**
- "Minimal backend load - most logic runs client-side"
- "IndexedDB ensures instant loading regardless of server"
- "Efficient sync architecture - only uploads deltas"

---

## Quick Reference Card

```powershell
# Daily workflow
git status                    # Check changes
git add .                     # Stage all changes
git commit -m "message"       # Commit changes
git push                      # Upload to GitHub

# Check repo status
git remote -v                 # View GitHub connection
git log --oneline -5          # View last 5 commits
git branch                    # View branches

# Emergency fixes
git stash                     # Temporarily save work
git stash pop                 # Restore saved work
git reset --hard HEAD         # Discard all changes ⚠️
```

---

## Troubleshooting

### "fatal: remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/repo.git
```

### Authentication Issues
Use **Personal Access Token** instead of password:
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate token with `repo` scope
3. Use token as password when pushing

Or use **GitHub CLI**:
```powershell
winget install GitHub.cli
gh auth login
```

### Merge Conflicts
```powershell
git status                    # See conflicted files
# Edit files to resolve conflicts
git add .
git commit -m "Resolve merge conflict"
git push
```

---

## Next Steps

1. ✅ Initialize Git (Done)
2. ✅ Create first commit
3. ✅ Push to GitHub
4. 📸 Add screenshots
5. 🚀 Deploy to Vercel
6. 📝 Update README
7. 💼 Add to portfolio
8. 🎤 Practice explaining architecture

---

## Resources

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel Docs**: https://vercel.com/docs

---

## Interview Portfolio Checklist

Before interviews, ensure:

- [ ] Code is pushed to GitHub
- [ ] README has clear description
- [ ] Screenshots are included
- [ ] Live demo is accessible
- [ ] No sensitive keys in code (.env files excluded)
- [ ] Code is well-commented
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Works offline
- [ ] Fast loading time

---

Good luck with your interviews! 🚀
