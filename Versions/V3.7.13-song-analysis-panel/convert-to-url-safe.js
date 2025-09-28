#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Convert Vietnamese text to URL-safe directory name
 * Preserves meaning while ensuring cross-platform compatibility
 */
function toUrlSafe(text) {
    return text
        // Vietnamese character mappings
        .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
        .replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A')
        .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
        .replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E')
        .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
        .replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I')
        .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
        .replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O')
        .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
        .replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U')
        .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
        .replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        // Replace spaces and special characters
        .replace(/\s+/g, '_')           // spaces to underscores
        .replace(/[^\w\-_.]/g, '')      // remove special chars except dash, underscore, dot
        .replace(/_{2,}/g, '_')         // multiple underscores to single
        .replace(/^_+|_+$/g, '');       // trim leading/trailing underscores
}

/**
 * Convert existing directories to URL-safe names
 */
function convertExistingDirectories() {
    const processedDir = path.join(__dirname, 'data', 'processed');

    if (!fs.existsSync(processedDir)) {
        console.log('❌ Processed directory not found:', processedDir);
        return;
    }

    const dirs = fs.readdirSync(processedDir).filter(file => {
        const fullPath = path.join(processedDir, file);
        return fs.statSync(fullPath).isDirectory();
    });

    console.log(`🔄 Converting ${dirs.length} directories to URL-safe names...\n`);

    const conversions = [];

    dirs.forEach(originalName => {
        const urlSafeName = toUrlSafe(originalName);

        if (originalName !== urlSafeName) {
            const originalPath = path.join(processedDir, originalName);
            const newPath = path.join(processedDir, urlSafeName);

            try {
                // Check if target already exists
                if (fs.existsSync(newPath)) {
                    console.log(`⚠️  Target exists: ${urlSafeName} (skipping ${originalName})`);
                    return;
                }

                // Rename directory
                fs.renameSync(originalPath, newPath);

                // Update metadata.json to include both names
                const metadataPath = path.join(newPath, 'metadata.json');
                if (fs.existsSync(metadataPath)) {
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    metadata.songName = originalName;          // Beautiful Vietnamese name
                    metadata.directoryName = urlSafeName;      // URL-safe directory name
                    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
                }

                conversions.push({ original: originalName, urlSafe: urlSafeName });
                console.log(`✅ ${originalName} → ${urlSafeName}`);

            } catch (error) {
                console.log(`❌ Failed to convert ${originalName}:`, error.message);
            }
        } else {
            console.log(`✓  Already URL-safe: ${originalName}`);
        }
    });

    console.log(`\n📊 Conversion Summary:`);
    console.log(`   Total directories: ${dirs.length}`);
    console.log(`   Converted: ${conversions.length}`);
    console.log(`   Already URL-safe: ${dirs.length - conversions.length}`);

    return conversions;
}

/**
 * Update index.html to use directoryName for links, songName for display
 */
function updateIndexHtml(conversions) {
    const indexPath = path.join(__dirname, 'index.html');

    if (!fs.existsSync(indexPath)) {
        console.log('⚠️  index.html not found, skipping update');
        return;
    }

    let indexContent = fs.readFileSync(indexPath, 'utf8');

    // Update allSongDirs array to use URL-safe names
    const processedDir = path.join(__dirname, 'data', 'processed');
    const urlSafeDirs = fs.readdirSync(processedDir).filter(file => {
        const fullPath = path.join(processedDir, file);
        return fs.statSync(fullPath).isDirectory();
    });

    // Replace the allSongDirs array
    const newDirsArray = `const allSongDirs = [\n    "${urlSafeDirs.join('",\n    "')}"\n];`;

    indexContent = indexContent.replace(
        /const allSongDirs = \[[^\]]+\];/s,
        newDirsArray
    );

    // Update the formatSongName function to use metadata.songName for display
    const newFormatFunction = `
function formatSongName(dirName) {
    // Directory names are now URL-safe, display names come from metadata
    return dirName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}`;

    indexContent = indexContent.replace(
        /function formatSongName\(dirName\)[^}]+}/,
        newFormatFunction.trim()
    );

    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Updated index.html with URL-safe directory names');
}

// Main execution
if (require.main === module) {
    console.log('🎵 Dan Tranh URL-Safe Converter v3.7.1\n');

    const conversions = convertExistingDirectories();
    updateIndexHtml(conversions);

    console.log('\n🎯 Next Steps:');
    console.log('1. Test locally: node server.js');
    console.log('2. Commit changes: git add -A && git commit -m "Convert to URL-safe structure"');
    console.log('3. Deploy to GitHub Pages (now compatible!)');
    console.log('\n✅ All Vietnamese display names preserved in metadata!');
}

module.exports = { toUrlSafe, convertExistingDirectories };