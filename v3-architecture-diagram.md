# Đàn Tranh Tablature V3 Architecture

## Visual Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           📁 MusicXML SOURCE FILES                                    │
│  🎵 130 Vietnamese Songs (.musicxml/.xml/.mxl files in v3/data/musicxml/)           │
└─────────────────┬───────────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        🔄 AUTO-IMPORT SYSTEM                                          │
│                                                                                      │
│  📄 auto-import.js                                                                   │
│  ├─ Watches for new .musicxml files                                                 │
│  ├─ Parses MusicXML using JSDOM                                                     │
│  ├─ Extracts: notes, timing, lyrics, tempo, time signature                         │
│  ├─ Converts slurs to ties (V1-compatible)                                         │
│  ├─ Analyzes patterns (KPIC/KRIC)                                                  │
│  ├─ Detects song-specific tuning (top 5 pitch classes)                            │
│  └─ Generates metadata.json for each song                                          │
│                                                                                      │
│  🎯 Output: Structured JSON data ready for visualization                            │
└─────────────────┬───────────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         💾 PROCESSED DATA STORAGE                                     │
│                                                                                      │
│  📁 v3/data/processed/[Song_Name]/                                                   │
│  ├─ metadata.json ← Rich song data                                                  │
│  │  ├─ noteCount, duration, tempo, timeSignature                                   │
│  │  ├─ tuning: [D,F,G,A,B] ← Song-specific pentatonic                             │
│  │  ├─ bendingMetrics: openStringNotes, bentNotes, percentage                     │
│  │  ├─ patternEfficiency: learnOnly/totalNotes ratios                             │
│  │  └─ stringUsage: which strings used, how many times                            │
│  └─ viewer.html ← Individual song tablature page                                   │
│                                                                                      │
│  📄 song-list.json ← Master registry of all 130 songs                              │
└─────────────────┬───────────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          🌐 WEB SERVER (Node.js)                                     │
│                                                                                      │
│  📄 server-v3.js (Express on port 3002)                                             │
│  ├─ Static file serving from v3/ directory                                         │
│  ├─ Routes:                                                                         │
│  │  ├─ / → Progress dashboard                                                      │
│  │  ├─ /library → Song library (index.html)                                       │
│  │  ├─ /data/processed/[song]/viewer.html → Individual songs                      │
│  │  └─ /api/v3/status → Development status                                         │
│  └─ CORS enabled for client-side data fetching                                     │
└─────────────────┬───────────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        📱 LIBRARY INTERFACE (Frontend)                               │
│                                                                                      │
│  📄 v3/index.html ← Main library page                                               │
│  ├─ 🎨 CSS: 12-color system, 4 themes (White/Light Grey/Dark Grey/Black)          │
│  ├─ 📊 JavaScript:                                                                  │
│  │  ├─ Fetches song-list.json via AJAX                                            │
│  │  ├─ Renders thumbnail cards for all 130 songs                                  │
│  │  ├─ Filtering: by region, strings used, notes, tuning                         │
│  │  ├─ Sorting: by efficiency, note count, string usage                          │
│  │  └─ Search: Vietnamese-aware title search                                      │
│  │                                                                                  │
│  📋 Each Song Card Shows:                                                           │
│  ├─ ✅ Title (Vietnamese Title Case)                                               │
│  ├─ ✅ Tuning: "C-D-E-G-A" (song-specific pentatonic)                            │
│  ├─ ✅ Metrics: "Learn 15/42 notes (64% efficiency)"                              │
│  ├─ ✅ Strings: "7 strings used"                                                  │
│  ├─ ✅ Bent notes: "3 bent strings, 8 bent notes" (if > 0)                       │
│  └─ 🔗 Click → Individual song viewer                                              │
└─────────────────┬───────────────────────────────────────────────────────────────────┘
                  │ 🖱️ User clicks on song card
                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      🎼 INDIVIDUAL SONG VIEWER                                        │
│                                                                                      │
│  📄 v3/data/processed/[Song_Name]/viewer.html                                       │
│  │                                                                                  │
│  🏗️ Generated by generate-viewer.js:                                               │
│  ├─ 📊 Reads metadata.json for song data                                           │
│  ├─ 🎨 Applies V1-style SVG tablature generation                                   │
│  ├─ 🎯 Song-specific tuning (detected pentatonic scale)                           │
│  ├─ 📐 17-string layout with proper Y-positioning                                  │
│  ├─ 🔴 Bent note indicators (red dots + dashed lines)                             │
│  ├─ 🎪 4-theme support matching library                                            │
│  └─ 🔍 Interactive zoom controls (X/Y independent)                                 │
│                                                                                      │
│  🎼 Tablature Features:                                                             │
│  ├─ ⚫ Notes: Grey circles on string lines                                         │
│  ├─ 🔴 Bent notes: Red indicators for non-open pitches                            │
│  ├─ 📏 Resonance bands: Blue rectangles behind notes                              │
│  ├─ 🔢 Note numbering: #1 to #N (1-based indexing)                               │
│  ├─ 📜 Lyrics: Below notes (if available)                                         │
│  └─ 🎚️ Theme selector: Top-right corner                                           │
│                                                                                      │
│  📊 Header Metrics:                                                                 │
│  ├─ ✅ "Tuning: D-F-G-A-B"                                                        │
│  ├─ ✅ "43 total notes"                                                            │
│  ├─ ✅ "41 open-string notes"                                                      │
│  ├─ 🔴 "Bent Notes" button (toggles red highlighting)                             │
│  └─ ✅ "Learn 11/43 patterns" (efficiency metrics)                                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown & Responsibilities

### 📄 **MusicXML Files**
- **What**: Standard music notation format
- **Compressed vs Uncompressed**:
  - `.mxl` = Compressed ZIP archive containing XML
  - `.musicxml/.xml` = Uncompressed XML text
  - **Parser handles both**: JSDOM extracts same data regardless
- **Contains**: Notes, timing, lyrics, tempo, key signatures, slurs, ties
- **Role**: Source of truth for musical content

### 🔄 **Parser (auto-import.js)**
- **Language**: JavaScript (Node.js)
- **Role**: Converts MusicXML → Structured JSON
- **Key Functions**:
  ```javascript
  // Core parsing pipeline
  extractMusicXMLData(xmlContent) → {notes, metadata}
  convertSlursToTies(notes) → reducedNoteCount
  detectSongTuning(notes) → [D,F,G,A,B] pentatonic
  calculateBendingMetrics(notes, tuning) → bentNoteStats
  analyzePatternEfficiency(notes) → learnOnly/total ratios
  ```

### 💾 **Data Storage**
- **Structure**: File-based (no database)
- **Metadata**: JSON files with rich song analytics
- **Viewers**: Pre-generated HTML files for each song
- **Master Index**: `song-list.json` aggregates all song data
- **Scalability**: Linear - each song = 1 metadata.json + 1 viewer.html

### 🎨 **Template System**
- **Template**: `templates/song-viewer-template.html`
- **Generator**: `generate-viewer.js`
- **Process**: Template + Song Data → Individual Viewer HTML
- **Styling**: CSS variables for 12-color system + 4 themes
- **Output**: Self-contained HTML pages with embedded SVG tablature

### 🌐 **Web Server (Node.js)**
- **Framework**: Express.js
- **Port**: 3002
- **Role**: Static file server + API endpoints
- **Routes**:
  - `/` → Progress dashboard
  - `/library` → Song library
  - `/data/processed/[song]/viewer.html` → Individual songs
  - `/api/v3/status` → Development status JSON

### 📱 **Frontend (HTML/CSS/JavaScript)**
- **Library**: Pure JavaScript (no frameworks)
- **Styling**: CSS custom properties for theming
- **Data Loading**: Fetch API to load song-list.json
- **Interactivity**: Filtering, sorting, searching, theme switching
- **Responsiveness**: CSS Grid for song cards, mobile-friendly

## Data Flow in Detail

### 1. **Import Pipeline** 📁→💾
```javascript
// User drops "Song.musicxml" into v3/data/musicxml/
auto-import.js watches directory
│
├─ JSDOM parses XML structure
├─ Extracts <note> elements with pitch/timing
├─ Processes <lyric> elements for text
├─ Reads <attributes> for tempo/time signature
├─ Converts <slur> to <tie> where identical pitches
├─ Counts pitch class frequencies → tuning detection
├─ Calculates pattern efficiency (KPIC/KRIC analysis)
├─ Determines bending requirements vs tuning
│
└─ Writes metadata.json + generates viewer.html
```

### 2. **Library Display Pipeline** 💾→📱
```javascript
// User visits http://localhost:3002/library
index.html loads
│
├─ fetch('/data/song-list.json')
├─ Parse 130 song entries
├─ Render thumbnail cards with:
│  ├─ Title (Vietnamese Title Case)
│  ├─ Tuning display (e.g., "C-D-E-G-A")
│  ├─ Efficiency metrics (e.g., "Learn 15/42")
│  ├─ String usage (e.g., "7 strings used")
│  └─ Bent note stats (if applicable)
│
└─ Enable filtering/sorting/searching
```

### 3. **Individual Song Pipeline** 📱→🎼
```javascript
// User clicks "Bà rằng bà rí" card
window.location = '/data/processed/Bà_rằng_bà_rí/viewer.html'
│
├─ Pre-generated HTML page loads instantly
├─ Contains embedded metadata + SVG tablature
├─ Shows song-specific tuning (D-F-G-A-B)
├─ Displays bent note indicators where needed
├─ Provides zoom controls + theme selector
│
└─ Complete V1-style tablature experience
```

## Key Technologies & Their Roles

### **JavaScript (Node.js)**
- **auto-import.js**: MusicXML parsing + data extraction
- **generate-viewer.js**: SVG tablature generation
- **server-v3.js**: Web server + routing
- **Frontend JS**: Library interface + interactivity

### **HTML/CSS**
- **Templates**: Reusable page structure
- **CSS Variables**: 12-color system + theming
- **SVG**: Tablature visualization (notes, strings, lines)
- **Responsive Design**: Mobile-friendly layouts

### **Python**
- **Status**: Not currently used in V3
- **V1 Legacy**: Previous pattern analysis tools
- **Future**: Could be reintroduced for advanced analytics

### **JSON**
- **Configuration**: Dan Tranh tuning systems, string layouts
- **Data Storage**: Song metadata + analysis results
- **API Responses**: Status endpoints, song lists

## Scalability Analysis

### **Current Capacity: 130 Songs ✅**
- **Processing Time**: ~2 seconds per song for import
- **Storage**: ~50KB per song (metadata + viewer HTML)
- **Memory Usage**: Linear scaling, no in-memory databases
- **Network**: Static files = fast delivery

### **Theoretical Limits**

#### **1,300 Songs (10x current)**
- **Processing**: ~6 hours for full import (parallelizable)
- **Storage**: ~50MB total (negligible on modern systems)
- **Browser**: Library page may need pagination (>1000 cards)
- **Network**: Still fast (static files, no dynamic generation)

#### **Upper Limits**
- **File System**: Millions of files possible
- **Browser DOM**: Pagination needed >1000 songs
- **Processing**: CPU-bound, easily parallelizable
- **Storage**: Minimal per song, no practical limit

### **Scaling Strategies**

#### **Performance Optimizations**
```javascript
// For 1000+ songs
const paginatedLibrary = {
  songsPerPage: 50,
  lazyLoading: true,
  virtualScrolling: true,
  searchIndexing: true
};

// Parallel processing
const batchImport = {
  concurrent: 10,  // Process 10 songs simultaneously
  progressTracking: true,
  errorRecovery: true
};
```

#### **Storage Optimizations**
```javascript
// Compress metadata for large collections
const compressionOptions = {
  gzipMetadata: true,
  sharedStringTables: true,
  binaryEncodedPositions: true
};
```

## Advantages of V3 Architecture

### **1. Scalability** 📈
- File-based storage scales linearly
- No database bottlenecks
- Parallel processing possible
- Static file serving = fast delivery

### **2. Maintainability** 🔧
- Clear separation of concerns
- Template-based generation
- Configuration-driven styling
- Modular component structure

### **3. Performance** ⚡
- Pre-generated static files
- No server-side rendering needed
- Browser caching of assets
- Instant page loads

### **4. Flexibility** 🎨
- Theme system supports any color scheme
- Tuning system handles any pentatonic scale
- String configuration adapts to song needs
- Export formats easily extensible

### **5. User Experience** 👥
- V1-compatible visual experience
- Instant switching between songs
- No loading delays
- Offline-capable (static files)

---

**Summary**: V3 is a hybrid architecture combining server-side processing (import/generation) with client-side presentation (static files). This enables both the rich analysis of 130+ songs and the instant, smooth user experience of V1. The file-based approach scales to thousands of songs while maintaining simplicity and performance.