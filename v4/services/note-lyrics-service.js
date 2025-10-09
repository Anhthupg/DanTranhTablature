// Note Lyrics Service - Handles syllable-to-note mapping with X positions
// Loads notes-annotated data and merges with positioned notes from tablature

const fs = require('fs');
const path = require('path');

class NoteLyricsService {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.relationshipsDir = path.join(baseDir, 'data', 'relationships');
    }

    /**
     * Load notes with lyrics, tones, rhyme families from relationships file
     * @param {string} songName - Song name (backend format: ba-rang-ba-ri)
     * @returns {Object|null} Notes data with lyrics and phraseId merged from noteToWordMap
     */
    loadAnnotatedNotes(songName) {
        const filePath = path.join(this.relationshipsDir, `${songName}-relationships.json`);

        if (!fs.existsSync(filePath)) {
            console.log(`Relationships not found: ${filePath}`);
            return null;
        }

        try {
            const relationships = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const notes = relationships.notes || [];
            const noteToWordMap = relationships.noteToWordMap || {};  // Object, not array!

            // Create phraseId and syllable map from noteToWordMap (it's an object, not array)
            const noteIdMap = {};
            const mapKeys = Object.keys(noteToWordMap);
            console.log(`  [DEBUG] noteToWordMap has ${mapKeys.length} mappings`);

            mapKeys.forEach(noteId => {
                const noteData = noteToWordMap[noteId];
                noteIdMap[noteId] = {
                    phraseId: noteData.phraseId,
                    lyric: noteData.syllable,
                    translation: noteData.translation || null,
                    phraseType: noteData.phraseType || null
                };
            });

            console.log(`  [DEBUG] Created ${Object.keys(noteIdMap).length} note ID mappings`);

            // Merge phraseId and lyric data into notes
            const annotatedNotes = notes.map(note => {
                const wordData = noteToWordMap[note.id];
                return {
                    index: note.index,
                    pitch: note.pitch,
                    duration: note.duration,
                    isGrace: note.isGrace || false,
                    lyric: noteIdMap[note.id]?.lyric || null,
                    phraseId: noteIdMap[note.id]?.phraseId || null,
                    phraseType: noteIdMap[note.id]?.phraseType || null,
                    translation: noteIdMap[note.id]?.translation || null,
                    isMelismaNote: wordData?.isMelismaNote || false,  // Include melisma flag
                    isMainNote: wordData?.isMainNote || false,
                    tone: wordData?.tone || null,            // ✅ Get from noteToWordMap
                    rhymeFamily: wordData?.rhymeFamily || null,  // ✅ Get from noteToWordMap
                    id: note.id
                };
            });

            const notesWithLyrics = annotatedNotes.filter(n => n.lyric).length;

            console.log(`✨ NEW CODE RUNNING ✨ Loaded ${annotatedNotes.length} notes with lyrics for ${songName}`);
            console.log(`  Notes with lyrics: ${notesWithLyrics}/${annotatedNotes.length} (${((notesWithLyrics/annotatedNotes.length)*100).toFixed(1)}%)`);

            return {
                notes: annotatedNotes,
                totalNotes: annotatedNotes.length,
                notesWithLyrics: notesWithLyrics
            };
        } catch (error) {
            console.error(`Error loading annotated notes: ${error.message}`);
            return null;
        }
    }

    /**
     * Merge annotated notes (lyrics, tone, rhyme) with positioned notes (X, Y coords)
     * @param {Array} annotatedNotes - Notes from notes-annotated/*.json
     * @param {Array} positionedNotes - Notes from tablature generator (with x, y)
     * @returns {Array} Merged notes with both lyric data and positions
     */
    mergeNotesWithPositions(annotatedNotes, positionedNotes) {
        if (!annotatedNotes || !positionedNotes) {
            console.warn('Missing data for merge');
            return [];
        }

        // Create map of positioned notes by index
        const positionMap = new Map();
        positionedNotes.forEach(note => {
            if (note.index !== undefined) {
                positionMap.set(note.index, note);
            }
        });

        // Merge annotated data with positions
        const merged = annotatedNotes.map(annotatedNote => {
            const positioned = positionMap.get(annotatedNote.index);

            if (!positioned) {
                console.warn(`No position found for note index ${annotatedNote.index}`);
                return {
                    ...annotatedNote,
                    x: null,
                    y: null
                };
            }

            return {
                ...annotatedNote,  // lyric, tone, rhymeFamily, translation, phraseId, phraseType
                x: positioned.x,
                y: positioned.y,
                id: positioned.id  // SVG element ID
            };
        });

        console.log(`Merged ${merged.length} notes with positions`);
        console.log(`  Notes with both lyric and position: ${merged.filter(n => n.lyric && n.x !== null).length}`);

        return merged;
    }

    /**
     * Group notes by phrase ID
     * @param {Array} mergedNotes - Notes with lyrics and positions
     * @returns {Object} Phrases grouped by ID
     */
    groupNotesByPhrase(mergedNotes) {
        const phrases = {};

        mergedNotes.forEach(note => {
            if (!note.phraseId) return;

            if (!phrases[note.phraseId]) {
                phrases[note.phraseId] = {
                    phraseId: note.phraseId,
                    phraseType: note.phraseType,
                    notes: []
                };
            }

            phrases[note.phraseId].notes.push(note);
        });

        return phrases;
    }

    /**
     * Generate lyrics HTML with X-position data attributes for pattern visualization
     * @param {Array} mergedNotes - Notes with lyrics and positions
     * @returns {string} HTML for syllable display
     */
    generateSyllableLyricsHTML(mergedNotes) {
        if (!mergedNotes || mergedNotes.length === 0) {
            return '<p style="padding: 20px; text-align: center; color: #999;">No syllable data available.</p>';
        }

        const phrases = this.groupNotesByPhrase(mergedNotes);
        const phraseIds = Object.keys(phrases).sort((a, b) => parseInt(a) - parseInt(b));

        // DEBUG: Log phrase structure
        console.log(`\n=== SYLLABLE LYRICS DEBUG ===`);
        console.log(`Total phrases: ${phraseIds.length}`);
        phraseIds.forEach(id => {
            const phrase = phrases[id];
            const notesWithLyrics = phrase.notes.filter(n => n.lyric);
            const graceNotes = phrase.notes.filter(n => n.isGrace && n.lyric);
            const melismaNotes = phrase.notes.filter(n => n.isMelismaNote);
            const displayedNotes = phrase.notes.filter(n => n.lyric && !n.isGrace && !n.isMelismaNote);
            console.log(`  Phrase ${id}: ${phrase.notes.length} notes (with lyrics: ${notesWithLyrics.length}, grace with lyrics: ${graceNotes.length}, melisma filtered: ${melismaNotes.length}, displayed: ${displayedNotes.length})`);

            // Check for duplicate indices
            const indices = phrase.notes.map(n => n.index);
            const uniqueIndices = new Set(indices);
            if (indices.length !== uniqueIndices.size) {
                console.log(`    ⚠️  DUPLICATE INDICES FOUND! Total: ${indices.length}, Unique: ${uniqueIndices.size}`);
                console.log(`    Indices: ${indices.join(', ')}`);
            }

            // Show actual lyrics for last phrase
            if (id === phraseIds[phraseIds.length - 1]) {
                console.log(`    Last phrase lyrics: ${notesWithLyrics.map(n => n.lyric).join(', ')}`);
            }
        });
        console.log(`========================\n`);

        let html = '<div class="syllable-lyrics-container">\n';
        html += '<style>\n';
        html += '.syllable-lyrics-container { padding: 20px; }\n';
        html += '.phrase-line { margin-bottom: 15px; line-height: 2.5; }\n';
        html += '.syllable { display: inline-block; margin: 0 8px; cursor: pointer; transition: all 0.2s; }\n';
        html += '.syllable:hover { background: #e8f5e9; transform: scale(1.1); }\n';
        html += '.syllable-vn { font-size: 18px; font-weight: bold; color: #2C3E50; }\n';
        html += '.syllable-en { font-size: 12px; color: #7F8C8D; display: block; }\n';
        html += '.syllable-tone { font-size: 10px; color: #9B59B6; display: block; }\n';
        html += '.syllable-rhyme { font-size: 10px; color: #E67E22; display: block; }\n';
        html += '.phrase-type { color: #3498DB; font-size: 11px; font-style: italic; margin-left: 10px; }\n';
        html += '</style>\n\n';

        phraseIds.forEach(phraseId => {
            const phrase = phrases[phraseId];
            html += `<div class="phrase-line" data-phrase-id="${phraseId}">\n`;
            html += `  <span class="phrase-type">[${phrase.phraseType || 'unknown'}]</span>\n`;

            phrase.notes.forEach(note => {
                if (!note.lyric) return; // Skip notes without lyrics
                if (note.isGrace) return; // Skip grace notes - only show lyrics on main notes
                if (note.isMelismaNote) return; // Skip melisma notes (one syllable stretched over multiple notes)

                html += `  <span class="syllable" `;
                html += `data-note-index="${note.index}" `;
                html += `data-note-x="${note.x || 0}" `;
                html += `data-note-y="${note.y || 0}" `;
                html += `data-note-id="${note.id || ''}" `;
                html += `data-lyric="${note.lyric}" `;
                html += `data-tone="${note.tone || ''}" `;
                html += `data-rhyme="${note.rhymeFamily || ''}" `;
                html += `data-phrase-id="${note.phraseId}" `;
                html += `title="Click to highlight in tablature">\n`;
                html += `    <span class="syllable-vn">${note.lyric}</span>\n`;
                if (note.translation) {
                    html += `    <span class="syllable-en">${note.translation}</span>\n`;
                }
                if (note.tone) {
                    html += `    <span class="syllable-tone">${note.tone}</span>\n`;
                }
                if (note.rhymeFamily) {
                    html += `    <span class="syllable-rhyme">-${note.rhymeFamily}</span>\n`;
                }
                html += `  </span>\n`;
            });

            html += `</div>\n`;
        });

        html += '</div>\n';

        return html;
    }

    /**
     * Get statistics about syllable coverage
     * @param {Array} mergedNotes - Notes with lyrics and positions
     * @returns {Object} Statistics
     */
    getSyllableStatistics(mergedNotes) {
        const totalNotes = mergedNotes.length;
        const notesWithLyrics = mergedNotes.filter(n => n.lyric).length;
        const notesWithPositions = mergedNotes.filter(n => n.x !== null).length;
        const notesWithBoth = mergedNotes.filter(n => n.lyric && n.x !== null).length;

        const phrases = this.groupNotesByPhrase(mergedNotes);
        const phraseCount = Object.keys(phrases).length;

        return {
            totalNotes,
            notesWithLyrics,
            notesWithPositions,
            notesWithBoth,
            phraseCount,
            coverage: totalNotes > 0 ? ((notesWithBoth / totalNotes) * 100).toFixed(1) : 0
        };
    }
}

module.exports = NoteLyricsService;
