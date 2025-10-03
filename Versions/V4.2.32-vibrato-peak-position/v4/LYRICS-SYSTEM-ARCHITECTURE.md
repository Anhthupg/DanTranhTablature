# Lyrics System Architecture - V4

## Overview
Interactive bilingual lyrics section with syllable-to-note correlation, phrase-based playback, and Vietnamese linguistic analysis.

## Data Structure

### 1. Syllable Object
```javascript
{
    text: "Hà",                    // Vietnamese text
    english: "Hello",               // English translation
    noteIndices: [0],              // Array of note indices this syllable maps to
    noteDurations: [2.0],          // Duration of each note (in quarter notes)
    isMelisma: false,              // Is this syllable sung over multiple notes?
    phraseId: 0,                   // Which phrase does this belong to?
    syllableIndex: 0,              // Position within phrase
    isPadding: false,              // Is this a padding particle?
    paddingType: null,             // "vocative", "melodic", "rhythmic", null
    linguisticTone: "huyen"        // Vietnamese tone marker
}
```

### 2. Phrase Object
```javascript
{
    id: 0,
    syllables: [syllable1, syllable2, ...],
    startNoteIndex: 0,             // First note of phrase
    endNoteIndex: 5,               // Last note of phrase
    vietnameseText: "Hà ơi í",     // Combined Vietnamese
    englishText: "Hello my dear",  // Combined English
    type: "semantic",              // "semantic", "melodic_bridge", "ornamental"
    pattern: "luc_bat",            // "luc_bat", "song_that_luc_bat", "narrative", etc.
    syllableCount: 6,
    hasBreak: false,               // User-added line break after this phrase?
    breakPosition: null            // Syllable index where break occurs
}
```

### 3. Complete Lyrics Object
```javascript
{
    songTitle: "Lượn Cọi",
    phrases: [phrase1, phrase2, ...],
    syllableToNoteMap: {           // Quick lookup
        0: [noteIndex1, noteIndex2],  // Syllable 0 maps to notes 1, 2
        1: [noteIndex3]               // Syllable 1 maps to note 3
    },
    noteToSyllableMap: {           // Reverse lookup
        0: 0,                      // Note 0 belongs to syllable 0
        1: 0,                      // Note 1 also belongs to syllable 0 (melisma)
        2: 1                       // Note 2 belongs to syllable 1
    },
    totalSyllables: 45,
    totalPhrases: 8,
    totalNotes: 57
}
```

## Module Organization

```
v4/
├── parsers/
│   └── lyrics-parser.js           # Extract lyrics from MusicXML
├── processors/
│   └── phrase-segmenter.js        # Vietnamese phrase segmentation
├── generators/
│   └── lyrics-generator.js        # Generate lyrics HTML
├── controllers/
│   └── lyrics-controller.js       # Interactive lyrics behavior
└── data/
    └── lyrics/                    # Generated lyrics JSON files
        ├── Lượn cọi-lyrics.json
        └── ...
```

## Vietnamese Phrase Segmentation Algorithm

### Phase 1: Syllable Classification
```javascript
function classifySyllable(text) {
    const vocativeParticles = ["ơi", "ời", "ới", "í", "i", "ì", "ĩ", "à", "ạ"];
    const melodicBridges = ["tình là", "tình la", "ơi la", "ơi lơi", "leng keng"];
    const rhythmicFillers = ["lá lá", "a ha", "i í"];

    if (melodicBridges.some(bridge => text.includes(bridge))) {
        return { type: "melodic_bridge", createSeparatePhrase: true };
    }
    if (vocativeParticles.includes(text.toLowerCase())) {
        return { type: "vocative", attachToPrevious: true };
    }
    if (rhythmicFillers.some(filler => text.includes(filler))) {
        return { type: "rhythmic", createSeparatePhrase: true };
    }
    return { type: "semantic", standalone: true };
}
```

### Phase 2: Pattern Detection
```javascript
function detectPattern(syllables) {
    const counts = syllables.filter(s => s.type === "semantic").length;

    // Lục bát (6-8 pattern)
    if (counts === 6 || counts === 8) {
        return { pattern: "luc_bat", breakAfter: counts };
    }

    // Song thất lục bát (7-7-6-8)
    if ([7, 6, 8].includes(counts)) {
        return { pattern: "song_that_luc_bat", breakAfter: counts };
    }

    // Tám tự (8-syllable)
    if (counts === 8) {
        return { pattern: "tam_tu", breakAfter: 8 };
    }

    // Narrative (use punctuation and breathing points)
    return { pattern: "narrative", useBreathingPoints: true };
}
```

### Phase 3: Boundary Detection
```javascript
function detectPhraseBoundaries(syllables, notes) {
    const boundaries = [];

    // Rule 1: Melodic indicators (long notes, melismatic passages)
    notes.forEach((note, i) => {
        if (note.duration >= 2.0 && !note.isGrace) {
            boundaries.push({ position: i, confidence: 0.8, reason: "long_note" });
        }
    });

    // Rule 2: Syntactic boundaries (particles)
    syllables.forEach((syl, i) => {
        const classification = classifySyllable(syl.text);
        if (classification.type === "vocative" || classification.type === "melodic_bridge") {
            boundaries.push({ position: i, confidence: 0.9, reason: "particle" });
        }
    });

    // Rule 3: Pattern-based (lục bát, song thất, etc.)
    const pattern = detectPattern(syllables);
    if (pattern.breakAfter) {
        boundaries.push({ position: pattern.breakAfter, confidence: 1.0, reason: "pattern" });
    }

    // Rule 4: Punctuation
    syllables.forEach((syl, i) => {
        if (syl.text.match(/[,。!?]/)) {
            boundaries.push({ position: i, confidence: 0.7, reason: "punctuation" });
        }
    });

    // Merge boundaries with confidence threshold
    return mergeBounda ries(boundaries, threshold = 0.7);
}
```

### Phase 4: Phrase Creation
```javascript
function createPhrases(syllables, notes, boundaries) {
    const phrases = [];
    let currentPhrase = [];
    let phraseStartNote = 0;

    syllables.forEach((syl, i) => {
        currentPhrase.push(syl);

        // Check if this is a boundary
        if (boundaries.includes(i)) {
            const phraseEndNote = syl.noteIndices[syl.noteIndices.length - 1];

            phrases.push({
                id: phrases.length,
                syllables: currentPhrase,
                startNoteIndex: phraseStartNote,
                endNoteIndex: phraseEndNote,
                vietnameseText: currentPhrase.map(s => s.text).join(' '),
                syllableCount: currentPhrase.filter(s => !s.isPadding).length,
                type: detectPhraseType(currentPhrase)
            });

            currentPhrase = [];
            phraseStartNote = phraseEndNote + 1;
        }
    });

    // Add final phrase if any syllables remain
    if (currentPhrase.length > 0) {
        phrases.push({
            id: phrases.length,
            syllables: currentPhrase,
            startNoteIndex: phraseStartNote,
            endNoteIndex: notes.length - 1,
            vietnameseText: currentPhrase.map(s => s.text).join(' '),
            syllableCount: currentPhrase.filter(s => !s.isPadding).length,
            type: "semantic"
        });
    }

    return phrases;
}
```

## Syllable-to-Note Correlation

### Correlation Algorithm
```javascript
function correlateSyllablesToNotes(lyrics, notes) {
    const correlations = [];
    let noteIndex = 0;

    lyrics.forEach((syllable, sylIndex) => {
        const syllableNotes = [];
        const syllableDurations = [];

        // Check if this is a melisma (one syllable, multiple notes)
        while (noteIndex < notes.length && notes[noteIndex].lyric === syllable.text) {
            syllableNotes.push(noteIndex);
            syllableDurations.push(notes[noteIndex].duration);
            noteIndex++;
        }

        // If no notes matched, this might be padding or tie continuation
        if (syllableNotes.length === 0 && noteIndex < notes.length) {
            syllableNotes.push(noteIndex);
            syllableDurations.push(notes[noteIndex].duration);
            noteIndex++;
        }

        correlations.push({
            ...syllable,
            noteIndices: syllableNotes,
            noteDurations: syllableDurations,
            isMelisma: syllableNotes.length > 1
        });
    });

    return correlations;
}
```

## Google Translate Integration

### Translation Service
```javascript
class TranslationService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
        this.cache = new Map(); // Cache translations
    }

    async translatePhrase(vietnameseText) {
        // Check cache first
        if (this.cache.has(vietnameseText)) {
            return this.cache.get(vietnameseText);
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: vietnameseText,
                    source: 'vi',
                    target: 'en',
                    format: 'text',
                    key: this.apiKey
                })
            });

            const data = await response.json();
            const translation = data.data.translations[0].translatedText;

            // Cache result
            this.cache.set(vietnameseText, translation);

            return translation;
        } catch (error) {
            console.error('Translation error:', error);
            return `[Translation unavailable: ${vietnameseText}]`;
        }
    }

    async translatePhrases(phrases) {
        const translations = await Promise.all(
            phrases.map(phrase => this.translatePhrase(phrase.vietnameseText))
        );

        return phrases.map((phrase, i) => ({
            ...phrase,
            englishText: translations[i]
        }));
    }
}
```

## Duration Line Visualization

### Duration Line Algorithm
```javascript
function generateDurationLines(syllable) {
    const lines = [];

    syllable.noteDurations.forEach((duration, i) => {
        const lineWidth = duration * 20; // 20px per quarter note
        lines.push({
            width: lineWidth,
            height: 2,
            color: i === 0 ? '#008080' : '#3498DB', // First note teal, others blue
            position: 'below_syllable'
        });
    });

    return lines;
}
```

Example output:
```
Hà     (1 note, duration 2.0)
______________________________________

tình   (1 note, duration 0.5)
__________

là     (melisma: 3 notes, durations 0.5, 1.0, 0.5)
__________
____________________
__________
```

## Interactive Highlighting System

### Highlight Coordination
```javascript
class HighlightCoordinator {
    constructor() {
        this.selectedSyllables = new Set();
        this.colorPalette = [
            '#3498DB',  // Blue
            '#27AE60',  // Green
            '#F39C12',  // Orange
            '#9B59B6',  // Purple
            '#E74C3C'   // Red (reserved, not used per requirements)
        ];
        this.currentColorIndex = 0;
    }

    highlightSyllable(syllableIndex, isMultiSelect = false) {
        if (!isMultiSelect) {
            this.clearAllHighlights();
        }

        const color = this.colorPalette[this.currentColorIndex % this.colorPalette.length];

        // Highlight Vietnamese syllable
        this.highlightVietnamese(syllableIndex, color);

        // Highlight English translation
        this.highlightEnglish(syllableIndex, color);

        // Highlight corresponding notes in tablature
        this.highlightTablatureNotes(syllableIndex, color);

        this.selectedSyllables.add(syllableIndex);

        if (isMultiSelect) {
            this.currentColorIndex++;
        }
    }

    highlightVietnamese(syllableIndex, color) {
        // Find all syllables with same spelling (case-insensitive)
        const targetText = this.getSyllableText(syllableIndex).toLowerCase();
        document.querySelectorAll('.lyric-syllable').forEach(el => {
            if (el.textContent.toLowerCase() === targetText) {
                el.style.backgroundColor = color;
                el.style.color = '#FFFFFF';
            }
        });
    }

    highlightEnglish(syllableIndex, color) {
        const englishElement = document.querySelector(`[data-syllable-id="${syllableIndex}"].english-translation`);
        if (englishElement) {
            englishElement.style.backgroundColor = color;
            englishElement.style.color = '#FFFFFF';
        }
    }

    highlightTablatureNotes(syllableIndex, color) {
        const noteIndices = this.getSyllableNoteIndices(syllableIndex);
        noteIndices.forEach(noteIdx => {
            const noteElement = document.querySelector(`[data-note-index="${noteIdx}"]`);
            if (noteElement) {
                noteElement.style.fill = color;
                noteElement.style.filter = `drop-shadow(0 0 10px ${color})`;
            }
        });
    }

    clearAllHighlights() {
        // Clear Vietnamese
        document.querySelectorAll('.lyric-syllable').forEach(el => {
            el.style.backgroundColor = '';
            el.style.color = '';
        });

        // Clear English
        document.querySelectorAll('.english-translation').forEach(el => {
            el.style.backgroundColor = '';
            el.style.color = '';
        });

        // Clear tablature notes
        document.querySelectorAll('[data-note-index]').forEach(el => {
            el.style.fill = '';
            el.style.filter = '';
        });

        this.selectedSyllables.clear();
        this.currentColorIndex = 0;
    }
}
```

## Playback System Integration

### Phrase Playback Controller
```javascript
class PhrasePlaybackController {
    constructor(audioController) {
        this.audioController = audioController;  // Existing V4 audio controller
        this.isLooping = false;
        this.currentPhrase = null;
    }

    async playPhrase(phraseId) {
        const phrase = this.getPhraseData(phraseId);
        this.currentPhrase = phraseId;

        // Get note range for this phrase
        const startNote = phrase.startNoteIndex;
        const endNote = phrase.endNoteIndex;

        // Use existing audio controller to play note range
        await this.audioController.playNoteRange(startNote, endNote);

        if (this.isLooping && this.currentPhrase === phraseId) {
            // Recursively play again
            await this.playPhrase(phraseId);
        }
    }

    toggleLoop(phraseId) {
        this.isLooping = !this.isLooping;
        if (this.isLooping) {
            this.playPhrase(phraseId);
        }
    }

    stopPhrase() {
        this.isLooping = false;
        this.currentPhrase = null;
        this.audioController.stop();
    }
}
```

## Template Structure

### 3-Column Table Layout
```html
<div class="lyrics-section">
    <div class="lyrics-controls">
        <select class="font-selector">
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Roboto">Roboto</option>
        </select>
        <input type="range" class="font-size-slider" min="12" max="24" value="16">
        <span class="font-size-display">16px</span>
    </div>

    <table class="lyrics-table">
        <thead>
            <tr>
                <th style="width: 80px;">Controls</th>
                <th style="width: auto;">Tiếng Việt (Vietnamese)</th>
                <th style="width: auto;">English Translation</th>
            </tr>
        </thead>
        <tbody>
            <!-- Each phrase becomes a row -->
            <tr class="phrase-row" data-phrase-id="0">
                <td class="controls-column">
                    <button class="play-phrase" title="Play">[▶]</button>
                    <button class="loop-phrase" title="Loop">[↻]</button>
                    <button class="stop-phrase" title="Stop">[■]</button>
                    <button class="info-phrase" title="Info">[i]</button>
                    <button class="translate-phrase" title="Google Translate">[G]</button>
                    <button class="audio-phrase" title="Vietnamese Audio">[🔊]</button>
                </td>
                <td class="vietnamese-column">
                    <div class="phrase-text">
                        <span class="syllable" data-syllable-id="0" data-note-count="1">Hà</span>
                        <div class="duration-lines">
                            <div class="duration-line" style="width: 40px;"></div>
                        </div>
                        <span class="syllable" data-syllable-id="1" data-note-count="2">tình</span>
                        <div class="duration-lines">
                            <div class="duration-line" style="width: 10px;"></div>
                            <div class="duration-line" style="width: 20px;"></div>
                        </div>
                        <span class="break-pipe" contenteditable="true">|</span>
                    </div>
                </td>
                <td class="english-column">
                    <div class="phrase-translation">
                        <span class="translation-word" data-syllable-id="0">Hello</span>
                        <span class="translation-word" data-syllable-id="1">my dear</span>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

## Performance Considerations

### 1. Lazy Loading
- Load only phrases visible in viewport
- Preload next 3 phrases

### 2. Caching
- Cache translations (localStorage)
- Cache phrase segmentation results
- Cache syllable-to-note mappings

### 3. Debouncing
- Debounce highlight events (50ms)
- Debounce font size changes (100ms)
- Debounce break pipe editing (500ms)

### 4. Event Delegation
- Single event listener on table for all syllable clicks
- Single listener for all control buttons

## Next Steps

1. Implement `lyrics-parser.js` to extract from MusicXML
2. Implement `phrase-segmenter.js` with Vietnamese rules
3. Create `lyrics-controller.js` for interactive features
4. Build HTML template with proper styling
5. Integrate Google Translate API
6. Connect to existing audio playback system

---

**Status**: Architecture complete - Ready for implementation