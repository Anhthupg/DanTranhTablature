# Synchronization Fix Test Guide

## Issues Fixed

### 1. **KPIC-2 Sankey to Dropdown Synchronization**
   - **Issue**: After first click on Sankey band, subsequent clicks didn't update the dropdown or highlight notes
   - **Fix**: Modified `selectPattern()` function to always call `updateHighlighting()` directly instead of relying on setTimeout or conditional checks
   - **Location**: Line 6838

### 2. **KPIC-3+ Pattern Highlighting**
   - **Issue**: KPIC-3 and higher patterns never triggered tablature highlighting
   - **Fix**: Changed hardcoded `modePatterns['kpic-2']` to use dynamic `modePatterns[kpicFilter]` to properly store patterns for all KPIC levels
   - **Location**: Line 2680

### 3. **KRIC Pattern Synchronization**
   - **Issue**: KRIC patterns had similar synchronization issues
   - **Status**: Already working correctly - `selectKricPattern()` properly calls `updateHighlighting()`

## Test Scenarios

### Test 1: KPIC-2 Sankey Band Selection
1. Open the tablature file
2. Scroll down to the KPIC-2 Sankey diagram
3. Click on a band in the KPIC Sankey diagram
   - **Expected**:
     - Band highlights in blue
     - Corresponding pattern appears selected in KPIC dropdown
     - Notes highlight on tablature with connections
4. Click on the same band again
   - **Expected**: Band deselects, highlighting clears
5. Click on different bands multiple times
   - **Expected**: Each click properly updates dropdown and tablature

### Test 2: KPIC-3+ Pattern Selection
1. Move KPIC slider to position 3
   - **Expected**: Dropdown populates with KPIC-3 patterns
2. Select a pattern from the dropdown
   - **Expected**:
     - 3-note sequences highlight on tablature
     - Connection lines appear between the notes
3. Try KPIC-4, KPIC-5, etc.
   - **Expected**: All levels properly highlight n-note sequences

### Test 3: Multi-Selection (Cmd/Ctrl+Click)
1. Hold Cmd (Mac) or Ctrl (Windows/Linux)
2. Click multiple bands in the Sankey diagram
   - **Expected**: Multiple patterns selected simultaneously
3. Check that dropdown shows multiple selections
4. Verify all selected patterns highlight on tablature with different colors

### Test 4: KRIC-2 Sankey Band Selection
1. Click on a band in the KRIC Sankey diagram
   - **Expected**:
     - Band highlights in red
     - Corresponding rhythm pattern appears selected in KRIC dropdown
     - Notes with matching rhythm patterns highlight on tablature

### Test 5: Cross-System Interaction
1. Select a KPIC pattern
2. Then select a KRIC pattern
   - **Expected**: Previous KPIC selection clears when KRIC is selected (unless multi-selecting)
3. Try selecting from dropdown first, then clicking Sankey bands
   - **Expected**: Synchronization works in both directions

## Debug Console Commands

To verify the fixes are working, open the browser console (F12) and look for these log messages:

1. When clicking a Sankey band:
   ```
   Band clicked, wasSelected: false, pattern: ["D4", "G4"], bandId: kpic-0
   🎯 SELECTING band - FORCE CLEARING first to ensure clean state
   triggerKPICPattern called with: ["D4", "G4"], multiSelect: false
   ```

2. When selecting from dropdown:
   ```
   🔥 DIRECT CALL to updateHighlighting from selectPattern
   🎯 updateHighlighting called
   🎯 Processing KPIC pattern: ["D4", "G4"], count: 5, positions: [0, 15, 30]
   ```

3. For KPIC-3+ patterns:
   ```
   📊 KPIC-3 DROPDOWN VERIFICATION:
   Patterns in dropdown: [number]
   Pattern details: ["D4→G4→A4(3×)", ...]
   ```

## Verification Checklist

- [ ] KPIC-2 Sankey bands properly sync with dropdown on ALL clicks (not just first)
- [ ] KPIC-3 patterns highlight 3-note sequences on tablature
- [ ] KPIC-4+ patterns work for higher n-gram sizes
- [ ] KRIC-2 Sankey bands properly sync with dropdown
- [ ] Multi-selection works with Cmd/Ctrl+click
- [ ] Deselection properly clears highlights
- [ ] Dropdown selections trigger tablature highlighting
- [ ] Connection lines appear between highlighted notes
- [ ] Console shows expected debug messages

## Notes

- The default Y-zoom is 67% to match the comfortable viewing scale
- Pattern colors cycle through 5 different colors for multi-selection
- Grace notes are handled specially with different connection logic
- Single occurrence patterns are included and marked with "[single]" in dropdown