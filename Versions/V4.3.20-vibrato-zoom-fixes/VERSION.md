# V4.3.20 - Vibrato & Zoom Fixes

**Date:** 2025-10-10
**Type:** Bug Fix / Enhancement

## Changes

### 1. Vibrato Rung Duration Fix (vibrato-controller.js)

**Problems Fixed:**
1. Vibrato was limited by triangle duration (short notes had tiny vibratos)
2. Vibrato frequency varied with note duration (inconsistent speed)
3. Triangle duration was used as limit (incorrect - triangle is visual, vibrato is physical)

**Solutions:**

#### A. Removed Triangle Duration Limitation
```javascript
// OLD (WRONG): Limited by triangle duration
const endX = note.x + Math.min(triangleDurationPx, nextNoteDistance);

// NEW (CORRECT): Only limited by next note or 2-beat decay
const maxSoundDuration = 2.0 * 85px * zoom; // 2 beats
const endX = note.x + Math.min(nextNoteDistance, maxSoundDuration);
```

**Result:** All notes now get full vibrato length (up to 2 beats or next note)

#### B. Constant Frequency Implementation
```javascript
// OLD (WRONG): Rounded cycles → varying frequency
const cycles = Math.round(quarterNotes * cyclesPerQuarter);

// NEW (CORRECT): Exact fractional cycles → constant frequency
const cyclesExact = quarterNotes * cyclesPerQuarter;
```

**Result:** All vibrato waves have same frequency, only visible cycle count varies

### New Vibrato Logic

```javascript
// Vibrato length = min(next note on same string, 2 beats sound decay)
// Frequency = constant (3 cycles/quarter by default)
// Do NOT limit by triangle duration!
```

### Examples

| Note Duration | Next Note Distance | Vibrato Length | Cycles |
|---------------|-------------------|----------------|--------|
| 0.5 beats (8th) | 3 beats away | 2.0 beats (170px) | 6 cycles |
| 1.0 beats (quarter) | 0.5 beats away | 0.5 beats (42.5px) | 1.5 cycles |
| 2.0 beats (half) | 5 beats away | 2.0 beats (170px) | 6 cycles |
| 1.5 beats (dotted quarter) | No next note | 2.0 beats (170px) | 6 cycles |

**All have same frequency** (3 cycles per quarter = 85px per cycle)

---

### 2. Zoom Controller Resilience Fix (zoom-controller.js + template)

**Problem #1:** Optimal tuning zoom sliders not responding to user input

**Root Cause:** SortableJS `filter: '#optimalTuningSection'` was blocking ALL pointer events on the optimal section, not just drag events.

**Solution:** Added `preventOnFilter: false` to SortableJS configuration:

```javascript
new Sortable(sectionsContainer, {
    filter: '#optimalTuningSection',     // Prevent dragging first section
    preventOnFilter: false,              // CRITICAL: Allow input events on filtered sections!
    // ...
});
```

**Problem #2:** Optimal tuning zoom sliders not working after dynamic song loading

**Root Cause:** SVG loaded after zoom controller initialization, missing reference

**Solution:** Added lazy SVG finding in `applyZoom()`:

```javascript
// If SVG reference missing, try to find it now
if (!state.svgElement) {
    const svgId = this.getSvgId(section);
    const svg = document.getElementById(svgId);
    if (svg) {
        console.log(`Found SVG for ${section}, updating reference...`);
        state.svgElement = svg;
        // Store base dimensions
        svg.setAttribute('data-base-width', svg.getAttribute('width'));
        svg.setAttribute('data-base-height', svg.getAttribute('height'));
    } else {
        console.error(`Still cannot find SVG ${svgId}`);
        return;
    }
}
```

**Benefits:**
- Handles SVGs loaded after initialization
- Better error logging for debugging
- Works with dynamically loaded songs
- No need to manually refresh zoom controller

---

## Files Changed

- `v4/vibrato-controller.js` - Fixed vibrato duration and constant frequency
- `v4/zoom-controller.js` - Added lazy SVG finding and debug logging
- `v4/templates/v4-vertical-header-sections-annotated.html` - Added `preventOnFilter: false` to SortableJS
- `v4/package.json` - Version bump to 4.3.20

## Testing

### Vibrato Testing:
1. Enable vibrato on a pitch class
2. Verify all waves have same frequency (consistent wave spacing)
3. Verify short notes (eighth) have full-length vibratos (not cut short)
4. Verify waves stop at next note on same string (not notes on other strings)
5. Verify waves limited to 2 beats max (sound decay)

### Zoom Testing:
1. Load a song from library
2. Try optimal tuning X-zoom and Y-zoom sliders
3. Verify tablature zooms correctly
4. Check browser console for any errors
5. Try alternate tuning zoom - should work identically

## Migration Notes

No migration needed - client-side JavaScript changes only.
Hard refresh browser (Cmd+Shift+R) to see updates.
