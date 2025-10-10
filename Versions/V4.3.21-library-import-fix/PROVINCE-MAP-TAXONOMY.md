# Province-Centric Taxonomy with Vietnam Map

## Updated Architecture

### Navigation Priority:
1. **PRIMARY**: Province (e.g., "B ắc Ninh") - Real cultural identity
2. **SECONDARY**: Genre (e.g., "Quan Họ") - Musical classification
3. **GROUPING**: Region (e.g., "Northern") - Geographic aggregation only

---

## Data Structure

```javascript
{
  "vietnameseFolkSongs": {

    // PRIMARY: By Province
    "byProvince": {
      "Bắc Ninh": {
        "name": "Bắc Ninh",
        "region": "northern",
        "regionName": "Northern Vietnam",
        "mapCoordinates": { "lat": 21.1861, "lng": 106.0763 },
        "songCount": 12,
        "genres": {
          "quan_ho": {
            "name": "Quan Họ",
            "songCount": 8,
            "songs": [
              {
                "title": "Đò Đưa Quan Họ",
                "collector": "Nguyễn Văn A",
                "performer": "Nguyễn Thị B"
              }
            ]
          },
          "ly": {
            "name": "Lý",
            "songCount": 4,
            "songs": [...]
          }
        },
        "culturalCharacteristics": [
          "Birthplace of Quan Họ tradition",
          "Known for antiphonal singing"
        ]
      },

      "Phú Thọ": {
        "name": "Phú Thọ",
        "region": "northern",
        "mapCoordinates": { "lat": 21.2681, "lng": 105.2045 },
        "songCount": 8,
        "genres": {
          "hat_gheo": { ... },
          "folk_song": { ... }
        }
      }
    },

    // SECONDARY: By Genre (with provincial breakdown)
    "byGenre": {
      "quan_ho": {
        "name": "Quan Họ",
        "category": "antiphonal_song",
        "totalSongs": 12,
        "provinces": {
          "Bắc Ninh": {
            "songCount": 8,
            "characteristics": "Original birthplace, most traditional style",
            "songs": [...]
          },
          "Vĩnh Phúc": {
            "songCount": 4,
            "characteristics": "Regional variant with local influences",
            "songs": [...]
          }
        }
      },

      "ho": {
        "name": "Hò (Work Song)",
        "totalSongs": 18,
        "provinces": {
          "Nghệ An": { ... },
          "Hà Tĩnh": { ... },
          "Đồng Tháp": { ... }
        }
      }
    },

    // GROUPING: By Region (aggregated view)
    "byRegion": {
      "northern": {
        "name": "Northern Vietnam",
        "nameVi": "Miền Bắc",
        "provinces": ["Bắc Ninh", "Phú Thọ", "Vĩnh Phúc", ...],
        "totalSongs": 67,
        "totalProvinces": 8,
        "musicalCharacteristics": [
          "Refined, softer dynamics",
          "High tessitura",
          "Narrow pitch range"
        ]
      }
    },

    // MAP DATA: For visual representation
    "provinceMap": {
      "Bắc Ninh": {
        "coordinates": { "lat": 21.1861, "lng": 106.0763 },
        "region": "northern",
        "songCount": 12,
        "genres": ["Quan Họ", "Lý"],
        "color": "#3498DB",  // Northern region color
        "radius": 15  // Circle size based on song count
      }
    }
  }
}
```

---

## UI Navigation Flow

### Option 1: Map First (Visual)
```
[Vietnam Map]
  └─ Click province pin
      └─ Province Detail Panel
          ├─ "Bắc Ninh (Northern Vietnam)"
          ├─ "12 songs, 2 genres"
          └─ Genre List
              ├─ Quan Họ (8 songs)
              └─ Lý (4 songs)
```

### Option 2: List View (Text)
```
┌─ Navigation Tabs ──────────────────┐
│ [Map] [Provinces] [Genres] [A-Z]   │
└────────────────────────────────────┘

Provinces Tab Active:
├─ Bắc Ninh (Northern) - 12 songs
│  ├─ Quan Họ (8 songs)
│  └─ Lý (4 songs)
├─ Phú Thọ (Northern) - 8 songs
│  ├─ Hát Ghẹo (5 songs)
│  └─ Folk Song (3 songs)
└─ Nghệ An (Central) - 10 songs
   └─ Hò (10 songs)
```

---

## Visual Map Component

### SVG Vietnam Map Template
```html
<svg id="vietnam-map" viewBox="0 0 400 800">
  <!-- Province paths -->
  <g id="provinces">
    {{#each PROVINCES}}
    <path
      id="province-{{KEY}}"
      d="{{SVG_PATH}}"
      fill="{{REGION_COLOR}}"
      fill-opacity="0.3"
      stroke="#333"
      stroke-width="1"
      class="province-path"
      data-province="{{NAME}}"
      data-song-count="{{SONG_COUNT}}"
      onclick="showProvinceDetail('{{KEY}}')"
    />
    {{/each}}
  </g>

  <!-- Song count markers -->
  <g id="markers">
    {{#each PROVINCES_WITH_SONGS}}
    <circle
      cx="{{COORDINATES.lng_scaled}}"
      cy="{{COORDINATES.lat_scaled}}"
      r="{{RADIUS}}"
      fill="{{REGION_COLOR}}"
      stroke="white"
      stroke-width="2"
      class="province-marker"
      data-province="{{NAME}}"
      onclick="showProvinceDetail('{{KEY}}')"
    >
      <title>{{NAME}}: {{SONG_COUNT}} songs</title>
    </circle>

    <text
      x="{{COORDINATES.lng_scaled}}"
      y="{{COORDINATES.lat_scaled}}"
      text-anchor="middle"
      dy="0.3em"
      fill="white"
      font-size="12"
      font-weight="bold"
      pointer-events="none"
    >
      {{SONG_COUNT}}
    </text>
    {{/each}}
  </g>
</svg>
```

### Province Detail Panel (Sidebar)
```html
<div class="province-detail" id="province-{{PROVINCE_KEY}}">
  <div class="province-header">
    <h2>{{PROVINCE_NAME}}</h2>
    <span class="region-badge" style="background: {{REGION_COLOR}}">
      {{REGION_NAME}}
    </span>
  </div>

  <div class="province-stats">
    <span>{{SONG_COUNT}} songs</span>
    <span>{{GENRE_COUNT}} genres</span>
  </div>

  <div class="province-characteristics">
    <h4>Cultural Characteristics:</h4>
    <ul>
      {{#each CHARACTERISTICS}}
        <li>{{this}}</li>
      {{/each}}
    </ul>
  </div>

  <div class="genre-list">
    <h4>Genres in {{PROVINCE_NAME}}:</h4>
    {{#each GENRES}}
    <div class="genre-card" onclick="loadGenre('{{KEY}}')">
      <h5>{{NAME}}</h5>
      <span>{{SONG_COUNT}} songs</span>

      {{#if IS_UNIQUE_TO_PROVINCE}}
        <span class="badge unique">Unique to {{PROVINCE_NAME}}</span>
      {{/if}}

      {{#if SHARED_WITH_PROVINCES}}
        <span class="badge shared">
          Also in: {{SHARED_WITH_PROVINCES}}
        </span>
      {{/if}}

      <div class="songs-list">
        {{#each SONGS}}
        <div class="song-item" onclick="loadSong('{{FILENAME}}')">
          {{TITLE}}
          {{#if COLLECTOR}}<span class="meta">Collected by: {{COLLECTOR}}</span>{{/if}}
        </div>
        {{/each}}
      </div>
    </div>
    {{/each}}
  </div>

  <div class="similar-provinces">
    <h4>Similar Provinces:</h4>
    {{#each SIMILAR}}
      <a href="#" onclick="showProvinceDetail('{{KEY}}')">
        {{NAME}} ({{SIMILARITY}}% similar)
      </a>
    {{/each}}
  </div>
</div>
```

---

## Map Interactions

### Hover State
```javascript
provinceElement.addEventListener('mouseover', (e) => {
  const province = e.target.dataset.province;
  const data = taxonomyData.byProvince[province];

  // Highlight province
  e.target.style.fillOpacity = '0.7';

  // Show tooltip
  showTooltip({
    position: { x: e.pageX, y: e.pageY },
    content: `
      <strong>${province}</strong><br>
      ${data.songCount} songs<br>
      Genres: ${Object.keys(data.genres).join(', ')}
    `
  });
});
```

### Click State
```javascript
provinceElement.addEventListener('click', (e) => {
  const province = e.target.dataset.province;

  // Highlight province
  highlightProvince(province);

  // Load detail panel
  loadProvinceDetail(province);

  // Update breadcrumb
  updateBreadcrumb(['Home', 'Provinces', province]);

  // Show related provinces on map
  highlightRelatedProvinces(province);
});
```

---

## Context Panel Updates

```html
<div class="context-panel">

  <!-- Current Province -->
  <div class="current-location">
    <h4>You are viewing:</h4>
    <div class="location-badge">
      <span class="icon">📍</span>
      <strong>{{PROVINCE_NAME}}</strong>
      <span class="region">({{REGION_NAME}})</span>
    </div>
  </div>

  <!-- Province Info -->
  <div class="province-info">
    <h5>Province Context:</h5>
    <ul>
      <li>Songs: {{SONG_COUNT}}</li>
      <li>Genres: {{GENRE_COUNT}}</li>
      <li>Region: {{REGION_NAME}}</li>
    </ul>
  </div>

  <!-- Related Provinces -->
  <div class="related-provinces">
    <h5>Nearby Provinces with Songs:</h5>
    <ul>
      {{#each NEARBY}}
        <li>
          <a href="#" onclick="showProvinceDetail('{{KEY}}')">
            {{NAME}} ({{SONG_COUNT}} songs)
          </a>
        </li>
      {{/each}}
    </ul>
  </div>

  <!-- Genres Shared with Other Provinces -->
  <div class="shared-genres">
    <h5>Genres also in other provinces:</h5>
    {{#each SHARED_GENRES}}
      <div>
        <strong>{{GENRE_NAME}}</strong> also in:
        {{#each OTHER_PROVINCES}}
          <a href="#" onclick="showProvinceDetail('{{KEY}}')">{{NAME}}</a>
        {{/each}}
      </div>
    {{/each}}
  </div>

</div>
```

---

## Benefits of Province-First Architecture

✅ **Cultural Authenticity**
- Provinces have real cultural identity (Bắc Ninh = Quan Họ birthplace)
- Regions are just geographic grouping

✅ **Visual Navigation**
- Click province on map → immediate context
- See geographic relationships

✅ **Better Cross-References**
- "Quan Họ appears in Bắc Ninh + Vĩnh Phúc" (specific!)
- "Hò appears in 5 provinces across Central + Southern" (clear!)

✅ **Scalable**
- Add new province → automatically appears on map
- Regions auto-update

✅ **User Mental Model**
- "Songs from Bắc Ninh" is more concrete than "Northern songs"
- Provinces are well-known cultural units

---

## Implementation Priority

1. ✅ Create `vietnam-province-map.json` (DONE)
2. ⏳ Update `generate-enhanced-taxonomy.js` to be province-first
3. ⏳ Create SVG Vietnam map template
4. ⏳ Create province detail panel component
5. ⏳ Create map interaction controller
6. ⏳ Add province-to-province similarity calculation

---

**Province-First = More Cultural Authenticity + Better Navigation!**
