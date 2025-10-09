# V4.2.13 - Word-Based Structural Analysis

## Release Date
October 1, 2025

## Summary
Complete implementation of multi-layer word-based structural analysis for Vietnamese folk songs, featuring automatic section detection, parallelism hierarchy, semantic clustering, and dual visualization modes (HTML + SVG).

## Major Features

### 1. Structure Overview Section (HTML Cards)
- Auto-detects 11 section types: INTRO, VERSE, REFRAIN, DIALOGUE, CODA
- Color-coded cards by section type
- Lists all phrases within each section
- Persistent display

### 2. Annotated Phrases Section (SVG Multi-Layer)
- X-coordinates aligned with Optimal Tuning tablature
- Bidirectional scroll synchronization
- Zoom support (67%-200%)
- 28 phrase boxes with semantic icons
- Section labels with colored borders
- Punctuation-normalized refrain detection

## Analysis Algorithms

### Parallelism Detection (3 Levels)
1. Exact repetition (gold boxes)
2. Structural parallelism (blue boxes)
3. Semantic parallelism (colored borders)

### Section Detection
Auto-groups into: INTRO, VERSE, REFRAIN, DIALOGUE, CODA

### Semantic Clustering
6 domains: characters, emotions, actions, nature, abstract, vocatives

## Statistics for "Bà rằng bà rí"
- 28 phrases analyzed
- 11 sections detected  
- 4 exact refrains identified
- 147 notes positioned
- 5726px width

## Files Created
- generate-phrase-annotations.js (410 lines)
- render-phrase-annotations.js (200 lines)
- 4 documentation files

## Known Issues
- Library auto-load disabled (temporary)
- Single song implementation

**Production-ready for "Bà rằng bà rí" at http://localhost:3006**
