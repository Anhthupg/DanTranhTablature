# Dan Tranh Tablature V3 - Claude Configuration & Visual System

## Project Overview
Dan Tranh Tablature V3 is a scalable visualization system for Vietnamese 16-string zither music with advanced pattern analysis capabilities. This version maintains the exact visual experience of V1 while enabling collection-scale analysis of 130+ songs.

## Visual System Specifications

### 12-Color Optimized Palette

#### Primary Note Types (4 Colors)
```css
/* Main Notes - Teal Family */
--main-note-fill: #008080;        /* Teal - stable, foundational */
--main-note-stroke: #005959;      /* Dark teal - defines boundaries */
--main-note-text: #FFFFFF;        /* White - high contrast */

/* Grace Notes - Gold Family */
--grace-note-fill: #FFD700;       /* Gold - ornamental, attention-drawing */
--grace-note-stroke: #CC9900;     /* Dark gold - maintains definition */
--grace-note-text: #4A3C00;       /* Dark brown - readable on gold */

/* Tone Markings - Purple Family */
--tone-fill: #9B59B6;             /* Purple - tonal indicators */
--tone-stroke: #7D3C98;           /* Dark purple - boundaries */
--tone-text: #FFFFFF;             /* White - readable on purple */

/* Melisma - Red Family */
--melisma-fill: #E74C3C;          /* Red - flowing ornamentations */
--melisma-stroke: #C0392B;        /* Dark red - definition */
--melisma-text: #FFFFFF;          /* White - high contrast */
```

#### Pattern Categories (8 Colors)
```css
/* KPIC (Pitch) Patterns - Blue Gradient */
--kpic-1: #0066CC;                /* Deep blue - primary */
--kpic-2: #3498DB;                /* Medium blue - secondary */
--kpic-3: #5DADE2;                /* Sky blue - tertiary */
--kpic-4: #85C1E9;                /* Pale blue - quaternary */

/* KRIC (Rhythm) Patterns - Green Gradient */
--kric-1: #27AE60;                /* Forest green - primary */
--kric-2: #52BE80;                /* Medium green - secondary */
--kric-3: #76D7A4;                /* Mint green - tertiary */
--kric-4: #A9DFBF;                /* Pale green - quaternary */
```

### 4-Level Glow System

```css
/* Glow Intensities - Applied via filter or box-shadow */
--glow-level-1: 0 0 10px rgba(color, 0.4);    /* Soft - subtle indication */
--glow-level-2: 0 0 20px rgba(color, 0.6);    /* Medium - clear highlight */
--glow-level-3: 0 0 30px rgba(color, 0.8);    /* Strong - emphasis */
--glow-level-4: 0 0 40px rgba(color, 1.0);    /* Pulse - active/animated */

/* Application Examples */
.note-hover { filter: drop-shadow(var(--glow-level-1)); }
.note-selected { filter: drop-shadow(var(--glow-level-2)); }
.note-playing { filter: drop-shadow(var(--glow-level-3)); }
.note-active { filter: drop-shadow(var(--glow-level-4)); }
```

### Texture Pattern System

#### Pattern Types
```javascript
const texturePatterns = {
  // Solid colors for identical patterns
  solid: {
    description: "No texture - indicates identical repetition",
    usage: "Opening, Signature, Closing sections"
  },

  // Polka dot variations for different patterns
  polkaDots: {
    pattern1: {
      base: "#FFA500",           // Orange base
      dots: ["#FFFFFF", "#CC6600"], // White/dark orange dots
      usage: "Development Section 1"
    },
    pattern2: {
      base: "#FFA500",           // Orange base
      dots: ["#27AE60", "#FFFFFF"], // Green/white dots
      usage: "Development Section 2"
    },
    pattern3: {
      base: "#FFA500",           // Orange base
      dots: ["#3498DB", "#E74C3C"], // Blue/red dots
      usage: "Development Section 3"
    }
  }
};
```

### Background Options (White to Black)

```css
/* User-selectable backgrounds */
.theme-white {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;
  --text-primary: #2C3E50;
  --text-secondary: #7F8C8D;
}

.theme-light {
  --bg-primary: #F0F0F0;
  --bg-secondary: #E0E0E0;
  --text-primary: #34495E;
  --text-secondary: #95A5A6;
}

.theme-dark {
  --bg-primary: #2C3E50;
  --bg-secondary: #34495E;
  --text-primary: #ECF0F1;
  --text-secondary: #BDC3C7;
}

.theme-black {
  --bg-primary: #000000;
  --bg-secondary: #1A1A1A;
  --text-primary: #FFFFFF;
  --text-secondary: #CCCCCC;
}
```

## String Configuration (Dan Tranh Physical Layout)

| String | Note | Y Position | Purpose |
|--------|------|------------|---------|
| 5      | D4   | 115        | Base |
| 7      | G4   | 265        | 4th |
| 8      | A4   | 325        | 5th |
| 9      | C5   | 415        | 7th |
| 10     | D5   | 475        | Octave |
| 11     | E5   | 535        | 2nd above |
| 12     | G5   | 625        | 4th above |

- **Spacing**: 60-150px between strings
- **Default zoom**: 67% for comfortable viewing
- **Coordinate system**: SVG (top=0, increases downward)

## Pattern Analysis Systems

### KPIC (Kinetic Pitch Contour)
- **KPIC-2**: Two-note pitch transitions (e.g., D4→G4)
- **KPIC-3**: Three-note pitch sequences (e.g., D4→G4→A4)
- **Visual**: Blue color family with 4 intensity levels

### KRIC (Kinetic Rhythm Contour)
- **KRIC-2**: Two-note rhythm transitions
- **KRIC-3**: Three-note rhythm sequences
- **Visual**: Green color family with 4 intensity levels

### Pattern Efficiency Metrics
- **Learn Only**: Minimum notes needed to master (V1-style calculation)
- **Total Notes**: Complete song length
- **Efficiency Gain**: Percentage saved through pattern recognition
- **Unique Pitches**: Number of different musical notes used

## Implementation Guidelines

### State Management
```javascript
const visualStates = {
  opacity: {
    normal: 0.8,      // Default visibility
    hover: 0.9,       // Slight emphasis
    selected: 1.0,    // Full opacity
    dimmed: 0.4,      // Background/unselected
    inactive: 0.3     // Clearly inactive
  },

  strokeWidth: {
    normal: 1,        // Default
    hover: 2,         // On hover
    selected: 3,      // When selected
    highlight: 4      // Special emphasis
  }
};
```

### Audio Playback Visual Feedback
```css
/* Active playback animation */
@keyframes audioPlay {
  0% { transform: scale(1); box-shadow: none; }
  50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(255, 107, 107, 0.8); }
  100% { transform: scale(1); box-shadow: none; }
}

.note-playing {
  animation: audioPlay 0.5s ease-in-out;
  fill: #FF6B6B !important;
}
```

## Accessibility Features

### Colorblind-Friendly Palette
```javascript
const colorblindSafe = {
  mainNote: '#0173B2',    // Blue (safe for all types)
  graceNote: '#ECE133',   // Yellow (distinguishable)
  kpic: ['#0173B2', '#56B4E9', '#88CCEE', '#B3E0FF'],
  kric: ['#CC6677', '#EE8899', '#FFAABB', '#FFCCDD']
};
```

### High Contrast Mode
```css
.high-contrast {
  --main-note-fill: #000000;
  --main-note-stroke: #FFFFFF;
  --stroke-width-normal: 2px;
  --stroke-width-selected: 4px;
}
```

## V3-Specific Features

### Collection Query System
- Filter by region (Northern, Southern, Central, Highland)
- Filter by string usage (4-7 strings)
- Filter by note count ranges
- Filter by unique note count
- Filter by tuning systems

### Smart Data Management
- Progressive loading of song data
- Cached pattern analysis
- Efficient metadata storage
- Real-time import system

### Tuning Detection
- Automatic detection of most frequent 5 notes
- Identification of bent notes (non-standard pitches)
- Tuning system classification (detected vs default)
- Cross-song tuning compatibility analysis

## Commands

### Development
```bash
npm run dev:v3          # Run V3 server (port 3002)
npm run v3:import       # Import new MusicXML files
npm run v3:import:watch # Auto-import on file drop
npm run v3:process      # Full V1-style processing
```

### File Structure
```
v3/
├── data/
│   ├── musicxml/       # Source MusicXML files
│   ├── processed/      # Generated visualizations
│   └── song-list.json  # Song registry
├── templates/          # V1 interface templates
├── auto-import.js      # Automatic import system
└── CLAUDE.md          # This configuration file
```

## Important Implementation Notes

1. **Preserve V1 Experience**: All visual elements must match V1 exactly
2. **Color Consistency**: Use the 12-color system across all visualizations
3. **Glow Hierarchy**: Apply 4-level glow system for emphasis
4. **Texture Meaning**: Solid = identical, Polka dots = variation
5. **Background Flexibility**: Support white to black themes
6. **Pattern Alignment**: Maintain Y-position consistency with tablature

## Migration from V1

When implementing V3 visualizations:
1. Copy exact color values from this document
2. Implement all 4 glow levels
3. Add texture patterns for variation indication
4. Include background theme selector
5. Maintain exact string Y-positions
6. Preserve all visual feedback mechanisms

## V3 Implementation Status (Updated)

### Completed Features
- **Auto-import system** with real MusicXML data extraction
- **V1-style pattern efficiency** calculation (learn X / total Y notes)
- **Tuning detection** system (most frequent 5 notes = tuning)
- **130-song collection** fully integrated
- **12-color system compliance** across all UI elements
- **Theme system** with white/dark/black backgrounds
- **Query & Analysis panel** with close functionality
- **Title Case formatting** for all song names
- **Vertical theme selector** positioned on right side
- **Vietnamese spelling** - "Đàn Tranh" throughout interface
- **Compliant slider colors** using 12-color system variables
- **Vietnamese-aware Title Case** with proper grammatical rules

### Library Interface Features
```css
/* All colors now use 12-color system variables */
--main-note: #008080;        /* Teal buttons, borders */
--kpic-2: #3498DB;          /* Blue accents, badges */
--kpic-4: #85C1E9;          /* Light blue borders, backgrounds */
--melisma: #E74C3C;         /* Red close button */
--grace-note: #FFD700;      /* Gold pattern dots */
```

### User Interface Improvements
- **Theme selector**: Vertical layout on right side, doesn't block text
- **Query panel**: Includes close button, proper interaction flow
- **Range sliders**: Accent color matches 12-color system
- **Song cards**: Title Case formatting, Vietnamese instrument name
- **Color compliance**: Zero non-approved colors in interface
- **Vietnamese Title Case**: Grammatically correct capitalization preserving lowercase words

### Data Processing Status
- **Real metadata**: Tempo, time signatures, note counts from MusicXML
- **Pattern analysis**: V1-compatible efficiency calculations
- **Tuning systems**: Automatic detection vs default classification
- **Region detection**: Based on song name patterns and metadata

### Vietnamese Language Processing
```javascript
// Vietnamese-aware Title Case function
function toTitleCase(str) {
    const lowercaseWords = ['và', 'của', 'cho', 'với', 'từ', 'trong',
                           'em', 'con', 'là', 'quan', 'họ', 'ru', 'hò'];

    return str.replace(/\w\S*/g, function(txt, index){
        if (index === 0) return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        if (lowercaseWords.includes(txt.toLowerCase())) return txt.toLowerCase();
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
```

Examples:
- "đò đưa quan họ" → "Đò Đưa quan họ"
- "hát ru em cảnh dương" → "Hát Ru em Cảnh Dương"
- "lý chiều chiều" → "Lý Chiều Chiều"

### Next Development Phases
1. **Individual song viewers** - Full V1-style tablature generation
2. **Pattern visualization** - Sankey diagrams with synchronized zoom
3. **Collection queries** - Advanced filtering and analysis tools
4. **Texture patterns** - Polka dot variations for different sections

---

*This document defines the complete visual system for Đàn Tranh Tablature V3. All implementations must strictly adhere to these specifications to maintain consistency with V1 while enabling scalable collection analysis.*