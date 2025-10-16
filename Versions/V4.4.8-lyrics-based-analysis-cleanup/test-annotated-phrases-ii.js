/**
 * Test Multi-Dimensional Phrase Analysis Generator
 * Tests the 4-layer linguistic-musical analysis system
 */

const fs = require('fs');
const path = require('path');
const AnnotatedPhrasesIIGenerator = require('./annotated-phrases-ii-generator');

const songName = 'ba-rang-ba-ri';

// Load data
const lyricsPath = path.join(__dirname, `data/lyrics-segmentations/${songName}.json`);
const relationshipsPath = path.join(__dirname, `data/relationships/${songName}-relationships.json`);

const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));
const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

// Create mock positioned notes (for testing - in real server this comes from tablature generator)
const positionedNotes = [];
for (let i = 0; i < 136; i++) {
    positionedNotes.push({
        id: `note_${i}`,
        x: 100 + (i * 40), // 40px spacing
        y: 200
    });
}

// Generate
const generator = new AnnotatedPhrasesIIGenerator();
const result = generator.generate(lyricsData, relationships, positionedNotes);

console.log('Generated Multi-Dimensional Phrase Analysis:');
console.log(`  Width: ${result.width}px`);
console.log(`  Height: ${result.height}px`);
console.log(`  Phrase count: ${result.phraseCount}`);

// Save to file for inspection
const outputPath = path.join(__dirname, `test-annotated-phrases-ii-${songName}.svg`);
fs.writeFileSync(outputPath, result.svg);
console.log(`  Saved to: ${outputPath}`);
