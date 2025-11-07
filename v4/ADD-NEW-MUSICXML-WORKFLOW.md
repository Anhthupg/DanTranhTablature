# Complete Workflow: Adding New MusicXML Files to V4

This document provides step-by-step instructions for adding new MusicXML files to the V4 system.

## Prerequisites

- MusicXML file with lyrics (if applicable)
- Basic knowledge of the song's metadata (title, language, category)

---

## Step 1: Place MusicXML File in Correct Category Folder

**File:** Your new MusicXML file

**Location:** Choose the appropriate category folder:

```
v4/data/musicxml/
├── vietnamese-skeletal/       (Vietnamese songs, melody only)
├── vietnamese-dantranh/       (Vietnamese songs, full đàn tranh arrangement)
├── nonvietnamese-skeletal/    (Non-Vietnamese songs, melody only)
├── nonvietnamese-dantranh/    (Non-Vietnamese songs, full đàn tranh)
└── exercises-dantranh/        (Exercises and études)
```

**Example:**
```bash
# For a Vietnamese folk song melody
cp "Ly_Ngua_O.musicxml" "v4/data/musicxml/vietnamese-skeletal/"

# For a Chinese song melody
cp "Wu_Ji_The_Untamed.musicxml" "v4/data/musicxml/nonvietnamese-skeletal/"
```

---

## Step 2: Create Lyrics Segmentation File

**File:** `v4/data/lyrics-segmentations/<backend-id>.json`

**Backend ID Format:**
- Lowercase with hyphens
- Example: "Lý Ngựa Ô" → `ly-ngua-o`
- Example: "Wú jī (无羁)" → `wu-ji-the-untamed`

**Template:**
```json
{
  "songTitle": "Your Song Title",
  "language": "Vietnamese|Chinese|English|Instrumental",
  "phrases": [
    {
      "phraseNumber": 1,
      "vietnameseText": "First line of lyrics",
      "englishTranslation": "English translation",
      "syllableCount": 4,
      "linguisticType": "narrative|question|exclamatory|complaint|answer",
      "tones": ["ngang", "sắc", "huyền", "hỏi"],
      "rhymeScheme": "A|B|C|none",
      "lastSyllable": "ô",
      "vowelRhyme": "ô"
    }
  ]
}
```

**For Instrumental Songs:**
```json
{
  "songTitle": "Merry-Go-Round of Life",
  "language": "Instrumental",
  "phrases": [
    {
      "phraseNumber": 1,
      "vietnameseText": "",
      "englishTranslation": "",
      "syllableCount": 0,
      "linguisticType": "instrumental",
      "tones": [],
      "rhymeScheme": "none"
    }
  ]
}
```

**Example Files to Reference:**
- With lyrics: `v4/data/lyrics-segmentations/wu-ji-the-untamed.json`
- Instrumental: `v4/data/lyrics-segmentations/merry-go-round-of-life-howls-moving-castle.json`

---

## Step 3: Generate Relationships File

**Command:**
```bash
cd v4
node generate-v4-relationships.js "your-backend-id"
```

**What This Does:**
1. Reads MusicXML from the category folder
2. Extracts notes, tempo, and metadata
3. Converts slurs/ties to combined notes
4. Maps syllables to notes using lyrics segmentation
5. Saves to `v4/data/relationships/<backend-id>-relationships.json`

**Output File:** `v4/data/relationships/<backend-id>-relationships.json`

Contains:
- `metadata`: Song info, note counts, tempo, generation date
- `wordToNoteMap`: Syllable-to-note mappings
- `noteToWordMap`: Note-to-syllable mappings
- `notes`: Full note data (pitch, duration, lyrics, grace notes)

**Example:**
```bash
node generate-v4-relationships.js "wu-ji-the-untamed"
```

**Expected Output:**
```
[V4 Relationships] Extracted 245 total notes
[V4 Relationships] Divisions: 4 per quarter note
[V4 Relationships] Found tempo: 90 BPM
[V4 Relationships] After slur-to-tie conversion: 243 notes
[V4 Relationships] 243 notes with lyrics (from MusicXML)
[V4 Relationships] Mapped 243 syllables to notes
[V4 Relationships] Saved to: data/relationships/wu-ji-the-untamed-relationships.json
```

---

## Step 4: Update Name Mappings

**File:** `v4/data/name-mappings.json`

**Add Entry:**
```json
{
  "songs": {
    "your-backend-id": {
      "displayName": "Your Song Title",
      "category": "vietnamese-skeletal|nonvietnamese-skeletal|etc",
      "alternateSpellings": [
        "Alternate Spelling 1",
        "Alternate Spelling 2"
      ],
      "currentProcessedDir": null
    }
  }
}
```

**Example:**
```json
{
  "songs": {
    "wu-ji-the-untamed": {
      "displayName": "Wú jī (无羁 The Untamed)",
      "category": "nonvietnamese-skeletal",
      "alternateSpellings": [
        "Wu Ji",
        "无羁",
        "The Untamed Theme"
      ],
      "currentProcessedDir": null
    }
  }
}
```

**Why This Matters:**
- Enables name resolution (any variant → backend-id)
- Required for DataLoader to find your files
- Powers search functionality

---

## Step 5: Test the Song

**Option 1: Via Server**

1. Start the server:
```bash
cd v4
PORT=3006 node vertical-demo-server.js
```

2. Open in browser:
```
http://localhost:3006/?song=your-backend-id
```

**Option 2: Via API**

Test relationships endpoint:
```bash
curl "http://localhost:3006/api/relationships/your-backend-id" | jq '.metadata'
```

Expected response:
```json
{
  "songName": "Your Song Title",
  "totalNotes": 243,
  "mainNotes": 230,
  "graceNotes": 13,
  "totalSyllables": 243,
  "melismaCount": 0,
  "tempo": 90,
  "generatedDate": "2025-01-07T12:00:00.000Z"
}
```

---

## Step 6: (Optional) Generate Pattern Analysis

**Command:**
```bash
cd v4
node pattern-analyzer.js "your-backend-id"
```

**Output File:** `v4/data/patterns/<backend-id>-patterns.json`

Contains:
- KPIC: Pitch patterns (2-note and 3-note transitions)
- KDIC: Duration patterns (main notes and grace notes)
- KTIC: Tone patterns (Vietnamese only)
- KSIC: Syllable patterns
- KRIC: Rhyme patterns
- Context patterns (pronouns, modifiers, reduplication)

**Note:** Only works for songs with MusicXML in V4 data folders

---

## Troubleshooting

### Error: "Lyrics segmentation not found"
**Solution:** Create `v4/data/lyrics-segmentations/<backend-id>.json` (Step 2)

### Error: "Failed to load MusicXML"
**Solution:**
1. Check MusicXML file is in correct category folder
2. Verify filename matches expected pattern
3. Check name-mappings.json entry

### Error: "No mapping found"
**Solution:** Add entry to `v4/data/name-mappings.json` (Step 4)

### Slur/Tie Conversion Issues
- Check MusicXML has `<slur>` or `<tied>` elements
- Verify notes have same pitch for ties
- Run with console output to see conversion log

---

## Quick Reference: Files Checklist

After adding a new song, you should have:

- [ ] `v4/data/musicxml/<category>/<song-name>.musicxml`
- [ ] `v4/data/lyrics-segmentations/<backend-id>.json`
- [ ] `v4/data/relationships/<backend-id>-relationships.json` (generated)
- [ ] Entry in `v4/data/name-mappings.json`
- [ ] (Optional) `v4/data/patterns/<backend-id>-patterns.json` (generated)

---

## Example: Complete Workflow for "Wu Ji"

```bash
# 1. Place MusicXML file
cp "Wu_Ji.musicxml" "v4/data/musicxml/nonvietnamese-skeletal/"

# 2. Create lyrics segmentation (manual - see template above)
# Edit: v4/data/lyrics-segmentations/wu-ji-the-untamed.json

# 3. Generate relationships
cd v4
node generate-v4-relationships.js "wu-ji-the-untamed"

# 4. Add to name-mappings.json (manual)
# Edit: v4/data/name-mappings.json

# 5. Test
PORT=3006 node vertical-demo-server.js
# Open: http://localhost:3006/?song=wu-ji-the-untamed

# 6. (Optional) Generate patterns
node pattern-analyzer.js "wu-ji-the-untamed"
```

---

## Performance Notes (V4.4.1 Optimizations)

With V4.4.1 optimizations, new songs benefit from:

- **80% faster file I/O** (caching)
- **90% faster name resolution** (O(1) index)
- **40% faster queries** (pre-filtered notes)
- **50% faster pattern analysis** (preprocessing)

Your new songs will load and analyze significantly faster than in previous versions!

---

## Need Help?

- Check existing songs for examples: `wu-ji-the-untamed`, `merry-go-round-of-life-howls-moving-castle`
- Review `v4/generate-v4-relationships.js` for data generation logic
- Check `v4/utils/data-loader.js` for name resolution details
