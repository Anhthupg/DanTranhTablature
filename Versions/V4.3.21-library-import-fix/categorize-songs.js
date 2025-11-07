const fs = require('fs');
const path = require('path');

// Load language detection report
const languageReport = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data/language-detection-report.json'), 'utf8')
);

// Extract all songs by category
const vietnamese = [];
const nonVietnamese = [];

// Process Vietnamese categories
if (languageReport.vietnamese) {
    Object.keys(languageReport.vietnamese).forEach(subcategory => {
        languageReport.vietnamese[subcategory].forEach(item => {
            vietnamese.push(item.file);
        });
    });
}

// Process non-Vietnamese categories
if (languageReport.nonVietnamese) {
    Object.keys(languageReport.nonVietnamese).forEach(subcategory => {
        languageReport.nonVietnamese[subcategory].forEach(item => {
            nonVietnamese.push(item.file);
        });
    });
}

console.log('\n=== SONG CATEGORIZATION ===\n');
console.log(`Vietnamese songs: ${vietnamese.length}`);
console.log(`Non-Vietnamese songs: ${nonVietnamese.length}`);
console.log(`Total songs: ${vietnamese.length + nonVietnamese.length}\n`);

// Now we need to determine which are skeletal vs Dan Tranh interpretations
// For now, I'll ask the user to provide examples or naming conventions

console.log('Vietnamese songs (first 10):');
vietnamese.slice(0, 10).forEach(file => console.log(`  - ${file}`));

console.log('\nNon-Vietnamese songs (all):');
nonVietnamese.forEach(file => console.log(`  - ${file}`));

// Save categorization results
const results = {
    vietnamese,
    nonVietnamese,
    timestamp: new Date().toISOString()
};

fs.writeFileSync(
    path.join(__dirname, 'data/song-categorization.json'),
    JSON.stringify(results, null, 2)
);

console.log('\n✅ Categorization saved to data/song-categorization.json');
