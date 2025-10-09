const fs = require('fs');
const path = require('path');

/**
 * Section Recognition System - Complete Pattern Storage (KxxIC-1 to KxxIC-N)
 *
 * Extracts and stores ALL patterns of ALL lengths (1 to N) for comprehensive analysis:
 * 1. Section detection: Repeating patterns (count >= 2)
 * 2. Cross-song similarity: Long unique patterns
 * 3. Melisma queries: Short patterns (2-3 notes)
 * 4. Pattern-based queries: Complete coverage for any analysis
 *
 * Covers all 5 dimensions:
 * - KPIC: Pitch sequences
 * - KDIC: Duration sequences (grace-aware)
 * - KSIC: Syllable sequences
 * - KTIC: Tone sequences
 * - KRIC: Rhyme sequences
 *
 * Input: data/notes-annotated/*.json
 * Output: data/sections/*.json
 */

const ANNOTATED_DIR = path.join(__dirname, 'data', 'notes-annotated');
const OUTPUT_DIR = path.join(__dirname, 'data', 'sections');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Extract sequences from notes for a specific dimension
 */
function extractSequence(notes, dimension) {
    return notes.map(note => {
        switch (dimension) {
            case 'kpic':
                return note.pitch;

            case 'kdic':
                // Grace-aware duration
                return note.isGrace
                    ? (note.duration <= 0.5 ? 'g16th' : 'g8th')
                    : note.duration.toString();

            case 'ksic':
                return note.lyric || null;

            case 'ktic':
                return note.tone || null;

            case 'kric':
                return note.rhymeFamily || null;

            default:
                return null;
        }
    }).filter(v => v !== null);
}

/**
 * Find ALL patterns of a specific length for comprehensive analysis
 * Stores every pattern regardless of count for:
 * - Section detection (repeating patterns)
 * - Cross-song similarity (long patterns)
 * - Melisma queries (2-3 note patterns)
 * - Any pattern-based analysis
 */
function findRepeatingPatterns(sequence, length) {
    const patterns = {};

    // Extract all possible patterns of this length
    for (let i = 0; i <= sequence.length - length; i++) {
        const pattern = sequence.slice(i, i + length).join('→');

        if (!patterns[pattern]) {
            patterns[pattern] = {
                pattern: pattern,
                length: length,
                count: 0,
                positions: []
            };
        }

        patterns[pattern].count++;
        patterns[pattern].positions.push(i);
    }

    // Return ALL patterns (no filtering)
    return Object.values(patterns);
}

/**
 * Extract ALL patterns for one dimension (KxxIC-1 to KxxIC-N)
 */
function extractRepeatingPatternsForDimension(notes, dimension, minLength = 1) {
    console.log(`    Analyzing ${dimension}...`);

    const sequence = extractSequence(notes, dimension);

    if (sequence.length < minLength) {
        console.log(`      Skipped (sequence too short: ${sequence.length} < ${minLength})`);
        return { dimension, patterns: [] };
    }

    const allPatterns = [];
    let totalPatterns = 0;
    let repeatingCount = 0;
    let uniqueCount = 0;

    // Try all lengths from minLength to sequence length
    for (let length = minLength; length <= sequence.length; length++) {
        const patterns = findRepeatingPatterns(sequence, length);

        if (patterns.length > 0) {
            allPatterns.push({
                length: length,
                patterns: patterns
            });
            totalPatterns += patterns.length;

            // Count types
            patterns.forEach(p => {
                if (p.count >= 2) {
                    repeatingCount++;
                } else {
                    uniqueCount++;
                }
            });
        }
    }

    console.log(`      Found ${totalPatterns} patterns (${repeatingCount} repeating, ${uniqueCount} unique)`);

    return {
        dimension,
        sequenceLength: sequence.length,
        allPatterns: allPatterns,
        statistics: {
            minLength: minLength,
            maxLength: sequence.length,
            totalPatterns: totalPatterns,
            repeatingPatterns: repeatingCount,
            uniquePatterns: uniqueCount
        }
    };
}

/**
 * Classify section types based on pattern repetition
 */
function classifySections(dimensionResults) {
    const sections = [];

    // Use KPIC (pitch) as primary dimension for section detection
    const kpicResults = dimensionResults.find(r => r.dimension === 'kpic');

    if (!kpicResults || kpicResults.allPatterns.length === 0) {
        return sections;
    }

    // Find longest repeating pattern (likely refrain/main section)
    const longestPatterns = kpicResults.allPatterns
        .sort((a, b) => b.length - a.length)[0];

    if (longestPatterns) {
        longestPatterns.patterns.forEach(pattern => {
            if (pattern.count >= 2) {
                pattern.positions.forEach((pos, idx) => {
                    sections.push({
                        type: idx === 0 ? 'opening' : (idx === pattern.count - 1 ? 'closing' : 'refrain'),
                        startNote: pos,
                        endNote: pos + pattern.length,
                        patternLength: pattern.length,
                        pattern: pattern.pattern.substring(0, 100) + (pattern.pattern.length > 100 ? '...' : ''),
                        repetitionNumber: idx + 1,
                        totalRepetitions: pattern.count
                    });
                });
            }
        });
    }

    // Sort sections by position
    sections.sort((a, b) => a.startNote - b.startNote);

    return sections;
}

/**
 * Process one song
 */
function processSong(songFile) {
    const songName = songFile.replace('-annotated.json', '');
    console.log(`\nProcessing: ${songName}`);

    // Load annotated notes
    const filePath = path.join(ANNOTATED_DIR, songFile);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    console.log(`  Total notes: ${data.totalNotes}`);

    // Extract repeating patterns for all 5 dimensions
    const dimensions = ['kpic', 'kdic', 'ksic', 'ktic', 'kric'];
    const dimensionResults = dimensions.map(dim =>
        extractRepeatingPatternsForDimension(data.notes, dim)
    );

    // Classify sections
    const sections = classifySections(dimensionResults);

    // Summary statistics
    const totalPatterns = dimensionResults.reduce((sum, r) =>
        sum + (r.statistics?.totalPatterns || 0), 0
    );
    const totalRepeating = dimensionResults.reduce((sum, r) =>
        sum + (r.statistics?.repeatingPatterns || 0), 0
    );
    const totalUnique = dimensionResults.reduce((sum, r) =>
        sum + (r.statistics?.uniquePatterns || 0), 0
    );

    console.log(`  Total patterns: ${totalPatterns} (${totalRepeating} repeating, ${totalUnique} unique)`);
    console.log(`  Sections identified: ${sections.length}`);

    // Prepare output
    const output = {
        songName: songName,
        generatedDate: new Date().toISOString(),
        totalNotes: data.totalNotes,
        mainNotes: data.mainNotes,
        graceNotes: data.graceNotes,
        dimensions: dimensionResults,
        sections: sections,
        statistics: {
            totalPatterns: totalPatterns,
            repeatingPatterns: totalRepeating,
            uniquePatterns: totalUnique,
            byDimension: dimensionResults.map(r => ({
                dimension: r.dimension,
                sequenceLength: r.sequenceLength,
                totalPatterns: r.statistics?.totalPatterns || 0,
                repeatingPatterns: r.statistics?.repeatingPatterns || 0,
                uniquePatterns: r.statistics?.uniquePatterns || 0
            })),
            sectionsIdentified: sections.length
        }
    };

    return output;
}

/**
 * Process all songs
 */
function processAllSongs() {
    console.log('=== Section Recognition System ===');
    console.log('Extracting ALL patterns (KxxIC-1 to KxxIC-N) for all 5 dimensions:');
    console.log('  - Complete pattern coverage for section detection, similarity, and queries\n');

    const files = fs.readdirSync(ANNOTATED_DIR)
        .filter(f => f.endsWith('-annotated.json'));

    console.log(`Found ${files.length} annotated songs\n`);

    let successCount = 0;
    let totalPatterns = 0;
    let totalRepeating = 0;
    let totalUnique = 0;
    let totalSections = 0;

    const collectionStats = {
        byDimension: {
            kpic: { totalPatterns: 0, repeatingPatterns: 0, uniquePatterns: 0, totalSongs: 0 },
            kdic: { totalPatterns: 0, repeatingPatterns: 0, uniquePatterns: 0, totalSongs: 0 },
            ksic: { totalPatterns: 0, repeatingPatterns: 0, uniquePatterns: 0, totalSongs: 0 },
            ktic: { totalPatterns: 0, repeatingPatterns: 0, uniquePatterns: 0, totalSongs: 0 },
            kric: { totalPatterns: 0, repeatingPatterns: 0, uniquePatterns: 0, totalSongs: 0 }
        }
    };

    files.forEach(file => {
        try {
            const result = processSong(file);

            // Save individual song results
            const outputPath = path.join(OUTPUT_DIR, `${result.songName}-sections.json`);
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

            successCount++;
            totalPatterns += result.statistics.totalPatterns;
            totalRepeating += result.statistics.repeatingPatterns;
            totalUnique += result.statistics.uniquePatterns;
            totalSections += result.sections.length;

            // Update collection stats
            result.statistics.byDimension.forEach(dim => {
                if (dim.totalPatterns > 0) {
                    collectionStats.byDimension[dim.dimension].totalPatterns += dim.totalPatterns;
                    collectionStats.byDimension[dim.dimension].repeatingPatterns += dim.repeatingPatterns;
                    collectionStats.byDimension[dim.dimension].uniquePatterns += dim.uniquePatterns;
                    collectionStats.byDimension[dim.dimension].totalSongs++;
                }
            });

        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
    });

    // Save collection statistics
    const collectionOutput = {
        generatedDate: new Date().toISOString(),
        totalSongs: successCount,
        totalPatterns: totalPatterns,
        repeatingPatterns: totalRepeating,
        uniquePatterns: totalUnique,
        totalSectionsIdentified: totalSections,
        averagePatternsPerSong: (totalPatterns / successCount).toFixed(1),
        averageRepeatingPerSong: (totalRepeating / successCount).toFixed(1),
        averageUniquePerSong: (totalUnique / successCount).toFixed(1),
        averageSectionsPerSong: (totalSections / successCount).toFixed(1),
        byDimension: collectionStats.byDimension
    };

    fs.writeFileSync(
        path.join(OUTPUT_DIR, '_collection-summary.json'),
        JSON.stringify(collectionOutput, null, 2),
        'utf8'
    );

    console.log('\n=== Summary ===');
    console.log(`✅ Successfully processed: ${successCount} songs`);
    console.log(`Total patterns: ${totalPatterns.toLocaleString()} (${totalRepeating.toLocaleString()} repeating, ${totalUnique.toLocaleString()} unique)`);
    console.log(`Total sections identified: ${totalSections}`);
    console.log(`\nAverage per song:`);
    console.log(`  Total patterns: ${(totalPatterns / successCount).toFixed(1)}`);
    console.log(`  Repeating patterns: ${(totalRepeating / successCount).toFixed(1)}`);
    console.log(`  Unique patterns: ${(totalUnique / successCount).toFixed(1)}`);
    console.log(`  Sections: ${(totalSections / successCount).toFixed(1)}`);
    console.log(`\nPatterns by dimension:`);
    Object.entries(collectionStats.byDimension).forEach(([dim, stats]) => {
        console.log(`  ${dim}: ${stats.totalPatterns} total (${stats.repeatingPatterns} repeating, ${stats.uniquePatterns} unique) in ${stats.totalSongs} songs`);
    });
    console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

// Run if called directly
if (require.main === module) {
    processAllSongs();
}

module.exports = { processSong, processAllSongs };
