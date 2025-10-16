/**
 * Batch Process Tier 2 - Pattern Analysis for All Songs
 *
 * Runs pattern-analyzer.js on all songs in the data directory
 * to complete Tier 2 (Contextual Pattern Calculation)
 */

const fs = require('fs');
const path = require('path');
const PatternAnalyzer = require('./pattern-analyzer');

async function batchProcessTier2() {
    console.log('='.repeat(70));
    console.log('TIER 2 BATCH PROCESSOR - Pattern Analysis');
    console.log('='.repeat(70));

    // Get all songs from lyrics-segmentations (canonical source)
    const lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
    const allSongs = fs.readdirSync(lyricsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));

    console.log(`\nFound ${allSongs.length} songs to process`);
    console.log(`Starting batch processing...\n`);

    const analyzer = new PatternAnalyzer();
    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    let processed = 0;
    for (const songName of allSongs) {
        processed++;
        const progress = `[${processed}/${allSongs.length}]`;

        try {
            // Check if already processed
            const outputPath = path.join(__dirname, 'data', 'patterns', `${songName}-patterns.json`);
            if (fs.existsSync(outputPath)) {
                console.log(`${progress} SKIP: ${songName} (already exists)`);
                results.skipped.push(songName);
                continue;
            }

            // Process song
            console.log(`${progress} Processing: ${songName}`);
            await analyzer.analyzeSong(songName);
            results.success.push(songName);
            console.log(`${progress} SUCCESS: ${songName}\n`);

        } catch (error) {
            console.error(`${progress} FAILED: ${songName}`);
            console.error(`  Error: ${error.message}\n`);
            results.failed.push({ song: songName, error: error.message });
        }
    }

    // Summary report
    console.log('\n' + '='.repeat(70));
    console.log('TIER 2 BATCH PROCESSING COMPLETE');
    console.log('='.repeat(70));
    console.log(`Total songs:      ${allSongs.length}`);
    console.log(`Already processed: ${results.skipped.length}`);
    console.log(`Newly processed:   ${results.success.length}`);
    console.log(`Failed:            ${results.failed.length}`);
    console.log('='.repeat(70));

    if (results.failed.length > 0) {
        console.log('\nFailed songs:');
        results.failed.forEach(({ song, error }) => {
            console.log(`  - ${song}: ${error}`);
        });
    }

    // Save processing log
    const logPath = path.join(__dirname, 'data', 'patterns', '_batch-processing-log.json');
    fs.writeFileSync(logPath, JSON.stringify({
        processedDate: new Date().toISOString(),
        totalSongs: allSongs.length,
        results
    }, null, 2));
    console.log(`\nProcessing log saved to: ${logPath}`);
}

// Run batch processing
if (require.main === module) {
    batchProcessTier2()
        .then(() => {
            console.log('\nBatch processing completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\nBatch processing failed:', error);
            process.exit(1);
        });
}

module.exports = { batchProcessTier2 };
