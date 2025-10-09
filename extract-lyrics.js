/**
 * Extract lyrics data from the original HTML
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function extractLyrics() {
    console.log('📖 Extracting lyrics from original HTML...');

    // Read the original HTML file
    const htmlPath = path.join(__dirname, 'analytical_tablature.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // Parse HTML
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Extract lyrics syllables
    const syllables = [];
    const syllableElements = document.querySelectorAll('.editable-syllable');

    syllableElements.forEach(elem => {
        const syllableData = {
            text: elem.textContent.trim(),
            position: parseInt(elem.getAttribute('data-position')),
            syllableIndex: parseInt(elem.getAttribute('data-syllable-index')),
            isMelismatic: elem.classList.contains('melismatic'),
            title: elem.getAttribute('title') || ''
        };

        // Extract tone information from title
        const toneMatch = syllableData.title.match(/tone: (\w+)/);
        if (toneMatch) {
            syllableData.tone = toneMatch[1];
        }

        // Extract note count for melismatic syllables
        const noteCountMatch = syllableData.title.match(/(\d+) notes?/);
        if (noteCountMatch) {
            syllableData.noteCount = parseInt(noteCountMatch[1]);
        }

        syllables.push(syllableData);
    });

    // Extract line breaks
    const lineBreaks = [];
    const lineBreakElements = document.querySelectorAll('.line-break');

    lineBreakElements.forEach(elem => {
        const breakData = {
            afterIndex: parseInt(elem.getAttribute('data-break-after')),
            isActive: elem.classList.contains('active')
        };
        lineBreaks.push(breakData);
    });

    // Organize into lines based on active line breaks
    const lines = [];
    let currentLine = {
        syllables: [],
        startIndex: 0
    };

    syllables.forEach((syllable, index) => {
        currentLine.syllables.push(syllable);

        // Check if there's an active line break after this syllable
        const breakPoint = lineBreaks.find(b => b.afterIndex === index && b.isActive);
        if (breakPoint) {
            lines.push({
                ...currentLine,
                endIndex: index,
                text: currentLine.syllables.map(s => s.text).join(' ')
            });
            currentLine = {
                syllables: [],
                startIndex: index + 1
            };
        }
    });

    // Don't forget the last line
    if (currentLine.syllables.length > 0) {
        lines.push({
            ...currentLine,
            endIndex: syllables.length - 1,
            text: currentLine.syllables.map(s => s.text).join(' ')
        });
    }

    // Create the lyrics data structure
    const lyricsData = {
        syllables,
        lineBreaks,
        lines,
        metadata: {
            totalSyllables: syllables.length,
            totalLines: lines.length,
            melismaticSyllables: syllables.filter(s => s.isMelismatic).length,
            extractedAt: new Date().toISOString()
        }
    };

    // Save to JSON file
    const outputPath = path.join(__dirname, 'v2', 'data', 'song-001', 'lyrics.json');
    fs.writeFileSync(outputPath, JSON.stringify(lyricsData, null, 2));

    console.log('✅ Lyrics extracted successfully!');
    console.log(`📊 Stats:`);
    console.log(`   - Total syllables: ${lyricsData.metadata.totalSyllables}`);
    console.log(`   - Total lines: ${lyricsData.metadata.totalLines}`);
    console.log(`   - Melismatic syllables: ${lyricsData.metadata.melismaticSyllables}`);
    console.log(`📁 Saved to: ${outputPath}`);

    // Print sample of extracted lines
    console.log('\n📝 Sample lines:');
    lines.slice(0, 5).forEach((line, index) => {
        console.log(`   Line ${index + 1}: "${line.text}"`);
    });
}

// Run extraction
extractLyrics().catch(console.error);