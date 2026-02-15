# ✅ Testing Checklist (Before Demo)

Run through this checklist before your presentation to ensure everything works perfectly.

---

## 🚀 Startup Tests

### Initial Load
- [ ] Open http://localhost:3000
- [ ] Page loads without errors
- [ ] No console errors (F12 → Console)
- [ ] Login screen displays correctly
- [ ] Background gradient renders smoothly

---

## 👤 Authentication Tests

### Guest Mode
- [ ] Click "Play as Guest"
- [ ] Account creates successfully
- [ ] Redirects to game page
- [ ] User name shows "Guest User" in header
- [ ] No errors in console

---

## 🎮 Puzzle Game Tests

### Sudoku Puzzle
- [ ] Puzzle loads (6x6 grid)
- [ ] Some cells pre-filled (clues) in bold
- [ ] Empty cells are clickable
- [ ] Can select a cell (blue highlight)
- [ ] Number pad appears at bottom
- [ ] Can enter numbers 1-6
- [ ] Can delete with X button
- [ ] Can use keyboard (1-6 keys)
- [ ] Clue cells are NOT editable

### Nonogram Puzzle
- [ ] Puzzle loads (8x8 grid)
- [ ] Row clues display on left
- [ ] Column clues display on top
- [ ] Can click cells to fill/unfill
- [ ] Filled cells turn blue
- [ ] Can toggle cells on/off

---

## ⏱️ Timer Tests

- [ ] Timer shows 00:00 initially
- [ ] Timer starts when first cell clicked
- [ ] Timer counts up (00:01, 00:02, etc.)
- [ ] Timer stops when puzzle completed
- [ ] Timer does NOT count when puzzle already complete

---

## 💡 Hint System Tests

- [ ] Hint button shows "Hint (3)"
- [ ] Click hint → one cell auto-fills
- [ ] Hint count decreases to (2)
- [ ] After 3 hints, button becomes disabled/gray
- [ ] Hint fills a correct value

---

## ✅ Validation Tests

### Correct Solution
- [ ] Fill puzzle correctly
- [ ] Click "Validate Solution"
- [ ] Green success message appears
- [ ] Checkmark animation plays
- [ ] Score displays (e.g., "Score: 187 points")
- [ ] Time displays (e.g., "Time: 2m 15s")
- [ ] "Validate" button disappears

### Incorrect Solution
- [ ] Fill puzzle with wrong answers
- [ ] Click "Validate Solution"
- [ ] Red error message appears
- [ ] Says "Some cells are incorrect"
- [ ] Wrong cells highlighted in red
- [ ] Can continue editing

### Incomplete Solution
- [ ] Leave some cells empty
- [ ] Click "Validate Solution"
- [ ] Nothing happens (or error message)
- [ ] No validation until complete

---

## 🔥 Streak System Tests

### First Completion
- [ ] Complete today's puzzle
- [ ] Streak card shows "1 day"
- [ ] 1 flame icon appears
- [ ] "Best Streak" also shows 1

### Same Day Completion
- [ ] Refresh page
- [ ] Streak still shows 1 (not 2)
- [ ] Completing again doesn't increase streak

### Streak Display
- [ ] Current streak displays in orange card
- [ ] Flame icons animate in
- [ ] Best streak displays in purple card
- [ ] Both cards have smooth animations

---

## 📊 Heatmap Tests

### Statistics Tab
- [ ] Click "Statistics" tab
- [ ] Heatmap displays (365 cells)
- [ ] Organized in weeks (7 rows)
- [ ] Today's date highlighted
- [ ] Completed days are colored (green shades)
- [ ] Legend shows "Less" to "More"

### Hover Tooltips
- [ ] Hover over completed day
- [ ] Tooltip appears
- [ ] Shows date, score, difficulty
- [ ] Tooltip follows mouse
- [ ] Hover over empty day → no tooltip

### Data Accuracy
- [ ] After completing puzzle, switch to Stats
- [ ] Today's cell is colored
- [ ] Color intensity matches score
- [ ] Count is correct

---

## 💾 Offline Tests

### Go Offline
- [ ] Open DevTools (F12) → Network tab
- [ ] Set "No throttling" dropdown to "Offline"
- [ ] Refresh page (Ctrl+R)
- [ ] Page loads successfully
- [ ] Header shows "Offline" indicator
- [ ] Puzzle displays correctly
- [ ] Can interact with puzzle
- [ ] Streak data loads

### Work Offline
- [ ] While offline, solve puzzle
- [ ] Validate solution
- [ ] Success message appears
- [ ] Streak updates locally
- [ ] Check console: no sync errors (expected)

### Reconnect
- [ ] Set Network back to "No throttling"
- [ ] Refresh page
- [ ] "Online" indicator appears
- [ ] Data syncs automatically
- [ ] Check console: "Back online - syncing..." message

---

## 💾 Data Persistence Tests

### Progress Auto-Save
- [ ] Start solving a puzzle (don't complete)
- [ ] Make several moves
- [ ] Refresh page (F5)
- [ ] Previous moves are restored
- [ ] Can continue from where you left off

### Streak Persistence
- [ ] Note your current streak
- [ ] Logout (click Logout button)
- [ ] Login as guest again
- [ ] Streak starts at 0 (expected - new user)

---

## 📱 Mobile Responsive Tests

### Tablet View (768px)
- [ ] Open DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select "iPad" or "Tablet"
- [ ] Page renders correctly
- [ ] Puzzle fits on screen
- [ ] Buttons are clickable
- [ ] Text is readable

### Mobile View (375px)
- [ ] Select "iPhone 12 Pro" or similar
- [ ] Page renders correctly
- [ ] Puzzle scales down appropriately
- [ ] Can scroll if needed
- [ ] All features work
- [ ] Number pad  accessible
- [ ] Buttons not overlapping

### Landscape Mode
- [ ] Rotate device (click rotate icon)
- [ ] Layout adjusts correctly
- [ ] No horizontal scrolling
- [ ] UI elements visible

---

## 🎨 UI/Animation Tests

### Smooth Animations
- [ ] Buttons have hover effects
- [ ] Click animations on cells
- [ ] Streak cards animate in
- [ ] Success animation on completion
- [ ] Tab switching is smooth
- [ ] Tooltips fade in/out

### No Visual Glitches
- [ ] No flickering
- [ ] No layout shifts
- [ ] Colors are consistent
- [ ] Text is readable (contrast)
- [ ] No cut-off elements

---

## ⚠️ Error Handling Tests

### Network Errors
- [ ] Disconnect internet mid-game
- [ ] No error popups
- [ ] Offline indicator appears
- [ ] Game continues to work

### Invalid Actions
- [ ] Try editing a clue cell
- [ ] Nothing happens (expected)
- [ ] No console errors

### Edge Cases
- [ ] Open multiple tabs
- [ ] Both tabs work independently
- [ ] No data conflicts

---

## 🌐 Browser Compatibility Tests

### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Performance is smooth

### Edge
- [ ] All features work
- [ ] No console errors
- [ ] Performance is smooth

### Firefox (Optional)
- [ ] Basic functionality works
- [ ] Note any issues

---

## 📊 Performance Tests

### Lighthouse Audit
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance" and "Best practices"
4. Click "Analyze page load"
5. Check scores:
   - [ ] Performance > 85
   - [ ] Best Practices > 90
   - [ ] Accessibility > 90

### Loading Speed
- [ ] Initial load < 3 seconds
- [ ] Puzzle renders < 1 second
- [ ] Tab switching is instant
- [ ] No lag when interacting

---

## 🔒 Security Tests

### Environment Variables
- [ ] Open `.env` file
- [ ] Confirm no real API keys
- [ ] Confirm DATABASE_URL is local
- [ ] `.env` is in `.gitignore`

### Client-Side Security
- [ ] Open DevTools → Sources
- [ ] Puzzle solution not visible in plain text
- [ ] Validation happens on completion
- [ ] Score calculation is obfuscated

---

## 🐛 Common Issues & Fixes

### Issue: Port 3000 in use
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
npm run dev
```

### Issue: Database locked
```powershell
Remove-Item prisma\dev.db
npx prisma db push
```

### Issue: Module not found
```powershell
npm install
```

### Issue: IndexedDB error
- F12 → Application → IndexedDB
- Delete `daily-puzzle-db`
- Refresh

---

## ✅ Final Pre-Demo Checklist

**30 Minutes Before:**
- [ ] Close all other applications
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Open fresh browser window
- [ ] Start dev server: `npm run dev`
- [ ] Test full demo flow once
- [ ] Close DevTools
- [ ] Zoom browser to 100%
- [ ] Prepare speech points

**5 Minutes Before:**
- [ ] Restart dev server (Ctrl+C, then `npm run dev`)
- [ ] Open http://localhost:3000 in new tab
- [ ] Close all unnecessary tabs
- [ ] Turn off notifications
- [ ] Put phone on silent
- [ ] Have DevTools ready (F12 for offline demo)

---

## 🎤 Demo Script (2 Minutes)

**[0:00-0:10]** Introduction
- "I built a daily puzzle retention engine with offline-first architecture"
- Click "Play as Guest"

**[0:10-0:40]** Show Puzzle Features
- "Deterministic puzzle generation - same for all users"
- Solve a few cells, use hint
- "Limited hints drive engagement"
- Validate and complete

**[0:40-0:55]** Show Streak System
- "Automatic streak tracking"
- Point to flame icons
- "Gamification like Duolingo"

**[0:55-1:15]** Show Heatmap
- Click Statistics tab
- "365-day GitHub-style heatmap"
- Hover to show tooltip
- "Visual engagement history"

**[1:15-1:40]** Show Offline Mode
- Open DevTools, go offline
- Refresh page
- "Offline-first with IndexedDB"
- "Works without internet"
- Show it still functions

**[1:40-2:00]** Wrap Up
- Go back online
- "Background sync when reconnected"
- "Scalable, minimal server cost"
- "Mobile responsive" (resize window)

---

## 📋 Issue Tracker

Found a bug? Note it here:

| Issue | Severity | Status | Fix |
|-------|----------|--------|-----|
|       |          |        |     |

---

## 🎯 Success Criteria

Your demo is ready when:
- ✅ All tests pass
- ✅ No console errors
- ✅ Smooth performance
- ✅ Works offline
- ✅ Mobile responsive
- ✅ Professional look

---

**You're ready to present!** 🚀  
Review this checklist 30 minutes before your demo.
