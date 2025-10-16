/**
 * Pattern Analyzer - Tier 2 Pattern Calculation
 *
 * Analyzes musical and linguistic patterns across dimensions:
 * - KPIC: Key Pitch In Context (pitch transitions + positions)
 * - KDIC: Key Duration In Context (duration transitions + positions)
 * - KTIC: Key Tone In Context (Vietnamese tone transitions + positions)
 * - KSIC: Key Syllable In Context (syllable positioning - Vietnamese)
 * - KRIC: Key Rhyme In Context (rhyme positions + key rhyme identification)
 * - Context patterns: Pronouns, modifiers, reduplication
 */

const fs = require('fs');
const path = require('path');
const DataLoader = require('./utils/data-loader');

class PatternAnalyzer {
    constructor() {
        // Initialize DataLoader for name resolution (V4.3.5)
        this.dataLoader = new DataLoader(__dirname);

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
     * @param {string} songName - Backend ID or display name
     */
    async analyzeSong(songName) {
        console.log(`\n[Pattern Analyzer] Analyzing: ${songName}`);

        // Convert to backend ID for consistent file naming (V4.3.5)
        const backendId = this.dataLoader.toBackendId(songName);
        if (!backendId) {
            throw new Error(`Failed to resolve song name: ${songName}`);
        }
        console.log(`[Pattern Analyzer] Backend ID: ${backendId}`);

        // Load relationships (note-to-word mappings) - uses backend ID
        const relPath = path.join(__dirname, 'data', 'relationships', `${backendId}-relationships.json`);
        if (!fs.existsSync(relPath)) {
            throw new Error(`Missing relationships: ${backendId}-relationships.json`);
        }
        const relationships = JSON.parse(fs.readFileSync(relPath, 'utf-8'));

        // Load lyrics segmentation - uses backend ID
        const lyricsPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${backendId}.json`);
        if (!fs.existsSync(lyricsPath)) {
            throw new Error(`Missing lyrics segmentation: ${backendId}.json`);
        }
        const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf-8'));

        // Load MusicXML - use DataLoader to find correct filename (V4.3.5)
        const musicXML = this.dataLoader.loadMusicXML(backendId);
        if (!musicXML) {
            throw new Error(`Failed to load MusicXML for ${backendId}`);
        }
        console.log(`[Pattern Analyzer] Loaded MusicXML successfully`);
        const notes = await this.extractNotesFromMusicXML(musicXML);

        const patterns = {
            songName: lyricsData.songTitle || songName,  // Use display name from lyrics
            backendId,  // V4.3.5: Add backend ID for reference
            generatedDate: new Date().toISOString(),

            // KPIC: Pitch patterns
            kpic: this.analyzeKPIC(relationships, notes),

            // KDIC: Duration patterns (main notes + grace notes separate)
            kdic: this.analyzeKDIC(relationships, notes),

            // KTIC: Tone patterns (uses relationships for correct tone data)
            ktic: this.analyzeKTIC(relationships),

            // KSIC: Key Syllable In Context
            // Note: Vietnamese uses syllables, not words - "Key Syllable In Context"
            ksic: this.analyzeKSIC(lyricsData, relationships, notes),

            // KRIC: Rhyme patterns (positions + key rhyme identification)
            kric: this.analyzeKRIC(lyricsData),

            // Context patterns
            context: this.analyzeContextPatterns(lyricsData, relationships)
        };

        // Save patterns - use backend ID for filename (V4.3.5)
        const outputPath = path.join(__dirname, 'data', 'patterns', `${backendId}-patterns.json`);
        this.ensureDirectoryExists(path.dirname(outputPath));
        fs.writeFileSync(outputPath, JSON.stringify(patterns, null, 2));
        console.log(`[Pattern Analyzer] Saved patterns to: ${outputPath}`);

        return patterns;
    }

    /**
     * KPIC: Key Pitch In Context
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
     * KDIC: Key Duration In Context
     * Analyzes duration transitions AND positions - SEPARATE grace notes from main notes
     */
    analyzeKDIC(relationships, notes) {
        const mainRhythms = {
            twoNote: {},
            threeNote: {}
        };

        const graceRhythms = {
            twoNote: {},
            threeNote: {}
        };

        const mainPositions = {
            beginning: {},  // { "2": 15, "1": 8 } (2=8th, 1=quarter)
            middle: {},
            ending: {}      // { "4": 12, "2": 10 } (4=half, 2=8th)
        };

        const gracePositions = {
            beginning: {},  // { "g8th": 5, "g16th": 2 }
            middle: {},
            ending: {}
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

        // Transition analysis for main notes
        for (let i = 0; i < mainNotes.length - 1; i++) {
            const pattern2 = `${mainNotes[i].duration}→${mainNotes[i+1].duration}`;
            mainRhythms.twoNote[pattern2] = (mainRhythms.twoNote[pattern2] || 0) + 1;

            if (i < mainNotes.length - 2) {
                const pattern3 = `${mainNotes[i].duration}→${mainNotes[i+1].duration}→${mainNotes[i+2].duration}`;
                mainRhythms.threeNote[pattern3] = (mainRhythms.threeNote[pattern3] || 0) + 1;
            }
        }

        // Position analysis for main notes (which durations at phrase beginning/middle/ending)
        // Use relationships to map back to phrase positions
        for (let i = 0; i < relationships.wordToNoteMap.length; i++) {
            const mapping = relationships.wordToNoteMap[i];
            const mainNote = noteMap[mapping.mainNoteId];

            if (!mainNote || mainNote.isGrace) continue;

            // Determine phrase position (simplified: first/last 2 syllables of song)
            let position;
            if (i < 2) {
                position = 'beginning';
            } else if (i >= relationships.wordToNoteMap.length - 2) {
                position = 'ending';
            } else {
                position = 'middle';
            }

            const durationType = this.getDurationName(mainNote.duration);
            mainPositions[position][durationType] = (mainPositions[position][durationType] || 0) + 1;
        }

        // Process GRACE notes separately
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
                positions: {
                    beginning: this.sortByFrequency(mainPositions.beginning),
                    middle: this.sortByFrequency(mainPositions.middle),
                    ending: this.sortByFrequency(mainPositions.ending)
                },
                statistics: {
                    totalNotes: mainNotes.length,
                    uniqueTwoNotePatterns: Object.keys(mainRhythms.twoNote).length,
                    uniqueThreeNotePatterns: Object.keys(mainRhythms.threeNote).length,
                    uniqueBeginningDurations: Object.keys(mainPositions.beginning).length,
                    uniqueMiddleDurations: Object.keys(mainPositions.middle).length,
                    uniqueEndingDurations: Object.keys(mainPositions.ending).length
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
     * Convert duration value to readable name
     */
    getDurationName(duration) {
        const durationMap = {
            0.125: '32nd',
            0.25: '16th',
            0.5: '8th',
            1: 'quarter',
            2: 'half',
            3: 'dotted-half',
            4: 'whole',
            8: 'double-whole'
        };

        return durationMap[duration] || `${duration}`;
    }

    /**
     * KSIC: Key Syllable In Context
     * Three separate analyses: lyrics-based, rhythm-based, pitch-based
     * (Vietnamese uses syllables, not words)
     */
    analyzeKSIC(lyricsData, relationships, notes) {
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

        // Track total occurrences from RELATIONSHIPS (individual syllables)
        const totalOccurrences = {};

        // Count from relationships.wordToNoteMap (individual syllables as they appear in music)
        for (const mapping of relationships.wordToNoteMap) {
            if (mapping.syllable) {
                const syllableLower = mapping.syllable.toLowerCase().replace(/[.,;!?]/g, '').trim();
                totalOccurrences[syllableLower] = (totalOccurrences[syllableLower] || 0) + 1;
            }
        }

        // Track phrase positions from LLM wordMapping (for phrase analysis)
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

        // Also track multi-syllable sequences from relationships (actual sung syllables)
        const multiSyllableSequences = {
            twoSyllable: {},
            threeSyllable: {}
        };

        // Get clean syllables from relationships
        const cleanSyllables = relationships.wordToNoteMap.map(m =>
            m.syllable ? m.syllable.toLowerCase().replace(/[.,;!?]/g, '').trim() : ''
        ).filter(s => s);

        // 2-syllable sequences
        for (let i = 0; i < cleanSyllables.length - 1; i++) {
            const sequence = `${cleanSyllables[i]} ${cleanSyllables[i + 1]}`;
            multiSyllableSequences.twoSyllable[sequence] = (multiSyllableSequences.twoSyllable[sequence] || 0) + 1;
        }

        // 3-syllable sequences
        for (let i = 0; i < cleanSyllables.length - 2; i++) {
            const sequence = `${cleanSyllables[i]} ${cleanSyllables[i + 1]} ${cleanSyllables[i + 2]}`;
            multiSyllableSequences.threeSyllable[sequence] = (multiSyllableSequences.threeSyllable[sequence] || 0) + 1;
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
                totalOccurrences: this.sortByFrequency(totalOccurrences),
                twoSyllableSequences: this.sortByFrequency(multiSyllableSequences.twoSyllable),
                threeSyllableSequences: this.sortByFrequency(multiSyllableSequences.threeSyllable),
                statistics: {
                    uniqueBeginningWords: Object.keys(lyricsPositions.beginning).length,
                    uniqueMiddleWords: Object.keys(lyricsPositions.middle).length,
                    uniqueEndingWords: Object.keys(lyricsPositions.ending).length,
                    uniqueSyllables: Object.keys(totalOccurrences).length,
                    totalSyllables: Object.values(totalOccurrences).reduce((sum, count) => sum + count, 0),
                    uniqueTwoSyllableSequences: Object.keys(multiSyllableSequences.twoSyllable).length,
                    uniqueThreeSyllableSequences: Object.keys(multiSyllableSequences.threeSyllable).length
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
     * KTIC: Key Tone In Context
     * Analyzes Vietnamese tone transitions
     * ✅ Uses relationships.wordToNoteMap (same source as matcher)
     */
    analyzeKTIC(relationships) {
        const toneSequences = {
            twoTone: {},
            threeTone: {}
        };

        // Get tones from relationships (already correctly detected)
        const tones = relationships.wordToNoteMap
            .filter(mapping => mapping.tone)  // Only syllables with tones
            .map(mapping => mapping.tone);

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

        return {
            twoTonePatterns: this.sortByFrequency(toneSequences.twoTone),
            threeTonePatterns: this.sortByFrequency(toneSequences.threeTone),
            statistics: {
                totalSyllablesWithTones: tones.length,
                uniqueTwoTonePatterns: Object.keys(toneSequences.twoTone).length,
                uniqueThreeTonePatterns: Object.keys(toneSequences.threeTone).length
            }
        };
    }

    /**
     * KRIC: Key Rhyme In Context
     * Analyzes which rhyme families occur at phrase positions + identifies key rhymes
     */
    analyzeKRIC(lyricsData) {
        const positions = {
            beginning: {},  // { "ôi-family": 12, "a-family": 8 }
            middle: {},
            ending: {}      // { "ôi-family": 18, "ang-family": 7 }
        };

        for (const phrase of lyricsData.phrases) {
            const words = phrase.wordMapping || [];
            const totalWords = words.length;

            words.forEach((word, index) => {
                // Extract rhyme family (vowel + final consonant, tone-independent)
                const rhymeFamily = this.getRhymeFamily(word.vn);

                // Determine position
                let position;
                if (index === 0) {
                    position = 'beginning';
                } else if (index === totalWords - 1) {
                    position = 'ending';
                } else {
                    position = 'middle';
                }

                // Count frequency
                positions[position][rhymeFamily] = (positions[position][rhymeFamily] || 0) + 1;
            });
        }

        return {
            beginningRhymes: this.sortByFrequency(positions.beginning),
            middleRhymes: this.sortByFrequency(positions.middle),
            endingRhymes: this.sortByFrequency(positions.ending),
            keyRhymes: this.identifyKeyRhymes(positions),
            statistics: {
                uniqueBeginningRhymes: Object.keys(positions.beginning).length,
                uniqueMiddleRhymes: Object.keys(positions.middle).length,
                uniqueEndingRhymes: Object.keys(positions.ending).length
            }
        };
    }

    /**
     * Extract rhyme family from Vietnamese syllable
     * Removes tone marks and classifies into 60+ rhyme families
     */
    getRhymeFamily(syllable) {
        // Remove tone marks to get rhyme core
        const normalized = this.removeTones(syllable.toLowerCase());

        // Vietnamese rhyme families (60+ patterns)
        const rhymeFamilies = {
            'a': /^.*[aă]$/,
            'â': /^.*â$/,
            'e': /^.*e$/,
            'ê': /^.*ê$/,
            'i': /^.*[iy]$/,
            'o': /^.*o$/,
            'ô': /^.*ô$/,
            'ơ': /^.*ơ$/,
            'u': /^.*u$/,
            'ư': /^.*ư$/,
            'ai': /^.*ai$/,
            'ao': /^.*ao$/,
            'ay': /^.*ay$/,
            'ây': /^.*ây$/,
            'eo': /^.*eo$/,
            'êu': /^.*êu$/,
            'ia': /^.*ia$/,
            'iê': /^.*iê$/,
            'iu': /^.*iu$/,
            'oa': /^.*oa$/,
            'oă': /^.*oă$/,
            'oe': /^.*oe$/,
            'oi': /^.*oi$/,
            'ôi': /^.*ôi$/,
            'ơi': /^.*ơi$/,
            'ua': /^.*ua$/,
            'uâ': /^.*uâ$/,
            'ui': /^.*ui$/,
            'ưa': /^.*ưa$/,
            'ưi': /^.*ưi$/,
            'ươ': /^.*ươ$/,
            'uô': /^.*uô$/,
            'uy': /^.*uy$/,
            'ưu': /^.*ưu$/,
            'an': /^.*[aă]n$/,
            'ăn': /^.*ăn$/,
            'âm': /^.*âm$/,
            'ân': /^.*ân$/,
            'ang': /^.*ang$/,
            'ăng': /^.*ăng$/,
            'âng': /^.*âng$/,
            'anh': /^.*anh$/,
            'ănh': /^.*ănh$/,
            'ânh': /^.*ânh$/,
            'em': /^.*em$/,
            'ên': /^.*ên$/,
            'eng': /^.*eng$/,
            'ênh': /^.*ênh$/,
            'im': /^.*im$/,
            'in': /^.*in$/,
            'inh': /^.*inh$/,
            'om': /^.*om$/,
            'on': /^.*on$/,
            'ông': /^.*ông$/,
            'ong': /^.*ong$/,
            'oong': /^.*oong$/,
            'um': /^.*um$/,
            'un': /^.*un$/,
            'ung': /^.*ung$/,
            'uông': /^.*uông$/,
            'ươn': /^.*ươn$/,
            'ương': /^.*ương$/
        };

        for (const [family, pattern] of Object.entries(rhymeFamilies)) {
            if (pattern.test(normalized)) {
                return `${family}-family`;
            }
        }

        return 'other-family';
    }

    /**
     * Remove Vietnamese tone marks to get rhyme core
     */
    removeTones(text) {
        const toneMap = {
            'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
            'ắ': 'ă', 'ằ': 'ă', 'ẳ': 'ă', 'ẵ': 'ă', 'ặ': 'ă',
            'ấ': 'â', 'ầ': 'â', 'ẩ': 'â', 'ẫ': 'â', 'ậ': 'â',
            'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
            'ế': 'ê', 'ề': 'ê', 'ể': 'ê', 'ễ': 'ê', 'ệ': 'ê',
            'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
            'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
            'ố': 'ô', 'ồ': 'ô', 'ổ': 'ô', 'ỗ': 'ô', 'ộ': 'ô',
            'ớ': 'ơ', 'ờ': 'ơ', 'ở': 'ơ', 'ỡ': 'ơ', 'ợ': 'ơ',
            'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
            'ứ': 'ư', 'ừ': 'ư', 'ử': 'ư', 'ữ': 'ư', 'ự': 'ư',
            'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
        };

        let result = text;
        for (const [toned, base] of Object.entries(toneMap)) {
            result = result.replace(new RegExp(toned, 'g'), base);
        }
        return result;
    }

    /**
     * Identify key rhymes: structural, cohesive, ornamental, signature
     */
    identifyKeyRhymes(positions) {
        // Aggregate all rhymes across positions
        const allRhymes = {};
        ['beginning', 'middle', 'ending'].forEach(pos => {
            Object.entries(positions[pos]).forEach(([rhyme, count]) => {
                allRhymes[rhyme] = (allRhymes[rhyme] || 0) + count;
            });
        });

        const total = Object.values(allRhymes).reduce((sum, count) => sum + count, 0);
        const endingTotal = Object.values(positions.ending).reduce((sum, count) => sum + count, 0);

        return {
            structural: Object.entries(allRhymes)
                .filter(([rhyme, count]) => {
                    const endingFreq = (positions.ending[rhyme] || 0) / endingTotal;
                    return endingFreq > 0.75;  // Appears at >75% of phrase endings
                })
                .map(([rhyme, count]) => ({
                    rhyme,
                    count,
                    function: 'phrase_ending',
                    importance: 'high',
                    explanation: 'Marks major phrase boundaries, creates form structure'
                })),

            cohesive: Object.entries(allRhymes)
                .filter(([rhyme, count]) => {
                    const freq = count / total;
                    const linesSpanned = [
                        positions.beginning[rhyme] || 0,
                        positions.middle[rhyme] || 0,
                        positions.ending[rhyme] || 0
                    ].filter(c => c > 0).length;
                    return freq > 0.2 && linesSpanned >= 2;  // Top 20% frequency + spans multiple positions
                })
                .map(([rhyme, count]) => ({
                    rhyme,
                    count,
                    function: 'internal_cohesion',
                    importance: 'medium',
                    explanation: 'Most frequent rhyme, creates unity across lines'
                })),

            ornamental: Object.entries(allRhymes)
                .filter(([rhyme, count]) => count / total < 0.05)  // <5% frequency
                .map(([rhyme, count]) => ({
                    rhyme,
                    count,
                    function: 'decorative',
                    importance: 'low',
                    explanation: 'Rare, decorative variation'
                })),

            signature: (() => {
                // Find rhyme with highest ending position frequency
                const endingRhymes = Object.entries(positions.ending);
                if (endingRhymes.length === 0) return null;

                const [rhyme, count] = endingRhymes.reduce((max, curr) =>
                    curr[1] > max[1] ? curr : max
                );

                return {
                    rhyme,
                    count,
                    reason: 'Defines refrain, appears at all structural cadences',
                    characterization: 'Song ending formula'
                };
            })()
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
