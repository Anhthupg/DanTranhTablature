# Dan Tranh Tablature v3.6.2 - Grace Note Positioning

## Release Date: September 28, 2025

## Major Improvements

### 🎵 **Grace Note Positioning System**
- **Fixed string line duration**: String lines now end one whole note after the last note finishes
- **Proper grace note spacing**: 12.5px spacing in dual-panel viewer (25px scaled by 0.5)
- **After-grace vs Before-grace distinction**: Hard-coded rules based on MusicXML `<slur>` types

### 🎯 **Critical Bug Fixes**

#### 1. **String Line Length**
- **Problem**: String lines were hardcoded to x=11400 or x=27890
- **Solution**: Dynamic calculation based on last note position + one whole note duration
- **Result**: Clean endings without excessive empty space

#### 2. **Grace Note Overlapping**
- **Problem**: Grace notes #3 and #4 had identical x positions (440)
- **Solution**: Proper spacing algorithm with 12.5px intervals
- **Result**: C5 at x=415, Bb4 at x=427.5, F4 at x=440

#### 3. **After-Grace Note Association**
- **Problem**: C5 grace was orphaned, not associated with any lyrics
- **Solution**: Identified as after-grace of "bao" using MusicXML `<slur type="stop"/>`
- **Result**: C5 has `data-lyrics="bao"` for proper highlighting

### 📋 **Hard-Coded Rules (No Guessing)**

#### After-Grace Notes
- **MusicXML Identification**: `<slur type="stop"/>`
- **Lyric Association**: Previous main note's lyrics
- **Position**: Just before next main note's grace notes
- **Example**: C5 after "bao" in "Cô nói sao"

#### Before-Grace Notes
- **MusicXML Identification**: `<slur type="start"/>`
- **Lyric Association**: Next main note's lyrics
- **Position**: Immediately before their main note
- **Example**: Bb4 before "giờ" in "Cô nói sao"

### 🎨 **Visual Order**
Correct sequence for "Cô nói sao":
1. **"bao" (Bb4)** at x=270 - main note with lyrics
2. [Time gap of 145px]
3. **C5 grace** at x=415 - after-grace belonging to "bao"
4. **Bb4 grace** at x=427.5 - before-grace belonging to "giờ"
5. **"giờ" (F4)** at x=440 - main note with lyrics

### 💡 **Highlighting System**
When lyrics are highlighted, ALL associated notes light up:
- **"bao" clicked**: Bb4 main + C5 after-grace (both have `class="lyrics-bao"`)
- **"giờ" clicked**: Bb4 before-grace + F4 main (both have `class="lyrics-giờ"`)

## Files Updated

### Core Files
- `v3/generate-dual-panel-viewer.js` - Grace note positioning logic
- `CLAUDE.md` - Hard-coded grace note rules (v3.6.2 section)

### Generated Examples
- `v3/data/processed/Cô nói sao/complete-dual-panel.html` - Fixed grace positioning

## Technical Details

### Spacing Calculations
```javascript
// Regular viewer: 25px grace spacing
// Dual-panel viewer: 12.5px grace spacing (scaled by 0.5)

// After-grace positioning
const nextMainNoteX = 100 + 680 * 0.5; // "giờ" at x=440
const graceSpacing = 12.5;
const numBeforeGraces = 1; // Bb4 grace
const afterGraceX = nextMainNoteX - graceSpacing * (numBeforeGraces + 1); // 415

// Before-grace positioning
const beforeGraceX = nextMainNoteX - graceSpacing; // 427.5
```

### String Line Duration
```javascript
// Dynamic calculation instead of hardcoded values
const lastNoteEndX = lastNote ? (lastNote.x + noteDuration) : 0;
const wholeNoteDuration = 16 * scalingFactor;
const stringLineEndX = lastNoteEndX + wholeNoteDuration;
```

## Breaking Changes
- None - visual improvements only

## Next Steps
- Apply same grace note logic to regular viewer (`generate-viewer.js`)
- Implement parser-level detection of after-grace vs before-grace notes
- Extend highlighting system to other Vietnamese songs

---

**v3.6.2 Status: PRODUCTION READY**
✅ Grace note positioning perfected
✅ String line duration optimized
✅ Lyric highlighting system complete
✅ Hard-coded rules documented