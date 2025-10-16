# Complete Command for Adding New Folk Songs - V4.3.16

## For Future Use - Just Tell Me This:

```
I added {N} new folk songs (my own transcriptions, public domain) to {folder}.
Process them using V4.3.16 workflow.

Files:
- Song1.xml
- Song2.xml
```

I will automatically run this complete workflow:

---

## The Complete Automation I'll Run:

```bash
cd "/Users/ngothanhnhan/Downloads/Dan Tranh Tablature/v4"

# 1. Scan category folders and detect pairs
node categorize-and-link-songs-v2.js

# 2. Add name mappings (I'll update the script first with your file names)
node add-new-file-mappings.js

# 3. Rebuild library
rm -f data/library/song-library.json
timeout 60 node auto-import-library.js || true

# 4. Find songs needing segmentation
node find-missing-segmentations.js

# 5. Generate segmentation prompts
node batch-segment-lyrics.js

# 6. Create segmentation JSON files (instrumental or vocal)
# For vocal: I'll segment the lyrics based on your transcriptions
# For instrumental: I'll create empty placeholders

# 7. Regenerate relationships for all new songs
node batch-regenerate-relationships.js batch-1

# 8. Generate pattern analysis
for song in {new_songs}; do
  node pattern-analyzer.js "$song"
done

# 9. Verify completion
node find-missing-segmentations.js

# 10. Report results
```

---

## What I Need From You:

Just place the MusicXML files in the correct folder:

| Folder | What to Put |
|--------|-------------|
| `data/musicxml/vietnamese-skeletal/` | Original Vietnamese songs |
| `data/musicxml/vietnamese-dantranh/` | Vietnamese songs with "Tranh" in filename |
| `data/musicxml/nonvietnamese-skeletal/` | Foreign songs (original) |
| `data/musicxml/nonvietnamese-dantranh/` | Foreign songs with "Tranh" in filename |
| `data/musicxml/exercises-skeletal/` | Exercises (basic) |
| `data/musicxml/exercises-dantranh/` | Exercises with "Tranh" or "dan-tranh" in filename |

---

## One-Line Manual Command (If You Want to Run It Yourself):

```bash
cd "/Users/ngothanhnhan/Downloads/Dan Tranh Tablature/v4" && \
node categorize-and-link-songs-v2.js && \
node find-missing-segmentations.js && \
node batch-segment-lyrics.js && \
echo "Now process the batch prompt and run: node batch-regenerate-relationships.js batch-1"
```

---

## Tested With:

✅ 9 songs processed successfully:
- 3 Vietnamese work songs (vocal)
- 2 Japanese folk songs (Sakura pair)
- 2 Dan Tranh exercises (instrumental)
- 2 Vietnamese dances (instrumental)

---

**Version**: V4.3.16
**Backed Up**: 2025-10-10
**Status**: Production Ready
**Total Songs**: 129
