#!/usr/bin/env node

/**
 * Batch Pattern Generator - Generate Tier 3 patterns for all songs
 *
 * Usage: node batch-generate-all-patterns.js
 *
 * Processes all songs in data/relationships/ directory
 * Outputs to data/patterns/{backend-id}-patterns.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const RELATIONSHIPS_DIR = path.join(__dirname, 'data', 'relationships');
const PATTERNS_DIR = path.join(__dirname, 'data', 'patterns');

// Ensure patterns directory exists
if (!fs.existsSync(PATTERNS_DIR)) {
    fs.mkdirSync(PATTERNS_DIR, { recursive: true });
}

// Get all relationship files
const relationshipFiles = fs.readdirSync(RELATIONSHIPS_DIR)
    .filter(file => file.endsWith('-relationships.json'));

console.log(`\n🎨 Batch Pattern Generator - Tier 3 (KPIC, KRIC, KWIC, KTIC)`);
console.log(`📁 Found ${relationshipFiles.length} songs to process\n`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;
const errors = [];

relationshipFiles.forEach((file, index) => {
    // Extract backend ID from filename
    const backendId = file.replace('-relationships.json', '');
    const patternFile = path.join(PATTERNS_DIR, `${backendId}-patterns.json`);

    // Check if pattern file already exists
    if (fs.existsSync(patternFile)) {
        const stats = fs.statSync(patternFile);
        const content = JSON.parse(fs.readFileSync(patternFile, 'utf8'));

        // Skip if it's a complete pattern file (has all pattern types)
        if (content.kpic && content.kric && content.ksic && content.ktic) {
            console.log(`⏭️  [${index + 1}/${relationshipFiles.length}] Skipping ${backendId} (complete patterns exist, ${(stats.size / 1024).toFixed(1)}KB)`);
            skipCount++;
            return;
        }
    }

    try {
        console.log(`🔄 [${index + 1}/${relationshipFiles.length}] Processing ${backendId}...`);

        // Run pattern analyzer for this song
        execSync(`node pattern-analyzer.js "${backendId}"`, {
            cwd: __dirname,
            stdio: 'pipe'
        });

        // Verify output file
        if (fs.existsSync(patternFile)) {
            const stats = fs.statSync(patternFile);
            const content = JSON.parse(fs.readFileSync(patternFile, 'utf8'));

            // Check if all pattern types were generated
            const hasAll = content.kpic && content.kric && content.kwic && content.ktic;

            if (hasAll) {
                console.log(`✅ [${index + 1}/${relationshipFiles.length}] Generated ${backendId} (${(stats.size / 1024).toFixed(1)}KB)`);
                successCount++;
            } else {
                console.log(`⚠️  [${index + 1}/${relationshipFiles.length}] Partial ${backendId} (missing pattern types)`);
                successCount++;
            }
        } else {
            throw new Error('Output file not created');
        }

    } catch (error) {
        console.error(`❌ [${index + 1}/${relationshipFiles.length}] Failed ${backendId}: ${error.message}`);
        errors.push({ song: backendId, error: error.message });
        errorCount++;
    }
});

console.log(`\n📊 Batch Pattern Generation Complete`);
console.log(`✅ Success: ${successCount}`);
console.log(`⏭️  Skipped: ${skipCount}`);
console.log(`❌ Errors: ${errorCount}`);

if (errors.length > 0) {
    console.log(`\n🔍 Error Details:`);
    errors.forEach(({ song, error }) => {
        console.log(`   ${song}: ${error}`);
    });
}

console.log(`\n📁 Pattern files location: ${PATTERNS_DIR}`);
console.log(`✨ Pattern visualization now available for all processed songs!\n`);
