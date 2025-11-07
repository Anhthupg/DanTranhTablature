const fs = require('fs');

const songName = process.argv[2] || 'merry-go-round-of-life-howls-moving-castle';
const relationships = JSON.parse(fs.readFileSync(`data/relationships/${songName}-relationships.json`, 'utf8'));

// Count pitch classes
const pitchCounts = {};
relationships.notes.forEach(note => {
  if (!note.isGrace) {
    // Extract pitch class (remove octave)
    const pitchClass = note.pitch.replace(/[0-9]/g, '');
    pitchCounts[pitchClass] = (pitchCounts[pitchClass] || 0) + 1;
  }
});

// Sort by frequency
const sorted = Object.entries(pitchCounts).sort((a, b) => b[1] - a[1]);

console.log(`\n=== Pitch Distribution for: ${songName} ===`);
console.log(`Total notes: ${relationships.notes.filter(n => !n.isGrace).length}\n`);

console.log('Pitch class frequencies:');
sorted.forEach(([pitch, count]) => {
  const percentage = (count / relationships.notes.filter(n => !n.isGrace).length * 100).toFixed(1);
  console.log(`  ${pitch.padEnd(3)}: ${count.toString().padStart(3)} notes (${percentage}%)`);
});

console.log(`\nTop 5 most frequent (PENTATONIC): ${sorted.slice(0, 5).map(x => x[0]).join('-')}`);
console.log(`Top 6 most frequent (HEXATONIC):  ${sorted.slice(0, 6).map(x => x[0]).join('-')}`);

// Check if top 6 matches C-D-Eb-E-G-A
const top6 = sorted.slice(0, 6).map(x => x[0]).sort();
const bluesMajor = ['C', 'D', 'Eb', 'E', 'G', 'A'].sort();
const matches = JSON.stringify(top6) === JSON.stringify(bluesMajor);

console.log(`\nDoes top 6 match C-D-Eb-E-G-A (Blues Major)? ${matches}`);
if (!matches) {
  console.log(`  Expected: ${bluesMajor.join('-')}`);
  console.log(`  Got:      ${top6.join('-')}`);
}
