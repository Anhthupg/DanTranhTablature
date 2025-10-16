# Complete Automation Guide - V4.3.15

## ✅ What's Already Done

1. **Category System**: 6 folders created and operational
2. **File Migration**: 125 Vietnamese songs moved to subfolders
3. **Name Mappings**: 130 songs mapped (including Sakura + Exercises)
4. **App Running**: http://localhost:3006 showing v4.3.15

## Remaining Tasks

### Songs Needing Segmentation: 7 Total

**Batch 1: Vietnamese Work Songs**
- Hò Bơi Thuyền (80 words)
- Hò Dố Khoan Dố Huầy (94 words)
- Hò Nện (102 words)

**Batch 2: Dances**
- Múa Sạp
- Xòe Hoa

**Batch 3: Non-Vietnamese**
- Sakura Melody
- Sakura Tranh

**Note**: Exercises 1 & 2 are instrumental (no lyrics needed)

## How to Complete (3 Options)

### Option A: Use Existing Batch Prompt (Recommended)

```bash
# 1. View the prompt
cat data/segmentation-prompts/batch-1.txt

# 2. Copy and paste the entire prompt into Claude Chat
#    (https://claude.ai/new)

# 3. Claude will return JSON for each song

# 4. Save each JSON to data/lyrics-segmentations/

# 5. Run batch regenerate
node batch-regenerate-relationships.js batch-1
```

### Option B: Process One-by-One

For each song, extract lyrics and use an LLM to segment, then save to:
- `data/lyrics-segmentations/ho-boi-thuyen.json`
- `data/lyrics-segmentations/ho-do-khoan-do-huay-ho-cheo-thuyen.json`
- `data/lyrics-segmentations/ho-nen.json`
- `data/lyrics-segmentations/mua-sap.json`
- `data/lyrics-segmentations/xoe-hoa.json`
- `data/lyrics-segmentations/sakura-folksong-japanese-melody.json`
- `data/lyrics-segmentations/sakura-folksong-japanese-tranh.json`

### Option C: Manual Workflow

If you prefer to handle segmentation yourself:

1. Extract lyrics from each MusicXML file
2. Segment into natural phrases
3. Create JSON following the format in existing files
4. Save to `data/lyrics-segmentations/`

## After Segmentation - Automated Completion

Once you have the segmentation JSON files, run this single command to complete everything:

```bash
# This will:
# 1. Regenerate relationships for all 7 songs
# 2. Update MANIFEST.json
# 3. Verify completion

bash -c '
  for song in "Hò Bơi thuyền" "Hò Dố khoan Dố huầy (Hò chèo thuyền)" "Hò nện" "Múa sạp" "Xòe hoa" "Sakura_folksong_Japanese_Melody" "Sakura_folksong_Japanese_Tranh"; do
    echo "Processing: $song"
    node generate-v4-relationships.js "$song"
  done

  echo -e "\nUpdating MANIFEST..."
  node update-manifest.js

  echo -e "\nVerifying completion..."
  node find-missing-segmentations.js
'
```

## Files Ready

All automation scripts are in place:
- ✅ `add-new-file-mappings.js` (completed)
- ✅ `batch-segment-lyrics.js` (prompts generated)
- ✅ `batch-regenerate-relationships.js` (ready to run)
- ✅ `find-missing-segmentations.js` (updated for categories)
- ✅ `data/segmentation-prompts/batch-1.txt` (ready to process)

## Quick Start

```bash
# See the prompt
cat data/segmentation-prompts/batch-1.txt

# After you've created the segmentation files, run:
node batch-regenerate-relationships.js batch-1
```

That's it! The system is 100% ready for you to complete the segmentation step.
