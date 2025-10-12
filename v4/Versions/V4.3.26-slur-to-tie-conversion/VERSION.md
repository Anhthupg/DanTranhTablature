# V4.3.26 - Slur-to-Tie Conversion System (2025-10-12)

## Problem Identified
Multiple notes with same pitch, same syllable, and slur connection were displayed as separate notes instead of being combined into a single tied note.

**Example:** "Let it Be" showed #4 A4 and #5 A4 as two separate notes when they should appear as one combined note.

## Solution Implemented

### Hard-Coded Slur-to-Tie Conversion Rule

Added `convertSlursToTies()` function in `generate-v4-relationships.js`:

```javascript
convertSlursToTies(notes) {
    // RULE: Same pitch + same syllable (or 2nd has no syllable) + slur/tie → combine
    // - Sums durations from both notes
    // - Keeps first note's syllable
    // - Re-indexes all notes after combination
}
```

### Conversion Logic

**Combines notes when ALL conditions met:**
1. Same pitch (e.g., both A4)
2. Same syllable OR second note has no syllable
3. Second note has `hasTieStop` or `hasSlurStop` flag
4. Both are main notes (not grace notes)

**Result:**
- Two notes → One note with combined duration
- Preserves first note's lyric
- Re-indexes remaining notes sequentially

## Files Modified

1. **`generate-v4-relationships.js`**
   - Added `convertSlursToTies()` function (lines 158-205)
   - Integrated into generation pipeline (lines 46-48)
   - Logs each tie conversion for verification

2. **`batch-regenerate-all-relationships.js`** (NEW)
   - Systematic batch processor for all 133 songs
   - Progress reporting and error handling
   - Summary statistics and logging

## Batch Regeneration Results

**Applied to entire collection:**
- ✓ Success: 131 songs
- ✗ Failed: 0 songs
- ⊘ Skipped: 2 songs (no lyrics segmentation)

**Example Conversions:**
- **Let it Be**: 216 → 186 notes (30 ties combined)
- **Bà Rằng Bà Rí**: 147 → 136 notes (11 ties combined)
- **Bài Chòi**: 51 → 44 notes (7 ties combined)
- **Bỏ Bộ**: 139 → 134 notes (5 ties combined)

## Technical Details

### Data Flow
```
1. MusicXML parsed → 216 raw notes
2. Slur/tie flags detected → hasTieStop, hasSlurStop
3. convertSlursToTies() → combine matching pairs
4. Re-index → 186 final notes
5. Save to relationships.json
```

### Console Output Example
```
[V4 Relationships] Extracted 216 total notes
  Tied: note_4 + note_5 → A4 (2)
  Tied: note_7 + note_8 → G4 (3)
  ...
[V4 Relationships] After slur-to-tie conversion: 186 notes
```

## Impact

**Accuracy:**
- Tablatures now correctly show tied notes as single units
- Note counts accurate for analysis
- Duration calculations correct

**Scalability:**
- Applied systematically to all 131 songs
- Future imports automatically apply conversion
- No manual intervention needed

## Testing

Verified on multiple songs:
- "Let it Be" - 30 ties found and combined
- "Bà Rằng Bà Rí" - 11 ties found and combined
- Songs with no ties - pass through unchanged

## Files Generated

- `data/relationships/*.json` - All 131 relationship files regenerated
- `batch-regenerate-summary.json` - Batch processing results

## Architecture Principle

**Hard-coded rule ensures:**
- Consistent behavior across all songs
- No configuration needed
- Predictable results
- Easy to debug (single location)

---

**V4.3.26 Status:** Production-ready with systematic slur-to-tie conversion across entire collection.
