# V4.2.31 - Tap Chevron for Dotted Rhythms

## Release Date
October 3, 2025

## Summary
Added tap chevron (Tap Mổ) visualization for dotted rhythm notes with 3 position options (0, 1/3, 2/3). Integrated tap controls into unified left-hand technique panel alongside glissando and vibrato controls. Renamed "Glissando System" to "Glissando Á" and streamlined UI layout.

## New Features

### 1. Tap Chevron System
- **Dotted Rhythm Detection**: Automatically detects notes with dotted durations (0.75, 1.5, 3.0)
- **3 Position Options**: Exclusive checkboxes for tap positions
  - `0` - At note start
  - `1/3` - Early subdivision (strong position)
  - `2/3` - Late subdivision (strong position)
- **Visual Specs**:
  - V-shape chevron pointing down from note center
  - 300 cents pitch drop (37.5px with 0.125px/cent ratio)
  - 14px arm spread (7px each side)
  - 4px stroke width (unified left-hand technique weight)
  - Red color (#FF0000) with 80% opacity

### 2. Unified Control Panel Layout
All left-hand techniques now on single line:
```
Glissando Á | Draw All | [durations] | Select durations |
Vibrato Rung on: B C D F G | Depth: 100¢ (±50¢) | Speed: 5.5x |
Tap Mổ at: 0 1/3 2/3
```

### 3. UI Improvements
- **Renamed**: "Glissando System" → "Glissando Á"
- **Removed**: Glissando count text (always shows "Select durations")
- **Consistent Formatting**: All labels use `font-weight: 600; color: #2c3e50`
- **Clean Layout**: No comma before "Tap Mổ at:"

## Technical Implementation

### Modified Files
1. **v4/vibrato-controller.js**
   - Added `tapPosition` state property
   - Added `updateTaps()` method for tap chevron rendering
   - Created tap position UI with 3 exclusive checkboxes
   - Integrated tap controls into vibrato UI wrapper

2. **v4/templates/v4-vertical-header-sections-annotated.html**
   - Added `.tap-chevron` CSS styling
   - Removed standalone vibrato panel
   - Integrated vibrato controls into glissando panel

3. **v4/templates/components/glissando-panel.html**
   - Renamed title to "Glissando Á"
   - Added vibrato controls container with `display: contents`
   - Simplified `updateGlissandoInfo()` to always show "Select durations"

4. **v4/templates/components/tap-chevron-component.html**
   - Reference component with specifications
   - Formula documentation for tap positioning

### Tap Chevron Formula
```javascript
// Horizontal position
chevronX = noteX + (noteDuration × 85px × tapPosition)

// Vertical position
pointY = noteY + (300cents × 0.125px/cent) = noteY + 37.5px

// Examples for dotted 8th (0.75):
// At 0:   chevronX = noteX + 0
// At 1/3: chevronX = noteX + 21.25px
// At 2/3: chevronX = noteX + 42.5px
```

### Data Integration
- Uses post-slur-to-tie conversion durations from `data-duration` attribute
- Detects dotted rhythms: 0.75 (dotted 8th), 1.5 (dotted quarter), 3.0 (dotted half)
- Zoom-aware positioning using `zoomController.getZoomX()`

## Usage

### Enable Tap Chevrons
1. Check a vibrato pitch class (enables vibrato rendering)
2. Select a tap position: 0, 1/3, or 2/3
3. Tap chevrons appear on all dotted notes at selected position
4. Uncheck position to remove tap chevrons

### Exclusive Selection
- Only one tap position can be active at a time
- Checking a new position automatically unchecks previous
- Unchecking removes all tap chevrons

## Visual Hierarchy
All left-hand techniques unified at 4px stroke width:
- Bent notes
- Vibrato sine waves
- Glissando chevrons
- Tap chevrons

## Browser Compatibility
- SVG polyline elements
- CSS `display: contents` (modern browsers)
- JavaScript event handling

## Performance
- O(n) tap chevron generation where n = dotted note count
- Instant rendering on checkbox change
- No performance impact when disabled

## Breaking Changes
None - additive feature only

## Migration Notes
- Tap chevrons only appear when position checkbox is selected
- No changes to existing vibrato or glissando functionality
- Glissando panel now includes vibrato controls (architectural improvement)

---

**Files Changed**: 4
**Lines Added**: ~150
**Lines Removed**: ~15
**Net Change**: +135 lines
