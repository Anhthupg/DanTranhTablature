# V4.3.25 - Frozen String Labels System

## Release Date
October 12, 2025

## Summary
Implemented frozen string labels that stay at the left edge during horizontal scroll and zoom, while maintaining perfect alignment with string lines.

## Key Features

### 1. Frozen String Labels
- **60px compact area** at left edge (reduced from initial 100px)
- **Horizontal freeze** - Labels stay visible while tablature scrolls horizontally
- **Vertical sync** - Labels move with tablature vertical scroll using CSS transform
- **Y-zoom aware** - Fixed 5px offset prevents "Scaled Offset Problem"
- **Octave numbers preserved** - Full note names (E3, C4, G5, etc.)

### 2. Dynamic Positioning
- Automatically calculates offset to account for controls above tablature
- Uses `getBoundingClientRect()` for precise positioning
- Updates position when container height changes

### 3. Tuning Change Support
- Labels update to match new tuning when alternative tuning changes
- Automatically recreates labels with new string names
- Resets scroll/zoom state to match fresh tablature

### 4. Zoom Integration
- Integrated with ZoomController callback system
- Updates label Y positions when Y-zoom changes
- Formula: `newY = baseStringY * yZoom + 5` (fixed 5px offset)
- Prevents offset scaling issues

## Technical Implementation

### Files Modified
1. **v4/package.json** - Version updated from 4.3.24 to 4.3.25
2. **v4/templates/v4-vertical-header-sections-annotated.html**
   - CSS for `.tablature-wrapper` and `.string-labels-fixed` (lines 103-137)
   - HTML wrappers for both tuning sections (lines 1000, 1195)
   - JavaScript functions `createFrozenStringLabels()` and `updateFrozenLabelsZoom()` (lines 2965-3080)
   - Initialization in DOMContentLoaded (lines 3177-3189)
   - Tuning change recreation (lines 2619-2636)

### Architecture Highlights

**CSS Structure:**
```css
.tablature-wrapper {
    position: relative;
    display: flex;
}

.string-labels-fixed {
    position: absolute;
    left: 0;
    width: 60px;
    background: white;
    z-index: 10;
    pointer-events: none;
    overflow: hidden;
}
```

**Key Functions:**
- `createFrozenStringLabels(svgId)` - Creates fixed overlay with cloned labels
- `updateFrozenLabelsZoom(svgId)` - Updates label positions on Y-zoom
- Scroll sync via `transform: translateY(-scrollTop)`
- Zoom callbacks registered with ZoomController

### Scaled Offset Fix
Addresses the "Scaled Offset Problem" from CLAUDE.md:
- Store base string Y position without offset
- Calculate: `baseStringY * yZoom + 5` (fixed offset)
- Previously: `(baseStringY + 5) * yZoom` (offset scaled incorrectly)

## Usage

### Behavior
1. **Load page** - Frozen labels appear at left edge for both Optimal and Alternative tuning
2. **Scroll horizontally** - Labels stay fixed, tablature scrolls
3. **Scroll vertically** - Labels move with tablature
4. **Adjust Y-zoom** - Labels maintain alignment with strings
5. **Change tuning** - Labels update to show new tuning's strings

### Console Logging
When labels are created, console shows:
```
[Frozen Label] "E3" at Y=105, baseY=100
[Frozen Label] "C4" at Y=255, baseY=250
[Frozen Labels] Created for optimalSvg with 17 labels, offset: 0px
```

## Benefits

1. **Better UX** - Always visible string reference during scroll
2. **Compact design** - Only 60px wide, minimal visual impact
3. **Perfect alignment** - Maintains string line alignment at all zoom levels
4. **Dynamic updates** - Adapts to tuning changes and layout shifts
5. **Performance** - Uses efficient CSS transforms for scrolling

## Known Limitations

None - feature is fully functional with all edge cases handled.

## Next Steps

Consider:
- Making label width configurable
- Adding fade effect at edges
- Supporting horizontal zoom awareness (if needed)

---

**Status:** Production ready
**Tested:** Scroll, zoom, tuning changes all working correctly
