/**
 * Find songs with MusicXML but no lyrics segmentation
 */

const fs = require('fs');
const path = require('path');
const DataLoader = require('./utils/data-loader');

const loader = new DataLoader(__dirname);

const musicxml = fs.readdirSync('data/musicxml')
  .filter(f => f.endsWith('.musicxml.xml'))
  .map(f => f.replace('.musicxml.xml', ''));

const segmentations = fs.readdirSync('data/lyrics-segmentations')
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));

console.log('Songs with MusicXML but no lyrics segmentation:\n');
const missing = [];

musicxml.forEach(xmlName => {
  const backendId = loader.toBackendId(xmlName);
  if (backendId && !segmentations.includes(backendId)) {
    const displayName = loader.nameMappings.songs[backendId]?.displayName || xmlName;
    missing.push({ xmlName, backendId, displayName });
    console.log(`${missing.length}. ${displayName} (${backendId})`);
  }
});

console.log(`\nTotal missing: ${missing.length}`);
console.log('\nMusicXML files: ' + musicxml.length);
console.log('Segmentations: ' + segmentations.length);
console.log('Difference: ' + (musicxml.length - segmentations.length));
