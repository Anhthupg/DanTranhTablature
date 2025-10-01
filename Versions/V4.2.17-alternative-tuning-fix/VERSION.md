# V4.2.17 - Alternative Tuning System Fix

**Date:** October 1, 2025
**Status:** Production Ready

## Issues Fixed

### Issue 1: Alternative Tuning Tablature Not Displaying
**Problem:** When selecting a new tuning from the dropdown, tablature was not rendered (appeared as 3px wide strip).

**Root Causes:**
1. **Regex didn't match decimal widths** - Pattern `/width="(\d+)"/"` failed on `width="6542.5"`
2. **Note format mismatch** - API endpoint wasn't converting relationships.json format to generator format
3. **Collapsed section** - Section started collapsed and wasn't auto-expanded

**Solutions:**
- Fixed regex to support decimals: `/width="([\d.]+)"/` (v4-vertical-header-sections-annotated.html:1609-1610)
- Added note format conversion in `/api/generate-tuning` endpoint (vertical-demo-server.js:653-665)
- Added auto-expand when tuning selected (v4-vertical-header-sections-annotated.html:1629-1642)
- Added NaN protection in tablature generator (server-tablature-generator.js:74-80, 111-118)

### Issue 2: Playback Buttons Not Triggering Sounds
**Problem:** Play buttons in alternative tuning section were silent after selecting new tuning.

**Root Causes:**
1. **Audio controller never initialized on page load** - `setSVGReferences()` was only called when selecting from library
2. **Stale SVG references after tuning change** - Audio controller cached references to old DOM elements

**Solutions:**
- Added initial audio controller setup on page load (v4-vertical-header-sections-annotated.html:1938-1945)
- Added audio controller refresh after tuning change (v4-vertical-header-sections-annotated.html:1645-1651)
- Enhanced debugging logs (audio-playback-controller-v2.js:97-125, 292-324)

## Technical Details

### Regex Fix
```javascript
// Before (BROKEN - only matches integers):
const widthMatch = data.svg.match(/width="(\d+)"/);  // Fails on "6542.5"

// After (FIXED - matches decimals):
const widthMatch = data.svg.match(/width="([\d.]+)"/);  // Matches "6542.5"
```

### Note Format Conversion
```javascript
// Convert relationships.json format to generator format
notes: relationshipsData.notes.map(note => ({
    step: note.pitch?.step || note.pitch?.fullNote?.replace(/[0-9]/g, '') || 'C',
    octave: note.pitch?.octave || parseInt(note.pitch?.fullNote?.match(/[0-9]/)?.[0]) || 4,
    duration: (isNaN(duration) || duration <= 0) ? 1 : duration,
    isGrace: note.isGrace || false,
    lyric: note.lyrics?.text || ''
}))
```

### Audio Controller Initialization
```javascript
// Initialize with server-rendered SVG on page load
setTimeout(() => {
    const optimalSvg = document.getElementById('optimalSvg');
    const alt1Svg = document.getElementById('alt1Svg');
    if (optimalSvg && alt1Svg && window.audioController) {
        window.audioController.setSVGReferences(optimalSvg, alt1Svg);
    }
}, 100);
```

### Controller Refresh After Tuning Change
```javascript
// Refresh zoom controller
window.zoomController.refresh();

// Initialize bent notes state
window.initializeBentNotesState(section);

// Refresh audio controller
window.audioController.setSVGReferences(optimalSvg, alt1Svg);
```

## Files Modified

1. **v4/templates/v4-vertical-header-sections-annotated.html**
   - Line 1609-1610: Fixed width/height regex to support decimals
   - Line 1618-1627: Added dimension logging
   - Line 1629-1642: Added auto-expand and section state logging
   - Line 1645-1651: Added audio controller refresh
   - Line 1938-1945: Added initial audio controller setup

2. **v4/vertical-demo-server.js**
   - Line 653-668: Added note format conversion in `/api/generate-tuning` endpoint
   - Line 654-657: Added duration validation

3. **v4/server-tablature-generator.js**
   - Line 74-80: Added NaN protection for note duration
   - Line 111-118: Added NaN detection for width calculation

4. **v4/audio-playback-controller-v2.js**
   - Line 97-125: Enhanced extraction logging
   - Line 292-324: Added scheduling debugging

## Testing Checklist

- [x] Audio playback works on page load
- [x] Alternative tuning dropdown generates valid tablature
- [x] Tablature displays at correct width (6542.5px not 3px)
- [x] Zoom controls work after tuning change
- [x] Bent notes toggle works after tuning change
- [x] Audio playback works after tuning change
- [x] Section auto-expands when tuning selected
- [x] No NaN errors in console
- [x] All 91 notes extracted correctly

## Lessons Learned

### Lesson 1: Regex Precision Matters
**Always support decimals** when matching numeric attributes in SVG/HTML:
- Bad: `/(\d+)/` - Only integers
- Good: `/([\d.]+)/` - Decimals too

### Lesson 2: Controller Initialization Lifecycle
Controllers need initialization at **3 points**:
1. Page load (server-rendered content)
2. Dynamic content load (library selection)
3. Content update (tuning change)

### Lesson 3: Format Conversion Required
API endpoints that generate tablature must convert note format:
- Input: `{pitch: {step, octave}, duration: {value}}`
- Output: `{step, octave, duration: number}`

---

**V4.2.17 Complete - Alternative Tuning System Fully Functional**
