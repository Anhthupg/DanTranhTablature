/**
 * Complete All Remaining Segmentations
 * Processes all songs that need lyrics segmentation
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');
const { execSync } = require('child_process');

const DataLoader = require('./utils/data-loader');
const loader = new DataLoader(__dirname);

// Songs to process with their MusicXML paths
const songsToProcess = [
  { backendId: 'ho-boi-thuyen', file: 'vietnamese-skeletal/Hò Bơi thuyền.musicxml.xml' },
  { backendId: 'ho-do-khoan-do-huay-ho-cheo-thuyen', file: 'vietnamese-skeletal/Hò Dố khoan Dố huầy (Hò chèo thuyền).musicxml.xml' },
  { backendId: 'ho-nen', file: 'vietnamese-skeletal/Hò nện.musicxml.xml' },
  { backendId: 'mua-sap', file: 'vietnamese-skeletal/Múa sạp.musicxml.xml' },
  { backendId: 'xoe-hoa', file: 'vietnamese-skeletal/Xòe hoa.musicxml.xml' },
  { backendId: 'sakura-folksong-japanese-melody', file: 'nonvietnamese-skeletal/Sakura_folksong_Japanese_Melody.musicxml' },
  { backendId: 'sakura-folksong-japanese-tranh', file: 'nonvietnamese-dantranh/Sakura_folksong_Japanese_Tranh.musicxml' }
];

console.log('=== PROCESSING ALL REMAINING SEGMENTATIONS ===\n');

songsToProcess.forEach((song, index) => {
  console.log(`[${index + 1}/${songsToProcess.length}] Processing: ${song.backendId}`);

  const xmlPath = path.join(__dirname, 'data/musicxml', song.file);

  if (!fs.existsSync(xmlPath)) {
    console.log(`  ✗ MusicXML not found: ${xmlPath}`);
    return;
  }

  // Extract lyrics from MusicXML
  const xmlContent = fs.readFileSync(xmlPath, 'utf8');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  const lyrics = [];
  const lyricElements = xmlDoc.getElementsByTagName('lyric');

  for (let i = 0; i < lyricElements.length; i++) {
    const textElement = lyricElements[i].getElementsByTagName('text')[0];
    if (textElement) {
      const text = textElement.textContent.trim();
      if (text && text.length > 0) {
        lyrics.push(text);
      }
    }
  }

  const lyricsText = lyrics.join(' ');
  console.log(`  ✓ Extracted ${lyrics.length} syllables`);
  console.log(`  → Lyrics: "${lyricsText.substring(0, 60)}..."`);

  // Note: Segmentation files need to be created manually or via LLM
  // This script shows what needs to be done
});

console.log('\n=== NEXT STEPS ===');
console.log('The lyrics have been extracted. You can now:');
console.log('1. Use the batch-1.txt prompt to segment with Claude');
console.log('2. Save the segmentation JSONs');
console.log('3. Run: node batch-regenerate-relationships.js batch-1');
