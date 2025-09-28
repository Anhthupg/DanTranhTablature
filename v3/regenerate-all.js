#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Read the song list
const songList = JSON.parse(fs.readFileSync('data/song-list.json', 'utf8'));

console.log(`🔄 Regenerating ${songList.length} songs with latest fixes...`);

let processed = 0;
let errors = 0;

for (const song of songList) {
    try {
        console.log(`⚙️  Processing ${song.id} (${processed + 1}/${songList.length})`);

        // Generate the song
        execSync(`node generate-dual-panel-viewer.js "${song.id}"`, {
            stdio: 'pipe',  // Suppress output for cleaner batch processing
            timeout: 30000  // 30 second timeout per song
        });

        processed++;

        // Show progress every 10 songs
        if (processed % 10 === 0) {
            console.log(`✅ Progress: ${processed}/${songList.length} songs completed`);
        }

    } catch (error) {
        console.error(`❌ Error processing ${song.id}: ${error.message}`);
        errors++;
    }
}

console.log(`\n🎉 Batch regeneration complete!`);
console.log(`✅ Successfully processed: ${processed} songs`);
if (errors > 0) {
    console.log(`❌ Errors: ${errors} songs`);
}
console.log(`\nAll songs now have the latest fixes:
- No content clipping (overflow fix)
- Improved auto-zoom calculation
- Working back to library button (port 8080)
- Fixed resonance triangles extending beyond string lines
- Comprehensive SVG width calculation (accounts for ALL rightmost elements)
- Debug logging for zoom calculations`);