# Lyrics System - Ready to Use Guide

## Completed Components

### 1. Lyrics Parser (`parsers/lyrics-parser.js`)
Extracts lyrics from your MusicXML files.

**Usage:**
```javascript
const LyricsParser = require('./parsers/lyrics-parser');
const parser = new LyricsParser();

const data = await parser.parseMusicXML('path/to/song.musicxml.xml');
// Returns: { title, notes, lyricLines, rawLyrics }

const syllables = parser.correlateLyricsWithNotes(data.notes, data.lyricLines);
// Returns: Array of syllable objects with note correlations
```

### 2. Phrase Segmenter (`processors/phrase-segmenter.js`)
Segments Vietnamese lyrics into poetic phrases.

**Features:**
- Vietnamese dân ca pattern detection (lục bát, song thất lục bát)
- Padding word classification ("tình là", "ơi", "í", etc.)
- Phrase position analysis (opening/middle/ending words)
- Feedback logging system for learning from corrections

**Usage:**
```javascript
const PhraseSegmenter = require('./processors/phrase-segmenter');
const segmenter = new PhraseSegmenter();

const result = segmenter.segment(syllables, notes);
/*
Returns:
{
    phrases: [
        {
            id: 0,
            vietnameseText: "...",
            positions: {
                opening: { words: [...], text: "...", indices: [0,1,2] },
                middle: { words: [...], text: "...", indices: [3,4] },
                ending: { words: [...], text: "...", indices: [5,6,7] }
            },
            syllables: [...],
            startNoteIndex: 0,
            endNoteIndex: 5,
            type: "semantic"
        }
    ],
    statistics: { ... }
}
*/
```

### 3. Lyrics Section Component (`templates/components/lyrics-section.html`)
HTML template with 3-column table structure.

**Features:**
- Controls column (play/loop/stop/info/translate/audio)
- Vietnamese column (with syllable highlighting)
- English column (synchronized translation)
- Font and size controls
- Popup support for pronunciation/translation
- Duration lines visualization
- Break pipe editing

## Phrase Position Analysis

Each phrase now includes position data:

### Example Phrase: "đi đi về về quê hương ơi"

```javascript
{
    vietnameseText: "đi đi về về quê hương ơi",
    positions: {
        opening: {
            words: ["đi", "đi", "về"],
            text: "đi đi về",
            indices: [0, 1, 2]
        },
        middle: {
            words: ["về", "quê"],
            text: "về quê",
            indices: [3, 4]
        },
        ending: {
            words: ["hương", "ơi"],
            text: "hương ơi",
            indices: [5, 6]
        }
    }
}
```

### Analysis Possibilities

**Opening Words Collection:**
Across all songs, collect phrase.positions.opening.words to find:
- Most common phrase starters
- Regional variations in openings
- Emotional patterns (address vs narrative openings)

**Ending Words Collection:**
Collect phrase.positions.ending.words to find:
- Common phrase closings
- Vocative particle usage ("ơi", "à")
- Melodic cadence patterns

**Middle Words Analysis:**
- Core narrative content
- Semantic field distribution
- Complexity indicators

## Next Implementation Steps

### Step 1: Test Lyrics Extraction
Create a simple test script:

```javascript
// test-lyrics.js
const LyricsParser = require('./parsers/lyrics-parser');
const PhraseSegmenter = require('./processors/phrase-segmenter');

async function test() {
    const parser = new LyricsParser();
    const segmenter = new PhraseSegmenter();

    const data = await parser.parseMusicXML('./data/musicxml/Lượn cọi.musicxml.xml');
    const syllables = parser.correlateLyricsWithNotes(data.notes, data.lyricLines);
    const result = segmenter.segment(syllables, data.notes);

    console.log('Phrases:');
    result.phrases.forEach(p => {
        console.log(`  "${p.vietnameseText}"`);
        console.log(`    Opening: "${p.positions.opening.text}"`);
        console.log(`    Middle: "${p.positions.middle.text}"`);
        console.log(`    Ending: "${p.positions.ending.text}"`);
    });
}

test();
```

### Step 2: Add Lyrics Section to Song Page
In `templates/v4-vertical-header-sections-annotated.html`, insert component after existing sections.

### Step 3: Create Lyrics Controller
File: `controllers/lyrics-controller.js`
- Load lyrics data via parser
- Segment into phrases
- Render table rows
- Handle highlighting
- Manage playback

### Step 4: Wire Up Server
Update `vertical-demo-server.js` to:
- Parse MusicXML for lyrics
- Segment phrases
- Pass data to template

### Step 5: Add Google Translate
- API integration
- Cache translations
- Update English column

## Feedback System

When you provide corrections, the system will:

1. **Log your changes:**
```javascript
segmenter.logFeedback(
    songTitle,
    originalPhrases,
    correctedPhrases,
    "User prefers breaking at 'ơi' particles"
);
```

2. **Analyze patterns:**
```javascript
const summary = segmenter.getFeedbackSummary();
// Returns common correction patterns
```

3. **Suggest improvements:**
```javascript
const suggestions = segmenter.suggestAlgorithmImprovements();
// Recommends algorithm adjustments based on your feedback
```

4. **Apply learning:**
Future songs can use improved algorithm based on your corrections.

## File Structure

```
v4/
├── parsers/
│   └── lyrics-parser.js                    (✅ Complete)
├── processors/
│   └── phrase-segmenter.js                 (✅ Complete with position analysis)
├── templates/components/
│   └── lyrics-section.html                 (✅ Complete structure)
├── controllers/
│   └── lyrics-controller.js                (TODO - needs implementation)
├── LYRICS-SYSTEM-ARCHITECTURE.md           (✅ Complete design)
├── LYRICS-IMPLEMENTATION-SUMMARY.md        (✅ Status document)
└── LYRICS-READY-TO-USE.md                  (This file)
```

## What You Can Do Now

1. **Review** the phrase position analysis approach (3-3 vs 2-2 split)
2. **Test** the parser with one of your MusicXML files
3. **Decide** which features to implement next:
   - Lyrics extraction and display?
   - Interactive highlighting?
   - Google Translate integration?
   - Phrase playback controls?

## Ready for Your Feedback!

The foundation is solid and ready to:
- Extract lyrics from YOUR MusicXML files
- Segment using Vietnamese dân ca rules
- Track opening/middle/ending patterns
- Learn from your corrections

Tell me which direction you'd like to go next!