/**
 * Automated workflow to process 2 new songs:
 * - Wú jī (无羁 The Untamed)
 * - Merry-Go-Round of Life (Howl's Moving Castle)
 */

const fs = require('fs');
const path = require('path');

// Step 1: Add name mappings
function addNameMappings() {
  console.log('📝 Step 1: Adding name mappings...\n');

  const mappingsFile = path.join(__dirname, 'data/song-name-mappings.json');
  const mappings = JSON.parse(fs.readFileSync(mappingsFile, 'utf8'));

  const newMappings = {
    "wu-ji-the-untamed": {
      "displayName": "Wú jī (无羁 The Untamed)",
      "fileName": "wu-ji-the-untamed",
      "originalTitle": "Wú jī (无羁 The Untamed)",
      "musicXMLFile": "Wú jī (无羁 The Untamed).musicxml",
      "category": "nonvietnamese-skeletal",
      "region": "International",
      "performanceContext": "contemporary",
      "alternateSpellings": [
        "Wu ji",
        "Wu Ji",
        "无羁",
        "Wú jī",
        "The Untamed",
        "Wú jī (无羁 The Untamed)"
      ]
    },
    "merry-go-round-of-life-howls-moving-castle": {
      "displayName": "Merry-Go-Round of Life (Howl's Moving Castle)",
      "fileName": "merry-go-round-of-life-howls-moving-castle",
      "originalTitle": "Merry-Go-Round of Life (Howl's Moving Castle)",
      "musicXMLFile": "merry-go-round-of-life-howls-moving-castle.musicxml",
      "category": "nonvietnamese-skeletal",
      "region": "International",
      "performanceContext": "contemporary",
      "alternateSpellings": [
        "Merry Go Round of Life",
        "Merry-Go-Round of Life",
        "Howl's Moving Castle",
        "Howls Moving Castle",
        "merry-go-round-of-life-howls-moving-castle"
      ]
    }
  };

  // Check if already exists
  let added = 0;
  Object.keys(newMappings).forEach(backendId => {
    if (!mappings.songs[backendId]) {
      mappings.songs[backendId] = newMappings[backendId];
      console.log(`  ✓ Added: ${backendId} → ${newMappings[backendId].displayName}`);
      added++;
    } else {
      console.log(`  ⊙ Exists: ${backendId}`);
    }
  });

  if (added > 0) {
    mappings.metadata.totalSongs += added;
    mappings.metadata.generatedDate = new Date().toISOString();
    fs.writeFileSync(mappingsFile, JSON.stringify(mappings, null, 2));
    console.log(`\n✅ Added ${added} new mappings. Total: ${mappings.metadata.totalSongs}\n`);
  } else {
    console.log('\n✅ All mappings already exist\n');
  }
}

// Step 2: Create segmentation files (instrumental - no lyrics)
function createSegmentationFiles() {
  console.log('📝 Step 2: Creating segmentation files...\n');

  const songs = [
    {
      backendId: 'wu-ji-the-untamed',
      title: 'Wú jī (无羁 The Untamed)',
      language: 'Chinese'
    },
    {
      backendId: 'merry-go-round-of-life-howls-moving-castle',
      title: "Merry-Go-Round of Life (Howl's Moving Castle)",
      language: 'Instrumental'
    }
  ];

  songs.forEach(song => {
    const segPath = path.join(__dirname, 'data/lyrics-segmentations', `${song.backendId}.json`);

    if (fs.existsSync(segPath)) {
      console.log(`  ⊙ Exists: ${song.backendId}.json`);
      return;
    }

    // Instrumental template (no phrases)
    const segmentation = {
      songTitle: song.title,
      language: song.language,
      type: "instrumental",
      phrases: [],
      metadata: {
        generated: new Date().toISOString(),
        noteCount: 0,
        phraseCount: 0
      }
    };

    fs.writeFileSync(segPath, JSON.stringify(segmentation, null, 2));
    console.log(`  ✓ Created: ${song.backendId}.json (instrumental)`);
  });

  console.log('\n✅ Segmentation files ready\n');
}

// Step 3: Generate relationships
function generateRelationships() {
  console.log('📝 Step 3: Generating relationships...\n');

  const songs = ['wu-ji-the-untamed', 'merry-go-round-of-life-howls-moving-castle'];

  songs.forEach(backendId => {
    const relPath = path.join(__dirname, 'data/relationships', `${backendId}-relationships.json`);

    if (fs.existsSync(relPath)) {
      console.log(`  ⊙ Exists: ${backendId}-relationships.json`);
      return;
    }

    // Basic instrumental relationships template
    const relationships = {
      songId: backendId,
      type: "instrumental",
      metadata: {
        generated: new Date().toISOString(),
        hasLyrics: false
      },
      notes: [],
      phrases: [],
      sections: []
    };

    fs.writeFileSync(relPath, JSON.stringify(relationships, null, 2));
    console.log(`  ✓ Created: ${backendId}-relationships.json`);
  });

  console.log('\n✅ Relationships generated\n');
}

// Run all steps
console.log('🚀 Processing 2 new songs\n');
console.log('═'.repeat(60) + '\n');

addNameMappings();
createSegmentationFiles();
generateRelationships();

console.log('═'.repeat(60));
console.log('\n✅ ALL STEPS COMPLETE!\n');
console.log('Next steps:');
console.log('  1. Restart server to load new mappings');
console.log('  2. Test at: http://localhost:3006/?song=wu-ji-the-untamed');
console.log('  3. Test at: http://localhost:3006/?song=merry-go-round-of-life-howls-moving-castle\n');
