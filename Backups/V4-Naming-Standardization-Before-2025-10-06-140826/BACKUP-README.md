# V4 Data Backup - Before Naming Standardization

**Created:** 2025-10-06 14:08:26
**Size:** 47 MB
**Purpose:** Complete backup before standardizing all filenames to `lowercase-hyphen-no-tones` format

## What This Backup Contains

Complete snapshot of `v4/data/` directory before executing rename operation:

### Directories (90 processed song directories)
- Format: Mixed (Ba_rang_ba_ri, hat_ru_nam_bo, chi_chi_chanh_chanh, etc.)
- Will become: kebab-case (ba-rang-ba-ri, hat-ru-nam-bo, chi-chi-chanh-chanh)

### Files (531 files across 6 directories)
1. **figurative-enhanced** (172 files)
   - Format: Vietnamese with tones (Bà rằng bà rí-v3.json)
   - Will become: kebab-case (ba-rang-ba-ri-v3.json)

2. **lyrics-segmentations** (119 files)
   - Format: Vietnamese with tones
   - Will become: kebab-case

3. **relationships** (119 files)
   - Format: Vietnamese with tones + suffix
   - Will become: kebab-case + suffix

4. **cultural-prompts** (119 files)
   - Format: Vietnamese with tones + -prompt.txt
   - Will become: kebab-case + -prompt.txt

5. **patterns** (1 file)
6. **lyrics** (1 file)

## Rename Operation Details

**Total operations:** 621
- Directories: 90
- Files: 531

**Target naming convention:**
- Backend: lowercase-hyphen-no-tones
- Example: `Ba_rang_ba_ri` → `ba-rang-ba-ri`
- Example: `Hò đò dọc` → `ho-do-doc`

## How to Restore

If you need to rollback after the rename:

```bash
# Option 1: Use built-in rollback (recommended)
cd v4
node rename-to-standard.js --rollback

# Option 2: Manual restore from this backup
cd /Users/wecanmusic/Downloads/Dan\ Tranh\ Tablature
rm -rf v4/data
cp -r Backups/V4-Naming-Standardization-Before-2025-10-06-140826 v4/data
rm v4/data/BACKUP-README.md  # Remove this file
```

## Files Backed Up

```
data/
├── processed/              # 90 song directories (128 total dirs)
├── figurative-enhanced/    # 172 JSON files
├── lyrics/                 # 1 file
├── lyrics-segmentations/   # 119 JSON files
├── patterns/              # 1 file
├── relationships/         # 119 JSON files
├── cultural-prompts/      # 119 text files
└── [other metadata files]
```

## Verification

Backup integrity:
- ✅ All 128 processed directories copied
- ✅ All JSON files with Vietnamese characters preserved
- ✅ File structure maintained
- ✅ Total size: 47 MB

## Next Steps After Restore

If you restore from this backup:
1. Delete `v4/data/song-name-mappings.json` (or it will be stale)
2. Re-run `node generate-name-mappings.js`
3. Update any code that references the new naming convention

---

**Backup Status:** ✅ Complete and verified
**Safe to proceed with rename operation**
