/**
 * Add wordMapping arrays to English song segmentations
 */

const fs = require('fs');
const path = require('path');

function addWordMappings(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add wordMapping to each phrase
    data.phrases.forEach(phrase => {
        if (!phrase.wordMapping) {
            // Split text into words
            const words = phrase.text.trim().split(/\s+/);

            // Create wordMapping array
            phrase.wordMapping = words.map(word => ({
                vn: word,
                en: word  // For English, vn and en are the same
            }));

            // Update syllableCount to match actual word count
            phrase.syllableCount = words.length;
        }
    });

    // Update statistics
    const totalSyllables = data.phrases.reduce((sum, p) => sum + p.syllableCount, 0);
    data.statistics.totalSyllables = totalSyllables;
    data.statistics.totalPhrases = data.phrases.length;
    data.statistics.averagePhraseLength = parseFloat((totalSyllables / data.phrases.length).toFixed(2));

    // Save back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Updated: ${path.basename(filePath)} - ${data.phrases.length} phrases, ${totalSyllables} syllables`);
}

// Process the two English songs
const englishSongs = [
    'data/lyrics-segmentations/were-gonna-shine.json',
    'data/lyrics-segmentations/golden-k-pop-demon-hunters.json'
];

console.log('=== Adding wordMapping to English songs ===\n');

englishSongs.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        addWordMappings(fullPath);
    } else {
        console.log(`❌ Not found: ${file}`);
    }
});

console.log('\n✅ Complete! Now regenerate relationships:\n');
console.log('  node batch-regenerate-relationships.js batch-1\n');
