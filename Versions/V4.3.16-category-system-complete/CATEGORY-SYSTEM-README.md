# Dan Tranh Tablature V4 - Category System

## Overview

The V4 Category System provides sophisticated organization and analysis of songs across 4 distinct categories, with intelligent relationship tracking between skeletal versions and Dan Tranh interpretations.

## The 4 Categories

### 1. Vietnamese Skeletal (`vietnamese-skeletal`)
- **Description**: Original Vietnamese songs in their basic melodic form
- **Badge**: `VN-S`
- **Color**: Green (#27AE60)
- **Example**: "Lý Chiều Chiều.xml"

### 2. Vietnamese Dan Tranh (`vietnamese-dantranh`)
- **Description**: Vietnamese songs with Dan Tranh interpretation (ornamentations, grace notes, embellishments)
- **Badge**: `VN-DT`
- **Color**: Blue (#3498DB)
- **Example**: "Lý Chiều Chiều Tranh.xml"
- **Naming Rule**: Must contain "Tranh" in filename

### 3. Non-Vietnamese Skeletal (`nonvietnamese-skeletal`)
- **Description**: Non-Vietnamese songs in their basic melodic form
- **Badge**: `NV-S`
- **Color**: Orange (#E67E22)
- **Example**: "Amazing Grace.xml"

### 4. Non-Vietnamese Dan Tranh (`nonvietnamese-dantranh`)
- **Description**: Non-Vietnamese songs with Dan Tranh interpretation
- **Badge**: `NV-DT`
- **Color**: Purple (#9B59B6)
- **Example**: "Amazing Grace Tranh.xml"

## Directory Structure

```
v4/data/musicxml/
├── vietnamese-skeletal/       # Vietnamese songs (original)
│   ├── Lý Chiều Chiều.xml
│   ├── Bà Rằng Bà Rí.xml
│   └── ...
├── vietnamese-dantranh/       # Vietnamese Dan Tranh interpretations
│   ├── Lý Chiều Chiều Tranh.xml
│   ├── Bà Rằng Bà Rí Tranh.xml
│   └── ...
├── nonvietnamese-skeletal/    # Non-Vietnamese songs (original)
│   ├── Amazing Grace.xml
│   └── ...
└── nonvietnamese-dantranh/    # Non-Vietnamese Dan Tranh interpretations
    ├── Amazing Grace Tranh.xml
    └── ...
```

## File Naming Convention

### Skeletal Version
```
Song Name.xml
```

### Dan Tranh Interpretation
```
Song Name Tranh.xml
```

**IMPORTANT**: The word "Tranh" in the filename triggers Dan Tranh classification.

## Relationship Detection

The system automatically detects relationships between skeletal and Dan Tranh versions by:

1. **Base Name Matching**: Removes "Tranh" suffix and file extensions
2. **Case-Insensitive Comparison**: Matches regardless of capitalization
3. **Category Awareness**: Only pairs within same language group

### Example Relationship:

```javascript
{
  baseName: "Lý Chiều Chiều",
  skeletal: {
    file: "Lý Chiều Chiều.xml",
    category: "vietnamese-skeletal",
    metrics: { totalNotes: 57, graceNotes: 8 }
  },
  interpreted: {
    file: "Lý Chiều Chiều Tranh.xml",
    category: "vietnamese-dantranh",
    metrics: { totalNotes: 139, graceNotes: 28 }
  },
  language: "vietnamese"
}
```

## Usage

### 1. Categorize and Scan Songs

```bash
# Scan all category folders and detect relationships
node categorize-and-link-songs.js
```

**Output**: `data/song-categories.json`

### 2. Load Enhanced Library

```bash
# Load library with full metrics and category data
node enhanced-library-loader.js
```

**Output**: `data/library/enhanced-library.json`

### 3. Filter and Aggregate

```javascript
// Load library
const { loadEnhancedLibrary, aggregateMetrics } = require('./enhanced-library-loader');
const library = loadEnhancedLibrary();

// Example 1: All Vietnamese songs (skeletal + Dan Tranh)
const vnAll = aggregateMetrics(['vietnamese-skeletal', 'vietnamese-dantranh'], library);
console.log(vnAll);
// {
//   totalSongs: 125,
//   totalNotes: 8452,
//   avgNotesPerSong: 67,
//   ...
// }

// Example 2: Only Dan Tranh interpretations (all languages)
const dtAll = aggregateMetrics(['vietnamese-dantranh', 'nonvietnamese-dantranh'], library);

// Example 3: Only skeletal versions (all languages)
const skeletal = aggregateMetrics(['vietnamese-skeletal', 'nonvietnamese-skeletal'], library);
```

## UI Integration

### Add to HTML

```html
<!-- Category Filter Section -->
<div id="categoryFilters"></div>

<!-- Metrics Summary Section -->
<div id="metricsSummary"></div>

<!-- Load CSS and JS -->
<link rel="stylesheet" href="/category-filter-styles.css">
<script src="/category-filter-ui.js"></script>
```

### Initialize in JavaScript

```javascript
// Load library data (from API or local)
const library = await fetch('/api/library/enhanced').then(r => r.json());

// Initialize category filter
await window.categoryFilter.initialize(library);

// Register callback for filter changes
window.categoryFilter.setFilterChangeCallback((filteredSongs) => {
    // Update song grid
    renderSongGrid(filteredSongs);
});
```

### Quick Filter Presets

```javascript
// Select all songs
window.categoryFilter.selectPreset('all');

// Only Vietnamese songs
window.categoryFilter.selectPreset('vietnamese');

// Only Non-Vietnamese songs
window.categoryFilter.selectPreset('nonvietnamese');

// Only skeletal versions
window.categoryFilter.selectPreset('skeletal');

// Only Dan Tranh interpretations
window.categoryFilter.selectPreset('dantranh');

// Only paired songs (songs with both skeletal and Dan Tranh versions)
window.categoryFilter.selectPreset('paired');
```

## Metric Aggregation

### Individual Song Metrics

```javascript
{
  filename: "Lý Chiều Chiều Tranh.xml",
  baseName: "Lý Chiều Chiều",
  category: "vietnamese-dantranh",
  categoryLabel: "Vietnamese Dan Tranh",
  categoryBadge: "VN-DT",
  categoryColor: "#3498DB",
  metrics: {
    totalNotes: 139,
    mainNotes: 111,
    graceNotes: 28,
    bentNotes: 14,
    uniquePitches: 7
  }
}
```

### Category Aggregated Metrics

```javascript
{
  categories: ['vietnamese-skeletal', 'vietnamese-dantranh'],
  totalSongs: 125,
  totalNotes: 8452,
  totalGraceNotes: 892,
  totalBentNotes: 1243,
  avgNotesPerSong: 67,
  songs: [/* array of all songs in selected categories */]
}
```

## Comparison Workflows

### 1. Compare Skeletal vs Dan Tranh (same song)

```javascript
const relationship = library.relationships.find(rel =>
    rel.baseName === "Lý Chiều Chiều"
);

console.log(`Skeletal: ${relationship.skeletal.metrics.totalNotes} notes`);
console.log(`Dan Tranh: ${relationship.interpreted.metrics.totalNotes} notes`);
console.log(`Difference: +${relationship.interpreted.metrics.totalNotes - relationship.skeletal.metrics.totalNotes} notes`);
```

### 2. Compare Vietnamese vs Non-Vietnamese

```javascript
const vietnamese = aggregateMetrics(['vietnamese-skeletal', 'vietnamese-dantranh'], library);
const nonVietnamese = aggregateMetrics(['nonvietnamese-skeletal', 'nonvietnamese-dantranh'], library);

console.log(`Vietnamese avg: ${vietnamese.avgNotesPerSong} notes/song`);
console.log(`Non-Vietnamese avg: ${nonVietnamese.avgNotesPerSong} notes/song`);
```

### 3. Compare Skeletal vs Dan Tranh (collection-wide)

```javascript
const allSkeletal = aggregateMetrics(['vietnamese-skeletal', 'nonvietnamese-skeletal'], library);
const allDanTranh = aggregateMetrics(['vietnamese-dantranh', 'nonvietnamese-dantranh'], library);

console.log(`Skeletal avg: ${allSkeletal.avgNotesPerSong} notes/song`);
console.log(`Dan Tranh avg: ${allDanTranh.avgNotesPerSong} notes/song`);
console.log(`Dan Tranh complexity increase: ${((allDanTranh.avgNotesPerSong / allSkeletal.avgNotesPerSong - 1) * 100).toFixed(1)}%`);
```

## Files Created

### Core System

| File | Purpose |
|------|---------|
| `categorize-and-link-songs.js` | Scan folders, detect relationships, generate metadata |
| `enhanced-library-loader.js` | Load all songs with full metrics and category data |
| `category-filter-ui.js` | UI controller for filtering and aggregation |
| `category-filter-styles.css` | Styles for category filter UI |

### Output Data

| File | Content |
|------|---------|
| `data/song-categories.json` | Category scan results and relationships |
| `data/library/enhanced-library.json` | Full library with metrics and categories |

## Workflow: Adding New Songs

### Step 1: Place Files

```bash
# Vietnamese skeletal version
cp "Song.xml" data/musicxml/vietnamese-skeletal/

# Vietnamese Dan Tranh interpretation
cp "Song Tranh.xml" data/musicxml/vietnamese-dantranh/

# Non-Vietnamese skeletal version
cp "Foreign Song.xml" data/musicxml/nonvietnamese-skeletal/

# Non-Vietnamese Dan Tranh interpretation
cp "Foreign Song Tranh.xml" data/musicxml/nonvietnamese-dantranh/
```

### Step 2: Re-scan

```bash
# Regenerate category metadata
node categorize-and-link-songs.js

# Regenerate enhanced library
node enhanced-library-loader.js
```

### Step 3: Verify

```bash
# Check console output for detected relationships
# Verify song appears in correct category
# Confirm metrics are calculated correctly
```

## Best Practices

### File Organization

1. **Always use 4 category folders** - Never place files in root musicxml folder
2. **Use consistent naming** - "Tranh" suffix for Dan Tranh interpretations
3. **Match base names exactly** - Ensures relationship detection works

### Naming Examples

**Good:**
```
vietnamese-skeletal/Lý Chiều Chiều.xml
vietnamese-dantranh/Lý Chiều Chiều Tranh.xml  ✅ Relationship detected
```

**Bad:**
```
vietnamese-skeletal/Lý Chiều Chiều.xml
vietnamese-dantranh/Ly Chieu Chieu Tranh.xml  ❌ Different diacritics, no match
```

### Category Selection

1. **Language**: Determine if Vietnamese or non-Vietnamese (use language detection)
2. **Version**: Check if file contains "Tranh" in name
3. **Placement**: Put in appropriate folder based on above

## Advanced: Custom Aggregations

You can create custom metric aggregations for specific analysis:

```javascript
// Example: Compare grace note usage across categories
function compareGraceNotes(library) {
    const categories = Object.keys(library.byCategory);

    categories.forEach(cat => {
        const metrics = library.metrics.byCategory[cat];
        const graceRatio = (metrics.totalGraceNotes / metrics.totalNotes * 100).toFixed(1);

        console.log(`${cat}: ${graceRatio}% grace notes`);
    });
}

// Example: Find songs with most notes by category
function findTopSongs(library, category, limit = 5) {
    const songs = library.byCategory[category] || [];

    return songs
        .sort((a, b) => b.metrics.totalNotes - a.metrics.totalNotes)
        .slice(0, limit)
        .map(s => ({
            name: s.baseName,
            notes: s.metrics.totalNotes
        }));
}
```

## Troubleshooting

### Relationship Not Detected

**Problem**: Skeletal and Dan Tranh versions not showing as paired

**Solutions**:
1. Check base names match exactly (case-insensitive, but diacritics must match)
2. Verify "Tranh" suffix in Dan Tranh version filename
3. Ensure both files are in correct language group (vn vs non-vn)
4. Run `categorize-and-link-songs.js` to regenerate metadata

### Wrong Category

**Problem**: Song appears in wrong category

**Solutions**:
1. Check folder placement - file location determines category
2. For language: Use language detection report to verify classification
3. For version: Check filename contains "Tranh" for Dan Tranh interpretations
4. Move file to correct folder and re-run `enhanced-library-loader.js`

### Missing Metrics

**Problem**: Some metrics show as 0 or undefined

**Solutions**:
1. Verify MusicXML file is valid
2. Check note parser can extract notes
3. Re-run `enhanced-library-loader.js`
4. Check console for parsing errors

## Future Enhancements

- [ ] Auto-detect language from file content (eliminate manual folder placement)
- [ ] Support multiple interpretation versions (Tranh v1, v2, etc.)
- [ ] Pattern analysis comparison across categories
- [ ] Collection-wide statistics dashboard
- [ ] Export category metrics to CSV/JSON

---

**Category System Version**: 1.0
**Created**: 2025-10-09
**Status**: Production Ready
