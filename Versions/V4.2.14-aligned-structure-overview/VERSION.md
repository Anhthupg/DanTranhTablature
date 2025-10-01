# V4.2.14 - Aligned Structure Overview with Row Layout & Full Zoom Support

## Changes

### 1. Fixed Section Numbering
**File:** `generate-phrase-annotations.js`

**Problem:** Division-based logic caused skipped numbers
**Solution:** Separate counters per type (Verse 1, 2, 3..., Dialogue 1, 2, 3...)

### 2. Aligned Row-Based Layout
**Files:** `vertical-demo-server.js`, `v4-vertical-header-sections-annotated.html`

**Layout:**
```
Row 1: Intro | Dialogue 1 | Verse 1 | Refrain 1 | (empty)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Row 2: (empty) | Dialogue 2 | Verse 2 | Refrain 2 | (empty)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Row 3: (empty) | Dialogue 3 | Verse 3 | Refrain 3 | Coda
```

### 3. URL Parameter Song Navigation
**Files:** `vertical-demo-server.js`, `library-controller.js`, `lyrics-controller.js`, `phrase-bars-controller.js`

**Problem:** Clicking songs in library didn't update server-generated sections
**Solution:** Page reload with `?song=` parameter, all controllers read from URL

### 4. Complete Annotated Phrases Zoom Support
**Files:** `render-phrase-annotations.js`, `zoom-controller.js`

**Fixed:**
- Section boxes now X-zoom aware (position and width scale)
- Section labels zoom correctly
- Phrase labels and text zoom correctly
- Semantic domain icons zoom correctly
- Removed white background boxes (text uses shadows for visibility)

**Zoom Controller Updates:**
- Prioritize `getAttribute('data-base-*')` over `dataset.*`
- Handle `<rect>`, `<text>`, and `<g>` elements with base attributes
- All elements scale with pivot at x=120

## Result

- ✅ All 121 songs accessible via library
- ✅ Aligned structure overview with correct numbering
- ✅ Complete zoom support for annotated phrases
- ✅ All sections update when switching songs
- ✅ Clean text rendering without boxes

## Files Modified

1. `generate-phrase-annotations.js` - Section numbering
2. `vertical-demo-server.js` - Row layout + URL params
3. `v4-vertical-header-sections-annotated.html` - Grid + library re-enabled
4. `render-phrase-annotations.js` - Zoom attributes + no boxes
5. `zoom-controller.js` - getAttribute priority + text/g handling
6. `lyrics-controller.js` - URL parameter support
7. `phrase-bars-controller.js` - URL parameter support
8. `library-controller.js` - Page reload navigation
