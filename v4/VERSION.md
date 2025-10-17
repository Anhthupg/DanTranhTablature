# V4.4.13 - Bilingual Lyrics Analysis Support (2025-10-17)

## Summary
Added complete English language support to the lyrics-based analysis system, enabling proper visualization for non-Vietnamese songs.

## Changes

### 1. New Songs Added (5 total)
- **Lý Ngựa Ô** (Vietnamese folk song) - 16 phrases, 71 syllables
- **Bèo Giạt Mây Trôi** (Vietnamese folk song) - 20 phrases, 83 syllables
- **Lý Ngựa Ô - Tranh** (Vietnamese instrumental) - 5 phrases, 22 syllables
- **We're Gonna Shine** (English contemporary) - 30 phrases, 114 syllables
- **Golden K-Pop Demon Hunters** (English/Korean) - 49 phrases, 297 syllables

### 2. Bilingual Vocabulary Analyzer
**File**: analyze-vocabulary-metrics.js

**Categories Enhanced with English patterns**:
- nature: +30 English words
- family: +15 English words
- emotion: +30 English words
- work: +10 English words
- time: +15 English words
- place: +10 English words

### 3. Results
English songs now have complete lyrics-based visualizations:
- Word Cloud Visualization (semantic categories)
- Vocabulary Insights (statistics)
- Thematic Radar Chart (6 dimensions)
- Pattern Analysis (KPIC, KDIC, KSIC)

Total songs: 140 (was 135)

## Files Modified
- analyze-vocabulary-metrics.js
- add-new-file-mappings.js
- package.json (4.3.25 → 4.4.13)

## Files Created
- add-word-mappings-to-english.js
- 5 lyrics segmentation files
- 5 relationships files
- 5 pattern files
