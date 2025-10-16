# V4.3.32 - Tap Mổ Color Wheel Progression

**Date:** October 14, 2025
**Status:** Production Ready

## Changes

### Tap Chevron Color System Update

Updated tap chevron colors to follow color wheel progression, using cool colors opposite to the warm glissando colors.

**Previous (V4.3.31):**
- All tap positions: Red (#FF0000)

**New (V4.3.32):**
- Position 0 (on beat): Blue (#0066FF)
- Position 1/3: Cyan (#00CCCC)
- Position 2/3: Green (#00CC00)

### Color Theory

**Glissandos** (warm side of color wheel):
- Red → Orange → Yellow

**Tap Positions** (cool side of color wheel):
- Blue → Cyan → Green

This creates clear visual distinction between:
- **Glissandos**: Sliding between notes (warm colors)
- **Taps**: Rhythmic positions (cool colors)

### Technical Implementation

**Files Modified:**
1. `v4/vibrato-controller.js` (lines 581-595)
   - Changed from `setAttribute('stroke')` to inline styles (`chevron.style.stroke`)
   - Inline styles override CSS for guaranteed color application
   - Added position-based color mapping

2. `v4/templates/v4-vertical-header-sections-annotated.html`
   - Updated version to V4.3.32
   - Updated CSS rules for tap chevrons
   - Added cache-busting: `?v=4.3.32e`

3. `v4/templates/components/tap-chevron-component.html`
   - Updated demo colors to match new system

### Key Technical Fix

**Problem:** CSS was overriding `setAttribute('stroke')`

**Solution:** Use inline styles which have higher specificity
```javascript
// Before
chevron.setAttribute('stroke', color);

// After
chevron.style.stroke = color;  // Inline style overrides CSS
```

## Files Backed Up

- `vibrato-controller.js`
- `templates/v4-vertical-header-sections-annotated.html`
- `templates/components/tap-chevron-component.html`

## Testing

Verify tap chevrons display in correct colors:
1. Load any song in V4 viewer
2. Check "Tap Mổ at" position (0, 1/3, or 2/3)
3. Tap chevrons should appear in blue/cyan/green (not red)
4. Each position should have distinct color

## Color Reference

```css
/* Tap Chevron Colors */
.tap-chevron[data-tap-position="0"]    { stroke: #0066FF; }  /* Blue */
.tap-chevron[data-tap-position="1/3"]  { stroke: #00CCCC; }  /* Cyan */
.tap-chevron[data-tap-position="2/3"]  { stroke: #00CC00; }  /* Green */
```

## Migration Notes

No migration needed - color changes apply immediately upon page refresh.

---

**V4.3.32 Complete:** Tap chevrons now use color wheel progression (blue → cyan → green) opposite to glissando warm colors.
