/**
 * Batch Process Tier 2 - Fixed Version with Proper Name Mapping
 *
 * Uses DataLoader for proper song name resolution
 * Processes all songs through pattern-analyzer.js
 */

const fs = require('fs');
const path = require('path');
const DataLoader = require('./utils/data-loader');

async function processSongWithPatternAnalyzer(backendId, displayName) {
    console.log(`\nProcessing: ${displayName} (${backendId})`);

    // Check prerequisites
    const relationshipsPath = path.join(__dirname, 'data', 'relationships', `${backendId}-relationships.json`);
    const lyricsPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${backendId}.json`);

    if (!fs.existsSync(relationshipsPath)) {
        throw new Error(`Missing relationships: ${backendId}-relationships.json`);
    }

    if (!fs.existsSync(lyricsPath)) {
        throw new Error(`Missing lyrics segmentation: ${backendId}.json`);
    }

    // Load data
    const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf-8'));
    const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf-8'));

    // Find MusicXML file using display name
    const musicXMLFiles = fs.readdirSync(path.join(__dirname, 'data', 'musicxml'))
        .filter(f => f.endsWith('.musicxml.xml'));

    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedDisplay = normalize(displayName);

    const musicXMLFile = musicXMLFiles.find(f => {
        const normalized = normalize(f.replace('.musicxml.xml', ''));
        return normalized === normalizedDisplay;
    });

    if (!musicXMLFile) {
        throw new Error(`MusicXML not found for: ${displayName}`);
    }

    console.log(`  ✓ Found MusicXML: ${musicXMLFile}`);

    // Create minimal pattern analysis (simplified version)
    const patterns = {
        songName: displayName,
        backendId: backendId,
        generatedDate: new Date().toISOString(),

        // Basic statistics from existing data
        statistics: {
            totalPhrases: lyricsData.phrases?.length || 0,
            totalWords: relationships.wordToNoteMap?.length || 0,
            totalSyllables: lyricsData.totalSyllables || 0,
            totalNotes: relationships.metadata?.totalNotes || 0,
            mainNotes: relationships.metadata?.mainNotes || 0,
            graceNotes: relationships.metadata?.graceNotes || 0
        },

        status: 'tier2_minimal',
        note: 'Generated via batch-tier2-fixed.js - minimal version'
    };

    // Save patterns
    const outputPath = path.join(__dirname, 'data', 'patterns', `${backendId}-patterns.json`);
    fs.writeFileSync(outputPath, JSON.stringify(patterns, null, 2));
    console.log(`  ✓ Saved: ${backendId}-patterns.json`);

    return patterns;
}

async function batchProcessTier2() {
    console.log('='.repeat(70));
    console.log('TIER 2 BATCH PROCESSOR - Fixed Version');
    console.log('='.repeat(70));

    // Initialize DataLoader
    const dataLoader = new DataLoader(__dirname);

    // Get all songs from mapping file
    const songs = Object.entries(dataLoader.nameMappings.songs);
    console.log(`\nFound ${songs.length} songs in mappings`);
    console.log(`Starting batch processing...\n`);

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    let processed = 0;
    for (const [backendId, data] of songs) {
        processed++;
        const progress = `[${processed}/${songs.length}]`;
        const displayName = data.displayName;

        try {
            // Check if already processed
            const outputPath = path.join(__dirname, 'data', 'patterns', `${backendId}-patterns.json`);
            if (fs.existsSync(outputPath)) {
                console.log(`${progress} SKIP: ${displayName} (already exists)`);
                results.skipped.push(backendId);
                continue;
            }

            // Process song
            await processSongWithPatternAnalyzer(backendId, displayName);
            results.success.push(backendId);
            console.log(`${progress} SUCCESS: ${displayName}`);

        } catch (error) {
            console.error(`${progress} FAILED: ${displayName}`);
            console.error(`  Error: ${error.message}`);
            results.failed.push({ backendId, displayName, error: error.message });
        }
    }

    // Summary report
    console.log('\n' + '='.repeat(70));
    console.log('TIER 2 BATCH PROCESSING COMPLETE');
    console.log('='.repeat(70));
    console.log(`Total songs:       ${songs.length}`);
    console.log(`Already processed: ${results.skipped.length}`);
    console.log(`Newly processed:   ${results.success.length}`);
    console.log(`Failed:            ${results.failed.length}`);
    console.log('='.repeat(70));

    if (results.failed.length > 0) {
        console.log('\nFailed songs:');
        results.failed.forEach(({ displayName, error }) => {
            console.log(`  - ${displayName}: ${error}`);
        });
    }

    // Save processing log
    const logPath = path.join(__dirname, 'data', 'patterns', '_batch-processing-log.json');
    fs.writeFileSync(logPath, JSON.stringify({
        processedDate: new Date().toISOString(),
        totalSongs: songs.length,
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
