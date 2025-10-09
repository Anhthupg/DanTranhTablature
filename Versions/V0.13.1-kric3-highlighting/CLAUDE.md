# Dan Tranh Tablature Project - Claude Configuration

## Project Overview
This project is an interactive Dan Tranh (Vietnamese 16-string zither) tablature visualization system with pattern analysis capabilities.

## String Configuration and Spacing

The Dan Tranh strings are configured with the following notes and Y-positions in the SVG coordinate system:

| String Number | Note | Y Position (SVG) | Line Y Position |
|---------------|------|------------------|-----------------|
| String 5      | D4   | 115              | 110             |
| String 7      | G4   | 265              | 260             |
| String 8      | A4   | 325              | 320             |
| String 9      | C5   | 415              | 410             |
| String 10     | D5   | 475              | 470             |
| String 11     | E5   | 535              | 530             |
| String 12     | G5   | 625              | 620             |

### Spacing Details
- **String Spacing**: Varies from 60px to 150px between strings
- **Base Y-offset**: Starts at 110px for the first string
- **Total Height Range**: 110px to 625px (515px total range)
- **Default Y-Zoom**: 67% (0.67x) to match comfortable viewing

### Coordinate System
- **X-axis**: Represents time/position in the piece (0 to 11400)
- **Y-axis**: Represents string positions (110 to 625)
- **Origin**: Top-left corner of the SVG canvas

## Pattern Analysis Systems

### KPIC (Kinetic Pitch Contour)
- Analyzes pitch patterns across notes
- KPIC-2: Two-note pitch transitions
- KPIC-3: Three-note pitch sequences
- etc.

### KRIC (Kinetic Rhythm Contour)
- Analyzes rhythm patterns across notes
- KRIC-2: Two-note rhythm transitions
- KRIC-3: Three-note rhythm sequences
- etc.

## Visualization Features

### Sankey Diagrams
- **KPIC-2 Sankey**: Shows pitch transitions between strings
- **KRIC-2 Sankey**: Shows rhythm transitions between durations
- **Zoom Synchronization**: Y-Zoom matches tablature zoom (default 67%)
- **Interactive Bands**: Click to select patterns, Cmd/Ctrl+click for multiple selection

### Important Implementation Notes

1. **Y-Position Consistency**: Always use the exact Y positions listed above when creating visualizations that need to align with the tablature.

2. **Zoom Matching**: When implementing zoom features, ensure that:
   - Default Y-zoom is 67% (0.67)
   - Zoom scaling uses the same multiplier for both tablature and diagrams
   - Y positions scale proportionally

3. **String Order**: The strings are ordered from top to bottom in ascending pitch:
   - D4 (top) → G5 (bottom)
   - This represents the physical layout of the Dan Tranh

## Commands to Run

### Testing
```bash
open analytical_tablature.html
```

### Development
- Always preserve the exact string spacing when modifying visualizations
- Maintain the connection between visual elements and their data attributes
- Ensure pattern selection synchronizes across all views

## File Structure
- `analytical_tablature.html` - Main application file
- `CLAUDE.md` - This configuration file
- Pattern data is embedded in the HTML file

## Notes for Future Development
- The string spacing is critical for accurate visualization
- All Y-coordinates are in SVG coordinate space (top = 0)
- Pattern highlighting relies on consistent note indexing