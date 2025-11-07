/**
 * V4 Relationships Generator
 * Creates word-to-note mapping from MusicXML and LLM lyrics segmentation
 *
 * Rules:
 * - Each syllable maps to 1+ notes (most common: 1, melisma: multiple)
 * - Grace notes belong to their main note's syllable
 * - Multiple syllables NEVER share one note
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const DataLoader = require('./utils/data-loader');

class V4RelationshipsGenerator {
    constructor() {
        this.parser = new xml2js.Parser();
        this.dataLoader = new DataLoader(__dirname);
    }

    async generateRelationships(songName) {
        console.log(`\n[V4 Relationships] Generating for: ${songName}`);

        // Convert to backend ID (lowercase-hyphen-no-tones)
        const backendId = this.dataLoader.toBackendId(songName);
        console.log(`[V4 Relationships] Backend ID: ${backendId}`);

        // Load MusicXML using data-loader (handles naming automatically)
        const musicXML = this.dataLoader.loadMusicXML(songName);
        if (!musicXML) {
            throw new Error(`MusicXML not found for song: ${songName}`);
        }
        const parsedXML = await this.parser.parseStringPromise(musicXML);

        // Load LLM lyrics segmentation using data-loader
        const lyricsData = this.dataLoader.loadLyricsSegmentation(songName);
        if (!lyricsData) {
            throw new Error(`Lyrics segmentation not found for song: ${songName}`);
        }

        // Extract notes and tempo from MusicXML
        const { notes: extractedNotes, tempo } = this.extractNotes(parsedXML);
        console.log(`[V4 Relationships] Extracted ${extractedNotes.length} total notes`);

        // Convert slurs/ties to single notes (hard-coded rule)
        let notes = this.convertSlursToTies(extractedNotes);
        console.log(`[V4 Relationships] After slur-to-tie conversion: ${notes.length} notes`);

        // Map syllables to notes (pass tempo to be included in metadata)
        const relationships = this.mapSyllablesToNotes(notes, lyricsData, tempo);
        console.log(`[V4 Relationships] Mapped ${relationships.wordToNoteMap.length} syllables to notes`);

        // Save relationships using backend ID
        const outputPath = path.join(__dirname, 'data', 'relationships', `${backendId}-relationships.json`);
        this.ensureDirectoryExists(path.dirname(outputPath));
        fs.writeFileSync(outputPath, JSON.stringify(relationships, null, 2));
        console.log(`[V4 Relationships] Saved to: ${outputPath}\n`);

        return relationships;
    }

    extractNotes(parsedXML) {
        const notes = [];
        let noteIndex = 0;
        let measureNumber = 1;

        const parts = parsedXML['score-partwise'].part;
        if (!parts || parts.length === 0) {
            throw new Error('No parts found in MusicXML');
        }

        const part = parts[0]; // First part (main melody)
        const measures = part.measure;

        // Extract divisions value (for duration normalization)
        // In MusicXML: divisions = number of divisions per quarter note
        let divisions = 1; // Default fallback
        if (measures[0] && measures[0].attributes && measures[0].attributes[0] && measures[0].attributes[0].divisions) {
            divisions = parseInt(measures[0].attributes[0].divisions[0]);
            console.log(`[V4 Relationships] Divisions: ${divisions} per quarter note`);
        }

        // Extract initial tempo from first measure's direction/sound elements
        let tempo = null; // Default: use audio controller's default (60 BPM)
        for (const measure of measures) {
            if (measure.direction) {
                for (const direction of measure.direction) {
                    if (direction.sound && direction.sound[0].$ && direction.sound[0].$.tempo) {
                        tempo = parseInt(direction.sound[0].$.tempo);
                        console.log(`[V4 Relationships] Found tempo: ${tempo} BPM`);
                        break;
                    }
                }
                if (tempo) break;
            }
        }

        for (const measure of measures) {
            measureNumber = parseInt(measure.$.number) || measureNumber;
            const measureNotes = measure.note || [];

            for (const noteData of measureNotes) {
                // Skip rests
                if (noteData.rest) continue;

                // Determine if grace note
                const isGrace = !!noteData.grace;

                // Extract pitch
                const pitch = noteData.pitch ? {
                    step: noteData.pitch[0].step[0],
                    octave: parseInt(noteData.pitch[0].octave[0]),
                    alter: noteData.pitch[0].alter ? parseInt(noteData.pitch[0].alter[0]) : 0
                } : null;

                if (!pitch) continue;

                // Include accidental in pitch name
                const accidental = pitch.alter === -1 ? 'b' : (pitch.alter === 1 ? '#' : '');
                const fullNote = `${pitch.step}${accidental}${pitch.octave}`;

                // Extract duration (grace notes have no duration in MusicXML)
                // Normalize: rawDuration / divisions = quarter notes (1 = quarter, 0.5 = eighth, etc.)
                const rawDuration = isGrace ? 0 : (noteData.duration ? parseFloat(noteData.duration[0]) : 0);
                const duration = rawDuration / divisions;

                // Extract lyrics (handle both plain strings and formatted text objects)
                let lyrics = null;
                if (noteData.lyric && noteData.lyric[0] && noteData.lyric[0].text) {
                    const textData = noteData.lyric[0].text[0];
                    // Handle formatted text: {"_":"Xô:","$":{"font-weight":"bold"}}
                    if (typeof textData === 'object' && textData._) {
                        lyrics = textData._;
                    } else if (typeof textData === 'string') {
                        lyrics = textData;
                    }
                }

                // Check for ties/slurs
                const notations = noteData.notations || [];
                let hasTieStart = false;
                let hasTieStop = false;
                let hasSlurStart = false;
                let hasSlurStop = false;

                for (const notation of notations) {
                    if (notation.tied) {
                        for (const tie of notation.tied) {
                            if (tie.$.type === 'start') hasTieStart = true;
                            if (tie.$.type === 'stop') hasTieStop = true;
                        }
                    }
                    if (notation.slur) {
                        for (const slur of notation.slur) {
                            if (slur.$.type === 'start') hasSlurStart = true;
                            if (slur.$.type === 'stop') hasSlurStop = true;
                        }
                    }
                }

                notes.push({
                    id: `note_${noteIndex}`,
                    index: noteIndex,
                    measureNumber,
                    pitch: fullNote,
                    duration,
                    isGrace,
                    lyrics,
                    hasTieStart,
                    hasTieStop,
                    hasSlurStart,
                    hasSlurStop
                });

                noteIndex++;
            }
        }

        return { notes, tempo };
    }

    /**
     * Convert slurs/ties to single notes
     * Hard-coded rule: Same pitch + same syllable (or 2nd has no syllable) + slur/tie → combine
     */
    convertSlursToTies(notes) {
        const convertedNotes = [];
        let i = 0;

        while (i < notes.length) {
            const currentNote = notes[i];

            // Check if next note should be tied to this one
            if (i + 1 < notes.length) {
                const nextNote = notes[i + 1];

                // Rule: Combine if same pitch AND (same syllable OR nextNote has no syllable) AND has tie/slur
                const samePitch = currentNote.pitch === nextNote.pitch;
                const sameSyllable = !currentNote.isGrace && !nextNote.isGrace &&
                    (currentNote.lyrics === nextNote.lyrics || !nextNote.lyrics);
                const hasTieOrSlur = nextNote.hasTieStop || nextNote.hasSlurStop;

                if (samePitch && sameSyllable && hasTieOrSlur) {
                    // Combine: sum durations, keep first note's syllable
                    const combinedNote = {
                        ...currentNote,
                        duration: currentNote.duration + nextNote.duration,
                        hasTieStop: nextNote.hasTieStop,
                        hasSlurStop: nextNote.hasSlurStop
                    };
                    console.log(`  Tied: ${currentNote.id} + ${nextNote.id} → ${currentNote.pitch} (${combinedNote.duration})`);
                    convertedNotes.push(combinedNote);
                    i += 2; // Skip both notes
                    continue;
                }
            }

            // No tie/slur, keep note as-is
            convertedNotes.push(currentNote);
            i++;
        }

        // Re-index notes
        return convertedNotes.map((note, index) => ({
            ...note,
            id: `note_${index}`,
            index: index
        }));
    }

    mapSyllablesToNotes(notes, lyricsData, tempo = null) {
        const wordToNoteMap = [];
        const noteToWordMap = {};

        // SIMPLE APPROACH: Just use lyrics directly from MusicXML (already in each note)
        // Don't try to match with LLM phrases - just map what's there
        const notesWithLyrics = notes.filter(n => n.lyrics);
        console.log(`[V4 Relationships] ${notesWithLyrics.length} notes with lyrics (from MusicXML)`);

        // Process each note with lyrics
        for (let i = 0; i < notesWithLyrics.length; i++) {
            const mainNote = notesWithLyrics[i];
            const syllable = mainNote.lyrics.trim();

            // Collect melisma notes (tied notes after this one with no lyrics)
            const syllableNotes = [mainNote];
            let checkIndex = mainNote.index + 1;
            while (checkIndex < notes.length) {
                const nextNote = notes[checkIndex];
                if (nextNote.isGrace) {
                    checkIndex++;
                    continue;
                }
                if (!nextNote.lyrics && (nextNote.hasTieStop || nextNote.hasSlurStop)) {
                    syllableNotes.push(nextNote);
                    checkIndex++;
                } else {
                    break;
                }
            }

            // Find grace notes immediately before this note
            const graceNotesBefore = [];
            for (let j = mainNote.index - 1; j >= 0; j--) {
                if (notes[j].isGrace) {
                    graceNotesBefore.unshift(notes[j]);
                } else {
                    break;
                }
            }

            // Find grace notes immediately after this note
            const graceNotesAfter = [];
            for (let j = mainNote.index + 1; j < notes.length; j++) {
                if (notes[j].isGrace) {
                    if (notes[j].hasSlurStop && !notes[j].hasSlurStart) {
                        graceNotesAfter.push(notes[j]);
                    } else if (notes[j].hasSlurStart && !notes[j].hasSlurStop) {
                        break;
                    } else {
                        graceNotesAfter.push(notes[j]);
                    }
                } else {
                    break;
                }
            }

            // All notes for this syllable
            const allNotesForSyllable = [
                ...graceNotesBefore,
                ...syllableNotes,
                ...graceNotesAfter
            ];

            // Detect tone and rhyme from syllable
            const tone = this.detectTone(syllable);
            const rhymeFamily = this.getRhymeFamily(syllable);

            // Store for later phrase assignment
            const mapping = {
                phraseId: null,  // Will be assigned based on LLM phrases
                wordIndex: i,  // Position in sequence
                syllable,
                tone,  // Vietnamese tone (ngang, sắc, huyền, hỏi, ngã, nặng)
                rhymeFamily,  // Rhyme ending (i, a, u, ơ, ô, etc.)
                translation: null,  // Will be extracted from LLM wordMapping
                phraseType: null,  // Will be set from LLM phrase.type
                noteIds: allNotesForSyllable.map(n => n.id),
                mainNoteId: mainNote.id,
                hasGraceNotes: graceNotesBefore.length > 0 || graceNotesAfter.length > 0,
                graceNotesBefore: graceNotesBefore.map(n => n.id),
                graceNotesAfter: graceNotesAfter.map(n => n.id),
                isMelisma: syllableNotes.length > 1,
                melismaNotes: syllableNotes.length > 1 ? syllableNotes.slice(1).map(n => n.id) : []
            };

            wordToNoteMap.push(mapping);
        }

        // Assign phrase IDs and translations based on LLM segmentation
        console.log(`[V4 Relationships] Assigning LLM phrase boundaries...`);
        let syllableIndex = 0;
        for (const phrase of lyricsData.phrases) {
            // Count actual words in text instead of using incorrect syllableCount field
            const actualSyllableCount = phrase.text.split(/\s+/).filter(s => s && s.length > 0).length;
            console.log(`  Phrase ${phrase.id}: ${actualSyllableCount} syllables (${phrase.type}) [syllableCount field claimed: ${phrase.syllableCount}]`);

            for (let i = 0; i < actualSyllableCount && syllableIndex < wordToNoteMap.length; i++) {
                const mapping = wordToNoteMap[syllableIndex];

                // Assign phrase info
                mapping.phraseId = phrase.id;
                mapping.phraseType = phrase.type;

                // Match translation by syllable text (not by index)
                // LLM groups multi-syllable words ("ới hỡi") but MusicXML has individual syllables ("ới", "hỡi")
                if (phrase.wordMapping && phrase.wordMapping.length > 0) {
                    const syllableText = mapping.syllable.toLowerCase().replace(/[.,;!?]/g, '').trim();

                    // Try exact match first
                    let matchingWord = phrase.wordMapping.find(w =>
                        w.vn.toLowerCase().replace(/[.,;!?]/g, '').trim() === syllableText
                    );

                    // If no exact match, try partial match (syllable is part of word)
                    if (!matchingWord) {
                        matchingWord = phrase.wordMapping.find(w => {
                            const wordSyllables = w.vn.toLowerCase().replace(/[.,;!?]/g, '').trim().split(/\s+/);
                            return wordSyllables.includes(syllableText);
                        });
                    }

                    if (matchingWord) {
                        mapping.translation = matchingWord.en;
                    }
                }

                syllableIndex++;
            }
        }

        console.log(`[V4 Relationships] Assigned ${syllableIndex}/${wordToNoteMap.length} syllables to ${lyricsData.phrases.length} phrases`);

        // Now create reverse mapping (note → word) with correct phrase IDs
        for (const mapping of wordToNoteMap) {
            for (const noteId of mapping.noteIds) {
                const note = notes.find(n => n.id === noteId);
                noteToWordMap[noteId] = {
                    phraseId: mapping.phraseId,
                    wordIndex: mapping.wordIndex,
                    syllable: mapping.syllable,
                    tone: mapping.tone,  // Vietnamese tone
                    rhymeFamily: mapping.rhymeFamily,  // Rhyme ending
                    translation: mapping.translation,
                    phraseType: mapping.phraseType,
                    isMainNote: noteId === mapping.mainNoteId,
                    isGraceNote: note?.isGrace || false,
                    isMelismaNote: mapping.melismaNotes.includes(noteId)
                };
            }
        }

        return {
            metadata: {
                songName: lyricsData.songTitle,
                totalNotes: notes.length,
                mainNotes: notes.filter(n => !n.isGrace).length,
                graceNotes: notes.filter(n => n.isGrace).length,
                totalSyllables: wordToNoteMap.length,
                melismaCount: wordToNoteMap.filter(m => m.isMelisma).length,
                tempo: tempo,  // BPM from MusicXML (null if not found)
                generatedDate: new Date().toISOString()
            },
            wordToNoteMap,
            noteToWordMap,
            notes // Full note data for reference
        };
    }

    normalizeSyllable(syllable) {
        // Handle non-string inputs
        if (!syllable || typeof syllable !== 'string') {
            console.warn(`[V4 Relationships] WARNING: Invalid syllable (not a string): ${JSON.stringify(syllable)}`);
            return '';
        }
        // Remove diacritics, punctuation, and lowercase for matching
        return syllable.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[,\.!?;:]/g, '')  // Remove punctuation
            .trim();
    }

    /**
     * Detect Vietnamese tone from syllable
     */
    detectTone(syllable) {
        // ✅ CHECK TONED VOWELS FIRST (order matters!)
        // Then default to 'ngang' if no tone marks found
        const toneMap = {
            'sắc': /[áắấéếíóốớúứý]/,   // Rising - check first
            'huyền': /[àằầèềìòồờùừỳ]/,  // Falling - check first
            'hỏi': /[ảẳẩẻểỉỏổởủửỷ]/,   // Broken - check first
            'ngã': /[ãẵẫẽễĩõỗỡũữỹ]/,   // Sharp - check first
            'nặng': /[ạặậẹệịọộợụựỵ]/   // Heavy - check first
        };

        for (const [tone, pattern] of Object.entries(toneMap)) {
            if (pattern.test(syllable)) {
                return tone;
            }
        }
        return 'ngang'; // Default to level tone (no marks)
    }

    /**
     * Extract rhyme family from Vietnamese syllable
     */
    getRhymeFamily(syllable) {
        // Remove tone marks to get rhyme core
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

        let normalized = syllable.toLowerCase();
        for (const [toned, base] of Object.entries(toneMap)) {
            normalized = normalized.replace(new RegExp(toned, 'g'), base);
        }

        // Simple rhyme families (ending sound)
        const rhymeFamilies = {
            'i': /[iy]$/,
            'a': /a$/,
            'u': /u$/,
            'ơ': /ơ$/,
            'ô': /ô$/,
            'e': /e$/,
            'ê': /ê$/,
            'o': /o$/,
            'ư': /ư$/,
            'ôi': /ôi$/,
            'ơi': /ơi$/,
            'oi': /oi$/,
            'ai': /ai$/,
            'ao': /ao$/,
            'ay': /ay$/,
            'ây': /ây$/,
            'an': /an$/,
            'ăn': /ăn$/,
            'ân': /ân$/,
            'ang': /ang$/,
            'ăng': /ăng$/,
            'âng': /âng$/,
            'anh': /anh$/,
            'ănh': /ănh$/,
            'ên': /ên$/,
            'inh': /inh$/,
            'on': /on$/,
            'ông': /ông$/,
            'ong': /ong$/,
            'um': /um$/,
            'un': /un$/,
            'ung': /ung$/,
            'ương': /ương$/
        };

        for (const [family, pattern] of Object.entries(rhymeFamilies)) {
            if (pattern.test(normalized)) {
                return family;
            }
        }

        return 'other';
    }

    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}

// CLI usage
if (require.main === module) {
    const songName = process.argv[2] || 'Bà rằng bà rí';
    const generator = new V4RelationshipsGenerator();

    generator.generateRelationships(songName)
        .then(() => {
            console.log('[V4 Relationships] Generation complete!');
            process.exit(0);
        })
        .catch(err => {
            console.error('[V4 Relationships] Error:', err);
            process.exit(1);
        });
}

module.exports = V4RelationshipsGenerator;