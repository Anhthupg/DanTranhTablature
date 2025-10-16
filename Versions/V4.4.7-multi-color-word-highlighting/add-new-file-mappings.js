/**
 * Add name mappings for new files
 */

const fs = require('fs');
const path = require('path');

const mappingsFile = path.join(__dirname, 'data/song-name-mappings.json');
const mappings = JSON.parse(fs.readFileSync(mappingsFile, 'utf8'));

// Add 3 new mappings
const newMappings = {
  "ly-cay-da": {
    "displayName": "Lý Cây Đa",
    "fileName": "ly-cay-da",
    "originalTitle": "Lý Cây Đa",
    "musicXMLFile": "LÝ_CÂY_ĐA.musicxml",
    "category": "vietnamese-skeletal",
    "region": "Unknown",
    "performanceContext": "folk_song",
    "alternateSpellings": ["Ly Cay Da", "LÝ_CÂY_ĐA"]
  },
  "da-co-hoai-lang": {
    "displayName": "Dạ Cổ Hoài Lang",
    "fileName": "da-co-hoai-lang",
    "originalTitle": "Dạ Cổ Hoài Lang",
    "musicXMLFile": "Dạ_Cổ_Hoài_Lang.musicxml",
    "category": "vietnamese-skeletal",
    "region": "Southern",
    "performanceContext": "folk_song",
    "alternateSpellings": ["Da Co Hoai Lang", "Dạ_Cổ_Hoài_Lang"]
  },
  "let-it-be": {
    "displayName": "Let It Be",
    "fileName": "let-it-be",
    "originalTitle": "Let It Be",
    "musicXMLFile": "Let_It_Be.musicxml",
    "category": "nonvietnamese-skeletal",
    "region": "International",
    "performanceContext": "popular_song",
    "alternateSpellings": ["Let It Be", "Let_It_Be"]
  }
};

// Add to mappings
Object.keys(newMappings).forEach(backendId => {
  mappings.songs[backendId] = newMappings[backendId];
});

// Update metadata
mappings.metadata.totalSongs += 3;
mappings.metadata.generatedDate = new Date().toISOString();

// Save
fs.writeFileSync(mappingsFile, JSON.stringify(mappings, null, 2));

console.log('✅ Added 3 new name mappings:');
Object.keys(newMappings).forEach(id => {
  console.log(`  - ${id} → ${newMappings[id].displayName}`);
});

console.log(`\n✅ Total songs in mapping system: ${mappings.metadata.totalSongs}`);
