# V4.2.37 - Word Journey Sankey Enhancement

**Date:** October 3, 2025
**Feature:** Connected segment highlighting and dynamic data card for Word Journey Map

---

## Overview

Enhanced the Word Journey Map (Sankey Diagram) with interactive highlighting that shows all 3 connected segments (word→meaning→category→songs) as a single journey, plus a dynamic data card displaying detailed information.

---

## Changes Made

### 1. Connected Segment Highlighting

**Implementation:**
- Added unique `journeyId` to group all 3 segments of each word's journey
- All segments share same ID (e.g., `journey_thuong`)
- Hovering over any segment highlights all 3 connected segments
- Glow effect uses category color for visual continuity

**Code:**
```javascript
// In buildLinks() - lines 421-465
const journeyId = `journey_${j.vietnamese}`;

links.push({
    journeyId: journeyId,
    journeyData: j  // Full journey data for card
});
```

**CSS:**
```css
.sankey-link.highlighted {
    stroke-opacity: 0.9;
    filter: drop-shadow(0 0 8px currentColor);
}
```

---

### 2. Dynamic Data Card

**Features:**
- Appears on right side when hovering over journey
- Sticky positioned (follows scroll)
- Shows complete journey information:
  - Vietnamese word (large, teal)
  - English translation (blue)
  - Category badge (colored)
  - Frequency count (red)
  - Song count (green)
  - Flow description

**Layout:**
```html
<div style="display: flex; gap: 20px;">
    <div id="sankeyDiagram" style="flex: 1;">...</div>
    <div id="sankeyDataCard" style="width: 300px; position: sticky;">...</div>
</div>
```

**Code:**
```javascript
// In highlightJourney() - lines 612-638
highlightJourney(journeyId, journeyData) {
    // Highlight all segments
    const allPaths = document.querySelectorAll(`[data-journey-id="${journeyId}"]`);
    allPaths.forEach(path => path.classList.add('highlighted'));

    // Show and populate data card
    document.getElementById('cardVietnamese').textContent = journeyData.vietnamese;
    document.getElementById('cardEnglish').textContent = journeyData.english;
    // ... populate all fields
}
```

---

### 3. Event Handlers

**Implementation:**
- Added `mouseenter` → `highlightJourney()`
- Added `mouseleave` → `clearHighlight()`
- Journey data stored directly on path elements for quick access

**Code:**
```javascript
// In renderSVG() - lines 558-560
path.addEventListener('mouseenter', () => this.highlightJourney(link.journeyId, link.journeyData));
path.addEventListener('mouseleave', () => this.clearHighlight());
```

---

## Files Modified

### `/v4/templates/components/word-journey-sankey.html`
- **Lines 46-92:** Added data card HTML and flex layout
- **Lines 150-161:** Enhanced CSS for highlighting with glow
- **Lines 271-284:** Data card detail section styles
- **Lines 421-465:** Modified `buildLinks()` to add journey IDs
- **Lines 552-560:** Added event listeners to path elements
- **Lines 612-650:** New `highlightJourney()` and `clearHighlight()` methods

---

## Visual Design

### Highlighting Effect
- **Opacity:** 30% → 90% on hover
- **Glow:** 8px drop-shadow matching category color
- **Transition:** 0.3s ease for smooth animation
- **Cursor:** Pointer to indicate interactivity

### Data Card Styling
- **Border:** 2px solid teal (#008080)
- **Shadow:** Elevated with box-shadow
- **Colors:**
  - Vietnamese: Large teal text (#008080)
  - English: Medium blue text (#3498DB)
  - Frequency: Red emphasis (#E74C3C)
  - Song Count: Green emphasis (#27AE60)
  - Category: Badge with category-specific color

---

## Technical Details

### Data Structure Enhancement
```javascript
// Each link now carries:
{
    source: nodeId,
    target: nodeId,
    value: frequency,
    category: 'emotion',
    journeyId: 'journey_thuong',      // NEW: Groups 3 segments
    journeyData: {                     // NEW: Full data for card
        vietnamese: 'thuong',
        english: 'love/feelings',
        category: 'emotion',
        frequency: 125,
        songCount: 30
    }
}
```

### Highlighting Logic
1. **Hover detected** → Extract `journeyId` from path
2. **Query selector** → Find all paths with same `[data-journey-id]`
3. **Add class** → `.highlighted` to all matching paths
4. **Show card** → Populate fields from `journeyData`
5. **On leave** → Remove class, hide card

---

## User Experience

### Before:
- Only hovered segment highlighted
- No way to see full journey details
- Had to mentally connect 3 separate segments

### After:
- Entire journey highlights as one continuous flow
- Data card shows complete journey information
- Visual connection between word, meaning, category, and songs
- Professional glow effect guides eye along journey path

---

## Performance

- **Selector efficiency:** Single `querySelectorAll` per hover
- **No DOM traversal:** Data stored directly on elements
- **Smooth transitions:** Hardware-accelerated CSS filters
- **Memory:** Minimal overhead (journey data reused from original)

---

## Future Enhancements

Potential improvements for next versions:
1. Click to lock highlight (persistent selection)
2. Click word to filter library
3. Animated flow along journey path
4. Export journey as image/PDF
5. Journey comparison (side-by-side data cards)

---

## Testing Checklist

- [x] All 3 segments highlight together on hover
- [x] Data card appears/disappears smoothly
- [x] Category colors match across diagram and card
- [x] Glow effect uses correct color
- [x] Sticky positioning works during scroll
- [x] Works with all category filters
- [x] Works with different topN selections (10-200 words)
- [x] No JavaScript errors in console

---

## Componentization Review

**Status:** Single-use feature in word-journey-sankey.html

**Decision:** Keep inline
- Specific to this visualization
- Not repeated elsewhere
- Clear, well-organized code
- ~80 lines added (manageable)

**Extract when:**
- Used in 3+ different visualizations
- Highlighting logic needed for other diagrams
- Generic sankey controller needed

---

**V4.2.37 Complete:** Word Journey Map now provides intuitive, visual journey tracking with detailed information display!
