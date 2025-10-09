# V4.2.15 - Unified Pivot Zoom at x=60

## Changes from V4.2.14

### 1. Pivot Point Changed from 120 to 60
**File:** `zoom-controller.js`

**Problem:** String labels were moving when zooming with pivot at x=120
**Solution:** Changed pivot to x=60 (center of string labels)

**Formula:** `scaledX = 60 + (baseX - 60) * xZoom`

**Applied to ALL elements:**
- Circles (note heads)
- Text (note labels, lyrics)
- Lines (strings)
- Polygons (resonance triangles)
- Rects (phrase boxes, section boxes)
- Groups (semantic icons)

### 2. Resonance Triangles Now Stick to Note Heads
**File:** `zoom-controller.js`

**Before:** `scaledX = baseX * xZoom` (simple multiplication, drifted away from notes)
**After:** `scaledX = 60 + (baseX - 60) * xZoom` (pivot-based, sticks to notes)

### 3. Bent Notes Default to ON (Visible/Red)
**Files:** `vertical-demo-server.js`, `v4-vertical-header-sections-annotated.html`

- Server generates with `showBent = true` (red colors)
- Client state defaults to `bentNotesVisible = true`
- Toggle buttons initialize to RED background

### 4. Red Pivot Line for Testing
**File:** `vertical-demo-server.js`

Added red dashed vertical line at x=60 to visualize pivot point during development.

## Result

**Perfect zoom synchronization:**
- x=60 stays fixed (center of string labels)
- All content (notes, lyrics, triangles) zooms together
- String labels don't move
- Strings stretch/compress correctly
- Resonance triangles stick to note heads
- All sections (tablature, annotated phrases) synchronized

## Formula Examples

At 150% zoom:
- x=60 → `60 + (60-60)*1.5 = 60` (stays fixed)
- x=150 → `60 + (150-60)*1.5 = 60 + 135 = 195`
- x=500 → `60 + (500-60)*1.5 = 60 + 660 = 720`

## Files Modified

1. `zoom-controller.js` - Pivot changed from 120 to 60 for all elements
2. `vertical-demo-server.js` - Generate with bent=true, add red pivot line
3. `v4-vertical-header-sections-annotated.html` - Default bent visible, init button colors
