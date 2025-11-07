const fs = require('fs');
const path = require('path');
const { parseNotes } = require('./parsers/note-parser');

const BASE_DIR = path.join(__dirname, 'data/musicxml');
const CATEGORIES = {
    // Song categories
    'vietnamese-skeletal': { name: 'Vietnamese Skeletal', color: '#27AE60', badge: 'VN-S', type: 'song' },
    'vietnamese-dantranh': { name: 'Vietnamese Dan Tranh', color: '#3498DB', badge: 'VN-DT', type: 'song' },
    'nonvietnamese-skeletal': { name: 'Non-Vietnamese Skeletal', color: '#E67E22', badge: 'NV-S', type: 'song' },
    'nonvietnamese-dantranh': { name: 'Non-Vietnamese Dan Tranh', color: '#9B59B6', badge: 'NV-DT', type: 'song' },
    // Exercise/Pattern categories
    'exercises-skeletal': { name: 'Exercises/Patterns Skeletal', color: '#E74C3C', badge: 'EX-S', type: 'exercise' },
    'exercises-dantranh': { name: 'Exercises/Patterns Dan Tranh', color: '#F39C12', badge: 'EX-DT', type: 'exercise' }
};

/**
 * Load and analyze all songs and exercises from all category folders
 */
function loadEnhancedLibrary() {
    const library = {
        songs: [],
        exercises: [],
        byCategory: {},
        relationships: [],
        metrics: {
            totalSongs: 0,
            totalExercises: 0,
            byCategory: {}
        }
    };

    // Initialize category metrics
    Object.keys(CATEGORIES).forEach(cat => {
        library.byCategory[cat] = [];
        library.metrics.byCategory[cat] = {
            count: 0,
            totalNotes: 0,
            totalGraceNotes: 0,
            totalBentNotes: 0,
            avgNotesPerSong: 0
        };
    });

    // Scan each category folder
    Object.keys(CATEGORIES).forEach(categoryKey => {
        const folderPath = path.join(BASE_DIR, categoryKey);

        if (!fs.existsSync(folderPath)) {
            console.log(`Warning: Category folder not found: ${categoryKey}`);
            return;
        }

        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.xml'));

        files.forEach(filename => {
            try {
                const filePath = path.join(folderPath, filename);
                const xmlContent = fs.readFileSync(filePath, 'utf8');
                const notes = parseNotes(xmlContent);

                // Calculate metrics
                const mainNotes = notes.filter(n => !n.isGrace);
                const graceNotes = notes.filter(n => n.isGrace);
                const bentNotes = notes.filter(n => n.isBent);

                const itemData = {
                    filename: filename,
                    baseName: getBaseName(filename),
                    category: categoryKey,
                    categoryLabel: CATEGORIES[categoryKey].name,
                    categoryBadge: CATEGORIES[categoryKey].badge,
                    categoryColor: CATEGORIES[categoryKey].color,
                    type: CATEGORIES[categoryKey].type,
                    path: `${categoryKey}/${filename}`,
                    metrics: {
                        totalNotes: notes.length,
                        mainNotes: mainNotes.length,
                        graceNotes: graceNotes.length,
                        bentNotes: bentNotes.length,
                        uniquePitches: [...new Set(notes.map(n => n.pitch))].length
                    }
                };

                // Add to appropriate list
                if (CATEGORIES[categoryKey].type === 'song') {
                    library.songs.push(itemData);
                } else {
                    library.exercises.push(itemData);
                }

                library.byCategory[categoryKey].push(itemData);

                // Update metrics
                if (CATEGORIES[categoryKey].type === 'song') {
                    library.metrics.totalSongs++;
                } else {
                    library.metrics.totalExercises++;
                }

                // Update category metrics
                const catMetrics = library.metrics.byCategory[categoryKey];
                catMetrics.count++;
                catMetrics.totalNotes += notes.length;
                catMetrics.totalGraceNotes += graceNotes.length;
                catMetrics.totalBentNotes += bentNotes.length;

            } catch (error) {
                console.error(`Error processing ${filename}:`, error.message);
            }
        });
    });

    // Calculate averages
    Object.keys(library.metrics.byCategory).forEach(cat => {
        const metrics = library.metrics.byCategory[cat];
        if (metrics.count > 0) {
            metrics.avgNotesPerSong = Math.round(metrics.totalNotes / metrics.count);
        }
    });

    // Find relationships
    library.relationships = findRelationships(library.byCategory);

    return library;
}

/**
 * Extract base name from filename (remove "Tranh" and extensions)
 */
function getBaseName(filename) {
    let base = filename.replace('.musicxml.xml', '').replace('.xml', '');
    base = base.replace(/\s+Tranh$/i, '').trim();
    return base;
}

/**
 * Find relationships between skeletal and Dan Tranh versions
 */
function findRelationships(byCategory) {
    const relationships = [];

    // Vietnamese relationships
    const vnSkeletal = byCategory['vietnamese-skeletal'] || [];
    const vnDanTranh = byCategory['vietnamese-dantranh'] || [];

    vnSkeletal.forEach(skeletal => {
        vnDanTranh.forEach(interpreted => {
            if (skeletal.baseName.toLowerCase() === interpreted.baseName.toLowerCase()) {
                relationships.push({
                    baseName: skeletal.baseName,
                    skeletal: skeletal,
                    interpreted: interpreted,
                    type: 'song',
                    language: 'vietnamese'
                });
            }
        });
    });

    // Non-Vietnamese relationships
    const nonVnSkeletal = byCategory['nonvietnamese-skeletal'] || [];
    const nonVnDanTranh = byCategory['nonvietnamese-dantranh'] || [];

    nonVnSkeletal.forEach(skeletal => {
        nonVnDanTranh.forEach(interpreted => {
            if (skeletal.baseName.toLowerCase() === interpreted.baseName.toLowerCase()) {
                relationships.push({
                    baseName: skeletal.baseName,
                    skeletal: skeletal,
                    interpreted: interpreted,
                    type: 'song',
                    language: 'nonvietnamese'
                });
            }
        });
    });

    // Exercise relationships
    const exercisesSkeletal = byCategory['exercises-skeletal'] || [];
    const exercisesDanTranh = byCategory['exercises-dantranh'] || [];

    exercisesSkeletal.forEach(skeletal => {
        exercisesDanTranh.forEach(interpreted => {
            if (skeletal.baseName.toLowerCase() === interpreted.baseName.toLowerCase()) {
                relationships.push({
                    baseName: skeletal.baseName,
                    skeletal: skeletal,
                    interpreted: interpreted,
                    type: 'exercise',
                    language: 'n/a'
                });
            }
        });
    });

    return relationships;
}

/**
 * Aggregate metrics for selected categories
 * @param {Array<string>} categoryKeys - Categories to aggregate
 * @param {Object} library - Full library data
 */
function aggregateMetrics(categoryKeys, library) {
    const aggregated = {
        categories: categoryKeys,
        totalSongs: 0,
        totalExercises: 0,
        totalNotes: 0,
        totalGraceNotes: 0,
        totalBentNotes: 0,
        avgNotesPerSong: 0,
        items: []
    };

    categoryKeys.forEach(cat => {
        if (library.byCategory[cat]) {
            aggregated.items.push(...library.byCategory[cat]);

            const metrics = library.metrics.byCategory[cat];
            if (CATEGORIES[cat].type === 'song') {
                aggregated.totalSongs += metrics.count;
            } else {
                aggregated.totalExercises += metrics.count;
            }
            aggregated.totalNotes += metrics.totalNotes;
            aggregated.totalGraceNotes += metrics.totalGraceNotes;
            aggregated.totalBentNotes += metrics.totalBentNotes;
        }
    });

    const totalItems = aggregated.totalSongs + aggregated.totalExercises;
    if (totalItems > 0) {
        aggregated.avgNotesPerSong = Math.round(aggregated.totalNotes / totalItems);
    }

    return aggregated;
}

// Export functions
module.exports = {
    loadEnhancedLibrary,
    aggregateMetrics,
    CATEGORIES
};

// CLI usage
if (require.main === module) {
    console.log('=== LOADING ENHANCED LIBRARY V2 ===\n');

    const library = loadEnhancedLibrary();

    console.log('\n=== LIBRARY SUMMARY ===');
    console.log(`Total songs: ${library.metrics.totalSongs}`);
    console.log(`Total exercises: ${library.metrics.totalExercises}`);
    console.log(`Total relationships: ${library.relationships.length}`);
    console.log(`  Song pairs: ${library.relationships.filter(r => r.type === 'song').length}`);
    console.log(`  Exercise pairs: ${library.relationships.filter(r => r.type === 'exercise').length}\n`);

    console.log('By Category:');
    Object.keys(CATEGORIES).forEach(cat => {
        const metrics = library.metrics.byCategory[cat];
        console.log(`  ${CATEGORIES[cat].name}:`);
        console.log(`    Items: ${metrics.count}`);
        console.log(`    Avg notes/item: ${metrics.avgNotesPerSong}`);
        console.log(`    Total notes: ${metrics.totalNotes}`);
    });

    // Save to JSON
    const outputPath = path.join(__dirname, 'data/library/enhanced-library.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(library, null, 2));

    console.log(`\n✅ Enhanced library saved to: data/library/enhanced-library.json`);

    // Example: All songs (exclude exercises)
    console.log('\n=== EXAMPLE: All Songs Only ===');
    const allSongs = aggregateMetrics([
        'vietnamese-skeletal', 'vietnamese-dantranh',
        'nonvietnamese-skeletal', 'nonvietnamese-dantranh'
    ], library);
    console.log(`Total songs: ${allSongs.totalSongs}`);
    console.log(`Avg notes/song: ${allSongs.avgNotesPerSong}`);

    // Example: All exercises
    console.log('\n=== EXAMPLE: All Exercises Only ===');
    const allExercises = aggregateMetrics(['exercises-skeletal', 'exercises-dantranh'], library);
    console.log(`Total exercises: ${allExercises.totalExercises}`);
    console.log(`Avg notes/exercise: ${allExercises.avgNotesPerSong}`);

    // Example: All Dan Tranh interpretations (songs + exercises)
    console.log('\n=== EXAMPLE: All Dan Tranh Interpretations ===');
    const allDanTranh = aggregateMetrics([
        'vietnamese-dantranh', 'nonvietnamese-dantranh', 'exercises-dantranh'
    ], library);
    console.log(`Total items: ${allDanTranh.totalSongs + allDanTranh.totalExercises}`);
    console.log(`  Songs: ${allDanTranh.totalSongs}`);
    console.log(`  Exercises: ${allDanTranh.totalExercises}`);
    console.log(`Avg notes/item: ${allDanTranh.avgNotesPerSong}`);
}
