/**
 * Batch Regenerate All Relationships with Slur-to-Tie Conversion
 * Applies hard-coded slur-to-tie rule to all songs systematically
 */

const fs = require('fs');
const path = require('path');
const V4RelationshipsGenerator = require('./generate-v4-relationships');

async function regenerateAll() {
    console.log('='.repeat(80));
    console.log('BATCH REGENERATE ALL RELATIONSHIPS');
    console.log('Applying slur-to-tie conversion systematically');
    console.log('='.repeat(80));

    // Load song mappings
    const mappingsPath = path.join(__dirname, 'data', 'song-name-mappings.json');
    const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
    const songs = Object.keys(mappings.songs);

    console.log(`\nFound ${songs.length} songs in mapping file\n`);

    const generator = new V4RelationshipsGenerator();
    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    for (let i = 0; i < songs.length; i++) {
        const backendId = songs[i];
        const songData = mappings.songs[backendId];
        const displayName = songData.displayName;

        console.log(`[${i + 1}/${songs.length}] Processing: ${displayName} (${backendId})`);

        try {
            // Check if lyrics segmentation exists
            const lyricsPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${backendId}.json`);
            if (!fs.existsSync(lyricsPath)) {
                console.log(`  ⊘ Skipped: No lyrics segmentation`);
                results.skipped.push(backendId);
                continue;
            }

            // Generate relationships
            await generator.generateRelationships(displayName);
            results.success.push(backendId);
            console.log(`  ✓ Success\n`);

        } catch (err) {
            console.error(`  ✗ Failed: ${err.message}\n`);
            results.failed.push({ song: backendId, error: err.message });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('BATCH REGENERATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`✓ Success: ${results.success.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);
    console.log(`⊘ Skipped: ${results.skipped.length} (no lyrics segmentation)`);
    console.log('='.repeat(80));

    if (results.failed.length > 0) {
        console.log('\nFailed songs:');
        results.failed.forEach(f => console.log(`  - ${f.song}: ${f.error}`));
    }

    // Save summary
    const summaryPath = path.join(__dirname, 'batch-regenerate-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    console.log(`\nSummary saved to: ${summaryPath}`);
}

// Run
regenerateAll().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
