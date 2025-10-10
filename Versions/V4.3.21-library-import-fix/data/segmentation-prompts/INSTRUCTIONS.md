
# Batch Lyrics Segmentation Instructions

## Workflow

### Step 1: Process Each Batch (1 batches total)

For each batch file (batch-1.txt, batch-2.txt, etc.):

1. Open the batch prompt file
2. Copy the entire content
3. Paste into Claude (or your preferred LLM)
4. Claude will return JSON for each song
5. Save each JSON to the specified path

### Step 2: After Each Batch - Run Post-Processing

```bash
# Regenerate relationships for processed songs
node batch-regenerate-relationships.js batch-1

# Update MANIFEST
node update-manifest.js
```

### Step 3: Verify

```bash
# Check what's left
node find-missing-segmentations.js
```

### Step 4: Repeat

Process next batch and repeat Steps 2-3.

## Batches


### Batch 1 (3 songs)

Songs:
1. Hò Bơi Thuyền
2. Hò Dố Khoan Dố Huầy (hò Chèo Thuyền)
3. Hò Nện

Prompt: `data/segmentation-prompts/batch-1.txt`


## Quick Commands

```bash
# View batch prompt
cat data/segmentation-prompts/batch-1.txt

# After segmentation, regenerate relationships
node batch-regenerate-relationships.js batch-1

# Check progress
node find-missing-segmentations.js
```
