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
│   ├── linguistic-analyzer.js  # Advanced linguistic processing
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