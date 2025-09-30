# V4.0.8 - Note Labels, Zoom Linking & Text Centering

## Typography & Alignment Improvements

### 1. Note Head Labels Redesigned
**Before:** String numbers (7, 8, 9, 10)
**After:** Note names with superscript octaves (G⁴, A⁴, C⁵, D⁵)

**Font Size:**
- Main notes: **22px bold** (91% of 24px diameter - nearly fills circle)
- Grace notes: **11px bold** (91% of 12px diameter)

**Implementation:**
```javascript
// Added toSuperscript() helper
toSuperscript(num) {
    const superscripts = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    return String(num).split('').map(digit => superscripts[digit] || digit).join('');
}

// Generate note labels
const noteName = note.step + this.toSuperscript(note.octave);
const fontSize = isGrace ? 11 : 22;
svg += `<text font-size="${fontSize}" font-weight="bold" style="font-size: ${fontSize}px; font-weight: bold;">${noteName}</text>`;
```

### 2. Text Centering Fixed (Scaled Offset Anti-Pattern)
**Problem:** Text offset from circle center scaled during zoom, causing drift

**Before (Broken):**
```javascript
// Server generates with offset
<circle cy="200"/>
<text y="206"/>  <!-- cy + 6px offset -->

// Zoom doubles offset
circle.cy = 400
text.y = 412  // 12px offset instead of 6px - DRIFT!
```

**After (Fixed):**
```javascript
// Server generates at exact center
<circle cy="200"/>
<text y="200" dominant-baseline="middle"/>  <!-- Same y -->

// Zoom maintains centering
circle.cy = 400
text.y = 400  // Perfect center maintained!
```

**CSS:**
```css
.note-text {
    text-anchor: middle;           /* Horizontal center */
    dominant-baseline: middle;     /* Vertical center */
}
```

### 3. Lyrics Left-Aligned with Notes
**Before:** Lyrics centered on note (text spreads left and right)
**After:** Lyrics start at left edge of note and extend right

**Implementation:**
```javascript
// Position at note left edge
const noteRadius = note.isGrace ? 6 : 12;
const lyricX = note.x - noteRadius;  // Start at left edge

svg += `<text x="${lyricX}" y="${note.y + 40}" class="lyric-text">${lyric}</text>`;
```

**CSS:**
```css
.lyric-text {
    text-anchor: start;  /* Left-aligned */
}
```

### 4. Zoom Linking Restored
**Problem:** Zoom linking removed when we extracted ZoomController
**Solution:** Added linking functionality to controller

**ZoomController Changes:**
```javascript
class ZoomController {
    constructor() {
        this.zoomLinked = true;  // Default: linked
    }

    updateZoom(section, axis, percent, skipSync = false) {
        // Update current section
        this.applyZoom(section);

        // If linked, sync other sections
        if (this.zoomLinked && !skipSync) {
            this.sections.forEach(otherSection => {
                if (otherSection !== section) {
                    // Update state, slider, and apply zoom
                    this.zoomState[otherSection][axis] = zoom;
                    slider.value = percent;
                    this.applyZoom(otherSection);
                }
            });
        }
    }

    setZoomLinked(linked) {
        this.zoomLinked = linked;
        // If enabling, sync all to optimal
        if (linked) {
            // Sync all sections to optimal zoom
        }
    }
}
```

**Template:**
```javascript
// Wrapper for checkbox
function toggleZoomLink(linked) {
    window.zoomController.setZoomLinked(linked);
}

// Initialize on page load
window.zoomController.setZoomLinked(true);
```

**Behavior:**
- ✅ Checked: All sections zoom together
- ✅ Unchecked: Sections zoom independently

### 5. Zoom Text Positioning Updated
**ZoomController Enhancement:**
```javascript
// Separate handling for note text vs other text
svg.querySelectorAll('text.note-text').forEach(text => {
    // Always at circle center (no offset scaling)
    text.setAttribute('y', baseCy * yZoom);
});

svg.querySelectorAll('text:not(.note-text)').forEach(text => {
    // Regular scaling for lyrics, labels
    text.setAttribute('y', baseY * yZoom);
});
```

## Documentation Updates

### CLAUDE.md - Scaled Offset Anti-Pattern
Added comprehensive section explaining:
- What it is (pixel offsets scaling inadvertently)
- Why it happens (offset included in scaled coordinate)
- How to avoid it (zero offset + CSS positioning)
- Detection checklist
- Common cases (labels, indicators, text-in-circles)
- Quick fixes

**Rule:**
> Fixed offsets between parent-child elements must NOT be part of the scaled coordinate.
>
> ✅ GOOD: Generate child at parent position + use CSS/SVG attributes for offset
> ❌ BAD: Generate child at parent position + pixel offset, then scale both

## Files Modified

1. **server-tablature-generator.js**
   - Added `toSuperscript()` helper method
   - Changed note labels from string numbers to note names
   - Increased font sizes (22px main, 11px grace)
   - Added bold weight
   - Fixed text centering (y = cy, not cy + offset)
   - Fixed lyric positioning (x = note.x - radius)
   - Added `text-anchor: start` for lyrics
   - Added `dominant-baseline: middle` for note text

2. **zoom-controller.js**
   - Added `zoomLinked` property (default: true)
   - Added `setZoomLinked(linked)` method
   - Updated `updateZoom()` to sync sections when linked
   - Added `skipSync` parameter to prevent recursion
   - Separated note text vs other text positioning

3. **v4-vertical-header-sections-annotated.html**
   - Added `toggleZoomLink()` wrapper function
   - Added zoom link initialization on page load
   - Ensured checkbox state syncs with controller

4. **CLAUDE.md**
   - Added "Scaled Offset Anti-Pattern" section
   - Documented problem, solutions, detection
   - Added to best practices

## Preserved from V4.0.7
- ✅ Unified bent note toggle with data-bent grouping
- ✅ Visual state controller created
- ✅ Library expanded by default
- ✅ First song auto-selected and loaded

## Preserved from V4.0.5
- ✅ Clean zoom architecture
- ✅ External zoom controller
- ✅ 60% faster zoom performance

## Testing Results

**Font Sizes:**
- Note names now 22px (was 10px) - 120% increase
- Bold weight applied
- Clearly visible and readable

**Text Centering:**
- Perfect vertical alignment at 100% zoom
- Perfect vertical alignment at 200% zoom
- No drift during Y-zoom

**Lyrics:**
- Start at left edge of note
- Extend to the right
- Left-aligned with first note of syllable

**Zoom Linking:**
- Checkbox checked: All sliders move together
- Checkbox unchecked: Independent zoom
- Console logs: "Zoom linking enabled/disabled"

---

**V4.0.8 delivers professional typography with large, bold note labels, perfect text centering at all zoom levels, proper lyric alignment, and restored zoom linking functionality.**
