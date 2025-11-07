# Complete Lyrics Segmentation Workflow - V4.3.15

## Status: Ready to Execute

✅ **Name Mappings Added**: 130 songs total (126 + 4 new)
✅ **Category System**: 6 folders operational
✅ **Songs Needing Segmentation**: 7 total

## Songs to Process

### Batch 1: Vietnamese Work Songs (3 songs)
1. **Hò Bơi Thuyền** - `ho-boi-thuyen.json`
2. **Hò Dố Khoan Dố Huầy** - `ho-do-khoan-do-huay-ho-cheo-thuyen.json`
3. **Hò Nện** - `ho-nen.json`

### Batch 2: Dances (2 songs)
4. **Múa Sạp** - `mua-sap.json`
5. **Xòe Hoa** - `xoe-hoa.json`

### Batch 3: New Files (2 songs + 2 exercises)
6. **Sakura Melody** - `sakura-folksong-japanese-melody.json`
7. **Sakura Tranh** - `sakura-folksong-japanese-tranh.json`
8. **Exercise 1** - `exercise-1-dan-tranh.json` (no lyrics - skip)
9. **Exercise 2** - `exercise-2-dan-tranh.json` (no lyrics - skip)

## Automated Workflow

### Step 1: Process Segmentations

The prompts are ready in: `data/segmentation-prompts/batch-1.txt`

You can:
- **Option A**: Use the prompts with Claude/LLM manually
- **Option B**: Run the automated processor I've created

### Step 2: Save Segmentations

Save each JSON to: `data/lyrics-segmentations/{backend-id}.json`

Format:
```json
{
  "songTitle": "Song Name",
  "segmentedBy": "Claude LLM",
  "phrases": [
    {
      "id": 1,
      "text": "Vietnamese phrase",
      "syllableCount": 4,
      "type": "verse",
      "linguisticType": "declarative",
      "english": "English translation"
    }
  ],
  "statistics": {
    "totalSyllables": 80,
    "totalPhrases": 12,
    "averagePhraseLength": 6.67
  }
}
```

### Step 3: Regenerate Relationships

```bash
# For batch 1 (3 songs)
node generate-v4-relationships.js "Hò Bơi thuyền"
node generate-v4-relationships.js "Hò Dố khoan Dố huầy (Hò chèo thuyền)"
node generate-v4-relationships.js "Hò nện"

# For batch 2 (2 songs)
node generate-v4-relationships.js "Múa sạp"
node generate-v4-relationships.js "Xòe hoa"

# For Sakura
node generate-v4-relationships.js "Sakura_folksong_Japanese_Melody"
node generate-v4-relationships.js "Sakura_folksong_Japanese_Tranh"
```

### Step 4: Update MANIFEST

```bash
node update-manifest.js
```

## Quick Commands

```bash
# 1. Check what's missing
node find-missing-segmentations.js

# 2. View first batch prompt
cat data/segmentation-prompts/batch-1.txt

# 3. After segmentation, regenerate all relationships at once
for song in "Hò Bơi thuyền" "Hò Dố khoan Dố huầy (Hò chèo thuyền)" "Hò nện" "Múa sạp" "Xòe hoa"; do
  node generate-v4-relationships.js "$song"
done

# 4. Update MANIFEST
node update-manifest.js

# 5. Verify completion
node find-missing-segmentations.js
```

## Files Created

| File | Purpose |
|------|---------|
| `add-new-file-mappings.js` | ✅ Added Sakura + Exercise mappings |
| `batch-segment-lyrics.js` | Generate segmentation prompts |
| `find-missing-segmentations.js` | ✅ Updated for category folders |
| `data/segmentation-prompts/batch-1.txt` | ✅ Ready to process |
| `data/segmentation-prompts/INSTRUCTIONS.md` | ✅ Complete guide |

## Expected Output

After completing all steps:
- ✅ 7 new segmentation files in `data/lyrics-segmentations/`
- ✅ 7 new relationship files in `data/relationships/`
- ✅ Updated MANIFEST.json
- ✅ All songs fully integrated into V4 system
- ✅ Category metadata for all new files

## Notes

- **Exercises have no lyrics** - They only need MusicXML parsing, no segmentation
- **Sakura songs** - Japanese lyrics, process same as Vietnamese
- **Work songs** - Often have call-response patterns (Xô/Kể)

---

**Status**: Ready to execute
**Created**: 2025-10-09
**Version**: V4.3.15 Category System
