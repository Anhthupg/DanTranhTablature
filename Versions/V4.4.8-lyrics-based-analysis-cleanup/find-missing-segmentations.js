/**
 * Find songs with MusicXML but no lyrics segmentation
 */

const fs = require('fs');
const path = require('path');
const DataLoader = require('./utils/data-loader');

const loader = new DataLoader(__dirname);

// Scan all category folders recursively
function scanMusicXMLRecursively(baseDir) {
  const results = [];
  const categories = ['vietnamese-skeletal', 'vietnamese-dantranh', 'nonvietnamese-skeletal', 'nonvietnamese-dantranh', 'exercises-skeletal', 'exercises-dantranh'];

  categories.forEach(category => {
    const categoryPath = path.join(baseDir, category);
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.xml') || f.endsWith('.musicxml'));
      files.forEach(f => {
        const name = f.replace('.musicxml.xml', '').replace('.musicxml', '').replace('.xml', '');
        results.push({ filename: f, name, category });
      });
    }
  });

  return results;
}

const musicxmlFiles = scanMusicXMLRecursively('data/musicxml');
const musicxml = musicxmlFiles.map(f => f.name);

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
