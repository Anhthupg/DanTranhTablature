# V4.3.29 - Pitch Class Circle Toggles & Chromatic Rainbow System

**Date:** October 14, 2025

## Overview
This version introduces an innovative pitch class visualization system with interactive circle toggles in the frozen string label area. Features dual-function toggles (string highlighting and vibrato control) with a complete chromatic rainbow color system.

## Major Features

### 1. Dual Circle Toggle System

**Location:** `.string-labels-fixed` overlay (left edge of tablatures)

**Components:**
- **Large Circles** (16px diameter) - String color highlighting
- **Small Circles** (8px diameter) - Vibrato sinewave control

**Layout:**
- String labels: x=0 (left edge, no padding)
- Large circles: x=35
- Small circles: x=55
- Container width: 90px (increased from 60px)

### 2. Chromatic Rainbow Color System

**12-Color Palette** (30° hue intervals, deep saturation):

```javascript
const pitchClassColors = {
    'C': '#D90606',    // 0° - Deep Red
    'C#/Db': '#D94906', // 30° - Deep Red-Orange
    'D': '#D98C06',    // 60° - Deep Orange
    'D#/Eb': '#CCD906', // 90° - Deep Yellow-Orange
    'E': '#89D906',    // 120° - Deep Yellow-Green
    'F': '#46D906',    // 150° - Deep Green-Yellow
    'F#/Gb': '#06D946', // 180° - Deep Cyan-Green
    'G': '#06D989',    // 210° - Deep Cyan
    'G#/Ab': '#06CCD9', // 240° - Deep Blue-Cyan
    'A': '#0689D9',    // 270° - Deep Blue
    'A#/Bb': '#0646D9', // 300° - Deep Violet
    'B': '#8906D9'     // 330° - Deep Magenta
};
```

**Color Properties:**
- HSL: 95% saturation, 45% lightness
- Deep, visible colors (no light/pale tones)
- Yellow clearly visible (reserved for unused strings)
- Light/opaque colors reserved for unused string indication

### 3. Large Circle Behavior (String Color Toggle)

**Default State:**
- Fill: White
- Outline: Black (2px)

**Clicked (ON):**
- Circle fill: Pitch-specific chromatic color
- All circles of same pitch class highlighted together
- String lines change to pitch color

**String Line Colors:**
- Used strings: 100% opacity of pitch color, stroke-width: 5px
- Unused strings: 30% opacity of pitch color, stroke-width: 5px
- Unclicked: All strings are black (100% or 30% opacity based on usage)

### 4. Small Circle Behavior (Vibrato Toggle)

**Default State:**
- Fill: White
- Outline: Black (2px)

**Clicked (ON):**
- Circle fill: Pitch-specific chromatic color
- All circles of same pitch class highlighted together
- Vibrato sinewaves drawn on used strings

**Integration:**
- Calls `vibratoController.toggleVibrato(pitchClass, enable)`
- Syncs with "Vibrato Rung on" checkboxes in control panel
- Uses correct controller (`optimalVibratoController` or `alt1VibratoController`)

### 5. Pitch Class Grouping

**Key Feature:** All circles of the same pitch class (across octaves) toggle together

**Examples:**
- Click any "D" circle → all D3, D4, D5, D6 circles change
- Click any "G" circle → all G3, G4, G5, G6 circles change

**Implementation:**
- Uses `data-pitch-class` attribute for grouping
- Extracts pitch class from label (e.g., "C4" → "C")
- `querySelectorAll('[data-pitch-class="C"]')` for batch updates

### 6. Independent Circle Behavior

**Large and small circles operate independently:**
- Can highlight strings (large) without vibrato (small)
- Can enable vibrato (small) without highlighting (large)
- Each maintains its own state and color

## Technical Implementation

### String Label Position Fix

**Before:** String labels at x=50
**After:** String labels at x=0 (left edge, no padding)

**File:** `server-tablature-generator.js:322`
```javascript
labelX: 0,  // Moved from 50 to 0
```

### Unused String Color System

**Before:** Grey (#999999) at 30% opacity
**After:** Black (#000000) at 30% opacity

**File:** `server-tablature-generator.js:298-305`
```javascript
const color = '#000000';  // Always black (used and unused)
const opacity = isUsed ? '1' : '0.3';  // 100% for used, 30% for unused
```

**Reason:** Light/pale colors reserved for opacity-based used/unused indication

### Circle Creation Logic

**File:** `v4-vertical-header-sections-annotated.html:3102-3144`

**Key Steps:**
1. Extract pitch class from string label text
2. Create large circle at x=35, r=8
3. Create small circle at x=55, r=4
4. Store `data-pitch-class` and `data-base-string-y` attributes
5. Append to frozen labels SVG

### Click Handler Implementation

**Large Circles (lines 3192-3243):**
```javascript
// Get all matching circles by pitch class
const matchingCircles = labelsSvg.querySelectorAll(
    `.string-color-toggle[data-pitch-class="${pitchClass}"]`
);

// Toggle fill color
const newFill = isCurrentlyOn ? 'white' : pitchColor;

// Update string lines using inline styles (override CSS)
stringLine.style.stroke = pitchColor;
stringLine.style.opacity = isUsed ? '1' : '0.3';
stringLine.style.strokeWidth = '5';
```

**Small Circles (lines 3246-3294):**
```javascript
// Determine correct controller
const vibratoController = svgId === 'optimalSvg'
    ? window.optimalVibratoController
    : window.alt1VibratoController;

// Toggle vibrato (same method as checkboxes)
vibratoController.toggleVibrato(pitchClass, enableVibrato);

// Sync control panel checkbox
const checkbox = document.getElementById(`vibrato-${pitchClass}`);
checkbox.checked = enableVibrato;
```

### Zoom Integration

**File:** `v4-vertical-header-sections-annotated.html:3254-3263`

Circles update Y position during zoom:
```javascript
const baseStringY = parseFloat(circle.getAttribute('data-base-string-y'));
const newY = baseStringY * yZoom;  // No +5 offset (circles center on string)
circle.setAttribute('cy', newY);
```

## Files Modified

1. **v4/templates/v4-vertical-header-sections-annotated.html**
   - Added circle creation logic
   - Added click handlers for both circle types
   - Updated zoom integration for circles
   - Updated `.string-labels-fixed` width: 60px → 90px
   - Updated title to V4.3.29

2. **v4/server-tablature-generator.js**
   - Changed string label x position: 50 → 0
   - Changed unused string color: grey → black at 30% opacity

3. **v4/templates/components/debug-label-generator.js**
   - Removed temporary red color test

## Usage

### Large Circles (String Highlighting)
1. Click any large circle
2. All circles of that pitch class turn to chromatic color
3. String lines highlight in that color (100% or 30% opacity)
4. Click again to toggle off (return to white/black)

### Small Circles (Vibrato Control)
1. Click any small circle
2. All circles of that pitch class turn to chromatic color
3. Vibrato sinewaves appear on used strings
4. Control panel checkbox automatically syncs
5. Click again to toggle off (return to white, vibrato off)

## Benefits

### Visual Clarity
- Instant pitch class recognition via color
- Clear distinction between used (bright) and unused (faded) strings
- Chromatic rainbow follows musical circle of fifths

### Interaction Design
- One click per pitch class (not per string/octave)
- Intuitive on/off toggle behavior
- Visual feedback via circle fill color
- Synchronized with existing control panel

### Musical Analysis
- Highlight specific pitch classes to see melodic patterns
- Enable vibrato per pitch class for performance practice
- Compare string usage across octaves
- Identify pitch class distribution in song

## Next Steps

### Potential Enhancements
1. Add reverse sync (checkbox clicks update circles)
2. Add "Clear All" button for circles
3. Consider color-coding vibrato sinewaves by pitch class
4. Add preset pitch class combinations (pentatonic scales)
5. Export/import circle toggle states

## Version History

- **V4.3.28:** Volume Slider & Spacebar Stop Control
- **V4.3.29:** Pitch Class Circle Toggles & Chromatic Rainbow System
