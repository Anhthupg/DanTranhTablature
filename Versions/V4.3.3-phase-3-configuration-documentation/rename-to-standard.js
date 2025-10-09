#!/usr/bin/env node

/**
 * Rename to Standard Naming Convention
 *
 * Safely renames all directories and files to the standardized format:
 * - Backend: lowercase-hyphen-no-tones
 * - Uses mappings from song-name-mappings.json
 *
 * Usage:
 *   node rename-to-standard.js --dry-run    (preview changes, no execution)
 *   node rename-to-standard.js --execute    (actually rename files)
 *   node rename-to-standard.js --rollback   (undo last rename operation)
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
const ROLLBACK = process.argv.includes('--rollback');

// Color output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
    console.log(colors[color] + msg + colors.reset);
}

function loadMappings() {
    const mappingPath = path.join(__dirname, 'data/song-name-mappings.json');
    if (!fs.existsSync(mappingPath)) {
        log('❌ Error: song-name-mappings.json not found!', 'red');
        log('   Run: node generate-name-mappings.js first', 'yellow');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
}

function createRenameLog(operations) {
    const logPath = path.join(__dirname, 'data/rename-log.json');
    const log = {
        timestamp: new Date().toISOString(),
        totalOperations: operations.length,
        operations: operations
    };
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf8');
    return logPath;
}

function loadRenameLog() {
    const logPath = path.join(__dirname, 'data/rename-log.json');
    if (!fs.existsSync(logPath)) {
        log('❌ No rename log found! Nothing to rollback.', 'red');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(logPath, 'utf8'));
}

async function rollbackRenames() {
    log('\n🔄 ROLLBACK MODE\n', 'yellow');

    const renameLog = loadRenameLog();
    log(`Found ${renameLog.totalOperations} operations from ${renameLog.timestamp}\n`, 'cyan');

    let success = 0;
    let failed = 0;

    // Reverse the operations
    for (const op of renameLog.operations.reverse()) {
        try {
            // Rollback: rename NEW back to OLD
            if (fs.existsSync(op.newPath)) {
                fs.renameSync(op.newPath, op.oldPath);
                log(`✅ Rolled back: ${op.newName} → ${op.oldName}`, 'green');
                success++;
            } else {
                log(`⚠️  Skipped (not found): ${op.newPath}`, 'yellow');
            }
        } catch (err) {
            log(`❌ Failed: ${op.newPath} → ${op.oldPath}`, 'red');
            log(`   Error: ${err.message}`, 'red');
            failed++;
        }
    }

    log(`\n📊 Rollback Summary:`, 'bright');
    log(`   Success: ${success}`, 'green');
    log(`   Failed: ${failed}`, 'red');
    log(`   Total: ${renameLog.totalOperations}`, 'cyan');
}

async function renameFiles() {
    const mappings = loadMappings();
    const operations = [];

    log('\n🔍 Scanning for files to rename...\n', 'cyan');

    // 1. Rename processed directories
    const processedDir = path.join(__dirname, 'data/processed');
    if (fs.existsSync(processedDir)) {
        const dirs = fs.readdirSync(processedDir)
            .filter(f => fs.statSync(path.join(processedDir, f)).isDirectory());

        log(`📁 Processed directories (${dirs.length} found):\n`, 'bright');

        for (const [backendId, data] of Object.entries(mappings.songs)) {
            if (data.currentProcessedDir && data.currentProcessedDir !== data.fileName) {
                const oldPath = path.join(processedDir, data.currentProcessedDir);
                const newPath = path.join(processedDir, data.fileName);

                if (fs.existsSync(oldPath)) {
                    operations.push({
                        type: 'directory',
                        location: 'processed',
                        oldPath,
                        newPath,
                        oldName: data.currentProcessedDir,
                        newName: data.fileName,
                        backendId
                    });

                    if (DRY_RUN) {
                        log(`   ${data.currentProcessedDir}`, 'red');
                        log(`   → ${data.fileName}`, 'green');
                        log(`   (${oldPath})`, 'cyan');
                        console.log();
                    }
                }
            }
        }
    }

    // 2. Rename figurative-enhanced files
    const figurativeDir = path.join(__dirname, 'data/figurative-enhanced');
    if (fs.existsSync(figurativeDir)) {
        const files = fs.readdirSync(figurativeDir).filter(f => f.endsWith('.json'));

        log(`📄 Figurative-enhanced files (${files.length} found):\n`, 'bright');

        for (const file of files) {
            const baseName = file.replace(/-v3\.json$/, '').replace(/\.json$/, '');

            // Find matching backend ID
            for (const [backendId, data] of Object.entries(mappings.songs)) {
                const matchesOriginal = data.alternateSpellings.some(s =>
                    s.toLowerCase().replace(/[^a-z0-9]/g, '') ===
                    baseName.toLowerCase().replace(/[^a-z0-9]/g, '')
                );

                if (matchesOriginal) {
                    const isV3 = file.endsWith('-v3.json');
                    const newFileName = isV3 ? `${data.fileName}-v3.json` : `${data.fileName}.json`;

                    if (file !== newFileName) {
                        const oldPath = path.join(figurativeDir, file);
                        const newPath = path.join(figurativeDir, newFileName);

                        operations.push({
                            type: 'file',
                            location: 'figurative-enhanced',
                            oldPath,
                            newPath,
                            oldName: file,
                            newName: newFileName,
                            backendId
                        });

                        if (DRY_RUN) {
                            log(`   ${file}`, 'red');
                            log(`   → ${newFileName}`, 'green');
                            console.log();
                        }
                    }
                    break;
                }
            }
        }
    }

    // 3. Rename other data directories
    const dataSubdirs = [
        'lyrics',
        'lyrics-segmentations',
        'patterns',
        'relationships',
        'cultural-prompts'
    ];

    for (const subdir of dataSubdirs) {
        const dirPath = path.join(__dirname, 'data', subdir);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') || f.endsWith('.txt'));

            if (files.length > 0) {
                log(`📄 ${subdir} files (${files.length} found):\n`, 'bright');

                for (const file of files) {
                    const baseName = file.replace(/-segmented\.json$/, '')
                                        .replace(/-patterns\.json$/, '')
                                        .replace(/-relationships\.json$/, '')
                                        .replace(/-prompt\.txt$/, '')
                                        .replace(/\.json$/, '')
                                        .replace(/\.txt$/, '');

                    // Find matching backend ID
                    for (const [backendId, data] of Object.entries(mappings.songs)) {
                        const matchesOriginal = data.alternateSpellings.some(s =>
                            s.toLowerCase().replace(/[^a-z0-9]/g, '') ===
                            baseName.toLowerCase().replace(/[^a-z0-9]/g, '')
                        );

                        if (matchesOriginal) {
                            // Reconstruct new filename with correct suffix
                            let newFileName = data.fileName;
                            if (file.includes('-segmented.json')) newFileName += '-segmented.json';
                            else if (file.includes('-patterns.json')) newFileName += '-patterns.json';
                            else if (file.includes('-relationships.json')) newFileName += '-relationships.json';
                            else if (file.includes('-prompt.txt')) newFileName += '-prompt.txt';
                            else if (file.endsWith('.json')) newFileName += '.json';
                            else if (file.endsWith('.txt')) newFileName += '.txt';

                            if (file !== newFileName) {
                                const oldPath = path.join(dirPath, file);
                                const newPath = path.join(dirPath, newFileName);

                                operations.push({
                                    type: 'file',
                                    location: subdir,
                                    oldPath,
                                    newPath,
                                    oldName: file,
                                    newName: newFileName,
                                    backendId
                                });

                                if (DRY_RUN && operations.length <= 200) {  // Limit output
                                    log(`   ${file}`, 'red');
                                    log(`   → ${newFileName}`, 'green');
                                    console.log();
                                }
                            }
                            break;
                        }
                    }
                }

                if (DRY_RUN && operations.length > 200) {
                    log(`   ... and ${operations.length - 200} more files`, 'yellow');
                    console.log();
                }
            }
        }
    }

    // Summary
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`📊 SUMMARY`, 'bright');
    log(`${'='.repeat(60)}`, 'cyan');

    const byType = {
        directory: operations.filter(o => o.type === 'directory').length,
        file: operations.filter(o => o.type === 'file').length
    };

    const byLocation = {};
    operations.forEach(o => {
        byLocation[o.location] = (byLocation[o.location] || 0) + 1;
    });

    log(`\nTotal operations: ${operations.length}`, 'bright');
    log(`  Directories: ${byType.directory}`, 'cyan');
    log(`  Files: ${byType.file}`, 'cyan');
    log(`\nBy location:`, 'bright');
    Object.entries(byLocation).forEach(([loc, count]) => {
        log(`  ${loc}: ${count}`, 'cyan');
    });

    if (DRY_RUN) {
        log(`\n⚠️  DRY RUN MODE - No files were actually renamed`, 'yellow');
        log(`\nTo execute these changes, run:`, 'bright');
        log(`   node rename-to-standard.js --execute`, 'green');
        log(`\nTo rollback after execution, run:`, 'bright');
        log(`   node rename-to-standard.js --rollback`, 'yellow');
    } else {
        // Execute renames
        log(`\n🚀 EXECUTING RENAMES...\n`, 'green');

        let success = 0;
        let failed = 0;

        for (const op of operations) {
            try {
                fs.renameSync(op.oldPath, op.newPath);
                log(`✅ ${op.oldName} → ${op.newName}`, 'green');
                success++;
            } catch (err) {
                log(`❌ Failed: ${op.oldName}`, 'red');
                log(`   Error: ${err.message}`, 'red');
                failed++;
            }
        }

        // Save log for rollback
        const logPath = createRenameLog(operations);

        log(`\n${'='.repeat(60)}`, 'cyan');
        log(`✨ EXECUTION COMPLETE`, 'bright');
        log(`${'='.repeat(60)}`, 'cyan');
        log(`\nSuccess: ${success}`, 'green');
        log(`Failed: ${failed}`, failed > 0 ? 'red' : 'cyan');
        log(`Total: ${operations.length}`, 'cyan');
        log(`\nRename log saved: ${logPath}`, 'yellow');
        log(`\nTo rollback these changes, run:`, 'bright');
        log(`   node rename-to-standard.js --rollback`, 'yellow');
    }
}

// Main execution
(async () => {
    try {
        if (ROLLBACK) {
            await rollbackRenames();
        } else {
            await renameFiles();
        }
    } catch (err) {
        log(`\n❌ Fatal error: ${err.message}`, 'red');
        console.error(err);
        process.exit(1);
    }
})();
