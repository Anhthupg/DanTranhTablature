# V4.2.21 - 20-String Tablature

## Summary
Extended tablature from 17 strings to 20 strings by adding 3 additional higher-pitch strings at the bottom of the display.

## Changes Made

### 1. Server-Side Generator (`server-tablature-generator.js`)
**Modified:** `generatePentatonicStrings()` function
- **Before:** Generated 17 strings (loop counter: `i < 17`)
- **After:** Generated 20 strings (loop counter: `i < 20`)
- **Comment updated:** "Generate pentatonic strings (20 strings: 17 standard + 3 additional higher strings)"

### 2. Template File (`v4-vertical-header-sections-annotated.html`)
**Cleaned up:** Removed incomplete string adjustment feature
- Removed HTML controls for add/remove string buttons (Top/Bottom)
- Removed JavaScript functions: `adjustStrings()`, `updateStringVisibility()`
- Removed state tracking: `window.stringVisibilityState`

## Technical Details

### String Generation
The additional 3 strings continue the pentatonic tuning pattern automatically:

**Example with C-D-E-G-A tuning:**
- String 17: G6 (original last string)
- **String 18: A6** (new - continues pattern)
- **String 19: C7** (new - next octave)
- **String 20: D7** (new)

### String Properties
New strings maintain all standard properties:
- **Y-positioning:** Calculated based on musical intervals (cents)
- **Colors:** Grey (#999) for unused, Black (#000) for used
- **Labels:** Show correct note names based on tuning
- **Styling:** 3px stroke width, proper opacity

### Automatic Tuning Support
Works with **both tablature sections:**
- ✅ Optimal Tuning (song-specific)
- ✅ Alternative Tuning (any selected tuning)

All alternative tunings automatically generate 20 strings following their respective scales.

## Files Modified
1. `v4/server-tablature-generator.js` - Line 237: Changed loop from 17 to 20
2. `v4/templates/v4-vertical-header-sections-annotated.html` - Removed incomplete string controls

## Usage
The 20 strings are now **permanent** and generated server-side. No user controls needed - the tablature automatically shows all 20 strings for reference, with unused strings displayed in grey.

## Viewing Changes
After refreshing the browser, both Optimal and Alternative tuning tablatures will display 20 strings instead of 17.

---

**Version:** V4.2.21
**Date:** October 2, 2025
**Status:** ✅ Complete
