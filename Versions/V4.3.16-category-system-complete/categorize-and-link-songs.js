const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, 'data/musicxml');

const CATEGORIES = {
    'vietnamese-skeletal': 'Vietnamese Skeletal',
    'vietnamese-dantranh': 'Vietnamese Dan Tranh',
    'nonvietnamese-skeletal': 'Non-Vietnamese Skeletal',
    'nonvietnamese-dantranh': 'Non-Vietnamese Dan Tranh'
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

        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.xml'));

        results.categories[categoryKey] = {
            name: CATEGORIES[categoryKey],
            files: files,
            count: files.length
        };

        results.summary.byCategory[categoryKey] = files.length;
        results.summary.totalSongs += files.length;

        console.log(`${CATEGORIES[categoryKey]}: ${files.length} files`);
    });

    return results;
}

/**
 * Extract base name from filename (remove "Tranh" and extensions)
 */
function getBaseName(filename) {
    // Remove extensions
    let base = filename.replace('.musicxml.xml', '').replace('.xml', '');

    // Remove "Tranh" suffix if present (case insensitive)
    base = base.replace(/\s+Tranh$/i, '').trim();

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

        // Look for matching Dan Tranh interpretation
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
                    language: 'nonvietnamese'
                });

                processed.add(skeletalFile);
                processed.add(dantaFile);
            }
        });
    });

    // Find standalone songs (no matching pair)
    const standalone = [];
    Object.keys(categoryData).forEach(category => {
        categoryData[category].files.forEach(file => {
            if (!processed.has(file)) {
                standalone.push({
                    file: file,
                    category: category,
                    baseName: getBaseName(file)
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

    console.log(`Found ${relationships.length} skeletal-interpretation pairs`);
    console.log(`Found ${standalone.length} standalone songs\n`);

    // Show relationships
    if (relationships.length > 0) {
        console.log('Song Pairs:');
        relationships.slice(0, 5).forEach(rel => {
            console.log(`  "${rel.baseName}":`);
            console.log(`    Skeletal: ${rel.skeletal.file}`);
            console.log(`    Dan Tranh: ${rel.interpreted.file}`);
        });
        if (relationships.length > 5) {
            console.log(`  ... and ${relationships.length - 5} more pairs`);
        }
    }

    // Show standalone
    if (standalone.length > 0) {
        console.log('\nStandalone Songs (no matching pair):');
        standalone.slice(0, 10).forEach(song => {
            console.log(`  ${song.file} [${song.category}]`);
        });
        if (standalone.length > 10) {
            console.log(`  ... and ${standalone.length - 10} more`);
        }
    }

    // Create final metadata structure
    const metadata = {
        version: '1.0',
        generated: new Date().toISOString(),
        categories: categoryData.categories,
        relationships: relationships,
        standalone: standalone,
        summary: {
            ...categoryData.summary,
            pairedSongs: relationships.length * 2,
            standaloneSongs: standalone.length,
            totalPairs: relationships.length
        }
    };

    // Save metadata
    const outputPath = path.join(__dirname, 'data/song-categories.json');
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

    console.log(`\n✅ Metadata saved to: data/song-categories.json`);
    console.log('\n=== SUMMARY ===');
    console.log(`Total songs: ${metadata.summary.totalSongs}`);
    console.log(`Paired songs: ${metadata.summary.pairedSongs} (${metadata.summary.totalPairs} pairs)`);
    console.log(`Standalone: ${metadata.summary.standaloneSongs}`);
    console.log('\nBy category:');
    Object.keys(CATEGORIES).forEach(key => {
        console.log(`  ${CATEGORIES[key]}: ${metadata.summary.byCategory[key]}`);
    });

    return metadata;
}

// Run the scan
generateMetadata();
