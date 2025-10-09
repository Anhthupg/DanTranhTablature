# V4.2.35 - Optimal Tuning Selection Fix

**Date:** October 3, 2025

## Problem

The "Optimal Tuning" displayed in the UI was not actually optimal - it showed more bent notes than the "Alternative Tuning":

- **Optimal**: C-D-E-G-A with 11 bent notes
- **Alternative 1**: C-D-E-G-B with 4 bent notes

This made the "optimal" label misleading and incorrect.

## Root Cause

The `data-loader.js` had a hardcoded fallback when loading song metadata:

```javascript
// WRONG: Hardcoded fallback to C-D-E-G-A
optimalTuning: relationshipsData.metadata?.optimalTuning || 'C-D-E-G-A',
```

When V3 processed data (which lacks `optimalTuning` metadata) was loaded, this fallback always set the optimal tuning to `C-D-E-G-A`, regardless of whether it was actually optimal for the song.

## Solution

Removed the hardcoded fallback and let the server calculate the true optimal tuning on-the-fly:

```javascript
// FIXED: No fallback - server calculates optimal tuning
optimalTuning: relationshipsData.metadata?.optimalTuning,  // undefined if missing
```

The server's tuning selection logic (in `vertical-demo-server.js:112-119`) already handles missing metadata by calculating the optimal tuning using the `tuning-optimizer.js` module:

```javascript
if (!optimalTuning) {
    optimalTuning = tuningAnalysis.optimal;
    optimalBentCount = tuningAnalysis.bentNotes;
    console.log(`Calculated optimal tuning: ${optimalTuning} (${optimalBentCount} bent notes)`);
}
```

## Results

After fix for "hát chèo tàu":

```
Calculated optimal tuning: C-D-E-G-B (4 bent notes)
Optimal: C-D-E-G-B (4 bent)
Alternative: C-D-F-G-A (7 bent)
```

Now the "Optimal Tuning" truly has the fewest bent notes.

## Files Modified

- `v4/utils/data-loader.js:186` - Removed `|| 'C-D-E-G-A'` fallback

## Impact

- All songs without pre-calculated optimal tuning metadata will now get dynamically calculated optimal tunings
- The tuning optimizer (`utils/tuning-optimizer.js`) tests all Vietnamese tuning systems and picks the one with fewest bent notes
- UI labels now accurately reflect which tuning is actually optimal

## Testing

Verified with "hát chèo tàu":
- Before: Optimal = C-D-E-G-A (11 bent), Alternative = C-D-E-G-B (4 bent) ❌
- After: Optimal = C-D-E-G-B (4 bent), Alternative = C-D-F-G-A (7 bent) ✅

## Future Improvement

Consider running `update-all-optimal-tunings.js` to pre-calculate and store optimal tunings for all songs in the V4 relationships files, eliminating the need for on-the-fly calculation.
