# V3 Data Directory Structure

## Folder Organization

### 📁 `/v3/data/musicxml/`
**➡️ PASTE YOUR 130 MUSICXML FILES HERE**

This is where you should copy/paste your entire collection of 130 MusicXML files.

Example structure after pasting:
```
v3/data/musicxml/
├── Bà rằng bà rí.musicxml
├── Lý Ngựa Ô.musicxml
├── Lý Tình Tang.musicxml
├── Bèo Dạt Mây Trôi.musicxml
├── ... (126 more files)
└── [Your 130th song].musicxml
```

### 📁 `/v3/data/processed/`
This folder will contain the processed versions of each song after conversion:
- Individual HTML viewers (like V1 interface)
- Extracted pattern data
- Generated thumbnails
- Metadata JSON files

### 📁 `/v3/data/collections/`
Pre-defined song groupings:
- northern-songs.json
- southern-songs.json
- 4-string-pieces.json
- beginner-level.json

## How to Add Your Files

1. **Copy your entire MusicXML folder** to: `v3/data/musicxml/`
2. **Run the import script** (will be created) to process them
3. **Songs appear in the V3 library** automatically

## File Naming Recommendations

- Keep original Vietnamese names (with diacritics)
- Use `.musicxml` extension (lowercase preferred)
- Avoid special characters: `/ \ : * ? " < > |`

## Supported Formats

- ✅ `.musicxml` (preferred)
- ✅ `.MusicXML`
- ✅ `.xml` (if MusicXML format)

## Notes

- Files are processed but never modified
- Original MusicXML files are preserved
- Processing creates new files in `/processed/`