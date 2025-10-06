/**
 * V4 Batch Processor - Preserves Original Filenames
 * Processes all MusicXML files while keeping their original names
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

class BatchProcessorPreserveNames {
    constructor() {
        this.musicXMLDir = path.join(__dirname, 'data', 'musicxml');
        this.processedDir = path.join(__dirname, 'data', 'processed-preserve');

        // Ensure directories exist
        if (!fs.existsSync(this.processedDir)) {
            fs.mkdirSync(this.processedDir, { recursive: true });
        }

        // Note to cents mapping
        this.noteToCents = {
            'C': 0, 'C#': 100, 'Db': 100, 'D': 200, 'D#': 300, 'Eb': 300,
            'E': 400, 'F': 500, 'F#': 600, 'Gb': 600, 'G': 700, 'G#': 800,
            'Ab': 800, 'A': 900, 'A#': 1000, 'Bb': 1000, 'B': 1100
        };

        // Tuning systems
        this.tuningSystems = {
            'C-D-E-G-A': ['C', 'D', 'E', 'G', 'A'],
            'C-D-F-G-A': ['C', 'D', 'F', 'G', 'A'],
            'C-D-E-G-Bb': ['C', 'D', 'E', 'G', 'Bb'],
            'C-Eb-F-G-Bb': ['C', 'Eb', 'F', 'G', 'Bb'],
            'D-E-G-A-B': ['D', 'E', 'G', 'A', 'B']
        };
    }

    /**
     * Process all MusicXML files in the directory
     */
    processAll() {
        console.log('Starting batch processing with preserved filenames...');
        console.log(`Source directory: ${this.musicXMLDir}`);
        console.log(`Output directory: ${this.processedDir}`);

        if (!fs.existsSync(this.musicXMLDir)) {
            console.error(`Source directory not found: ${this.musicXMLDir}`);
            return;
        }

        // Get all MusicXML files
        const files = fs.readdirSync(this.musicXMLDir)
            .filter(file => file.endsWith('.xml') || file.endsWith('.musicxml'));

        console.log(`Found ${files.length} MusicXML files`);

        let successCount = 0;
        let errorCount = 0;

        files.forEach((file, index) => {
            console.log(`[${index + 1}/${files.length}] Processing: ${file}`);

            try {
                const filePath = path.join(this.musicXMLDir, file);
                const processedData = this.processFile(filePath);

                if (processedData) {
                    // Keep original filename, just change extension to .json
                    const outputFilename = file.replace(/\.(xml|musicxml)$/, '.json');
                    const outputPath = path.join(this.processedDir, outputFilename);

                    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
                    console.log(`  ✓ Saved: ${outputFilename}`);
                    successCount++;
                }
            } catch (error) {
                console.error(`  ✗ Error processing ${file}:`, error.message);
                errorCount++;
            }
        });

        console.log('\n=== Processing Complete ===');
        console.log(`Success: ${successCount} files`);
        console.log(`Errors: ${errorCount} files`);
        console.log(`Output directory: ${this.processedDir}`);
    }

    /**
     * Process a single MusicXML file
     */
    processFile(filePath) {
        const xmlContent = fs.readFileSync(filePath, 'utf8');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        // Extract metadata
        const title = this.extractTitle(xmlDoc);
        const notes = this.extractCompleteNotes(xmlDoc);

        if (!notes || notes.length === 0) {
            console.warn(`  No notes found in ${path.basename(filePath)}`);
            return null;
        }

        // Detect optimal tuning
        const optimalTuning = this.detectOptimalTuning(notes);

        // Calculate statistics
        const graceNotes = notes.filter(n => n.isGrace).length;
        const uniquePitches = [...new Set(notes.map(n => `${n.step}${n.octave}`))].length;
        const bentNotes = this.countBentNotes(notes, optimalTuning);

        return {
            metadata: {
                originalFilename: path.basename(filePath),
                title: title || path.basename(filePath, path.extname(filePath)),
                totalNotes: notes.length,
                graceNotes: graceNotes,
                uniquePitches: uniquePitches,
                bentNotes: bentNotes,
                optimalTuning: optimalTuning,
                processedDate: new Date().toISOString()
            },
            notes: notes
        };
    }

    /**
     * Extract title from MusicXML - preserves original title from sheet
     */
    extractTitle(xmlDoc) {
        // Try multiple locations for title
        const workTitle = xmlDoc.getElementsByTagName('work-title')[0];
        if (workTitle && workTitle.textContent) {
            return workTitle.textContent.trim();
        }

        const movementTitle = xmlDoc.getElementsByTagName('movement-title')[0];
        if (movementTitle && movementTitle.textContent) {
            return movementTitle.textContent.trim();
        }

        const creditWords = xmlDoc.getElementsByTagName('credit-words');
        if (creditWords.length > 0 && creditWords[0].textContent) {
            return creditWords[0].textContent.trim();
        }

        return null;
    }

    /**
     * Extract complete note data from MusicXML
     */
    extractCompleteNotes(xmlDoc) {
        const notes = [];
        const noteElements = xmlDoc.getElementsByTagName('note');

        for (let i = 0; i < noteElements.length; i++) {
            const noteElement = noteElements[i];

            // Skip rests
            const restElement = noteElement.getElementsByTagName('rest')[0];
            if (restElement) continue;

            // Extract pitch
            const pitchElement = noteElement.getElementsByTagName('pitch')[0];
            if (!pitchElement) continue;

            const step = pitchElement.getElementsByTagName('step')[0]?.textContent;
            const octave = pitchElement.getElementsByTagName('octave')[0]?.textContent;
            const alter = pitchElement.getElementsByTagName('alter')[0]?.textContent;

            if (!step || !octave) continue;

            // Build pitch string
            let pitch = step;
            if (alter) {
                const alterValue = parseInt(alter);
                if (alterValue > 0) pitch += '#'.repeat(alterValue);
                if (alterValue < 0) pitch += 'b'.repeat(Math.abs(alterValue));
            }

            // Extract duration
            const durationElement = noteElement.getElementsByTagName('duration')[0];
            const duration = durationElement ? parseInt(durationElement.textContent) : 1;

            // Check if grace note
            const graceElement = noteElement.getElementsByTagName('grace')[0];
            const isGrace = !!graceElement;

            // Extract lyrics
            const lyricElement = noteElement.getElementsByTagName('lyric')[0];
            let lyric = '';
            if (lyricElement) {
                const textElement = lyricElement.getElementsByTagName('text')[0];
                lyric = textElement ? textElement.textContent.trim() : '';
            }

            // Extract slur information
            const slurElements = noteElement.getElementsByTagName('slur');
            let slurType = null;
            if (slurElements.length > 0) {
                slurType = slurElements[0].getAttribute('type'); // 'start' or 'stop'
            }

            // Extract tie information
            const tieElements = noteElement.getElementsByTagName('tie');
            let tieType = null;
            if (tieElements.length > 0) {
                tieType = tieElements[0].getAttribute('type'); // 'start' or 'stop'
            }

            notes.push({
                pitch: pitch,
                step: step,
                octave: parseInt(octave),
                alter: alter,
                duration: duration,
                isGrace: isGrace,
                lyric: lyric,
                slurType: slurType,
                tieType: tieType,
                index: i
            });
        }

        return notes;
    }

    /**
     * Detect optimal tuning system based on note frequencies
     */
    detectOptimalTuning(notes) {
        const pitchCounts = {};

        notes.forEach(note => {
            const pitchClass = note.step;
            pitchCounts[pitchClass] = (pitchCounts[pitchClass] || 0) + 1;
        });

        // Get top 5 most frequent pitches
        const topPitches = Object.entries(pitchCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([pitch,]) => pitch);

        // Match to tuning systems
        for (const [tuningName, tuningNotes] of Object.entries(this.tuningSystems)) {
            const matches = tuningNotes.filter(note => topPitches.includes(note.replace(/[b#]/, ''))).length;
            if (matches >= 4) {
                return tuningName;
            }
        }

        return 'C-D-E-G-A'; // Default
    }

    /**
     * Count bent notes for a given tuning
     */
    countBentNotes(notes, tuning) {
        const tuningNotes = this.tuningSystems[tuning] || this.tuningSystems['C-D-E-G-A'];
        const tuningPitchClasses = tuningNotes.map(n => n.replace(/[b#]/, ''));

        return notes.filter(note => {
            const pitchClass = note.step;
            return !tuningPitchClasses.includes(pitchClass);
        }).length;
    }
}

// Run if called directly
if (require.main === module) {
    const processor = new BatchProcessorPreserveNames();
    processor.processAll();
}

module.exports = BatchProcessorPreserveNames;