/**
 * Add name mappings for new files
 */

const fs = require('fs');
const path = require('path');

const mappingsFile = path.join(__dirname, 'data/song-name-mappings.json');
const mappings = JSON.parse(fs.readFileSync(mappingsFile, 'utf8'));

// Add 4 new mappings
const newMappings = {
  "sakura-folksong-japanese-melody": {
    "displayName": "Sakura Folksong Japanese Melody",
    "fileName": "sakura-folksong-japanese-melody",
    "originalTitle": "Sakura, Sakura",
    "musicXMLFile": "Sakura_folksong_Japanese_Melody.musicxml",
    "category": "nonvietnamese-skeletal",
    "region": "Japan",
    "performanceContext": "folk_song",
    "alternateSpellings": ["Sakura Melody", "Sakura Folksong Japanese Melody"]
  },
  "sakura-folksong-japanese-tranh": {
    "displayName": "Sakura Folksong Japanese Tranh",
    "fileName": "sakura-folksong-japanese-tranh",
    "originalTitle": "Sakura, Sakura",
    "musicXMLFile": "Sakura_folksong_Japanese_Tranh.musicxml",
    "category": "nonvietnamese-dantranh",
    "region": "Japan",
    "performanceContext": "folk_song_interpretation",
    "alternateSpellings": ["Sakura Tranh", "Sakura Folksong Japanese Tranh"]
  },
  "exercise-1-dan-tranh": {
    "displayName": "Exercise 1 Dan Tranh",
    "fileName": "exercise-1-dan-tranh",
    "originalTitle": "Đàn Tranh: Exercise #1",
    "musicXMLFile": "Exercise-1_dan-tranh.musicxml",
    "category": "exercises-dantranh",
    "region": "N/A",
    "performanceContext": "technical_exercise",
    "alternateSpellings": ["Exercise 1", "Dan Tranh Exercise 1"]
  },
  "exercise-2-dan-tranh": {
    "displayName": "Exercise 2 Dan Tranh",
    "fileName": "exercise-2-dan-tranh",
    "originalTitle": "Đàn Tranh: Exercise #2",
    "musicXMLFile": "Exercise-2_dan-tranh.musicxml",
    "category": "exercises-dantranh",
    "region": "N/A",
    "performanceContext": "technical_exercise",
    "alternateSpellings": ["Exercise 2", "Dan Tranh Exercise 2"]
  }
};

// Add to mappings
Object.keys(newMappings).forEach(backendId => {
  mappings.songs[backendId] = newMappings[backendId];
});

// Update metadata
mappings.metadata.totalSongs += 4;
mappings.metadata.generatedDate = new Date().toISOString();

// Save
fs.writeFileSync(mappingsFile, JSON.stringify(mappings, null, 2));

console.log('✅ Added 4 new name mappings:');
Object.keys(newMappings).forEach(id => {
  console.log(`  - ${id} → ${newMappings[id].displayName}`);
});

console.log(`\n✅ Total songs in mapping system: ${mappings.metadata.totalSongs}`);
