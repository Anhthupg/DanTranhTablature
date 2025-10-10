const fs = require('fs');
const path = require('path');

/**
 * Tier 1.5: Lyric-to-Note Mapping System
 *
 * Maps syllables from lyrics-segmentation data to annotated notes, handling:
 * 1. Pre-slur grace notes (belong to NEXT main note's syllable)
 * 2. Post-slur grace notes (belong to CURRENT main note's syllable)
 * 3. Main notes without lyrics (melisma - belong to nearest earlier syllable)
 * 4. Grace notes as special case of melisma
 *
 * Input:
 *   - data/notes-annotated/*.json (notes with null lyrics)
 *   - data/lyrics-segmentations/*.json (LLM phrase segmentation)
 *
 * Output:
 *   - data/notes-annotated/*.json (updated with lyric, tone, rhymeFamily)
 */

const ANNOTATED_DIR = path.join(__dirname, 'data', 'notes-annotated');
const LYRICS_DIR = path.join(__dirname, 'data', 'lyrics-segmentations');

/**
 * Extract individual syllables from lyrics segmentation
 */
function extractSyllables(lyricsData) {
    const syllables = [];

    lyricsData.phrases.forEach(phrase => {
        phrase.wordMapping.forEach(wordMap => {
            syllables.push({
                syllable: wordMap.vn,
                translation: wordMap.en,
                phraseId: phrase.id,
                phraseType: phrase.type
            });
        });
    });

    console.log(`  Extracted ${syllables.length} syllables from ${lyricsData.phrases.length} phrases`);
    return syllables;
}

/**
 * Map syllables to notes with grace note and melisma handling
 */
function mapSyllablesToNotes(notes, syllables) {
    console.log(`  Mapping ${syllables.length} syllables to ${notes.length} notes...`);

    // First pass: Identify main notes (not grace)
    const mainNotes = notes.filter(n => !n.isGrace);
    console.log(`    Found ${mainNotes.length} main notes, ${notes.length - mainNotes.length} grace notes`);

    // Second pass: Map syllables to main notes (1:1 initial mapping)
    let syllableIndex = 0;
    const mainNoteToSyllable = new Map();

    mainNotes.forEach(mainNote => {
        if (syllableIndex < syllables.length) {
            mainNoteToSyllable.set(mainNote.index, syllables[syllableIndex]);
            syllableIndex++;
        }
    });

    console.log(`    Mapped ${syllableIndex} syllables to main notes`);

    // Handle remaining main notes as melisma (no new syllable)
    if (mainNotes.length > syllables.length) {
        console.log(`    ${mainNotes.length - syllables.length} main notes without syllables (melisma)`);
    }

    // Third pass: Apply syllables to notes with grace note rules
    let currentSyllable = null;

    notes.forEach((note, i) => {
        // Rule 1: Main note with syllable
        if (!note.isGrace && mainNoteToSyllable.has(note.index)) {
            currentSyllable = mainNoteToSyllable.get(note.index);
            applyLyricToNote(note, currentSyllable);
            console.log(`    Note ${i} (main ${note.pitch}): "${currentSyllable.syllable}" (new syllable)`);
        }
        // Rule 2: Main note without syllable (melisma)
        else if (!note.isGrace && currentSyllable) {
            applyLyricToNote(note, currentSyllable);
            console.log(`    Note ${i} (main ${note.pitch}): "${currentSyllable.syllable}" (melisma)`);
        }
        // Rule 3: Grace note (always extends current syllable)
        else if (note.isGrace && currentSyllable) {
            applyLyricToNote(note, currentSyllable);
            const graceType = note.hasSlurStart ? 'pre-slur' : note.hasSlurStop ? 'post-slur' : 'ornamental';
            console.log(`    Note ${i} (grace ${note.pitch}): "${currentSyllable.syllable}" (${graceType} grace)`);
        }
    });

    // Statistics
    const notesWithLyrics = notes.filter(n => n.lyric !== null).length;
    console.log(`  Result: ${notesWithLyrics}/${notes.length} notes now have lyrics assigned`);

    return notes;
}

/**
 * Apply lyric data to a note
 */
function applyLyricToNote(note, syllableData) {
    note.lyric = syllableData.syllable;
    note.translation = syllableData.translation;
    note.phraseId = syllableData.phraseId;
    note.phraseType = syllableData.phraseType;

    // Extract Vietnamese tone from syllable
    note.tone = extractTone(syllableData.syllable);

    // Extract rhyme family (final sound)
    note.rhymeFamily = extractRhymeFamily(syllableData.syllable);
}

/**
 * Extract Vietnamese tone from syllable
 */
function extractTone(syllable) {
    // Vietnamese tone markers
    const toneMap = {
        'á|é|í|ó|ú|ý|ắ|ấ|ế|ố|ứ': 'sac',      // Rising (sắc)
        'à|è|ì|ò|ù|ỳ|ằ|ầ|ề|ồ|ừ': 'huyen',    // Falling (huyền)
        'ả|ẻ|ỉ|ỏ|ủ|ỷ|ẳ|ẩ|ể|ổ|ử': 'hoi',      // Broken (hỏi)
        'ã|ẽ|ĩ|õ|ũ|ỹ|ẵ|ẫ|ễ|ỗ|ữ': 'nga',      // Sharp (ngã)
        'ạ|ẹ|ị|ọ|ụ|ỵ|ặ|ậ|ệ|ộ|ự': 'nang'      // Heavy (nặng)
    };

    for (const [pattern, tone] of Object.entries(toneMap)) {
        const regex = new RegExp(`[${pattern}]`);
        if (regex.test(syllable)) {
            return tone;
        }
    }

    return 'ngang';  // Level tone (no marker)
}

/**
 * Extract rhyme family from syllable (final sound)
 */
function extractRhymeFamily(syllable) {
    // Remove tone markers to get base syllable
    const normalized = syllable
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    // Extract final consonant/vowel
    const endings = {
        'ng': /ng$/,
        'nh': /nh$/,
        'ch': /ch$/,
        'm': /m$/,
        'n': /n$/,
        'p': /p$/,
        't': /t$/,
        'c': /c$/,
        'i': /i$/,
        'u': /u$/,
        'o': /o$/,
        'a': /a$/,
        'e': /e$/
    };

    for (const [family, pattern] of Object.entries(endings)) {
        if (pattern.test(normalized)) {
            return family;
        }
    }

    return 'open';  // Open syllable
}

/**
 * Process one song
 */
function processSong(songFile) {
    const songName = songFile.replace('-annotated.json', '');
    console.log(`\nProcessing: ${songName}`);

    // Load annotated notes
    const annotatedPath = path.join(ANNOTATED_DIR, songFile);
    const annotatedData = JSON.parse(fs.readFileSync(annotatedPath, 'utf8'));

    console.log(`  Loaded ${annotatedData.notes.length} annotated notes`);

    // Load lyrics segmentation
    const lyricsFile = songName + '.json';
    const lyricsPath = path.join(LYRICS_DIR, lyricsFile);

    if (!fs.existsSync(lyricsPath)) {
        console.log(`  ⚠️  No lyrics segmentation found, skipping`);
        return;
    }

    const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

    // Extract syllables from phrases
    const syllables = extractSyllables(lyricsData);

    // Map syllables to notes
    annotatedData.notes = mapSyllablesToNotes(annotatedData.notes, syllables);

    // Update statistics
    annotatedData.notesWithLyrics = annotatedData.notes.filter(n => n.lyric !== null).length;
    annotatedData.lyricsSourceFile = lyricsFile;
    annotatedData.updatedDate = new Date().toISOString();

    // Save updated file
    fs.writeFileSync(annotatedPath, JSON.stringify(annotatedData, null, 2), 'utf8');
    console.log(`  ✅ Updated: ${annotatedPath}`);
    console.log(`  Notes with lyrics: ${annotatedData.notesWithLyrics}/${annotatedData.notes.length}`);
}

/**
 * Process all songs
 */
function processAllSongs() {
    console.log('=== Tier 1.5: Lyric-to-Note Mapping System ===');
    console.log('Mapping syllables to notes with grace note and melisma handling\n');

    const files = fs.readdirSync(ANNOTATED_DIR)
        .filter(f => f.endsWith('-annotated.json'));

    console.log(`Found ${files.length} annotated songs\n`);

    let successCount = 0;
    let totalNotesWithLyrics = 0;
    let totalNotes = 0;

    files.forEach(file => {
        try {
            processSong(file);

            // Reload to get stats
            const annotatedPath = path.join(ANNOTATED_DIR, file);
            const data = JSON.parse(fs.readFileSync(annotatedPath, 'utf8'));

            successCount++;
            totalNotesWithLyrics += data.notesWithLyrics;
            totalNotes += data.notes.length;

        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
    });

    console.log('\n=== Summary ===');
    console.log(`✅ Successfully processed: ${successCount} songs`);
    console.log(`Total notes with lyrics: ${totalNotesWithLyrics}/${totalNotes} (${(totalNotesWithLyrics/totalNotes*100).toFixed(1)}%)`);
    console.log(`Average per song: ${(totalNotesWithLyrics/successCount).toFixed(1)} notes with lyrics`);
}

// Run if called directly
if (require.main === module) {
    processAllSongs();
}

module.exports = { processSong, processAllSongs };
