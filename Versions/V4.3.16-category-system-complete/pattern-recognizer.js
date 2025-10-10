const fs = require('fs');
const path = require('path');

/**
 * Tier 3: Pattern Recognition System
 *
 * Identifies recurring motifs, signature patterns, and regional fingerprints
 * across the entire collection of 123 Vietnamese Dan Tranh songs.
 *
 * Input: data/notes-annotated/*.json (per-note pattern annotations)
 * Output: data/motifs/*.json (motif analysis results)
 */

const ANNOTATED_DIR = path.join(__dirname, 'data', 'notes-annotated');
const METADATA_FILE = path.join(__dirname, 'data', 'song-metadata-complete.json');
const OUTPUT_DIR = path.join(__dirname, 'data', 'motifs');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Load all annotated songs
 */
function loadAllAnnotatedSongs() {
    console.log('Loading annotated songs...');
    const files = fs.readdirSync(ANNOTATED_DIR)
        .filter(f => f.endsWith('-annotated.json'));

    const songs = files.map(file => {
        const filePath = path.join(ANNOTATED_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
            fileName: file.replace('-annotated.json', ''),
            ...data
        };
    });

    console.log(`  Loaded ${songs.length} songs`);
    return songs;
}

/**
 * Load song metadata for regional classification
 */
function loadMetadata() {
    if (!fs.existsSync(METADATA_FILE)) {
        console.log('  No metadata file found, skipping regional analysis');
        return null;
    }

    const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
    const metadata = data.songs || data;  // Handle both {songs: []} and [] formats
    console.log(`  Loaded metadata for ${metadata.length} songs`);
    return metadata;
}

/**
 * Extract all motifs from annotated songs
 */
function extractMotifs(songs) {
    console.log('\nExtracting motifs...');

    const motifs = {
        kpic2: {},  // 2-note pitch patterns
        kpic3: {},  // 3-note pitch patterns
        kdic2: {},  // 2-note duration patterns
        kdic3: {},  // 3-note duration patterns
        ktic2: {},  // 2-tone patterns
        ktic3: {}   // 3-tone patterns
    };

    songs.forEach(song => {
        song.notes.forEach(note => {
            // Extract each pattern type
            Object.keys(motifs).forEach(patternType => {
                const pattern = note.patterns[patternType];

                if (pattern) {
                    if (!motifs[patternType][pattern]) {
                        motifs[patternType][pattern] = {
                            pattern: pattern,
                            totalOccurrences: 0,
                            songCount: 0,
                            songs: {}
                        };
                    }

                    motifs[patternType][pattern].totalOccurrences++;

                    if (!motifs[patternType][pattern].songs[song.songName]) {
                        motifs[patternType][pattern].songs[song.songName] = 0;
                        motifs[patternType][pattern].songCount++;
                    }

                    motifs[patternType][pattern].songs[song.songName]++;
                }
            });
        });
    });

    // Convert songs object to array for easier processing
    Object.keys(motifs).forEach(patternType => {
        Object.keys(motifs[patternType]).forEach(pattern => {
            const motif = motifs[patternType][pattern];
            motif.songList = Object.entries(motif.songs)
                .map(([songName, count]) => ({ songName, count }))
                .sort((a, b) => b.count - a.count);
            delete motif.songs;
        });
    });

    console.log(`  Extracted motifs:`);
    Object.keys(motifs).forEach(type => {
        const count = Object.keys(motifs[type]).length;
        console.log(`    ${type}: ${count} unique patterns`);
    });

    return motifs;
}

/**
 * Classify motifs by frequency
 */
function classifyMotifs(motifs, totalSongs) {
    console.log('\nClassifying motifs by frequency...');

    const classification = {
        universal: [],      // 30+ songs (universal patterns)
        common: [],         // 10-29 songs (common patterns)
        regional: [],       // 3-9 songs (regional patterns)
        signature: [],      // 1-2 songs (signature patterns)
        statistics: {}
    };

    Object.keys(motifs).forEach(patternType => {
        classification.statistics[patternType] = {
            universal: 0,
            common: 0,
            regional: 0,
            signature: 0
        };

        Object.values(motifs[patternType]).forEach(motif => {
            const entry = {
                patternType: patternType,
                pattern: motif.pattern,
                songCount: motif.songCount,
                totalOccurrences: motif.totalOccurrences,
                averagePerSong: (motif.totalOccurrences / motif.songCount).toFixed(2),
                songList: motif.songList.slice(0, 10)  // Top 10 songs
            };

            if (motif.songCount >= 30) {
                classification.universal.push(entry);
                classification.statistics[patternType].universal++;
            } else if (motif.songCount >= 10) {
                classification.common.push(entry);
                classification.statistics[patternType].common++;
            } else if (motif.songCount >= 3) {
                classification.regional.push(entry);
                classification.statistics[patternType].regional++;
            } else {
                classification.signature.push(entry);
                classification.statistics[patternType].signature++;
            }
        });
    });

    // Sort by frequency
    classification.universal.sort((a, b) => b.songCount - a.songCount);
    classification.common.sort((a, b) => b.songCount - a.songCount);
    classification.regional.sort((a, b) => b.songCount - a.songCount);
    classification.signature.sort((a, b) => b.totalOccurrences - a.totalOccurrences);

    console.log(`  Classification results:`);
    console.log(`    Universal patterns: ${classification.universal.length}`);
    console.log(`    Common patterns: ${classification.common.length}`);
    console.log(`    Regional patterns: ${classification.regional.length}`);
    console.log(`    Signature patterns: ${classification.signature.length}`);

    return classification;
}

/**
 * Identify signature patterns for each song
 */
function identifySongSignatures(songs, motifs) {
    console.log('\nIdentifying signature patterns per song...');

    const songSignatures = {};

    songs.forEach(song => {
        const signatures = {
            songName: song.songName,
            totalNotes: song.totalNotes,
            uniquePatterns: [],
            dominantPatterns: []
        };

        // Count patterns in this song
        const patternCounts = {};

        song.notes.forEach(note => {
            Object.keys(note.patterns).forEach(patternType => {
                const pattern = note.patterns[patternType];
                if (pattern) {
                    const key = `${patternType}:${pattern}`;
                    patternCounts[key] = (patternCounts[key] || 0) + 1;
                }
            });
        });

        // Find patterns unique to this song (appear in 1-2 songs only)
        Object.entries(patternCounts).forEach(([key, count]) => {
            const [patternType, pattern] = key.split(':');
            const motif = motifs[patternType][pattern];

            if (motif && motif.songCount <= 2) {
                signatures.uniquePatterns.push({
                    patternType,
                    pattern,
                    count,
                    percentage: ((count / song.totalNotes) * 100).toFixed(1),
                    appearsIn: motif.songCount,
                    totalOccurrences: motif.totalOccurrences
                });
            }
        });

        // Find dominant patterns (occur 5+ times in this song)
        Object.entries(patternCounts).forEach(([key, count]) => {
            if (count >= 5) {
                const [patternType, pattern] = key.split(':');
                const motif = motifs[patternType][pattern];

                signatures.dominantPatterns.push({
                    patternType,
                    pattern,
                    count,
                    percentage: ((count / song.totalNotes) * 100).toFixed(1),
                    appearsIn: motif ? motif.songCount : 0
                });
            }
        });

        // Sort by frequency
        signatures.uniquePatterns.sort((a, b) => b.count - a.count);
        signatures.dominantPatterns.sort((a, b) => b.count - a.count);

        songSignatures[song.songName] = signatures;
    });

    console.log(`  Generated signatures for ${Object.keys(songSignatures).length} songs`);

    return songSignatures;
}

/**
 * Analyze regional fingerprints
 */
function analyzeRegionalFingerprints(songs, motifs, metadata) {
    console.log('\nAnalyzing regional fingerprints...');

    if (!metadata) {
        console.log('  Skipping (no metadata available)');
        return null;
    }

    // Create region mapping
    const regionMap = {};
    metadata.forEach(song => {
        if (song.region && song.region !== 'missing') {
            regionMap[song.title.toLowerCase()] = song.region;
        }
    });

    // Group songs by region
    const regions = {
        Northern: [],
        Southern: [],
        Central: [],
        Highland: []
    };

    songs.forEach(song => {
        const songKey = song.songName.toLowerCase().replace(/-/g, ' ');
        const region = regionMap[songKey];
        if (region && regions[region]) {
            regions[region].push(song);
        }
    });

    console.log(`  Regional distribution:`);
    Object.entries(regions).forEach(([region, songs]) => {
        console.log(`    ${region}: ${songs.length} songs`);
    });

    // Analyze patterns per region
    const regionalFingerprints = {};

    Object.entries(regions).forEach(([region, regionSongs]) => {
        if (regionSongs.length < 3) {
            console.log(`  Skipping ${region} (too few songs: ${regionSongs.length})`);
            return;
        }

        const fingerprint = {
            region,
            songCount: regionSongs.length,
            characteristicPatterns: []
        };

        // Count patterns in this region
        const patternCounts = {};

        regionSongs.forEach(song => {
            song.notes.forEach(note => {
                Object.keys(note.patterns).forEach(patternType => {
                    const pattern = note.patterns[patternType];
                    if (pattern) {
                        const key = `${patternType}:${pattern}`;
                        if (!patternCounts[key]) {
                            patternCounts[key] = {
                                count: 0,
                                songsWithPattern: new Set()
                            };
                        }
                        patternCounts[key].count++;
                        patternCounts[key].songsWithPattern.add(song.songName);
                    }
                });
            });
        });

        // Find characteristic patterns (appear in 50%+ of region's songs)
        const threshold = Math.ceil(regionSongs.length * 0.5);

        Object.entries(patternCounts).forEach(([key, data]) => {
            if (data.songsWithPattern.size >= threshold) {
                const [patternType, pattern] = key.split(':');
                const motif = motifs[patternType][pattern];

                // Calculate regional specificity
                const regionalPercentage = (data.songsWithPattern.size / regionSongs.length * 100).toFixed(1);
                const globalPercentage = motif ? (motif.songCount / 123 * 100).toFixed(1) : 0;

                fingerprint.characteristicPatterns.push({
                    patternType,
                    pattern,
                    songsInRegion: data.songsWithPattern.size,
                    regionalPercentage,
                    totalOccurrences: data.count,
                    globalSongCount: motif ? motif.songCount : 0,
                    globalPercentage,
                    specificity: (parseFloat(regionalPercentage) - parseFloat(globalPercentage)).toFixed(1)
                });
            }
        });

        fingerprint.characteristicPatterns.sort((a, b) =>
            parseFloat(b.specificity) - parseFloat(a.specificity)
        );

        regionalFingerprints[region] = fingerprint;
    });

    console.log(`  Generated fingerprints for ${Object.keys(regionalFingerprints).length} regions`);

    return regionalFingerprints;
}

/**
 * Generate statistics summary
 */
function generateStatistics(songs, motifs, classification) {
    console.log('\nGenerating statistics...');

    const stats = {
        collection: {
            totalSongs: songs.length,
            totalNotes: songs.reduce((sum, s) => sum + s.totalNotes, 0),
            totalMainNotes: songs.reduce((sum, s) => sum + s.mainNotes, 0),
            totalGraceNotes: songs.reduce((sum, s) => sum + s.graceNotes, 0)
        },
        motifs: {
            byType: {}
        },
        classification: classification.statistics
    };

    // Motifs by type
    Object.keys(motifs).forEach(patternType => {
        const patterns = Object.values(motifs[patternType]);
        stats.motifs.byType[patternType] = {
            uniquePatterns: patterns.length,
            totalOccurrences: patterns.reduce((sum, p) => sum + p.totalOccurrences, 0),
            averageOccurrences: (patterns.reduce((sum, p) => sum + p.totalOccurrences, 0) / patterns.length).toFixed(2),
            mostCommon: patterns.sort((a, b) => b.songCount - a.songCount).slice(0, 5).map(p => ({
                pattern: p.pattern,
                songCount: p.songCount,
                totalOccurrences: p.totalOccurrences
            }))
        };
    });

    console.log(`  Statistics generated`);

    return stats;
}

/**
 * Main execution
 */
function recognizePatterns() {
    console.log('=== Tier 3: Pattern Recognition System ===\n');

    const songs = loadAllAnnotatedSongs();
    const metadata = loadMetadata();

    const motifs = extractMotifs(songs);
    const classification = classifyMotifs(motifs, songs.length);
    const songSignatures = identifySongSignatures(songs, motifs);
    const regionalFingerprints = analyzeRegionalFingerprints(songs, motifs, metadata);
    const statistics = generateStatistics(songs, motifs, classification);

    // Save results
    console.log('\nSaving results...');

    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'motifs-all.json'),
        JSON.stringify(motifs, null, 2),
        'utf8'
    );
    console.log('  Saved: motifs-all.json');

    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'motifs-classification.json'),
        JSON.stringify(classification, null, 2),
        'utf8'
    );
    console.log('  Saved: motifs-classification.json');

    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'song-signatures.json'),
        JSON.stringify(songSignatures, null, 2),
        'utf8'
    );
    console.log('  Saved: song-signatures.json');

    if (regionalFingerprints) {
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'regional-fingerprints.json'),
            JSON.stringify(regionalFingerprints, null, 2),
            'utf8'
        );
        console.log('  Saved: regional-fingerprints.json');
    }

    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'statistics.json'),
        JSON.stringify(statistics, null, 2),
        'utf8'
    );
    console.log('  Saved: statistics.json');

    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total songs analyzed: ${songs.length}`);
    console.log(`Total notes: ${statistics.collection.totalNotes.toLocaleString()}`);
    console.log(`\nMotif counts by type:`);
    Object.entries(statistics.motifs.byType).forEach(([type, data]) => {
        console.log(`  ${type}: ${data.uniquePatterns} unique patterns`);
    });
    console.log(`\nPattern frequency distribution:`);
    console.log(`  Universal (30+ songs): ${classification.universal.length}`);
    console.log(`  Common (10-29 songs): ${classification.common.length}`);
    console.log(`  Regional (3-9 songs): ${classification.regional.length}`);
    console.log(`  Signature (1-2 songs): ${classification.signature.length}`);

    if (regionalFingerprints) {
        console.log(`\nRegional fingerprints: ${Object.keys(regionalFingerprints).length} regions`);
    }

    console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

// Run if called directly
if (require.main === module) {
    recognizePatterns();
}

module.exports = { recognizePatterns };
