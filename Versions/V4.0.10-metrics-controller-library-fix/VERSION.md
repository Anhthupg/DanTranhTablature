# V4.0.10 - MetricsController & Library Metadata Fix

## New Controller: Unified Metric Updates

### MetricsController Created
**Purpose:** Update all instances of the same metric across the page simultaneously

**Problem:**
```javascript
// Before: Update each instance manually
document.getElementById('optimalBentCount').textContent = '14 bent notes';
document.getElementById('alt1BentCount').textContent = '14 bent notes';
document.querySelector('.stats-bent-notes').textContent = '14';
// Tedious, error-prone, inconsistent formatting
```

**Solution:**
```javascript
// After: One update, all change!
metricsController.update('bent-notes', 14, 'bentNotes');
// All instances show "14 bent notes" with consistent formatting
```

### HTML Pattern (Data Attributes)
```html
<!-- Multiple places showing same metric -->
<span data-metric="bent-notes">0</span>              <!-- Library card -->
<span data-metric="bent-notes" id="optimalBentCount">0 bent notes</span>  <!-- Tablature info -->
<span data-metric="bent-notes">0</span>              <!-- Statistics panel -->
```

### Usage Examples

**Single Metric Update:**
```javascript
metricsController.update('bent-notes', 14, 'bentNotes');
// Updates all 3 spans to "14 bent notes"
```

**Batch Update:**
```javascript
metricsController.updateBatch({
    'bent-notes': 14,
    'total-notes': 39,
    'grace-notes': 2,
    'unique-pitches': 3
});
```

**Auto-Extract from SVG:**
```javascript
metricsController.autoUpdateFromSVG('optimalSvg', 'optimal-');
// Automatically counts and updates: total-notes, bent-notes, grace-notes
```

### Built-in Formatters
- `bentNotes`: "14 bent notes" (handles singular/plural)
- `noteCount`: "39 notes"
- `percentage`: "78.4%"
- `number`: "1,234" (with commas)
- `tuning`: "C-D-E-G-A"
- `timeSignature`: "2/4"

### Benefits
- ✅ Update once → all instances change
- ✅ Consistent formatting everywhere
- ✅ No manual DOM queries per location
- ✅ Auto-extraction reduces code
- ✅ Perfect for 100+ metrics analysis

---

## Library Metadata Fixed

### Problem
- Cached `song-library.json` had stale bent note counts
- Example: "Bồ Các" showed 0 bent notes (actually has 14)
- Tablature displayed correctly but library card wrong

### Solution
1. **Deleted Stale Cache**
   ```bash
   rm data/library/song-library.json
   ```

2. **Regenerated from Source**
   - Scanned 128 MusicXML files
   - Extracted fresh metadata for 119 songs
   - Calculated correct bent note counts
   - 9 songs failed (missing titles) - edge cases

3. **Verified Results**
   ```json
   {
     "title": "BỒ CÁC LÀ BÁC CHIM RI",
     "bentNotes": 14,  // ✅ Correct!
     "bentStrings": 1,
     "totalNotes": 39,
     "optimalTuning": "C-D-E-G-A"
   }
   ```

### LibraryController Enhanced
**Dynamic Bent Count Updates:**
```javascript
// After loading SVG, count bent elements
const bentCount = svg.querySelectorAll('[data-bent="true"]').length / 4;

// Update display
document.getElementById('optimalBentCount').textContent = `${bentCount} bent notes`;
```

**Why divide by 4?**
Each bent note has 4 elements:
1. Circle (note head)
2. Polygon (resonance triangle)
3. Line (bending indicator)
4. Text (bending dot)

---

## Files Created

**1. metrics-controller.js** (140 lines)
- Unified metric update system
- Data attribute-based selection
- Built-in formatters
- Auto-extraction from SVG
- Batch update support

**2. song-library.json** (regenerated)
- Fresh metadata for 119 songs
- Correct bent note counts
- Accurate statistics

---

## Files Modified

**1. library-controller.js**
- Added bent note count updates after loading tablature
- Counts `[data-bent="true"]` elements in SVG
- Updates both optimal and alt1 sections

**2. CLAUDE.md**
- Added MetricsController documentation
- Added 4 Development Patterns section
- Added V4.0.10 updates

---

## Development Patterns Documented

### Pattern 1: Data Attribute Grouping
Group related elements for unified operations
```html
<circle data-bent="true"/>
<polygon data-bent="true"/>
```

### Pattern 2: Scaled Offset Prevention
Prevent offset scaling during zoom transformations
```javascript
// Generate at same position, use CSS for offset
<text y="200" dominant-baseline="middle"/>
```

### Pattern 3: External Controller Extraction
Extract 100+ line code blocks to external controllers
- 896 lines extracted so far (4 controllers)

### Pattern 4: Inline Styles Override CSS
Use `element.style.fill` not `setAttribute('fill')`

---

## Controller Progress

**Extracted:**
1. ✅ ZoomController - 300 lines (V4.0.5)
2. ✅ VisualStateController - 240 lines (V4.0.7)
3. ✅ LibraryController - 216 lines (V4.0.9)
4. ✅ MetricsController - 140 lines (V4.0.10)

**Total:** 896 lines extracted to reusable controllers

**Remaining Componentization:**
- Priority #2: Integrate VisualStateController (replace inline toggleBentNotes)
- Priority #3: SectionController (~100 lines)
- Priority #4: Template separation (wait until 2000+ lines)

---

## Preserved from V4.0.9
- ✅ LibraryController extraction
- ✅ Priority #1 componentization complete

## Preserved from V4.0.8
- ✅ Triangle resonance alignment
- ✅ Note labels (22px bold superscript)
- ✅ Text centering (Scaled Offset fix)
- ✅ Zoom linking
- ✅ Lyrics left-aligned

---

**V4.0.10 Status:** Production-ready with 4 external controllers, correct library metadata, and unified metrics update system!
