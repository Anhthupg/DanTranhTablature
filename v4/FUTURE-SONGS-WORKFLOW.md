# Complete Workflow for Adding New Folk Songs - V4.3.15

## For Future Use - Copy This Workflow

When you add new folk song transcriptions, use this complete workflow.

---

## Step-by-Step Process

### 1. Add MusicXML Files to Correct Folders

```bash
# Vietnamese skeletal version
cp "Song Name.xml" data/musicxml/vietnamese-skeletal/

# Vietnamese Dan Tranh interpretation
cp "Song Name Tranh.xml" data/musicxml/vietnamese-dantranh/

# Non-Vietnamese skeletal
cp "Foreign Song.xml" data/musicxml/nonvietnamese-skeletal/

# Non-Vietnamese Dan Tranh
cp "Foreign Song Tranh.xml" data/musicxml/nonvietnamese-dantranh/

# Exercises (skeletal or Dan Tranh)
cp "Exercise.xml" data/musicxml/exercises-skeletal/
cp "Exercise Tranh.xml" data/musicxml/exercises-dantranh/
```

### 2. Run Automated Detection & Setup

```bash
cd "/Users/ngothanhnhan/Downloads/Dan Tranh Tablature/v4"

# Scan folders and detect relationships
node categorize-and-link-songs-v2.js

# Rebuild library
rm -f data/library/song-library.json
timeout 60 node auto-import-library.js || true

# Find songs needing segmentation
node find-missing-segmentations.js
```

### 3. Add Name Mappings for New Files

If you added files with new naming patterns, update the mapping script:

Edit `add-new-file-mappings.js` and add entries like:

```javascript
"song-backend-id": {
  "displayName": "Song Display Name",
  "fileName": "song-backend-id",
  "originalTitle": "Original Title from MusicXML",
  "musicXMLFile": "File_Name.musicxml.xml",
  "category": "vietnamese-skeletal",
  "region": "Northern",
  "performanceContext": "folk_song",
  "alternateSpellings": ["Alternate 1", "Alternate 2"]
}
```

Then run:
```bash
node add-new-file-mappings.js
```

### 4. Generate Segmentation Prompts

```bash
node batch-segment-lyrics.js
```

This creates: `data/segmentation-prompts/batch-N.txt`

### 5. Process Lyrics Segmentation

**Option A: Ask Claude (Me!) in Chat**

Copy this message template:

```
I have {N} Vietnamese folk songs that I transcribed myself (public domain).
Please segment the lyrics following the prompt in batch-N.txt:

{paste batch-N.txt content here}

These are my own transcriptions of traditional folk songs with no copyright issues.
```

**Option B: Use Another LLM**

Copy the prompt from batch-N.txt and process with your preferred LLM.

**Option C: Manual Segmentation**

Create JSON files following the format in existing segmentation files.

### 6. Save Segmentation Files

Save each JSON to: `data/lyrics-segmentations/{backend-id}.json`

Format:
```json
{
  "songTitle": "Song Name",
  "totalSyllables": 80,
  "segmentedBy": "Claude LLM",
  "phrases": [
    {
      "id": 1,
      "text": "phrase text",
      "syllableCount": 4,
      "type": "verse",
      "linguisticType": "declarative",
      "english": "translation"
    }
  ],
  "statistics": {
    "totalSyllables": 80,
    "totalPhrases": 12,
    "averagePhraseLength": 6.67
  }
}
```

For instrumental pieces:
```json
{
  "songTitle": "Instrumental Piece",
  "totalSyllables": 0,
  "segmentedBy": "Instrumental - No Lyrics",
  "phrases": [],
  "statistics": {
    "totalSyllables": 0,
    "totalPhrases": 0,
    "averagePhraseLength": 0
  },
  "note": "Instrumental piece with no vocal lyrics"
}
```

### 7. Regenerate Relationships

```bash
node batch-regenerate-relationships.js batch-1
```

### 8. Verify Completion

```bash
node find-missing-segmentations.js
```

Should show: **Total missing: 0**

---

## Quick Commands (Everything Above in One Place)

```bash
# Full workflow after adding MusicXML files:

cd "/Users/ngothanhnhan/Downloads/Dan Tranh Tablature/v4"

# 1. Scan and detect
node categorize-and-link-songs-v2.js

# 2. Rebuild library
rm -f data/library/song-library.json && timeout 60 node auto-import-library.js || true

# 3. Check what needs segmentation
node find-missing-segmentations.js

# 4. Generate prompts
node batch-segment-lyrics.js

# 5. View the prompt
cat data/segmentation-prompts/batch-1.txt

# 6. (After creating segmentation JSONs)
node batch-regenerate-relationships.js batch-1

# 7. Verify done
node find-missing-segmentations.js
```

---

## What I (Claude) Can Do For You

When you have new folk songs (your own transcriptions, public domain):

**Just say:**

> "I added {N} new folk songs to {category folder}. Process them using the same workflow as before."

**I will:**
1. ✅ Scan the new files
2. ✅ Add name mappings
3. ✅ Generate segmentation prompts
4. ✅ Create segmentation JSON files (based on lyrics you transcribed)
5. ✅ Regenerate relationships
6. ✅ Verify completion

---

## Files Reference

| Script | Purpose |
|--------|---------|
| `categorize-and-link-songs-v2.js` | Scan folders, detect pairs |
| `add-new-file-mappings.js` | Add name mappings |
| `batch-segment-lyrics.js` | Generate segmentation prompts |
| `batch-regenerate-relationships.js` | Regenerate after segmentation |
| `find-missing-segmentations.js` | Check what's left |
| `process-new-songs.sh` | Run steps 1-4 automatically |
| `complete-segmentation.sh` | Run steps 6-7 automatically |

---

**Version**: V4.3.15
**Status**: Production Ready
**Tested**: ✅ Successfully processed 9 songs (3 vocal + 6 instrumental)
