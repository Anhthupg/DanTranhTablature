# V4.3.33 - Phrase Bars Global Index Fix

**Date:** October 14, 2025
**Status:** ✅ Production Ready

## Problem Fixed

The phrase-bars controller was unable to find word-to-note mappings for phrases 23-28, causing console warnings and missing phrase bars in the visualization.

### Root Cause

**Index Mismatch:**
- Controller expected: **per-phrase word indices** (0, 1, 2, 3 for each phrase)
- Relationship data had: **global word indices** (continuous across entire song)

**Example for Phrase 23:**
```javascript
// Controller was looking for:
phraseId: 23, wordIndex: 0, 1, 2, 3

// Data actually contained:
phraseId: 23, wordIndex: 94, 95, 96, 97
```

**Result:** Controller couldn't find mappings, skipped phrases, showed warnings.

## Solution Implemented

Changed from index-based lookup to filter-sort-select pattern:

### Before (Lines 164-169)
```javascript
// ❌ WRONG: Assumes per-phrase indices
const firstMapping = this.relationships.wordToNoteMap.find(
    m => m.phraseId === phrase.id && m.wordIndex === 0
);
const lastMapping = this.relationships.wordToNoteMap.find(
    m => m.phraseId === phrase.id && m.wordIndex === phraseWords.length - 1
);
```

### After (Lines 165-179)
```javascript
// ✅ CORRECT: Works with global indices
const phraseMappings = this.relationships.wordToNoteMap.filter(
    m => m.phraseId === phrase.id
);

// Sort by wordIndex to ensure correct order
phraseMappings.sort((a, b) => a.wordIndex - b.wordIndex);

// Get first and last mappings
const firstMapping = phraseMappings[0];
const lastMapping = phraseMappings[phraseMappings.length - 1];
```

## Benefits

1. **Works with both indexing systems:** Per-phrase OR global indices
2. **More robust:** Doesn't assume specific index values
3. **Clearer intent:** Explicitly sorts and selects first/last
4. **Better logging:** Shows actual mapping count vs expected

## Files Modified

- `phrase-bars-controller.js` (Lines 163-185)

## Testing

- Refreshed localhost:3006
- Checked browser console - warnings gone
- All 28 phrase bars now render correctly
- Phrase boundaries align with correct notes

## Console Output Improvement

**Before:**
```
[PhraseBars]   Missing mapping for phrase 23 (firstMapping: false, lastMapping: false)
[PhraseBars]   phraseWords.length: 4, wordToNoteMap entries for this phrase: 4
```

**After:**
```
[PhraseBars] Processing phrase 23: "chẝng lo học hành"
[PhraseBars]   Found 4 mappings (wordIndex: 94-97)
[PhraseBars]   Rendering bar from note_110 to note_113
```

## Architecture Impact

This fix aligns with the **Never Trust Metadata Counts** principle (V4.3.6):
- Don't assume index structure
- Always verify against actual data
- Use data-driven lookups instead of hardcoded expectations

## Related Documentation

See CLAUDE.md:
- **V4.3.6: NEVER TRUST METADATA COUNTS**
- **V4.2.39-40: NAMING CONVENTION SYSTEM** (global vs local indices)

---

**V4.3.33 Status:** Production-ready phrase bars with robust global index support.
