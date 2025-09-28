# Dan Tranh Tablature v3.6.1 - Rest Detection & Duration-Based Spacing

## Release Date: September 28, 2025

## Major Enhancements

### 1. **Complete Rest Detection**
The parser now properly detects and handles musical rests:

#### Implementation:
```javascript
// Detects both <rest/> elements and missing pitch elements
if (rest || !pitch) {
    // Calculates appropriate spacing based on rest duration
    // No visual element created, just spacing
}
```

#### Rest Spacing Values:
- **Sixteenth rest** (duration=1): 85px
- **Eighth rest** (duration=2): 170px
- **Quarter rest** (duration=4): 340px
- **Dotted quarter rest** (duration=6): 510px
- **Half rest** (duration=8): 680px
- **Dotted half rest** (duration=12): 1020px
- **Whole rest** (duration=16): 1360px

### 2. **Duration-Based Horizontal Spacing**
Complete implementation of musical timing through visual spacing:

#### Note Spacing:
- **Grace notes**: 25px (tight spacing regardless of actual duration)
- **Main notes**: Proportional to duration value
- **Rests**: Same spacing as equivalent note durations

#### Special Handling:
- Grace notes get minimal 25px spacing for visual clarity
- Main notes follow strict mathematical proportion
- Dynamic width calculation based on last note position

### 3. **V1-Compatible Note Sizing**
Updated to match original V1 specifications:

- **Main notes**: `r="12"` (radius 12px)
- **Grace notes**: `r="6"` (radius 6px)
- Note names displayed inside note heads with appropriate font sizing

## Bug Fixes in v3.6.1

### Rest Detection Fix:
- **Problem**: Parser was checking `if (!pitch)` but MusicXML uses `<rest/>` element
- **Solution**: Now checks `if (rest || !pitch)` to detect both rest types
- **Result**: All 9 rests in "Cô nói sao" now properly detected and spaced

### Spacing Calculation Fix:
- **Problem**: Using arbitrary `timing * 0.5` multiplier
- **Solution**: Implemented proper duration-based spacing algorithm
- **Result**: Musical timing accurately represented visually

## Test Results

### "Cô nói sao" Analysis:
- **Total notes**: 91 (78 main + 13 grace)
- **Rests detected**: 9
- **Rest types found**:
  - 6 quarter rests (340px spacing each)
  - 3 longer rest combinations (680-1020px spacing)
- **Spacing verification**: ✅ All gaps match expected rest durations

### Example Rest Gaps:
```
"vậy" → "đâu": 680px (340px note + 340px quarter rest)
"người." → "Nói": 680px (340px note + 340px quarter rest)
"họ" → "khắp": 1020px (340px note + 680px half rest)
```

## Files Included

1. **`musical-relationship-parser.js`** - Enhanced with rest detection
2. **`generate-dual-panel-viewer.js`** - Updated with V1 sizing and proper spacing
3. **`complete-dual-panel.html`** - "Cô nói sao" with proper rest spacing
4. **`relationships.json`** - Parsed data with correct timing values
5. **`CLAUDE.md`** - Updated documentation

## Technical Improvements

1. **Musical Accuracy**: Rests create natural pauses in the visualization
2. **Visual Clarity**: Grace notes visually compressed while maintaining timing
3. **Mathematical Precision**: Every duration value maps to exact pixel spacing
4. **V1 Compatibility**: Matches original tablature visual specifications

## Usage

### Parse with Rest Detection:
```bash
node v3/musical-relationship-parser.js "path/to/musicxml.xml"
```

### Generate Visualization:
```bash
node v3/generate-dual-panel-viewer.js
```

## Version History

- **v3.6.0**: Complete musical relationships with enharmonic support
- **v3.6.1**: Added rest detection and duration-based spacing

## Next Development Goals

1. **Batch Processing**: Parse all 130+ songs with rest detection
2. **Rest Visualization**: Optional visual indicators for rests
3. **Timing Grid**: Optional beat/measure grid overlay
4. **Playback Integration**: Use spacing for accurate timing

## Credits

Developed for the Dan Tranh Tablature Project
Rest Detection & Duration Spacing System v3.6.1
September 28, 2025