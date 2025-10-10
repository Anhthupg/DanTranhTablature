# V4.3.21 - Library Import Fix

**Date:** October 10, 2025
**Type:** Bug Fix

## Problem Fixed

The library importer was failing to process 7 songs that had no title metadata in their MusicXML files. When `extractTitle()` returned `null`, the `detectRegion()` and `detectGenre()` functions would crash trying to call `.toLowerCase()` on `null`.

## Files Modified

### auto-import-library.js

**Changes:**

1. **extractTitle() - Added filename fallback** (lines 88-102)
   - Now accepts optional `filename` parameter
   - Uses filename (without extension) when MusicXML has no title tag
   - Prevents returning null for files without metadata

2. **extractMetadata() - Pass filename to extractTitle()** (lines 48-49)
   - Extract filename first: `const filename = path.basename(musicXMLPath)`
   - Pass to extractTitle: `this.extractTitle(xmlDoc, filename)`

3. **detectRegion() - Added null guard** (line 244)
   - Check `if (!title) return 'Unknown'` before calling `.toLowerCase()`

4. **detectGenre() - Added null guard** (line 279)
   - Check `if (!title) return 'Traditional'` before calling `.toLowerCase()`

## Impact

**Before:**
- 122 songs successfully imported
- 7 songs failing with "Cannot read properties of null (reading 'toLowerCase')" error

**After:**
- 129 songs successfully imported (all existing files)
- 0 import failures
- All songs with missing metadata now use filename as title

## Verification

```bash
# Verify no duplicates
curl http://localhost:3006/api/library | jq 'map(.filename) | group_by(.) | map(select(length > 1)) | length'
# Returns: 0

# Verify all 129 files imported
curl http://localhost:3006/api/library | jq 'length'
# Returns: 129
```

## Lesson Learned

Always validate input before string operations. Add null/undefined checks before calling methods like `.toLowerCase()`, `.includes()`, etc.
