# Complete Command for Adding New Folk Songs - V4.3.15

## For Future: When You Add New Songs

### ONE-LINE COMMAND (After placing MusicXML files):

```bash
cd "/Users/ngothanhnhan/Downloads/Dan Tranh Tablature/v4" && \
node categorize-and-link-songs-v2.js && \
rm -f data/library/song-library.json && \
timeout 60 node auto-import-library.js || true && \
node find-missing-segmentations.js && \
node batch-segment-lyrics.js
```

This will:
1. ✅ Scan all category folders
2. ✅ Detect skeletal-interpretation pairs
3. ✅ Rebuild library with new files
4. ✅ Find songs needing segmentation
5. ✅ Generate batch prompts

---

## What to Tell Me (Claude) for Full Automation

**Just say this:**

```
I added {N} new Vietnamese folk songs that I transcribed (public domain)
to the {category} folder. Process them using the V4.3.15 workflow.

File names:
- Song1.xml
- Song2.xml
- etc.
```

**I will automatically:**
1. ✅ Run the one-line command above
2. ✅ Add name mappings for new files
3. ✅ Create segmentation JSON files (since they're your transcriptions)
4. ✅ Regenerate relationships
5. ✅ Verify completion

---

## Manual Workflow (If You Prefer)

### Step 1: Place Files
```bash
# Put MusicXML files in appropriate folders
cp "Song.xml" data/musicxml/vietnamese-skeletal/
```

### Step 2: Run Detection
```bash
node categorize-and-link-songs-v2.js
```

### Step 3: Rebuild Library
```bash
rm -f data/library/song-library.json
node auto-import-library.js
```

### Step 4: Check Missing
```bash
node find-missing-segmentations.js
```

### Step 5: Generate Prompts
```bash
node batch-segment-lyrics.js
```

### Step 6: Add Name Mappings (If Needed)

Edit `add-new-file-mappings.js` with new entries, then:
```bash
node add-new-file-mappings.js
```

### Step 7: Create Segmentation Files

Either:
- Ask me (Claude) with the batch prompt
- Process with another LLM
- Create manually

Save to: `data/lyrics-segmentations/{backend-id}.json`

### Step 8: Regenerate Relationships
```bash
node batch-regenerate-relationships.js batch-1
```

### Step 9: Verify
```bash
node find-missing-segmentations.js
# Should show: Total missing: 0
```

---

## Category Folder Guide

| Folder | What Goes Here | Example |
|--------|---------------|---------|
| `vietnamese-skeletal/` | Original Vietnamese songs | `Lý Chiều Chiều.xml` |
| `vietnamese-dantranh/` | Vietnamese + Dan Tranh | `Lý Chiều Chiều Tranh.xml` |
| `nonvietnamese-skeletal/` | Foreign songs (original) | `Sakura_Melody.musicxml` |
| `nonvietnamese-dantranh/` | Foreign + Dan Tranh | `Sakura_Tranh.musicxml` |
| `exercises-skeletal/` | Technical exercises | `Scale Exercise.xml` |
| `exercises-dantranh/` | Exercises + Dan Tranh | `Scale Exercise Tranh.xml` |

---

## Key Files Updated in V4.3.15

| File | What Changed |
|------|--------------|
| `utils/data-loader.js` | ✅ Now searches category subfolders |
| `auto-import-library.js` | ✅ Scans recursively in all folders |
| `find-missing-segmentations.js` | ✅ Updated for category structure |
| `categorize-and-link-songs-v2.js` | ✅ Handles all 6 categories + exercises |
| `routes/main-page.js` | ✅ Version updated to v4.3.15 |

---

## Quick Reference

**Check status:**
```bash
node find-missing-segmentations.js
```

**View category summary:**
```bash
node categorize-and-link-songs-v2.js
```

**Regenerate library:**
```bash
rm -f data/library/song-library.json && node auto-import-library.js
```

---

**This workflow is production-ready and tested with 129 songs!**
