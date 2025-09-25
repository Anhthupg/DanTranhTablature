/**
 * V3 Auto-Import System
 * Automatically processes new MusicXML files added to v3/data/musicxml/
 * Just drop files in and run this script!
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class AutoImporter {
    constructor() {
        this.musicxmlDir = path.join(__dirname, 'data', 'musicxml');
        this.processedDir = path.join(__dirname, 'data', 'processed');
        this.songListPath = path.join(__dirname, 'data', 'song-list.json');
        this.processedListPath = path.join(__dirname, 'data', 'processed-songs.json');

        // Track what's already processed
        this.processedSongs = this.loadProcessedList();
        this.newSongs = [];
    }

    loadProcessedList() {
        try {
            if (fs.existsSync(this.processedListPath)) {
                return JSON.parse(fs.readFileSync(this.processedListPath, 'utf8'));
            }
        } catch (e) {
            console.log('No processed list found, starting fresh');
        }
        return [];
    }

    async run() {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 V3 Auto-Import System                         ║
║         Drop MusicXML files → Instant processing              ║
╚═══════════════════════════════════════════════════════════════╝
        `);

        // Get all XML files
        const allFiles = fs.readdirSync(this.musicxmlDir)
            .filter(file => file.endsWith('.xml') || file.endsWith('.musicxml'));

        // Find new files
        this.newSongs = allFiles.filter(file => !this.processedSongs.includes(file));

        if (this.newSongs.length === 0) {
            console.log('✅ All songs are already processed!');
            console.log(`📊 Total songs in library: ${allFiles.length}`);
            return;
        }

        console.log(`🆕 Found ${this.newSongs.length} new songs to process:\n`);
        this.newSongs.forEach((song, i) => {
            console.log(`   ${i + 1}. ${song.replace('.musicxml.xml', '').replace('.xml', '')}`);
        });

        console.log('\n📦 Processing new songs...\n');

        // Process each new song
        for (const file of this.newSongs) {
            await this.processNewSong(file);
        }

        // Update the processed list
        this.updateProcessedList();

        // Update the main song list
        this.updateSongList(allFiles);

        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    Import Complete!                           ║
╠═══════════════════════════════════════════════════════════════╣
║  ✅ Processed ${String(this.newSongs.length).padEnd(47)}║
║  📚 Total songs: ${String(allFiles.length).padEnd(44)}║
║  🌐 Library updated automatically                             ║
╚═══════════════════════════════════════════════════════════════╝

🎉 Your new songs are now available in the library!
🔄 Refresh http://localhost:3002/library to see them
        `);
    }

    async processNewSong(filename) {
        const songName = filename.replace('.musicxml.xml', '').replace('.xml', '');
        console.log(`⏳ Processing: ${songName}`);

        try {
            // Create safe filename
            const safeName = this.sanitizeFileName(songName);
            const songDir = path.join(this.processedDir, safeName);

            // Create song directory
            if (!fs.existsSync(songDir)) {
                fs.mkdirSync(songDir, { recursive: true });
            }

            // Read the MusicXML file
            const xmlPath = path.join(this.musicxmlDir, filename);
            const xmlContent = fs.readFileSync(xmlPath, 'utf8');

            // Extract basic data from MusicXML
            const songData = this.extractBasicData(xmlContent, songName);

            // Create metadata with real extracted data
            const metadata = {
                name: songName,
                filename: filename,
                processedDate: new Date().toISOString(),
                region: this.detectRegion(songName),
                difficulty: this.assessDifficulty(songData),
                noteCount: songData.noteCount,
                uniqueNotes: songData.uniqueNotes,
                hasLyrics: songData.hasLyrics,
                tempo: songData.tempo,
                timeSignature: songData.timeSignature,
                strings: songData.estimatedStrings,
                measures: songData.measures,
                pitchRange: songData.pitchRange,
                tuning: songData.detectedTuning.length > 0 ? songData.detectedTuning : ['D4', 'G4', 'A4', 'C5', 'D5'], // Default Dan Tranh tuning
                bentNotes: songData.bentNotes || [],
                tuningSystem: songData.detectedTuning.length > 0 ? 'detected' : 'default',
                patternEfficiency: songData.patternEfficiency || { learnOnly: songData.noteCount, totalNotes: songData.noteCount, efficiency: 0 }
            };

            // Save metadata
            fs.writeFileSync(
                path.join(songDir, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );

            // Create a simple viewer (placeholder for now)
            this.createSimpleViewer(songDir, songName);

            // Mark as processed
            this.processedSongs.push(filename);

            console.log(`   ✅ ${songName} processed successfully`);

        } catch (error) {
            console.error(`   ❌ Error processing ${songName}: ${error.message}`);
        }
    }

    extractBasicData(xmlContent, songName) {
        const dom = new JSDOM(xmlContent, { contentType: 'text/xml' });
        const doc = dom.window.document;

        // Extract tempo
        let tempo = 120; // default
        const soundElement = doc.querySelector('sound[tempo]');
        if (soundElement) {
            tempo = parseInt(soundElement.getAttribute('tempo'));
        }

        // Extract time signature
        let timeSignature = '4/4'; // default
        const beatsElement = doc.querySelector('beats');
        const beatTypeElement = doc.querySelector('beat-type');
        if (beatsElement && beatTypeElement) {
            timeSignature = `${beatsElement.textContent}/${beatTypeElement.textContent}`;
        }

        // Extract notes and analyze
        const notes = doc.querySelectorAll('note');
        const pitchFrequency = {}; // Track frequency of each pitch
        const pitches = new Set();
        const octaves = new Set();
        let hasLyrics = false;

        notes.forEach(note => {
            const pitch = note.querySelector('pitch');
            if (pitch) {
                const step = pitch.querySelector('step');
                const octave = pitch.querySelector('octave');
                const alter = pitch.querySelector('alter'); // for sharps/flats

                if (step && octave) {
                    const noteName = step.textContent + octave.textContent;
                    const fullNote = alter ? `${step.textContent}${alter.textContent > 0 ? '#' : 'b'}${octave.textContent}` : noteName;

                    // Count frequency for tuning detection
                    pitchFrequency[fullNote] = (pitchFrequency[fullNote] || 0) + 1;

                    pitches.add(step.textContent);
                    octaves.add(parseInt(octave.textContent));
                }
            }
            if (note.querySelector('lyric')) {
                hasLyrics = true;
            }
        });

        // Detect tuning based on most frequent notes
        const sortedNotes = Object.entries(pitchFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        // Get top 5 most frequent notes as likely tuning
        const detectedTuning = sortedNotes.slice(0, 5);

        // Identify bent notes (notes that appear less frequently)
        const bentNotes = sortedNotes.slice(5).filter(note =>
            pitchFrequency[note] < Math.max(...Object.values(pitchFrequency)) * 0.2
        );

        // Estimate string usage based on detected tuning
        const estimatedStrings = Math.min(7, Math.max(4, detectedTuning.length));

        // Calculate pitch range
        const minOctave = octaves.size > 0 ? Math.min(...Array.from(octaves)) : 4;
        const maxOctave = octaves.size > 0 ? Math.max(...Array.from(octaves)) : 5;
        const sortedPitches = Array.from(pitches).sort();
        const pitchRange = sortedPitches.length > 0
            ? `${sortedPitches[0]}${minOctave}-${sortedPitches[sortedPitches.length - 1]}${maxOctave}`
            : 'N/A';

        // Count measures
        const measures = doc.querySelectorAll('measure').length;

        // Count unique notes (notes to learn)
        const uniqueNotes = Object.keys(pitchFrequency).length;

        // Calculate pattern-based learning efficiency (simplified)
        const patternEfficiency = this.calculatePatternEfficiency(notes, doc);

        return {
            name: songName,
            tempo: tempo,
            timeSignature: timeSignature,
            noteCount: notes.length,
            uniqueNotes: uniqueNotes,
            hasLyrics: hasLyrics,
            measures: measures,
            pitchRange: pitchRange,
            estimatedStrings: estimatedStrings,
            detectedTuning: detectedTuning,
            bentNotes: bentNotes,
            noteFrequencies: pitchFrequency,
            patternEfficiency: patternEfficiency
        };
    }

    detectRegion(songName) {
        const name = songName.toLowerCase();

        // Regional indicators
        if (name.includes('bắc') || name.includes('quan họ') || name.includes('chèo')) {
            return 'Northern';
        }
        if (name.includes('nam') || name.includes('nam bộ') || name.includes('cải lương')) {
            return 'Southern';
        }
        if (name.includes('huế') || name.includes('trung') || name.includes('quảng')) {
            return 'Central';
        }
        if (name.includes('tây nguyên') || name.includes('ê đê')) {
            return 'Highland';
        }

        // Type-based classification
        if (name.includes('hò')) return 'Work Song';
        if (name.includes('ru')) return 'Lullaby';
        if (name.includes('lý')) return 'Folk Song';

        return 'Traditional';
    }

    calculatePatternEfficiency(notes, doc) {
        // Simple pattern-based learning efficiency calculation
        // This is a simplified version of V1's pattern analysis

        const noteSequence = [];

        // Extract note sequence with pitches
        notes.forEach(note => {
            const pitch = note.querySelector('pitch');
            if (pitch) {
                const step = pitch.querySelector('step');
                const octave = pitch.querySelector('octave');
                if (step && octave) {
                    noteSequence.push(step.textContent + octave.textContent);
                }
            }
        });

        // Find repeating patterns of different lengths
        const patterns = {};
        const minPatternLength = 2;
        const maxPatternLength = Math.min(8, Math.floor(noteSequence.length / 4));

        for (let len = minPatternLength; len <= maxPatternLength; len++) {
            for (let i = 0; i <= noteSequence.length - len; i++) {
                const pattern = noteSequence.slice(i, i + len).join('-');
                patterns[pattern] = (patterns[pattern] || 0) + 1;
            }
        }

        // Find patterns that repeat at least twice
        const repeatingPatterns = Object.entries(patterns)
            .filter(([pattern, count]) => count >= 2)
            .sort((a, b) => {
                // Sort by efficiency: (pattern length * repeat count)
                const efficiencyA = a[0].split('-').length * a[1];
                const efficiencyB = b[0].split('-').length * b[1];
                return efficiencyB - efficiencyA;
            });

        // Calculate learning efficiency
        let learnNotes = noteSequence.length; // Start with all notes
        let coveredPositions = new Set();

        // Find most efficient patterns to learn
        for (const [pattern, count] of repeatingPatterns) {
            const patternNotes = pattern.split('-');
            const patternLength = patternNotes.length;

            // Find all occurrences of this pattern
            for (let i = 0; i <= noteSequence.length - patternLength; i++) {
                const segment = noteSequence.slice(i, i + patternLength).join('-');
                if (segment === pattern) {
                    // Mark these positions as covered
                    for (let j = i; j < i + patternLength; j++) {
                        coveredPositions.add(j);
                    }
                }
            }
        }

        // Calculate efficiency
        const uniquePatternNotes = noteSequence.length - coveredPositions.size +
            Math.floor(coveredPositions.size / 3); // Approximate unique pattern starts

        const efficiency = noteSequence.length > 0
            ? Math.round(((noteSequence.length - uniquePatternNotes) / noteSequence.length) * 100)
            : 0;

        return {
            learnOnly: Math.max(Math.floor(noteSequence.length * 0.4), uniquePatternNotes), // Minimum 40% like V1
            totalNotes: noteSequence.length,
            efficiency: efficiency,
            patternCount: repeatingPatterns.length
        };
    }

    assessDifficulty(songData) {
        // Assess difficulty based on actual data
        const noteCount = songData.noteCount || 0;
        const strings = songData.estimatedStrings || 4;
        const measures = songData.measures || 0;
        const hasLyrics = songData.hasLyrics;

        // Calculate complexity score
        let complexity = 0;

        // Note density
        if (measures > 0) {
            const notesPerMeasure = noteCount / measures;
            if (notesPerMeasure > 8) complexity += 2;
            else if (notesPerMeasure > 4) complexity += 1;
        }

        // String usage
        if (strings >= 7) complexity += 2;
        else if (strings >= 5) complexity += 1;

        // Overall note count
        if (noteCount > 200) complexity += 1;
        if (noteCount > 400) complexity += 1;

        // Determine difficulty
        if (complexity <= 1) return 'Beginner';
        if (complexity <= 3) return 'Intermediate';
        return 'Advanced';
    }

    createSimpleViewer(songDir, songName) {
        // Create a simple HTML viewer
        const viewerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${songName} - Dan Tranh V3</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            background: #f8f9fa;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .status {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎼 ${songName}</h1>

        <div class="status">
            <strong>📝 Status:</strong> Song imported successfully!<br><br>
            This song has been added to your V3 library.
            Full visualization with tablature, pattern analysis, and audio will be available
            after running the complete processor.
        </div>

        <p><strong>Next steps:</strong></p>
        <ul>
            <li>Run <code>node v3/import-processor.js</code> for full processing</li>
            <li>This will generate tablature, patterns, and audio synthesis</li>
            <li>The song will then have the complete V1 experience</li>
        </ul>

        <a href="/library" class="back-link">← Back to Library</a>
    </div>
</body>
</html>`;

        fs.writeFileSync(path.join(songDir, 'viewer.html'), viewerHTML);
    }

    updateProcessedList() {
        fs.writeFileSync(
            this.processedListPath,
            JSON.stringify(this.processedSongs, null, 2)
        );
    }

    updateSongList(allFiles) {
        const songNames = allFiles.map(file =>
            file.replace('.musicxml.xml', '').replace('.xml', '')
        );

        fs.writeFileSync(
            this.songListPath,
            JSON.stringify(songNames, null, 2)
        );

        console.log(`\n📋 Updated song list with ${songNames.length} total songs`);
    }

    sanitizeFileName(name) {
        return name.replace(/[^a-zA-Z0-9À-ỹ\s]/g, '_').replace(/\s+/g, '_');
    }
}

// Watch mode for continuous monitoring
if (process.argv.includes('--watch')) {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 Auto-Import WATCH MODE                        ║
║         Monitoring for new MusicXML files...                  ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    const importer = new AutoImporter();

    // Initial run
    importer.run();

    // Watch for changes
    fs.watch(importer.musicxmlDir, async (eventType, filename) => {
        if (filename && (filename.endsWith('.xml') || filename.endsWith('.musicxml'))) {
            console.log(`\n🔔 Detected new file: ${filename}`);
            setTimeout(() => {
                importer.run();
            }, 1000); // Wait a second for file to be fully written
        }
    });

    console.log('\n👀 Watching for new MusicXML files...');
    console.log('   (Press Ctrl+C to stop)\n');
} else {
    // Single run
    const importer = new AutoImporter();
    importer.run();
}