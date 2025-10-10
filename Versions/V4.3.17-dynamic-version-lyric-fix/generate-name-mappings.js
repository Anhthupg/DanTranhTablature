#!/usr/bin/env node

/**
 * Generate Song Name Mappings
 *
 * Creates canonical mapping file connecting:
 * - Backend IDs (lowercase-hyphen-no-tones)
 * - Display names (Title Case with tones)
 * - Original MusicXML filenames
 * - Current directory names
 */

const fs = require('fs');
const path = require('path');

// Vietnamese tone removal map
const toneMap = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd', 'Đ': 'd',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y'
};

function removeTones(str) {
    return str.split('').map(char => toneMap[char] || char).join('');
}

function toKebabCase(str) {
    return removeTones(str)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphen
        .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
}

function toTitleCase(str) {
    // Vietnamese-aware title case
    const lowercaseWords = ['và', 'của', 'cho', 'với', 'từ', 'trong',
                           'em', 'con', 'là', 'quan', 'họ', 'ru', 'hò', 'lý'];

    return str.split(/\s+/).map((word, index) => {
        // Always capitalize first word
        if (index === 0) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }

        // Keep lowercase words lowercase (unless first word)
        if (lowercaseWords.includes(word.toLowerCase())) {
            return word.toLowerCase();
        }

        // Capitalize other words
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

async function generateMappings() {
    console.log('🔍 Scanning for song data...\n');

    const mappings = {};
    const issues = [];

    // 1. Read metadata
    const metadataPath = path.join(__dirname, 'data/song-metadata-complete.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    // 2. Read MusicXML files
    const musicXMLDir = path.join(__dirname, 'data/musicxml');
    const musicXMLFiles = fs.readdirSync(musicXMLDir)
        .filter(f => f.endsWith('.musicxml.xml'));

    // 3. Read processed directories
    const processedDir = path.join(__dirname, 'data/processed');
    const processedDirs = fs.readdirSync(processedDir)
        .filter(f => {
            const stat = fs.statSync(path.join(processedDir, f));
            return stat.isDirectory();
        });

    console.log(`📊 Found:
    - ${metadata.songs.length} songs in metadata
    - ${musicXMLFiles.length} MusicXML files
    - ${processedDirs.length} processed directories\n`);

    // 4. Build mappings
    for (const song of metadata.songs) {
        const title = song.title;
        const backendId = toKebabCase(title);
        const displayName = toTitleCase(title);

        // Find matching MusicXML file
        const musicXMLMatch = musicXMLFiles.find(f => {
            const baseName = f.replace('.musicxml.xml', '');
            return removeTones(baseName.toLowerCase()) === removeTones(title.toLowerCase());
        });

        // Find matching processed directory
        const processedMatch = processedDirs.find(d => {
            return removeTones(d.toLowerCase().replace(/_/g, ' ')) ===
                   removeTones(title.toLowerCase());
        });

        mappings[backendId] = {
            displayName: displayName,
            fileName: backendId,
            originalTitle: title,  // From metadata
            musicXMLFile: musicXMLMatch || null,
            currentProcessedDir: processedMatch || null,
            region: song.region,
            performanceContext: song.performanceContext,
            alternateSpellings: [
                title,
                displayName,
                removeTones(title),
                removeTones(displayName)
            ].filter((v, i, a) => a.indexOf(v) === i)  // Unique only
        };

        // Track issues
        if (!musicXMLMatch) {
            issues.push({
                type: 'missing-musicxml',
                backendId,
                title
            });
        }

        if (!processedMatch) {
            issues.push({
                type: 'missing-processed',
                backendId,
                title
            });
        }
    }

    // 5. Add orphaned MusicXML files
    for (const xmlFile of musicXMLFiles) {
        const baseName = xmlFile.replace('.musicxml.xml', '');
        const backendId = toKebabCase(baseName);

        if (!mappings[backendId]) {
            console.log(`⚠️  Orphaned MusicXML file: ${xmlFile}`);
            mappings[backendId] = {
                displayName: toTitleCase(baseName),
                fileName: backendId,
                originalTitle: baseName,
                musicXMLFile: xmlFile,
                currentProcessedDir: null,
                region: 'missing',
                performanceContext: 'missing',
                alternateSpellings: [baseName],
                orphaned: true
            };
        }
    }

    // 6. Write output
    const outputPath = path.join(__dirname, 'data/song-name-mappings.json');
    const output = {
        metadata: {
            generatedDate: new Date().toISOString(),
            totalSongs: Object.keys(mappings).length,
            sourceMetadataSongs: metadata.songs.length,
            sourceMusicXMLFiles: musicXMLFiles.length,
            sourceProcessedDirs: processedDirs.length,
            issues: issues.length
        },
        namingConvention: {
            backend: "lowercase-hyphen-no-tones",
            frontend: "Title Case With Tones",
            example: {
                original: "Bà rằng bà rí",
                backendId: "ba-rang-ba-ri",
                displayName: "Bà Rằng Bà Rí",
                fileName: "ba-rang-ba-ri"
            }
        },
        songs: mappings,
        issues: issues
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    console.log(`✅ Generated mappings: ${outputPath}\n`);
    console.log(`📈 Statistics:
    - Total songs mapped: ${Object.keys(mappings).length}
    - Missing MusicXML: ${issues.filter(i => i.type === 'missing-musicxml').length}
    - Missing processed: ${issues.filter(i => i.type === 'missing-processed').length}\n`);

    // 7. Report issues
    if (issues.length > 0) {
        console.log('⚠️  Issues found:\n');
        const missingXML = issues.filter(i => i.type === 'missing-musicxml');
        const missingProcessed = issues.filter(i => i.type === 'missing-processed');

        if (missingXML.length > 0) {
            console.log(`Missing MusicXML files (${missingXML.length}):`);
            missingXML.slice(0, 10).forEach(i =>
                console.log(`  - ${i.title} (${i.backendId})`)
            );
            if (missingXML.length > 10) {
                console.log(`  ... and ${missingXML.length - 10} more`);
            }
            console.log();
        }

        if (missingProcessed.length > 0) {
            console.log(`Missing processed directories (${missingProcessed.length}):`);
            missingProcessed.slice(0, 10).forEach(i =>
                console.log(`  - ${i.title} (${i.backendId})`)
            );
            if (missingProcessed.length > 10) {
                console.log(`  ... and ${missingProcessed.length - 10} more`);
            }
            console.log();
        }
    }

    console.log('✨ Done! Next steps:');
    console.log('   1. Review: v4/data/song-name-mappings.json');
    console.log('   2. Fix issues in metadata if needed');
    console.log('   3. Run: node update-code-to-use-mappings.js');
    console.log('   4. Run: node rename-to-standard.js --dry-run');
}

// Run
generateMappings().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
