#!/usr/bin/env node

/**
 * Batch Generate Structure Sections for All Songs
 * Regenerates phrase annotations with corrected section numbering
 */

const fs = require('fs');
const path = require('path');
const { PhraseAnnotationGenerator } = require('./generate-phrase-annotations.js');

const lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
const relationshipsDir = path.join(__dirname, 'data', 'relationships');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Batch Structure Section Generator                        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Get all lyrics files
const lyricsFiles = fs.readdirSync(lyricsDir).filter(f => f.endsWith('.json'));
console.log(`Found ${lyricsFiles.length} lyrics files\n`);

const generator = new PhraseAnnotationGenerator();
let processed = 0;
let skipped = 0;
let errors = 0;

lyricsFiles.forEach((lyricsFile, idx) => {
    const songName = lyricsFile.replace('.json', '');

    // Progress indicator
    if ((idx + 1) % 10 === 0) {
        const percent = Math.floor(((idx + 1) / lyricsFiles.length) * 100);
        console.log(`✅ [${idx + 1}/${lyricsFiles.length}] ${percent}% - ${songName}`);
    }

    try {
        // Load lyrics
        const lyricsPath = path.join(lyricsDir, lyricsFile);
        const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

        // Find matching relationships file (with flexible matching)
        const normalize = (str) => str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .toLowerCase();

        const allRelFiles = fs.readdirSync(relationshipsDir).filter(f => f.endsWith('-relationships.json'));
        const normalizedSongName = normalize(songName);

        const matchingRelFile = allRelFiles.find(file => {
            const fileBase = file.replace('-relationships.json', '');
            return normalize(fileBase) === normalizedSongName;
        });

        if (!matchingRelFile) {
            skipped++;
            return;
        }

        const relationshipsPath = path.join(relationshipsDir, matchingRelFile);
        const relationshipsData = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

        // Generate annotations (this will use the new corrected section numbering)
        const result = generator.generate(lyricsData, relationshipsData);

        // The sections are now in result.analysis.sections with corrected labels
        console.log(`  ✓ ${songName}: ${result.analysis.sections.length} sections`);
        result.analysis.sections.forEach(s => {
            console.log(`    - ${s.label} (${s.phraseCount} phrases)`);
        });

        processed++;

    } catch (err) {
        console.error(`  ✗ ${songName}: ${err.message}`);
        errors++;
    }
});

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  Batch Processing Complete!                               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`✅ Processed: ${processed} songs`);
console.log(`⏭️  Skipped: ${skipped} songs (no relationships file)`);
console.log(`✗  Errors: ${errors} songs`);

console.log('\n📝 Note: Section numbering now uses sequential counters:');
console.log('   - Dialogue 1, 2, 3... (not skipped numbers)');
console.log('   - Verse 1, 2, 3... (not Verse 0)');
console.log('   - Refrain 1, 2, 3... (sequential)\n');
