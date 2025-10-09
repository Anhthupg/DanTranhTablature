# V4.2.27 - Glissando Zoom-Aware Architecture

## Critical Architecture Pattern: Base Positions + Immediate Transformation

### The Problem
When elements are drawn on an already-zoomed SVG:
1. Reading current `cx/cy` attributes gives ZOOMED values
2. Drawing with zoomed values creates elements at wrong positions
3. Double transformation occurs (zoomed input + zoom transformation)

### The Solution Pattern

#### Step 1: Always Store Base Positions
```javascript
// In element generation (server or client)
element.setAttribute('data-base-cx', baseX);
element.setAttribute('data-base-cy', baseY);
element.setAttribute('cx', baseX);  // Initially same
element.setAttribute('cy', baseY);
```

#### Step 2: Always Read Base Positions
```javascript
// In extractors/readers
const cx = parseFloat(element.dataset.baseCx || element.getAttribute('cx'));
const cy = parseFloat(element.dataset.baseCy || element.getAttribute('cy'));
```

#### Step 3: Apply Current Zoom Immediately After Drawing
```javascript
// After inserting new elements into SVG
if (window.zoomController) {
    const section = getSectionFromSvgId(svg.id);
    window.zoomController.applyZoomToElements(section, newElements);
}
```

### Why This Works

**Without Immediate Transformation:**
```
User zooms to 200%
Notes at x=100 → displayed at x=140 (pivot at 60)

User draws glissando
Reads note position: x=140 (WRONG - this is zoomed!)
Draws glissando at x=140
Zoom controller transforms: x=60 + (140-60)*2 = 220 (WRONG!)

Result: Glissando at x=220 instead of x=140
```

**With Base Positions + Immediate Transformation:**
```
User zooms to 200%
Notes at base x=100 → displayed at x=140
Base stored in dataset.baseCx=100

User draws glissando
Reads base position: x=100 (CORRECT - from dataset)
Draws glissando at base x=100
Immediately transform: x=60 + (100-60)*2 = 140 (CORRECT!)

Result: Glissando at x=140 (matches note position)
```

## Glissando-Specific Implementation

### Data Attributes Stored
Every glissando chevron stores:
```javascript
polyline.setAttribute('data-base-start-x', startX);  // Path start X (base)
polyline.setAttribute('data-base-start-y', startY);  // Path start Y (base)
polyline.setAttribute('data-base-end-x', endX);      // Path end X (base)
polyline.setAttribute('data-base-end-y', endY);      // Path end Y (base)
polyline.setAttribute('data-chevron-index', i);      // Which chevron (0, 1, 2, ...)
```

### Why Both Endpoints?
Glissandos are **paths**, not **points**:
- Notes: Single position (cx, cy)
- Glissandos: Start position (startX, startY) → End position (endX, endY)

Each chevron needs to recalculate its position along the transformed path:
1. Transform both endpoints: `(baseStart → scaledStart)`, `(baseEnd → scaledEnd)`
2. Calculate path vector: `(dx, dy) = scaledEnd - scaledStart`
3. Position chevron along path: `position = scaledStart + spacing * index`

### Constant Size Geometry
While path scales, chevron pattern stays constant:
```javascript
// These values NEVER change regardless of zoom
const chevronWidth = 14;   // Always 14px
const chevronDepth = 9;    // Always 9px

// Only path endpoints transform
const scaledStartX = 60 + (baseStartX - 60) * xZoom;
const scaledStartY = baseStartY * yZoom;
```

## ZoomController Methods

### `transformElements(section, svg, xZoom, yZoom)`
Main transformation method, runs on every zoom change:
- Transforms all notes, text, lines, etc.
- Transforms all existing glissando chevrons
- Called by user zoom actions (slider, fit-to-width)

### `applyZoomToGlissandos(section, chevrons)`
**NEW in V4.2.27**: Immediate transformation method:
- Transforms specific chevrons (newly drawn)
- Uses same math as `transformElements()`
- Called immediately after drawing new glissandos
- Only runs if zoom ≠ 100%

## GlissandoController Methods

### `extractNotesFromSVG()`
Extracts note positions, preferring base positions:
```javascript
const cx = parseFloat(circle.dataset.baseCx || circle.getAttribute('cx'));
```

**Why?**
- If zoomed: `dataset.baseCx` exists (set by ZoomController) → use it
- If not zoomed: `dataset.baseCx` doesn't exist → use `cx` (same as base)
- Result: Always get base positions

### `extractStringsFromSVG()`
Same pattern for string Y positions:
```javascript
const y = parseFloat(line.dataset.baseY1 || line.getAttribute('y1'));
```

### `drawGlissandoForCandidate()` and `drawGlissandoToNote()`
Both now include immediate zoom application:
```javascript
// Generate chevrons with base positions
const chevrons = this.generateGlissando({
    startX: xFrom,  // Base X
    startY: yFrom,  // Base Y
    endX: xTo,
    endY: yTo
});

// Insert into SVG
chevrons.forEach(chevron => svg.insertBefore(chevron, firstNote));

// CRITICAL: Immediately transform to current zoom
if (window.zoomController) {
    const section = this.svg.id.replace('Svg', '');
    window.zoomController.applyZoomToGlissandos(section, chevrons);
}
```

## Zoom Transformation Math

### X-Axis (Horizontal)
Pivot at x=60 (string label boundary):
```javascript
scaledX = 60 + (baseX - 60) * xZoom
```

**Example at 200% zoom:**
- x=100 → 60 + (100-60)*2 = 140
- x=200 → 60 + (200-60)*2 = 340

### Y-Axis (Vertical)
Scale from top (no pivot):
```javascript
scaledY = baseY * yZoom
```

**Example at 200% zoom:**
- y=100 → 100*2 = 200
- y=200 → 200*2 = 400

### Chevron Path Recalculation
After transforming endpoints:
1. **Path vector**: `(dx, dy) = (scaledEndX - scaledStartX, scaledEndY - scaledStartY)`
2. **Path length**: `length = √(dx² + dy²)`
3. **Unit vector**: `(ux, uy) = (dx/length, dy/length)`
4. **Perpendicular**: `(px, py) = (-uy, ux)`
5. **Chevron position**: `(x, y) = scaledStart + unitVector * depth * index`
6. **Chevron arms**: `leftArm = position + perpendicular * halfWidth`

## Anti-Pattern to Avoid

### ❌ WRONG: Double Transformation
```javascript
// Read current (zoomed) position
const cx = parseFloat(circle.getAttribute('cx'));  // Gets zoomed value!

// Draw with zoomed position
generateGlissando({ startX: cx, ... });  // Already zoomed

// Zoom controller transforms again
scaledX = 60 + (cx - 60) * zoom;  // Transforms zoomed value!

// Result: Double zoom applied!
```

### ✅ CORRECT: Base + Transform
```javascript
// Read base position
const cx = parseFloat(circle.dataset.baseCx || circle.getAttribute('cx'));

// Draw with base position
generateGlissando({ startX: cx, ... });  // Base position

// Immediately transform to current zoom
applyZoomToGlissandos(section, chevrons);  // Single transformation

// Result: Correct zoom applied
```

## Testing Strategy

### Test Case 1: Draw at 100%, Then Zoom
1. Load tablature (100% zoom)
2. Draw glissando → should appear at base positions
3. Zoom to 200% → glissando should transform correctly
4. ✅ Verify: Glissando follows note positions

### Test Case 2: Zoom First, Then Draw
1. Load tablature (100% zoom)
2. Zoom to 200%
3. Draw glissando → should immediately appear at 200% positions
4. ✅ Verify: Glissando matches zoomed note positions

### Test Case 3: Multiple Zoom Changes
1. Draw glissando at 100%
2. Zoom to 150%
3. Zoom to 200%
4. Zoom back to 100%
5. ✅ Verify: Glissando returns to original position

### Test Case 4: Chevron Size Consistency
1. Draw glissando at 100%
2. Measure chevron: 14px wide, 9px deep
3. Zoom to 300%
4. ✅ Verify: Chevron still 14px wide, 9px deep

## Future Applications

This pattern applies to ANY dynamically drawn element:
- Annotations
- Highlighting overlays
- Measure lines
- Phrase brackets
- Custom markings

**General Rule:**
1. Store base positions in data attributes
2. Read base positions when extracting
3. Apply current zoom immediately after drawing

---

**Version:** V4.2.27
**Architecture:** Base Position + Immediate Transformation Pattern
**Status:** Production-ready, fully tested
