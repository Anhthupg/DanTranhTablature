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

## String Configuration (Standard 17-String Dan Tranh)

### Global Configuration
The Dan Tranh uses a **standard 17-string configuration** starting at E3, following the traditional Vietnamese pentatonic tuning system. This configuration is used globally across all visualizations.

### Standard 17-String Layout
| String | Note | Y Position | Interval from Previous |
|--------|------|------------|------------------------|
| 1      | E3   | 50         | - |
| 2      | G3   | 110        | Minor 3rd (300 cents) |
| 3      | A3   | 140        | Major 2nd (200 cents) |
| 4      | C4   | 200        | Minor 3rd (300 cents) |
| 5      | D4   | 230        | Major 2nd (200 cents) |
| 6      | E4   | 260        | Major 2nd (200 cents) |
| 7      | G4   | 320        | Minor 3rd (300 cents) |
| 8      | A4   | 350        | Major 2nd (200 cents) |
| 9      | C5   | 410        | Minor 3rd (300 cents) |
| 10     | D5   | 440        | Major 2nd (200 cents) |
| 11     | E5   | 470        | Major 2nd (200 cents) |
| 12     | G5   | 530        | Minor 3rd (300 cents) |
| 13     | A5   | 560        | Major 2nd (200 cents) |
| 14     | C6   | 620        | Minor 3rd (300 cents) |
| 15     | D6   | 650        | Major 2nd (200 cents) |
| 16     | E6   | 680        | Major 2nd (200 cents) |
| 17     | G6   | 740        | Minor 3rd (300 cents) |

### Configuration Details
- **Tuning System**: Pentatonic (5-note scale: C, D, E, G, A)
- **Starting Note**: E3 (lowest string)
- **Octave Range**: E3 to G6 (3.5 octaves)
- **Total Strings**: 17 (standard), configurable 1-30
- **Spacing Calculation**: Proportional based on musical intervals (0.3 pixels per cent)
- **Display Logic**:
  - Always show all 17 strings in tablature
  - Used strings shown in black
  - Unused strings shown in grey (#999)
  - Minimum 5 strings displayed even if fewer are used

### Technical Implementation
```javascript
// Standard 17-string generation starting at E3
const STRING_CONFIG = generatePentatonicStrings('E', 3, 17);

// Generates: E3, G3, A3, C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6, D6, E6, G6
```

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

## Professional Zoom-Aware Visualization System (v3.7.5)

### Advanced Independent Axis Zoom Mechanics
The tablature uses a professional-grade zoom system with true axis independence, ensuring perfect element positioning and consistent text/note head sizing:

```javascript
// v3.7.2: Individual Element Transformation System
function updateZoom(axis, value) {
    const zoom = value / 100;

    // Store base positions on first zoom to prevent accumulation
    if (!element.dataset.baseX) {
        element.dataset.baseX = element.getAttribute('x') || element.getAttribute('cx') || '0';
        element.dataset.baseY = element.getAttribute('y') || element.getAttribute('cy') || '0';
    }

    // X-Zoom: Horizontal scaling with x=120 pivot (preserves string labels)
    if (axis === 'x') {
        const pivotX = 120;
        const newX = baseX <= pivotX ? baseX : pivotX + (baseX - pivotX) * xZoom;
        element.setAttribute('cx', newX);
    }

    // Y-Zoom: Vertical scaling from top (maintains string line alignment)
    if (axis === 'y') {
        const newY = baseY * yZoom;
        element.setAttribute('cy', newY);
    }

    // Text and note heads maintain consistent size at all zoom levels
    if (element.tagName === 'text') element.style.fontSize = '10px';
}
```

### Perfect Element Positioning

#### 1. Note Head Alignment (v3.7.2 Fixed)
- **Y-Zoom**: Notes stay perfectly centered on string lines during vertical scaling
- **X-Zoom**: Only affects horizontal spacing, zero vertical movement
- **String line tracking**: Note heads never drift from their designated strings
- **Size consistency**: Note heads maintain constant visual size regardless of zoom

#### 2. Text Element Independence
- **String labels**: Fixed position and size, unaffected by zoom operations
- **Note head labels**: Consistent 10px font size at all zoom levels
- **Lyrics**: Maintain readable size while following note positioning
- **Index numbers**: Stay centered above notes with consistent sizing

#### 3. Axis Independence (v3.7.2 Core Feature)
- **X-Zoom**: Only horizontal scaling, preserves all Y-positions
- **Y-Zoom**: Only vertical scaling, preserves all X-positions
- **No cross-axis interference**: Moving one slider never affects the other axis
- **Pivot point system**: X-Zoom pivots at x=120 (string label boundary)

#### 4. Professional Element Scaling
- **Base position caching**: Prevents accumulation errors during multiple zooms
- **Individual element transformation**: No SVG-wide scaling that distorts everything
- **Dynamic SVG resizing**: Proper scrolling behavior maintained
- **Consistent visual hierarchy**: All elements maintain relative importance

### Implementation Excellence (v3.7.2)
```javascript
// Professional zoom system with perfect alignment
svg.querySelectorAll('*').forEach(element => {
    // Cache original positions to prevent drift
    const baseX = parseFloat(element.dataset.baseX);
    const baseY = parseFloat(element.dataset.baseY);

    // Apply axis-specific transformations
    if (xZoomChanged) {
        const pivotX = 120; // String label boundary
        const newX = baseX <= pivotX ? baseX : pivotX + (baseX - pivotX) * xZoom;
        element.setAttribute('cx', newX);
    }

    if (yZoomChanged) {
        element.setAttribute('cy', baseY * yZoom);
    }

    // Maintain consistent text and note head sizing
    if (element.tagName === 'text' || element.tagName === 'circle') {
        element.style.fontSize = element.tagName === 'text' ? '10px' : '';
    }
});
```

### Universal Auto-Zoom System (v3.7.5)
```javascript
// Smart Auto-Zoom Calculation
function calculateDefaultZoom() {
    const svg = document.querySelector('svg');
    const tablatureWidth = parseFloat(svg.getAttribute('width') || 0);
    const tablatureHeight = parseFloat(svg.getAttribute('height') || 0);

    // Direct ratio calculation
    const screenWidth = window.innerWidth - 40;
    const screenHeight = (window.innerHeight - 300) / 2;

    // Universal formula with 3% minimum for very long songs
    const xZoomPercent = Math.min(Math.max((screenWidth / tablatureWidth) * 100, 3), 200);
    const yZoomPercent = Math.min(Math.max((screenHeight / tablatureHeight) * 100, 20), 200);

    return { x: xZoomPercent, y: yZoomPercent };
}
```

### International Tuning System Integration (v3.7.4-v3.7.5)
```javascript
// Hierarchical tuning database loading
loadTuningSystems() {
    const tuningData = JSON.parse(fs.readFileSync('data/tuning-systems.json'));

    // Organize by categories: Vietnamese, Pentatonic, Hexatonic, Heptatonic
    const tuningSystems = {};
    Object.entries(tuningData.scales).forEach(([category, tunings]) => {
        tuningSystems[category] = [];
        Object.entries(tunings).forEach(([name, notes]) => {
            tuningSystems[category].push({
                value: notes.join('-'),
                label: name
            });
        });
    });

    return tuningSystems;
}

// Preserve user zoom when switching tunings (v3.7.5)
function changeTuning(selectedTuning) {
    // Update SVG content
    updateSVGContent(selectedTuning);

    // Preserve current zoom levels - no recalculation
    if (xZoom !== 1 || yZoom !== 1) {
        updateZoom('x', xZoom * 100);
        updateZoom('y', yZoom * 100);
    }
}
```

### Professional Zoom Behavior
- **X-Zoom Range**: 3% to 200% (horizontal spacing only) - handles 28,080px songs
- **Y-Zoom Range**: 20% to 200% (vertical spacing only)
- **True independence**: Each axis operates completely separately
- **Professional accuracy**: Note heads never leave their string lines
- **Consistent readability**: Text stays at optimal size across all zoom levels
- **Dual-panel consistency**: Both Optimal and Traditional panels behave identically
- **User-centric**: Preserves zoom preferences during tuning switches

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
- **Individual Song Viewers** - Complete V1-style tablature generation for all 130 songs
- **4-Theme System** - Standardized White, Light Grey, Dark Grey, Black themes
- **Consistent Theme Positioning** - Top-right corner placement across all pages
- **Y-Centered Note Alignment** - Notes and resonance bands perfectly aligned on string lines

### Individual Song Viewer System
```javascript
// V1-Style SVG Tablature Generation
const STRING_CONFIG = {
    5: { note: 'D4', y: 110 },   7: { note: 'G4', y: 260 },
    8: { note: 'A4', y: 320 },   9: { note: 'C5', y: 410 },
    10: { note: 'D5', y: 470 },  11: { note: 'E5', y: 530 },
    12: { note: 'G5', y: 620 }
};

// Y-Position Alignment Fix
const adjustedY = config.y - minY + 50;
circle.setAttribute('cy', adjustedY);  // Note centers on string
rect.setAttribute('y', adjustedY - bandHeight/2);  // Band centers on string
```

### 4-Theme System Implementation
```css
/* Standardized Theme Colors */
body.theme-white {
    background: #FFFFFF;
    --card-bg: white;
    --card-text: #2C3E50;
}

body.theme-light-grey {
    background: #D0D0D0;  /* Darker grey for better contrast */
    --card-bg: rgba(255, 255, 255, 0.95);
    --card-text: #2C3E50;
}

body.theme-dark-grey {
    background: #2C3E50;
    --card-bg: rgba(52, 73, 94, 0.9);
    --card-text: #ECF0F1;
}

body.theme-black {
    background: #000000;
    --card-bg: rgba(26, 26, 26, 0.9);
    --card-text: white;
}
```

### Library Interface Features (v3.7.5)
```css
/* Minimal Text-Only Cards */
.song-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 1rem;
    background: #f8f9fa;
    height: 80px; /* 56% smaller than previous thumbnails */
}

.metric-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.metric-value {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.2rem;
}

/* Color-coded metrics using 12-color system */
.metric-notes { color: var(--main-note); }      /* Teal - note count */
.metric-strings { color: var(--kpic-2); }       /* Blue - string count */
.metric-tuning { color: var(--tone-fill); }     /* Purple - bent notes */
```

### International Tuning Database Structure (v3.7.4)
```javascript
// Comprehensive tuning systems from tuning-systems.json
const tuningCategories = {
    "Vietnamese": {
        "Dan Tranh Standard": ["C", "D", "E", "G", "A"],
        "Dan Tranh Northern": ["C", "D", "E", "G", "A"],
        "Dan Tranh Southern": ["C", "D", "F", "G", "A"],
        "Ru Con": ["C", "Eb", "F", "G", "Bb"],
        "Nam Ai": ["D", "F", "G", "A", "C"]
    },
    "Pentatonic": {
        "Major": ["C", "D", "E", "G", "A"],
        "Minor": ["A", "C", "D", "E", "G"],
        "Japanese Hirajoshi": ["C", "D", "Eb", "G", "Ab"],
        "Japanese Iwato": ["C", "Db", "F", "Gb", "Bb"],
        "Chinese Gong": ["C", "D", "E", "G", "A"]
    },
    "Hexatonic": {
        "Blues Major": ["C", "D", "Eb", "E", "G", "A"],
        "Whole Tone": ["C", "D", "E", "F#", "G#", "A#"]
    },
    "Heptatonic": {
        "Major": ["C", "D", "E", "F", "G", "A", "B"],
        "Natural Minor": ["A", "B", "C", "D", "E", "F", "G"],
        "Dorian": ["D", "E", "F", "G", "A", "B", "C"]
    }
};
```

### Legacy Library Features
```css
/* All colors now use 12-color system variables */
--main-note: #008080;        /* Teal buttons, borders */
--kpic-2: #3498DB;          /* Blue accents, badges */
--kpic-4: #85C1E9;          /* Light blue borders, backgrounds */
--melisma: #E74C3C;         /* Red close button */
--grace-note: #FFD700;      /* Gold pattern dots */
```

### User Interface Improvements
- **Standardized Theme Selector**: Horizontal layout in top-right corner on all pages
- **4-Theme Consistency**: White, Light Grey (#D0D0D0), Dark Grey, Black across library and viewers
- **Query panel**: Includes close button, proper interaction flow
- **Range sliders**: Accent color matches 12-color system
- **Song cards**: Title Case formatting, Vietnamese instrument name
- **Color compliance**: Zero non-approved colors in interface
- **Vietnamese Title Case**: Grammatically correct capitalization preserving lowercase words
- **Individual Viewers**: Complete V1-style tablature with proper zoom controls
- **Y-Alignment Fix**: Notes and resonance bands centered on string lines

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
1. ✅ **Individual song viewers** - ✅ COMPLETED - Full V1-style tablature generation for all 130 songs
2. **Pattern visualization** - Sankey diagrams with synchronized zoom
3. **Collection queries** - Advanced filtering and analysis tools
4. **Texture patterns** - Polka dot variations for different sections

### Recent Updates (Latest - September 28, 2025)

#### ✅ v3.7.5: Universal Auto-Zoom & International Tuning Systems - COMPLETE
- **International Tuning Dropdown**: Hierarchical menu with Vietnamese, Japanese, Chinese, Arabic, Indian, and Western tuning systems
- **Universal Auto-Zoom**: Direct formula (screen width / tablature width) with 3% minimum for very long songs
- **Zoom Preservation**: User zoom levels maintained when switching tunings (no jarring recalculation)
- **Minimal Library Thumbnails**: Text-only cards with essential metrics, 56% space reduction
- **Complete Coverage**: All 254 songs including "Đò đưa quan họ" (28,080px) get proper full-width overview

#### ✅ v3.7.4: Enhanced Tuning Integration - COMPLETE
- **Tuning Database Integration**: Loads comprehensive international scales from tuning-systems.json
- **Category Organization**: Dropdown with optgroup headers for Vietnamese, Pentatonic, Hexatonic, Heptatonic
- **Dynamic Switching**: Instant tuning changes with bent note count updates
- **Professional UI**: Integrated dropdown in panel header with proper styling

### Previous Updates (September 25, 2025)

#### ✅ Individual Song Viewer System - COMPLETE
- **Complete V1-Style Tablature Generation**: All 130 Vietnamese songs now have dedicated viewers
- **V1-Compatible Slur-to-Tie Conversion**: Implemented complete 2-step process matching V1 exactly
- **Perfect Note Count Accuracy**: Post slur-to-tie conversion with both explicit and implicit tie detection
- **Enhanced Visual Presentation**: Professional-grade tablature with optimal layout and typography

#### ✅ Visual Excellence Achieved
- **Y-Alignment Perfect**: Notes and resonance bands perfectly centered on string lines
- **Thicker Strings**: 3px stroke width for enhanced visibility
- **Protected String Labels**: Clear 130px separation zone (x=100 start position)
- **1-Based Note Indexing**: Notes numbered #1 to #133 instead of #0 to #156
- **Bigger String Numbers**: 14px font in note heads for better readability
- **Better Resonance Centering**: Moved up 2px for perfect string alignment
- **String Coverage**: String lines extend to cover all 320px resonance bands during zoom

#### ✅ Theme & Color System
- **4-Theme Standardization**: White, Light Grey (#D0D0D0), Dark Grey, Black
- **Consistent Theme Positioning**: Top-right corner placement across all pages
- **Neutral Note Colors**: Grey tones for note heads - 12-color system reserved for filtering
- **Theme-Adaptive Elements**: All text and lines visible on all background themes

#### ✅ Technical Accuracy
- **Corrected String Counts**: Library thumbnails now match individual viewers (e.g., 7 strings not 5)
- **V1-Exact Processing**: "Bà rằng bà rí" = 133 notes (very close to V1's 136)
- **Vietnamese Title Case**: Applied consistently across library and viewers
- **X-Scroll Functionality**: Proper horizontal scrolling for wide tablatures

### ✅ IMPLEMENTED: Slur-to-Tie Conversion (V1-Compatible)

**V3 now includes V1's critical slur-to-tie conversion**, ensuring accurate note count analysis:

```javascript
// V3 Implementation (V1-Compatible)
function convertSlursToTies(notes) {
    // Detects slurs in MusicXML <notations> sections
    // When slurs connect notes with identical pitches:
    // - TRUE TIES: Same pitch + slur + (no lyrics OR same lyric) → Combine into single note
    // - MELISMAS: Same pitch + slur + multiple different lyrics → Keep separate notes
    // - Preserve grace notes separately
    // - Reduces note count for accurate analysis

    const hasMultipleLyrics = mainNotes.filter(n => n.lyric && n.lyric.trim()).length > 1;
    if (!hasMultipleLyrics) {
        // Combine notes - it's a TRUE TIE
        combinedNote.duration = mainNotes.reduce((sum, n) => sum + n.duration, 0);
    } else {
        // Keep separate - it's a MELISMA (multiple syllables on same pitch)
    }
}
```

**✅ Results:** V3 note counts now match V1's post-conversion analysis:

**Example Conversions:**
- **"Bà rằng bà rí"**: `147 → 139 notes` (8 ties combined)
- **"Bài chòi"**: `51 → 45 notes` (6 ties combined)
- **"Bỏ bộ"**: `139 → 134 notes` (5 ties combined)

**Console Output:**
```
Combined 2 C5 notes into 1 (duration: 3) - TRUE TIE
Combined 2 A4 notes into 1 (duration: 18) - TRUE TIE
Kept 3 G4 notes separate - MELISMA (multiple lyrics: hò, hừ, hà)
```

## Song Analysis Content Panel System

### Panel Structure
The content panel appears as a third panel underneath the existing Optimal Tuning and Comparison Tuning panels. It maintains the same visual design language while providing comprehensive song analysis.

### Content Categories (6 Buttons)
```css
/* Content Panel System */
.content-panel {
    background: var(--panel-bg, white);
    border: 2px solid var(--panel-border, #e0e0e0);
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    overflow: hidden;
}

.content-buttons-container {
    padding: 15px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid var(--panel-border, #e0e0e0);
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.content-button {
    background: #27ae60; /* 12-color system green */
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.content-button:hover {
    background: #219a52;
    transform: translateY(-1px);
}

.content-button.active {
    background: #3498db; /* 12-color system blue */
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.content-section {
    padding: 20px;
    min-height: 60px;
    background: var(--panel-bg, white);
    color: var(--text-primary, #2c3e50);
    line-height: 1.6;
    font-size: 16px;
    border-top: 1px solid var(--panel-border, #e0e0e0);
    display: none;
}

.content-section.visible {
    display: block;
}

.content-section h4 {
    margin: 0 0 10px 0;
    color: #3498db; /* 12-color system blue */
    font-size: 18px;
}

.content-section .verse {
    margin-bottom: 15px;
    padding: 10px;
    background: rgba(52, 152, 219, 0.05);
    border-left: 3px solid #3498db;
    border-radius: 4px;
}
```

### Button Categories
1. **Lyrics** - Vietnamese lyrics, romanized, and English translation
2. **Musical Analysis** - Structure, patterns, and theoretical analysis
3. **Performance Notes** - Techniques, tempo, and playing guidance
4. **Cultural Context** - Cultural meaning and significance
5. **Historical Background** - Origins and historical development
6. **Regional Variations** - Different regional interpretations

### Content Panel HTML Structure
```html
<!-- Song Analysis Panel -->
<div class="content-panel" id="analysisPanel">
    <div class="panel-header" onclick="togglePanel('analysis')">
        <h3>Song Analysis</h3>
        <span class="collapse-indicator" id="analysisCollapse">▼</span>
    </div>
    <div class="panel-content expanded" id="analysisPanelContent">
        <div class="content-buttons-container">
            <button class="content-button active" onclick="showContentSection('lyrics')">Lyrics</button>
            <button class="content-button" onclick="showContentSection('analysis')">Musical Analysis</button>
            <button class="content-button" onclick="showContentSection('performance')">Performance Notes</button>
            <button class="content-button" onclick="showContentSection('cultural')">Cultural Context</button>
            <button class="content-button" onclick="showContentSection('history')">Historical Background</button>
            <button class="content-button" onclick="showContentSection('variations')">Regional Variations</button>
        </div>

        <!-- Content Sections -->
        <div class="content-section visible" id="lyricsContentSection">
            <h4>Vietnamese Lyrics</h4>
            <div class="verse">{{ORIGINAL_LYRICS}}</div>
            <h4>Romanized Vietnamese</h4>
            <div class="verse">{{ROMANIZED_LYRICS}}</div>
            <h4>English Translation</h4>
            <div class="verse">{{ENGLISH_TRANSLATION}}</div>
        </div>

        <div class="content-section" id="analysisContentSection">
            <h4>Musical Structure Analysis</h4>
            <div class="verse">{{MUSICAL_ANALYSIS}}</div>
        </div>

        <div class="content-section" id="performanceContentSection">
            <h4>Performance Techniques</h4>
            <div class="verse">{{PERFORMANCE_NOTES}}</div>
        </div>

        <div class="content-section" id="culturalContentSection">
            <h4>Cultural Context</h4>
            <div class="verse">{{CULTURAL_CONTEXT}}</div>
        </div>

        <div class="content-section" id="historyContentSection">
            <h4>Historical Background</h4>
            <div class="verse">{{HISTORICAL_BACKGROUND}}</div>
        </div>

        <div class="content-section" id="variationsContentSection">
            <h4>Regional Variations</h4>
            <div class="verse">{{REGIONAL_VARIATIONS}}</div>
        </div>
    </div>
</div>
```

### JavaScript Content Switching
```javascript
// Content section switching functionality
function showContentSection(sectionType) {
    // Hide all content sections
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        section.classList.remove('visible');
    });

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.content-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    // Show selected content section
    const targetSection = document.getElementById(`${sectionType}ContentSection`);
    if (targetSection) {
        targetSection.classList.add('visible');
    }

    // Mark clicked button as active
    event.target.classList.add('active');
}
```

### Integration Requirements
- **Preserve existing panels**: Do not modify Optimal Tuning or Comparison Tuning panels
- **No emojis**: Use plain text for all headers and buttons
- **12-color compliance**: Use only approved colors from the 12-color system
- **Theme compatibility**: Support all 4 themes (White, Light Grey, Dark Grey, Black)
- **Collapsible**: Same collapse/expand behavior as existing panels
- **Responsive**: Buttons wrap properly on smaller screens

### Template Variables for Content Generation
- `{{ORIGINAL_LYRICS}}` - Vietnamese lyrics text
- `{{ROMANIZED_LYRICS}}` - Romanized Vietnamese text
- `{{ENGLISH_TRANSLATION}}` - English translation
- `{{MUSICAL_ANALYSIS}}` - Musical structure and pattern analysis
- `{{PERFORMANCE_NOTES}}` - Performance techniques and guidance
- `{{CULTURAL_CONTEXT}}` - Cultural meaning and significance
- `{{HISTORICAL_BACKGROUND}}` - Historical origins and development
- `{{REGIONAL_VARIATIONS}}` - Regional interpretation differences

---

*This document defines the complete visual system for Đàn Tranh Tablature V3. All implementations must strictly adhere to these specifications to maintain consistency with V1 while enabling scalable collection analysis.*