# V4.2.4 - Section Cleanup & Phrases Preparation

**Date:** September 30, 2025
**Type:** UI Cleanup & Section Repurposing

## Changes Made

### 1. Removed All Section Icons
- **Impact:** All 10 sidebar sections now have clean text-only headers
- **Icons Removed:** 🎸 🎼 🎵 📊 📈 📉 🔢 🗣️ 📝 📚
- **Reason:** Cleaner, more professional appearance
- **Method:** `sed -i.bak '/<span class="section-icon">/d'`

### 2. Repurposed Section #7
- **Old Name:** "Lyrics"
- **Old Content:** "Alternative Tuning Comparison 3" with tuning selector (C-E♭-F-G-B♭, etc.) and bent note info
- **New Name:** "Phrases in Tablature"
- **New Content:** Empty `<div id="lyricsDisplay">` ready for phrase diagram
- **Location:** `altTuning3Section` (data-order="7")

### 3. Content Cleanup
**Removed from Section #7:**
- Tuning system dropdown selector
- Bent notes count display (e.g., "4 bent notes")
- Show/Hide toggle button
- Alternative tuning tablature SVG
- All tuning comparison functionality

**Kept:**
- Collapsible header with ▼ toggle
- Move arrows (▲▼) for section reordering
- Section container structure

## Files Modified

- `v4/templates/v4-vertical-header-sections-annotated.html` - Main template

## Current Section Structure

All 10 sidebar sections (data-order 0-10):
1. Optimal Tuning
2. Alt Tuning
3. Sections
4. KP/RIC-1
5. KPIC-2 & KRIC-2
6. KPIC-3 & KRIC-3
7. KxxIC-nn
8. **Phrases in Tablature** (repurposed)
9. Ling Tones
10. Lyrics
11. Song Library

## Purpose

Preparing Section #7 for phrase boundary visualization diagram that will show how lyrics are segmented into musical phrases on the tablature.

## Next Steps

Ready for implementation of phrase diagram feature:
- Visualize phrase boundaries on tablature
- Show syllable-to-note mapping
- Highlight phrase structures
- Enable phrase-based playback control

---

**Status:** Template updated, ready for phrase diagram implementation