const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, 'data/musicxml');

const CATEGORIES = {
    // Song categories
    'vietnamese-skeletal': 'Vietnamese Skeletal',
    'vietnamese-dantranh': 'Vietnamese Dan Tranh',
    'nonvietnamese-skeletal': 'Non-Vietnamese Skeletal',
    'nonvietnamese-dantranh': 'Non-Vietnamese Dan Tranh',
    // Exercise/Pattern categories
    'exercises-skeletal': 'Exercises/Patterns Skeletal',
    'exercises-dantranh': 'Exercises/Patterns Dan Tranh'
};

/**
 * Scan all category folders and build comprehensive metadata
 */
function scanCategories() {
    const results = {
        categories: {},
        relationships: [],
        summary: {
            totalSongs: 0,
            totalExercises: 0,
            byCategory: {}
        }
    };

    // Scan each category folder
    Object.keys(CATEGORIES).forEach(categoryKey => {
        const folderPath = path.join(BASE_DIR, categoryKey);

        if (!fs.existsSync(folderPath)) {
            console.log(`Creating folder: ${categoryKey}`);
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.xml') || f.endsWith('.musicxml'));

        results.categories[categoryKey] = {
            name: CATEGORIES[categoryKey],
            files: files,
            count: files.length
        };

        results.summary.byCategory[categoryKey] = files.length;

        // Count separately for songs vs exercises
        if (categoryKey.startsWith('exercises')) {
            results.summary.totalExercises += files.length;
        } else {
            results.summary.totalSongs += files.length;
        }

        console.log(`${CATEGORIES[categoryKey]}: ${files.length} files`);
    });

    return results;
}

/**
 * Extract base name from filename (remove "Tranh", "Melody" and extensions)
 */
function getBaseName(filename) {
    // Remove extensions (handle both .musicxml.xml and .musicxml)
    let base = filename
        .replace('.musicxml.xml', '')
        .replace('.musicxml', '')
        .replace('.xml', '');

    // Remove "Tranh", "Melody", or "_dan-tranh" suffix if present (case insensitive)
    base = base.replace(/[\s_]+Tranh$/i, '')
               .replace(/[\s_]+Melody$/i, '')
               .replace(/[\s_]+dan-tranh$/i, '')
               .trim();

    // Remove common separators and normalize
    base = base.replace(/_/g, ' ').trim();

    return base;
}

/**
 * Find relationships between skeletal and Dan Tranh interpretations
 */
function findRelationships(categoryData) {
    const relationships = [];
    const processed = new Set();

    // Compare Vietnamese skeletal with Vietnamese Dan Tranh
    const vnSkeletal = categoryData['vietnamese-skeletal'].files;
    const vnDanTranh = categoryData['vietnamese-dantranh'].files;

    vnSkeletal.forEach(skeletalFile => {
        const baseName = getBaseName(skeletalFile);

        vnDanTranh.forEach(dantaFile => {
            const dantaBase = getBaseName(dantaFile);

            if (baseName.toLowerCase() === dantaBase.toLowerCase()) {
                relationships.push({
                    baseName: baseName,
                    skeletal: {
                        file: skeletalFile,
                        category: 'vietnamese-skeletal'
                    },
                    interpreted: {
                        file: dantaFile,
                        category: 'vietnamese-dantranh'
                    },
                    type: 'song',
                    language: 'vietnamese'
                });

                processed.add(skeletalFile);
                processed.add(dantaFile);
            }
        });
    });

    // Compare Non-Vietnamese skeletal with Non-Vietnamese Dan Tranh
    const nonVnSkeletal = categoryData['nonvietnamese-skeletal'].files;
    const nonVnDanTranh = categoryData['nonvietnamese-dantranh'].files;

    nonVnSkeletal.forEach(skeletalFile => {
        const baseName = getBaseName(skeletalFile);

        nonVnDanTranh.forEach(dantaFile => {
            const dantaBase = getBaseName(dantaFile);

            if (baseName.toLowerCase() === dantaBase.toLowerCase()) {
                relationships.push({
                    baseName: baseName,
                    skeletal: {
                        file: skeletalFile,
                        category: 'nonvietnamese-skeletal'
                    },
                    interpreted: {
                        file: dantaFile,
                        category: 'nonvietnamese-dantranh'
                    },
                    type: 'song',
                    language: 'nonvietnamese'
                });

                processed.add(skeletalFile);
                processed.add(dantaFile);
            }
        });
    });

    // Compare Exercises skeletal with Exercises Dan Tranh
    const exercisesSkeletal = categoryData['exercises-skeletal'].files;
    const exercisesDanTranh = categoryData['exercises-dantranh'].files;

    exercisesSkeletal.forEach(skeletalFile => {
        const baseName = getBaseName(skeletalFile);

        exercisesDanTranh.forEach(dantaFile => {
            const dantaBase = getBaseName(dantaFile);

            if (baseName.toLowerCase() === dantaBase.toLowerCase()) {
                relationships.push({
                    baseName: baseName,
                    skeletal: {
                        file: skeletalFile,
                        category: 'exercises-skeletal'
                    },
                    interpreted: {
                        file: dantaFile,
                        category: 'exercises-dantranh'
                    },
                    type: 'exercise',
                    language: 'n/a'
                });

                processed.add(skeletalFile);
                processed.add(dantaFile);
            }
        });
    });

    // Find standalone items (no matching pair)
    const standalone = [];
    Object.keys(categoryData).forEach(category => {
        categoryData[category].files.forEach(file => {
            if (!processed.has(file)) {
                standalone.push({
                    file: file,
                    category: category,
                    baseName: getBaseName(file),
                    type: category.startsWith('exercises') ? 'exercise' : 'song'
                });
            }
        });
    });

    return { relationships, standalone };
}

/**
 * Generate comprehensive metadata file
 */
function generateMetadata() {
    console.log('\n=== SCANNING CATEGORY FOLDERS ===\n');

    const categoryData = scanCategories();

    console.log('\n=== FINDING RELATIONSHIPS ===\n');

    const { relationships, standalone } = findRelationships(categoryData.categories);

    const songRelationships = relationships.filter(r => r.type === 'song');
    const exerciseRelationships = relationships.filter(r => r.type === 'exercise');

    console.log(`Found ${songRelationships.length} song pairs`);
    console.log(`Found ${exerciseRelationships.length} exercise pairs`);
    console.log(`Found ${standalone.length} standalone items\n`);

    // Show song relationships
    if (songRelationships.length > 0) {
        console.log('Song Pairs:');
        songRelationships.slice(0, 5).forEach(rel => {
            console.log(`  "${rel.baseName}":`);
            console.log(`    Skeletal: ${rel.skeletal.file}`);
            console.log(`    Dan Tranh: ${rel.interpreted.file}`);
        });
        if (songRelationships.length > 5) {
            console.log(`  ... and ${songRelationships.length - 5} more song pairs`);
        }
    }

    // Show exercise relationships
    if (exerciseRelationships.length > 0) {
        console.log('\nExercise/Pattern Pairs:');
        exerciseRelationships.slice(0, 5).forEach(rel => {
            console.log(`  "${rel.baseName}":`);
            console.log(`    Skeletal: ${rel.skeletal.file}`);
            console.log(`    Dan Tranh: ${rel.interpreted.file}`);
        });
        if (exerciseRelationships.length > 5) {
            console.log(`  ... and ${exerciseRelationships.length - 5} more exercise pairs`);
        }
    }

    // Show standalone
    if (standalone.length > 0) {
        const standaloneSongs = standalone.filter(s => s.type === 'song');
        const standaloneExercises = standalone.filter(s => s.type === 'exercise');

        if (standaloneSongs.length > 0) {
            console.log('\nStandalone Songs (no matching pair):');
            standaloneSongs.slice(0, 5).forEach(song => {
                console.log(`  ${song.file} [${song.category}]`);
            });
            if (standaloneSongs.length > 5) {
                console.log(`  ... and ${standaloneSongs.length - 5} more`);
            }
        }

        if (standaloneExercises.length > 0) {
            console.log('\nStandalone Exercises (no matching pair):');
            standaloneExercises.forEach(ex => {
                console.log(`  ${ex.file} [${ex.category}]`);
            });
        }
    }

    // Create final metadata structure
    const metadata = {
        version: '2.0',
        generated: new Date().toISOString(),
        categories: categoryData.categories,
        relationships: relationships,
        standalone: standalone,
        summary: {
            ...categoryData.summary,
            pairedSongs: songRelationships.length * 2,
            pairedExercises: exerciseRelationships.length * 2,
            standaloneSongs: standalone.filter(s => s.type === 'song').length,
            standaloneExercises: standalone.filter(s => s.type === 'exercise').length,
            totalPairs: relationships.length,
            songPairs: songRelationships.length,
            exercisePairs: exerciseRelationships.length
        }
    };

    // Save metadata
    const outputPath = path.join(__dirname, 'data/song-categories.json');
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

    console.log(`\n✅ Metadata saved to: data/song-categories.json`);
    console.log('\n=== SUMMARY ===');
    console.log(`Total songs: ${metadata.summary.totalSongs}`);
    console.log(`Total exercises: ${metadata.summary.totalExercises}`);
    console.log(`Song pairs: ${metadata.summary.songPairs}`);
    console.log(`Exercise pairs: ${metadata.summary.exercisePairs}`);
    console.log(`Standalone songs: ${metadata.summary.standaloneSongs}`);
    console.log(`Standalone exercises: ${metadata.summary.standaloneExercises}`);
    console.log('\nBy category:');
    Object.keys(CATEGORIES).forEach(key => {
        console.log(`  ${CATEGORIES[key]}: ${metadata.summary.byCategory[key]}`);
    });

    return metadata;
}

// Run the scan
generateMetadata();
