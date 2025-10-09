# Dan Tranh Tablature v3.6.0 - Complete Musical Relationships

## Release Date: September 28, 2025

## Major Features

### 1. **Musical Relationship Parser** (`musical-relationship-parser.js`)
Complete relationship tracking system for Dan Tranh music analysis:

#### Core Capabilities:
- **Grace Note → Main Note Relationships**: Tracks which grace notes belong to which main notes
- **Melisma Detection**: Identifies syllables spanning multiple notes with `<extend>` elements
- **Vietnamese Linguistic Tone Analysis**: Analyzes all 6 Vietnamese tones (ngang, sắc, huyền, hỏi, ngã, nặng)
- **Multi-Dimensional Pattern Analysis**: Pitch, rhythm, lyric, and combined patterns
- **Translation System Structure**: Ready for Vietnamese ↔ English mappings
- **Critical Tie Logic**: Same pitch + different lyrics = SEPARATE NOTES (not tied)

#### Bug Fixes in v3.6.0:
- **Fixed pitchClass storage**: Now includes alterations (Eb, F#, Bb) not just base notes
- **Added enharmonic equivalents**: Eb = D#, F# = Gb, etc.
- **Added double sharp/flat support**: Cx = D, Ebb = D, etc.
- **Added microtonal support**: Handles notes like F+15c with ±50 cent tolerance

### 2. **Dual-Panel Collapsible Viewer** (`generate-dual-panel-viewer.js`)
Advanced visualization with optimal 0.125px/cent spacing:

#### Visual Features:
- **Dual collapsible panels**: Compare optimal vs traditional tunings
- **Note names in note heads**: Clear pitch identification (Eb5, C5, F4, etc.)
- **Complete relationship display**:
  - Gold circles for grace notes
  - Red text for melisma lyrics
  - Red dots & dashed lines for bent notes
  - Note numbers above each note
- **17-string patterns**: Complete Dan Tranh string coverage
- **4-Theme system**: White, Light Grey, Dark Grey, Black backgrounds

#### Spacing System:
- **Optimal spacing**: 0.125px per cent (C1-B8 full coverage)
- **Mathematically precise**: Every semitone = 12.5px
- **Global consistency**: Identical positioning across all panels

### 3. **Enhanced Enharmonic & Microtonal Support**

#### Enharmonic Equivalents:
```javascript
// Single alterations
'C#' = 'Db', 'D#' = 'Eb', 'F#' = 'Gb', 'G#' = 'Ab', 'A#' = 'Bb'

// Double sharps
'Cx' = 'D', 'Dx' = 'E', 'Fx' = 'G', 'Gx' = 'A', 'Ax' = 'B'

// Double flats
'Dbb' = 'C', 'Ebb' = 'D', 'Fbb' = 'Eb', 'Gbb' = 'F', 'Abb' = 'Gb'
```

#### Microtonal Handling:
- Supports notes with cent deviations (e.g., C+50c = C quarter-sharp)
- 100 cents = 1 semitone
- ±50 cent tolerance for pitch class matching
- Proper normalization for octave-independent comparison

## Files Included

1. **`musical-relationship-parser.js`** - Complete relationship extraction from MusicXML
2. **`generate-dual-panel-viewer.js`** - Dual-panel visualization generator
3. **`dual-panel-tuning-analyzer.html`** - First implementation example
4. **`complete-dual-panel.html`** - Full "Cô nói sao" visualization
5. **`relationships.json`** - Parsed relationship data for "Cô nói sao"

## Critical Bug Fix

### The Problem (Pre-v3.6.0):
- `pitchClass` was storing only base note (e.g., "E" for "Eb5")
- System thought "E" wasn't in tuning ["C", "D", "Eb", "F", "Bb"]
- Result: Eb notes were marked as bent from Eb strings (nonsensical!)

### The Solution (v3.6.0):
```javascript
// Before (WRONG):
pitchClass: step  // Just "E"

// After (CORRECT):
pitchClass: `${step}${this.getAlterationSymbol(alter)}` // "Eb"
```

## Test Results

### "Cô nói sao" Analysis:
- **Total notes**: 91 (78 main + 13 grace)
- **Grace relationships**: 10 tracked
- **Melisma groups**: 7 detected
- **Vietnamese tones**: 66 analyzed
- **Lyric phrases**: 6 identified
- **Correct tie logic**: 2 ties, 2 separate repeated notes

### Tuning Comparison:
- **Optimal (C-D-Eb-F-Bb)**: 0 bent notes required ✅
- **Traditional (C-D-E-G-A)**: Multiple bent notes needed

## Usage

### Parse Relationships:
```bash
node v3/musical-relationship-parser.js "path/to/musicxml.xml"
```

### Generate Visualization:
```bash
node v3/generate-dual-panel-viewer.js
```

## Technical Improvements

1. **Systematic Processing**: Algorithmic approach to bent note detection
2. **Enharmonic Intelligence**: Understands musical pitch equivalence
3. **Microtonal Precision**: Handles quarter-tones and cent deviations
4. **Visual Clarity**: Note names directly in note heads
5. **Relationship Completeness**: All musical connections tracked

## Version History

- **v3.5.8**: DanTranhTuningAnalyzer framework
- **v3.5.9**: Initial relationship parsing
- **v3.6.0**: Complete relationships with enharmonic/microtonal support

## Next Development Goals

1. **Translation Database**: Connect Vietnamese lyrics to English meanings
2. **Pattern Recognition UI**: Interactive pattern exploration
3. **Audio Synthesis**: Connect visual to sound
4. **Learning Mode**: Progressive difficulty system
5. **Export Functions**: Generate teaching materials

## Credits

Developed for the Dan Tranh Tablature Project
Enhanced Musical Relationship System v3.6.0
September 28, 2025