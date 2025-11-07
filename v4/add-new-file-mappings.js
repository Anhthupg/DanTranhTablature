/**
 * Add name mappings for new files
 */

const fs = require('fs');
const path = require('path');

const mappingsFile = path.join(__dirname, 'data/song-name-mappings.json');
const mappings = JSON.parse(fs.readFileSync(mappingsFile, 'utf8'));

// Add 5 new mappings
const newMappings = {
  "ly-ngua-o": {
    "displayName": "Lý Ngựa Ô",
    "fileName": "ly-ngua-o",
    "originalTitle": "Lý Ngựa Ô",
    "musicXMLFile": "Lý Ngựa Ô.musicxml",
    "category": "vietnamese-skeletal",
    "region": "Northern",
    "performanceContext": "folk_song",
    "alternateSpellings": ["Ly Ngua O", "Lý_Ngựa_Ô"]
  },
  "beo-giat-may-troi": {
    "displayName": "Bèo Giạt Mây Trôi",
    "fileName": "beo-giat-may-troi",
    "originalTitle": "Bèo Giạt Mây Trôi",
    "musicXMLFile": "Bèo Giạt Mây Trôi.musicxml",
    "category": "vietnamese-skeletal",
    "region": "Unknown",
    "performanceContext": "folk_song",
    "alternateSpellings": ["Beo Giat May Troi", "Bèo_Giạt_Mây_Trôi"]
  },
  "ly-ngua-o-tranh": {
    "displayName": "Lý Ngựa Ô - Tranh",
    "fileName": "ly-ngua-o-tranh",
    "originalTitle": "Lý Ngựa Ô - Tranh",
    "musicXMLFile": "Lý Ngựa Ô - Tranh.musicxml",
    "category": "vietnamese-dantranh",
    "region": "Northern",
    "performanceContext": "instrumental_arrangement",
    "alternateSpellings": ["Ly Ngua O Tranh", "Lý_Ngựa_Ô_-_Tranh"]
  },
  "golden-k-pop-demon-hunters": {
    "displayName": "Golden K-Pop Demon Hunters",
    "fileName": "golden-k-pop-demon-hunters",
    "originalTitle": "Golden K-Pop Demon Hunters",
    "musicXMLFile": "golden-k-pop-demon-hunters.musicxml",
    "category": "nonvietnamese-skeletal",
    "region": "International",
    "performanceContext": "contemporary",
    "alternateSpellings": ["Golden K-Pop Demon Hunters", "golden-k-pop-demon-hunters"]
  },
  "were-gonna-shine": {
    "displayName": "We're Gonna Shine",
    "fileName": "were-gonna-shine",
    "originalTitle": "We're Gonna Shine",
    "musicXMLFile": "We're_Gonna_Shine.musicxml",
    "category": "nonvietnamese-skeletal",
    "region": "International",
    "performanceContext": "contemporary",
    "alternateSpellings": ["We're Gonna Shine", "Were_Gonna_Shine"]
  }
};

// Add to mappings
Object.keys(newMappings).forEach(backendId => {
  mappings.songs[backendId] = newMappings[backendId];
});

// Update metadata
mappings.metadata.totalSongs += 5;
mappings.metadata.generatedDate = new Date().toISOString();

// Save
fs.writeFileSync(mappingsFile, JSON.stringify(mappings, null, 2));

console.log('✅ Added 5 new name mappings:');
Object.keys(newMappings).forEach(id => {
  console.log(`  - ${id} → ${newMappings[id].displayName}`);
});

console.log(`\n✅ Total songs in mapping system: ${mappings.metadata.totalSongs}`);
