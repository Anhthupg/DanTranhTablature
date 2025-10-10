const fs = require('fs');

const songs = [
  'Hát ru em (quảng bình)',
  'Hát ru em 276',
  'Hát ru lối Giặm',
  'Hát ru lục vân tiên 210',
  'Hát ru nam bộ'
];

console.log('CULTURAL CONTEXT VERIFICATION');
console.log('==============================\n');

let allGood = true;

songs.forEach(songTitle => {
  const filePath = `data/lyrics-segmentations/${songTitle}.json`;

  if (!fs.existsSync(filePath)) {
    console.log(`FILE NOT FOUND: ${songTitle}`);
    allGood = false;
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`${songTitle}`);
  console.log(`   Total phrases: ${data.phrases.length}`);

  let missingContext = false;

  data.phrases.forEach(phrase => {
    if (!phrase.culturalContext) {
      console.log(`   MISSING: Phrase ${phrase.id}: Missing culturalContext`);
      missingContext = true;
      allGood = false;
    } else {
      const hasDescription = phrase.culturalContext.description;
      const hasFacts = Array.isArray(phrase.culturalContext.facts) && phrase.culturalContext.facts.length > 0;
      const hasMusicalContext = phrase.culturalContext.musicalContext;

      if (!hasDescription || !hasFacts || !hasMusicalContext) {
        console.log(`   INCOMPLETE: Phrase ${phrase.id}`);
        if (!hasDescription) console.log(`       - Missing description`);
        if (!hasFacts) console.log(`       - Missing or empty facts array`);
        if (!hasMusicalContext) console.log(`       - Missing musicalContext`);
        missingContext = true;
        allGood = false;
      }
    }
  });

  if (!missingContext) {
    console.log(`   ✓ All phrases have complete cultural context`);
  }
  console.log();
});

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✓ ALL CULTURAL CONTEXTS ARE COMPLETE!');
} else {
  console.log('✗ SOME CULTURAL CONTEXTS ARE MISSING OR INCOMPLETE');
}
