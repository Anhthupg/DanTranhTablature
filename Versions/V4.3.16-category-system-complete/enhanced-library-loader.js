const fs = require('fs');
const path = require('path');
const { parseNotes } = require('./parsers/note-parser');

const BASE_DIR = path.join(__dirname, 'data/musicxml');
const CATEGORIES = {
    'vietnamese-skeletal': { name: 'Vietnamese Skeletal', color: '#27AE60', badge: 'VN-S' },
    'vietnamese-dantranh': { name: 'Vietnamese Dan Tranh', color: '#3498DB', badge: 'VN-DT' },
    'nonvietnamese-skeletal': { name: 'Non-Vietnamese Skeletal', color: '#E67E22', badge: 'NV-S' },
    'nonvietnamese-dantranh': { name: 'Non-Vietnamese Dan Tranh', color: '#9B59B6', badge: 'NV-DT' }
};

/**
 * Load and analyze all songs from all category folders
 */
function loadEnhancedLibrary() {
    const library = {
        songs: [],
        byCategory: {},
        relationships: [],
        metrics: {
            total: 0,
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

                const songData = {
                    filename: filename,
                    baseName: getBaseName(filename),
                    category: categoryKey,
                    categoryLabel: CATEGORIES[categoryKey].name,
                    categoryBadge: CATEGORIES[categoryKey].badge,
                    categoryColor: CATEGORIES[categoryKey].color,
                    path: `${categoryKey}/${filename}`,
                    metrics: {
                        totalNotes: notes.length,
                        mainNotes: mainNotes.length,
                        graceNotes: graceNotes.length,
                        bentNotes: bentNotes.length,
                        uniquePitches: [...new Set(notes.map(n => n.pitch))].length
                    }
                };

                library.songs.push(songData);
                library.byCategory[categoryKey].push(songData);
                library.metrics.total++;

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
                    language: 'nonvietnamese'
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
        totalNotes: 0,
        totalGraceNotes: 0,
        totalBentNotes: 0,
        avgNotesPerSong: 0,
        songs: []
    };

    categoryKeys.forEach(cat => {
        if (library.byCategory[cat]) {
            aggregated.songs.push(...library.byCategory[cat]);
            aggregated.totalSongs += library.metrics.byCategory[cat].count;
            aggregated.totalNotes += library.metrics.byCategory[cat].totalNotes;
            aggregated.totalGraceNotes += library.metrics.byCategory[cat].totalGraceNotes;
            aggregated.totalBentNotes += library.metrics.byCategory[cat].totalBentNotes;
        }
    });

    if (aggregated.totalSongs > 0) {
        aggregated.avgNotesPerSong = Math.round(aggregated.totalNotes / aggregated.totalSongs);
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
    console.log('=== LOADING ENHANCED LIBRARY ===\n');

    const library = loadEnhancedLibrary();

    console.log('\n=== LIBRARY SUMMARY ===');
    console.log(`Total songs: ${library.metrics.total}`);
    console.log(`Relationships found: ${library.relationships.length}\n`);

    console.log('By Category:');
    Object.keys(CATEGORIES).forEach(cat => {
        const metrics = library.metrics.byCategory[cat];
        console.log(`  ${CATEGORIES[cat].name}:`);
        console.log(`    Songs: ${metrics.count}`);
        console.log(`    Avg notes/song: ${metrics.avgNotesPerSong}`);
        console.log(`    Total notes: ${metrics.totalNotes}`);
    });

    // Save to JSON
    const outputPath = path.join(__dirname, 'data/library/enhanced-library.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(library, null, 2));

    console.log(`\n✅ Enhanced library saved to: data/library/enhanced-library.json`);

    // Example: Aggregate Vietnamese songs (both skeletal and Dan Tranh)
    console.log('\n=== EXAMPLE: Vietnamese Songs (All) ===');
    const vnAll = aggregateMetrics(['vietnamese-skeletal', 'vietnamese-dantranh'], library);
    console.log(`Total Vietnamese songs: ${vnAll.totalSongs}`);
    console.log(`Total notes: ${vnAll.totalNotes}`);
    console.log(`Avg notes/song: ${vnAll.avgNotesPerSong}`);

    // Example: Only Dan Tranh interpretations
    console.log('\n=== EXAMPLE: Dan Tranh Interpretations (All) ===');
    const dtAll = aggregateMetrics(['vietnamese-dantranh', 'nonvietnamese-dantranh'], library);
    console.log(`Total Dan Tranh interpretations: ${dtAll.totalSongs}`);
    console.log(`Total notes: ${dtAll.totalNotes}`);
    console.log(`Avg notes/song: ${dtAll.avgNotesPerSong}`);
}
