# Structural Analysis Implementation Plan

## Overview

This document outlines the implementation of **multi-dimensional word-based structural analysis** for Vietnamese folk songs, combining:

1. **Parallelism Hierarchy Detection** (exact → structural → semantic similarity)
2. **Semantic Keyword Clustering** (emotions, characters, actions, nature, etc.)
3. **Functional Analysis** (why these keywords in these sections?)

---

## Two-Track Architecture

### Track 1: Independent Structural Analysis Panel (Fallback)
**Type:** Independent collapsible section (no synchronization)
**Purpose:** High-level song-wide pattern overview
**Placement:** Below statistics panel, above tablature sections
**Effort:** 2-3 hours

### Track 2: Synchronized Phrase Annotations (Primary Goal)
**Type:** Fully synchronized section with tablature
**Purpose:** Visual phrase-by-phrase annotations aligned with music
**Placement:** New synchronized section below tablature
**Effort:** 4-5 hours
**Quick Command Compliance:** ✅ Full sync required

---

## Implementation Priority

**PRIMARY: Track 2** (Synchronized Phrase Annotations)
**FALLBACK: Track 1** (Independent Panel) - If Track 2 fails/blocked

---

# Track 1: Independent Structural Analysis Panel

## Purpose

Global overview of song structure without note-level synchronization.

### What It Shows

```
┌─────────────────────────────────────────────┐
│ 📊 Structural Analysis                      │
│ ─────────────────────────────────────────── │
│ PARALLELISM HIERARCHY:                      │
│  ✓ 3 exact refrains detected               │
│  ✓ 2 question-answer pairs                 │
│                                             │
│ SEMANTIC CLUSTERS:                          │
│  ✓ Abstract: duyên (fate) - 3 occurrences  │
│  ✓ Emotion: khổ (suffer) - 3 occurrences   │
│                                             │
│ INSIGHTS:                                   │
│  → Refrains use abstract+emotion formula   │
│  → Questions use action+interrogative       │
└─────────────────────────────────────────────┘
```

---

## Algorithm 1: Parallelism Hierarchy Detection

### Level 1: Exact Repetition (100% identical text)

```javascript
function detectExactRefrains(phrases) {
    const textGroups = {};

    phrases.forEach(p => {
        const normalized = p.text.trim().toLowerCase();
        if (!textGroups[normalized]) textGroups[normalized] = [];
        textGroups[normalized].push(p.id);
    });

    return Object.entries(textGroups)
        .filter(([text, ids]) => ids.length > 1)
        .map(([text, ids]) => ({
            level: 'exact',
            text: text,
            phraseIds: ids,
            count: ids.length
        }));
}
```

**Example Output:**
```json
{
  "level": "exact",
  "text": "ơi bà rí ơi",
  "phraseIds": [8, 17, 26],
  "count": 3
}
```

---

### Level 2: Structural Parallelism (Same pattern, different words)

```javascript
function detectStructuralParallels(phrases) {
    return phrases.map(p => ({
        phraseId: p.id,
        pattern: extractPattern(p.wordMapping),
        example: p.text
    }));
}

function extractPattern(wordMapping) {
    return wordMapping.map(w => {
        const en = w.en.toLowerCase();

        // Classify into grammatical categories
        if (['oh', 'o (vocative)', 'hey'].includes(en)) return 'EXCL';
        if (['mrs.', 'mr.', 'miss/aunt'].includes(en)) return 'TITLE';
        if (w.vn.match(/^[A-Z]/)) return 'NAME';
        if (['go', 'carry', 'water', 'see'].includes(en)) return 'VERB';
        if (['who', 'what', 'where'].includes(en)) return 'Q-WORD';
        if (['is/be', 'that/which'].includes(en)) return 'COPULA';

        return 'OTHER';
    }).join('-');
}
```

**Example Output:**
```javascript
// Phrase 8:  "ơi bà Rí ơi"     → "EXCL-TITLE-NAME-EXCL"
// Phrase 17: "ơi bà Rí ơi"     → "EXCL-TITLE-NAME-EXCL" (same pattern)
// Phrase 9:  "bà Rằng bà Rí ơi" → "TITLE-NAME-TITLE-NAME-EXCL" (variation)
```

---

### Level 3: Semantic Parallelism (Same themes, different structure)

```javascript
function detectSemanticParallels(phrases) {
    const semanticGroups = {};

    phrases.forEach(p => {
        const themes = extractThemes(p.wordMapping);
        themes.forEach(theme => {
            if (!semanticGroups[theme]) semanticGroups[theme] = [];
            semanticGroups[theme].push(p.id);
        });
    });

    return semanticGroups;
}

function extractThemes(wordMapping) {
    const themes = new Set();

    wordMapping.forEach(w => {
        const en = w.en.toLowerCase();

        // Emotion words
        if (['love/pity', 'suffer', 'mourning/sad'].includes(en)) {
            themes.add('emotion');
        }
        // Family words
        if (['mother', 'classifier (animals)', 'mrs.', 'mr.'].includes(en)) {
            themes.add('family');
        }
        // Nature words
        if (['wind', 'evening/afternoon', 'field', 'water'].includes(en)) {
            themes.add('nature');
        }
        // Action words
        if (['go', 'carry', 'water', 'sleep', 'see'].includes(en)) {
            themes.add('action');
        }
        // Abstract concepts
        if (['fate', 'generation/life', 'heart/inside'].includes(en)) {
            themes.add('abstract');
        }
        // Vocatives
        if (['oh', 'o (vocative)', 'hey', '(exclamation)'].includes(en)) {
            themes.add('vocatives');
        }
    });

    return Array.from(themes);
}
```

**Example Output:**
```json
{
  "emotion": [3, 4, 7, 16, 25],
  "nature": [1, 3],
  "action": [2, 3, 4, 12, 13],
  "abstract": [5, 6, 15, 24]
}
```

---

## Algorithm 2: Semantic Clustering

```javascript
class SemanticClusterer {
    // Predefined semantic domains
    domains = {
        characters: ['bà', 'chồng', 'cô', 'tôi', 'em', 'chàng', 'con', 'mẹ', 'ông'],
        emotions: ['khổ', 'thương', 'tang', 'tình', 'nhớ'],
        actions: ['đi', 'làm', 'gánh', 'tưới', 'ru', 'ngủ', 'thấy', 'nối'],
        nature: ['chiều', 'gió', 'cây', 'nước', 'đồng', 'tây lầu', 'mùa thu'],
        abstract: ['duyên', 'đời', 'lòng'],
        vocatives: ['ơi', 'hỡi', 'ới', 'ư', 'này']
    };

    clusterPhrase(phrase) {
        const clusters = {};

        phrase.wordMapping.forEach(word => {
            Object.entries(this.domains).forEach(([domain, keywords]) => {
                if (keywords.includes(word.vn.toLowerCase())) {
                    if (!clusters[domain]) clusters[domain] = [];
                    clusters[domain].push(word.vn);
                }
            });
        });

        return {
            phraseId: phrase.id,
            text: phrase.text,
            clusters: clusters,
            dominantDomain: this.getDominantDomain(clusters)
        };
    }

    getDominantDomain(clusters) {
        return Object.entries(clusters)
            .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'other';
    }
}
```

**Example Output:**
```json
{
  "phraseId": 2,
  "text": "Ới rằng bà đi",
  "clusters": {
    "vocatives": ["Ới"],
    "characters": ["bà"],
    "actions": ["đi"]
  },
  "dominantDomain": "vocatives"
}
```

---

## Algorithm 3: Structural Function Analysis

```javascript
class StructuralFunctionAnalyzer {
    analyzeWhy(parallelGroups, semanticClusters, phrases) {
        const insights = [];

        // Rule 1: Refrains use abstract + emotion keywords
        const refrains = parallelGroups.filter(g => g.level === 'exact');
        refrains.forEach(refrain => {
            const phraseClusters = refrain.phraseIds.map(id =>
                semanticClusters.find(c => c.phraseId === id)
            );

            const hasFate = phraseClusters.some(p =>
                p.clusters.abstract?.includes('duyên')
            );
            const hasEmotion = phraseClusters.some(p =>
                p.clusters.emotions?.length > 0
            );

            if (hasFate && hasEmotion) {
                insights.push({
                    pattern: 'refrain_formula',
                    reason: 'Refrains combine ABSTRACT concepts (duyên=fate) with EMOTIONS (khổ=suffering) to create memorable philosophical anchors',
                    phraseIds: refrain.phraseIds,
                    evidence: phraseClusters
                });
            }
        });

        // Rule 2: Questions use actions + interrogatives
        const questions = semanticClusters.filter(c =>
            c.clusters.actions?.length > 0 &&
            c.text.includes('đâu') // "where"
        );

        if (questions.length > 0) {
            insights.push({
                pattern: 'question_formula',
                reason: 'Questions pair ACTION verbs (đi=go) with interrogatives (đâu=where) to create narrative suspense',
                phraseIds: questions.map(q => q.phraseId),
                evidence: questions
            });
        }

        // Rule 3: Opening uses nature/setting
        const opening = semanticClusters.find(c => c.phraseId === 1);
        if (opening?.clusters.nature) {
            insights.push({
                pattern: 'opening_formula',
                reason: 'Opening establishes SETTING using nature vocabulary (chiều=evening, gió=wind) to ground listener in time/place',
                phraseIds: [1],
                evidence: opening
            });
        }

        // Rule 4: Closing uses vocatives + repetition
        const lastPhrase = semanticClusters[semanticClusters.length - 1];
        if (lastPhrase?.clusters.vocatives?.length >= 3) {
            insights.push({
                pattern: 'closing_formula',
                reason: 'Closing uses repeated VOCATIVES (ơi, hỡi) to create emotional intensity and hypnotic conclusion',
                phraseIds: [lastPhrase.phraseId],
                evidence: lastPhrase
            });
        }

        return insights;
    }
}
```

---

## HTML Template (Track 1)

```html
<!-- templates/components/structural-analysis-panel.html -->
<div class="analysis-section moveable" id="structuralAnalysis" data-order="3">
    <div class="section-header">
        <div class="move-controls">
            <button class="move-up" data-target="structuralAnalysis">▲</button>
            <button class="move-down" data-target="structuralAnalysis">▼</button>
        </div>
        <h3>📊 Structural Analysis</h3>
        <span class="collapse-toggle">▼</span>
    </div>

    <div class="section-content">
        <!-- Parallelism Hierarchy -->
        <div class="analysis-subsection">
            <h4>Parallelism Hierarchy</h4>
            <div class="refrain-list">
                {{#exactRefrains}}
                <div class="refrain-item" data-level="exact">
                    <span class="badge refrain-badge">EXACT REFRAIN ({{count}}x)</span>
                    <span class="text">"{{text}}"</span>
                    <span class="occurrences">Phrases: {{phraseIds}}</span>
                </div>
                {{/exactRefrains}}

                {{#structuralParallels}}
                <div class="refrain-item" data-level="structural">
                    <span class="badge structural-badge">STRUCTURAL ({{count}}x)</span>
                    <span class="pattern">{{pattern}}</span>
                    <span class="occurrences">Phrases: {{phraseIds}}</span>
                </div>
                {{/structuralParallels}}
            </div>
        </div>

        <!-- Semantic Clusters -->
        <div class="analysis-subsection">
            <h4>Semantic Clustering</h4>
            <div class="cluster-grid">
                {{#semanticDomains}}
                <div class="cluster-card" data-domain="{{name}}">
                    <span class="icon">{{icon}}</span>
                    <span class="label">{{label}}</span>
                    <div class="keywords">
                        {{#keywords}}
                        <span class="keyword">{{vn}} <span class="en">({{en}})</span></span>
                        {{/keywords}}
                    </div>
                    <div class="occurrences">{{count}} phrases</div>
                </div>
                {{/semanticDomains}}
            </div>
        </div>

        <!-- Functional Insights -->
        <div class="analysis-subsection">
            <h4>Why These Keywords Here?</h4>
            <div class="insights-list">
                {{#insights}}
                <div class="insight-item" data-pattern="{{pattern}}">
                    <span class="icon">💡</span>
                    <p class="reason">{{reason}}</p>
                    <span class="evidence">Evidence: Phrases {{phraseIds}}</span>
                </div>
                {{/insights}}
            </div>
        </div>
    </div>
</div>
```

---

## CSS Styling (Track 1)

```css
/* Structural Analysis Panel */
.structural-analysis {
    background: white;
    border: 1px solid #ccc;
    margin: 20px 0;
}

.analysis-subsection {
    padding: 15px;
    border-top: 1px solid #eee;
}

.analysis-subsection h4 {
    margin-top: 0;
    color: #2C3E50;
    font-size: 16px;
}

/* Refrain List */
.refrain-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.refrain-item {
    display: flex;
    gap: 10px;
    padding: 8px 12px;
    background: #f0f8ff;
    border-radius: 4px;
    align-items: center;
}

.refrain-item[data-level="exact"] {
    border-left: 4px solid #FFD700;
    background: #FFFACD;
}

.refrain-item[data-level="structural"] {
    border-left: 4px solid #3498DB;
    background: #E8F4F8;
}

.badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
}

.refrain-badge {
    background: #FFD700;
    color: #4A3C00;
}

.structural-badge {
    background: #3498DB;
    color: white;
}

.refrain-item .text {
    font-style: italic;
    color: #2C3E50;
    flex: 1;
}

.refrain-item .occurrences {
    font-size: 12px;
    color: #7F8C8D;
}

/* Cluster Grid */
.cluster-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.cluster-card {
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
}

.cluster-card[data-domain="emotion"] { border-color: #E74C3C; }
.cluster-card[data-domain="abstract"] { border-color: #9B59B6; }
.cluster-card[data-domain="nature"] { border-color: #27AE60; }
.cluster-card[data-domain="action"] { border-color: #3498DB; }
.cluster-card[data-domain="characters"] { border-color: #F39C12; }
.cluster-card[data-domain="vocatives"] { border-color: #E67E22; }

.cluster-card .icon {
    font-size: 24px;
    margin-right: 8px;
}

.cluster-card .label {
    font-weight: bold;
    color: #2C3E50;
}

.cluster-card .keywords {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.keyword {
    padding: 3px 8px;
    background: #ECF0F1;
    border-radius: 3px;
    font-size: 12px;
}

.keyword .en {
    color: #7F8C8D;
    font-size: 11px;
}

/* Insights List */
.insights-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.insight-item {
    padding: 12px;
    background: #FFF9E6;
    border-left: 4px solid #F39C12;
    border-radius: 4px;
}

.insight-item .icon {
    font-size: 20px;
    margin-right: 8px;
}

.insight-item .reason {
    margin: 8px 0;
    color: #2C3E50;
    line-height: 1.5;
}

.insight-item .evidence {
    font-size: 12px;
    color: #7F8C8D;
}
```

---

## Generator Script (Track 1)

```javascript
// v4/generate-structural-analysis.js
const fs = require('fs');
const path = require('path');

class StructuralAnalysisGenerator {
    generate(songName) {
        // Load lyrics segmentation
        const lyricsPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${songName}.json`);
        const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

        // Run analysis algorithms
        const exactRefrains = this.detectExactRefrains(lyricsData.phrases);
        const structuralParallels = this.detectStructuralParallels(lyricsData.phrases);
        const semanticClusters = this.clusterSemantics(lyricsData.phrases);
        const insights = this.analyzeFunction(exactRefrains, structuralParallels, semanticClusters);

        return {
            exactRefrains,
            structuralParallels,
            semanticDomains: this.summarizeSemanticDomains(semanticClusters),
            insights
        };
    }

    detectExactRefrains(phrases) {
        const textGroups = {};

        phrases.forEach(p => {
            const normalized = p.text.trim().toLowerCase();
            if (!textGroups[normalized]) textGroups[normalized] = [];
            textGroups[normalized].push(p.id);
        });

        return Object.entries(textGroups)
            .filter(([text, ids]) => ids.length > 1)
            .map(([text, ids]) => ({
                text: text,
                phraseIds: ids.join(', '),
                count: ids.length
            }));
    }

    // ... (other methods from algorithms above)
}

module.exports = StructuralAnalysisGenerator;
```

---

# Track 2: Synchronized Phrase Annotations

## Purpose

Visual phrase-by-phrase annotations **aligned with tablature notes** showing:
- Parallelism level (exact, structural, semantic)
- Semantic clusters (icons/badges)
- Functional role (opening, refrain, question, etc.)

### What It Looks Like

```
┌─────────────────────────────────────────────────────────────┐
│ 🎼 Annotated Phrases in Tablature                          │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│ │ Phrase 1│  │ Phrase 2│  │ Phrase 3│                    │
│ │ OPENING │  │ QUESTION│  │ QUESTION│                    │
│ │ 🌳nature │  │ 🗣️action│  │ 🗣️action│                    │
│ └─────────┘  └─────────┘  └─────────┘                    │
│                                                             │
│ ┌────────────────┐         ┌────────────────┐            │
│ │ Phrase 6       │   ...   │ Phrase 6       │            │
│ │ REFRAIN (1/3) │         │ REFRAIN (2/3) │            │
│ │ 💭abstract     │         │ 💭abstract     │            │
│ │ 😢emotion      │         │ 😢emotion      │            │
│ └────────────────┘         └────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Command Compliance

### Required Synchronization Features

1. **X-Scroll Bidirectional Sync**
   - Scroll optimal → annotated scrolls
   - Scroll annotated → optimal scrolls

2. **X-Zoom Sync**
   - Same zoom formula as tablature: `scaledX = 120 + (baseX - 120) * zoomFactor`
   - Phrase boxes, labels, badges all scale proportionally

3. **X-Coordinate Alignment**
   - Phrase boxes start at first note X position
   - Phrase boxes end at last note X position
   - Perfect alignment with tablature notes

4. **SVG Width Matching**
   - Annotated SVG width = Optimal tablature SVG width
   - Both use same `svgWidth` variable

---

## X-Coordinate Calculation

```javascript
// In generate-phrase-annotations.js
function calculatePhrasePositions(phrases, relationships, allNotes) {
    return phrases.map(phrase => {
        // Get all mappings for this phrase
        const phraseMappings = relationships.filter(r => r.phraseId === phrase.id);

        if (phraseMappings.length === 0) {
            console.warn(`No note mappings for phrase ${phrase.id}`);
            return null;
        }

        // Get first note ID
        const firstNoteId = phraseMappings[0].noteIds[0];

        // Get last note ID from last mapping
        const lastMapping = phraseMappings[phraseMappings.length - 1];
        const lastNoteId = lastMapping.noteIds[lastMapping.noteIds.length - 1];

        // Lookup actual note objects
        const firstNote = allNotes.find(n => n.id === firstNoteId);
        const lastNote = allNotes.find(n => n.id === lastNoteId);

        if (!firstNote || !lastNote) {
            console.warn(`Notes not found for phrase ${phrase.id}`);
            return null;
        }

        return {
            phraseId: phrase.id,
            startX: parseFloat(firstNote.x),      // Aligns with tablature
            endX: parseFloat(lastNote.x),
            width: parseFloat(lastNote.x) - parseFloat(firstNote.x),
            centerX: (parseFloat(firstNote.x) + parseFloat(lastNote.x)) / 2
        };
    }).filter(p => p !== null);
}
```

---

## SVG Structure (Track 2)

```html
<!-- Synchronized phrase annotation section -->
<div class="tablature-section synchronized" id="annotatedPhrases" data-order="5">
    <div class="section-header">
        <h3>🎼 Annotated Phrases (Structural View)</h3>
    </div>

    <div class="section-content">
        <!-- Zoom Controls (synced with optimal) -->
        <div class="zoom-controls">
            <label>X-Zoom:</label>
            <button onclick="window.zoomController.updateZoom('annotated', 'x', 67)">67%</button>
            <button onclick="window.zoomController.updateZoom('annotated', 'x', 100)">100%</button>
            <button onclick="window.zoomController.updateZoom('annotated', 'x', 150)">150%</button>
            <button onclick="window.zoomController.updateZoom('annotated', 'x', 200)">200%</button>
        </div>

        <!-- Scrollable Container (synced with optimal) -->
        <div class="tablature-scroll-container" id="annotatedScrollContainer">
            <svg id="annotatedSvg" width="{{svgWidth}}" height="400">
                <!-- Phrase annotation boxes -->
                {{#phrases}}
                <g class="phrase-annotation" data-phrase-id="{{id}}">
                    <!-- Background box -->
                    <rect x="{{position.startX}}" y="50"
                          width="{{position.width}}" height="280"
                          class="phrase-box {{parallelismClass}} {{dominantDomainClass}}"
                          data-base-x="{{position.startX}}"
                          data-base-width="{{position.width}}"/>

                    <!-- Phrase number label -->
                    <text x="{{position.centerX}}" y="30"
                          class="phrase-label"
                          data-base-x="{{position.centerX}}">
                        Phrase {{id}}
                    </text>

                    <!-- Parallelism badge -->
                    {{#parallelismBadge}}
                    <text x="{{position.centerX}}" y="80"
                          class="parallelism-badge {{badgeClass}}"
                          data-base-x="{{position.centerX}}">
                        {{text}}
                    </text>
                    {{/parallelismBadge}}

                    <!-- Semantic cluster icons -->
                    <g class="semantic-icons"
                       transform="translate({{position.centerX}}, 120)"
                       data-base-x="{{position.centerX}}">
                        {{#semanticIcons}}
                        <text x="0" y="{{yOffset}}" class="semantic-icon {{iconClass}}">
                            {{icon}} {{label}}
                        </text>
                        {{/semanticIcons}}
                    </g>

                    <!-- Function label -->
                    {{#functionLabel}}
                    <text x="{{position.centerX}}" y="300"
                          class="function-label"
                          data-base-x="{{position.centerX}}">
                        {{text}}
                    </text>
                    {{/functionLabel}}

                    <!-- Hover tooltip -->
                    <title>{{hoverText}}</title>
                </g>
                {{/phrases}}
            </svg>
        </div>
    </div>
</div>
```

---

## Zoom Controller Extension (Track 2)

```javascript
// Add to v4/zoom-controller.js

class ZoomController {
    constructor() {
        this.sections = {
            optimal: { /* ... */ },
            alt1: { /* ... */ },
            annotated: {  // NEW SECTION
                svg: null,
                container: null,
                scrollContainer: null,
                currentZoom: { x: 100, y: 100 },
                elements: {
                    phraseBoxes: [],      // <rect class="phrase-box">
                    phraseLabels: [],     // <text class="phrase-label">
                    badges: [],           // <text class="parallelism-badge">
                    iconGroups: [],       // <g class="semantic-icons">
                    functionLabels: []    // <text class="function-label">
                }
            }
        };
    }

    initialize() {
        // ... existing code ...

        // Initialize annotated section
        this.sections.annotated.svg = document.getElementById('annotatedSvg');
        this.sections.annotated.container = document.getElementById('annotatedPhrases');
        this.sections.annotated.scrollContainer = document.getElementById('annotatedScrollContainer');

        if (this.sections.annotated.svg) {
            this.cacheAnnotatedElements();
            this.setupAnnotatedScrollSync();
        }
    }

    cacheAnnotatedElements() {
        const svg = this.sections.annotated.svg;

        this.sections.annotated.elements.phraseBoxes =
            Array.from(svg.querySelectorAll('.phrase-box'));

        this.sections.annotated.elements.phraseLabels =
            Array.from(svg.querySelectorAll('.phrase-label'));

        this.sections.annotated.elements.badges =
            Array.from(svg.querySelectorAll('.parallelism-badge'));

        this.sections.annotated.elements.iconGroups =
            Array.from(svg.querySelectorAll('.semantic-icons'));

        this.sections.annotated.elements.functionLabels =
            Array.from(svg.querySelectorAll('.function-label'));

        console.log(`Cached ${this.sections.annotated.elements.phraseBoxes.length} phrase boxes`);
    }

    setupAnnotatedScrollSync() {
        const optimalContainer = this.sections.optimal.scrollContainer;
        const annotatedContainer = this.sections.annotated.scrollContainer;

        if (!optimalContainer || !annotatedContainer) return;

        // Optimal → Annotated sync
        optimalContainer.addEventListener('scroll', () => {
            annotatedContainer.scrollLeft = optimalContainer.scrollLeft;
        });

        // Annotated → Optimal sync
        annotatedContainer.addEventListener('scroll', () => {
            optimalContainer.scrollLeft = annotatedContainer.scrollLeft;
        });

        console.log('Annotated phrase scroll sync enabled');
    }

    updateZoom(sectionId, axis, zoomPercent) {
        // ... existing code ...

        if (sectionId === 'annotated') {
            this.zoomAnnotatedSection(axis, zoomPercent);
        }
    }

    zoomAnnotatedSection(axis, zoomPercent) {
        const section = this.sections.annotated;
        const zoomFactor = zoomPercent / 100;

        if (axis === 'x') {
            section.currentZoom.x = zoomPercent;

            // Scale phrase boxes
            section.elements.phraseBoxes.forEach(box => {
                const baseX = parseFloat(box.dataset.baseX);
                const baseWidth = parseFloat(box.dataset.baseWidth);

                const scaledX = 120 + (baseX - 120) * zoomFactor;
                const scaledWidth = baseWidth * zoomFactor;

                box.setAttribute('x', scaledX);
                box.setAttribute('width', scaledWidth);
            });

            // Scale text positions (labels, badges, function labels)
            const textElements = [
                ...section.elements.phraseLabels,
                ...section.elements.badges,
                ...section.elements.functionLabels
            ];

            textElements.forEach(text => {
                const baseX = parseFloat(text.dataset.baseX);
                const scaledX = 120 + (baseX - 120) * zoomFactor;
                text.setAttribute('x', scaledX);
            });

            // Scale icon groups (transform attribute)
            section.elements.iconGroups.forEach(group => {
                const baseX = parseFloat(group.dataset.baseX);
                const scaledX = 120 + (baseX - 120) * zoomFactor;

                const transform = group.getAttribute('transform');
                const yMatch = transform.match(/translate\([^,]+,\s*(\d+)\)/);
                const y = yMatch ? yMatch[1] : 120;

                group.setAttribute('transform', `translate(${scaledX}, ${y})`);
            });

            console.log(`Annotated section X-zoomed to ${zoomPercent}%`);
        }
    }

    refresh() {
        // Re-cache elements after dynamic content changes
        this.cacheAnnotatedElements();
    }
}
```

---

## CSS Styling (Track 2)

```css
/* Synchronized Phrase Annotations Section */
#annotatedPhrases {
    margin-top: 30px;
}

#annotatedScrollContainer {
    overflow-x: auto;
    overflow-y: hidden;
    border: 1px solid #ccc;
    background: white;
}

#annotatedSvg {
    display: block;
}

/* Phrase Boxes */
.phrase-box {
    fill: rgba(0, 128, 128, 0.08);
    stroke: #008080;
    stroke-width: 2;
    stroke-dasharray: 5,5;
    transition: fill 0.2s, stroke 0.2s;
}

.phrase-box:hover {
    fill: rgba(0, 128, 128, 0.15);
    stroke: #005959;
    stroke-width: 3;
}

/* Parallelism-based styling */
.phrase-box.exact-refrain {
    fill: rgba(255, 215, 0, 0.15);
    stroke: #FFD700;
    stroke-dasharray: none;
    stroke-width: 3;
}

.phrase-box.structural-parallel {
    fill: rgba(52, 152, 219, 0.1);
    stroke: #3498DB;
    stroke-width: 2;
}

.phrase-box.semantic-parallel {
    fill: rgba(155, 89, 182, 0.08);
    stroke: #9B59B6;
    stroke-dasharray: 3,3;
}

/* Semantic domain styling */
.phrase-box.domain-emotion {
    stroke: #E74C3C;
}

.phrase-box.domain-abstract {
    stroke: #9B59B6;
}

.phrase-box.domain-nature {
    stroke: #27AE60;
}

.phrase-box.domain-action {
    stroke: #3498DB;
}

.phrase-box.domain-characters {
    stroke: #F39C12;
}

.phrase-box.domain-vocatives {
    stroke: #E67E22;
}

/* Text Elements */
.phrase-label {
    font-size: 14px;
    font-weight: bold;
    fill: #2C3E50;
    text-anchor: middle;
}

.parallelism-badge {
    font-size: 11px;
    font-weight: bold;
    text-anchor: middle;
    fill: #008080;
}

.parallelism-badge.exact {
    fill: #FFD700;
}

.parallelism-badge.structural {
    fill: #3498DB;
}

.parallelism-badge.semantic {
    fill: #9B59B6;
}

.semantic-icon {
    font-size: 11px;
    text-anchor: middle;
    fill: #555;
}

.semantic-icon.emotion { fill: #E74C3C; }
.semantic-icon.abstract { fill: #9B59B6; }
.semantic-icon.nature { fill: #27AE60; }
.semantic-icon.action { fill: #3498DB; }
.semantic-icon.characters { fill: #F39C12; }
.semantic-icon.vocatives { fill: #E67E22; }

.function-label {
    font-size: 10px;
    font-style: italic;
    fill: #7F8C8D;
    text-anchor: middle;
}
```

---

## Generator Script (Track 2)

```javascript
// v4/generate-phrase-annotations.js
const fs = require('fs');
const path = require('path');

class PhraseAnnotationsGenerator {
    generate(songName) {
        // Load data sources
        const lyricsPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${songName}.json`);
        const relationshipsPath = path.join(__dirname, 'data', 'relationships', `${songName}-relationships.json`);
        const notesPath = path.join(__dirname, 'data', 'processed', songName, 'notes.json');

        const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));
        const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));
        const allNotes = JSON.parse(fs.readFileSync(notesPath, 'utf8'));

        // Calculate phrase positions
        const phrasePositions = this.calculatePhrasePositions(
            lyricsData.phrases,
            relationships,
            allNotes
        );

        // Analyze structure
        const analysis = this.analyzeStructure(lyricsData.phrases);

        // Build phrase objects for rendering
        const annotatedPhrases = lyricsData.phrases.map((phrase, idx) => {
            const position = phrasePositions[idx];
            const parallelism = this.getParallelismLevel(phrase, analysis);
            const semantics = this.getSemanticClusters(phrase);

            return {
                id: phrase.id,
                position: position,
                parallelismClass: parallelism.class,
                parallelismBadge: parallelism.badge,
                dominantDomainClass: `domain-${semantics.dominantDomain}`,
                semanticIcons: semantics.icons,
                functionLabel: this.getFunctionLabel(phrase, idx, lyricsData.phrases.length),
                hoverText: this.generateHoverText(phrase, parallelism, semantics)
            };
        });

        return {
            phrases: annotatedPhrases,
            svgWidth: Math.max(...phrasePositions.map(p => p.endX)) + 200
        };
    }

    calculatePhrasePositions(phrases, relationships, allNotes) {
        // (Implementation from above)
    }

    analyzeStructure(phrases) {
        // Run structural analysis algorithms
        const exactRefrains = this.detectExactRefrains(phrases);
        const structuralParallels = this.detectStructuralParallels(phrases);
        const semanticParallels = this.detectSemanticParallels(phrases);

        return {
            exactRefrains,
            structuralParallels,
            semanticParallels
        };
    }

    getParallelismLevel(phrase, analysis) {
        // Check if phrase is exact refrain
        const exactRefrain = analysis.exactRefrains.find(r =>
            r.phraseIds.includes(phrase.id)
        );

        if (exactRefrain) {
            return {
                class: 'exact-refrain',
                badge: {
                    text: `REFRAIN (${exactRefrain.count}x)`,
                    badgeClass: 'exact'
                }
            };
        }

        // Check if structural parallel
        const pattern = this.extractPattern(phrase.wordMapping);
        const structuralMatch = analysis.structuralParallels.find(p =>
            p.pattern === pattern && p.count > 1
        );

        if (structuralMatch) {
            return {
                class: 'structural-parallel',
                badge: {
                    text: 'STRUCTURAL',
                    badgeClass: 'structural'
                }
            };
        }

        return {
            class: '',
            badge: null
        };
    }

    getSemanticClusters(phrase) {
        const domains = {
            characters: ['bà', 'chồng', 'cô', 'tôi', 'em', 'chàng', 'con', 'mẹ', 'ông'],
            emotions: ['khổ', 'thương', 'tang', 'tình', 'nhớ'],
            actions: ['đi', 'làm', 'gánh', 'tưới', 'ru', 'ngủ', 'thấy', 'nối'],
            nature: ['chiều', 'gió', 'cây', 'nước', 'đồng', 'tây lầu', 'mùa thu'],
            abstract: ['duyên', 'đời', 'lòng'],
            vocatives: ['ơi', 'hỡi', 'ới', 'ư', 'này']
        };

        const iconMap = {
            characters: '👤',
            emotions: '😢',
            actions: '🗣️',
            nature: '🌳',
            abstract: '💭',
            vocatives: '📣'
        };

        const labelMap = {
            characters: 'characters',
            emotions: 'emotion',
            actions: 'action',
            nature: 'nature',
            abstract: 'abstract',
            vocatives: 'vocative'
        };

        const clusters = {};

        phrase.wordMapping.forEach(word => {
            Object.entries(domains).forEach(([domain, keywords]) => {
                if (keywords.includes(word.vn.toLowerCase())) {
                    if (!clusters[domain]) clusters[domain] = [];
                    clusters[domain].push(word.vn);
                }
            });
        });

        const icons = Object.entries(clusters).map(([domain, words], idx) => ({
            icon: iconMap[domain],
            label: labelMap[domain],
            iconClass: domain,
            yOffset: idx * 20
        }));

        const dominantDomain = Object.entries(clusters)
            .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'other';

        return {
            icons: icons,
            dominantDomain: dominantDomain
        };
    }

    getFunctionLabel(phrase, index, totalPhrases) {
        if (index === 0) return { text: 'OPENING' };
        if (index === totalPhrases - 1) return { text: 'CLOSING' };
        if (phrase.linguisticType === 'question') return { text: 'QUESTION' };
        if (phrase.linguisticType === 'answer') return { text: 'ANSWER' };
        if (phrase.type?.includes('refrain')) return { text: 'ANCHOR' };
        return null;
    }

    generateHoverText(phrase, parallelism, semantics) {
        let text = `Phrase ${phrase.id}: "${phrase.text}"\n`;

        if (parallelism.badge) {
            text += `Parallelism: ${parallelism.badge.text}\n`;
        }

        if (semantics.icons.length > 0) {
            const domains = semantics.icons.map(i => i.label).join(', ');
            text += `Semantic domains: ${domains}\n`;
        }

        return text;
    }
}

module.exports = PhraseAnnotationsGenerator;
```

---

## Integration into Server

```javascript
// In vertical-demo-server.js

const PhraseAnnotationsGenerator = require('./generate-phrase-annotations.js');

app.get('/song/:songName', async (req, res) => {
    const songName = req.params.songName;

    // ... existing code ...

    // Generate phrase annotations
    const annotationsGenerator = new PhraseAnnotationsGenerator();
    const annotatedPhrasesData = annotationsGenerator.generate(songName);

    // Pass to template
    const html = template
        .replace('{{ANNOTATED_PHRASES}}', renderAnnotatedPhrases(annotatedPhrasesData))
        .replace('{{SVG_WIDTH}}', annotatedPhrasesData.svgWidth);

    res.send(html);
});

function renderAnnotatedPhrases(data) {
    // Render SVG using data.phrases
    // (Template rendering logic)
}
```

---

## Testing Checklist

### Track 1 (Independent Panel)
- [ ] Exact refrains detected correctly
- [ ] Structural parallels grouped by pattern
- [ ] Semantic clusters show correct keywords
- [ ] Insights generated with proper reasoning
- [ ] Panel collapses/expands properly
- [ ] Move controls work

### Track 2 (Synchronized Annotations)
- [ ] Phrase boxes align with first/last notes
- [ ] X-scroll syncs bidirectionally with optimal
- [ ] X-zoom scales all elements correctly
- [ ] SVG width matches optimal tablature
- [ ] Parallelism badges show correct labels
- [ ] Semantic icons display properly
- [ ] Hover tooltips show phrase info
- [ ] Base positions stored in data attributes
- [ ] Zoom maintains alignment after multiple changes

---

## Success Criteria

### Track 1
✅ Learner can see song-wide structural patterns at a glance
✅ Understanding of why certain keywords appear in certain sections
✅ Recognition of parallelism hierarchy (exact → structural → semantic)

### Track 2
✅ Learner can see phrase boundaries aligned with tablature notes
✅ Visual identification of repeated sections (refrains)
✅ Semantic domain patterns visible across song structure
✅ Perfect synchronization with tablature zoom and scroll
✅ Click phrase box → highlight related notes (future enhancement)

---

## Implementation Timeline

### Phase 1: Track 2 Primary Implementation (4-5 hours)
1. Create `generate-phrase-annotations.js` (1 hour)
2. Calculate phrase X positions from relationships (30 min)
3. Generate annotated SVG template (1 hour)
4. Extend `zoom-controller.js` for annotated section (1 hour)
5. Implement scroll sync (30 min)
6. Test and debug synchronization (1 hour)

### Phase 2: Track 1 Fallback (if Track 2 blocked) (2-3 hours)
1. Create `generate-structural-analysis.js` (1 hour)
2. Implement analysis algorithms (1 hour)
3. Create HTML template and CSS (30 min)
4. Test and refine insights (30 min)

---

## File Structure

```
v4/
├── STRUCTURAL-ANALYSIS-IMPLEMENTATION-PLAN.md  # This document
├── generate-phrase-annotations.js              # Track 2 generator
├── generate-structural-analysis.js             # Track 1 generator (fallback)
├── zoom-controller.js                          # Extended for annotated section
├── templates/
│   ├── components/
│   │   ├── annotated-phrases-section.html     # Track 2 template
│   │   └── structural-analysis-panel.html     # Track 1 template
├── data/
│   ├── lyrics-segmentations/                  # Input: Phrase data
│   ├── relationships/                         # Input: Note-lyric mappings
│   └── processed/                             # Input: Note positions
```

---

## Next Steps

1. **Implement Track 2** (Synchronized Phrase Annotations)
2. **If blocked:** Fall back to Track 1 (Independent Panel)
3. **Test with multiple songs** (Bà rằng bà rí, Lý chiều chiều, Ru con)
4. **Iterate based on visual clarity** and synchronization accuracy

---

**End of Implementation Plan**
