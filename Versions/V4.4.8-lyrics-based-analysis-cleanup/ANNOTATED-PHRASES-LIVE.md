# Annotated Phrases Section - LIVE on Bà Rằng Bà Rí

## ✅ Implementation Status: LIVE

The Annotated Phrases section is now **live and functional** on the vertical demo server at **http://localhost:3006** for the song "Bà Rằng Bà Rí".

---

## 📊 Live Results

### Generation Success
```
✓ Relationships matched: "Bà rằng bà rí-relationships.json"
✓ X/Y positions added to 147 notes
✓ Generated phrase annotations: 28 phrases
✓ SVG width: 450px
```

### Detected Patterns
From server console output:
- **4 exact refrains** detected
- **28 phrases** classified by parallelism and semantics
- **6 semantic domains** identified (characters, emotions, actions, nature, abstract, vocatives)

---

## 🎨 Visual Features Implemented

### Section Layout
- **Collapsible sidebar** with vertical header (same style as "Optimal Tuning" and "Phrases")
- **Move controls** (▲ ▼ arrows) for section reordering
- **Synchronized scrolling** with Optimal Tuning tablature
- **Zoom controls** (67%, 100%, 150%, 200%, Fit Width)

### Phrase Visualization
Each phrase displayed as:
- **Colored box** aligned with tablature notes (X-position synchronized)
- **Parallelism badge**: "REFRAIN (1/3)", "STRUCTURAL", etc.
- **Semantic icons**: 👤 characters, 😢 emotions, 💭 abstract, etc.
- **Function label**: OPENING, ANCHOR, CLOSING, etc.
- **Hover tooltips**: Full phrase text, translation, analysis

### Color Coding

**Parallelism Levels:**
- Gold borders → Exact refrains (e.g., "cái duyên ông chồng")
- Blue borders → Structural parallels (same pattern, different words)

**Semantic Domains:**
- Red borders → Emotion phrases (khổ, thương)
- Purple borders → Abstract phrases (duyên, đời)
- Green borders → Nature phrases (chiều, gió)
- Blue borders → Action phrases (đi, làm)
- Orange borders → Character phrases (bà, chồng)
- Dark orange borders → Vocative phrases (ơi, hỡi)

---

## 🔄 Synchronization Features

### Bidirectional Scroll Sync
- Scroll Optimal Tuning tablature → Annotated Phrases scrolls
- Scroll Annotated Phrases → Optimal Tuning tablature scrolls

### X-Zoom Sync
- Zoom Optimal Tuning → Can zoom Annotated Phrases to match
- Uses same formula: `scaledX = 120 + (baseX - 120) * zoomFactor`
- Phrase boxes, labels, and icons all scale correctly

### X-Coordinate Alignment
- Phrase boxes start at first note's X position
- Phrase boxes end at last note's X position
- Perfect alignment with tablature

---

## 📂 Technical Implementation

### Data Flow
```
1. Load relationships: "Bà rằng bà rí-relationships.json"
   - Contains 147 notes with IDs (note_0, note_1, ...)
   - Contains word-to-note mappings

2. Generate tablature from relationships.notes
   - Adds X/Y positions to each note
   - Preserves original note IDs

3. Merge X/Y positions back into relationships.notes
   - relationshipsData.notes[idx].x = properSongData.notes[idx].x

4. Load lyrics segmentation: "Bà rằng bà rí.json"
   - Contains 28 phrases with text, syllable counts, types

5. Calculate phrase positions
   - Find first/last note for each phrase
   - Extract X positions from positioned notes

6. Analyze structure
   - Detect exact refrains (4 found)
   - Detect structural parallels
   - Cluster by semantic domains

7. Render SVG
   - Create phrase boxes with calculated positions
   - Add badges, icons, labels
   - Store base positions for zoom

8. Insert into template
   - Replace {{ANNOTATED_PHRASES_SVG}}
   - Replace {{ANNOTATED_SVG_WIDTH}}
```

### Key Solution: Position Merging
**Problem:** Tablature generator creates new note objects, losing IDs from relationships
**Solution:** Generate tablature, then merge X/Y positions back by index

```javascript
// Before: songData.notes has no proper structure
// After generating tablature: properSongData.notes have X/Y
// Merge back:
relationshipsData.notes[idx].x = properSongData.notes[idx].x;
relationshipsData.notes[idx].y = properSongData.notes[idx].y;
```

---

## 🎯 User Experience

### What Learners See
1. **Scroll down** to "Annotated Phrases" section
2. **Expand** by clicking vertical header
3. **See phrase boxes** aligned with music
4. **Hover** over boxes to see phrase details
5. **Zoom** to magnify specific sections
6. **Scroll** to explore - Optimal Tuning scrolls too

### Learning Value
- **Visual structure**: See how refrains repeat (gold boxes)
- **Semantic patterns**: See how vocabulary clusters by domain
- **Parallelism hierarchy**: Understand exact vs structural vs semantic similarity
- **Functional roles**: Recognize OPENING, ANCHOR, CLOSING patterns

---

## 📋 Files Modified

### Server Integration
- `vertical-demo-server.js`
  - Added phrase annotation imports
  - Added flexible filename matching (diacritic normalization)
  - Added position merging logic
  - Added template replacements

### Template
- `v4-vertical-header-sections-annotated.html`
  - Added Annotated Phrases section with vertical header
  - Added CSS styling for phrase elements
  - Added zoom controls
  - Added legend

### Controllers
- `zoom-controller.js`
  - Added 'annotated' section support
  - Added rect/g transform logic
  - Added scroll sync

---

## ✅ Testing Completed

Visit **http://localhost:3006** to see:
- ✅ Annotated Phrases section visible
- ✅ Collapsible sidebar working
- ✅ Move arrows present
- ✅ Zoom controls functional
- ✅ Phrase boxes displayed
- ✅ Parallelism badges showing
- ✅ Semantic icons showing
- ✅ Legend explaining colors

**LIVE AND WORKING!** 🎉

---

## 🚀 Next Steps (Optional Enhancements)

1. **Click phrase box → Highlight tablature notes**
2. **Play phrase audio** on click
3. **Filter by domain** (show only emotion phrases)
4. **Track 1**: Add independent structural analysis panel above tablature

---

**Status: Production-ready for "Bà Rằng Bà Rí"**
**URL: http://localhost:3006**
**Section Order: #10 (between Lyrics and Song Library)**
