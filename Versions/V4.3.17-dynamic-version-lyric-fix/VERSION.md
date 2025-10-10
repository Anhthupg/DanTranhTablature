VERSION.md
# V4.3.17 - Dynamic Version & Lyric Field Fix

## Changes
- Version now reads dynamically from package.json
- Fixed lyric field normalization (handles V3 object and V4 string formats)
- Ensures Sakura and all new V4-only songs display correctly

## Key Fixes
1. routes/main-page.js: Read VERSION from package.json
2. utils/data-loader.js: Normalize lyric field to string in converter
3. Handles both `note.lyrics.text` (V3) and `note.lyrics` (V4 string)

---
**Date**: 2025-10-10
**Status**: Production Ready
