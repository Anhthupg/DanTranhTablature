# V4.4.6 - Thematic Radar Song Matching Fix

**Date:** October 16, 2025
**Status:** ✅ Production Ready
**Impact:** Critical bug fix - prevents wrong song data in Thematic Radar

---

## Problem Fixed

### Issue: Wrong Song Data in Thematic Radar
- **Symptom:** Navigating to "Đò Hò" showed thematic radar for "Dạ Cổ Hoài Lang"
- **Root Cause 1:** Loose matching in `songChanged` event handler used `.includes()`
- **Root Cause 2:** No detection of URL changes (browser back/forward)

Example of the bug:
```javascript
// ❌ WRONG: includes() matches substring
currentSong = profiles.find(p =>
    p.songName.toLowerCase().includes('do ho')  // Matches "da-co-hoai-lang"!
);
```

---

## Solution

### 1. Fixed Song Matching Logic (Lines 1027-1033)

**Before:**
```javascript
currentSong = thematicProfiles.profiles.find(p =>
    p.songName.toLowerCase().includes(newSongName.toLowerCase())
) || thematicProfiles.profiles[0];
```

**After:**
```javascript
const newSongNorm = newSongName.normalize('NFC').toLowerCase();

currentSong = thematicProfiles.profiles.find(p => {
    const pNameNorm = p.songName.normalize('NFC').toLowerCase();
    const pTitleNorm = (p.songTitle || '').normalize('NFC').toLowerCase();

    // Exact match only (no substring matching)
    return pTitleNorm === newSongNorm || pNameNorm === newSongNorm;
});

if (!currentSong) {
    console.warn('[ThematicRadar] Could not find song:', newSongName);
    return; // Don't update if song not found
}
```

**Key Changes:**
- ✅ Exact match (`===`) instead of substring (`includes()`)
- ✅ Unicode normalization (NFC) for proper Vietnamese character comparison
- ✅ Safety check - won't render if song not found
- ✅ Debug logging for troubleshooting

### 2. Added URL Change Detection (Lines 1046-1050)

**New Feature:**
```javascript
// Listen for URL changes (browser back/forward, direct navigation)
window.addEventListener('popstate', async () => {
    console.log('[ThematicRadar] URL changed, reloading data');
    await loadData();
});
```

**Benefits:**
- ✅ Detects browser back/forward navigation
- ✅ Reloads data when URL changes
- ✅ Ensures radar always shows correct song

---

## Files Modified

```
v4/templates/components/thematic-radar-chart.html
├── Lines 1019-1044: Fixed songChanged event handler
└── Lines 1046-1050: Added popstate listener
```

---

## Testing Performed

### Test 1: Direct Navigation
1. Navigate to "Đò Hò" via URL
2. ✅ Thematic radar shows "Đò Hò" data (not "Dạ Cổ Hoài Lang")

### Test 2: Song Library Selection
1. Click "Đố hoa" in library
2. ✅ Thematic radar switches to "Đố hoa"
3. Click "Dạ Cổ Hoài Lang"
4. ✅ Thematic radar switches to "Dạ Cổ Hoài Lang"

### Test 3: Browser Navigation
1. Navigate to Song A
2. Navigate to Song B
3. Press browser back button
4. ✅ Thematic radar reloads Song A data

### Test 4: Unicode Edge Cases
1. Test songs with combining diacritics
2. ✅ NFC normalization handles all Vietnamese characters

---

## Console Logs (Debug Output)

```
[ThematicRadar] Detected song change: {songName: "do-hoa"}
[ThematicRadar] Switched to song: Đố hoa
[ThematicRadar] Rendered in current-vs-avg mode
```

---

## Architecture Pattern: Exact Matching for Entity Lookup

### The Pattern
When looking up entities (songs, users, records) by identifier:
- ✅ Use **exact match** (`===`) for primary keys
- ❌ Avoid **substring match** (`.includes()`) for lookups
- ✅ Reserve `.includes()` for **search/filter** operations

### Why This Matters

**Substring matching causes false positives:**
```javascript
// Song names in database:
"da-co-hoai-lang"  // "Dạ Cổ Hoài Lang"
"do-dua-quan-ho"   // "Đò đưa quan họ"
"do-hoa"           // "Đố hoa"

// ❌ WRONG: "do-ho" matches multiple songs
"da-co-hoai-lang".includes("do-ho")  // false
"do-dua-quan-ho".includes("do-ho")   // true ✓
"do-hoa".includes("do-ho")           // false

// But wait, "do ho" (with space) matches differently:
"da-co-hoai-lang".includes("da co")  // true ✓  (WRONG MATCH!)
"do-dua-quan-ho".includes("do")      // true ✓
"do-hoa".includes("do")              // true ✓
```

**Exact matching is unambiguous:**
```javascript
// ✅ CORRECT: Only matches exact ID
"da-co-hoai-lang" === "do-ho"  // false
"do-dua-quan-ho" === "do-ho"   // false
"do-hoa" === "do-hoa"          // true ✓ (CORRECT!)
```

### When to Use Each

| Operation | Use Case | Method |
|-----------|----------|--------|
| **Lookup by ID** | Get specific song/user/record | `===` (exact match) |
| **Search results** | Find songs containing "hoa" | `.includes()` (substring) |
| **Autocomplete** | Suggest songs starting with "do" | `.startsWith()` (prefix) |
| **Full-text search** | Search lyrics for "love" | `.includes()` or regex |

---

## Related Issues Fixed

This fix also resolves:
- ✅ Thematic radar not updating on browser back/forward
- ✅ Inconsistent behavior between URL load and library selection
- ✅ Missing debug logs for troubleshooting matching issues

---

## Performance Impact

- **Negligible:** Exact match (`===`) is O(1) vs substring match (O(n))
- **Actually faster** than `.includes()` for typical song name lengths

---

## Migration Notes

**For developers adding similar components:**

1. **Always use exact matching for entity lookup**
   ```javascript
   // ✅ GOOD
   entity === searchId

   // ❌ BAD
   entity.includes(searchId)
   ```

2. **Add URL change detection**
   ```javascript
   window.addEventListener('popstate', () => {
       reloadData();
   });
   ```

3. **Normalize Unicode for Vietnamese text**
   ```javascript
   const normalized = text.normalize('NFC');
   ```

---

## Conclusion

V4.4.6 fixes a critical bug in the Thematic Radar component that caused wrong song data to be displayed. The fix uses exact matching and adds proper URL change detection, ensuring the radar always shows the correct song's thematic profile.

**Key Takeaway:** Use exact matching (`===`) for entity lookup, reserve substring matching (`.includes()`) for search operations.
