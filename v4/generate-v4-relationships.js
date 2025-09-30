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

class V4RelationshipsGenerator {
    constructor() {
        this.parser = new xml2js.Parser();
    }

    async generateRelationships(songName) {
        console.log(`\n[V4 Relationships] Generating for: ${songName}`);

        // Load MusicXML
        const musicXMLPath = path.join(__dirname, 'data', 'musicxml', `${songName}.musicxml.xml`);
        const musicXML = fs.readFileSync(musicXMLPath, 'utf-8');
        const parsedXML = await this.parser.parseStringPromise(musicXML);

        // Load LLM lyrics segmentation
        const lyricsPath = path.join(__dirname, 'data', 'lyrics', `${songName}-segmented.json`);
        const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf-8'));

        // Extract notes from MusicXML
        const notes = this.extractNotes(parsedXML);
        console.log(`[V4 Relationships] Extracted ${notes.length} total notes`);

        // Map syllables to notes
        const relationships = this.mapSyllablesToNotes(notes, lyricsData);
        console.log(`[V4 Relationships] Mapped ${relationships.wordToNoteMap.length} syllables to notes`);

        // Save relationships
        const outputPath = path.join(__dirname, 'data', 'relationships', `${songName}-relationships.json`);
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

                const fullNote = `${pitch.step}${pitch.octave}`;

                // Extract duration (grace notes have no duration in MusicXML)
                const duration = isGrace ? 0 : (noteData.duration ? parseFloat(noteData.duration[0]) : 0);

                // Extract lyrics
                const lyrics = noteData.lyric && noteData.lyric[0] && noteData.lyric[0].text ?
                    noteData.lyric[0].text[0] : null;

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

        return notes;
    }

    mapSyllablesToNotes(notes, lyricsData) {
        const wordToNoteMap = [];
        const noteToWordMap = {};

        // Get all notes with lyrics (non-grace notes that have syllables)
        const notesWithLyrics = notes.filter(n => !n.isGrace && n.lyrics);
        console.log(`[V4 Relationships] ${notesWithLyrics.length} notes with lyrics`);

        let globalNoteIndex = 0;  // Track position across ALL notes with lyrics

        for (const phrase of lyricsData.phrases) {
            const phraseId = phrase.id;
            const words = phrase.wordMapping || [];

            console.log(`[V4 Relationships] Phrase ${phraseId}: "${phrase.text}" (${words.length} words)`);

            for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
                const word = words[wordIdx];
                const syllable = word.vn;

                // Find the next note with this syllable, starting from current position
                let matchFound = false;
                let mainNote = null;

                for (let i = globalNoteIndex; i < notesWithLyrics.length; i++) {
                    const n = notesWithLyrics[i];
                    if (n.lyrics && this.normalizeSyllable(n.lyrics) === this.normalizeSyllable(syllable)) {
                        mainNote = n;
                        globalNoteIndex = i + 1;  // Move to next position for next word
                        matchFound = true;
                        break;
                    }
                }

                if (!matchFound) {
                    console.warn(`[V4 Relationships] WARNING: Could not find note for syllable "${syllable}" in phrase ${phraseId}`);
                    console.warn(`[V4 Relationships]   Looking for normalized: "${this.normalizeSyllable(syllable)}"`);
                    console.warn(`[V4 Relationships]   Available from index ${globalNoteIndex}: ${notesWithLyrics.slice(globalNoteIndex, globalNoteIndex + 5).map(n => this.normalizeSyllable(n.lyrics || '')).join(', ')}`);
                    continue;
                }

                // Collect all notes for this syllable (main note + any following tied/slurred notes + grace notes)
                const syllableNotes = [mainNote];

                // Find grace notes immediately before this note
                const graceNotesBefore = [];
                for (let i = mainNote.index - 1; i >= 0; i--) {
                    if (notes[i].isGrace) {
                        graceNotesBefore.unshift(notes[i]);
                    } else {
                        break;
                    }
                }

                // Find grace notes immediately after this note
                const graceNotesAfter = [];
                for (let i = mainNote.index + 1; i < notes.length; i++) {
                    if (notes[i].isGrace) {
                        graceNotesAfter.push(notes[i]);
                    } else {
                        break;
                    }
                }

                // Check for melisma (tied/slurred notes after main note with no lyrics)
                let checkIndex = mainNote.index + 1;
                while (checkIndex < notes.length) {
                    const nextNote = notes[checkIndex];

                    // Stop if we hit a grace note (handled separately)
                    if (nextNote.isGrace) {
                        checkIndex++;
                        continue;
                    }

                    // Stop if next note has lyrics (new syllable)
                    if (nextNote.lyrics) break;

                    // Check if tied or slurred from previous note
                    const prevNote = notes[checkIndex - 1];
                    if ((prevNote.hasTieStart && nextNote.hasTieStop) ||
                        (prevNote.hasSlurStart && nextNote.hasSlurStop)) {
                        syllableNotes.push(nextNote);
                        checkIndex++;
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

                // Create mapping
                const mapping = {
                    phraseId,
                    wordIndex: wordIdx,
                    syllable,
                    translation: word.en,
                    noteIds: allNotesForSyllable.map(n => n.id),
                    mainNoteId: mainNote.id,
                    hasGraceNotes: graceNotesBefore.length > 0 || graceNotesAfter.length > 0,
                    graceNotesBefore: graceNotesBefore.map(n => n.id),
                    graceNotesAfter: graceNotesAfter.map(n => n.id),
                    isMelisma: syllableNotes.length > 1,
                    melismaNotes: syllableNotes.length > 1 ? syllableNotes.slice(1).map(n => n.id) : []
                };

                wordToNoteMap.push(mapping);

                // Reverse mapping (note → word)
                for (const note of allNotesForSyllable) {
                    noteToWordMap[note.id] = {
                        phraseId,
                        wordIndex: wordIdx,
                        syllable,
                        translation: word.en,
                        isMainNote: note.id === mainNote.id,
                        isGraceNote: note.isGrace,
                        isMelismaNote: syllableNotes.includes(note) && note.id !== mainNote.id
                    };
                }

                // globalNoteIndex already incremented in the loop above
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
                generatedDate: new Date().toISOString()
            },
            wordToNoteMap,
            noteToWordMap,
            notes // Full note data for reference
        };
    }

    normalizeSyllable(syllable) {
        // Remove diacritics, punctuation, and lowercase for matching
        return syllable.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[,\.!?;:]/g, '')  // Remove punctuation
            .trim();
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