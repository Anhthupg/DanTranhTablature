/**
 * Batch Regenerate Relationships
 *
 * After segmenting lyrics, regenerate relationships for processed songs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const batchName = process.argv[2] || 'batch-1';
const metadataFile = path.join(__dirname, 'data/segmentation-prompts', `${batchName}-metadata.json`);

if (!fs.existsSync(metadataFile)) {
    console.error(`Metadata file not found: ${metadataFile}`);
    console.log('Usage: node batch-regenerate-relationships.js batch-1');
    process.exit(1);
}

const songs = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));

console.log(`=== REGENERATING RELATIONSHIPS FOR ${batchName.toUpperCase()} ===\n`);
console.log(`Processing ${songs.length} songs...\n`);

let succeeded = 0;
let failed = 0;

songs.forEach((song, index) => {
    const songName = song.filename.replace('.musicxml.xml', '').replace('.musicxml', '').replace('.xml', '');

    console.log(`[${index + 1}/${songs.length}] Processing: ${song.displayName}`);

    try {
        execSync(`node generate-v4-relationships.js "${songName}"`, {
            cwd: __dirname,
            stdio: 'inherit'
        });
        succeeded++;
    } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        failed++;
    }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Succeeded: ${succeeded}`);
console.log(`Failed: ${failed}`);
console.log(`\nNext step: node update-manifest.js`);
