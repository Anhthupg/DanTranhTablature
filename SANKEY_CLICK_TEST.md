# Sankey Band Click Test - Second+ Click Fix

## Issue
Sankey Band → Dropdown + Tablature only worked for the first click after Cmd+Shift+R (page refresh). Subsequent clicks failed to update dropdown or highlight tablature.

## Root Cause
The selection logic was calling `clearHighlighting()` which cleared all dropdown selections BEFORE calling the trigger functions. This created a race condition where:
1. Band click → Clear everything including dropdown
2. Call triggerKPICPattern() → Call selectPattern()
3. selectPattern() couldn't find the pattern because dropdown was cleared
4. No highlighting occurred

## Fix Applied
Modified the band click handler to:
1. **NOT** call `clearHighlighting()` immediately
2. Only clear OTHER bands visually (not dropdown state)
3. Let the trigger functions handle dropdown selection properly
4. Allow `updateHighlighting()` to handle the clearing and highlighting in the correct order

## Test Procedure

### Before Fix (Expected Failure):
1. Refresh page (Cmd+Shift+R)
2. Click a Sankey band → Works (dropdown updates, tablature highlights)
3. Click a different Sankey band → FAILS (no dropdown update, no highlighting)
4. Click the same Sankey band again → FAILS

### After Fix (Expected Success):
1. Refresh page (Cmd+Shift+R)
2. Click a Sankey band → Works (dropdown updates, tablature highlights)
3. Click a different Sankey band → **Should work** (dropdown updates, tablature highlights)
4. Click the same Sankey band again → **Should work** (deselects properly)
5. Click multiple bands in sequence → **Should work** (each updates properly)

## Verification Steps

1. **Test Single Selection**:
   - Click Band A → Check dropdown shows Band A pattern, tablature highlights
   - Click Band B → Check dropdown shows Band B pattern, tablature highlights Band B (clears Band A)
   - Click Band A again → Check dropdown shows Band A pattern, tablature highlights Band A

2. **Test Multi-Selection** (Cmd/Ctrl+Click):
   - Click Band A → Single selection
   - Cmd+Click Band B → Both A and B should be selected in dropdown and tablature
   - Cmd+Click Band C → A, B, and C should all be selected

3. **Test Deselection**:
   - Click Band A to select
   - Click Band A again → Should deselect (dropdown clears, highlighting clears)

4. **Test Cross-Type** (KPIC vs KRIC):
   - Click KPIC band → KPIC dropdown updates
   - Click KRIC band → KRIC dropdown updates, KPIC clears
   - Verify no cross-contamination

## Console Debug Messages to Look For

After the fix, you should see these console messages in sequence:
```
Band clicked, wasSelected: false, pattern: ["D4", "G4"], bandId: kpic-0
🎯 SELECTING band - calling trigger function directly
🎯 About to call pattern trigger function
triggerKPICPattern called with: ["D4", "G4"], multiSelect: false
🎯 Cleared all dropdown selections for single select
🔥 DIRECT CALL to updateHighlighting from selectPattern
🎯 updateHighlighting called
🎯 Processing KPIC pattern: ["D4", "G4"], count: X, positions: [...]
```

## Key Changes Made

**File**: `analytical_tablature.html`
**Lines**: ~6380-6422

**Before**: Force cleared everything including dropdown state
**After**: Only clear other band visuals, let trigger functions handle dropdown properly

This preserves the dropdown state during the selection process and ensures the trigger → select → highlight chain works consistently on every click.