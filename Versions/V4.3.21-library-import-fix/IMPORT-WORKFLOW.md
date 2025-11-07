# MusicXML Import Workflow

## Quick Start (Adding a New Song)

### Step 1: Add MusicXML File
Copy your `.xml` or `.musicxml` file into the appropriate folder:

```bash
# For Vietnamese (Kinh) songs - most common
cp ~/Desktop/new-song.musicxml.xml data/musicxml/vietnamese/kinh/

# For Vietnamese ethnic minority songs (Ede, Jarai, Hmong, etc.)
cp ~/Desktop/new-song.musicxml.xml data/musicxml/vietnamese/ethnic/

# For non-Vietnamese songs (other countries)
cp ~/Desktop/new-song.musicxml.xml data/musicxml/non-vietnamese/
```

**Not sure which folder?** Put it in `data/musicxml/` (root) and run the detector (see Step 2).

---

### Step 2: Auto-Detect Language (Optional - if unsure)
If you placed the file in the root `data/musicxml/` folder:

```bash
# Run detection
node language-detector.js

# Review results, then organize into folders
node language-detector.js --organize
```

**Detection Logic:**
- **Vietnamese (Kinh)**: Songs with Vietnamese tone markers (40%+) and Vietnamese words
- **Vietnamese (Ethnic)**: Songs with ethnic minority markers (Ede, Jarai, etc.) OR low Vietnamese characteristics (uncertain → defaults to ethnic)
- **Non-Vietnamese**: Songs with non-Vietnamese markers ("Bengu Adai", "TI DOONG TI", etc.)

---

### Step 3: Generate All Data
Run the complete processing pipeline:

```bash
# Generate relationships (word-to-note mappings)
node generate-v4-relationships.js "Song Name"

# Generate pattern analysis
node pattern-analyzer.js "Song Name"

# Optional: Generate all visualizations
node generate-all-v4.js "Song Name"
```

---

### Step 4: View in App
Open http://localhost:3006 and the new song will appear in the library!

---

## Folder Structure

```
v4/data/musicxml/
├── vietnamese/
│   ├── kinh/              # Mainstream Vietnamese (Kinh people - 90% of Vietnamese)
│   │   ├── ly-chieu-chieu.musicxml.xml
│   │   └── ba-rang-ba-ri.musicxml.xml
│   └── ethnic/            # Vietnamese ethnic minorities (Ede, Jarai, Hmong, Dao, etc.)
│       ├── khau-xia.musicxml.xml
│       └── xin-kin-lau.musicxml.xml
└── non-vietnamese/        # Songs from other countries
    ├── bengu-adai.musicxml.xml
    └── ti-doong-ti.musicxml.xml
```

---

## Language Classification

### Vietnamese (Kinh) - 90% of Vietnamese People
**Characteristics:**
- High Vietnamese tone markers (40%+)
- Common Vietnamese words (bà, ông, tôi, lý, hò, ru, etc.)
- Standard Vietnamese spelling

**Examples:**
- Lý Chiều Chiều
- Bà Rằng Bà Rí
- Hò Giã Gạo

---

### Vietnamese (Ethnic Minorities) - 10% of Vietnamese People
**Ethnic Groups Included:**
- **Highlands**: Ede, Jarai, Bahnar, Mnong, Cơ Ho, Xơ Đăng
- **Northern Mountains**: Hmong, Dao, Tày, Thái, Nùng, Giáy
- **Others**: Khmer, Chăm, Co Tu, Gié Triêng, Mạ, Ra Glai

**Characteristics:**
- Ethnic minority language markers in title/lyrics
- Low Vietnamese tone markers (< 20%)
- Mixed Vietnamese and ethnic language

**Examples:**
- Khâu Xìa (Hmong)
- Xìn Kin Lẩu (ethnic minority)
- Tampot (ethnic minority)

---

### Non-Vietnamese - Other Countries
**Characteristics:**
- Non-Vietnamese language markers
- Mongolian, Chinese, Thai, Lao, or other Asian languages
- No Vietnamese tone markers

**Examples:**
- Bengu Adai (Mongolian)
- TI DOONG TI (unclear origin)

---

## UI Filtering

### In the App (Song Library Section)
```
☐ Include Non-Vietnamese Songs
☐ Include Ethnic Minority Songs
☑ Show Kinh Vietnamese Only (default)
```

- **Default**: Show only Kinh Vietnamese (mainstream)
- **Check "Ethnic Minority"**: Add Ede, Jarai, Hmong, etc.
- **Check "Non-Vietnamese"**: Add Mongolian, etc.

---

## Detection Report

After running `node language-detector.js`, view the full report:

```bash
cat data/language-detection-report.json
```

**Structure:**
```json
{
  "vietnamese": {
    "kinh": [ /* 112 songs */ ],
    "ethnic": [ /* 11 songs */ ]
  },
  "nonVietnamese": [ /* 2 songs */ ],
  "uncertain": [ /* 9 songs needing review */ ]
}
```

---

## Manual Override (If Detector is Wrong)

If the detector misclassifies a song, just move it manually:

```bash
# Move from ethnic to kinh
mv data/musicxml/vietnamese/ethnic/song.musicxml.xml \
   data/musicxml/vietnamese/kinh/

# Move from non-vietnamese to vietnamese/ethnic
mv data/musicxml/non-vietnamese/song.musicxml.xml \
   data/musicxml/vietnamese/ethnic/
```

Then re-run the generation scripts (Step 3).

---

## Troubleshooting

### Song not showing in library?
1. Check file is in correct folder
2. Run `node auto-import-library.js` to refresh library
3. Restart server: `node vertical-demo-server.js`

### Detector classified wrong?
1. Review `data/language-detection-report.json`
2. Manually move file to correct folder
3. Re-run generation scripts

### Missing data?
```bash
# Regenerate all data for a song
node generate-v4-relationships.js "Song Name"
node pattern-analyzer.js "Song Name"
```

---

**That's it! Your MusicXML import workflow is ready to scale to 1,000+ songs!**
