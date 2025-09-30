# V4.2.10 - Grace Note Color Change: Grey Fill & Black Outline

**Date:** September 30, 2025
**Status:** ✅ Complete

## Summary
Changed grace notes from gold/yellow (#FFD700) to grey (#999999) with black outline (#000000) to reserve yellow for future tone mark features.

## Changes

### 1. Visual System Update
**Grace Note Styling:**
- **Fill:** #FFD700 (gold) → #999999 (grey)
- **Stroke:** #CC9900 (dark gold) → #000000 (black)
- **Slash:** #FFD700 (gold) → #000000 (black)

### 2. Files Modified
- `server-tablature-generator.js` - Lines 130, 273
- `generate-all-tablatures.js` - Line 120
- `CLAUDE.md` - Documentation updated

### 3. Regeneration
- ✅ 109/109 tablatures regenerated
- ✅ All grace notes now grey with black outline
- ✅ Server restarted to clear cache

## Design Rationale
1. Yellow reserved for Vietnamese tone marks
2. Grey provides subtle visual hierarchy
3. Black stroke maintains clear definition
4. Follows traditional music notation style

## Verification
```bash
# Check generated SVG
head -15 v4/data/tablatures/b_r.svg | grep grace-note
# Output: .grace-note { fill: #999999; stroke: #000000; }
```

## User Instructions
**Hard refresh required to see changes:**
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + F5`
- Alternative: Open in incognito mode

---

## Previous Version: V4.1.5 - Comprehensive Tuning Database Integration

**Date:** September 30, 2025

### Changes

#### 1. Expanded Tuning Database (33 Scales)
- **Before:** 4 hardcoded tunings (Northern, Southern, Central, Modern)
- **After:** 33 comprehensive scales organized by category

#### 2. Category Organization with Optgroup Headers
**Vietnamese (9 scales):**
- Dan Tranh Standard, Northern, Southern, Central
- Ru Con, Nam Ai, Nam Xuan, Bac, Oan

**Pentatonic (13 scales):**
- Major, Minor, Egyptian
- Chinese: Gong, Shang, Jue, Zhi, Yu
- Japanese: Hirajoshi, Iwato, In-sen, Kumoi, Ritusen

**Hexatonic (4 scales):**
- Blues Major, Blues Minor
- Whole Tone, Augmented

**Heptatonic (7 scales):**
- Major, Natural Minor
- Dorian, Phrygian, Lydian, Mixolydian
- Harmonic Minor

#### 3. Files Modified
- `data/tuning-systems.json` - Complete scale database
- `vertical-demo-server.js` - Dropdown integration

#### 4. Features
- Hierarchical dropdown with category headers
- 33 tuning options available
- Maintains Vietnamese tuning priority
- Clean, organized interface

---

**Full version history in /Versions/ directory**
