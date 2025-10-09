/**
 * Pattern Analyzer - Tier 2 Pattern Calculation
 *
 * Analyzes musical and linguistic patterns across dimensions:
 * - KPIC: Kinetic Pitch Interval Contour (pitch transitions)
 * - KRIC: Kinetic Rhythm Interval Contour (rhythm transitions)
 * - KWIC: Keyword In Context (word positioning)
 * - KTIC: Kinetic Tone Interval Contour (Vietnamese tone sequences)
 * - Context patterns: Pronouns, modifiers, reduplication
 */

const fs = require('fs');
const path = require('path');

class PatternAnalyzer {
    constructor() {
        // Vietnamese tone markers
        this.toneMap = {
            'ngang': /[aăâeêioôơuưy]/,  // Level (no mark)
            'sắc': /[áắấéếíóốớúứý]/,   // Rising
            'huyền': /[àằầèềìòồờùừỳ]/,  // Falling
            'hỏi': /[ảẳẩẻểỉỏổởủửỷ]/,   // Broken
            'ngã': /[ãẵẫẽễĩõỗỡũữỹ]/,   // Sharp
            'nặng': /[ạặậẹệịọộợụựỵ]/   // Heavy
        };

        // Common pronouns for context patterns
        this.pronouns = ['tôi', 'ta', 'mình', 'em', 'anh', 'chị', 'ông', 'bà'];

        // Common modifiers
        this.modifiers = ['rất', 'lắm', 'quá', 'cùng', 'hết', 'thật'];
    }

    /**
     * Analyze patterns for a single song
     */
    async analyzeSong(songName) {
        console.log(`\n[Pattern Analyzer] Analyzing: ${songName}`);

        // Load relationships (note-to-word mappings)
        const relPath = path.join(__dirname, 'data', 'relationships', `${songName}-relationships.json`);
        const relationships = JSON.parse(fs.readFileSync(relPath, 'utf-8'));

        // Load lyrics segmentation
        const lyricsPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${songName}.json`);
        const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf-8'));

        // Load MusicXML for full note data
        const musicXMLPath = path.join(__dirname, 'data', 'musicxml', `${songName}.musicxml.xml`);
        const musicXML = fs.readFileSync(musicXMLPath, 'utf-8');
        const notes = await this.extractNotesFromMusicXML(musicXML);

        const patterns = {
            songName,
            generatedDate: new Date().toISOString(),

            // KPIC: Pitch patterns
            kpic: this.analyzeKPIC(relationships, notes),

            // KRIC: Rhythm patterns
            kric: this.analyzeKRIC(relationships, notes),

            // KWIC: Word positioning (lyrics-based, rhythm-based, pitch-based)
            kwic: this.analyzeKWIC(lyricsData, relationships, notes),

            // KTIC: Tone patterns
            ktic: this.analyzeKTIC(lyricsData),

            // Context patterns
            context: this.analyzeContextPatterns(lyricsData, relationships)
        };

        // Save patterns
        const outputPath = path.join(__dirname, 'data', 'patterns', `${songName}-patterns.json`);
        this.ensureDirectoryExists(path.dirname(outputPath));
        fs.writeFileSync(outputPath, JSON.stringify(patterns, null, 2));
        console.log(`[Pattern Analyzer] Saved patterns to: ${outputPath}`);

        return patterns;
    }

    /**
     * KPIC: Kinetic Pitch Interval Contour
     * Analyzes pitch transitions (e.g., D4→G4, G4→A4)
     */
    analyzeKPIC(relationships, notes) {
        const intervals = [];
        const pitchSequences = {
            twoNote: {},   // D4→G4
            threeNote: {}  // D4→G4→A4
        };

        // Build note lookup
        const noteMap = {};
        notes.forEach(note => {
            noteMap[note.id] = note;
        });

        // Extract pitch sequences from relationships
        for (let i = 0; i < relationships.wordToNoteMap.length; i++) {
            const mapping = relationships.wordToNoteMap[i];
            const mainNote = noteMap[mapping.mainNoteId];

            if (!mainNote) continue;

            // Get next main note
            if (i < relationships.wordToNoteMap.length - 1) {
                const nextMapping = relationships.wordToNoteMap[i + 1];
                const nextNote = noteMap[nextMapping.mainNoteId];

                if (nextNote) {
                    // Calculate interval
                    const interval = this.calculateInterval(mainNote.pitch, nextNote.pitch);
                    intervals.push(interval);

                    // Track 2-note patterns
                    const pattern2 = `${mainNote.pitch}→${nextNote.pitch}`;
                    pitchSequences.twoNote[pattern2] = (pitchSequences.twoNote[pattern2] || 0) + 1;

                    // Track 3-note patterns
                    if (i < relationships.wordToNoteMap.length - 2) {
                        const thirdMapping = relationships.wordToNoteMap[i + 2];
                        const thirdNote = noteMap[thirdMapping.mainNoteId];

                        if (thirdNote) {
                            const pattern3 = `${mainNote.pitch}→${nextNote.pitch}→${thirdNote.pitch}`;
                            pitchSequences.threeNote[pattern3] = (pitchSequences.threeNote[pattern3] || 0) + 1;
                        }
                    }
                }
            }
        }

        return {
            twoNotePatterns: this.sortByFrequency(pitchSequences.twoNote),
            threeNotePatterns: this.sortByFrequency(pitchSequences.threeNote),
            intervalDistribution: this.categorizeIntervals(intervals),
            statistics: {
                totalTransitions: intervals.length,
                uniqueTwoNotePatterns: Object.keys(pitchSequences.twoNote).length,
                uniqueThreeNotePatterns: Object.keys(pitchSequences.threeNote).length
            }
        };
    }

    /**
     * KRIC: Kinetic Rhythm Interval Contour
     * Analyzes rhythm transitions - SEPARATE grace notes from main notes
     */
    analyzeKRIC(relationships, notes) {
        const mainRhythms = {
            twoNote: {},
            threeNote: {}
        };

        const graceRhythms = {
            twoNote: {},
            threeNote: {}
        };

        const noteMap = {};
        notes.forEach(note => {
            noteMap[note.id] = note;
        });

        // Process MAIN notes separately
        const mainNotes = [];
        for (let i = 0; i < relationships.wordToNoteMap.length; i++) {
            const mapping = relationships.wordToNoteMap[i];
            const mainNote = noteMap[mapping.mainNoteId];
            if (mainNote && !mainNote.isGrace) {
                mainNotes.push(mainNote);
            }
        }

        for (let i = 0; i < mainNotes.length - 1; i++) {
            const pattern2 = `${mainNotes[i].duration}→${mainNotes[i+1].duration}`;
            mainRhythms.twoNote[pattern2] = (mainRhythms.twoNote[pattern2] || 0) + 1;

            if (i < mainNotes.length - 2) {
                const pattern3 = `${mainNotes[i].duration}→${mainNotes[i+1].duration}→${mainNotes[i+2].duration}`;
                mainRhythms.threeNote[pattern3] = (mainRhythms.threeNote[pattern3] || 0) + 1;
            }
        }

        // Process GRACE notes separately (use isGrace flag, ignore duration=0)
        const graceNotes = notes.filter(n => n.isGrace);

        // Group grace notes by type
        const graceByType = {};
        graceNotes.forEach(n => {
            const type = this.classifyGraceNoteType(n);
            if (!graceByType[type]) graceByType[type] = [];
            graceByType[type].push(n);
        });

        // Analyze patterns within each grace type
        for (const [graceType, typeNotes] of Object.entries(graceByType)) {
            for (let i = 0; i < typeNotes.length - 1; i++) {
                const pattern2 = `${graceType}→${graceType}`;
                graceRhythms.twoNote[pattern2] = (graceRhythms.twoNote[pattern2] || 0) + 1;

                if (i < typeNotes.length - 2) {
                    const pattern3 = `${graceType}→${graceType}→${graceType}`;
                    graceRhythms.threeNote[pattern3] = (graceRhythms.threeNote[pattern3] || 0) + 1;
                }
            }
        }

        return {
            mainNotes: {
                twoNotePatterns: this.sortByFrequency(mainRhythms.twoNote),
                threeNotePatterns: this.sortByFrequency(mainRhythms.threeNote),
                statistics: {
                    totalNotes: mainNotes.length,
                    uniqueTwoNotePatterns: Object.keys(mainRhythms.twoNote).length,
                    uniqueThreeNotePatterns: Object.keys(mainRhythms.threeNote).length
                }
            },
            graceNotes: {
                twoNotePatterns: this.sortByFrequency(graceRhythms.twoNote),
                threeNotePatterns: this.sortByFrequency(graceRhythms.threeNote),
                statistics: {
                    totalNotes: graceNotes.length,
                    uniqueTwoNotePatterns: Object.keys(graceRhythms.twoNote).length,
                    uniqueThreeNotePatterns: Object.keys(graceRhythms.threeNote).length
                }
            }
        };
    }

    /**
     * KWIC: Keyword In Context
     * Three separate analyses: lyrics-based, rhythm-based, pitch-based
     */
    analyzeKWIC(lyricsData, relationships, notes) {
        // Build note map
        const noteMap = {};
        notes.forEach(note => {
            noteMap[note.id] = note;
        });

        // 1. LYRICS-BASED: Position in lyrical phrase
        const lyricsPositions = {
            beginning: {},
            middle: {},
            ending: {}
        };

        for (const phrase of lyricsData.phrases) {
            const words = phrase.wordMapping || [];
            const totalWords = words.length;

            words.forEach((word, index) => {
                let position;
                if (totalWords <= 2) {
                    position = index === 0 ? 'beginning' : 'ending';
                } else if (index === 0) {
                    position = 'beginning';
                } else if (index === totalWords - 1) {
                    position = 'ending';
                } else {
                    position = 'middle';
                }

                const wordLower = word.vn.toLowerCase();
                lyricsPositions[position][wordLower] = (lyricsPositions[position][wordLower] || 0) + 1;
            });
        }

        // 2. RHYTHM-BASED: Position in rhythmic pattern
        // Group by rhythmic phrases (sequences with consistent rhythm)
        const rhythmPositions = this.analyzeRhythmicPositions(relationships, noteMap);

        // 3. PITCH-BASED: Position in melodic contour
        // Group by melodic phrases (ascending/descending/static patterns)
        const pitchPositions = this.analyzeMelodicPositions(relationships, noteMap);

        return {
            lyricsBased: {
                beginningWords: this.sortByFrequency(lyricsPositions.beginning),
                middleWords: this.sortByFrequency(lyricsPositions.middle),
                endingWords: this.sortByFrequency(lyricsPositions.ending),
                statistics: {
                    uniqueBeginningWords: Object.keys(lyricsPositions.beginning).length,
                    uniqueMiddleWords: Object.keys(lyricsPositions.middle).length,
                    uniqueEndingWords: Object.keys(lyricsPositions.ending).length
                }
            },
            rhythmBased: rhythmPositions,
            pitchBased: pitchPositions
        };
    }

    /**
     * Analyze words by position in rhythmic patterns
     */
    analyzeRhythmicPositions(relationships, noteMap) {
        const positions = {
            beginning: {},  // First note of rhythmic phrase
            middle: {},     // Middle notes
            ending: {}      // Last note of rhythmic phrase
        };

        // Detect rhythmic phrase boundaries (duration changes or long notes)
        const rhythmicPhrases = [];
        let currentPhrase = [];

        for (let i = 0; i < relationships.wordToNoteMap.length; i++) {
            const mapping = relationships.wordToNoteMap[i];
            const note = noteMap[mapping.mainNoteId];

            if (!note || note.isGrace) continue;

            currentPhrase.push({ syllable: mapping.syllable, duration: note.duration });

            // End phrase on long note (>= 2.0) or significant duration change
            const nextMapping = relationships.wordToNoteMap[i + 1];
            const nextNote = nextMapping ? noteMap[nextMapping.mainNoteId] : null;

            if (note.duration >= 2.0 || !nextNote ||
                (nextNote && Math.abs(nextNote.duration - note.duration) >= 1.0)) {
                if (currentPhrase.length > 0) {
                    rhythmicPhrases.push([...currentPhrase]);
                    currentPhrase = [];
                }
            }
        }

        // Analyze positions within rhythmic phrases
        for (const phrase of rhythmicPhrases) {
            if (phrase.length === 0) continue;

            phrase.forEach((item, index) => {
                let position;
                if (phrase.length <= 2) {
                    position = index === 0 ? 'beginning' : 'ending';
                } else if (index === 0) {
                    position = 'beginning';
                } else if (index === phrase.length - 1) {
                    position = 'ending';
                } else {
                    position = 'middle';
                }

                const wordLower = item.syllable.toLowerCase();
                positions[position][wordLower] = (positions[position][wordLower] || 0) + 1;
            });
        }

        return {
            beginningWords: this.sortByFrequency(positions.beginning),
            middleWords: this.sortByFrequency(positions.middle),
            endingWords: this.sortByFrequency(positions.ending),
            statistics: {
                totalRhythmicPhrases: rhythmicPhrases.length,
                uniqueBeginningWords: Object.keys(positions.beginning).length,
                uniqueMiddleWords: Object.keys(positions.middle).length,
                uniqueEndingWords: Object.keys(positions.ending).length
            }
        };
    }

    /**
     * Analyze words by position in melodic contours
     */
    analyzeMelodicPositions(relationships, noteMap) {
        const positions = {
            beginning: {},  // Start of melodic phrase
            middle: {},     // Middle notes
            ending: {}      // End of melodic phrase
        };

        // Detect melodic phrase boundaries (direction changes or large intervals)
        const melodicPhrases = [];
        let currentPhrase = [];
        let previousPitch = null;
        let currentDirection = null;

        for (let i = 0; i < relationships.wordToNoteMap.length; i++) {
            const mapping = relationships.wordToNoteMap[i];
            const note = noteMap[mapping.mainNoteId];

            if (!note || note.isGrace) continue;

            const pitchValue = this.getPitchValue(note.pitch);

            if (previousPitch !== null) {
                const interval = pitchValue - previousPitch;
                const direction = interval > 0 ? 'ascending' : (interval < 0 ? 'descending' : 'static');

                // End phrase on direction change or large interval (> 5 semitones)
                if ((currentDirection && direction !== currentDirection && direction !== 'static') ||
                    Math.abs(interval) > 5) {
                    if (currentPhrase.length > 0) {
                        melodicPhrases.push([...currentPhrase]);
                        currentPhrase = [];
                        currentDirection = null;
                    }
                }

                if (direction !== 'static') {
                    currentDirection = direction;
                }
            }

            currentPhrase.push({ syllable: mapping.syllable, pitch: note.pitch });
            previousPitch = pitchValue;
        }

        if (currentPhrase.length > 0) {
            melodicPhrases.push(currentPhrase);
        }

        // Analyze positions within melodic phrases
        for (const phrase of melodicPhrases) {
            if (phrase.length === 0) continue;

            phrase.forEach((item, index) => {
                let position;
                if (phrase.length <= 2) {
                    position = index === 0 ? 'beginning' : 'ending';
                } else if (index === 0) {
                    position = 'beginning';
                } else if (index === phrase.length - 1) {
                    position = 'ending';
                } else {
                    position = 'middle';
                }

                const wordLower = item.syllable.toLowerCase();
                positions[position][wordLower] = (positions[position][wordLower] || 0) + 1;
            });
        }

        return {
            beginningWords: this.sortByFrequency(positions.beginning),
            middleWords: this.sortByFrequency(positions.middle),
            endingWords: this.sortByFrequency(positions.ending),
            statistics: {
                totalMelodicPhrases: melodicPhrases.length,
                uniqueBeginningWords: Object.keys(positions.beginning).length,
                uniqueMiddleWords: Object.keys(positions.middle).length,
                uniqueEndingWords: Object.keys(positions.ending).length
            }
        };
    }

    /**
     * Convert pitch notation to numeric value for comparison
     */
    getPitchValue(pitch) {
        const noteValues = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
        const match = pitch.match(/([A-G])([#b]?)(\d+)/);
        if (!match) return 0;

        const [, step, accidental, octave] = match;
        let value = (parseInt(octave) + 1) * 12 + noteValues[step];

        if (accidental === '#') value += 1;
        if (accidental === 'b') value -= 1;

        return value;
    }

    /**
     * Classify grace note type (since MusicXML grace notes have duration=0)
     * Uses visual classification based on standard grace note durations
     */
    classifyGraceNoteType(note) {
        // Grace notes in MusicXML typically have duration=0
        // Classify as acciaccatura (slash) by default
        // In the future, could detect from MusicXML <grace slash="yes"/> attribute
        return 'g8th'; // Default: grace eighth note (most common)
    }

    /**
     * KTIC: Kinetic Tone Interval Contour
     * Analyzes Vietnamese tone sequences
     */
    analyzeKTIC(lyricsData) {
        const toneSequences = {
            twoTone: {},
            threeTone: {}
        };

        for (const phrase of lyricsData.phrases) {
            const words = phrase.wordMapping || [];
            const tones = words.map(word => this.detectTone(word.vn));

            for (let i = 0; i < tones.length - 1; i++) {
                // 2-tone pattern
                const pattern2 = `${tones[i]}→${tones[i+1]}`;
                toneSequences.twoTone[pattern2] = (toneSequences.twoTone[pattern2] || 0) + 1;

                // 3-tone pattern
                if (i < tones.length - 2) {
                    const pattern3 = `${tones[i]}→${tones[i+1]}→${tones[i+2]}`;
                    toneSequences.threeTone[pattern3] = (toneSequences.threeTone[pattern3] || 0) + 1;
                }
            }
        }

        return {
            twoTonePatterns: this.sortByFrequency(toneSequences.twoTone),
            threeTonePatterns: this.sortByFrequency(toneSequences.threeTone),
            statistics: {
                uniqueTwoTonePatterns: Object.keys(toneSequences.twoTone).length,
                uniqueThreeTonePatterns: Object.keys(toneSequences.threeTone).length
            }
        };
    }

    /**
     * Analyze context patterns: pronouns, modifiers, reduplication
     */
    analyzeContextPatterns(lyricsData, relationships) {
        const patterns = {
            pronouns: {},
            modifiers: {},
            reduplication: {}
        };

        for (const phrase of lyricsData.phrases) {
            const words = phrase.wordMapping || [];

            words.forEach((word, index) => {
                const wordLower = word.vn.toLowerCase();

                // Track pronouns
                if (this.pronouns.includes(wordLower)) {
                    const context = this.getContext(words, index);
                    patterns.pronouns[wordLower] = patterns.pronouns[wordLower] || [];
                    patterns.pronouns[wordLower].push(context);
                }

                // Track modifiers
                if (this.modifiers.includes(wordLower)) {
                    const context = this.getContext(words, index);
                    patterns.modifiers[wordLower] = patterns.modifiers[wordLower] || [];
                    patterns.modifiers[wordLower].push(context);
                }

                // Detect reduplication (repeated syllables)
                if (index > 0 && wordLower === words[index - 1].vn.toLowerCase()) {
                    patterns.reduplication[wordLower] = (patterns.reduplication[wordLower] || 0) + 1;
                }
            });
        }

        return {
            pronounUsage: this.summarizeContexts(patterns.pronouns),
            modifierUsage: this.summarizeContexts(patterns.modifiers),
            reduplication: this.sortByFrequency(patterns.reduplication),
            statistics: {
                totalPronouns: Object.keys(patterns.pronouns).length,
                totalModifiers: Object.keys(patterns.modifiers).length,
                totalReduplications: Object.keys(patterns.reduplication).length
            }
        };
    }

    // Helper methods

    extractNotesFromMusicXML(musicXML) {
        // Simplified note extraction (reuse logic from generate-v4-relationships.js)
        const xml2js = require('xml2js');
        const parser = new xml2js.Parser();

        return new Promise((resolve, reject) => {
            parser.parseString(musicXML, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                const notes = [];
                let noteIndex = 0;

                const parts = result['score-partwise'].part;
                if (!parts || parts.length === 0) {
                    resolve(notes);
                    return;
                }

                const part = parts[0];
                const measures = part.measure;

                for (const measure of measures) {
                    const measureNotes = measure.note || [];

                    for (const noteData of measureNotes) {
                        if (noteData.rest) continue;

                        const isGrace = !!noteData.grace;
                        const pitch = noteData.pitch ? noteData.pitch[0] : null;

                        if (!pitch) continue;

                        const step = pitch.step[0];
                        const octave = parseInt(pitch.octave[0]);
                        const alter = pitch.alter ? parseInt(pitch.alter[0]) : 0;
                        const accidental = alter === -1 ? 'b' : (alter === 1 ? '#' : '');
                        const fullNote = `${step}${accidental}${octave}`;

                        const duration = isGrace ? 0 : (noteData.duration ? parseFloat(noteData.duration[0]) : 0);

                        notes.push({
                            id: `note_${noteIndex++}`,
                            pitch: fullNote,
                            duration,
                            isGrace,
                            step,
                            octave,
                            alter
                        });
                    }
                }

                resolve(notes);
            });
        }).then(notes => notes);
    }

    calculateInterval(pitch1, pitch2) {
        const noteValues = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };

        const [, step1, octave1] = pitch1.match(/([A-G][#b]?)(\d+)/);
        const [, step2, octave2] = pitch2.match(/([A-G][#b]?)(\d+)/);

        const baseStep1 = step1[0];
        const baseStep2 = step2[0];

        const midi1 = (parseInt(octave1) + 1) * 12 + noteValues[baseStep1];
        const midi2 = (parseInt(octave2) + 1) * 12 + noteValues[baseStep2];

        return midi2 - midi1;
    }

    categorizeIntervals(intervals) {
        const categories = {
            unison: 0,
            second: 0,
            third: 0,
            fourth: 0,
            fifth: 0,
            larger: 0
        };

        intervals.forEach(interval => {
            const abs = Math.abs(interval);
            if (abs === 0) categories.unison++;
            else if (abs <= 2) categories.second++;
            else if (abs <= 4) categories.third++;
            else if (abs <= 6) categories.fourth++;
            else if (abs <= 8) categories.fifth++;
            else categories.larger++;
        });

        return categories;
    }

    detectTone(syllable) {
        for (const [tone, pattern] of Object.entries(this.toneMap)) {
            if (pattern.test(syllable)) {
                return tone;
            }
        }
        return 'ngang'; // Default to level tone
    }

    getContext(words, index) {
        const before = index > 0 ? words[index - 1].vn : '';
        const after = index < words.length - 1 ? words[index + 1].vn : '';
        return { before, word: words[index].vn, after };
    }

    summarizeContexts(contextMap) {
        const summary = {};
        for (const [word, contexts] of Object.entries(contextMap)) {
            summary[word] = {
                count: contexts.length,
                examples: contexts.slice(0, 3) // First 3 examples
            };
        }
        return summary;
    }

    sortByFrequency(obj) {
        return Object.entries(obj)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});
    }

    ensureDirectoryExists(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}

// CLI usage
if (require.main === module) {
    const songName = process.argv[2];

    if (!songName) {
        console.error('Usage: node pattern-analyzer.js "Song Name"');
        process.exit(1);
    }

    const analyzer = new PatternAnalyzer();
    analyzer.analyzeSong(songName)
        .then(() => {
            console.log('[Pattern Analyzer] Complete!');
        })
        .catch(err => {
            console.error('[Pattern Analyzer] Error:', err);
            process.exit(1);
        });
}

module.exports = PatternAnalyzer;
