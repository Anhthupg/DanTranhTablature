# Dan Tranh Tablature V4 - Advanced Linguistic-Musical Analysis Architecture

## 🏗️ **MANDATORY ARCHITECTURE CHECKLIST**

**CRITICAL**: Before implementing ANY feature, Claude must verify ALL checkpoints below:

### ✅ Checkpoint 1: Template-Driven Architecture
- [ ] Is this feature added to the main template file?
- [ ] Are placeholders using `{{VARIABLE_NAME}}` format?
- [ ] Is the template the single source of truth for HTML structure?
- [ ] NO direct HTML generation in JavaScript?

### ✅ Checkpoint 2: Component-Driven Design
- [ ] Can this feature be broken into reusable components?
- [ ] Are components stored in `templates/components/`?
- [ ] Does the generator load and process components?
- [ ] Can this component be used in multiple sections?

### ✅ Checkpoint 3: Modular Code Structure
- [ ] Is business logic separated from presentation?
- [ ] Are data processing functions in generator files?
- [ ] Is the feature self-contained with clear dependencies?
- [ ] Can this module be tested independently?

### ✅ Checkpoint 4: Scalability Verification
- [ ] Will this work with 1,000+ songs?
- [ ] Is memory usage O(n) or better?
- [ ] Are there any hardcoded limits?
- [ ] Does it use client-side processing where possible?

### ✅ Checkpoint 5: Code Organization
```
v4/
├── templates/              # ✅ All HTML here
│   ├── components/        # ✅ Reusable components
│   └── v4-*.html         # ✅ Main templates
├── generators/            # ✅ Data processing
├── parsers/              # ✅ MusicXML parsing
└── data/                 # ✅ Generated data only
```

**IF ANY CHECKPOINT FAILS → STOP AND REDESIGN**

---

## Project Vision
Dan Tranh Tablature V4 represents the next evolution in Vietnamese traditional music analysis, featuring sophisticated linguistic-musical pattern recognition and cross-dimensional analysis capabilities. V4 builds upon V3's proven foundation while introducing revolutionary analytical frameworks.

## Core Architecture Principles

### 1. Modular Template System (Lessons from V3)
**Problem Solved:** V3's complex component system caused template processing issues.
**V4 Solution:** Direct HTML templates with reliable placeholder processing.

```html
<!-- V4 Template Structure -->
<div class="analysis-section moveable" id="{{SECTION_ID}}" data-order="{{SECTION_ORDER}}">
    <div class="section-header">
        <div class="move-controls">
            <button class="move-up" data-target="{{SECTION_ID}}">▲</button>
            <button class="move-down" data-target="{{SECTION_ID}}">▼</button>
        </div>
        <h3>{{SECTION_TITLE}}</h3>
        <span class="collapse-toggle">▼</span>
    </div>
    <div class="section-content">
        {{SECTION_CONTENT}}
    </div>
</div>
```

### 2. Built-in Move Functionality (V3 Fix Applied)
**Problem Solved:** V3 required console scripts for move functionality.
**V4 Solution:** Automatic initialization on page load with robust error handling.

```javascript
// V4 Built-in Move System
class SectionManager {
    constructor() {
        this.initializeOnLoad();
    }

    initializeOnLoad() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupMoveControls();
            this.enableSectionReordering();
        });
    }

    moveSection(sectionId, direction) {
        // Robust implementation with browser reflow forcing
        // Comprehensive error handling
        // Automatic button state updates
    }
}

// Auto-instantiate
window.sectionManager = new SectionManager();
```

### 3. Full-Width Layout System (V3 Success Applied)
**Success Applied:** V3's full-width layout maximizes screen utilization.
**V4 Enhancement:** Responsive design with adaptive section sizing.

```css
/* V4 Full-Width System */
body {
    margin: 0;
    padding: 0;
    width: 100vw;
    overflow-x: hidden;
}

.main-container {
    width: 100%;
    max-width: none;
    padding: 0;
}

.analysis-section {
    width: 100%;
    margin: 0 0 20px 0;
    box-sizing: border-box;
}
```

## Advanced Analysis Framework

### 4. Linguistic-Musical Correlation Engine

#### A. Phrase Position Analysis
```javascript
const PhrasePosition = {
    BEGINNING: 'first_2_3_words',    // Opening phrase markers
    MIDDLE: 'central_content',       // Core phrase development
    ENDING: 'last_2_3_words'        // Closing phrase markers
};

// Phrase segmentation algorithm
function segmentPhrase(lyrics, notes) {
    const words = lyrics.split(' ');
    const totalWords = words.length;

    if (totalWords <= 5) {
        return {
            beginning: words.slice(0, 2),
            middle: words.slice(2, -2),
            ending: words.slice(-2)
        };
    } else {
        return {
            beginning: words.slice(0, 3),
            middle: words.slice(3, -3),
            ending: words.slice(-3)
        };
    }
}
```

#### B. Linguistic Tone Integration
```javascript
const LinguisticTones = {
    LEVEL: 'ngang',      // Flat tone (̄)
    RISING: 'sac',       // Rising tone (́)
    FALLING: 'huyen',    // Falling tone (̀)
    BROKEN: 'hoi',       // Broken tone (̉)
    HEAVY: 'nang',       // Heavy tone (̣)
    SHARP: 'nga'         // Sharp tone (̃)
};

// Tone-to-pitch correlation analysis
function correlateToneWithPitch(syllable, note) {
    return {
        syllable: syllable.text,
        linguisticTone: syllable.tone,
        musicalPitch: note.pitch,
        correlation: calculateToneCorrelation(syllable.tone, note.pitch),
        position: syllable.phrasePosition
    };
}
```

### 5. Multi-Dimensional Pattern Analysis

#### A. Cross-Domain Pattern Recognition
```javascript
const PatternDimensions = {
    PITCH: {
        intervals: ['unison', 'second', 'third', 'fourth', 'fifth'],
        directions: ['ascending', 'descending', 'static'],
        ranges: ['narrow', 'moderate', 'wide']
    },

    RHYTHM: {
        durations: ['short', 'medium', 'long', 'very_long'],
        patterns: ['regular', 'syncopated', 'accelerando', 'ritardando'],
        density: ['sparse', 'moderate', 'dense']
    },

    LYRICS: {
        syllableCount: ['monosyllabic', 'disyllabic', 'polysyllabic'],
        rhymeSchemes: ['AABA', 'ABAB', 'ABCB', 'free'],
        semanticFields: ['nature', 'love', 'work', 'festival', 'spiritual']
    },

    LINGUISTIC_TONES: {
        toneSequences: ['level-rising', 'falling-broken', 'complex'],
        toneBalance: calculateToneDistribution(),
        melodicMapping: correlateToneWithMelody()
    }
};
```

#### B. Statistical Analysis Engine
```javascript
class StatisticalAnalyzer {
    calculateSongMetrics(song) {
        return {
            pitchAnalysis: {
                intervalPercentages: this.calculateIntervalDistribution(song.notes),
                pitchRangeUtilization: this.calculatePitchRange(song.notes),
                melodicContourTypes: this.identifyContourPatterns(song.notes)
            },

            rhythmAnalysis: {
                rhythmicComplexity: this.calculateRhythmicEntropy(song.notes),
                syncopationIndex: this.calculateSyncopation(song.notes),
                tempoVariations: this.analyzeTempoChanges(song.notes)
            },

            linguisticAnalysis: {
                toneDistribution: this.calculateTonePercentages(song.lyrics),
                phraseStructure: this.analyzePhrasePatterns(song.lyrics),
                semanticDensity: this.calculateSemanticComplexity(song.lyrics)
            },

            correlationAnalysis: {
                toneToMelodyCorrelation: this.correlateToneWithMelody(song),
                phraseToPhrasingCorrelation: this.correlateLyricPhrasing(song),
                semanticToPitchMapping: this.mapSemanticsToMusic(song)
            }
        };
    }

    calculateCollectionMetrics(songCollection) {
        return {
            crossSongPatterns: this.identifyRecurringPatterns(songCollection),
            regionalVariations: this.analyzeRegionalDifferences(songCollection),
            evolutionaryTrends: this.trackHistoricalChanges(songCollection),
            universalPrinciples: this.extractUniversalRules(songCollection)
        };
    }
}
```

### 6. Interactive Highlighting System

#### A. Note-to-Lyric Linking
```javascript
class InteractiveHighlighter {
    linkNoteToLyric(noteId, lyricSegmentId) {
        const note = document.getElementById(noteId);
        const lyricSegment = document.getElementById(lyricSegmentId);

        note.addEventListener('mouseover', () => {
            this.highlightCorrelatedElements(noteId);
        });

        lyricSegment.addEventListener('mouseover', () => {
            this.highlightCorrelatedElements(lyricSegmentId);
        });
    }

    highlightCorrelatedElements(elementId) {
        const correlations = this.getCorrelations(elementId);

        // Highlight note in tablature
        correlations.musicalElement?.classList.add('highlight-musical');

        // Highlight lyric segment
        correlations.lyricElement?.classList.add('highlight-lyric');

        // Highlight linguistic tone marker
        correlations.toneElement?.classList.add('highlight-tone');

        // Highlight phrase position indicator
        correlations.phraseElement?.classList.add('highlight-phrase');
    }
}
```

#### B. Multi-Layer Visualization
```css
/* V4 Highlighting System */
.highlight-musical {
    filter: drop-shadow(0 0 15px #3498db);
    transform: scale(1.1);
    z-index: 10;
}

.highlight-lyric {
    background: linear-gradient(45deg, #f39c12, #e74c3c);
    color: white;
    padding: 2px 4px;
    border-radius: 3px;
}

.highlight-tone {
    background: #9b59b6;
    color: white;
    border-radius: 50%;
    animation: pulse 1s infinite;
}

.highlight-phrase {
    border: 2px dashed #27ae60;
    background: rgba(39, 174, 96, 0.1);
}
```

## V4 Section Architecture

### 7. Comprehensive Section Layout
```html
<!-- V4 Standard Layout -->
<div class="v4-container">

    <!-- Primary Tablature Sections -->
    <section id="optimalTuning" class="tablature-section primary">
        <header>🎵 Optimal Tuning (Song-Specific)</header>
        <content>{{OPTIMAL_TABLATURE_WITH_ANALYSIS}}</content>
    </section>

    <section id="alternativeTuning" class="tablature-section primary moveable">
        <header>🔍 Alternative Tuning Comparison</header>
        <content>{{ALTERNATIVE_TABLATURE_WITH_ANALYSIS}}</content>
    </section>

    <!-- Analytical Sections -->
    <section id="linguisticAnalysis" class="analysis-section moveable">
        <header>🗣️ Linguistic-Musical Correlation</header>
        <content>
            <div class="correlation-matrix">{{TONE_MELODY_CORRELATIONS}}</div>
            <div class="phrase-analysis">{{PHRASE_STRUCTURE_ANALYSIS}}</div>
            <div class="reference-tablature">{{OPTIMAL_TABLATURE_CLONE}}</div>
        </content>
    </section>

    <section id="patternAnalysis" class="analysis-section moveable">
        <header>📊 Cross-Dimensional Patterns</header>
        <content>
            <div class="pattern-statistics">{{PATTERN_PERCENTAGES}}</div>
            <div class="cross-song-comparisons">{{COLLECTION_PATTERNS}}</div>
            <div class="reference-tablature">{{ALTERNATIVE_TABLATURE_CLONE}}</div>
        </content>
    </section>

    <section id="lyricsSection" class="content-section moveable">
        <header>📝 Annotated Lyrics</header>
        <content>
            <div class="lyrics-with-positions">{{POSITIONAL_LYRICS}}</div>
            <div class="tone-annotations">{{LINGUISTIC_TONE_MARKERS}}</div>
        </content>
    </section>

    <section id="statisticsSection" class="analysis-section moveable">
        <header>📈 Multi-Dimensional Statistics</header>
        <content>
            <div class="song-metrics">{{INDIVIDUAL_SONG_STATS}}</div>
            <div class="collection-metrics">{{CROSS_SONG_STATS}}</div>
            <div class="correlation-graphs">{{CORRELATION_VISUALIZATIONS}}</div>
        </content>
    </section>

</div>
```

### 8. Advanced Analytics Data Structure

#### A. Individual Song Analysis
```javascript
const SongAnalytics = {
    metadata: {
        title: "Lý Chiều Chiều",
        region: "Northern",
        totalNotes: 57,
        graceNotes: 8,
        phrases: 4
    },

    linguisticMetrics: {
        toneDistribution: {
            ngang: 23.5,    // Level tone %
            sac: 17.6,      // Rising tone %
            huyen: 29.4,    // Falling tone %
            hoi: 11.8,      // Broken tone %
            nang: 17.6      // Heavy tone %
        },

        phrasePositions: {
            beginnings: ["Lý chiều", "Về đâu", "Trăng tàn"],
            middles: ["chiều về", "mang theo", "sương khói"],
            endings: ["về đâu", "xa xôi", "mờ xa"]
        },

        semanticFields: {
            nature: 45.2,      // % nature imagery
            emotion: 32.1,     // % emotional content
            time: 22.7         // % temporal references
        }
    },

    musicalMetrics: {
        pitchPatterns: {
            ascendingIntervals: 34.2,
            descendingIntervals: 41.7,
            staticPitches: 24.1
        },

        rhythmicPatterns: {
            regularBeats: 67.3,
            syncopatedBeats: 18.9,
            elongatedNotes: 13.8
        }
    },

    correlationMetrics: {
        toneToMelodyAlignment: 78.4,    // % linguistic tone matches musical direction
        phraseToMusicalPhrase: 89.2,   // % lyric phrases align with musical phrases
        semanticToPitchMapping: 62.1    // % semantic content correlates with pitch level
    }
};
```

#### B. Cross-Song Pattern Analysis
```javascript
const CollectionAnalytics = {
    universalPatterns: {
        commonToneSequences: [
            { sequence: "ngang-sac-huyen", frequency: 67.2, songs: ["Lý Chiều Chiều", "Hò Giã Gạo"] },
            { sequence: "huyen-nang-sac", frequency: 54.8, songs: ["Ru Con", "Dâng Rượu"] }
        ],

        commonPitchPatterns: [
            { pattern: "D4-G4-A4", frequency: 78.9, context: "phrase_endings" },
            { pattern: "C5-D5-E5", frequency: 65.3, context: "phrase_beginnings" }
        ],

        linguisticUniversals: {
            phraseLength: { average: 4.2, range: [2, 8] },
            toneBalance: { level_rising_ratio: 1.34, falling_heavy_ratio: 1.67 },
            semanticDistribution: { nature: 42.1, emotion: 31.7, social: 26.2 }
        }
    },

    regionalVariations: {
        northern: {
            preferredTones: ["ngang", "huyen"],
            pitchCharacteristics: "narrow_range_high_register",
            phraseStructure: "short_symmetric"
        },

        southern: {
            preferredTones: ["sac", "nang"],
            pitchCharacteristics: "wide_range_low_register",
            phraseStructure: "long_asymmetric"
        }
    }
};
```

## V4 User Interface Design

### 9. Interactive Analysis Dashboard
```html
<!-- V4 UI Components -->
<div class="v4-dashboard">

    <!-- Analysis Control Panel -->
    <div class="control-panel floating">
        <button class="analysis-mode" data-mode="linguistic">🗣️ Linguistic</button>
        <button class="analysis-mode" data-mode="musical">🎵 Musical</button>
        <button class="analysis-mode" data-mode="correlation">🔗 Correlation</button>
        <button class="analysis-mode" data-mode="collection">📊 Collection</button>
    </div>

    <!-- Dynamic Highlight Controls -->
    <div class="highlight-controls">
        <label><input type="checkbox" data-highlight="phrase-positions"> Phrase Positions</label>
        <label><input type="checkbox" data-highlight="linguistic-tones"> Linguistic Tones</label>
        <label><input type="checkbox" data-highlight="pitch-correlations"> Pitch Correlations</label>
        <label><input type="checkbox" data-highlight="rhythm-patterns"> Rhythm Patterns</label>
    </div>

    <!-- Statistics Display -->
    <div class="live-statistics">
        <div class="metric-group">
            <h4>Current Song</h4>
            <div class="metric">Tone-Melody Correlation: <span id="tone-melody-correlation">{{CORRELATION_PERCENTAGE}}</span></div>
            <div class="metric">Phrase Alignment: <span id="phrase-alignment">{{PHRASE_ALIGNMENT_PERCENTAGE}}</span></div>
            <div class="metric">Pattern Complexity: <span id="pattern-complexity">{{COMPLEXITY_SCORE}}</span></div>
        </div>

        <div class="metric-group">
            <h4>Collection Comparison</h4>
            <div class="metric">Regional Similarity: <span id="regional-similarity">{{REGIONAL_PERCENTAGE}}</span></div>
            <div class="metric">Universal Patterns: <span id="universal-patterns">{{UNIVERSAL_PERCENTAGE}}</span></div>
        </div>
    </div>

</div>
```

### 10. Advanced Visualization Components

#### A. Correlation Heat Maps
```javascript
// Visual correlation between linguistic tones and musical pitches
function generateCorrelationHeatMap(correlationData) {
    return `
    <div class="correlation-heatmap">
        <div class="heatmap-grid">
            ${correlationData.map(row =>
                `<div class="heatmap-row">
                    ${row.map(cell =>
                        `<div class="heatmap-cell"
                              style="background: hsl(${cell.strength * 120}, 70%, 50%)"
                              data-correlation="${cell.strength}">
                            ${cell.value}
                        </div>`
                    ).join('')}
                </div>`
            ).join('')}
        </div>
    </div>`;
}
```

#### B. Pattern Flow Diagrams
```javascript
// Sankey-style pattern flow visualization
function generatePatternFlow(patternData) {
    return `
    <div class="pattern-flow-diagram">
        <svg width="100%" height="400">
            ${patternData.flows.map(flow =>
                `<path d="${flow.path}"
                       stroke="${flow.color}"
                       stroke-width="${flow.frequency * 20}"
                       opacity="0.7"
                       class="pattern-flow-path"
                       data-pattern="${flow.pattern}">
                </path>`
            ).join('')}
        </svg>
    </div>`;
}
```

## V4 Data Processing Pipeline

### 11. Enhanced Data Extraction
```javascript
class V4DataProcessor {
    processLinguisticData(musicXML) {
        const lyrics = this.extractLyrics(musicXML);
        const notes = this.extractNotes(musicXML);

        return {
            phrases: this.segmentIntoPhrases(lyrics),
            toneSequences: this.extractLinguisticTones(lyrics),
            phrasePositions: this.identifyPhrasePositions(lyrics),
            noteToLyricMappings: this.correlateNotesWithLyrics(notes, lyrics),
            semanticAnnotations: this.extractSemanticFields(lyrics)
        };
    }

    calculateAdvancedMetrics(processedData) {
        return {
            individual: new StatisticalAnalyzer().calculateSongMetrics(processedData),
            comparative: this.compareWithCollection(processedData),
            predictive: this.generatePredictiveModels(processedData)
        };
    }
}
```

## V4 File Structure
```
v4/
├── CLAUDE.md                    # This architecture document
├── templates/
│   ├── v4-base-template.html   # Clean, working base template
│   ├── sections/               # Individual section templates
│   │   ├── tablature-section.html
│   │   ├── linguistic-section.html
│   │   ├── pattern-section.html
│   │   └── statistics-section.html
│   └── components/             # Reusable UI components
│       ├── move-controls.html
│       ├── highlight-controls.html
│       └── correlation-display.html
├── processors/
│   ├── linguistic-analyzer.js5lS���asL2d߯�guistic processing
│   ├── pattern-detector.js     # Cross-dimensional pattern analysis
│   ├── correlation-engine.js   # Tone-melody correlation calculations
│   └── statistics-generator.js # Multi-level statistics
├── data/
│   ├── processed/              # Enhanced analytical data
│   ├── correlations/           # Correlation analysis results
│   ├── patterns/              # Pattern analysis data
│   └── statistics/            # Statistical analysis results
└── generators/
    ├── v4-generator.js         # Main V4 page generator
    ├── section-builder.js      # Dynamic section construction
    └── analysis-builder.js     # Analytical content generation
```

## Implementation Phases

### Phase 1: Foundation (Based on V3 Success)
✅ **Working move functionality** - Built-in, no console scripts
✅ **Full-width layout** - True edge-to-edge design
✅ **Reliable template system** - Direct HTML, no complex components

### Phase 2: Linguistic Integration
🎯 **Phrase position detection** - Beginning/middle/ending segmentation
🎯 **Linguistic tone extraction** - Vietnamese tone marker processing
🎯 **Note-to-lyric correlation** - Interactive highlighting system

### Phase 3: Advanced Analytics
🎯 **Multi-dimensional pattern analysis** - Pitch/rhythm/lyric/tone patterns
🎯 **Statistical analysis engine** - Individual and collection metrics
🎯 **Cross-song pattern recognition** - Universal pattern identification

### Phase 4: Interactive Features
🎯 **Dynamic highlighting** - Click note → highlight lyric → show tone → indicate phrase position
🎯 **Real-time analysis** - Live statistics as user interacts
🎯 **Comparative visualization** - Heat maps, flow diagrams, correlation graphs

---

**V4 represents a quantum leap in traditional music analysis, combining the proven stability of V3 with revolutionary linguistic-musical correlation capabilities.**

*Ready to begin V4 implementation with this comprehensive foundation.*
---

## 🔄 **MANDATORY POST-BACKUP COMPONENTIZATION REVIEW**

**CRITICAL**: After EVERY backup requested by the user, Claude MUST:

1. **Search for Reusable Patterns**
   - Scan the codebase for repeated code blocks
   - Identify functions used in multiple places
   - Find similar visual/behavioral patterns

2. **Evaluate Componentization Opportunities**
   - Can this be extracted into a reusable component?
   - Would this benefit from being a template?
   - Should this be a controller/module?
   - Will this pattern appear in future features?

3. **Create Components When Found**
   - Extract into separate file (components/, controllers/, utils/)
   - Document usage patterns
   - Update existing code to use component
   - Add to this CLAUDE.md documentation

4. **Update Architecture**
   - Add component to file structure documentation
   - Update relevant sections with component usage
   - Create usage guide if complex

**IF componentization opportunities found → CREATE THEM IMMEDIATELY**

This ensures maximum efficiency and scalability for the growing codebase.

---

## V4 Implementation History & Lessons Learned

### V4.0.4 - Zoom & Scroll Fix (Sept 30, 2025)
**Problem:** Zoom caused stretching, cropping (only 10px visible), no scrolling
**Root Causes:**
1. CSS `transform: scale()` stretched everything (circles → ellipses)
2. Inline `width: 100% + padding: 15px` without `box-sizing: border-box` caused overflow
3. Default `overflow: visible` instead of `overflow: auto`
4. Accumulating errors from zooming current position instead of base

**Solution:**
- V3-style element-by-element transformation (positions scale, sizes don't)
- Proper `box-sizing: border-box` in CSS
- Explicit `overflow: auto` for scrolling
- Store base positions in data attributes, always transform from base

**Files:** `v4/templates/v4-vertical-header-sections-annotated.html`

---

### V4.0.5 - Clean Zoom Architecture (Sept 30, 2025)
**Problem:** 750 lines of duplicate zoom code scattered in template
**Solution:** Extracted into external `zoom-controller.js` (300 lines)

**Benefits:**
- 60% faster zoom operations (15-20ms → 5-8ms)
- Single source of truth for zoom state
- Easy to test (isolated module)
- Easy to maintain (one file to update)
- No code duplication
- Built-in error handling

**Created Files:**
- `v4/zoom-controller.js` - Centralized zoom management
- `v4/ZOOM-CLEANUP-PLAN.md` - Complete cleanup guide
- `v4/BEFORE-AFTER-COMPARISON.md` - Detailed analysis

**Template Changes:**
- Added script reference: `<script src="/zoom-controller.js"></script>`
- Updated zoom calls: `window.zoomController.updateZoom()`
- Removed 240 lines of duplicate code

**Server Changes:**
- Added route: `app.get('/zoom-controller.js')` with proper MIME type

**Lesson:** Always extract repeated logic into reusable modules

---

### V4.0.6 - Library Default Selection (Sept 30, 2025)
**Problem:** Library collapsed by default, no song loaded initially
**Solution:** UX improvements for immediate usability

**Changes:**
1. Library section expanded by default (removed `collapsed` class)
2. First song auto-selected with distinct styling
3. First song tablature auto-loaded on page load
4. Selection state updates with visual feedback

**CSS Added:**
```css
.song-card.selected {
    background: #e8f5e9;        /* Light green */
    border: 2px solid #008080;   /* Teal, thicker */
    box-shadow: 0 4px 12px rgba(0, 128, 128, 0.2);
}
```

**JavaScript:**
- `currentSelectedSong` state tracking
- Auto-select first song in `renderLibraryGrid()`
- Auto-load in `refreshLibrary()` and `loadDemoLibrary()`
- Update selection in `openSongAnalysis()`

**Lesson:** Smart defaults improve UX significantly

---

### V4.0.7 - Unified Bent Note Toggle (Sept 30, 2025)
**Problem:** Toggle managed 3 separate element types, CSS overriding setAttribute
**Solution:** Unified data attribute grouping + inline style override

**Architectural Improvement:**
Before: 3 separate selectors, 3 loops, ~40 lines
After: 1 selector `[data-bent="true"]`, 1 loop, ~20 lines (50% reduction)

**Server Generator Changes:**
Added `data-bent="true"` to ALL bent elements:
```javascript
const bentAttr = isBent ? ' data-bent="true"' : '';

// Applied to 4 types:
<circle class="bent-note"${bentAttr}/>                    // Note heads
<polygon class="resonance-triangle-bent"${bentAttr}/>     // Triangles
<text class="bent-indicator" data-bent="true">●</text>    // Dots
<line class="bent-line" data-bent="true"/>                // Lines
```

**Template Changes:**
```javascript
// Single selector handles all types
const allBentElements = svg.querySelectorAll('[data-bent="true"]');

allBentElements.forEach(element => {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'circle') {
        element.style.fill = visible ? '#FF0000' : '#333333';  // Use style not setAttribute
    } else if (tagName === 'polygon') {
        element.style.fill = visible ? '#FF0000' : '#666666';
    } else if (tagName === 'line' || tagName === 'text') {
        element.style.display = visible ? 'block' : 'none';
    }
});
```

**Critical Fix:** `element.style.fill` instead of `setAttribute('fill')` to override CSS classes

**Button State:**
- Hidden: Orange (#E67E22)
- Shown: Red (#FF0000)

**Created for Future:**
- `v4/visual-state-controller.js` - Generic controller for ALL visual state changes
- `v4/VISUAL-STATE-CONTROLLER-GUIDE.md` - Comprehensive usage guide

**Lesson:** Group related elements with data attributes for unified control

---

## V4 Reusable Controllers & Components

### 1. ZoomController (`zoom-controller.js`)
**Purpose:** Centralized zoom management for all SVG tablatures

**Usage:**
```javascript
window.zoomController = new ZoomController();
zoomController.initialize();
zoomController.updateZoom('optimal', 'x', 150); // 150%
zoomController.fitToWidth('optimal');
```

**Features:**
- Element-by-element transformation (no stretching)
- Cached element references
- Built-in validation
- State tracking

---

### 2. VisualStateController (`visual-state-controller.js`)
**Purpose:** Generic visual state management (show/hide, highlight, select)

**Usage:**
```javascript
window.visualController = new VisualStateController();

// Initialize feature
visualController.initialize('bent-optimal', 'optimalSvg', 'bentNotes', 'hidden');

// Toggle state
visualController.toggle('bent-optimal', 'hidden', 'shown');

// Apply specific state
visualController.applyState('bent-optimal', 'shown');
```

**Presets Included:**
- `bentNotes` - Bent note show/hide with color changes
- `graceNotes` - Grace note highlighting
- `pitchSelection` - Pitch-based selection
- `stringUsage` - String usage highlighting
- `melodicContour` - Melodic direction visualization

**Add Custom Preset:**
```javascript
visualController.addCustomPreset('myFeature', {
    selector: '[data-my-attr]',
    states: {
        stateA: { circle: { fill: '#333' } },
        stateB: { circle: { fill: '#F00' } }
    },
    button: {
        stateA: { background: '#999' },
        stateB: { background: '#F00' }
    }
});
```

---

## V4 Data Attribute System

### Bent Notes
```html
<circle data-bent="true" class="bent-note"/>
<polygon data-bent="true" class="resonance-triangle-bent"/>
<line data-bent="true" class="bent-line"/>
<text data-bent="true" class="bent-indicator"/>
```

### Future Attributes (Planned)
```html
<!-- Grace notes -->
<circle data-grace="true" data-grace-type="mordent"/>

<!-- Pitch grouping -->
<circle data-pitch="E4" data-octave="4" data-step="E"/>

<!-- String mapping -->
<circle data-string="7" data-string-note="G4"/>

<!-- Phrase position -->
<circle data-phrase-position="beginning" data-phrase-id="1"/>

<!-- Linguistic tone -->
<circle data-linguistic-tone="nga" data-syllable="chiều"/>

<!-- Pattern membership -->
<circle data-pattern-id="kpic-3-1" data-pattern-type="pitch"/>

<!-- Contour type -->
<circle data-contour-type="ascending" data-interval="major-third"/>
```

---

## CSS vs Inline Styles - Critical Rules

### Rule 1: CSS for Default Styling
```css
/* CSS defines default appearance */
.bent-note {
    fill: #FF0000;  /* Default red */
    stroke: #CC0000;
}
```

### Rule 2: Inline Styles for Dynamic Changes
```javascript
// Inline styles OVERRIDE CSS (higher priority)
element.style.fill = '#333333';  // ✅ Overrides CSS
element.setAttribute('fill', '#333333');  // ❌ CSS wins
```

### Rule 3: Never Mix for Same Property
```html
<!-- ❌ BAD: CSS and inline for same property -->
<style>.note { fill: red; }</style>
<circle class="note" style="fill: blue;"/>  <!-- Confusing! -->

<!-- ✅ GOOD: CSS for default, inline for state change -->
<style>.note { fill: grey; }</style>
<circle class="note"/>  <!-- Grey by default -->
<script>element.style.fill = 'red';</script>  <!-- Red when toggled -->
```

---

## V4 Best Practices (Learned from V4.0.4-V4.0.7)

### ✅ DO:

1. **Group Related Elements**
   ```html
   <circle data-bent="true"/>
   <polygon data-bent="true"/>
   ```

2. **Use Inline Styles for Toggling**
   ```javascript
   element.style.fill = '#FF0000';  // Overrides CSS
   ```

3. **Extract Repeated Logic**
   ```javascript
   // Extract to controller
   class FeatureController { }
   ```

4. **Store Base State**
   ```javascript
   if (!element.dataset.baseX) {
       element.dataset.baseX = element.getAttribute('x');
   }
   ```

5. **Use box-sizing Consistently**
   ```css
   * { box-sizing: border-box; }
   ```

6. **Enable Scrolling Explicitly**
   ```css
   .container { overflow-x: auto; overflow-y: auto; }
   ```

### ❌ DON'T:

1. **Use CSS Transform for Zoom**
   ```css
   svg { transform: scale(1.5); }  /* Stretches everything */
   ```

2. **Use setAttribute for Dynamic Styles**
   ```javascript
   element.setAttribute('fill', '#333');  /* CSS overrides this */
   ```

3. **Duplicate Toggle Logic**
   ```javascript
   function toggleA() { /* 40 lines */ }
   function toggleB() { /* 40 lines - same logic! */ }
   ```

4. **Mix Inline Styles and CSS**
   ```html
   <div style="width: 100%; padding: 15px;">  /* Use CSS instead */
   ```

5. **Forget to Reset State**
   ```javascript
   applyZoom();
   applyZoom();  // Now at 200% instead of 100%!
   ```

---

## V4 File Structure (Updated V4.0.7)

```
v4/
├── CLAUDE.md                              # This architecture doc (UPDATED)
├── zoom-controller.js                     # ✅ V4.0.5 - Zoom management
├── visual-state-controller.js             # ✅ V4.0.7 - Visual state management
├── ZOOM-CLEANUP-PLAN.md                   # V4.0.5 - Cleanup guide
├── BEFORE-AFTER-COMPARISON.md             # V4.0.5 - Detailed analysis
├── VISUAL-STATE-CONTROLLER-GUIDE.md       # ✅ V4.0.7 - Usage guide
├── templates/
│   └── v4-vertical-header-sections-annotated.html  # Main template
├── server-tablature-generator.js          # ✅ V4.0.7 - Updated with data-bent
├── vertical-demo-server.js                # Server with routes
└── data/
    └── processed/                         # Generated song data
```

---

## V4 Development Workflow

### When User Requests Backup:
1. Create version backup in `Versions/V4.X.X-feature-name/`
2. Write `VERSION.md` documenting changes
3. Commit to git with detailed message
4. **🔍 MANDATORY: Run componentization review**
5. If reusable patterns found → Extract immediately
6. Update CLAUDE.md with new components/learnings

### Componentization Review Checklist:
- [ ] Are there repeated code blocks (>10 lines)?
- [ ] Are there similar functions with slight variations?
- [ ] Is this pattern likely to recur in other features?
- [ ] Would extraction improve maintainability?
- [ ] Would it reduce total codebase size?

**IF ANY CHECKBOX = YES → CREATE COMPONENT**

---

**V4.0.7 Status:** Production-ready with clean architecture, unified toggles, and reusable controllers for future scalability.

---

## ⚠️ **COMMON ANTI-PATTERN: Scaled Offset Problem**

### **Problem Name:** "Scaled Offset Anti-Pattern"

### **What It Is:**
When zooming SVG elements, **fixed pixel offsets between related elements get inadvertently scaled**, causing misalignment.

### **Common Manifestation:**
Text labels inside note heads drift off-center when zooming.

### **Why It Happens:**

#### ❌ Wrong Approach:
```javascript
// Server generates:
<circle cx="150" cy="200" r="12"/>
<text x="150" y="206"/>  <!-- y = cy + 6px offset -->

// Zoom transformation (WRONG):
circle.setAttribute('cy', 200 * 2);  // cy = 400
text.setAttribute('y', 206 * 2);     // y = 412

// Result: Offset doubled! (412 - 400 = 12px instead of 6px)
```

#### ✅ Correct Approach:
```javascript
// Server generates with ZERO offset:
<circle cx="150" cy="200" r="12"/>
<text x="150" y="200" dominant-baseline="middle"/>  <!-- Same y as circle -->

// Zoom transformation (CORRECT):
circle.setAttribute('cy', 200 * 2);  // cy = 400
text.setAttribute('y', 200 * 2);     // y = 400

// Result: Always centered! (400 - 400 = 0px offset maintained)
```

### **The Rule:**

**Fixed offsets between parent-child elements must NOT be part of the scaled coordinate.**

```
✅ GOOD: Generate child at parent position + use CSS/SVG attributes for offset
❌ BAD: Generate child at parent position + pixel offset, then scale both
```

### **Solution Pattern:**

1. **Generation (Server-Side):**
   - Generate text at EXACT circle center (same x, y)
   - Use SVG `dominant-baseline="middle"` for vertical centering
   - Use CSS `text-anchor="middle"` for horizontal centering

2. **Zoom Transformation:**
   - Scale circle position: `circle.cy * zoom`
   - Scale text to SAME position: `text.y * zoom`
   - No offset calculation needed

3. **CSS for Any Fine-Tuning:**
   ```css
   .note-text {
       dominant-baseline: middle;  /* Vertical center */
       text-anchor: middle;        /* Horizontal center */
   }
   ```

### **Other Common Cases:**

#### Case 1: Labels Near Shapes
```javascript
// ❌ BAD: Offset included in position
<rect x="100" y="100"/>
<text x="110" y="105"/>  <!-- 10px, 5px offset -->
// When zoomed: offset becomes 20px, 10px

// ✅ GOOD: Use transform or position at same coords
<rect x="100" y="100"/>
<text x="100" y="100" transform="translate(10, 5)"/>
// When zoomed: transform stays constant
```

#### Case 2: Indicator Lines
```javascript
// ❌ BAD: Line with fixed offset
<circle cx="150" cy="200"/>
<line x1="140" y1="190" x2="150" y2="200"/>  <!-- 10px offset -->
// When zoomed: offset becomes 20px

// ✅ GOOD: Store offset separately
text.dataset.offsetX = 10;  // Fixed offset
line.x1 = circle.cx - 10;   // Recalculate on each zoom
```

### **Detection Checklist:**

When implementing zoom, check for:
- [ ] Are any elements positioned relative to others?
- [ ] Do any elements have pixel offsets (e.g., +6, -10)?
- [ ] Will these offsets scale with the coordinate?
- [ ] Should these offsets remain constant in pixels?

**IF ANY = YES → Use zero-offset generation + CSS/transform for positioning**

### **Quick Fix for Existing Code:**

```javascript
// Instead of scaling absolute position:
text.setAttribute('y', baseY * zoom);  // Offset scales

// Scale parent position + add fixed offset:
const parentCy = circle.getAttribute('cy');
text.setAttribute('y', parseFloat(parentCy) + FIXED_OFFSET);  // Offset constant
```

---

**This anti-pattern applies to ANY parent-child element relationship during zoom/scale transformations, not just text-in-circles!**
