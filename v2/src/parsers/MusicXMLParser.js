/**
 * MusicXMLParser.js
 * Parses MusicXML files into Dan Tranh tablature format
 * Handles conversion of Western notation to Vietnamese 16-string zither
 */

export class MusicXMLParser {
    constructor() {
        // Dan Tranh string mapping (pentatonic scale)
        this.stringMapping = {
            'C4': { string: 5, y: 110, note: 'D4' },
            'D4': { string: 5, y: 110, note: 'D4' },
            'E4': { string: 7, y: 260, note: 'G4' },
            'F4': { string: 7, y: 260, note: 'G4' },
            'G4': { string: 7, y: 260, note: 'G4' },
            'A4': { string: 8, y: 320, note: 'A4' },
            'B4': { string: 9, y: 410, note: 'C5' },
            'C5': { string: 9, y: 410, note: 'C5' },
            'D5': { string: 10, y: 470, note: 'D5' },
            'E5': { string: 11, y: 530, note: 'E5' },
            'F5': { string: 11, y: 530, note: 'E5' },
            'G5': { string: 12, y: 620, note: 'G5' },
            'A5': { string: 12, y: 620, note: 'G5' },
        };

        this.currentX = 120; // Starting X position
        this.noteSpacing = 85; // Default spacing between notes
    }

    /**
     * Parse MusicXML file content
     */
    async parse(xmlContent) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Invalid MusicXML file: ' + parseError.textContent);
        }

        // Extract metadata
        const metadata = this.extractMetadata(xmlDoc);

        // Extract parts (instruments/voices)
        const parts = xmlDoc.querySelectorAll('part');
        const notes = [];
        const sections = [];
        const lyrics = [];

        parts.forEach((part, partIndex) => {
            const measures = part.querySelectorAll('measure');

            measures.forEach((measure, measureIndex) => {
                const measureNotes = this.parseMeasure(measure, measureIndex);
                notes.push(...measureNotes);

                // Extract lyrics if present
                const measureLyrics = this.extractLyrics(measure);
                lyrics.push(...measureLyrics);
            });
        });

        // Process ornamentations and grace notes
        this.processOrnamentations(notes);

        // Analyze patterns
        const patterns = this.analyzePatterns(notes);

        // Generate sections based on measures
        const sectionsData = this.generateSections(notes, xmlDoc);

        return {
            metadata,
            notes,
            sections: sectionsData,
            patterns,
            lyrics,
            strings: this.getStringConfiguration()
        };
    }

    /**
     * Extract metadata from MusicXML
     */
    extractMetadata(xmlDoc) {
        const work = xmlDoc.querySelector('work');
        const identification = xmlDoc.querySelector('identification');

        return {
            title: work?.querySelector('work-title')?.textContent || 'Untitled',
            composer: identification?.querySelector('composer')?.textContent || 'Unknown',
            encoder: identification?.querySelector('encoder')?.textContent || 'MusicXML',
            copyright: identification?.querySelector('rights')?.textContent || '',
            source: 'MusicXML',
            extractedAt: new Date().toISOString()
        };
    }

    /**
     * Parse a measure into notes
     */
    parseMeasure(measure, measureIndex) {
        const notes = [];
        const noteElements = measure.querySelectorAll('note');

        noteElements.forEach((noteEl, noteIndex) => {
            // Skip if it's a rest
            if (noteEl.querySelector('rest')) {
                this.currentX += this.noteSpacing / 2;
                return;
            }

            // Extract pitch
            const pitch = this.extractPitch(noteEl);
            if (!pitch) return;

            // Map to Dan Tranh string
            const stringInfo = this.mapToString(pitch);
            if (!stringInfo) return;

            // Extract duration
            const duration = this.extractDuration(noteEl);

            // Check if grace note
            const isGrace = noteEl.querySelector('grace') !== null;

            // Create note object
            const note = {
                id: notes.length,
                x: this.currentX,
                y: stringInfo.y,
                baseX: this.currentX,
                baseY: stringInfo.y,
                string: stringInfo.string,
                pitch: stringInfo.note,
                originalPitch: pitch,
                duration: duration,
                isGrace: isGrace,
                radius: isGrace ? 6 : 12,
                measure: measureIndex + 1,
                beat: noteIndex + 1
            };

            notes.push(note);

            // Advance X position based on duration
            if (!isGrace) {
                this.currentX += this.noteSpacing * duration;
            } else {
                this.currentX += this.noteSpacing / 4;
            }
        });

        return notes;
    }

    /**
     * Extract pitch from note element
     */
    extractPitch(noteEl) {
        const step = noteEl.querySelector('pitch > step')?.textContent;
        const octave = noteEl.querySelector('pitch > octave')?.textContent;
        const alter = noteEl.querySelector('pitch > alter')?.textContent;

        if (!step || !octave) return null;

        let pitch = step + octave;
        if (alter === '1') pitch += '#';
        if (alter === '-1') pitch += 'b';

        return pitch;
    }

    /**
     * Extract duration from note element
     */
    extractDuration(noteEl) {
        const duration = noteEl.querySelector('duration')?.textContent;
        const type = noteEl.querySelector('type')?.textContent;

        // Convert to relative duration (quarter note = 1)
        const divisions = 1; // Default, should be extracted from attributes
        const quarterDuration = parseFloat(duration) / divisions;

        return quarterDuration || 1;
    }

    /**
     * Map Western pitch to Dan Tranh string
     */
    mapToString(pitch) {
        // Remove accidentals for simplified mapping
        const simplifiedPitch = pitch.replace('#', '').replace('b', '');

        // Find closest match
        return this.stringMapping[simplifiedPitch] || this.findClosestString(pitch);
    }

    /**
     * Find closest string for unmapped pitches
     */
    findClosestString(pitch) {
        // Extract note and octave
        const note = pitch[0];
        const octave = parseInt(pitch[1]);

        // Default to middle strings
        if (octave < 4) return this.stringMapping['D4'];
        if (octave > 5) return this.stringMapping['G5'];

        return this.stringMapping['C5']; // Default to C5
    }

    /**
     * Process ornamentations and grace notes
     */
    processOrnamentations(notes) {
        notes.forEach((note, index) => {
            if (note.isGrace && index < notes.length - 1) {
                // Grace notes typically ornament the next note
                const nextNote = notes[index + 1];
                if (nextNote && !nextNote.isGrace) {
                    note.ornamentsNote = nextNote.id;
                    nextNote.hasOrnament = true;
                }
            }
        });
    }

    /**
     * Extract lyrics from measure
     */
    extractLyrics(measure) {
        const lyrics = [];
        const lyricElements = measure.querySelectorAll('lyric');

        lyricElements.forEach(lyricEl => {
            const syllable = lyricEl.querySelector('text')?.textContent;
            const syllabic = lyricEl.querySelector('syllabic')?.textContent;
            const number = lyricEl.getAttribute('number') || '1';

            if (syllable) {
                lyrics.push({
                    text: syllable,
                    syllabic: syllabic, // begin, middle, end, single
                    verse: number
                });
            }
        });

        return lyrics;
    }

    /**
     * Analyze patterns in the notes
     */
    analyzePatterns(notes) {
        const patterns = {
            kpic: {},
            kric: {},
            ornaments: {
                graceNotes: notes.filter(n => n.isGrace).length,
                trills: 0,
                glissandos: 0
            }
        };

        // KPIC-2 (two-note pitch patterns)
        patterns.kpic[2] = this.findPitchPatterns(notes, 2);
        patterns.kpic[3] = this.findPitchPatterns(notes, 3);

        // KRIC-2 (two-note rhythm patterns)
        patterns.kric[2] = this.findRhythmPatterns(notes, 2);

        return patterns;
    }

    /**
     * Find pitch patterns of given length
     */
    findPitchPatterns(notes, length) {
        const patterns = new Map();
        const regularNotes = notes.filter(n => !n.isGrace);

        for (let i = 0; i <= regularNotes.length - length; i++) {
            const pattern = regularNotes.slice(i, i + length).map(n => n.pitch);
            const key = pattern.join('-');

            if (!patterns.has(key)) {
                patterns.set(key, {
                    pattern: pattern,
                    positions: [],
                    count: 0
                });
            }

            patterns.get(key).positions.push(i);
            patterns.get(key).count++;
        }

        return Array.from(patterns.values())
            .filter(p => p.count > 1)
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Find rhythm patterns of given length
     */
    findRhythmPatterns(notes, length) {
        const patterns = new Map();
        const regularNotes = notes.filter(n => !n.isGrace);

        for (let i = 0; i <= regularNotes.length - length; i++) {
            const pattern = regularNotes.slice(i, i + length).map(n => n.duration);
            const key = pattern.join('-');

            if (!patterns.has(key)) {
                patterns.set(key, {
                    pattern: pattern,
                    positions: [],
                    count: 0
                });
            }

            patterns.get(key).positions.push(i);
            patterns.get(key).count++;
        }

        return Array.from(patterns.values())
            .filter(p => p.count > 1)
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Generate sections based on measures and patterns
     */
    generateSections(notes, xmlDoc) {
        const sections = [];
        const measuresPerSection = 4; // Default grouping

        // Group notes by measures
        const notesByMeasure = {};
        notes.forEach(note => {
            if (!notesByMeasure[note.measure]) {
                notesByMeasure[note.measure] = [];
            }
            notesByMeasure[note.measure].push(note);
        });

        // Create sections
        const measures = Object.keys(notesByMeasure).map(Number).sort((a, b) => a - b);

        for (let i = 0; i < measures.length; i += measuresPerSection) {
            const sectionMeasures = measures.slice(i, i + measuresPerSection);
            const sectionNotes = sectionMeasures.flatMap(m => notesByMeasure[m] || []);

            if (sectionNotes.length > 0) {
                sections.push({
                    id: `section_${sections.length + 1}`,
                    name: `Section ${sections.length + 1}`,
                    measures: sectionMeasures,
                    noteRange: [
                        sectionNotes[0].id,
                        sectionNotes[sectionNotes.length - 1].id
                    ],
                    noteCount: sectionNotes.length
                });
            }
        }

        return sections;
    }

    /**
     * Get Dan Tranh string configuration
     */
    getStringConfiguration() {
        return [
            { number: 5, note: 'D4', y: 110, frequency: 293.66 },
            { number: 7, note: 'G4', y: 260, frequency: 392.00 },
            { number: 8, note: 'A4', y: 320, frequency: 440.00 },
            { number: 9, note: 'C5', y: 410, frequency: 523.25 },
            { number: 10, note: 'D5', y: 470, frequency: 587.33 },
            { number: 11, note: 'E5', y: 530, frequency: 659.25 },
            { number: 12, note: 'G5', y: 620, frequency: 783.99 }
        ];
    }

    /**
     * Validate parsed data
     */
    validate(data) {
        const errors = [];

        if (!data.notes || data.notes.length === 0) {
            errors.push('No notes found in MusicXML file');
        }

        if (!data.metadata.title) {
            errors.push('No title found in metadata');
        }

        // Check for note positioning issues
        const invalidNotes = data.notes.filter(n => !n.x || !n.y);
        if (invalidNotes.length > 0) {
            errors.push(`${invalidNotes.length} notes have invalid positions`);
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: []
        };
    }
}

// Factory function
export function createMusicXMLParser() {
    return new MusicXMLParser();
}