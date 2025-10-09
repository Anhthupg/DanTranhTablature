# V4 Naming Convention Standard (Hard-Coded)

**Status:** ✅ IMPLEMENTED (2025-10-06)
**Version:** 1.0
**Applies to:** All V4 data files, directories, and code

---

## 📋 **The Two-Tier System (Mandatory)**

| Layer | Format | Example | Usage |
|-------|--------|---------|-------|
| **Backend** | `lowercase-hyphen-no-tones` | `ba-rang-ba-ri` | Files, directories, URLs, code |
| **Frontend** | `Title Case With Tones` | `Bà Rằng Bà Rí` | Display to users, metadata |

---

## 🔧 **Implementation Components**

### 1. Mapping File (Single Source of Truth)
**Location:** `v4/data/song-name-mappings.json`

**Structure:**
```json
{
  "metadata": {
    "generatedDate": "2025-10-06T18:02:05.474Z",
    "totalSongs": 126
  },
  "namingConvention": {
    "backend": "lowercase-hyphen-no-tones",
    "frontend": "Title Case With Tones"
  },
  "songs": {
    "ba-rang-ba-ri": {
      "displayName": "Bà Rằng Bà Rí",
      "fileName": "ba-rang-ba-ri",
      "originalTitle": "Bà rằng bà rí",
      "musicXMLFile": "Bà rằng bà rí.musicxml.xml",
      "currentProcessedDir": "ba-rang-ba-ri",
      "alternateSpellings": [
        "Bà rằng bà rí",
        "Bà Rằng Bà Rí",
        "Ba rang ba ri",
        "Ba Rang Ba Ri"
      ]
    }
  }
}
```

### 2. Data Loader Integration
**Location:** `v4/utils/data-loader.js`

**Key Methods:**
```javascript
// Load mappings on initialization
this.nameMappings = this.loadNameMappings();

// Convert any variant to backend ID
const backendId = this.toBackendId('Bà rằng bà rí');
// Returns: 'ba-rang-ba-ri'

// Use backend ID for file loading
const filePath = `data/lyrics-segmentations/${backendId}.json`;
```

### 3. Generation Scripts
**Location:** `v4/generate-name-mappings.js`

**Run when:**
- Adding new songs
- After metadata updates
- When file names change

**Command:**
```bash
node generate-name-mappings.js
```

### 4. Rename Script
**Location:** `v4/rename-to-standard.js`

**Modes:**
- `--dry-run` - Preview changes (default)
- `--execute` - Actually rename files
- `--rollback` - Undo last rename operation

**Commands:**
```bash
# Preview
node rename-to-standard.js --dry-run

# Execute
node rename-to-standard.js --execute

# Rollback
node rename-to-standard.js --rollback
```

---

## 📂 **File Naming Rules**

### Backend Files (kebab-case)

**Processed directories:**
```
v4/data/processed/
├── ba-rang-ba-ri/
│   └── v4-analysis.html
├── bai-choi/
└── ho-do-doc/
```

**Data files:**
```
v4/data/
├── figurative-enhanced/
│   ├── ba-rang-ba-ri-v3.json
│   └── ba-rang-ba-ri.json
├── lyrics-segmentations/
│   └── ba-rang-ba-ri.json
├── relationships/
│   └── ba-rang-ba-ri-relationships.json
├── patterns/
│   └── ba-rang-ba-ri-patterns.json
└── cultural-prompts/
    └── ba-rang-ba-ri-prompt.txt
```

**MusicXML files (keep original Vietnamese):**
```
v4/data/musicxml/
└── Bà rằng bà rí.musicxml.xml  ← Original format preserved
```

**Why:** MusicXML files are external sources, shouldn't be renamed

---

## 💻 **Code Usage Patterns**

### ❌ **WRONG: Direct file path construction**
```javascript
// Don't do this!
const lyricsPath = `data/lyrics-segmentations/${songTitle}.json`;
// Breaks if songTitle has tones or spaces
```

### ✅ **CORRECT: Use mapping file**
```javascript
// Step 1: Convert to backend ID
const backendId = dataLoader.toBackendId(songTitle);

// Step 2: Construct path with backend ID
const lyricsPath = `data/lyrics-segmentations/${backendId}.json`;

// Or use DataLoader methods directly:
const lyricsData = dataLoader.loadLyricsSegmentation(songTitle);
```

---

## 🎯 **Conversion Functions**

### Vietnamese Tone Removal
```javascript
function removeTones(str) {
    const toneMap = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        // ... (complete map in generate-name-mappings.js)
    };
    return str.split('').map(char => toneMap[char] || char).join('');
}
```

### Kebab-Case Conversion
```javascript
function toKebabCase(str) {
    return removeTones(str)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphen
        .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
}

// Examples:
toKebabCase('Bà rằng bà rí')  // → 'ba-rang-ba-ri'
toKebabCase('Hò đò dọc')      // → 'ho-do-doc'
toKebabCase('chi chi chành chành')  // → 'chi-chi-chanh-chanh'
```

### Title Case Conversion (Vietnamese-Aware)
```javascript
function toTitleCase(str) {
    const lowercaseWords = ['và', 'của', 'cho', 'với', 'từ', 'trong',
                           'em', 'con', 'là', 'quan', 'họ', 'ru', 'hò'];

    return str.split(/\s+/).map((word, index) => {
        if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
        if (lowercaseWords.includes(word.toLowerCase())) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

// Examples:
toTitleCase('bà rằng bà rí')     // → 'Bà Rằng Bà Rí'
toTitleCase('hát ru em')         // → 'Hát Ru em'  (em stays lowercase)
toTitleCase('đò đưa quan họ')    // → 'Đò Đưa quan họ'  (quan họ lowercase)
```

---

## 🔄 **Adding New Songs (Workflow)**

### Step 1: Add MusicXML file
```bash
# Place file in musicxml directory (keep original Vietnamese name)
cp "New Song.musicxml.xml" v4/data/musicxml/
```

### Step 2: Update metadata
```bash
# Edit song-metadata-complete.json
# Add entry with correct Vietnamese title
```

### Step 3: Regenerate mappings
```bash
node generate-name-mappings.js
# Creates backend ID automatically
```

### Step 4: Process song
```bash
# Your processing scripts will now use kebab-case automatically
node server-tablature-generator.js "New Song"
```

### Step 5: Verify
```bash
# Check that files use kebab-case
ls data/processed/new-song/
ls data/relationships/new-song-relationships.json
```

---

## 🎨 **UI Display Rules**

### Song Cards (Library)
```javascript
// Always use displayName from mapping
const song = nameMappings.songs[backendId];
cardElement.textContent = song.displayName;  // "Bà Rằng Bà Rí"
```

### URLs
```javascript
// Always use fileName (backend ID)
const url = `/song/${song.fileName}`;  // "/song/ba-rang-ba-ri"
```

### Page Titles
```html
<!-- Use displayName -->
<title>{{song.displayName}} - Đàn Tranh Tablature</title>
<!-- Renders: "Bà Rằng Bà Rí - Đàn Tranh Tablature" -->
```

### API Responses
```javascript
// Return both for flexibility
{
  id: 'ba-rang-ba-ri',              // Backend ID (for URLs)
  displayName: 'Bà Rằng Bà Rí',     // Frontend display
  region: 'missing'
}
```

---

## 🧪 **Testing Checklist**

Before deploying naming changes:

- [ ] Run `generate-name-mappings.js` - should complete without errors
- [ ] Check mapping file - all 126 songs have entries
- [ ] Test `toBackendId()` with various inputs
- [ ] Test `DataLoader` methods with display names
- [ ] Verify files load correctly on server
- [ ] Check URLs work with kebab-case IDs
- [ ] Verify display names show correctly in UI
- [ ] Test search with alternate spellings

---

## 📊 **Validation Rules**

### Backend ID Validation
```javascript
function isValidBackendId(id) {
    // Must be lowercase, hyphens only, no tones
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
}

// Valid:
isValidBackendId('ba-rang-ba-ri')  // ✓
isValidBackendId('ho-do-doc')      // ✓

// Invalid:
isValidBackendId('Ba_rang_ba_ri')  // ✗ (uppercase, underscore)
isValidBackendId('Bà rằng')        // ✗ (tones, space)
```

### Display Name Validation
```javascript
function isValidDisplayName(name) {
    // Must start with uppercase, can have Vietnamese characters
    return /^[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/.test(name);
}
```

---

## 🚨 **Important Rules**

### DO:
✅ Use `toBackendId()` for all file operations
✅ Use `displayName` for all UI display
✅ Keep MusicXML files in original format
✅ Regenerate mappings after metadata changes
✅ Always provide both backend ID and display name in APIs

### DON'T:
❌ Rename MusicXML files
❌ Hardcode file paths with display names
❌ Mix underscores and hyphens in backend IDs
❌ Skip tone removal when creating backend IDs
❌ Forget to update mappings after adding songs

---

## 🔧 **Troubleshooting**

### "File not found" errors
**Cause:** Code using display name instead of backend ID
**Fix:** Use `dataLoader.toBackendId()` before constructing paths

### "Song not in mappings"
**Cause:** Mapping file outdated
**Fix:** Run `node generate-name-mappings.js`

### "Wrong display name shown"
**Cause:** Using file name for display
**Fix:** Use `nameMappings.songs[backendId].displayName`

### "Search not working"
**Cause:** Not checking alternate spellings
**Fix:** Use `toBackendId()` which checks all variants

---

## 📚 **Related Files**

- `v4/generate-name-mappings.js` - Mapping generation
- `v4/rename-to-standard.js` - Bulk rename utility
- `v4/utils/data-loader.js` - Data loading with mappings
- `v4/data/song-name-mappings.json` - Mapping file (DO NOT EDIT MANUALLY)
- `v4/RENAME-SUMMARY.md` - Rename operation history

---

## 🎓 **Examples**

### Example 1: Load song by any variant
```javascript
// User searches for "Ba rang ba ri" (no tones)
const backendId = dataLoader.toBackendId('Ba rang ba ri');
// Returns: 'ba-rang-ba-ri'

const songData = dataLoader.loadLyricsSegmentation(backendId);
// Loads: data/lyrics-segmentations/ba-rang-ba-ri.json
```

### Example 2: Display in UI
```javascript
const song = nameMappings.songs['ba-rang-ba-ri'];

// Show in card
cardTitle.textContent = song.displayName;  // "Bà Rằng Bà Rí"

// Link to page
cardLink.href = `/song/${song.fileName}`;  // "/song/ba-rang-ba-ri"
```

### Example 3: Create new processed file
```javascript
const songTitle = "Hò đò dọc";
const backendId = dataLoader.toBackendId(songTitle);

const outputPath = `data/processed/${backendId}/v4-analysis.html`;
// Creates: data/processed/ho-do-doc/v4-analysis.html
```

---

**This is the permanent, hard-coded standard for V4 naming conventions.**
**All future code must comply with these rules.**

**Last Updated:** 2025-10-06
**Status:** ✅ ACTIVE
