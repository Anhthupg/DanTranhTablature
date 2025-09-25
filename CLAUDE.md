# Dan Tranh Tablature Project - Claude Configuration

## Project Overview
This project is an interactive Dan Tranh (Vietnamese 16-string zither) tablature visualization system with pattern analysis capabilities.

## String Configuration and Spacing

### Dynamic String System (NEW)
The Dan Tranh tablature now uses a **dynamic string configuration** that:
- **Automatically detects** all notes used in the songs
- **Supports 12-30 strings** as found in various Dan Tranh configurations
- **Handles chromatic notes** (sharps ♯ and flats ♭)
- **Supports microtones** (e.g., C4+15cents for precise tuning)
- **Displays only played strings** for cleaner visualization

### Tuning Systems Supported
- **Pentatonic**: Traditional 5-note scale (C, D, E, G, A) repeated in octaves
- **Hexachord**: 6-note tuning systems
- **Heptachord**: 7-note tuning systems
- **Custom**: Any combination of notes including chromatic variations

### String Bending for Non-Open Notes
For notes that aren't on open strings:
- Notes are placed **proportionally between strings**
- A **bending symbol** (curved dashed line) shows the bend from the lower string
- The bend ratio is calculated based on the interval between strings
- This represents the traditional Dan Tranh playing technique of pressing strings

### Example String Configurations

| Configuration | String Count | Notes Used |
|--------------|--------------|------------|
| Traditional Pentatonic | 16 | C, D, E, G, A in multiple octaves |
| Extended Chromatic | 16 | All 16 strings with chromatic coverage |
| Custom Song-Based | Variable | Only strings needed for specific songs |

### Spacing Details (UPDATED: Proportional System)
- **Proportional Spacing**: Based on musical intervals in cents (1 semitone = 100 cents)
- **Scale Factor**: 0.3 pixels per cent for optimal visual representation
- **Base Position**: D4 (String 5) at Y=110px
- **Example Spacings**:
  - D4 to G4: 500 cents (Perfect 4th) = 150px gap
  - G4 to A4: 200 cents (Major 2nd) = 60px gap
  - A4 to C5: 300 cents (Minor 3rd) = 90px gap
- **Total Height Range**: 110px to 620px (17 semitones = 510px total)
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
- and #29 should be index?
- 19 should be the same reason wtih $14 and you got #14 correctly