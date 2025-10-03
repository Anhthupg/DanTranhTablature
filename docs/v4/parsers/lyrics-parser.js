/**
 * Lyrics Parser - Extract lyrics from MusicXML files
 *
 * Extracts all lyrics with syllable-to-note correlations for Vietnamese folk songs
 */

const fs = require('fs');
const xml2js = require('xml2js');

class LyricsParser {
    constructor() {
        this.parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true
        });
    }

    /**
     * Parse MusicXML file and extract lyrics with note correlations
     * @param {string} filePath - Path to MusicXML file
     * @returns {Promise<Object>} Parsed lyrics data
     */
    async parseMusicXML(filePath) {
        try {
            const xmlContent = fs.readFileSync(filePath, 'utf-8');
            const result = await this.parser.parseStringPromise(xmlContent);

            const scorePartwise = result['score-partwise'];
            const title = this.extractTitle(scorePartwise);
            const parts = Array.isArray(scorePartwise.part) ? scorePartwise.part : [scorePartwise.part];

            // Extract notes and lyrics from all parts
            const notesAndLyrics = this.extractNotesAndLyrics(parts);

            return {
                title,
                notes: notesAndLyrics.notes,
                lyricLines: notesAndLyrics.lyricLines,
                rawLyrics: notesAndLyrics.rawLyrics
            };
        } catch (error) {
            console.error(`Error parsing MusicXML file ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Extract title from MusicXML
     */
    extractTitle(scorePartwise) {
        if (scorePartwise['movement-title']) {
            return scorePartwise['movement-title'];
        }

        // Try credit elements
        if (scorePartwise.credit) {
            const credits = Array.isArray(scorePartwise.credit) ? scorePartwise.credit : [scorePartwise.credit];
            const titleCredit = credits.find(c => c['credit-type'] === 'title');
            if (titleCredit && titleCredit['credit-words']) {
                return titleCredit['credit-words'];
            }
        }

        return 'Untitled';
    }

    /**
     * Extract notes and lyrics from all parts
     */
    extractNotesAndLyrics(parts) {
        const notes = [];
        const lyricLines = {}; // Keyed by lyric number (1, 2, etc.)
        const rawLyrics = [];

        let noteIndex = 0;

        parts.forEach(part => {
            const measures = Array.isArray(part.measure) ? part.measure : [part.measure];

            measures.forEach(measure => {
                if (!measure.note) return;

                const measureNotes = Array.isArray(measure.note) ? measure.note : [measure.note];

                measureNotes.forEach(noteElement => {
                    const note = this.parseNote(noteElement, noteIndex);
                    notes.push(note);

                    // Extract lyrics if present
                    if (noteElement.lyric) {
                        const lyrics = Array.isArray(noteElement.lyric) ? noteElement.lyric : [noteElement.lyric];

                        lyrics.forEach(lyricElement => {
                            const lyricNumber = lyricElement.number || '1';
                            const lyricText = lyricElement.text || '';
                            const syllabic = lyricElement.syllabic || 'single';

                            if (!lyricLines[lyricNumber]) {
                                lyricLines[lyricNumber] = [];
                            }

                            lyricLines[lyricNumber].push({
                                text: lyricText,
                                syllabic,
                                noteIndex,
                                notePitch: note.pitch,
                                noteDuration: note.duration,
                                isGrace: note.isGrace
                            });

                            rawLyrics.push(lyricText);
                        });
                    }

                    // Only increment for non-grace notes
                    if (!note.isGrace) {
                        noteIndex++;
                    }
                });
            });
        });

        return { notes, lyricLines, rawLyrics };
    }

    /**
     * Parse a single note element
     */
    parseNote(noteElement, index) {
        const isGrace = !!noteElement.grace;
        const isRest = !!noteElement.rest;

        let pitch = null;
        if (!isRest && noteElement.pitch) {
            const step = noteElement.pitch.step;
            const octave = noteElement.pitch.octave;
            const alter = noteElement.pitch.alter || 0;
            pitch = `${step}${octave}`;
            if (alter) {
                pitch += alter > 0 ? '#' : 'b';
            }
        }

        // Calculate duration in quarter notes
        const duration = isGrace ? 0.125 : (parseInt(noteElement.duration) || 0) / 12; // Assuming divisions=12

        // Check for slurs
        const hasSlur = this.checkForSlur(noteElement);

        return {
            index,
            pitch,
            duration,
            isGrace,
            isRest,
            hasSlur,
            type: noteElement.type || 'unknown'
        };
    }

    /**
     * Check if note has slur notations
     */
    checkForSlur(noteElement) {
        if (!noteElement.notations) return false;

        const notations = Array.isArray(noteElement.notations) ? noteElement.notations : [noteElement.notations];

        for (const notation of notations) {
            if (notation.slur) {
                return true;
            }
        }

        return false;
    }

    /**
     * Correlate lyrics with notes to create syllable objects
     * @param {Array} notes - Array of note objects
     * @param {Object} lyricLines - Lyric lines keyed by number
     * @returns {Array} Array of syllable objects
     */
    correlateLyricsWithNotes(notes, lyricLines) {
        const syllables = [];

        // Use lyric line 1 as primary
        const primaryLyrics = lyricLines['1'] || [];

        primaryLyrics.forEach((lyric, sylIndex) => {
            const noteIndex = lyric.noteIndex;
            const note = notes[noteIndex];

            if (!note) {
                console.warn(`Note at index ${noteIndex} not found for syllable "${lyric.text}"`);
                return;
            }

            // Check if this is part of a melisma (one syllable, multiple notes)
            const syllableNotes = [noteIndex];
            const syllableDurations = [note.duration];

            // Look ahead for tied/slurred notes with no lyrics
            let nextIndex = noteIndex + 1;
            while (nextIndex < notes.length) {
                const nextNote = notes[nextIndex];
                const nextLyric = primaryLyrics.find(l => l.noteIndex === nextIndex);

                // If next note has slur from previous and no new lyric, it's part of melisma
                if (nextNote.hasSlur && !nextLyric) {
                    syllableNotes.push(nextIndex);
                    syllableDurations.push(nextNote.duration);
                    nextIndex++;
                } else {
                    break;
                }
            }

            const syllable = {
                text: lyric.text,
                noteIndices: syllableNotes,
                noteDurations: syllableDurations,
                isMelisma: syllableNotes.length > 1,
                syllableIndex: sylIndex,
                syllabic: lyric.syllabic,
                pitch: note.pitch
            };

            syllables.push(syllable);
        });

        return syllables;
    }

    /**
     * Get complete lyrics as a single string
     * @param {Object} lyricLines - Lyric lines
     * @param {number} lineNumber - Which lyric line to use (default: 1)
     * @returns {string} Complete lyrics text
     */
    getCompleteLyrics(lyricLines, lineNumber = '1') {
        const lyrics = lyricLines[lineNumber] || [];
        return lyrics.map(l => l.text).join(' ');
    }
}

module.exports = LyricsParser;