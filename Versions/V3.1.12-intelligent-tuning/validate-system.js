const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Comprehensive validation system for Dan Tranh tablature
async function validateSystem() {
    const processedDir = './data/processed';
    const dirs = fs.readdirSync(processedDir);

    const results = {
        totalSongs: 0,
        validSongs: 0,
        issues: []
    };

    console.log(`🔍 Validating ${dirs.length} songs for systematic correctness...\n`);

    for (const dir of dirs) {
        const songPath = path.join(processedDir, dir);
        if (!fs.statSync(songPath).isDirectory()) continue;

        const viewerPath = path.join(songPath, 'viewer.html');
        const metadataPath = path.join(songPath, 'metadata.json');

        if (!fs.existsSync(viewerPath) || !fs.existsSync(metadataPath)) {
            results.issues.push({
                song: dir,
                type: 'MISSING_FILES',
                description: 'Missing viewer.html or metadata.json'
            });
            continue;
        }

        results.totalSongs++;

        try {
            // Parse files
            const viewerHTML = fs.readFileSync(viewerPath, 'utf-8');
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

            // Validation checks
            const validationResult = validateSong(dir, viewerHTML, metadata);

            if (validationResult.isValid) {
                results.validSongs++;
            } else {
                results.issues.push(...validationResult.issues);
            }

        } catch (error) {
            results.issues.push({
                song: dir,
                type: 'PARSE_ERROR',
                description: `Error parsing files: ${error.message}`
            });
        }
    }

    // Print summary
    console.log(`\n📊 VALIDATION SUMMARY`);
    console.log(`Total songs: ${results.totalSongs}`);
    console.log(`Valid songs: ${results.validSongs}`);
    console.log(`Songs with issues: ${results.totalSongs - results.validSongs}`);
    console.log(`Success rate: ${((results.validSongs / results.totalSongs) * 100).toFixed(1)}%`);

    // Group issues by type
    const issuesByType = {};
    results.issues.forEach(issue => {
        if (!issuesByType[issue.type]) {
            issuesByType[issue.type] = [];
        }
        issuesByType[issue.type].push(issue);
    });

    // Print detailed issues
    if (results.issues.length > 0) {
        console.log(`\n🚨 ISSUES FOUND:`);
        for (const [type, issues] of Object.entries(issuesByType)) {
            console.log(`\n${type} (${issues.length} songs):`);
            issues.slice(0, 5).forEach(issue => {
                console.log(`  - ${issue.song}: ${issue.description}`);
            });
            if (issues.length > 5) {
                console.log(`  ... and ${issues.length - 5} more`);
            }
        }
    } else {
        console.log(`\n✅ ALL SONGS PASS VALIDATION!`);
    }

    return results;
}

function validateSong(songName, viewerHTML, metadata) {
    const issues = [];
    let isValid = true;

    // Parse HTML using JSDOM
    const dom = new JSDOM(viewerHTML);
    const document = dom.window.document;

    // 1. Check SVG dimensions
    const svg = document.querySelector('#tablature');
    if (!svg) {
        issues.push({
            song: songName,
            type: 'MISSING_SVG',
            description: 'No SVG with id="tablature" found'
        });
        isValid = false;
    } else {
        const width = parseInt(svg.getAttribute('width'));
        const height = parseInt(svg.getAttribute('height'));

        // Check for reasonable dimensions
        if (height < 100) {
            issues.push({
                song: songName,
                type: 'SVG_TOO_SHORT',
                description: `SVG height ${height}px is too small`
            });
            isValid = false;
        }

        if (width < 500) {
            issues.push({
                song: songName,
                type: 'SVG_TOO_NARROW',
                description: `SVG width ${width}px is too small`
            });
            isValid = false;
        }
    }

    // 2. Check string lines
    const stringLines = document.querySelectorAll('.string-line');
    const expectedStringCount = metadata.strings || 0;

    if (stringLines.length !== expectedStringCount) {
        issues.push({
            song: songName,
            type: 'STRING_COUNT_MISMATCH',
            description: `Expected ${expectedStringCount} strings, found ${stringLines.length} string lines`
        });
        isValid = false;
    }

    // 3. Check for negative Y positions
    const negativeYPositions = [];
    stringLines.forEach((line, index) => {
        const y1 = parseInt(line.getAttribute('y1'));
        if (y1 < 0) {
            negativeYPositions.push(y1);
        }
    });

    if (negativeYPositions.length > 0) {
        issues.push({
            song: songName,
            type: 'NEGATIVE_Y_POSITIONS',
            description: `String lines with negative Y positions: ${negativeYPositions.join(', ')}`
        });
        isValid = false;
    }

    // 4. Check string labels
    const stringLabels = document.querySelectorAll('.string-label');
    if (stringLabels.length !== expectedStringCount) {
        issues.push({
            song: songName,
            type: 'MISSING_STRING_LABELS',
            description: `Expected ${expectedStringCount} string labels, found ${stringLabels.length}`
        });
        isValid = false;
    }

    // 5. Check for overlapping strings (too close together)
    const stringYPositions = Array.from(stringLines).map(line => parseInt(line.getAttribute('y1'))).sort((a, b) => a - b);
    for (let i = 1; i < stringYPositions.length; i++) {
        const gap = stringYPositions[i] - stringYPositions[i-1];
        if (gap < 20) {
            issues.push({
                song: songName,
                type: 'STRINGS_TOO_CLOSE',
                description: `Strings too close: ${gap}px gap between Y=${stringYPositions[i-1]} and Y=${stringYPositions[i]}`
            });
            isValid = false;
        }
    }

    // 6. Check note circles
    const noteCircles = document.querySelectorAll('.note-circle');
    const expectedNoteCount = metadata.noteCount || 0;

    if (noteCircles.length !== expectedNoteCount) {
        issues.push({
            song: songName,
            type: 'NOTE_COUNT_MISMATCH',
            description: `Expected ${expectedNoteCount} notes, found ${noteCircles.length} note circles`
        });
        isValid = false;
    }

    // 7. Check for notes outside SVG bounds
    const svgHeight = parseInt(svg?.getAttribute('height') || '0');
    noteCircles.forEach((circle, index) => {
        const cy = parseInt(circle.getAttribute('cy'));
        if (cy < 0 || cy > svgHeight) {
            issues.push({
                song: songName,
                type: 'NOTES_OUTSIDE_BOUNDS',
                description: `Note #${index + 1} at Y=${cy} is outside SVG bounds (0 to ${svgHeight})`
            });
            isValid = false;
        }
    });

    // 8. Check metadata string display format
    const stringsDisplay = viewerHTML.match(/<span class="metadata-label">Strings:<\/span>\s*<span>([^<]+)<\/span>/);
    if (stringsDisplay) {
        const displayText = stringsDisplay[1];
        // Should be in format "N (pitch1, pitch2, ...)" including accidentals
        if (!displayText.match(/^\d+ \([A-G][#b]?[0-9](?:, [A-G][#b]?[0-9])*\)$/)) {
            issues.push({
                song: songName,
                type: 'INVALID_STRING_DISPLAY',
                description: `Invalid string display format: "${displayText}"`
            });
            isValid = false;
        }
    }

    return { isValid, issues };
}

// Run validation
validateSystem().then(results => {
    // Exit with error code if issues found
    process.exit(results.issues.length > 0 ? 1 : 0);
});