# V4.4.2 - Grace Note Spacing & Dual Tablature Scrolling

**Date:** October 16, 2025
**Type:** Visual Enhancement + UX Improvement

## Changes Made

### 1. Grace Note Spacing Formula Update
**File:** `server-tablature-generator.js`

**Before (V4.4.1):**
```javascript
graceSpacing = grace.duration * (this.DURATION_MULTIPLIER / 4);
// 16th grace: 0.25 × 21.25 = 5.31 pixels
// 8th grace: 0.5 × 21.25 = 10.63 pixels
```

**After (V4.4.2):**
```javascript
graceSpacing = grace.duration * (this.DURATION_MULTIPLIER / 8);
// 16th grace: 0.25 × 10.625 = 2.66 pixels
// 8th grace: 0.5 × 10.625 = 5.31 pixels
```

**Impact:** Grace notes now positioned **50% closer** to their main notes for tighter visual grouping.

**Modified Lines:**
- Line 124: `totalGraceSpacing` calculation
- Line 130: Individual `graceSpacing` calculation

### 2. Dual Tablature Continuous Scrolling
**File:** `audio-playback-controller-v2.js`

**Problem:** Continuous scrolling only worked for optimal tuning tablature, not alternative tuning.

**Solution:** Updated `startContinuousScroll()` to find and scroll BOTH tablature containers simultaneously.

**Before (V4.4.1):**
```javascript
const container = firstNote.element.closest('.tablature-reference...');
container.scrollLeft = newScrollLeft;  // Only one tablature scrolls
```

**After (V4.4.2):**
```javascript
const optimalContainer = document.getElementById('optimalScrollContainer');
const alt1Container = document.querySelector('#altTuning1Section .tablature-reference');

containers.forEach(container => {
    container.scrollLeft = Math.max(0, Math.min(endScrollLeft, newScrollLeft));
});
```

**Impact:** Both optimal and alternative tuning tablatures now scroll synchronously during playback.

**Modified Lines:**
- Lines 405-418: Container selection logic
- Lines 436-438: Initial scroll position (both containers)
- Lines 452-454: Animation loop (both containers)

## Architecture Benefits

### Single Source of Truth Pattern
- One scroll controller manages both tablatures
- No code duplication
- Easy to extend to additional tablatures

### Grace Note Distance Comparison

| Note Type | Duration | Old Distance | New Distance | Ratio to Main |
|-----------|----------|--------------|--------------|---------------|
| Grace 16th | 0.25 | 5.31 px | **2.66 px** | 1/8 of main |
| Grace 8th | 0.5 | 10.63 px | **5.31 px** | 1/8 of main |
| Main 16th | 0.25 | 21.25 px | 21.25 px | 1× |
| Main 8th | 0.5 | 42.5 px | 42.5 px | 1× |

## Testing

1. **Grace Note Spacing:** Load any song with grace notes - they should appear closer to main notes
2. **Dual Scrolling:** Click Play button - both optimal and alternative tablatures should scroll together
3. **Console Logging:** Should show `[ContinuousScroll] Found 2 container(s) to scroll`

## Files Changed

- `server-tablature-generator.js` (2 lines)
- `audio-playback-controller-v2.js` (30 lines)

## Backward Compatibility

- Fully compatible with V4.4.1
- No breaking changes to data structures
- No API changes
- Server restart required to apply grace note spacing changes
- Browser refresh required to apply scroll changes
