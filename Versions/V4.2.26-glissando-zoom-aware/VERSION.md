# V4.2.26 - Glissando Zoom-Aware System

## Summary
Made glissando chevron paths fully zoom-aware while keeping chevron pattern size constant regardless of X-zoom and Y-zoom levels.

## Problem
Glissando chevrons were not responding to tablature zoom changes:
- Path endpoints stayed at original positions when notes moved
- Glissandos appeared disconnected from notes after zooming
- No zoom transformation applied to glissando elements

## Solution

### 1. Glissando Generator Enhancement
**File:** `v4/glissando-controller.js`

Added base position storage in `generateGlissando()`:
```javascript
// Store BASE path endpoints for zoom transformation
polyline.setAttribute('data-base-start-x', startX);
polyline.setAttribute('data-base-start-y', startY);
polyline.setAttribute('data-base-end-x', endX);
polyline.setAttribute('data-base-end-y', endY);
polyline.setAttribute('data-chevron-index', i);  // Which chevron in the path
```

**Purpose:**
- Stores unzoomed path endpoints (start/end X/Y)
- Stores chevron index within path (0, 1, 2, ...)
- Enables ZoomController to recalculate path at any zoom level

### 2. ZoomController Transformation Logic
**File:** `v4/zoom-controller.js`

Added glissando transformation in `transformElements()`:
```javascript
// Transform path endpoints with zoom (pivot at 60 for X, no pivot for Y)
const scaledStartX = 60 + (baseStartX - 60) * xZoom;
const scaledStartY = baseStartY * yZoom;
const scaledEndX = 60 + (baseEndX - 60) * xZoom;
const scaledEndY = baseEndY * yZoom;

// Recalculate path with zoomed endpoints
// ... (unit vectors, path direction)

// Chevron geometry - CONSTANT SIZE (not scaled)
const chevronWidth = 14;  // Always 14px
const chevronDepth = 9;   // Always 9px

// Calculate chevron position along new path
const pointX = scaledStartX + spacingX * chevronIndex;
const pointY = scaledStartY + spacingY * chevronIndex;
```

**Key Features:**
- **Path endpoints scale**: Start/end positions follow note positions during zoom
- **Chevron size constant**: 14px width, 9px depth regardless of zoom level
- **Parametric recalculation**: Each chevron recalculated along transformed path
- **Preserves angles**: Chevrons stay perpendicular to path at all zoom levels

## Technical Details

### Zoom Transformation Rules
1. **X-axis**: Pivot at 60 (string label boundary)
   ```javascript
   scaledX = 60 + (baseX - 60) * xZoom
   ```

2. **Y-axis**: Scale from top (no pivot)
   ```javascript
   scaledY = baseY * yZoom
   ```

3. **Chevron Pattern**: Constant physical size
   - Width: 14px (not scaled)
   - Depth: 9px (not scaled)
   - Stroke: 2px (not scaled)

### Vector Math
Path recalculation at each zoom level:
1. Calculate transformed start/end positions
2. Compute path vector: `(dx, dy) = (endX - startX, endY - startY)`
3. Normalize to unit vector: `(ux, uy) = (dx, dy) / length`
4. Calculate perpendicular: `(px, py) = (-uy, ux)`
5. Position chevrons along path with constant spacing
6. Add constant-size arms perpendicular to path

### Visual Result
- **100% zoom**: Original positions, original chevron size
- **150% X-zoom**: Path wider, chevrons still 14×9px
- **200% Y-zoom**: Path taller, chevrons still 14×9px
- **Combined zoom**: Path follows notes perfectly, chevrons stay readable

## Files Modified
1. `v4/glissando-controller.js` - Added base position storage
2. `v4/zoom-controller.js` - Added glissando transformation logic

## Files Unchanged
- `v4/templates/components/glissando-generator.js` - Component unchanged
- `v4/templates/components/glissando-usage.md` - Documentation still valid

## Benefits
1. **Glissandos follow notes**: Always connected to correct positions
2. **Chevrons stay readable**: Constant size at all zoom levels
3. **Proper path alignment**: Angles and directions preserved
4. **Consistent UX**: Zoom behavior matches all other tablature elements

## Testing
Test with glissando-enabled songs:
1. Draw glissandos on a song
2. Zoom X-axis: 50%, 100%, 150%, 200%
3. Zoom Y-axis: 50%, 100%, 150%, 200%
4. Combined zoom: various X/Y combinations
5. Verify: Paths follow notes, chevrons stay 14×9px

## Migration
No migration needed - existing glissandos will be regenerated with new attributes on next draw.

---

**Version:** V4.2.26
**Date:** October 3, 2025
**Status:** Production-ready
**Backup:** `/Versions/V4.2.26-glissando-zoom-aware/`

## Critical Fix: Base Position Extraction

### Problem
When glissandos were drawn on an already-zoomed tablature, they used current (zoomed) note positions instead of base positions, causing incorrect placement.

### Root Cause
The `extractNotesFromSVG()` function read current `cx`/`cy` attributes, which contained zoomed values when tablature was pre-zoomed.

### Solution
Modified `extractNotesFromSVG()` and `extractStringsFromSVG()` to prefer base positions when available:

```javascript
// Extract BASE positions (handles pre-zoomed tablature)
// Prefer dataset.baseCx/baseCy if they exist (means tablature was zoomed)
// Otherwise use current cx/cy (means tablature is at 100% zoom)
const cx = parseFloat(circle.dataset.baseCx || circle.getAttribute('cx'));
const cy = parseFloat(circle.dataset.baseCy || circle.getAttribute('cy'));

// For string lines:
const y = parseFloat(line.dataset.baseY1 || line.getAttribute('y1'));
```

**Result:**
- Glissandos now draw correctly regardless of current zoom level
- All internal note positions (this.notes array) always contain base positions
- No redundant base position extraction needed in drawing functions

### Critical Enhancement: Immediate Zoom Application

**Problem:** After drawing glissandos on pre-zoomed tablature, they appeared at wrong positions because:
1. Glissandos generated with base positions (correct)
2. But NOT transformed to match current zoom level
3. Appeared at 100% zoom positions on 268% zoomed tablature

**Solution:** Added immediate zoom application after drawing:

```javascript
// In glissando-controller.js drawGlissandoForCandidate() and drawGlissandoToNote():
// CRITICAL: Apply current zoom to newly drawn glissandos
if (window.zoomController) {
    const svgId = this.svg.id;
    const section = svgId.replace('Svg', ''); // e.g., 'optimalSvg' → 'optimal'
    window.zoomController.applyZoomToGlissandos(section, chevrons);
}
```

**Added to zoom-controller.js:**
```javascript
applyZoomToGlissandos(section, chevrons) {
    // Transform specific chevrons to current zoom level
    // Uses same transformation logic as main transformElements()
    // Only runs if zoom ≠ 100%
}
```

**Final Result:**
- ✅ Draw glissandos at 100% zoom → appear correctly
- ✅ Zoom first to 268%, then draw glissandos → appear correctly
- ✅ Draw glissandos, then zoom → transform correctly
- ✅ Chevron size stays constant (14×9px) at all zoom levels
