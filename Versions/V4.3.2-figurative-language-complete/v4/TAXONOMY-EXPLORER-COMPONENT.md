# Taxonomy Explorer Component

## Component Name: `TaxonomyExplorer`

Multi-dimensional, cross-referenced navigation system for Vietnamese Folk Songs with rich metadata extraction and contextual information at every tier.

---

## Architecture Overview

```
Vietnamese Folk Songs (Root)
├─ Dual Navigation
│  ├─ By Region → Genre → Song → Phrase → Word
│  └─ By Genre → Regional Variant → Song → Phrase → Word
│
├─ Rich Metadata (from MusicXML)
│  ├─ Composer (genre + region)
│  ├─ Province/collector info
│  ├─ Performer/arranger
│  └─ Musical features (time sig, key, tempo)
│
└─ Cross-References
   ├─ Genres across regions (e.g., Hò in Central + Southern)
   ├─ Similar songs/genres
   └─ Shared characteristics
```

---

## Component Files

### 1. **taxonomy-metadata-parser.js** (Completed ✓)
**Purpose:** Rich metadata extraction from MusicXML files

**Extracts:**
- Title, subtitle, composer, arranger
- **Genre** (Quan Họ, Lý, Hát Ru, Hò, etc.)
- **Region** (Northern, Central, Southern, Highland)
- **Province** (Bắc Ninh, Phú Thọ, Nghệ An, etc.)
- **Collector** ("Sưu tầm: Nguyễn Đằng Hòe")
- **Performer** ("Người hát: Nguyễn Thị B")
- **Time signature, key signature, tempo**

**Key Methods:**
- `parseMusicXML(filePath)` - Main parsing function
- `parseComposerField(str)` - Extract genre/region/collector
- `parseArrangerField(str)` - Extract performer/recorder
- `classifySongFromTitle(title)` - Fallback classification

---

### 2. **generate-enhanced-taxonomy.js** (Completed ✓)
**Purpose:** Generate cross-referenced taxonomy with contextual info

**Generates:**
```javascript
{
  "vietnameseFolkSongs": {
    "metadata": {
      "totalSongs": 121,
      "totalPhrases": 931,
      "totalWords": 4205,
      "totalGenres": 15,
      "totalRegions": 4
    },

    "byRegion": {
      "northern": {
        "name": "Northern Vietnam",
        "songCount": 67,
        "genres": {
          "quan_ho": { "songCount": 12, "songs": [...] },
          "ly": { "songCount": 23, "songs": [...] }
        },
        "provinces": ["Bắc Ninh", "Phú Thọ"],
        "sharedGenresWith": ["central", "southern"]
      }
    },

    "byGenre": {
      "ho": {
        "name": "Hò (Work Song)",
        "totalSongs": 18,
        "regionalVariants": {
          "central": { "songCount": 10, "songs": [...] },
          "southern": { "songCount": 8, "songs": [...] }
        }
      }
    },

    "crossReferences": {
      "genresByRegion": {
        "ho": ["central", "southern"],
        "hat_ru": ["northern", "central", "southern"]
      }
    }
  }
}
```

**Usage:**
```bash
node generate-enhanced-taxonomy.js
# Generates: data/enhanced-taxonomy.json
```

---

### 3. **taxonomy-explorer.js** (To be created)
**Purpose:** Client-side navigation controller

**Features:**
- Load taxonomy data
- Handle dual navigation (region/genre)
- Update context panel
- Track user position (breadcrumb)
- Cross-reference highlighting

**Key Methods:**
```javascript
class TaxonomyExplorer {
  constructor(taxonomyData)

  // Navigation
  navigateToRegion(regionKey)
  navigateToGenre(genreKey)
  navigateToSong(songFilename)

  // Context
  getCurrentContext()
  getSimilarItems()
  getSharedCharacteristics()

  // Rendering
  renderRegionNode(region)
  renderGenreNode(genre)
  renderSongNode(song)
  updateBreadcrumb()
  updateContextPanel()
}
```

---

### 4. **templates/components/taxonomy-explorer.html** (To be created)
**Main navigation template**

**Structure:**
```html
<div class="taxonomy-explorer">

  <!-- Header with navigation mode -->
  <div class="taxonomy-header">
    <h2>Vietnamese Folk Songs (121)</h2>
    <div class="nav-mode">
      <button class="active">By Region</button>
      <button>By Genre</button>
      <button>Alphabetical</button>
    </div>
  </div>

  <!-- Tree view (collapsible) -->
  <div class="taxonomy-tree">
    <!-- Dynamic content -->
  </div>

  <!-- Context panel (sticky) -->
  <div class="context-panel">
    <div class="breadcrumb">...</div>
    <div class="current-level">...</div>
    <div class="related-items">...</div>
    <div class="shared-characteristics">...</div>
  </div>

</div>
```

---

### 5. **templates/components/taxonomy-region-node.html**
**Region card template**

```html
<div class="region-node" data-region="{{REGION_KEY}}">
  <div class="region-header" onclick="toggleRegion('{{REGION_KEY}}')">
    <span class="icon">▶</span>
    <h3>{{REGION_NAME}}</h3>
    <span class="stats">{{SONG_COUNT}} songs, {{GENRE_COUNT}} genres</span>
  </div>

  <div class="region-content collapsed">
    <div class="region-description">{{DESCRIPTION}}</div>

    <div class="musical-characteristics">
      <h4>Musical Characteristics:</h4>
      <ul>{{CHARACTERISTICS_LIST}}</ul>
    </div>

    <div class="genres-list">
      {{GENRE_NODES}}
    </div>

    <div class="cross-references">
      <h4>Shared genres with:</h4>
      {{SHARED_REGIONS}}
    </div>
  </div>
</div>
```

---

### 6. **templates/components/taxonomy-genre-node.html**
**Genre card template (supports cross-regional)**

```html
<div class="genre-node" data-genre="{{GENRE_KEY}}">
  <div class="genre-header" onclick="toggleGenre('{{GENRE_KEY}}')">
    <span class="icon">▶</span>
    <h4>{{GENRE_NAME}}</h4>
    <span class="stats">{{SONG_COUNT}} songs</span>
    {{#if IS_CROSS_REGIONAL}}
      <span class="badge">Multiple Regions</span>
    {{/if}}
  </div>

  <div class="genre-content collapsed">
    <div class="genre-description">{{DESCRIPTION}}</div>

    {{#if IS_CROSS_REGIONAL}}
    <div class="regional-variants">
      <h5>Regional Variants:</h5>
      {{#each VARIANTS}}
        <div class="variant">
          <strong>{{REGION_NAME}}:</strong> {{SONG_COUNT}} songs
          <span class="characteristics">{{CHARACTERISTICS}}</span>
        </div>
      {{/each}}
    </div>
    {{/if}}

    <div class="songs-list">
      {{SONG_NODES}}
    </div>

    <div class="similar-genres">
      <h5>Similar Genres:</h5>
      {{SIMILAR_LINKS}}
    </div>
  </div>
</div>
```

---

### 7. **templates/components/taxonomy-song-node.html**
**Song card template**

```html
<div class="song-node" data-song="{{FILENAME}}">
  <div class="song-header" onclick="loadSong('{{FILENAME}}')">
    <h5>{{TITLE}}</h5>
    {{#if SUBTITLE}}<span class="subtitle">{{SUBTITLE}}</span>{{/if}}
  </div>

  <div class="song-metadata">
    <div class="stats">
      <span>{{PHRASE_COUNT}} phrases</span>
      <span>{{SYLLABLE_COUNT}} syllables</span>
    </div>

    {{#if PROVINCE}}
      <div class="province">Province: {{PROVINCE}}</div>
    {{/if}}

    {{#if COLLECTOR}}
      <div class="collector">Collected by: {{COLLECTOR}}</div>
    {{/if}}

    {{#if PERFORMER}}
      <div class="performer">Performed by: {{PERFORMER}}</div>
    {{/if}}

    <div class="musical-features">
      {{#if TIME_SIGNATURE}}<span>{{TIME_SIGNATURE}}</span>{{/if}}
      {{#if KEY_SIGNATURE}}<span>Key: {{KEY_SIGNATURE}}</span>{{/if}}
      {{#if TEMPO}}<span>Tempo: {{TEMPO}}</span>{{/if}}
    </div>

    <div class="themes">
      {{#each THEMES}}
        <span class="theme-badge">{{this}}</span>
      {{/each}}
    </div>
  </div>

  <button class="load-song-btn">View Full Analysis</button>
</div>
```

---

### 8. **templates/components/taxonomy-context-panel.html**
**Context sidebar template**

```html
<div class="context-panel">

  <!-- Breadcrumb -->
  <div class="breadcrumb">
    <a href="#" onclick="navigateHome()">Home</a>
    {{#each BREADCRUMB_ITEMS}}
      > <a href="#" onclick="navigateTo('{{LEVEL}}', '{{KEY}}')">{{NAME}}</a>
    {{/each}}
  </div>

  <!-- Current Level Info -->
  <div class="current-level">
    <h4>You are viewing:</h4>
    <p><strong>{{CURRENT_NAME}}</strong></p>
    <div class="current-stats">{{STATS}}</div>
  </div>

  <!-- Parent Context -->
  <div class="parent-context">
    <h5>{{PARENT_LEVEL}} Context:</h5>
    <ul>
      {{#each PARENT_INFO}}
        <li>{{this}}</li>
      {{/each}}
    </ul>
  </div>

  <!-- Related Items -->
  <div class="related-items">
    <h5>Related:</h5>
    <ul>
      {{#each RELATED}}
        <li><a href="#" onclick="navigateTo('{{LEVEL}}', '{{KEY}}')">{{NAME}}</a></li>
      {{/each}}
    </ul>
  </div>

  <!-- Shared Characteristics -->
  <div class="shared-characteristics">
    <h5>Songs sharing features:</h5>
    <ul>
      {{#each SHARED}}
        <li>{{CHARACTERISTIC}}: {{COUNT}} songs</li>
      {{/each}}
    </ul>
  </div>

</div>
```

---

## Data Flow

```
1. User loads page
   ↓
2. Load enhanced-taxonomy.json
   ↓
3. Render navigation tree (collapsed)
   ↓
4. User clicks region/genre
   ↓
5. Expand node + update context panel
   ↓
6. Show:
   - Current level info
   - Parent context
   - Cross-references
   - Similar items
   ↓
7. User clicks song
   ↓
8. Load full song analysis page
```

---

## Usage Example

```html
<!-- In main page -->
<div id="taxonomy-container"></div>

<script src="/taxonomy-explorer.js"></script>
<script>
  // Load taxonomy
  fetch('/data/enhanced-taxonomy.json')
    .then(r => r.json())
    .then(taxonomy => {
      // Initialize explorer
      const explorer = new TaxonomyExplorer(taxonomy);
      explorer.render(document.getElementById('taxonomy-container'));
    });
</script>
```

---

## Next Steps

1. ✅ Create `taxonomy-metadata-parser.js` (DONE)
2. ✅ Create `generate-enhanced-taxonomy.js` (DONE)
3. ⏳ Run generator to create `enhanced-taxonomy.json`
4. ⏳ Create `taxonomy-explorer.js` (controller)
5. ⏳ Create HTML templates (4 component templates)
6. ⏳ Add CSS styling
7. ⏳ Integrate into main site

---

## Key Features Implemented

✅ **Rich Metadata Extraction**
- Province → Region mapping
- Genre detection from title + composer field
- Collector/performer extraction
- Musical features (time sig, key, tempo)

✅ **Cross-Referenced Structure**
- Dual navigation (by region OR by genre)
- Genres appearing in multiple regions tracked
- Similar songs/genres linked

✅ **Contextual Information**
- Each tier has description + characteristics
- Parent context always visible
- Related items suggested

✅ **Scalable**
- Handles 121 songs, 931 phrases, 4205 words
- Auto-updates when new songs added
- Efficient JSON structure for fast loading

---

**Component Status:** Backend complete, UI templates next!
