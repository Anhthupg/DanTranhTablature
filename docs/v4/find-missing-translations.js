/**
 * Find Missing English Translations
 * Scans all lyrics files and reports words without English translations
 */

const fs = require('fs');
const path = require('path');

class MissingTranslationFinder {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
    }

    findMissing() {
        const files = fs.readdirSync(this.lyricsDir).filter(f => f.endsWith('.json'));

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Missing Translation Scanner                              ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        const missingWords = new Set();
        const missingByWord = {};  // word → list of songs
        let songsWithMissing = 0;
        let totalMissingCount = 0;

        files.forEach(file => {
            const songName = file.replace('.json', '');
            const lyricsData = JSON.parse(fs.readFileSync(path.join(this.lyricsDir, file), 'utf8'));

            let songHasMissing = false;
            const songMissing = new Set();

            lyricsData.phrases.forEach((phrase, phraseIdx) => {
                if (phrase.wordMapping) {
                    phrase.wordMapping.forEach((mapping, wordIdx) => {
                        // Check for empty OR same as Vietnamese (translation failed)
                        const vnLower = mapping.vn.toLowerCase().trim();
                        const enLower = (mapping.en || '').toLowerCase().trim();

                        if (!mapping.en || mapping.en.trim() === '' || vnLower === enLower) {
                            missingWords.add(mapping.vn);
                            songMissing.add(mapping.vn);
                            songHasMissing = true;
                            totalMissingCount++;

                            if (!missingByWord[mapping.vn]) {
                                missingByWord[mapping.vn] = [];
                            }
                            missingByWord[mapping.vn].push({
                                song: songName,
                                phrase: phraseIdx + 1,
                                text: phrase.text
                            });
                        }
                    });
                }
            });

            if (songHasMissing) {
                songsWithMissing++;
                console.log(`⚠️  ${songName}: ${songMissing.size} missing words`);
                console.log(`   Missing: ${Array.from(songMissing).join(', ')}`);
            }
        });

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Scan Complete                                            ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        console.log(`📊 Summary:`);
        console.log(`   Songs with missing translations: ${songsWithMissing}/${files.length}`);
        console.log(`   Unique untranslated words: ${missingWords.size}`);
        console.log(`   Total missing instances: ${totalMissingCount}\n`);

        if (missingWords.size > 0) {
            console.log(`📝 Untranslated Words (sorted by frequency):\n`);

            const sorted = Object.entries(missingByWord)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 50);

            sorted.forEach(([word, occurrences], idx) => {
                console.log(`   ${idx + 1}. "${word}" - appears ${occurrences.length}× in:`);
                const songs = [...new Set(occurrences.map(o => o.song))];
                console.log(`      Songs: ${songs.slice(0, 3).join(', ')}${songs.length > 3 ? ` (+${songs.length - 3} more)` : ''}`);
            });

            // Save detailed report
            const reportPath = path.join(__dirname, 'data', 'missing-translations-report.json');
            fs.writeFileSync(reportPath, JSON.stringify({
                summary: {
                    songsWithMissing,
                    totalSongs: files.length,
                    uniqueMissingWords: missingWords.size,
                    totalMissingInstances: totalMissingCount
                },
                missingWords: sorted.map(([word, occurrences]) => ({
                    word,
                    frequency: occurrences.length,
                    songs: occurrences.map(o => ({ song: o.song, phrase: o.phrase, text: o.text }))
                }))
            }, null, 2), 'utf8');

            console.log(`\n💾 Detailed report saved to: ${reportPath}`);
            console.log(`\n💡 Add these words to batch-translate-english.js dictionary, then re-run:\n   node batch-translate-english.js\n`);
        } else {
            console.log(`✅ All words have English translations!\n`);
        }
    }
}

if (require.main === module) {
    const finder = new MissingTranslationFinder();
    finder.findMissing();
}

module.exports = MissingTranslationFinder;
