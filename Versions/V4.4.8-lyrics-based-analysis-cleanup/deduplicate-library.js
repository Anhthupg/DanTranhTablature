/**
 * Deduplicate Library - Remove duplicate entries from song-library.json
 *
 * Problem: auto-import-library.js was run multiple times, creating duplicates
 * Solution: Keep only unique entries based on filename
 */

const fs = require('fs');
const path = require('path');

const libraryPath = path.join(__dirname, 'data', 'library', 'song-library.json');
const backupPath = path.join(__dirname, 'data', 'library', 'song-library-backup-' + Date.now() + '.json');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Library Deduplication Tool                             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Load library
if (!fs.existsSync(libraryPath)) {
    console.error(`❌ Library not found: ${libraryPath}`);
    process.exit(1);
}

const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
console.log(`📊 Original library: ${library.length} entries`);

// Create backup
fs.writeFileSync(backupPath, JSON.stringify(library, null, 2));
console.log(`💾 Backup created: ${backupPath}`);

// Deduplicate by filename
const uniqueByFilename = {};
library.forEach(song => {
    if (!uniqueByFilename[song.filename]) {
        uniqueByFilename[song.filename] = song;
    }
});

const deduplicatedLibrary = Object.values(uniqueByFilename);

console.log(`\n✨ Deduplicated library: ${deduplicatedLibrary.length} entries`);
console.log(`🗑️  Removed ${library.length - deduplicatedLibrary.length} duplicates\n`);

// Show some examples of removed duplicates
const duplicates = library.length - deduplicatedLibrary.length;
if (duplicates > 0) {
    console.log('Examples of duplicates removed:');

    const titleCounts = {};
    library.forEach(song => {
        titleCounts[song.title] = (titleCounts[song.title] || 0) + 1;
    });

    const duplicateTitles = Object.entries(titleCounts)
        .filter(([, count]) => count > 1)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    duplicateTitles.forEach(([title, count]) => {
        console.log(`  • "${title}" - appeared ${count} times, kept 1`);
    });
    console.log('');
}

// Save deduplicated library
fs.writeFileSync(libraryPath, JSON.stringify(deduplicatedLibrary, null, 2));
console.log(`✅ Saved deduplicated library: ${libraryPath}`);

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   Deduplication Complete!                                ║');
console.log(`║   Before: ${library.length} entries`.padEnd(61) + '║');
console.log(`║   After:  ${deduplicatedLibrary.length} entries`.padEnd(61) + '║');
console.log(`║   Removed: ${duplicates} duplicates`.padEnd(61) + '║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Restart your server to see the updated library.');
