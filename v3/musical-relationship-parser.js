/**
 * Musical Relationship Parser for Dan Tranh Tablature V3
 *
 * Complete relationship tracking system for:
 * - Grace note to main note relationships
 * - Melisma detection and lyric spanning
 * - Vietnamese linguistic tone analysis
 * - Translation mappings
 * - Multi-dimensional pattern relationships
 *
 * CRITICAL RULE: Two repeated notes with different lyrics = TWO SEPARATE NOTES (not tied)
 * Only tie when: same pitch + same/no lyrics
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

class MusicalRelationshipParser {
    constructor() {
        // Microtonal tolerance in cents (for matching to nearest pitch class)
        this.MICROTONAL_TOLERANCE = 50; // ±50 cents = quarter-tone tolerance

        // Vietnamese tone diacritics mapping
        this.vietnameseTones = {
            'ngang': ['a', 'e', 'i', 'o', 'u', 'y'], // Level tone (no mark)
            'sắc': ['á', 'é', 'í', 'ó', 'ú', 'ý'],   // Rising tone
            'huyền': ['à', 'è', 'ì', 'ò', 'ù', 'ỳ'],  // Falling tone
            'hỏi': ['ả', 'ẻ', 'ỉ', 'ỏ', 'ủ', 'ỷ'],   // Dipping tone
            'ngã': ['ã', 'ẽ', 'ĩ', 'õ', 'ũ', 'ỹ'],   // Rising glottalized
            'nặng': ['ạ', 'ẹ', 'ị', 'ọ', 'ụ', 'ỵ']   // Low glottalized
        };

        // Common Vietnamese phrase patterns
        this.vietnamesePhrases = {
            questions: ['có', 'bao giờ', 'như thế nào', 'ai', 'gì', 'sao'],
            connectives: ['và', 'với', 'cùng', 'nhưng', 'mà', 'thì'],
            temporal: ['bao giờ', 'khi nào', 'lúc', 'khi', 'đã', 'sẽ', 'đang'],
            spatial: ['đây', 'đó', 'kia', 'trong', 'ngoài', 'trên', 'dưới']
        };

        // Track note relationships
        this.noteRelationships = new Map();
        this.graceMainPairs = [];
        this.melismaGroups = [];
        this.phraseStructure = [];
    }

    /**
     * Get duration type name from duration value
     */
    getDurationType(durationValue) {
        switch(durationValue) {
            case 1: return 'sixteenth';
            case 2: return 'eighth';
            case 3: return 'dotted-eighth';
            case 4: return 'quarter';
            case 6: return 'dotted-quarter';
            case 8: return 'half';
            case 12: return 'dotted-half';
            case 16: return 'whole';
            default: return `duration-${durationValue}`;
        }
    }

    /**
     * Get alteration symbol from MusicXML alter value
     * alter: -2 = bb, -1 = b, 0 = natural, 1 = #, 2 = x/##
     */
    getAlterationSymbol(alter) {
        if (!alter) return '';
        const alterNum = parseInt(alter);
        switch(alterNum) {
            case -2: return 'bb';  // Double flat
            case -1: return 'b';   // Flat
            case 0: return '';     // Natural
            case 1: return '#';    // Sharp
            case 2: return 'x';    // Double sharp (or ##)
            default:
                // Handle microtones (e.g., +0.5 = quarter-sharp, -0.5 = quarter-flat)
                if (alterNum > 0) return `+${Math.round(alterNum * 100)}c`; // +cents
                else return `${Math.round(alterNum * 100)}c`; // -cents
        }
    }

    /**
     * Check if two pitch classes are enharmonically or microtonally equivalent
     */
    arePitchClassesEquivalent(pc1, pc2, tolerance = 50) {
        // Direct match
        if (pc1 === pc2) return true;

        // Extract base note and cents if microtonal
        const parseMicrotonal = (pc) => {
            const match = pc.match(/([A-G])([#bx]*)([+-]?\d+c)?/);
            if (!match) return null;

            const [, note, accidental, cents] = match;
            let totalCents = 0;

            // Calculate cents from accidentals
            if (accidental) {
                if (accidental === '#') totalCents += 100;
                else if (accidental === 'b') totalCents -= 100;
                else if (accidental === 'x' || accidental === '##') totalCents += 200;
                else if (accidental === 'bb') totalCents -= 200;
            }

            // Add microtonal cents
            if (cents) {
                totalCents += parseInt(cents.replace('c', ''));
            }

            return { note, totalCents };
        };

        const p1 = parseMicrotonal(pc1);
        const p2 = parseMicrotonal(pc2);

        if (!p1 || !p2) return false;

        // Calculate semitone positions (C=0, D=2, E=4, F=5, G=7, A=9, B=11)
        const noteToSemitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

        const cents1 = noteToSemitones[p1.note] * 100 + p1.totalCents;
        const cents2 = noteToSemitones[p2.note] * 100 + p2.totalCents;

        // Normalize to 0-1199 range (one octave)
        const norm1 = ((cents1 % 1200) + 1200) % 1200;
        const norm2 = ((cents2 % 1200) + 1200) % 1200;

        // Check if within tolerance
        return Math.abs(norm1 - norm2) <= tolerance;
    }

    /**
     * Main parsing function - extracts all relationships from MusicXML
     */
    parseCompleteRelationships(xmlContent, songName, metadataPath = null) {
        const dom = new JSDOM(xmlContent, { contentType: 'text/xml' });
        const doc = dom.window.document;

        console.log(`\n📊 Parsing relationships for: ${songName}`);

        // Extract all notes with complete context
        const notes = this.extractEnhancedNotes(doc);

        // Try to load tuning from metadata.json if path provided
        let tuning = null;
        if (metadataPath && fs.existsSync(metadataPath)) {
            try {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                tuning = metadata.tuning;
            } catch (e) {
                console.log(`   ⚠️ Could not load tuning from metadata: ${e.message}`);
            }
        }

        // Build relationship structures
        const relationships = {
            metadata: {
                songName,
                parseDate: new Date().toISOString(),
                totalNotes: notes.length,
                mainNotes: notes.filter(n => !n.isGrace).length,
                graceNotes: notes.filter(n => n.isGrace).length,
                tuning: tuning || 'C-D-E-G-A' // Default pentatonic if not found
            },

            // Core relationships
            notes: notes,
            graceNoteRelationships: this.analyzeGraceNoteRelationships(notes),
            melismaRelationships: this.analyzeMelismaSpans(notes),
            lyricStructure: this.analyzeLyricStructure(notes),
            linguisticAnalysis: this.analyzeVietnameseTones(notes),
            patternRelationships: this.analyzeMultiDimensionalPatterns(notes),

            // Tie vs separate note analysis
            tieAnalysis: this.analyzeTiesVsSeparateNotes(notes)
        };

        // Add translation mappings if available
        relationships.translations = this.extractTranslations(notes, songName);

        return relationships;
    }

    /**
     * Extract enhanced note data with all relationships
     */
    extractEnhancedNotes(doc) {
        const notes = [];
        const measures = doc.querySelectorAll('measure');
        let noteId = 0;
        let currentX = 0;

        measures.forEach((measure, measureIndex) => {
            const measureNotes = measure.querySelectorAll('note');
            let graceBuffer = []; // Temporary storage for grace notes

            measureNotes.forEach((noteEl, noteIndex) => {
                const pitch = noteEl.querySelector('pitch');
                const rest = noteEl.querySelector('rest');
                const duration = noteEl.querySelector('duration')?.textContent || '0';
                const isGrace = noteEl.querySelector('grace') !== null;

                // Handle rests - advance timing but don't create note
                if (rest || !pitch) {
                    if (!isGrace) {
                        // Calculate spacing based on duration
                        // Base unit: quarter note (duration=4) = 340px
                        const durationValue = parseInt(duration);
                        let spacing = 0;

                        if (durationValue === 1) spacing = 85;  // Sixteenth
                        else if (durationValue === 2) spacing = 170;  // Eighth
                        else if (durationValue === 3) spacing = 255;  // Dotted eighth
                        else if (durationValue === 4) spacing = 340;  // Quarter
                        else if (durationValue === 6) spacing = 510;  // Dotted quarter
                        else if (durationValue === 8) spacing = 680;  // Half
                        else if (durationValue === 12) spacing = 1020; // Dotted half
                        else if (durationValue === 16) spacing = 1360; // Whole
                        else spacing = durationValue * 85; // Default: proportional

                        currentX += spacing;
                    }
                    return; // Skip creating note object for rests
                }

                const step = pitch.querySelector('step')?.textContent;
                const octave = pitch.querySelector('octave')?.textContent;
                const alter = pitch.querySelector('alter')?.textContent;

                // Lyric handling
                const lyricEl = noteEl.querySelector('lyric text');
                const lyric = lyricEl ? lyricEl.textContent : '';
                const syllabic = noteEl.querySelector('lyric syllabic')?.textContent || 'single';
                const lyricExtend = noteEl.querySelector('lyric extend');

                // Slur detection
                const slurStart = noteEl.querySelector('notations slur[type="start"]');
                const slurStop = noteEl.querySelector('notations slur[type="stop"]');

                // Tie detection (different from slur!)
                const tieStart = noteEl.querySelector('notations tie[type="start"]');
                const tieStop = noteEl.querySelector('notations tie[type="stop"]');

                // Build note object
                const note = {
                    id: `note_${noteId++}`,
                    measureNumber: measureIndex + 1,
                    indexInMeasure: noteIndex,

                    // Pitch information
                    pitch: {
                        step,
                        octave: parseInt(octave),
                        alter: alter ? parseInt(alter) : 0,
                        fullNote: `${step}${this.getAlterationSymbol(alter)}${octave}`,
                        pitchClass: `${step}${this.getAlterationSymbol(alter)}` // Include all alterations in pitch class
                    },

                    // Timing and Duration
                    duration: {
                        value: parseInt(duration),
                        type: this.getDurationType(parseInt(duration))
                    },
                    timing: currentX,
                    isGrace,

                    // Lyrics
                    lyrics: {
                        text: lyric,
                        syllabic,
                        hasExtend: lyricExtend !== null,
                        extendType: lyricExtend?.getAttribute('type')
                    },

                    // Articulation
                    articulation: {
                        hasSlurStart: slurStart !== null,
                        hasSlurStop: slurStop !== null,
                        slurNumber: slurStart?.getAttribute('number'),
                        hasTieStart: tieStart !== null,
                        hasTieStop: tieStop !== null
                    },

                    // Relationships (to be filled)
                    relationships: {
                        graceContext: null,
                        melismaGroup: null,
                        phrasePosition: null,
                        patternContext: null
                    }
                };

                // Handle grace note buffering
                if (isGrace) {
                    graceBuffer.push(note);
                } else {
                    // Attach buffered grace notes to this main note
                    if (graceBuffer.length > 0) {
                        note.relationships.graceContext = {
                            precedingGraceNotes: graceBuffer.map(g => g.id),
                            graceSequence: graceBuffer.map(g => g.pitch.fullNote)
                        };

                        // Update grace notes with their main note reference
                        graceBuffer.forEach(graceNote => {
                            graceNote.relationships.graceContext = {
                                isGrace: true,
                                relatedMainNoteId: note.id,
                                position: 'before'
                            };
                        });

                        graceBuffer = [];
                    }

                    // Update timing based on whether it's a grace note or main note
                    if (!isGrace) {
                        // Main notes: duration-based spacing
                        const durationValue = parseInt(duration);
                        let spacing = 0;

                        if (durationValue === 1) spacing = 85;  // Sixteenth
                        else if (durationValue === 2) spacing = 170;  // Eighth
                        else if (durationValue === 3) spacing = 255;  // Dotted eighth
                        else if (durationValue === 4) spacing = 340;  // Quarter
                        else if (durationValue === 6) spacing = 510;  // Dotted quarter
                        else if (durationValue === 8) spacing = 680;  // Half
                        else if (durationValue === 12) spacing = 1020; // Dotted half
                        else if (durationValue === 16) spacing = 1360; // Whole
                        else spacing = durationValue * 85; // Default: proportional

                        currentX += spacing;
                    } else {
                        // Grace notes get minimal spacing regardless of duration
                        currentX += 25;
                    }
                }

                notes.push(note);
            });
        });

        return notes;
    }

    /**
     * Analyze grace note relationships
     */
    analyzeGraceNoteRelationships(notes) {
        const relationships = [];

        notes.forEach(note => {
            if (note.relationships.graceContext?.precedingGraceNotes) {
                relationships.push({
                    mainNoteId: note.id,
                    mainNotePitch: note.pitch.fullNote,
                    graceNotes: note.relationships.graceContext.precedingGraceNotes,
                    graceSequence: note.relationships.graceContext.graceSequence,
                    type: 'preceding',
                    pattern: this.classifyGracePattern(note.relationships.graceContext.graceSequence)
                });
            }
        });

        console.log(`   ✅ Found ${relationships.length} grace note relationships`);
        return relationships;
    }

    /**
     * Classify grace note patterns
     */
    classifyGracePattern(graceSequence) {
        if (graceSequence.length === 1) {
            return 'single-grace';
        } else if (graceSequence.length === 2) {
            // Check for common patterns
            const [first, second] = graceSequence;
            if (first === second) return 'repeated-grace';
            // Add more pattern detection as needed
            return 'double-grace';
        }
        return `${graceSequence.length}-grace-sequence`;
    }

    /**
     * Analyze melisma spans (one syllable across multiple notes)
     * CRITICAL: Different lyrics = different notes, not melisma!
     */
    analyzeMelismaSpans(notes) {
        const melismaGroups = [];
        let currentMelisma = null;

        notes.forEach((note, index) => {
            const hasLyric = note.lyrics.text && note.lyrics.text.trim();
            const hasExtendStart = note.lyrics.extendType === 'start';
            const hasExtendStop = note.lyrics.extendType === 'stop';

            if (hasLyric && hasExtendStart) {
                // Start of melisma
                currentMelisma = {
                    syllable: note.lyrics.text,
                    startNoteId: note.id,
                    notes: [note.id],
                    durations: [note.duration],
                    pitches: [note.pitch.fullNote]
                };
            } else if (currentMelisma && hasExtendStop) {
                // End of melisma
                currentMelisma.notes.push(note.id);
                currentMelisma.durations.push(note.duration);
                currentMelisma.pitches.push(note.pitch.fullNote);
                currentMelisma.endNoteId = note.id;
                currentMelisma.totalDuration = currentMelisma.durations.reduce((a, b) => a + b, 0);
                currentMelisma.noteCount = currentMelisma.notes.length;

                melismaGroups.push(currentMelisma);
                currentMelisma = null;
            } else if (currentMelisma && !hasLyric) {
                // Continue melisma
                currentMelisma.notes.push(note.id);
                currentMelisma.durations.push(note.duration);
                currentMelisma.pitches.push(note.pitch.fullNote);
            }

            // Mark note as part of melisma
            if (currentMelisma) {
                note.relationships.melismaGroup = {
                    syllable: currentMelisma.syllable,
                    position: currentMelisma.notes.length === 1 ? 'start' : 'middle'
                };
            }
        });

        console.log(`   ✅ Found ${melismaGroups.length} melisma groups`);
        return melismaGroups;
    }

    /**
     * Analyze lyric structure and phrasing
     */
    analyzeLyricStructure(notes) {
        const lyrics = [];
        const phrases = [];
        let currentPhrase = [];

        notes.filter(n => !n.isGrace).forEach(note => {
            if (note.lyrics.text) {
                const word = note.lyrics.text;
                lyrics.push({
                    noteId: note.id,
                    text: word,
                    timing: note.timing,
                    pitch: note.pitch.fullNote
                });

                currentPhrase.push(word);

                // Detect phrase boundaries
                if (this.isPhraseEnd(word)) {
                    phrases.push({
                        text: currentPhrase.join(' '),
                        wordCount: currentPhrase.length,
                        noteIds: lyrics.slice(-currentPhrase.length).map(l => l.noteId)
                    });
                    currentPhrase = [];
                }
            }
        });

        // Add remaining phrase
        if (currentPhrase.length > 0) {
            phrases.push({
                text: currentPhrase.join(' '),
                wordCount: currentPhrase.length,
                noteIds: lyrics.slice(-currentPhrase.length).map(l => l.noteId)
            });
        }

        return {
            allLyrics: lyrics.map(l => l.text).join(' '),
            wordCount: lyrics.length,
            phrases,
            phraseCount: phrases.length
        };
    }

    /**
     * Check if word ends a phrase (Vietnamese punctuation)
     */
    isPhraseEnd(word) {
        return word.match(/[.!?,;:]$/) || word.endsWith('à') || word.endsWith('nhỉ');
    }

    /**
     * Analyze Vietnamese tones in lyrics
     */
    analyzeVietnameseTones(notes) {
        const toneAnalysis = {
            tones: [],
            tonePatterns: [],
            tonalContours: []
        };

        const lyricsWithTones = notes
            .filter(n => !n.isGrace && n.lyrics.text)
            .map(note => {
                const word = note.lyrics.text;
                const tone = this.detectVietnameseTone(word);

                return {
                    noteId: note.id,
                    word,
                    tone,
                    pitch: note.pitch.fullNote
                };
            });

        // Analyze tone sequences
        let toneSequence = [];
        lyricsWithTones.forEach((item, index) => {
            toneSequence.push(item.tone);

            if (toneSequence.length === 3) {
                toneAnalysis.tonePatterns.push({
                    pattern: toneSequence.join('-'),
                    words: lyricsWithTones.slice(index - 2, index + 1).map(i => i.word),
                    noteIds: lyricsWithTones.slice(index - 2, index + 1).map(i => i.noteId)
                });
                toneSequence.shift();
            }
        });

        toneAnalysis.tones = lyricsWithTones;

        // Detect tonal contours (musical pitch following linguistic tone)
        toneAnalysis.tonalContours = this.analyzeTonalContours(lyricsWithTones);

        console.log(`   ✅ Analyzed ${lyricsWithTones.length} Vietnamese tones`);
        return toneAnalysis;
    }

    /**
     * Detect Vietnamese tone from word
     */
    detectVietnameseTone(word) {
        if (!word) return 'none';

        const lowercaseWord = word.toLowerCase();

        for (const [toneName, chars] of Object.entries(this.vietnameseTones)) {
            for (const char of chars) {
                if (lowercaseWord.includes(char)) {
                    return toneName;
                }
            }
        }

        return 'ngang'; // Default level tone
    }

    /**
     * Analyze if musical pitch follows linguistic tone
     */
    analyzeTonalContours(lyricsWithTones) {
        const contours = [];

        for (let i = 1; i < lyricsWithTones.length; i++) {
            const prev = lyricsWithTones[i - 1];
            const curr = lyricsWithTones[i];

            const pitchInterval = this.getPitchInterval(prev.pitch, curr.pitch);
            const toneRelation = this.getToneRelation(prev.tone, curr.tone);

            contours.push({
                words: `${prev.word} → ${curr.word}`,
                tones: `${prev.tone} → ${curr.tone}`,
                pitches: `${prev.pitch} → ${curr.pitch}`,
                pitchInterval,
                toneRelation,
                alignment: this.checkTonePitchAlignment(toneRelation, pitchInterval)
            });
        }

        return contours;
    }

    /**
     * Calculate pitch interval between two notes
     */
    getPitchInterval(pitch1, pitch2) {
        const pitchOrder = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };

        const p1 = pitch1.match(/([A-G][#b]?)(\d+)/);
        const p2 = pitch2.match(/([A-G][#b]?)(\d+)/);

        if (!p1 || !p2) return 'unknown';

        const semitones1 = parseInt(p1[2]) * 12 + (pitchOrder[p1[1]] || 0);
        const semitones2 = parseInt(p2[2]) * 12 + (pitchOrder[p2[1]] || 0);
        const diff = semitones2 - semitones1;

        if (diff > 0) return `rising ${diff}`;
        if (diff < 0) return `falling ${Math.abs(diff)}`;
        return 'same';
    }

    /**
     * Get relationship between two Vietnamese tones
     */
    getToneRelation(tone1, tone2) {
        const toneHeight = {
            'sắc': 3,    // High rising
            'ngã': 2,    // Mid rising
            'ngang': 0,  // Level
            'hỏi': -1,   // Dipping
            'huyền': -2, // Falling
            'nặng': -3   // Low
        };

        const h1 = toneHeight[tone1] || 0;
        const h2 = toneHeight[tone2] || 0;

        if (h2 > h1) return 'ascending';
        if (h2 < h1) return 'descending';
        return 'level';
    }

    /**
     * Check if musical pitch aligns with linguistic tone
     */
    checkTonePitchAlignment(toneRelation, pitchInterval) {
        if (toneRelation === 'ascending' && pitchInterval.includes('rising')) return 'aligned';
        if (toneRelation === 'descending' && pitchInterval.includes('falling')) return 'aligned';
        if (toneRelation === 'level' && pitchInterval === 'same') return 'aligned';
        return 'contrasting';
    }

    /**
     * Analyze multi-dimensional patterns
     */
    analyzeMultiDimensionalPatterns(notes) {
        const patterns = {
            pitchPatterns: [],
            rhythmPatterns: [],
            lyricPatterns: [],
            combinedPatterns: []
        };

        // Extract pattern sequences
        for (let len = 2; len <= 4; len++) {
            for (let i = 0; i <= notes.length - len; i++) {
                const segment = notes.slice(i, i + len);

                // Skip if contains grace notes
                if (segment.some(n => n.isGrace)) continue;

                // Pitch pattern
                const pitchPattern = segment.map(n => n.pitch.pitchClass).join('-');

                // Rhythm pattern
                const rhythmPattern = segment.map(n => {
                    if (n.duration === 0) return 'g'; // grace
                    if (n.duration <= 2) return 'e'; // eighth
                    if (n.duration <= 4) return 'q'; // quarter
                    return 'h'; // half
                }).join('-');

                // Lyric pattern
                const lyricPattern = segment
                    .map(n => n.lyrics.text || '_')
                    .join('-');

                // Combined pattern
                const combined = `${pitchPattern}|${rhythmPattern}|${lyricPattern}`;

                patterns.pitchPatterns.push(pitchPattern);
                patterns.rhythmPatterns.push(rhythmPattern);
                patterns.lyricPatterns.push(lyricPattern);
                patterns.combinedPatterns.push({
                    pattern: combined,
                    noteIds: segment.map(n => n.id),
                    startIndex: i,
                    length: len
                });
            }
        }

        // Find most common patterns
        patterns.topPitchPatterns = this.findTopPatterns(patterns.pitchPatterns);
        patterns.topRhythmPatterns = this.findTopPatterns(patterns.rhythmPatterns);
        patterns.topLyricPatterns = this.findTopPatterns(patterns.lyricPatterns);

        return patterns;
    }

    /**
     * Find most common patterns
     */
    findTopPatterns(patterns, limit = 5) {
        const counts = {};
        patterns.forEach(p => {
            counts[p] = (counts[p] || 0) + 1;
        });

        return Object.entries(counts)
            .filter(([pattern, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([pattern, count]) => ({ pattern, count }));
    }

    /**
     * CRITICAL: Analyze ties vs separate notes
     * Rule: Same pitch + different lyrics = SEPARATE NOTES (not tied)
     */
    analyzeTiesVsSeparateNotes(notes) {
        const analysis = {
            tieSituations: [],
            separateNoteSituations: [],
            totalTies: 0,
            totalSeparateRepeats: 0
        };

        for (let i = 1; i < notes.length; i++) {
            const prev = notes[i - 1];
            const curr = notes[i];

            // Skip grace notes
            if (prev.isGrace || curr.isGrace) continue;

            // Check for same pitch
            if (prev.pitch.fullNote === curr.pitch.fullNote) {
                const prevLyric = prev.lyrics.text?.trim();
                const currLyric = curr.lyrics.text?.trim();

                // CRITICAL LOGIC: Different lyrics = SEPARATE NOTES
                if (prevLyric && currLyric && prevLyric !== currLyric) {
                    analysis.separateNoteSituations.push({
                        noteIds: [prev.id, curr.id],
                        pitch: prev.pitch.fullNote,
                        lyrics: [prevLyric, currLyric],
                        reason: 'DIFFERENT_LYRICS_SAME_PITCH',
                        shouldTie: false
                    });
                    analysis.totalSeparateRepeats++;

                    console.log(`   ⚠️ SEPARATE NOTES: ${prev.pitch.fullNote} "${prevLyric}" → "${currLyric}"`);

                } else if (!currLyric || prevLyric === currLyric) {
                    // Same/no lyrics = potential tie
                    if (prev.articulation.hasTieStart || curr.articulation.hasTieStop ||
                        prev.articulation.hasSlurStart) {
                        analysis.tieSituations.push({
                            noteIds: [prev.id, curr.id],
                            pitch: prev.pitch.fullNote,
                            lyrics: [prevLyric, currLyric],
                            reason: 'SAME_PITCH_SAME_LYRICS',
                            shouldTie: true,
                            combinedDuration: prev.duration + curr.duration
                        });
                        analysis.totalTies++;

                        console.log(`   ✅ TIE: ${prev.pitch.fullNote} "${prevLyric || '(no lyric)'}" tied`);
                    }
                }
            }
        }

        return analysis;
    }

    /**
     * Extract translations (placeholder - would need translation data)
     */
    extractTranslations(notes, songName) {
        // This would connect to a translation database or file
        // For now, return placeholder structure
        return {
            hasTranslation: false,
            originalLanguage: 'Vietnamese',
            targetLanguage: 'English',
            phrases: [],
            notice: 'Translation data not yet implemented - requires translation database'
        };
    }

    /**
     * Save parsed relationships to file
     */
    saveRelationships(relationships, outputPath) {
        const json = JSON.stringify(relationships, null, 2);
        fs.writeFileSync(outputPath, json);
        console.log(`   💾 Saved relationships to: ${outputPath}`);

        // Print summary
        console.log(`\n📊 Relationship Summary:`);
        console.log(`   • Total notes: ${relationships.metadata.totalNotes}`);
        console.log(`   • Main notes: ${relationships.metadata.mainNotes}`);
        console.log(`   • Grace notes: ${relationships.metadata.graceNotes}`);
        console.log(`   • Grace relationships: ${relationships.graceNoteRelationships.length}`);
        console.log(`   • Melisma groups: ${relationships.melismaRelationships.length}`);
        console.log(`   • Lyric phrases: ${relationships.lyricStructure.phraseCount}`);
        console.log(`   • Ties detected: ${relationships.tieAnalysis.totalTies}`);
        console.log(`   • Separate repeated notes: ${relationships.tieAnalysis.totalSeparateRepeats}`);

        return relationships;
    }
}

// Export for use in other modules
module.exports = MusicalRelationshipParser;

// Standalone execution for testing
if (require.main === module) {
    const parser = new MusicalRelationshipParser();

    // Check if a specific file is provided
    const testFile = process.argv[2];

    if (testFile) {
        // Process single file
        console.log(`\n🎵 Testing Musical Relationship Parser`);
        console.log(`   File: ${testFile}`);

        try {
            const xmlContent = fs.readFileSync(testFile, 'utf8');
            const songName = path.basename(testFile, '.musicxml.xml');

            // Try to find metadata.json in the processed folder
            const processedDir = path.join(
                path.dirname(testFile),
                '..',
                'processed',
                songName.replace(/[^a-zA-Z0-9À-ỹ\s]/g, '_')
            );
            const metadataPath = path.join(processedDir, 'metadata.json');

            const relationships = parser.parseCompleteRelationships(xmlContent, songName, metadataPath);

            // Save output
            const outputPath = path.join(
                path.dirname(testFile),
                '..',
                'processed',
                songName.replace(/[^a-zA-Z0-9À-ỹ\s]/g, '_'),
                'relationships.json'
            );

            // Ensure directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            parser.saveRelationships(relationships, outputPath);

        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    } else {
        // Process all MusicXML files
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║              Processing ALL MusicXML Files - Parser v1.0          ║
╚════════════════════════════════════════════════════════════════════╝
`);

        const musicxmlDir = path.join(__dirname, 'data/musicxml');
        const processedDir = path.join(__dirname, 'data/processed');

        if (!fs.existsSync(musicxmlDir)) {
            console.error(`❌ MusicXML directory not found: ${musicxmlDir}`);
            return;
        }

        const xmlFiles = fs.readdirSync(musicxmlDir).filter(file => file.endsWith('.xml'));
        let processed = 0;
        let failed = 0;

        console.log(`🔄 Found ${xmlFiles.length} MusicXML files to process...\n`);

        xmlFiles.forEach(xmlFile => {
            try {
                const xmlPath = path.join(musicxmlDir, xmlFile);
                const xmlContent = fs.readFileSync(xmlPath, 'utf8');
                const songName = path.basename(xmlFile, '.musicxml.xml');

                console.log(`Processing: ${songName}`);

                // Create output directory
                const outputDir = path.join(processedDir, songName);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                // Check for existing metadata
                const metadataPath = path.join(outputDir, 'metadata.json');

                const relationships = parser.parseCompleteRelationships(xmlContent, songName, metadataPath);

                // Save relationships
                const outputPath = path.join(outputDir, 'relationships.json');
                parser.saveRelationships(relationships, outputPath);

                console.log(`✅ Generated: ${songName}/relationships.json`);
                processed++;

            } catch (error) {
                console.log(`❌ Failed: ${xmlFile} - ${error.message}`);
                failed++;
            }
        });

        console.log(`\n🎵 Completed: ${processed} successful, ${failed} failed`);
    }
}