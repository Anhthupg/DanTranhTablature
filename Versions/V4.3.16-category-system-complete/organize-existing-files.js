const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, 'data/musicxml');

/**
 * Move existing MusicXML files from root to appropriate category folders
 */
function organizeExistingFiles() {
    console.log('=== ORGANIZING EXISTING MUSICXML FILES ===\n');

    // Get all .xml files in the root musicxml directory (not in subfolders)
    const files = fs.readdirSync(BASE_DIR).filter(f => {
        const fullPath = path.join(BASE_DIR, f);
        return f.endsWith('.xml') && fs.statSync(fullPath).isFile();
    });

    console.log(`Found ${files.length} files in root directory\n`);

    const movements = {
        'vietnamese-skeletal': [],
        'vietnamese-dantranh': [],
        'nonvietnamese-skeletal': [],
        'nonvietnamese-dantranh': [],
        'exercises-skeletal': [],
        'exercises-dantranh': []
    };

    const skipped = [];

    files.forEach(filename => {
        const hasTranh = /\s+Tranh\s*\.xml$/i.test(filename);

        // Categorize based on filename
        // For now, we'll assume all are Vietnamese skeletal unless they have "Tranh" in name
        // You can manually review and move non-Vietnamese ones later

        if (hasTranh) {
            // Has "Tranh" -> Dan Tranh interpretation
            movements['vietnamese-dantranh'].push(filename);
        } else {
            // No "Tranh" -> Skeletal version
            movements['vietnamese-skeletal'].push(filename);
        }
    });

    // Show categorization plan
    console.log('=== CATEGORIZATION PLAN ===\n');

    Object.keys(movements).forEach(category => {
        if (movements[category].length > 0) {
            console.log(`${category}: ${movements[category].length} files`);
            movements[category].slice(0, 3).forEach(f => console.log(`  - ${f}`));
            if (movements[category].length > 3) {
                console.log(`  ... and ${movements[category].length - 3} more`);
            }
            console.log();
        }
    });

    // Ask for confirmation
    console.log('=== CONFIRMATION REQUIRED ===');
    console.log('This will move files from root to category folders.');
    console.log('Files with "Tranh" -> vietnamese-dantranh/');
    console.log('Files without "Tranh" -> vietnamese-skeletal/');
    console.log('\nTo proceed, run: node organize-existing-files.js --confirm');
    console.log('To see detailed plan: node organize-existing-files.js --plan\n');

    return { movements, skipped };
}

/**
 * Execute the file movements
 */
function executeMovements(movements) {
    console.log('\n=== EXECUTING FILE MOVEMENTS ===\n');

    let totalMoved = 0;
    const errors = [];

    Object.keys(movements).forEach(category => {
        const categoryPath = path.join(BASE_DIR, category);

        // Ensure category folder exists
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
        }

        movements[category].forEach(filename => {
            try {
                const sourcePath = path.join(BASE_DIR, filename);
                const targetPath = path.join(categoryPath, filename);

                // Move file
                fs.renameSync(sourcePath, targetPath);
                totalMoved++;

                if (totalMoved <= 5) {
                    console.log(`✓ Moved: ${filename} → ${category}/`);
                }
            } catch (error) {
                errors.push({ filename, category, error: error.message });
                console.error(`✗ Error moving ${filename}:`, error.message);
            }
        });

        if (movements[category].length > 5) {
            console.log(`  ... moved ${movements[category].length - 5} more to ${category}/`);
        }
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total files moved: ${totalMoved}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(e => console.log(`  ${e.filename}: ${e.error}`));
    }

    return { totalMoved, errors };
}

/**
 * Show detailed plan
 */
function showDetailedPlan(movements) {
    console.log('\n=== DETAILED MOVEMENT PLAN ===\n');

    Object.keys(movements).forEach(category => {
        if (movements[category].length > 0) {
            console.log(`\n${category} (${movements[category].length} files):`);
            console.log('─'.repeat(60));
            movements[category].forEach(f => console.log(`  ${f}`));
        }
    });

    console.log('\n=== END OF PLAN ===\n');
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--confirm')) {
    // Execute the movements
    const { movements } = organizeExistingFiles();
    console.log('\n⚠️  PROCEEDING WITH FILE MOVEMENTS...\n');
    executeMovements(movements);

    // Run categorization scan after moving
    console.log('\n=== RUNNING CATEGORIZATION SCAN ===\n');
    require('./categorize-and-link-songs-v2.js');

} else if (args.includes('--plan')) {
    // Show detailed plan
    const { movements } = organizeExistingFiles();
    showDetailedPlan(movements);

} else {
    // Show summary only
    organizeExistingFiles();
}
