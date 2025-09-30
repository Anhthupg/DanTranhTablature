# V4.2.0 - Lyrics Integration with LLM-Based Phrase Segmentation

**Release Date:** September 30, 2025
**Major Feature:** Complete lyrics extraction, analysis, and display system

## What's New

### LLM-Based Phrase Segmentation
- 28 perfect phrases (vs 25 from rule-based)
- Superior linguistic analysis (question, answer, complaint, exclamatory, onomatopoeia)
- Pre-computed JSON architecture (instant loading, no API calls)
- Fallback to rule-based for unsegmented songs

### 5-Column Ultra-Compact Table
- Linguistic Type (120px) - Color-coded
- Controls (200px) - 6 buttons: ▶ 🔁 ■ 🗣 📖 🌐
- # (35px) - Phrase number
- Vietnamese (flex) - Phrase text
- English (flex) - Translation

### 7 Linguistic Types with Color Coding
- Blue: question
- Green: answer
- Red: exclamatory
- Orange: complaint
- Gold: onomatopoeia
- Purple: refrain_variant
- Grey: narrative

## Files Modified
- vertical-demo-server.js - LLM loading, lyrics extraction
- v4-vertical-header-sections-annotated.html - Lyrics section
- processors/phrase-segmenter.js - Enhanced rules

## New Files
- data/lyrics-segmentations/ - LLM analyses directory
- data/lyrics-segmentations/Bà rằng bà rí.json - First LLM segmentation

## Architecture
Pre-computed LLM segmentations for perfect quality, scalable to 130+ songs.

Workflow: New song → Paste lyrics → Claude analyzes → Save JSON → Done!
