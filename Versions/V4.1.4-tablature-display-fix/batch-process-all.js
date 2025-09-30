/**
 * V4 Batch Processor - Generate Full Tablatures for All 128 Songs
 * Processes all MusicXML files and generates complete tablature data
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

class V4BatchProcessor {
    constructor() {
        this.musicXMLDir = path.join(__dirname, 'data', 'musicxml');
        this.libraryFile = path.join(__dirname, 'data', 'library', 'song-library.json');
        this.outputDir = path.join(__dirname, 'data', 'processed');

        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Process all songs in library
     */
    async processAll() {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   V4 Batch Processor - Full Tablature Generation         ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        // Load library
        const library = JSON.parse(fs.readFileSync(this.libraryFile, 'utf8'));
        console.log(`Found ${library.length} songs in library\n`);

        let processed = 0;
        let errors = 0;

        for (let i = 0; i < library.length; i++) {
            const song = library[i];
            const progress = Math.round((i + 1) / library.length * 100);

            try {
                console.log(`[${i+1}/${library.length}] Processing: ${song.title} (${progress}%)`);
                await this.processSong(song);
                processed++;
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
                errors++;
            }
        }

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log(`║   Processing Complete!                                     ║`);
        console.log(`║   Processed: ${processed}/${library.length} songs`);
        console.log(`║   Errors: ${errors}`);
        console.log('╚════════════════════════════════════════════════════════════╝\n');
    }

    /**
     * Process individual song
     */
    async processSong(songMetadata) {
        const xmlPath = path.join(this.musicXMLDir, songMetadata.filename);

        if (!fs.existsSync(xmlPath)) {
            throw new Error(`MusicXML file not found: ${songMetadata.filename}`);
        }

        // Parse MusicXML
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        // Extract complete note data
        const notes = this.extractCompleteNotes(xmlDoc);

        // Extract lyrics
        const lyrics = this.extractLyrics(xmlDoc);

        // Extract measures
        const measures = this.extractMeasures(xmlDoc);

        // Create complete song data
        const completeData = {
            metadata: songMetadata,
            notes: notes,
            lyrics: lyrics,
            measures: measures,
            processedDate: new Date().toISOString()
        };

        // Save to processed directory
        const safeFilename = this.sanitizeFileName(songMetadata.title);
        const outputPath = path.join(this.outputDir, `${safeFilename}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(completeData, null, 2));

        console.log(`   ✓ Generated: ${safeFilename}.json (${notes.length} notes)`);
    }

    /**
     * Extract complete note data with all attributes
     */
    extractCompleteNotes(xmlDoc) {
        const notes = [];
        const noteElements = xmlDoc.getElementsByTagName('note');

        for (let i = 0; i < noteElements.length; i++) {
            const noteElement = noteElements[i];

            // Skip if it's a rest
            if (noteElement.getElementsByTagName('rest').length > 0) {
                continue;
            }

            const pitchElement = noteElement.getElementsByTagName('pitch')[0];
            if (!pitchElement) continue;

            const step = pitchElement.getElementsByTagName('step')[0]?.textContent;
            const octave = pitchElement.getElementsByTagName('octave')[0]?.textContent;
            const alterElement = pitchElement.getElementsByTagName('alter')[0];
            const alter = alterElement ? parseInt(alterElement.textContent) : 0;

            // Build pitch string
            let pitch = step;
            if (alter > 0) pitch += '#'.repeat(alter);
            if (alter < 0) pitch += 'b'.repeat(Math.abs(alter));
            pitch += octave;

            // Extract duration
            const durationElement = noteElement.getElementsByTagName('duration')[0];
            const duration = durationElement ? parseInt(durationElement.textContent) : 1;

            // Check if grace note
            const isGrace = noteElement.getElementsByTagName('grace').length > 0;

            // Extract lyric if present
            const lyricElement = noteElement.getElementsByTagName('lyric')[0];
            const lyricTextElement = lyricElement?.getElementsByTagName('text')[0];
            const lyric = lyricTextElement?.textContent || '';

            // Check for slur
            const notations = noteElement.getElementsByTagName('notations')[0];
            const slurElements = notations?.getElementsByTagName('slur') || [];
            let slurType = null;
            if (slurElements.length > 0) {
                slurType = slurElements[0].getAttribute('type'); // start, stop, continue
            }

            // Check for tie
            const tieElements = noteElement.getElementsByTagName('tie') || [];
            let tieType = null;
            if (tieElements.length > 0) {
                tieType = tieElements[0].getAttribute('type'); // start, stop
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
     * Extract all lyrics from song
     */
    extractLyrics(xmlDoc) {
        const lyrics = [];
        const lyricElements = xmlDoc.getElementsByTagName('lyric');

        for (let i = 0; i < lyricElements.length; i++) {
            const textElement = lyricElements[i].getElementsByTagName('text')[0];
            if (textElement) {
                lyrics.push(textElement.textContent);
            }
        }

        return lyrics;
    }

    /**
     * Extract measure information
     */
    extractMeasures(xmlDoc) {
        const measures = [];
        const measureElements = xmlDoc.getElementsByTagName('measure');

        for (let i = 0; i < measureElements.length; i++) {
            const measure = measureElements[i];
            const measureNumber = measure.getAttribute('number');

            // Count notes in measure
            const noteElements = measure.getElementsByTagName('note');
            let noteCount = 0;
            for (let j = 0; j < noteElements.length; j++) {
                if (noteElements[j].getElementsByTagName('rest').length === 0) {
                    noteCount++;
                }
            }

            measures.push({
                number: parseInt(measureNumber),
                noteCount: noteCount
            });
        }

        return measures;
    }

    /**
     * Sanitize filename for safe file system usage
     */
    sanitizeFileName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '_')
            .replace(/-+/g, '_')
            .substring(0, 50);
    }
}

// Run if executed directly
if (require.main === module) {
    const processor = new V4BatchProcessor();
    processor.processAll().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = V4BatchProcessor;