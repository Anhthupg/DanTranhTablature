/**
 * Clean extraction - properly handle MusicXML lyric elements
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const songs = [
    { displayName: 'Hò Bơi Thuyền', backendId: 'ho-boi-thuyen', xmlFile: 'Hò Bơi thuyền.musicxml.xml' },
    { displayName: 'Hò Dố Khoan Dố Huầy (Hò Chèo Thuyền)', backendId: 'ho-do-khoan-do-huay-ho-cheo-thuyen', xmlFile: 'Hò Dố khoan Dố huầy (Hò chèo thuyền).musicxml.xml' },
    { displayName: 'Hò Nện', backendId: 'ho-nen', xmlFile: 'Hò nện.musicxml.xml' }
];

async function extractCleanLyrics(xmlFile) {
    const xmlPath = path.join(__dirname, 'data', 'musicxml', xmlFile);
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

    // Direct regex extraction of lyric text elements
    const lyricMatches = xmlContent.matchAll(/<text[^>]*>([^<]+)<\/text>/g);
    const lyrics = [];

    for (const match of lyricMatches) {
        const text = match[1].trim();
        if (text && text !== '' && !text.includes('<?xml')) {
            lyrics.push(text);
        }
    }

    return lyrics;
}

async function main() {
    console.log('Cleaning and extracting lyrics...\n');

    for (const song of songs) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`${song.displayName}`);
        console.log('='.repeat(70));

        try {
            const lyrics = await extractCleanLyrics(song.xmlFile);

            console.log(`\nTotal syllables: ${lyrics.length}`);
            console.log(`\nClean lyrics:\n${lyrics.join(' ')}\n`);

            // Save cleaned lyrics
            const outputPath = path.join(__dirname, 'data', 'lyrics', `${song.backendId}-clean.txt`);
            fs.writeFileSync(outputPath, `${song.displayName}\n\nLyrics (${lyrics.length} syllables):\n\n${lyrics.join(' ')}\n`, 'utf-8');
            console.log(`✓ Saved to: ${outputPath}`);

        } catch (error) {
            console.error(`✗ Error: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('Clean lyrics extraction complete!');
    console.log('='.repeat(70));
}

main().catch(console.error);
