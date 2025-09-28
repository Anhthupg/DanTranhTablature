/**
 * Analyze all songs to determine optimal pentatonic tuning
 * Finds the 5 most common pitch classes across the collection
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class TuningAnalyzer {
    constructor() {
        this.musicxmlDir = path.join(__dirname, 'data/musicxml');
        this.pitchClassCounts = {};
        this.songPitches = {};
    }

    extractPitchClass(noteName) {
        const match = noteName.match(/^([A-G][#b]?)/);
        return match ? match[1] : null;
    }

    extractOctave(noteName) {
        const match = noteName.match(/\d+$/);
        return match ? parseInt(match[0]) : null;
    }

    async analyzeAllSongs() {
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║   Analyzing 130+ Songs for Optimal Pentatonic Tuning        ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');

        const files = fs.readdirSync(this.musicxmlDir)
            .filter(file => file.endsWith('.xml'));

        console.log(`📂 Found ${files.length} MusicXML files\n`);

        for (const file of files) {
            const filePath = path.join(this.musicxmlDir, file);
            const songName = file.replace('.musicxml.xml', '');
            await this.analyzeSong(filePath, songName);
        }

        this.generateReport();
    }

    async analyzeSong(xmlPath, songName) {
        const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
        const dom = new JSDOM(xmlContent, { contentType: 'text/xml' });
        const doc = dom.window.document;

        const noteElements = doc.querySelectorAll('note');
        const songPitchClasses = new Set();

        noteElements.forEach((noteEl) => {
            const pitch = noteEl.querySelector('pitch');
            if (!pitch) return;

            const step = pitch.querySelector('step')?.textContent;
            const alter = pitch.querySelector('alter')?.textContent || '0';
            const octave = pitch.querySelector('octave')?.textContent;

            const noteName = step + (alter === '1' ? '#' : alter === '-1' ? 'b' : '') + octave;
            const pitchClass = this.extractPitchClass(noteName);

            if (pitchClass) {
                if (!this.pitchClassCounts[pitchClass]) {
                    this.pitchClassCounts[pitchClass] = 0;
                }
                this.pitchClassCounts[pitchClass]++;
                songPitchClasses.add(noteName);
            }
        });

        this.songPitches[songName] = Array.from(songPitchClasses).sort();
    }

    generateReport() {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 PITCH CLASS FREQUENCY ANALYSIS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const sortedPitchClasses = Object.entries(this.pitchClassCounts)
            .sort((a, b) => b[1] - a[1]);

        console.log('All Pitch Classes (sorted by frequency):\n');
        sortedPitchClasses.forEach(([pitch, count], index) => {
            const bar = '█'.repeat(Math.ceil(count / 100));
            console.log(`${(index + 1).toString().padStart(2)}. ${pitch.padEnd(3)} ${count.toString().padStart(5)} ${bar}`);
        });

        const top5 = sortedPitchClasses.slice(0, 5);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎵 TOP 5 PITCH CLASSES (Pentatonic Scale)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        top5.forEach(([pitch, count], index) => {
            const percentage = ((count / Object.values(this.pitchClassCounts).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            console.log(`${index + 1}. ${pitch.padEnd(3)} - ${count.toString().padStart(5)} notes (${percentage}%)`);
        });

        const pentatonicScale = top5.map(([pitch]) => pitch);
        console.log(`\n✅ Pentatonic Scale: ${pentatonicScale.join(' - ')}`);

        this.analyzeBendingRequirements(pentatonicScale);
        this.saveTuningConfig(pentatonicScale);
    }

    analyzeBendingRequirements(pentatonicScale) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎸 STRING BENDING ANALYSIS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let totalBentNotes = 0;
        let totalNotes = 0;
        const bentPitchClasses = new Set();

        Object.entries(this.pitchClassCounts).forEach(([pitch, count]) => {
            totalNotes += count;
            if (!pentatonicScale.includes(pitch)) {
                totalBentNotes += count;
                bentPitchClasses.add(pitch);
            }
        });

        console.log(`Open String Notes: ${pentatonicScale.join(', ')}`);
        console.log(`Bent Notes (non-open): ${Array.from(bentPitchClasses).join(', ')}`);
        console.log(`\nTotal Notes: ${totalNotes}`);
        console.log(`Notes on Open Strings: ${totalNotes - totalBentNotes} (${((totalNotes - totalBentNotes) / totalNotes * 100).toFixed(1)}%)`);
        console.log(`Notes Requiring Bending: ${totalBentNotes} (${(totalBentNotes / totalNotes * 100).toFixed(1)}%)`);

        const songsRequiringBending = Object.entries(this.songPitches).filter(([_, pitches]) => {
            return pitches.some(p => {
                const pitchClass = this.extractPitchClass(p);
                return !pentatonicScale.includes(pitchClass);
            });
        });

        console.log(`\nSongs Requiring String Bending: ${songsRequiringBending.length} of ${Object.keys(this.songPitches).length}`);
        console.log(`Songs Using Only Open Strings: ${Object.keys(this.songPitches).length - songsRequiringBending.length}`);
    }

    saveTuningConfig(pentatonicScale) {
        const config = {
            tuningSystem: 'pentatonic',
            generatedDate: new Date().toISOString(),
            analysis: {
                totalSongs: Object.keys(this.songPitches).length,
                pitchClassFrequencies: this.pitchClassCounts
            },
            openStrings: pentatonicScale,
            description: `Auto-detected pentatonic scale based on ${Object.keys(this.songPitches).length} songs`
        };

        const outputPath = path.join(__dirname, 'data/tuning-config.json');
        fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));

        console.log(`\n✅ Tuning configuration saved to: ${outputPath}`);
    }
}

if (require.main === module) {
    const analyzer = new TuningAnalyzer();
    analyzer.analyzeAllSongs().catch(console.error);
}

module.exports = TuningAnalyzer;