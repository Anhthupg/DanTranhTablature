# Language Detection & Organization Summary

## Current Status

### What We Have
- **125 total songs** in the collection
- **All are currently in**: `v4/data/musicxml/` (root folder - NOT organized yet)
- **Detection completed**, categorization report generated

### Detection Results
```
Vietnamese (Kinh):               112 songs  (90%)
Vietnamese (Ethnic Minorities):   11 songs  (9%)
Non-Vietnamese:                    2 songs  (1%)
Uncertain (need review):           9 songs
```

### The 2 Non-Vietnamese Songs
1. **Bengu Adai** - Mongolian song
2. **TI DOONG TI** - Unclear origin (possibly instrumental)

### The 11 Vietnamese Ethnic Minority Songs
These have ethnic minority markers OR low Vietnamese characteristics (uncertain → defaults to ethnic):
- tampot
- Khâu Xìa
- Xìn Kin Lẩu
- Hầu Mi Xèo
- And 7 others with low confidence

---

## ⚠️ IMPORTANT: Files NOT Organized Yet

The detection ran successfully, but **files have NOT been moved into subfolders yet**.

**Why?** The `--organize` flag was not used (requires your approval first).

**To organize files now:**
```bash
cd /Users/ngothanhnhan/Downloads/Dan\ Tranh\ Tablature/v4
node language-detector.js --organize
```

This will create the folder structure and move files:
```
v4/data/musicxml/
├── vietnamese/
│   ├── kinh/       # 112 songs will move here
│   └── ethnic/     # 11 songs will move here
└── non-vietnamese/ # 2 songs will move here
```

---

## Approval Process (How It Works)

### Current System (Manual Approval)
1. **Run detection**: `node language-detector.js`
   - Scans all 125 files
   - Generates report: `data/language-detection-report.json`
   - Shows you results in console

2. **Review results**:
   - Check console output for each song's classification
   - Review uncertain songs (9 songs flagged)
   - Check the report file for details

3. **Approve organization**: `node language-detector.js --organize`
   - Creates 3 folders (kinh, ethnic, non-vietnamese)
   - Moves files based on detection
   - This step requires the `--organize` flag (your explicit approval)

### Why Manual Approval?
- **Safety**: You review before any files are moved
- **Accuracy**: You can override wrong classifications
- **Flexibility**: You can manually move files if detector is wrong

---

## How to Override Wrong Classifications

If the detector misclassifies a song, you can manually correct it:

### Method 1: Before Organizing
Edit the report file `data/language-detection-report.json` and change the classification.

### Method 2: After Organizing
Just move the file to the correct folder:

```bash
# Example: Move from ethnic to kinh
mv data/musicxml/vietnamese/ethnic/song.musicxml.xml \
   data/musicxml/vietnamese/kinh/

# Example: Move from non-vietnamese to vietnamese/ethnic
mv data/musicxml/non-vietnamese/song.musicxml.xml \
   data/musicxml/vietnamese/ethnic/
```

Then regenerate the song data:
```bash
node generate-v4-relationships.js "Song Name"
node pattern-analyzer.js "Song Name"
```

---

## The 9 Uncertain Songs (Need Review)

These songs have **medium or low confidence** classifications:

### Check these in the report:
```bash
cat data/language-detection-report.json | jq '.uncertain'
```

**Common reasons for uncertainty:**
- No lyrics (instrumental)
- Very short songs (< 10 words)
- Mixed language/dialect
- Low Vietnamese tone markers (< 20%)

**Recommendation:**
- Review each manually
- Check lyrics content
- Move to correct folder if needed

---

## Next Steps

### Step 1: Review & Organize (Recommended Now)
```bash
# Review the 9 uncertain songs first
cat data/language-detection-report.json | jq '.uncertain[] | {file: .file, reason: .detection.reason}'

# Then organize all files
node language-detector.js --organize
```

### Step 2: Update Library System
After organizing, the library system needs to scan the new folder structure:
- Update `auto-import-library.js` to scan subfolders
- Add language/category metadata to library data
- Implement UI filtering (Kinh/Ethnic/Non-Vietnamese toggles)

### Step 3: Add UI Filtering
In the Song Library section, add checkboxes:
```
☑ Vietnamese (Kinh)        [112 songs]
☐ Vietnamese (Ethnic)      [11 songs]
☐ Non-Vietnamese           [2 songs]
```

---

## Duplicate Song Cards Issue

### Possible Causes:
1. **Multiple library sections** in the template (check for duplicate `<div id="libraryGrid">`)
2. **Multiple update() calls** during page load
3. **Demo data + real data** both loading

### Debug Steps:
```bash
# Check for duplicate library grids
grep -n "libraryGrid" templates/v4-vertical-header-sections-annotated.html

# Check console for multiple library loads
# Open browser console and look for:
# "Loaded X songs from library" (should only appear once)
```

### Quick Fix:
Open browser DevTools → Console, check if you see:
- Multiple "Initializing Library Controller..." messages
- Multiple "Loaded X songs from library" messages

If yes, the controller is initializing multiple times.

---

## Summary

**Status:**
- ✅ Detection complete (125 songs analyzed)
- ⏸️ Organization pending (waiting for `--organize` flag)
- ⏸️ UI filtering not yet implemented
- ❓ Duplicate cards issue needs investigation

**Next Action:**
```bash
# 1. Organize files (with your approval)
node language-detector.js --organize

# 2. Check which songs moved where
ls -la data/musicxml/vietnamese/kinh/ | wc -l      # Should show 112
ls -la data/musicxml/vietnamese/ethnic/ | wc -l    # Should show 11
ls -la data/musicxml/non-vietnamese/ | wc -l       # Should show 2

# 3. Investigate duplicate cards
# Check browser console for multiple library load messages
```

---

**All 125 songs ARE Vietnamese songs** - Only 2 are from other countries (Bengu Adai, TI DOONG TI). The rest are Vietnamese, either Kinh (mainstream) or ethnic minorities (Ede, Jarai, Hmong, etc.).
