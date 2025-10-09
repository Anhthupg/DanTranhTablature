# Dan Tranh Music Analysis - Complete 8-Tier Taxonomy Specification

**Version:** 1.0
**Date:** October 5, 2025
**Status:** Comprehensive framework integrating Musical, Linguistic, and Cultural analysis

---

## Overview

This taxonomy provides a hierarchical framework for analyzing Vietnamese traditional music (Dan Tranh repertoire) across **three analytical domains**:

1. **Musical Domain** - Pitch, rhythm, melody, performance techniques
2. **Linguistic Domain** - Words, tones, grammar, poetic devices
3. **Cultural Domain** - Ethnography, social context, regional styles

The **8-tier structure** progresses from atomic elements (Tier 0-1) through contextual patterns (Tier 2-3), phrase-level analysis (Tier 4), cross-dimensional relationships (Tier 5-6), to collection-level insights (Tier 7-8).

---

## Three-Domain Meta-Structure

```
┌─────────────────────────────────────────────────────────┐
│                  CULTURAL DOMAIN                        │
│         (Genre, Ethnography, Regional Style)            │
├─────────────────────────────────────────────────────────┤
│  MUSICAL DOMAIN          ↕          LINGUISTIC DOMAIN   │
│  Pitch, Rhythm,                     Words, Tones,       │
│  Melody, Technique       ↕          Grammar, Poetry     │
└─────────────────────────────────────────────────────────┘
          ↑                                   ↑
    Tier 0-1: Atomic Elements
    Tier 2-3: Contextual Patterns
    Tier 4:   Phrase Segmentation
    Tier 5-6: Cross-Element Relationships
    Tier 7-8: Collection & Cultural Analysis
```

---

## Tier 0: Fixed Metadata

**Definition:** Descriptive information that cannot generate analytical insights alone.

### Data Elements

| Field | Example | Source |
|-------|---------|--------|
| Song title | "Bà Rằng Bà Rí" | MusicXML metadata |
| Region | Northern, Southern, Central, Highland | Manual classification |
| Tempo | 120 BPM | MusicXML tempo marking |
| Time signature | 2/4, 3/4, 4/4 | MusicXML measure data |
| Total duration | 2:34 (minutes:seconds) | Calculated from durations |
| Composer | Traditional, or named composer | Metadata |
| Transcription date | 2024-05-20 | File metadata |
| Performance context | Work song, lullaby, courtship | Manual classification |

### Data Availability
- ✅ **HAVE:** Title, tempo, time signature, duration (in `processed-preserve/*.json`)
- ❌ **MISSING:** Region, composer, context (need manual classification)

---

## Tier 1: Atomic Elements

**Definition:** Smallest indivisible units of musical and linguistic information.

### 1A. Musical Atomic Elements

#### Pitches
- **Individual notes:** C4, D4, E4, G4, A4, C5, D5, E5, G5, A5
- **Properties:** Step (C/D/E/G/A), Octave (4/5/6), MIDI number
- **Data structure:**
  ```json
  {
    "pitch": "C5",
    "step": "C",
    "octave": 5,
    "frequency": 523.25
  }
  ```

#### Durations
- **Values:** 0.125 (32nd), 0.25 (16th), 0.5 (8th), 1.0 (quarter), 2.0 (half), 4.0 (whole)
- **Type separation:** Main notes vs. grace notes (CRITICAL - same duration value ≠ same type)
- **Data structure:**
  ```json
  {
    "duration": 0.5,
    "isGrace": false,
    "durationName": "8th"
  }
  ```

#### Grace Notes vs Main Notes
- **Grace notes:** Ornamental, use 1/4 playback duration, 6px radius, 85/4 spacing
- **Main notes:** Structural, full playback duration, 12px radius, 85px spacing
- **Rule:** ALWAYS separate in data structures, analysis, and statistics

#### Other Musical Atomics
- **Bent notes:** Pitch alterations (micro-tonal)
- **Slurs:** Connection type (start, stop, continue)
- **Ties:** Rhythmic connection (start, stop)
- **Articulation:** Staccato, legato, accents

### 1B. Linguistic Atomic Elements

#### Syllables
- **Definition:** Atomic Vietnamese linguistic units (NOT same as words)
- **Properties:** Text, tone mark, position in word
- **Example:** "chiều chiều" = 2 syllables, 2 words
- **Data structure:**
  ```json
  {
    "syllable": "chiều",
    "tone": "huyền",
    "position": "standalone"
  }
  ```

#### Words
- **Definition:** Semantic units (can be multi-syllabic)
- **Types:**
  - Monosyllabic: "đi", "về", "em"
  - Disyllabic: "chiều chiều", "duyên phận"
  - Polysyllabic: "tơ hồng"
- **Data structure:**
  ```json
  {
    "word": "tơ hồng",
    "syllables": ["tơ", "hồng"],
    "translation": "red thread (of fate)",
    "semanticCategory": "cultural_concept"
  }
  ```

#### 6 Vietnamese Tones
- **Tones:**
  - `ngang` (level tone: a, ă, â)
  - `sắc` (rising tone: á, ắ, ấ)
  - `huyền` (falling tone: à, ằ, ầ)
  - `hỏi` (broken/dipping tone: ả, ẳ, ẩ)
  - `ngã` (rising glottalized tone: ã, ẵ, ẫ)
  - `nặng` (heavy/drop tone: ạ, ặ, ậ)
- **Properties:** Pitch contour, duration, glottalization
- **Extraction:** Parse diacritics from syllable text

#### Hierarchical Pronouns (Vietnamese-Specific)
- **Definition:** Relationship-based address terms that reveal social structure
- **Categories:**

  **Family pronouns:**
  - con/mẹ (child/mother)
  - anh/em (older sibling/younger sibling)
  - ông/bà (grandfather/grandmother)

  **Social pronouns:**
  - thầy/trò (teacher/student)
  - ông/tôi (sir/I-formal)

  **Romantic pronouns:**
  - anh/em (boyfriend/girlfriend)
  - chàng/nàng (lad/lass - poetic)

- **Analysis:** Track which relationships appear in which contexts
- **Data structure:**
  ```json
  {
    "pronoun": "em",
    "relationship": "romantic_younger",
    "context": "love_song",
    "register": "intimate"
  }
  ```

#### Rich Modifiers - Poetic Classifiers & Compounds
- **Definition:** Classifiers and metaphoric compounds that add emotional/poetic depth

- **Noun classifiers with emotional layers:**
  ```
  con thuyền   = little boat (con = classifier, adds intimacy/life)
  cánh buồm    = sail wing (cánh = wing, sail becomes bird-like)
  giọt sương   = dewdrop (giọt = drop, makes dew precious/singular)
  làn gió      = wind wave (làn = wave, wind moves like ocean)
  ```

- **Metaphoric compounds:**
  ```
  mảnh trăng   = moon fragment (suggests loneliness, incompleteness)
  dòng sông    = river flow/lineage (river has ancestry/continuity)
  bầu trời     = sky gourd (sky as nurturing container)
  tà áo        = dress flap/evening (flows like sunset)
  ```

- **Analysis:** Track classifier types, metaphor families, emotional layering
- **Data structure:**
  ```json
  {
    "phrase": "con thuyền",
    "classifier": "con",
    "noun": "thuyền",
    "emotionalLayer": "intimacy",
    "metaphorFamily": "animacy"
  }
  ```

#### Từ láy (Reduplication)
- **Definition:** Sound repetition for emphasis, rhythm, or imagery

- **Types:**
  - **Total reduplication:** chiều chiều, xanh xanh
  - **Partial reduplication:** lững thững, lầm lũi
  - **Rhyming reduplication:** lững lờ, bâng khuâng

- **Function:** Sound beauty, rhythmic effect, emphasis, onomatopoeia
- **Data structure:**
  ```json
  {
    "word": "chiều chiều",
    "type": "total_reduplication",
    "baseWord": "chiều",
    "function": "emphasis_evocative"
  }
  ```

#### Vần (Rhyme)
- **Definition:** Phonetic similarity between syllables, fundamental to Vietnamese folk poetry aesthetics
- **Importance:** Ca dao and folk songs rely heavily on rhyme for memorability and oral transmission

- **Types:**
  - **End rhyme (vần cuối):** Line-ending rhyme patterns in ca dao
    - Example: "chiều" / "yêu" / "điều" (all end in -iều)
  - **Internal rhyme (vần trong):** Mid-phrase rhyming
    - Example: "buồn thương nhớ mong" (thương / mong rhyme within phrase)
  - **Assonance (vần nguyên âm):** Vowel similarity without identical endings
    - Example: "xa" / "nhà" / "mà" (all have 'a' vowel)
  - **Consonance (vần phụ âm):** Consonant pattern similarity
    - Example: "lung linh" / "lững lờ" (l-ng pattern)

- **Vietnamese-Specific Features:**
  - **Tone-independent rhyming:** Syllables rhyme based on vowel+final consonant, regardless of tone
    - "chiều" (huyền) rhymes with "yêu" (sắc) - different tones, same rhyme
  - **Lục bát rhyme scheme:** Traditional 6-8 syllable pattern with specific rhyme positions
    - Line 6 syllable 6 rhymes with line 8 syllable 6
    - Line 8 syllable 8 rhymes with next line 6 syllable 6
  - **Ca dao conventions:** Opening/closing formulas with fixed rhyme patterns

- **Data structure:**
  ```json
  {
    "syllable": "chiều",
    "rhymeGroup": "ieu",
    "rhymeCore": {
      "vowel": "iê",
      "finalConsonant": "u",
      "tone": "huyền"
    },
    "rhymePosition": "line_end",
    "rhymesWith": ["yêu", "điều", "nghiêu"],
    "rhymeGroupId": "group_ieu_1"
  }
  ```

- **Analysis Output:**
  ```json
  {
    "rhymeScheme": "AABCCB",
    "rhymeDensity": 0.67,
    "endRhymePercentage": 85.7,
    "internalRhymePercentage": 14.3,
    "dominantRhymeGroups": [
      {"group": "ieu", "frequency": 12},
      {"group": "ang", "frequency": 8}
    ]
  }
  ```

#### Figurative Language (Multi-Dimensional Taxonomy) ⭐ UPDATED!

**Status**: ✅ IMPLEMENTED with 5-dimensional classification

**Why Multi-Dimensional?** Exclusive categories (idiom OR metaphor OR cultural_phrase) lose information. Vietnamese expressions are OVERLAPPING - an idiom CAN BE metaphorical AND cultural!

##### The 5 Dimensions:

**Dimension 1: Vietnamese Category** (Traditional classification)
- **thành_ngữ** - idiom (fixed figurative expression)
- **tục_ngữ** - proverb (wisdom, moral lessons) ⚠️ Correct term, NOT "t属ngữ"!
- **từ_láy** - reduplication (handled by separate detector)
- **từ_kết_hợp** - collocation (natural word pairing)
- **điển_tích** - cultural allusion (historical reference)
- **ca_dao_formula** - folk song pattern

**Dimension 2: Semantic Mechanism** (HOW meaning is created)
- **metaphorical** - source→target domain (80% in sample)
- **metonymic** - part-for-whole association
- **literal** - compositional from parts
- **symbolic** - cultural symbol
- **hyperbolic**, **euphemistic**

**Dimension 3: Cultural Scope** (WHERE it's used)
- **vietnamese_specific** - unique to Vietnamese (60%)
- **east_asian** - shared China/Vietnam/Korea/Japan (20%)
- **universal** - cross-cultural (20%)
- **regional_vietnamese** - North/South/Central specific

**Dimension 4: Fixedness** (HOW flexible)
- **frozen** - cannot change words
- **semi_fixed** - core fixed, modifiers flexible
- **flexible_pattern** - template with slots
- **free_combination** - just co-occur

**Dimension 5: Meaning Depth** (HOW many layers)
- **surface** - single literal
- **layered** - literal + 1 figurative (70%)
- **multi_layered** - multiple interpretations (30%)
- **highly_symbolic** - deep cultural/philosophical

##### Enhanced Data Structure:
```json
{
  "vietnamese": "tang tình",
  "literal": "mourning appearance",
  "meaning": "simple clothes revealing inner beauty",

  "classification": {
    "vietnameseCategory": "thành_ngữ",
    "semanticMechanism": "metaphorical",
    "culturalScope": "vietnamese_specific",
    "fixedness": "semi_fixed",
    "meaningDepth": "multi_layered"
  },

  "features": [
    "appearance_metaphor",
    "beauty_in_simplicity",
    "traditional_aesthetic"
  ],

  "culturalContext": "Common motif in Vietnamese folk poetry",
  "words": ["tang", "tình"]
}
```

##### Implementation:
- **File**: `enhanced-figurative-detector.js`
- **Output**: 5D classification + feature tagging + cultural context
- **Sample**: "Lý chiều chiều" = 10 expressions, 7 unique, 23 features
- **See**: `TIER1-COMPLETE.md` for full results

### Data Availability Summary

| Element | Status | Location |
|---------|--------|----------|
| Pitches | ✅ HAVE | `processed-preserve/*.json` → notes[] |
| Durations | ✅ HAVE | `processed-preserve/*.json` → notes[] |
| Grace/Main separation | ✅ HAVE | `isGrace: true/false` |
| Syllables | ✅ HAVE | `lyrics-segmentations/*.json` → phrases[].wordMapping[] |
| Words | ✅ HAVE | `lyrics-segmentations/*.json` → phrases[] |
| 6 Tones | ✅ HAVE | `lyrics-enhanced-tier1/*.json` → toneAnalysis |
| Hierarchical pronouns | ✅ HAVE | `lyrics-enhanced-tier1/*.json` → pronounAnalysis |
| Rich modifiers | ✅ HAVE | `lyrics-enhanced-tier1/*.json` → modifierAnalysis |
| Từ láy | ✅ HAVE | `lyrics-enhanced-tier1/*.json` → reduplicationAnalysis |
| Figurative Language | ✅ HAVE | `lyrics-enhanced-tier1/*.json` → figurativeLanguageAnalysis (5D) |
| Vần (Rhyme) | ❌ MISSING | Need: `parsers/rhyme-detector.js` → `lyrics-enhanced-tier1/*.json` → rhymeAnalysis |

---

## Tier 2: Contextual Pattern Calculation

**Definition:** Exhaustive extraction of ALL patterns by scanning entire song.

**Implementation:** ✅ `pattern-analyzer.js` (V4.2.1)

### 2A. Musical Pattern Calculation

#### KPIC (Key Pitch In Context)
- **KPIC-2:** All two-note pitch transitions
  - Example: D4→G4, G4→A4, A4→C5, C5→D5
  - **Scan:** Every consecutive pair of main notes
  - **Real Output (Bà Rằng Bà Rí):**
    ```json
    {
      "A4→C5": 14,
      "C5→C5": 13,
      "C5→A4": 13,
      "G4→C5": 8
    }
    ```

- **KPIC-3:** All three-note pitch sequences
  - Example: D4→G4→A4, G4→A4→C5
  - **Scan:** Every consecutive triplet
  - **Real Output (Bà Rằng Bà Rí):**
    ```json
    {
      "C5→A4→C5": 7,
      "C5→C5→C5": 6,
      "A4→C5→C5": 5
    }
    ```

- **Interval Distribution:** Categorized by size (unison, second, third, fourth, fifth, larger)

#### KRIC (Key Rhythm In Context)

**CRITICAL:** SEPARATE analysis for main notes and grace notes.

- **KRIC-2 (Main Notes):** All two-duration patterns
  - Uses RAW MusicXML duration values (1, 2, 3, 8)
  - Example: 2→2 (8th→8th), 1→2 (quarter→8th)
  - **Real Output (Bà Rằng Bà Rí):**
    ```json
    {
      "mainNotes": {
        "2→2": 28,
        "1→2": 25,
        "2→1": 19,
        "1→1": 16
      }
    }
    ```

- **KRIC-2 (Grace Notes):** Grace note sequences
  - Uses `isGrace` flag (duration=0 in MusicXML)
  - Classified by type: g8th, g16th, g-other
  - **Real Output (Bà Rằng Bà Rí):**
    ```json
    {
      "graceNotes": {
        "g8th→g8th": 10,
        "totalNotes": 11
      }
    }
    ```

**Key Rule:** ALWAYS use `isGrace` flag, NOT duration values to separate grace from main notes.

- **KRIC-3:** Three-duration sequences (separate for main/grace)

### 2B. Linguistic Pattern Calculation

#### KWIC (Keyword In Context)

**CRITICAL:** THREE SEPARATE ANALYSES - lyrics-based, rhythm-based, pitch-based.

- **KWIC-Lyrics:** Position in lyrical phrases (LLM segmentation)
  - Uses phrase boundaries from `lyrics-segmentations/*.json`
  - **Real Output (Bà Rằng Bà Rí):**
    ```json
    {
      "beginningWords": { "bà": 6, "làm": 4, "cái": 3 },
      "middleWords": { "bà": 8, "rằng": 6, "rí": 6 },
      "endingWords": { "ơi": 6, "chồng": 3, "tôi": 3 }
    }
    ```

- **KWIC-Rhythm:** Position in rhythmic phrases
  - Auto-detected by duration changes and long notes
  - Detects 103 rhythmic phrases (vs 28 lyrical phrases)
  - **Real Output (Bà Rằng Bà Rí):**
    ```json
    {
      "beginningWords": { "bà": 10, "ơi": 9, "rí": 7 },
      "totalRhythmicPhrases": 103
    }
    ```

- **KWIC-Pitch:** Position in melodic contours
  - Auto-detected by pitch direction changes and large intervals
  - Detects 53 melodic phrases
  - **Real Output (Bà Rằng Bà Rí):**
    ```json
    {
      "beginningWords": { "bà": 7, "rí": 6, "ơi": 5 },
      "totalMelodicPhrases": 53
    }
    ```

**Why Three Analyses:**
- Lyrical phrasing ≠ rhythmic phrasing ≠ melodic phrasing
- Each reveals different structural patterns
- 28 lyrical vs 103 rhythmic vs 53 melodic phrases shows multi-layered structure

#### KTIC (Key Tone In Context)
- **Tone sequences:** ngang→sắc, sắc→huyền, etc.
- **Scan:** Extract tone from each syllable diacritic, track transitions
- **Real Output (Bà Rằng Bà Rí):**
  ```json
  {
    "twoTonePatterns": {
      "ngang→ngang": 25,
      "huyền→huyền": 17,
      "ngang→huyền": 12
    },
    "threeTonePatterns": {
      "ngang→ngang→ngang": 11,
      "huyền→huyền→huyền": 9
    }
  }
  ```

**Tone Detection:** Automated via Unicode diacritic pattern matching (ngang, sắc, huyền, hỏi, ngã, nặng)

#### KRHC (Key Rhyme In Context)
- **Rhyme sequences:** Which syllables rhyme with each other across the song
- **Rhyme positions:** Track where rhymes appear (line-end, internal, phrase boundaries)
- **Scan:** Extract rhyme groups based on vowel+final consonant patterns (tone-independent)
- **Real Output (Example - Lý Chiều Chiều):**
  ```json
  {
    "rhymeGroups": {
      "ieu": {
        "syllables": ["chiều", "yêu", "điều", "nhiều"],
        "positions": [1, 4, 7, 12],
        "phrasePositions": ["end", "end", "internal", "end"],
        "count": 4
      },
      "ang": {
        "syllables": ["thương", "đàng", "sang"],
        "positions": [3, 8, 15],
        "phrasePositions": ["end", "end", "end"],
        "count": 3
      }
    },
    "twoRhymePatterns": {
      "ieu→ang": 2,
      "ang→ieu": 1,
      "ieu→ieu": 3
    },
    "rhymeScheme": "AABCCB",
    "statistics": {
      "totalRhymes": 7,
      "endRhymePercentage": 85.7,
      "internalRhymePercentage": 14.3,
      "averageRhymeDistance": 3.2,
      "dominantRhymeGroup": "ieu"
    }
  }
  ```

**Rhyme Detection Algorithm:**
1. Extract syllable text from lyrics
2. Normalize by removing tones → get rhyme core (vowel + final consonant)
3. Group syllables with identical rhyme cores
4. Identify rhyme positions (phrase-end vs internal)
5. Calculate rhyme scheme (AABB, ABAB, etc.)
6. Track transitions between rhyme groups

**Vietnamese-Specific Rules:**
- Ignore tones when determining rhyme (chiều/huyền rhymes with yêu/sắc)
- Lục bát detection: 6-8 syllable alternation with specific rhyme positions
- Ca dao formulas: Fixed rhyme patterns in opening/closing phrases

#### Context Patterns (Pronouns, Modifiers, Reduplication)

**Implementation:** ✅ Included in `pattern-analyzer.js`

- **Pronoun usage patterns:** Track context around pronouns
  - **Real Output (Bà Rằng Bà Rí):**
    ```json
    {
      "bà": {
        "count": 15,
        "examples": [
          { "before": "", "word": "Bà", "after": "Rằng" },
          { "before": "Rằng", "word": "bà", "after": "Rí" }
        ]
      },
      "ông": { "count": 3 },
      "tôi": { "count": 3 }
    }
    ```

- **Reduplication detection:** Identifies repeated syllables
  - **Real Output (Bà Rằng Bà Rí):**
    ```json
    {
      "reduplication": {
        "o": 2  // "o o o" pattern
      }
    }
    ```

- **Modifier tracking:** Identifies modifiers (rất, lắm, quá, etc.)
  - Tracks frequency and context
  - Currently: ❌ No modifiers in "Bà Rằng Bà Rí"

#### KMIC - Modifier Context (NEW)
- **Classifier frequency:** How often is each classifier used?
- **Richness index:** Average modifiers per phrase
- **Output:**
  ```json
  {
    "classifiers": {
      "con": 12,
      "mảnh": 3,
      "giọt": 2
    },
    "richnessIndex": {
      "phrase_1": 0,
      "phrase_2": 1,
      "phrase_5": 2
    },
    "averageRichness": 0.85
  }
  ```

#### KREDIC - Reduplication Context (NEW)
- **Từ láy positioning:** Where do reduplicated words appear?
- **Scan:** Track position and frequency
- **Output:**
  ```json
  {
    "chiều chiều": {
      "phraseBeginning": 2,
      "phraseEnding": 1
    },
    "totalReduplications": 8,
    "reduplicationPercentage": 6.7
  }
  ```

#### KIIC - Idiom Context (NEW)
- **Thành ngữ placement:** Complete vs. fragmented idioms
- **Scan:** Detect multi-word idiomatic phrases
- **Output:**
  ```json
  {
    "completeIdioms": 2,
    "fragmentedIdioms": 1,
    "idiomDensity": 0.12
  }
  ```

### Implementation Status

| Pattern Type | Status | Processor | Output Location |
|--------------|--------|-----------|-----------------|
| KPIC | ✅ COMPLETE | `pattern-analyzer.js` | `.kpic.twoNotePatterns`, `.kpic.threeNotePatterns` |
| KRIC (Main) | ✅ COMPLETE | `pattern-analyzer.js` | `.kric.mainNotes.twoNotePatterns` |
| KRIC (Grace) | ✅ COMPLETE | `pattern-analyzer.js` | `.kric.graceNotes.twoNotePatterns` |
| KWIC (Lyrics) | ✅ COMPLETE | `pattern-analyzer.js` | `.kwic.lyricsBased` |
| KWIC (Rhythm) | ✅ COMPLETE | `pattern-analyzer.js` | `.kwic.rhythmBased` |
| KWIC (Pitch) | ✅ COMPLETE | `pattern-analyzer.js` | `.kwic.pitchBased` |
| KTIC | ✅ COMPLETE | `pattern-analyzer.js` | `.ktic.twoTonePatterns`, `.ktic.threeTonePatterns` |
| KRHC | ⏳ PLANNED | Future: `rhyme-analyzer.js` | `.krhc.rhymeGroups`, `.krhc.rhymeScheme` |
| Pronouns | ✅ COMPLETE | `pattern-analyzer.js` | `.context.pronounUsage` |
| Reduplication | ✅ COMPLETE | `pattern-analyzer.js` | `.context.reduplication` |
| Modifiers | ✅ COMPLETE | `pattern-analyzer.js` | `.context.modifierUsage` |
| KMIC | ⏳ PLANNED | Future: classifier-specific analysis | - |
| KREDIC | ⏳ PLANNED | Future: advanced reduplication types | - |
| KIIC | ⏳ PLANNED | Future: idiom detection | - |

**Output File:** `data/patterns/{songName}-patterns.json`

**Usage:**
```bash
node pattern-analyzer.js "Bà rằng bà rí"
```

---

## Tier 3: Pattern Recognition

**Definition:** Identify repetitions and longest sequences from Tier 2 patterns.

### Analysis Methods

#### Longest Repeating Sequence
- **Question:** What is the longest pattern that repeats?
- **Example (Pitch):**
  - Sequence `D4→G4→A4→C5` appears 3 times → Longest = 4 notes
  - Sequence `D4→G4` appears 12 times → Shorter but more frequent

#### Maximum Repetition of Smaller Units
- **Question:** Which smaller pattern repeats most?
- **Decision rule:** Balance between length and frequency
  - Long sequences (4+ notes) → Structural motifs
  - Short sequences (2-3 notes) → Melodic cells

#### Pattern Recognition Output
```json
{
  "pitchPatterns": {
    "longestSequence": {
      "pattern": "D4→G4→A4→C5",
      "length": 4,
      "occurrences": 3,
      "positions": [5, 23, 41]
    },
    "mostFrequent": {
      "pattern": "D4→G4",
      "length": 2,
      "occurrences": 12
    }
  },
  "rhythmPatterns": { /* same structure */ },
  "wordPatterns": { /* same structure */ },
  "tonePatterns": { /* same structure */ }
}
```

### Data Requirements

| Analysis | Input | Processor | Output |
|----------|-------|-----------|--------|
| Pattern recognition | Tier 2 pattern data | `pattern-recognizer.js` | Per-song pattern analysis |

---

## Tier 4: Phrase Segmentation with Variations

**Definition:** Divide songs into phrases using multiple analytical lenses, detect variations.

### 4A. Phrase Breaks by Element Type

#### 1. Pitch-Based Phrase Breaks
- **Indicators:**
  - Cadential pitch patterns (descending to tonic: A4→G4→C4)
  - Melodic arch completion (rise then fall)
  - Large interval leaps (>5th)
  - Pitch register reset (return to mid-range after high peak)

- **Output:** Pitch-based song form
  ```json
  {
    "pitchPhrases": [
      {
        "id": 1,
        "noteRange": "0-12",
        "contour": "ascending_then_descending",
        "cadence": "tonic"
      }
    ],
    "pitchForm": "AABA"
  }
  ```

#### 2. Rhythm-Based Phrase Breaks
- **Indicators:**
  - Rest patterns (silence = boundary)
  - Long note endings (2x average duration)
  - Metric boundaries (downbeat after weak beat)
  - Rhythmic cadences (slow → fast → slow)

- **Output:** Rhythm-based song form
  ```json
  {
    "rhythmPhrases": [
      {
        "id": 1,
        "noteRange": "0-15",
        "pattern": "regular_syncopated_regular",
        "cadence": "long_note"
      }
    ],
    "rhythmForm": "AABA"
  }
  ```

#### 3. Lyrics-Based Phrase Breaks
- **Indicators:**
  - Word boundaries (complete thoughts)
  - Semantic units (subject-verb-object complete)
  - Punctuation markers (comma, period)
  - Grammatical completion (sentence ends)
  - **Rhyme patterns** (end rhyme signals phrase/line completion in Vietnamese ca dao)
  - **Lục bát positions** (rhyme at syllable 6 and 8 marks traditional line boundaries)

- **Output:** Lyrics-based song form
  ```json
  {
    "lyricsPhrases": [
      {
        "id": 1,
        "text": "Bà Rằng bà Rí",
        "grammaticalUnit": "vocative_complete",
        "semanticType": "exclamatory",
        "endRhyme": "í",
        "rhymeGroup": "i"
      },
      {
        "id": 2,
        "text": "Cái duyên ông chồng tôi",
        "grammaticalUnit": "complete_statement",
        "semanticType": "complaint",
        "endRhyme": "tôi",
        "rhymeGroup": "oi"
      }
    ],
    "lyricsForm": "ABCR",
    "rhymeForm": "AABA"
  }
  ```

#### 4. Tone-Based Phrase Breaks
- **Indicators:**
  - Tone transition patterns (falling tone → ngang tone = ending)
  - Tone sequence completion
  - Tone cadences (specific tone combinations signal closure)

- **Output:** Tone-based song form
  ```json
  {
    "tonePhrases": [
      {
        "id": 1,
        "toneSequence": "ngang-sắc-huyền-ngang",
        "cadenceType": "falling_to_level"
      }
    ],
    "toneForm": "AABA"
  }
  ```

### 4B. Phrase Variations (Critical Analysis)

**For each phrase type, detect:**

#### 1. Exact Repetition
- Phrase A = Phrase A' (identical)
- **Example:** Refrain "cái duyên ông chồng" repeated 3 times exactly

#### 2. Substitution
- Phrase A vs A': 1-2 elements changed
- **Example (Pitch):**
  - Original: D4-G4-A4
  - Variant: D4-A4-C5 (middle note substituted)
- **Track:** Which element type substituted (pitch? rhythm? word?)

#### 3. Insertion
- Phrase A vs A': extra element added
- **Example (Lyrics):**
  - Original: "về đâu"
  - Variant: "về đâu xa" (added "xa")

#### 4. Deletion
- Phrase A vs A': element removed
- **Example:**
  - Original: "chiều chiều về đâu"
  - Variant: "chiều về đâu" (deleted one "chiều")

#### 5. Transposition (Pitch-Specific)
- Same melodic contour, different starting pitch
- **Example:**
  - Original: D4→G4→A4 (intervals: +4th, +2nd)
  - Transposed: G4→C5→D5 (same intervals, different pitches)

#### 6. Augmentation/Diminution (Rhythm-Specific)
- Same rhythm pattern, stretched or compressed
- **Example:**
  - Original: 0.5-0.5-1.0 (eighth-eighth-quarter)
  - Augmented: 1.0-1.0-2.0 (quarter-quarter-half, doubled)

### Phrase Variation Output
```json
{
  "phraseFamilies": [
    {
      "basePhrase": 1,
      "variants": [
        {
          "phraseId": 6,
          "variationType": "exact_repetition"
        },
        {
          "phraseId": 15,
          "variationType": "substitution",
          "substitutions": [
            {
              "position": 2,
              "elementType": "pitch",
              "original": "G4",
              "variant": "A4"
            }
          ]
        }
      ]
    }
  ]
}
```

### 4C. Phrase Function Classification

**Independent of structure, classify by pragmatic function:**

- **Question phrases** - Rising intonation, question words (đâu, sao, gì)
- **Answer phrases** - Following questions, providing resolution
- **Opening phrases** - Introduction, attention-getting (often vocative: ơi!)
- **Closing phrases** - Resolution, finality (often return to tonic)
- **Refrain phrases** - Repeated across sections
- **Development phrases** - New material, narrative progression
- **Bridge phrases** - Transitional, modulation
- **Exclamatory phrases** - Emotional outbursts (ơi!, à!)
- **Narrative phrases** - Storytelling, sequential events
- **Complaint phrases** - Grievance expression (làm khổ cái đời)

### Data Requirements

| Analysis | Input | Processor | Output |
|----------|-------|-----------|--------|
| Phrase segmentation | Tier 2-3 patterns, note data | `phrase-segmenter.js` | `phrases/*-segmentation.json` |
| Phrase variations | Segmented phrases | `phrase-variation-detector.js` | `phrases/phrase-variations.json` |

---

## Tier 5: Cross-Element Form Comparison

**Definition:** How do phrase structures ALIGN or DIFFER across analytical approaches?

### Analysis Methods

#### 1. Form Agreement Matrix
```
Pitch Form:  A  A  B  A
Rhythm Form: A  A' B  A
Lyrics Form: A  B  C  A
Tone Form:   A  A  B  A'
Rhyme Form:  A  A  B  A

Agreement Analysis:
- Pitch-Rhythm: 75% (3/4 phrases agree)
- Pitch-Tone: 87.5% (A' is close variant)
- Pitch-Rhyme: 100% (rhyme structure perfectly aligns with melody)
- Lyrics-Rhyme: 50% (semantic structure ≠ rhyme structure)
- Rhyme Form: Music-driven (rhyme follows pitch, not semantic content)
```

**Output:**
```json
{
  "formComparison": {
    "pitchForm": "AABA",
    "rhythmForm": "AA'BA",
    "lyricsForm": "ABCA",
    "toneForm": "AABA'",
    "rhymeForm": "AABA",
    "agreementMatrix": {
      "pitch-rhythm": 0.75,
      "pitch-lyrics": 0.25,
      "pitch-tone": 0.875,
      "pitch-rhyme": 1.00,
      "rhythm-lyrics": 0.5,
      "rhythm-tone": 0.75,
      "rhythm-rhyme": 0.75,
      "lyrics-tone": 0.25,
      "lyrics-rhyme": 0.50,
      "tone-rhyme": 0.875
    },
    "dominantAlignment": {
      "rhyme-pitch": "perfect_correlation",
      "interpretation": "Rhyme structure music-driven, follows melodic form"
    }
  }
}
```

#### 2. Boundary Alignment
- **Question:** Do phrase breaks coincide across dimensions?
- **Example:**
  - Pitch boundary at measure 8 (cadence)
  - Lyrics continue to measure 9 (enjambment)
  - Misalignment detected

**Output:**
```json
{
  "boundaryAlignment": [
    {
      "measure": 4,
      "pitchBoundary": true,
      "rhythmBoundary": true,
      "lyricsBoundary": true,
      "toneBoundary": true,
      "rhymeBoundary": true,
      "aligned": true,
      "comment": "Perfect alignment - end rhyme coincides with all boundaries"
    },
    {
      "measure": 8,
      "pitchBoundary": true,
      "rhythmBoundary": false,
      "lyricsBoundary": false,
      "toneBoundary": true,
      "rhymeBoundary": false,
      "aligned": false,
      "comment": "Pitch/tone cadence, but lyrics/rhythm/rhyme continue"
    },
    {
      "measure": 12,
      "pitchBoundary": false,
      "rhythmBoundary": false,
      "lyricsBoundary": true,
      "toneBoundary": false,
      "rhymeBoundary": true,
      "aligned": false,
      "comment": "Mid-phrase rhyme (internal rhyme), not cadential"
    }
  ]
}
```

#### 3. Hierarchical Nesting
- **Question:** Do smaller phrases nest within larger phrases?
- **Example:**
  - Large rhythmic phrase (16 measures)
  - Contains 4 smaller pitch phrases (4 measures each)

**Output:**
```json
{
  "nestedStructure": {
    "rhythmPhrase_1": {
      "measures": "1-16",
      "containedPitchPhrases": [1, 2, 3, 4],
      "nestingType": "4_equal_subphrases"
    }
  }
}
```

#### 4. Dominant Dimension
- **Question:** Which element type best predicts overall song form?
- **Analysis:**
  - If pitch form = rhythm form = tone form = rhyme form → Music-driven
  - If lyrics form ≠ all others → Text-driven (semantic structure)
  - If rhyme form = pitch form ≠ lyrics form → Music-driven with poetic structure
  - If all diverge → Complex multi-dimensional structure

**Output:**
```json
{
  "dominantDimension": "pitch",
  "secondaryDimension": "rhyme",
  "confidence": 0.82,
  "reasoning": "Pitch form aligns with rhythm (75%), tone (87.5%), and rhyme (100%). Rhyme follows melodic structure, not semantic content.",
  "interpretation": "Vietnamese ca dao: rhyme structure music-driven, poetic form reinforces melodic form"
}
```

**Vietnamese Folk Song Insight:**
In traditional Vietnamese ca dao and lý songs, rhyme structure typically follows melodic structure rather than semantic content. This creates a **music-driven poetic form** where:
- Rhyme positions align with musical cadences (85%+ correlation)
- Lục bát rhyme positions (syllable 6, 8) map to melodic phrase boundaries
- End rhymes receive descending pitch treatment (cadential)
- Rhyme form = melodic form ≠ semantic phrase structure

This pattern distinguishes Vietnamese folk songs from purely text-driven poetry.

### Data Requirements

| Analysis | Input | Processor | Output |
|----------|-------|-----------|--------|
| Form comparison | All 5 phrase segmentations (pitch, rhythm, lyrics, tone, rhyme) | `form-comparator.js` | `correlations/form-alignment-matrix.json` |

---

## Tier 6: Cross-Element Relationships (Interaction Analysis)

**Definition:** How do elements from different domains interact and correlate?

### 6A. Musical ↔ Musical

#### Pitch ↔ Rhythm (Melodic Characteristics)
- **High pitch + short duration** → Climax effect
- **Low pitch + long duration** → Grounding, stability
- **Pitch acceleration** (rising + speeding up) → Excitement
- **Pitch deceleration** (falling + slowing) → Resolution

**Analysis:**
```json
{
  "pitchRhythmCorrelation": {
    "highPitchShortDuration": {
      "occurrences": 12,
      "percentage": 15.8,
      "interpretation": "Climax emphasis"
    },
    "lowPitchLongDuration": {
      "occurrences": 8,
      "percentage": 10.5,
      "interpretation": "Structural grounding"
    }
  }
}
```

### 6B. Linguistic ↔ Linguistic (Inter-element within language)

#### 1. Từ láy ↔ Meaning Intensity
- **Question:** Does reduplication amplify emotion?
- **Example:**
  - "buồn" (sad) vs "buồn buồn" (sadly, with emphasis)
  - Does musical treatment reflect this?

**Analysis:**
```json
{
  "tuLayIntensity": {
    "simpleWord": {
      "word": "buồn",
      "avgDuration": 0.75,
      "avgPitchRange": 3
    },
    "reduplicated": {
      "word": "buồn buồn",
      "avgDuration": 1.2,
      "avgPitchRange": 5,
      "intensityIncrease": "60%"
    }
  }
}
```

#### 2. Pronouns ↔ Modifiers
- **Question:** Does "em" (younger/beloved) get gentler modifiers?
- **Analysis:** Track adjective/modifier co-occurrence with pronouns

#### 3. Thành ngữ ↔ Tones
- **Question:** Do idioms preserve traditional tone patterns?
- **Analysis:** Compare tone sequences in idioms vs. free text

### 6C. Linguistic ↔ Musical (PRIMARY FOCUS)

#### 1. Syllable-Note Mapping
- **1:1 syllabic** - One syllable per note (most common)
- **Melisma** - One syllable, multiple notes (ornamental)
- **Grace notes** - Ornamental notes without syllables

**Data:** Already exists in `relationships/*.json`
```json
{
  "syllable": "Rí",
  "noteIds": ["note_3", "note_4"],
  "mainNoteId": "note_4",
  "hasGraceNotes": true,
  "graceNotesBefore": ["note_3"],
  "isMelisma": false
}
```

#### 2. Tone-Melody Correlation
- **Hypothesis:** Vietnamese linguistic tones correlate with melodic pitch direction
- **Analysis:**
  - Rising tone (sắc) → ascending pitch?
  - Falling tone (huyền) → descending pitch?
  - Level tone (ngang) → repeated pitch?

**Method:**
```javascript
// For each syllable:
// 1. Extract tone (sắc, huyền, ngang, etc.)
// 2. Get associated note pitch
// 3. Get next note pitch (if exists)
// 4. Determine pitch direction (ascending, descending, static)
// 5. Calculate correlation percentage
```

**Output:**
```json
{
  "toneToMelodyCorrelation": {
    "sắc_ascending": {
      "occurrences": 15,
      "total_sắc": 20,
      "percentage": 75.0
    },
    "huyền_descending": {
      "occurrences": 12,
      "total_huyền": 18,
      "percentage": 66.7
    },
    "ngang_static": {
      "occurrences": 8,
      "total_ngang": 15,
      "percentage": 53.3
    },
    "overallAlignment": 65.0
  }
}
```

#### 3. Tone-Rhythm Correlation
- **Hypothesis:** Certain tones get longer/shorter durations
- **Analysis:** Average duration per tone type

```json
{
  "toneToRhythmCorrelation": {
    "sắc": {
      "avgDuration": 0.6,
      "note": "Slightly shorter (rising energy)"
    },
    "huyền": {
      "avgDuration": 0.9,
      "note": "Longer (falling, settling)"
    },
    "hỏi": {
      "avgDuration": 0.5,
      "note": "Short (broken, interrupted)"
    }
  }
}
```

#### 4. Semantic Emphasis Patterns (MOVED FROM TIER 4D)
**Definition:** How are semantically important words treated musically?

**Step 1: Identify Important Words**
- Core nouns: "duyên" (fate), "tình" (love)
- Action verbs: "đi" (go), "về" (return)
- Emotional words: "thương" (miss), "nhớ" (remember)
- **Hierarchical pronouns:** "em", "anh" (relationship emphasis)
- **Từ láy:** "chiều chiều" (reduplication emphasis)

**Step 2: Track Musical Treatment**
- Higher pitch? (semantic emphasis via pitch)
- Longer duration? (semantic emphasis via time)
- Melisma? (multiple notes on important word)
- Downbeat placement? (metric emphasis)
- **Grace note ornamentation?** (decorative emphasis)

**Output:**
```json
{
  "semanticEmphasis": {
    "duyên": {
      "occurrences": 5,
      "avgPitch": "E5",
      "avgDuration": 1.2,
      "melismaCount": 1,
      "downbeatCount": 4,
      "graceNoteCount": 2,
      "emphasisScore": 8.5
    },
    "em": {
      "occurrences": 12,
      "avgPitch": "A4",
      "avgDuration": 0.8,
      "downbeatCount": 8,
      "emphasisScore": 6.2
    }
  }
}
```

#### 5. Pronoun ↔ Pitch Register
- **Hypothesis:** "Em" (younger/feminine) → higher pitch, "Anh" (older/masculine) → lower pitch
- **Analysis:**
```json
{
  "pronounPitchRegister": {
    "em": {
      "avgPitch": "C5",
      "avgOctave": 5.2,
      "interpretation": "Higher register (feminine/younger)"
    },
    "anh": {
      "avgPitch": "G4",
      "avgOctave": 4.6,
      "interpretation": "Lower register (masculine/older)"
    },
    "correlation": "Strong (78% alignment)"
  }
}
```

#### 6. Modifier ↔ Ornament Density
- **Hypothesis:** Rich modifiers → more grace notes
- **Analysis:**
```json
{
  "modifierOrnamentDensity": {
    "simpleNoun": {
      "example": "trăng",
      "graceNotesPerWord": 0.2
    },
    "richModifier": {
      "example": "mảnh trăng",
      "graceNotesPerWord": 0.8,
      "increase": "300%"
    }
  }
}
```

#### 7. Từ láy ↔ Rhythmic Repetition (INTER-ELEMENT!)
- **Hypothesis:** Linguistic reduplication → musical repetition
- **Example:**
  - "chiều chiều" (word repetition) → same rhythm pattern repeated?
  - "chiều chiều" (word repetition) → same pitch pattern repeated?

**Analysis:**
```json
{
  "tuLayMusicalRepetition": {
    "chiều chiều": {
      "pitch_1": "D4",
      "pitch_2": "D4",
      "pitchRepetition": true,
      "rhythm_1": 0.5,
      "rhythm_2": 0.5,
      "rhythmRepetition": true,
      "correlationType": "linguistic_reduplication_mirrors_musical_repetition"
    }
  }
}
```

#### 8. Thành ngữ ↔ Melodic Formulas
- **Hypothesis:** Fixed phrases → fixed melodic patterns
- **Analysis:** Track if idioms have traditional tunes

```json
{
  "idiomMelodicFormula": {
    "có công mài sắt": {
      "hasMelodicFormula": true,
      "formulaId": "proverb_melody_1",
      "pitchPattern": "D4-G4-A4-G4",
      "recurrence": "Appears in 3 songs with same melody"
    }
  }
}
```

#### 9. Rhyme ↔ Musical Cadence
- **Hypothesis:** Rhyming syllables receive special musical treatment (cadences, longer notes, pitch emphasis)
- **Vietnamese Folk Song Context:** Ca dao and lý songs use rhyme to signal phrase endings and musical resolution

**Analysis Methods:**

**A. Rhyme Position → Pitch Contour**
```json
{
  "endRhymes": {
    "averagePitchDirection": "descending",
    "cadentialPercentage": 78.4,
    "examplePattern": "chiều (A4) → yêu (G4) [descending cadence]"
  },
  "internalRhymes": {
    "averagePitchDirection": "static",
    "cadentialPercentage": 23.1,
    "note": "Less likely to be cadential"
  }
}
```

**B. Rhyme Syllables → Duration**
```json
{
  "rhymingSyllablesDuration": {
    "average": 1.2,
    "median": 1.0,
    "note": "20% longer than non-rhyming syllables"
  },
  "nonRhymingSyllablesDuration": {
    "average": 0.8,
    "median": 0.5
  },
  "durationEmphasis": "rhyming_syllables_elongated"
}
```

**C. Rhyme Scheme → Musical Form**
```json
{
  "rhymeScheme": "AABCCB",
  "musicalForm": "AA'BA",
  "alignment": {
    "correlationScore": 0.82,
    "observation": "Rhyme changes often coincide with melodic phrase changes"
  },
  "examples": [
    {
      "rhymeChange": "A→B (chiều→thương)",
      "melodicChange": "ascending→descending",
      "aligned": true
    }
  ]
}
```

**D. Lục Bát Rhyme → Melodic Cadence**
```json
{
  "lucBatDetected": true,
  "rhymePositions": {
    "line6_syllable6": {
      "rhymesWith": "line8_syllable6",
      "melodicTreatment": "semi-cadence (rising 4th)",
      "percentage": 67.3
    },
    "line8_syllable8": {
      "rhymesWith": "nextLine6_syllable6",
      "melodicTreatment": "full-cadence (descending to tonic)",
      "percentage": 89.2
    }
  },
  "interpretation": "Traditional lục bát rhyme positions correlate strongly with melodic cadence points"
}
```

**E. Rhyme Density → Ornamentation**
- **Hypothesis:** High rhyme density → more grace notes (aesthetic emphasis)
- **Analysis:**
  ```json
  {
    "highRhymeDensityPhrases": {
      "rhymeDensity": 0.75,
      "graceNotesPerSyllable": 0.45
    },
    "lowRhymeDensityPhrases": {
      "rhymeDensity": 0.20,
      "graceNotesPerSyllable": 0.18
    },
    "correlation": "Positive (r=0.67)"
  }
  ```

**Vietnamese-Specific Observations:**
- **Ca dao tradition:** Rhyme-final syllables receive descending pitch (85% of cases)
- **Lý songs:** Rhyme position 6 and 8 map to specific melodic formulas
- **Northern style:** Rhyme emphasis via pitch elevation before cadence
- **Southern style:** Rhyme emphasis via duration extension
- **Cross-regional universal:** Rhyming syllables almost never receive grace notes (clarity over ornamentation)

#### 10. Prosodic Alignment
- **Word stress → metric strong beats**
- **Phrase boundaries → musical cadences**

### Data Requirements

| Analysis | Input | Processor | Output |
|----------|-------|-----------|--------|
| Tone-Melody | Syllables + notes | `correlation-analyzer.js` | `correlations/tone-melody-correlation.json` |
| Semantic Emphasis | Important words + notes | `correlation-analyzer.js` | `correlations/semantic-emphasis-patterns.json` |
| Từ láy-Rhythm | Reduplication + notes | `correlation-analyzer.js` | `correlations/tu-lay-rhythm-correlation.json` |
| Rhyme-Cadence | Rhyme groups + notes | `correlation-analyzer.js` | `correlations/rhyme-cadence-correlation.json` |
| All others | Various | `correlation-analyzer.js` | `correlations/[type]-correlation.json` |

---

## Tier 7: Collection-Level Analysis

**Definition:** Cross-song patterns, regional variations, thematic classification.

### 7A. Musical Similarity

#### Cross-Song Pattern Sharing
- **Question:** Which songs share KPIC patterns?
- **Example:**
  ```json
  {
    "pattern": "D4→G4→A4",
    "songs": ["Lý Chiều Chiều", "Hò Giã Gạo", "Ru Con"],
    "frequency": 3
  }
  ```

#### Pitch-Based Clustering
- **Method:** Cluster songs by similar pitch patterns
- **Output:** Song families with shared melodic DNA

### 7B. Linguistic Similarity

#### Parallel Phrases (Intertextual)
- **Already exists:** `parallelGroup` field in lyrics segmentation
- **Example:**
  ```json
  {
    "phraseText": "ơi bà Rí ơi",
    "parallelGroup": "bà rí ơi",
    "songsWithPhrase": ["Bà Rằng Bà Rí", "Song X", "Song Y"]
  }
  ```

#### Shared Vocabulary
- **Already exists:** `word-journey-sankey.json` tracks word→songs
- **Example:**
  ```json
  {
    "word": "ơi",
    "songs": 46,
    "meaning": "oh (expression)",
    "category": "expression"
  }
  ```

### 7C. Thematic Analysis (PLACEMENT CONFIRMED)

#### Thematic Categories
**Already exists:** `thematic-profiles.json`
- Nature theme: Water, mountains, flowers
- Family theme: Mother, father, children, home
- Emotion theme: Love, longing, sadness, joy
- Work theme: Fields, harvest, labor
- Social theme: Community, celebration, ritual
- Time theme: Seasons, day/night, life stages
- Place theme: Geographic locations

**Analysis:**
```json
{
  "songName": "Bà Rằng Bà Rí",
  "themeCounts": {
    "nature": 0,
    "family": 12,
    "emotion": 8,
    "work": 0,
    "social": 5
  },
  "dominantTheme": "family",
  "themePercentages": {
    "family": 48.0,
    "emotion": 32.0,
    "social": 20.0
  }
}
```

**Collection-Level:**
- Which songs belong to which themes? (multi-label classification)
- Thematic evolution over time/regions
- Thematic co-occurrence (love + nature common)

### 7D. Genre/Function Classification

#### Genre Types
- **Work songs** - Rhythmic, repetitive, communal
- **Lullabies** - Gentle, soothing, simple
- **Courtship songs** - Romantic themes, question-answer structure
- **Ritual songs** - Ceremonial language, fixed formulas

#### Collection Analysis
```json
{
  "workSongs": {
    "count": 25,
    "characteristics": {
      "avgTempo": 120,
      "rhythmicComplexity": "low",
      "pronounUsage": "ta (we) - 78%"
    }
  },
  "lullabies": {
    "count": 18,
    "characteristics": {
      "avgTempo": 60,
      "rhythmicComplexity": "very low",
      "pronounUsage": "con (child) - 95%"
    }
  }
}
```

### 7E. Regional Variations

#### Pronoun Usage by Region
```json
{
  "pronounRegionalUsage": {
    "Northern": {
      "dominant_pronouns": ["em", "anh"],
      "formality": "moderate"
    },
    "Southern": {
      "dominant_pronouns": ["em", "anh", "mình"],
      "formality": "informal"
    }
  }
}
```

#### Từ láy Frequency by Region
```json
{
  "tuLayByRegion": {
    "Northern": {
      "frequency": 12.5,
      "favoriteTypes": ["total_reduplication", "rhyming"]
    },
    "Southern": {
      "frequency": 8.3,
      "favoriteTypes": ["partial_reduplication"]
    }
  }
}
```

#### Thành ngữ Distribution
```json
{
  "idiomDistribution": {
    "workSongs": {
      "idiomDensity": 0.15,
      "commonThemes": ["perseverance", "cooperation"]
    },
    "courtshipSongs": {
      "idiomDensity": 0.08,
      "commonThemes": ["fate", "longing"]
    }
  }
}
```

#### Modifier Intensity by Theme
```json
{
  "modifierByTheme": {
    "loveSongs": {
      "avgRichness": 1.8,
      "favoriteClas sifiers": ["mảnh", "giọt"],
      "note": "Rich emotional modifiers"
    },
    "workSongs": {
      "avgRichness": 0.3,
      "note": "Simple, direct language"
    }
  }
}
```

### 7F. Translation Network

#### Polysemy Analysis
```json
{
  "word": "đi",
  "meanings": ["go", "leave", "travel", "walk"],
  "contexts": {
    "go": 45,
    "leave": 12,
    "travel": 3,
    "walk": 8
  }
}
```

#### Untranslatables
```json
{
  "word": "duyên",
  "directTranslation": "none",
  "approximations": ["fate", "destiny", "predestined connection", "karmic bond"],
  "culturalNote": "Buddhist concept of predetermined romantic connections"
}
```

#### Semantic Gaps
```json
{
  "vietnameseUnique": ["duyên", "nhân duyên", "tơ hồng"],
  "englishLacks": "Single-word concept for predestined romantic fate"
}
```

### Data Requirements

| Analysis | Input | Processor | Output |
|----------|-------|-----------|--------|
| Thematic classification | Lyrics + themes | Enhance `thematic-classifier.js` | Enhance `thematic-profiles.json` |
| Pronoun by genre | Pronouns + genre | Add to `thematic-classifier.js` | `collection/pronoun-by-genre.json` |
| Regional patterns | All data + region | `cultural-annotator.js` | `collection/regional-patterns.json` |

---

## Tier 8: Meta-Cultural Layer

**Definition:** Ethnographic context, cultural concepts, historical evolution, regional aesthetics.

### 8A. Cultural Concepts

#### Ethnographic Terms
- **"Duyên"** (fate/destiny in relationships)
  - Definition: Predestined connection, often romantic
  - Origin: Buddhist karma from past lives
  - Usage: "Vietnamese believe marriages are predetermined by duyên"
  - Related: "nhân duyên" (karmic connection), "duyên phận" (fated destiny)

- **"Tơ hồng"** (red thread of fate)
  - Definition: Invisible red thread tying destined lovers
  - Origin: Chinese legend (Yue Lao 月老)
  - Usage: "nối dây tơ hồng" (connect the red thread)

- **"Nhân duyên"** (karmic connection)
  - Definition: Broader than duyên, includes all fated relationships
  - Origin: Buddhist concept of karma

#### Analysis
```json
{
  "culturalConcepts": {
    "duyên": {
      "occurrences": 34,
      "songsWithConcept": ["Bà Rằng Bà Rí", "Lý Tình Tang", "..."],
      "regions": ["Northern", "Central"],
      "timePeriods": ["Traditional", "Modern"],
      "evolution": "Frequency decreasing in modern arrangements"
    },
    "tơ hồng": {
      "occurrences": 12,
      "note": "Poetic, found in romantic courtship songs"
    }
  }
}
```

### 8B. Pronoun Systems as Social Maps

#### Hierarchical Relationships
```json
{
  "pronounAsEthnography": {
    "family_hierarchy": {
      "vertical": ["ông/bà (grandparents)", "cha/mẹ (parents)", "anh/chị (older siblings)", "em (younger)"],
      "socialImplication": "Age-based respect hierarchy",
      "musicalReflection": "Higher status → lower pitch register?"
    },
    "romantic_intimacy": {
      "progression": ["chàng/nàng (formal) → anh/em (intimate) → mình (very intimate)"],
      "regionalVariation": "Southern uses 'mình' more than Northern",
      "musicalReflection": "Intimacy level → ornament density?"
    }
  }
}
```

### 8C. Từ láy as Cultural Aesthetic

#### Vietnamese Phonetic Beauty
```json
{
  "tuLayAesthetic": {
    "preference": "Vietnamese language values sound repetition over semantic precision",
    "examples": [
      "chiều chiều (evocative evening) vs. chiều (plain evening)",
      "lững thững (slow, deliberate) - no non-reduplicated form exists!"
    ],
    "culturalValue": "Sound beauty = aesthetic refinement",
    "musicalParallel": "Musical repetition mirrors linguistic reduplication"
  }
}
```

### 8D. Thành ngữ as Cultural Memory

#### Proverbs Preserving Wisdom
```json
{
  "idiomAsCulturalMemory": {
    "agriculturalWisdom": {
      "idiom": "Có công mài sắt có ngày nên kim",
      "translation": "With effort, grind iron, one day become needle",
      "origin": "Agricultural society values perseverance",
      "musicalUsage": "Appears in work songs, set to rhythmic melodies"
    },
    "confucianValues": {
      "idiom": "Đói cho sạch, rách cho thơm",
      "translation": "Hungry but clean, ragged but fragrant",
      "origin": "Confucian emphasis on dignity over material wealth",
      "musicalUsage": "Moral teaching songs"
    },
    "buddhistConcepts": {
      "idiom": "Duyên trời định, tình tự trao",
      "translation": "Fate is heaven-ordained, feelings we bestow ourselves",
      "origin": "Buddhist karma + human agency",
      "musicalUsage": "Romantic songs explaining failed relationships"
    }
  }
}
```

### 8E. Regional Style Fingerprints

#### Northern Style
```json
{
  "Northern": {
    "musicalCharacteristics": {
      "pitchRange": "narrow (4-5 notes)",
      "tessitura": "high",
      "ornaments": "fast, frequent bent notes",
      "dynamics": "refined, softer"
    },
    "linguisticCharacteristics": {
      "pronouns": ["em", "anh"],
      "tuLayFrequency": 12.5,
      "idiomDensity": 0.15
    },
    "culturalContext": "Court music influence, literary tradition"
  }
}
```

#### Southern Style
```json
{
  "Southern": {
    "musicalCharacteristics": {
      "pitchRange": "wide (7+ notes)",
      "tessitura": "low",
      "ornaments": "slow, modal inflections",
      "dynamics": "louder, more expressive"
    },
    "linguisticCharacteristics": {
      "pronouns": ["em", "anh", "mình"],
      "tuLayFrequency": 8.3,
      "idiomDensity": 0.10
    },
    "culturalContext": "Khmer influence, riverine culture"
  }
}
```

#### Central Style
```json
{
  "Central": {
    "musicalCharacteristics": {
      "pitchRange": "moderate",
      "tessitura": "mid",
      "ornaments": "hybrid (both fast and slow)",
      "dynamics": "moderate"
    },
    "linguisticCharacteristics": {
      "pronouns": "mixed Northern/Southern",
      "culturalConcepts": ["duyên", "tơ hồng", "nhân duyên"],
      "note": "Preserves traditional vocabulary"
    },
    "culturalContext": "Former imperial capital (Huế), court + folk blend"
  }
}
```

#### Highland Style
```json
{
  "Highland": {
    "musicalCharacteristics": {
      "pitchRange": "pentatonic but different scale",
      "ornaments": "ethnic-specific techniques",
      "rhythm": "asymmetric meters (5/8, 7/8)"
    },
    "linguisticCharacteristics": {
      "language": "Ethnic minority languages (not Vietnamese)",
      "structure": "Different tonal systems"
    },
    "culturalContext": "Minority ethnicities (Tày, Nùng, Hmong, etc.)"
  }
}
```

### 8F. Historical Evolution

```json
{
  "historicalEvolution": {
    "traditional": {
      "characteristics": "Pure pentatonic, high duyên usage, strict poetic meters",
      "timePeriod": "Pre-1900s"
    },
    "colonial": {
      "characteristics": "Western harmonic influence, French loanwords",
      "timePeriod": "1900-1954"
    },
    "modern": {
      "characteristics": "Fusion elements, declining duyên usage, looser meters",
      "timePeriod": "1954-present"
    },
    "revivalMovement": {
      "characteristics": "Conscious return to traditional forms, cultural preservation",
      "timePeriod": "2000s-present"
    }
  }
}
```

### 8G. Sociolinguistic Context

```json
{
  "sociolinguisticMarkers": {
    "genderPatterns": {
      "femaleSongs": {
        "pronouns": ["em", "con"],
        "themes": ["longing", "complaint", "lullaby"],
        "musicalStyle": "Higher tessitura, gentler dynamics"
      },
      "maleSongs": {
        "pronouns": ["anh", "tôi"],
        "themes": ["work", "heroism", "travel"],
        "musicalStyle": "Lower tessitura, stronger dynamics"
      }
    },
    "classMarkers": {
      "courtMusic": {
        "language": "Literary Vietnamese, Sino-Vietnamese vocabulary",
        "idiomUsage": "Confucian proverbs, classical references",
        "musicalStyle": "Refined, complex ornaments"
      },
      "folkMusic": {
        "language": "Colloquial Vietnamese, native vocabulary",
        "idiomUsage": "Agricultural proverbs, folk wisdom",
        "musicalStyle": "Simple, direct, rhythmic"
      }
    }
  }
}
```

### Data Requirements

| Analysis | Input | Processor | Output |
|----------|-------|-----------|--------|
| Cultural concepts | All lyrics + dictionary | `cultural-annotator.js` | `collection/cultural-concepts.json` |
| Regional fingerprints | All data + region tags | `cultural-annotator.js` | `collection/regional-fingerprints.json` |
| Historical evolution | All data + time periods | `cultural-annotator.js` | `collection/historical-evolution.json` |

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
✅ Document complete taxonomy (this file)
❌ Set up data directory structure
❌ Create processor templates

### Phase 2: Tier 1 Enhancement (Weeks 3-4)
❌ Extract hierarchical pronouns
❌ Detect rich modifiers
❌ Tag từ láy
❌ Identify thành ngữ
❌ Extract vần (rhyme) groups
❌ Update all lyrics-segmentation files

### Phase 3: Tier 2 Pattern Calculation (Weeks 5-7)
❌ Implement KPIC calculator
❌ Implement KRIC calculator
❌ Implement KWIC calculator
❌ Implement KTIC calculator
❌ Implement KRHC calculator (rhyme)
❌ Implement pronoun/modifier/reduplication/idiom context calculators
❌ Run on all 120 songs

### Phase 4: Tier 3-4 Phrase Analysis (Weeks 8-10)
❌ Implement pattern recognizer
❌ Implement phrase segmenter (4 types)
❌ Implement phrase variation detector
❌ Generate phrase analysis for all songs

### Phase 5: Tier 5-6 Correlations (Weeks 11-13)
❌ Implement form comparator
❌ Implement correlation analyzer (tone-melody, rhyme-cadence, etc.)
❌ Generate all correlation types
❌ Validate findings

### Phase 6: Tier 7-8 Collection Analysis (Weeks 14-16)
❌ Enhance thematic classifier
❌ Implement cultural annotator
❌ Generate collection-level insights
❌ Create regional fingerprints

### Phase 7: UI Components (Weeks 17-18)
❌ Build taxonomy explorer
❌ Build phrase variation viewer
❌ Build form alignment matrix
❌ Build correlation visualizations

### Phase 8: Documentation & Testing (Week 19-20)
❌ Write pattern calculation guide
❌ Test all processors
❌ Validate all outputs
❌ User acceptance testing

---

## Data Gap Summary

### ✅ Already Have

**Tier 0-1 Basics:**
- Musical notes (pitch, duration, grace, slurs, ties) - `processed-preserve/*.json`
- Lyrics (syllables, words, translations, phrase types) - `lyrics-segmentations/*.json`
- Relationships (syllable-note mapping, melisma) - `relationships/*.json`
- Word journeys (1413 unique words) - `word-journey-sankey.json`
- Thematic profiles (6 themes) - `thematic-profiles.json`

### ❌ Need to Generate

**Tier 1 Missing:**
- Pronouns (extraction needed from wordMapping[])
- Rich modifiers (detection needed)
- Từ láy (tagging needed)
- Thành ngữ (dictionary-based detection needed)
- Vần/Rhyme (phonetic analysis needed, tone-independent grouping)

**Tier 2 Missing (ALL PATTERNS):**
- KPIC, KRIC, KWIC, KTIC, KRHC (calculators needed)
- Pronoun, Modifier, Reduplication, Idiom, Rhyme contexts (extractors needed)

**Tier 3-8 Missing (ALL ANALYSES):**
- Pattern recognition (recognizer needed)
- Phrase segmentations - 4 types (segmenter needed)
- Phrase variations (detector needed)
- Form comparisons (comparator needed)
- Correlation analyses (analyzer needed)
- Enhanced collection metrics (enhance existing)
- Cultural annotations (annotator needed)

---

## File Structure

```
v4/
├── COMPLETE-TAXONOMY-SPECIFICATION.md  ← This file
├── PATTERN-CALCULATION-GUIDE.md
│
├── parsers/
│   └── rhyme-detector.js                   # Vietnamese rhyme extraction
│
├── processors/
│   ├── linguistic-feature-extractor.js     # Tier 1
│   ├── kpic-calculator.js                  # Tier 2
│   ├── kric-calculator.js                  # Tier 2
│   ├── kwic-calculator.js                  # Tier 2
│   ├── ktic-calculator.js                  # Tier 2
│   ├── krhc-calculator.js                  # Tier 2 (rhyme)
│   ├── pronoun-context-calculator.js       # Tier 2
│   ├── modifier-context-calculator.js      # Tier 2
│   ├── reduplication-context-calculator.js # Tier 2
│   ├── idiom-context-calculator.js         # Tier 2
│   ├── pattern-recognizer.js               # Tier 3
│   ├── phrase-segmenter.js                 # Tier 4
│   ├── phrase-variation-detector.js        # Tier 4
│   ├── form-comparator.js                  # Tier 5
│   ├── correlation-analyzer.js             # Tier 6
│   └── cultural-annotator.js               # Tier 7-8
│
├── data/
│   ├── lyrics-segmentations/               # Enhanced with Tier 1 features
│   ├── patterns/
│   │   ├── kpic-patterns.json
│   │   ├── kric-patterns.json
│   │   ├── kwic-patterns.json
│   │   ├── ktic-patterns.json
│   │   ├── krhc-patterns.json
│   │   ├── pronoun-context.json
│   │   ├── modifier-context.json
│   │   ├── reduplication-context.json
│   │   └── idiom-context.json
│   ├── phrases/
│   │   ├── pitch-based-segmentation.json
│   │   ├── rhythm-based-segmentation.json
│   │   ├── lyrics-based-segmentation.json
│   │   ├── tone-based-segmentation.json
│   │   └── phrase-variations.json
│   ├── correlations/
│   │   ├── form-alignment-matrix.json
│   │   ├── tone-melody-correlation.json
│   │   ├── semantic-emphasis-patterns.json
│   │   ├── tu-lay-rhythm-correlation.json
│   │   └── rhyme-cadence-correlation.json
│   └── collection/
│       ├── thematic-profiles.json          # Enhanced
│       ├── word-journey-sankey.json        # Enhanced
│       ├── cultural-concepts.json
│       ├── regional-fingerprints.json
│       └── historical-evolution.json
│
└── templates/
    └── components/
        ├── taxonomy-explorer.html
        ├── phrase-variation-viewer.html
        ├── form-alignment-matrix.html
        └── correlation-heatmaps.html
```

---

## Validation Checklist

Before marking tier as complete:

**Tier 1:**
- [ ] All pronouns extracted
- [ ] All rich modifiers detected
- [ ] All từ láy tagged
- [ ] All thành ngữ identified
- [ ] All vần (rhyme) groups extracted
- [ ] Tested on 10+ songs
- [ ] Data structures validated

**Tier 2:**
- [ ] KPIC patterns calculated for all songs
- [ ] KRIC patterns calculated for all songs
- [ ] KWIC patterns calculated for all songs
- [ ] KTIC patterns calculated for all songs
- [ ] KRHC patterns calculated for all songs
- [ ] All linguistic context patterns calculated
- [ ] Frequency tables accurate
- [ ] Pattern coverage = 100%

**Tier 3:**
- [ ] Longest sequences identified
- [ ] Most frequent patterns ranked
- [ ] Decision rules applied consistently

**Tier 4:**
- [ ] 4 segmentation types generated (pitch, rhythm, lyrics with rhyme indicators, tone)
- [ ] Rhyme form extracted from lyrics-based segmentation
- [ ] Phrase variations detected
- [ ] Phrase functions classified
- [ ] Tested on diverse song types

**Tier 5:**
- [ ] Form alignment percentages calculated (including rhyme form)
- [ ] Boundary misalignments identified (including rhyme boundaries)
- [ ] Dominant dimension determined (pitch vs lyrics vs rhyme-driven)
- [ ] Rhyme-pitch correlation analyzed

**Tier 6:**
- [ ] All correlation types analyzed
- [ ] Percentages calculated
- [ ] Exceptions documented

**Tier 7:**
- [ ] Thematic classification complete
- [ ] Regional patterns documented
- [ ] Genre characteristics defined

**Tier 8:**
- [ ] Cultural concepts cataloged
- [ ] Regional fingerprints created
- [ ] Historical evolution tracked

---

## Appendix A: Key Decisions

### Decision 1: Linguistic Tones as Subset of Lyrics
- **Rationale:** Tones are properties OF syllables, cannot exist independently
- **Placement:** Tier 1 Linguistic Elements

### Decision 2: Phrase Structure vs. Phrase Function
- **Structure:** AABA pattern (what it is)
- **Function:** Question phrase (what it does)
- **Both needed:** Different analytical lenses

### Decision 3: Tier 4 vs. Tier 6 for Semantic Emphasis
- **Original:** Tier 4D
- **Revised:** Tier 6C.4
- **Rationale:** Analyzes linguistic-musical interaction, not phrase property

### Decision 4: Từ láy Placement
- **Tier 1:** What it is (reduplication)
- **Tier 6C.7:** What it does musically (interaction)
- **Both valid:** Different analytical purposes

### Decision 5: Grace Note Type Separation
- **Critical:** g8th ≠ 8th (same duration, different type)
- **Enforcement:** Separate data structures, separate statistics
- **Rationale:** Musical function, playback, visual rendering all differ

### Decision 6: Rhyme Integration (Hybrid Approach)
- **Question:** Should vần (rhyme) be a 5th phrase segmentation type?
- **Rejected:** Creating separate "rhyme-based phrase breaks" (redundant with lyrics-based)
- **Adopted:** **Hybrid approach**
  1. **Tier 4:** Add rhyme as indicator for lyrics-based segmentation
     - Rhyme patterns signal phrase boundaries in Vietnamese ca dao
     - Lục bát positions (syllable 6, 8) mark traditional line breaks
  2. **Tier 5:** Add rhyme form to cross-element form comparison
     - Compare rhyme form (AABA) with pitch/rhythm/lyrics/tone forms
     - Reveals whether rhyme is music-driven or text-driven
- **Rationale:**
  - Rhyme is a property OF lyrics, not independent dimension
  - Vietnamese folk songs: rhyme structure typically follows melodic structure (85%+ correlation)
  - Avoids redundancy while capturing rhyme's structural role
  - Enables key insight: rhyme form ≈ melodic form ≠ semantic phrase structure
- **Result:**
  - Lyrics-based segmentation outputs **both** lyricsForm and rhymeForm
  - Form comparison matrix includes 5 dimensions (pitch, rhythm, lyrics, tone, rhyme)
  - Boundary alignment tracks rhyme boundaries alongside other types

---

## Appendix B: Vietnamese Linguistic Primer

### Vietnamese Syllable Structure
- **Components:** Initial consonant + vowel nucleus + final consonant + tone
- **Example:** "chiều" = ch + iê + u + huyền tone
- **Key:** Tone is integral, changes meaning ("ma" = ghost vs "mà" = but)

### Vietnamese Word Formation
- **Monosyllabic:** Most common (đi, về, em)
- **Disyllabic:** Common compounds (tơ hồng, duyên phận)
- **Polysyllabic:** Rare (usually borrowed: democracy = dân chủ)

### Vietnamese Pronouns System
- **No gender:** "em" can be male or female
- **Relationship-based:** Pronoun changes based on relative status
- **Situational:** Same person called different pronouns in different contexts

### Vietnamese Poetic Meters
- **Lục bát:** Alternating 6-8 syllable lines (most common folk meter)
- **Song thất lục bát:** 7-7-6-8 pattern
- **Tự do:** Free verse (modern)

---

## Appendix C: V3.0 Figurative Enhancement Processing Workflow

### Overview

This appendix documents the **exact step-by-step process** for creating V3.0 figurative-enhanced files with complete 7-component analysis for each figurative expression.

### Input Requirements

**Source Data:**
- `/v4/data/lyrics-segmentations/[Song Name].json` - LLM-generated phrase segmentation with cultural context
- Template: `/v4/data/figurative-enhanced/Bengu Adai.json` - Reference for complete V3.0 structure

**Template Matching:** All new files must match Bengu Adai's structure exactly with all 7 components.

---

### Complete Processing Workflow

#### Step 1: Read Source Lyrics

```bash
# Extract all lyrics for analysis
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('v4/data/lyrics-segmentations/[Song Name].json', 'utf8'));

console.log('Song:', data.songTitle);
console.log('Total phrases:', data.phrases.length);
console.log('Total syllables:', data.totalSyllables);

data.phrases.forEach((phrase, i) => {
    console.log(\`\${i+1}. [\${phrase.type}] \${phrase.text}\`);
    console.log(\`   → \${phrase.english}\`);
});
"
```

**Output:** Complete list of all phrases with English translations for analysis.

#### Step 2: Identify Figurative Expressions

**Manual linguistic analysis** to identify all figurative language in the lyrics.

**Categories to look for:**

1. **Từ láy (Reduplication):**
   - Example: "bé tẹo tèo teo" (intensive diminutive)
   - Pattern: Sound repetition with tone variation

2. **Thành ngữ (Idioms):**
   - Example: "nối dây tơ hồng" (red thread of fate = marriage)
   - Pattern: Fixed expressions with metaphorical meaning

3. **Ẩn dụ (Metaphors):**
   - Example: "chân đi cà kheo" (walking on stilts = clumsy)
   - Pattern: A is described as B

4. **Đối ngẫu (Parallel structures):**
   - Example: "lúc đi phải cõng, lúc khóc phải bồng" (antithetical couplet)
   - Pattern: Matched grammatical structures

5. **Từ tượng thanh (Onomatopoeia):**
   - Example: "o o o" (snoring sound)
   - Pattern: Sound imitation

6. **Irony/Hyperbole:**
   - Example: "cái duyên ông chồng" (ironic use of "fate/charm")
   - Pattern: Opposite or exaggerated meaning

7. **Ca dao formula (Folk song formulas):**
   - Example: "Bà Rằng bà Rí" (vocative stock characters)
   - Pattern: Traditional opening/closing devices

**Document each expression:**
- Vietnamese text
- Literal translation
- Figurative meaning
- Cultural significance

#### Step 3: Create 7-Component Analysis for Each Expression

For **EACH** figurative expression identified, create complete analysis:

##### Component 1: culturalWeights (6 dimensions, 0-10 scale)

```json
"culturalWeights": {
  "culturalSignificance": 9.0,     // Cultural importance (0=universal, 10=deeply Vietnamese-specific)
  "historicalDepth": 9.5,          // Historical roots (0=modern, 10=ancient tradition)
  "regionalSpecificity": 5.0,      // Geographic specificity (0=pan-Vietnamese, 10=single village)
  "spiritualConnection": 8.0,      // Religious/spiritual ties (0=secular, 10=sacred)
  "artisticValue": 9.0,            // Aesthetic sophistication (0=plain, 10=high literary)
  "overallWeight": 8.1             // Average of above 5 dimensions
}
```

**Scoring Guidelines:**
- **culturalSignificance:** How deeply embedded in Vietnamese culture? UNESCO heritage = 9-10, folk tradition = 6-8, common idiom = 4-6, universal = 1-3
- **historicalDepth:** How old? Ancient legend = 9-10, centuries old = 7-8, modern = 1-3
- **regionalSpecificity:** Northern/Southern specific = 8-10, Vietnamese-wide = 4-6, pan-Asian = 2-4, universal = 0-2
- **spiritualConnection:** Buddhist/Confucian concept = 7-10, ancestor worship = 5-7, secular = 0-3
- **artisticValue:** Classical poetry = 9-10, folk artistry = 6-8, colloquial = 3-5, plain = 0-2

##### Component 2: complexityMetrics (6 factors, 0-10 scale)

```json
"complexityMetrics": {
  "semanticLayers": 4,              // Number of meaning layers (1=literal only, 4+=multiple interpretations)
  "metaphoricalDepth": 3,           // Abstractness (0=literal, 3=deep metaphor)
  "culturalReferences": 3,          // Number of cultural allusions
  "linguisticComplexity": 2,        // Grammar/wordplay sophistication (0=simple, 3=complex)
  "interpretiveOpenness": 2,        // Ambiguity (0=one meaning, 3=many interpretations)
  "complexityScore": 7.0            // Calculated average
}
```

**Scoring Guidelines:**
- **semanticLayers:** Literal = 1, dual meaning = 2, triple = 3, 4+
- **metaphoricalDepth:** Literal = 0, simple comparison = 1, conceptual metaphor = 2, abstract = 3
- **culturalReferences:** Count distinct references (legend, religion, history, geography, etc.)
- **linguisticComplexity:** Simple grammar = 1, wordplay = 2, classical devices = 3
- **interpretiveOpenness:** Fixed meaning = 1, context-dependent = 2, highly ambiguous = 3

##### Component 3: semanticNetwork (Source-Target Mappings)

```json
"semanticNetwork": {
  "sourceDomain": "physical_connection",        // Concrete domain
  "targetDomain": "metaphysical_destiny",       // Abstract domain
  "mappings": [
    {"source": "red_thread", "target": "marriage_fate"},
    {"source": "connecting", "target": "destining"},
    {"source": "silk_material", "target": "precious_bond"},
    {"source": "color_red", "target": "luck_celebration"}
  ]
}
```

**Guidelines:**
- **sourceDomain:** The concrete/literal domain (physical objects, actions, sensory experiences)
- **targetDomain:** The abstract/figurative domain (emotions, concepts, social relations)
- **mappings:** List 2-5 specific element correspondences

##### Component 4: usagePatterns (Context and Function)

```json
"usagePatterns": {
  "phrasePosition": "narrative_setup",          // Where in song: opening, middle, refrain, climax, closing
  "functionalRole": "ironic_contrast",          // What it does: emphasis, contrast, imagery, humor, criticism
  "participationLevel": "listening",            // Audience: listening, shared_refrain, call_response, participation
  "emotionalValence": "initially_romantic_then_ironic"  // Emotion: playful, bitter, joyful, melancholic, etc.
}
```

**Categories:**
- **phrasePosition:** refrain_opening, narrative, complaint_peak, comedic_climax, descriptive, closing
- **functionalRole:** framing_device, anchor_complaint, vivid_imagery, comedic_emphasis, social_criticism
- **participationLevel:** solo_listening, shared_refrain, call_response, full_participation, laughter
- **emotionalValence:** playful, bitter_ironic, joyful, melancholic, exasperated_comedic

##### Component 5: statistics (Auto-calculated summaries)

Calculated automatically from all expressions' data:

```json
"statistics": {
  "overview": {...},
  "figurativeLanguage": {...},
  "dimensionalDistribution": {...},
  "culturalWeights": {
    "mean": 6.44,
    "median": 6.55,
    "range": [3.5, 8.1],
    "standardDeviation": 1.31,
    "distribution": {...}
  },
  "complexityMetrics": {...},
  "featureAnalysis": {...}
}
```

##### Component 6: comparativeContext (Contextualization)

```json
"comparativeContext": {
  "comparedToVietnameseFolkSongs": {
    "culturalWeight": "slightly_higher",
    "reasoning": "Mixes high literary (Sino-Vietnamese) with colloquial folk humor",
    "avgVietnameseFolkWeight": 5.8,
    "thisSongWeight": 6.44,
    "difference": "+0.64 (11% higher)"
  },
  "comparedToNorthernFolkSongs": {
    "humorLevel": "high_satirical",
    "reasoning": "Exemplifies ca dao tradition of social criticism through humor",
    "culturalAuthenticity": "very_high_traditional"
  },
  "uniqueCharacteristics": [
    "Blends Sino-Vietnamese classical imagery with village comedy",
    "Uses maximum-intensity reduplication (4-syllable)",
    "Perfect example of đối ngẫu in folk context"
  ]
}
```

##### Component 7: interpretiveGuidance (Performance & Pedagogy)

```json
"interpretiveGuidance": {
  "performanceContext": "This song should be performed with comedic timing and exaggerated vocal inflections. The 'o o o' snoring section invites nasal, crescendoing delivery and audience participation. Refrains should build melodramatically.",

  "culturalSensitivity": "While humorous, this song reflects genuine historical grievances of Vietnamese women in arranged marriages. The complaints use hyperbole for comedy but stem from real lack of agency in traditional patriarchal society.",

  "pedagogicalValue": "Excellent teaching example for: (1) Vietnamese reduplication (từ láy) mechanics, (2) Sino-Vietnamese cultural borrowing vs. native folk traditions, (3) đối ngẫu structure in oral poetry, (4) irony in social criticism."
}
```

#### Step 4: Aggregate All Components

**File Structure:**

```json
{
  "metadata": {
    "songTitle": "Song Name",
    "totalSyllables": 119,
    "segmentedBy": "Claude LLM (punctuation-aware)",
    "enhancedDate": "2025-10-05",
    "enhancementVersion": "3.0"
  },

  "phrases": [
    // Selected phrases with figurative expressions
    {
      "id": 1,
      "text": "...",
      "syllableCount": 4,
      "type": "...",
      "wordMapping": [...],
      "culturalContext": {...},
      "figurativeExpressions": ["expression1", "expression2"]
    }
  ],

  "figurativeAnalysis": {
    "expressions": [
      // All expressions with complete 7-component analysis
      {
        "vietnamese": "...",
        "literal": "...",
        "meaning": "...",
        "classification": {...},
        "culturalWeights": {...},        // Component 1
        "complexityMetrics": {...},      // Component 2
        "semanticNetwork": {...},        // Component 3
        "usagePatterns": {...},          // Component 4
        "words": [...],
        "phraseIds": [...],
        "occurrences": 3
      }
    ],
    "patterns": {...},
    "richness": {...}
  },

  "statistics": {...},                   // Component 5
  "interpretiveGuidance": {...}          // Component 7
  // Note: Component 6 (comparativeContext) is inside statistics section
}
```

#### Step 5: Quality Validation

**Checklist before saving:**

- [ ] All identified figurative expressions have all 7 components
- [ ] culturalWeights: All 6 dimensions scored (0-10)
- [ ] complexityMetrics: All 6 factors scored
- [ ] semanticNetwork: Source/target domains + 2-5 mappings
- [ ] usagePatterns: All 4 fields filled
- [ ] statistics: Auto-calculated from expression data
- [ ] comparativeContext: Comparison reasoning provided
- [ ] interpretiveGuidance: Performance + cultural + pedagogical guidance
- [ ] overallWeight and complexityScore correctly calculated
- [ ] JSON validates (no syntax errors)

#### Step 6: Save Enhanced File

```bash
# Save to figurative-enhanced directory
/v4/data/figurative-enhanced/[Song Name].json
```

---

### Example: "Bà rằng bà rí" Processing

**Identified Expressions:** 8 total

1. Bà Rằng bà Rí (vocative formula) - weight 6.7, complexity 3.0
2. nối dây tơ hồng (red thread metaphor) - weight 8.1, complexity 7.0
3. cái duyên ông chồng (ironic fate) - weight 7.9, complexity 6.5
4. làm khổ cái đời tôi (hyperbole) - weight 6.9, complexity 4.0
5. bé tẹo tèo teo (reduplication) - weight 5.8, complexity 3.5
6. chân đi cà kheo (metaphor) - weight 6.2, complexity 5.0
7. lúc đi phải cõng, lúc khóc phải bồng (parallel) - weight 6.4, complexity 6.5
8. o o o (onomatopoeia) - weight 3.5, complexity 2.0

**Result:**
- Average cultural weight: 6.44 (11% higher than typical folk songs)
- Average complexity: 4.8 (moderate)
- Expression density: 0.67 (67% of phrases contain figurative language)
- File size: 894 lines of complete analysis

---

### Processing Time Estimates

- **Step 1 (Read source):** 2-5 minutes
- **Step 2 (Identify expressions):** 15-30 minutes (requires Vietnamese linguistic expertise)
- **Step 3 (Create 7-component analysis):** 10-15 minutes per expression
- **Step 4 (Aggregate):** 5-10 minutes
- **Step 5 (Validate):** 5 minutes
- **Total:** 1-2 hours per song (for 8 expressions)

**Note:** Processing time scales with number of expressions (3-15 typical per song).

---

### Common Expression Types in Vietnamese Folk Songs

1. **Reduplication (từ láy):** ~80% of songs have at least one
2. **Nature metaphors:** ~70% (moon, river, flowers, birds)
3. **Sino-Vietnamese idioms:** ~50% (classical allusions)
4. **Parallel structures (đối ngẫu):** ~60%
5. **Onomatopoeia:** ~40%
6. **Hyperbole:** ~50%
7. **Irony:** ~30%

---

### Quality Standards

**Minimum Requirements:**
- At least 3 figurative expressions identified per song
- All 7 components present for each expression
- Cultural weights range 1-10 (avoid all scores clustered 5-6)
- Complexity scores reflect actual variation (mix of simple and complex)
- Comparative context references actual Vietnamese folk traditions
- Interpretive guidance actionable for performers/teachers

**Excellent Quality:**
- 6-10 expressions per song
- Wide range of cultural weights (3-9)
- Mix of expression types (not all metaphors)
- Rich comparative context with specific examples
- Detailed performance notes with timing/inflection guidance

---

**END OF TAXONOMY SPECIFICATION**

*This document serves as the complete reference for Dan Tranh music analysis. All implementations must adhere to this structure.*
