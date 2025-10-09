/**
 * Extract lyrics from 5 MusicXML files for local LLM processing
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const songs = [
    { displayName: 'Hò Bơi Thuyền', backendId: 'ho-boi-thuyen', xmlFile: 'Hò Bơi thuyền.musicxml.xml', hasLyrics: true },
    { displayName: 'Hò Dố Khoan Dố Huầy (Hò Chèo Thuyền)', backendId: 'ho-do-khoan-do-huay-ho-cheo-thuyen', xmlFile: 'Hò Dố khoan Dố huầy (Hò chèo thuyền).musicxml.xml', hasLyrics: true },
    { displayName: 'Hò Nện', backendId: 'ho-nen', xmlFile: 'Hò nện.musicxml.xml', hasLyrics: true },
    { displayName: 'Múa Sạp', backendId: 'mua-sap', xmlFile: 'Múa sạp.musicxml.xml', hasLyrics: false },
    { displayName: 'Xòe Hoa', backendId: 'xoe-hoa', xmlFile: 'Xòe hoa.musicxml.xml', hasLyrics: false }
];

async function extractLyrics(xmlFile) {
    const xmlPath = path.join(__dirname, 'data', 'musicxml', xmlFile);

    if (!fs.existsSync(xmlPath)) {
        throw new Error(`File not found: ${xmlFile}`);
    }

    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlContent);

    const lyrics = [];
    const notes = [];

    // Navigate through MusicXML structure
    if (result['score-partwise'] && result['score-partwise'].part) {
        const parts = result['score-partwise'].part;

        for (const part of parts) {
            if (part.measure) {
                for (const measure of part.measure) {
                    if (measure.note) {
                        for (const note of measure.note) {
                            // Extract lyric if present
                            if (note.lyric && note.lyric[0] && note.lyric[0].text) {
                                const lyricText = note.lyric[0].text[0];
                                const lyricStr = typeof lyricText === 'string' ? lyricText : String(lyricText);
                                if (lyricStr && lyricStr.trim()) {
                                    lyrics.push(lyricStr.trim());

                                    // Also extract pitch for reference
                                    let pitch = null;
                                    if (note.pitch && note.pitch[0]) {
                                        const step = note.pitch[0].step ? note.pitch[0].step[0] : '';
                                        const octave = note.pitch[0].octave ? note.pitch[0].octave[0] : '';
                                        pitch = step + octave;
                                    }

                                    notes.push({
                                        lyric: lyricStr.trim(),
                                        pitch: pitch,
                                        isGrace: !!note.grace
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return { lyrics, notes, lyricsText: lyrics.join(' ') };
}

async function main() {
    console.log('Extracting lyrics from 5 MusicXML files...\n');

    for (const song of songs) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`Song: ${song.displayName}`);
        console.log(`Backend ID: ${song.backendId}`);
        console.log(`XML File: ${song.xmlFile}`);
        console.log('='.repeat(70));

        try {
            if (!song.hasLyrics) {
                console.log(`\n⚠️  INSTRUMENTAL PIECE - No lyrics to extract`);
                console.log(`This song will be marked as instrumental in the database.\n`);
                continue;
            }

            const { lyrics, notes, lyricsText } = await extractLyrics(song.xmlFile);

            console.log(`\nTotal syllables: ${lyrics.length}`);
            console.log(`Notes with lyrics: ${notes.filter(n => !n.isGrace).length}`);
            console.log(`Grace notes: ${notes.filter(n => n.isGrace).length}`);

            console.log(`\nLyrics text:\n${lyricsText}\n`);

            // Save to file for LLM processing
            const outputPath = path.join(__dirname, 'data', 'lyrics', `${song.backendId}-extracted.txt`);
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            fs.writeFileSync(outputPath, `${song.displayName}\n\n${lyricsText}\n\nSyllables: ${lyrics.length}\n`, 'utf-8');
            console.log(`✓ Saved to: ${outputPath}`);

        } catch (error) {
            console.error(`✗ Error: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('Extraction complete! Ready for LLM segmentation.');
    console.log('='.repeat(70));
}

main().catch(console.error);
