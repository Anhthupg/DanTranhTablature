const fs = require('fs');
const path = require('path');

/**
 * Annotate Notes with Per-Note KxxIC Pattern Memberships
 *
 * Reads:
 * - data/relationships/*.json (note sequences with grace/main distinction)
 * - data/patterns/*.json (aggregate pattern statistics)
 *
 * Outputs:
 * - data/notes-annotated/*.json (each note with its pattern memberships)
 *
 * Key Feature: Distinguishes g8th/g16th (grace) from 8th/16th (main notes)
 */

const RELATIONSHIPS_DIR = path.join(__dirname, 'data', 'relationships');
const PATTERNS_DIR = path.join(__dirname, 'data', 'patterns');
const OUTPUT_DIR = path.join(__dirname, 'data', 'notes-annotated');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Build per-note annotations from relationships and patterns
 */
function annotateNotesWithPatterns(songName) {
    console.log(`\nProcessing: ${songName}`);

    // Read relationships file
    const relationshipsPath = path.join(RELATIONSHIPS_DIR, `${songName}-relationships.json`);
    if (!fs.existsSync(relationshipsPath)) {
        console.log(`  ⚠️  No relationships file found`);
        return null;
    }

    const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));
    const notes = relationships.notes || [];

    if (notes.length === 0) {
        console.log(`  ⚠️  No notes found in relationships`);
        return null;
    }

    // Annotate each note with pattern memberships
    const annotatedNotes = notes.map((note, index) => {
        const annotation = {
            index: index,
            pitch: note.pitch,
            duration: note.duration,
            isGrace: note.isGrace || false,
            isBent: note.isBent || false,
            lyric: note.lyric || null,
            tone: note.tone || null,
            rhymeFamily: note.rhymeFamily || null,
            patterns: {
                kpic2: null,  // Two-note pitch pattern
                kpic3: null,  // Three-note pitch pattern
                kdic2: null,  // Two-note duration pattern
                kdic3: null,  // Three-note duration pattern
                ktic2: null,  // Two-tone pattern
                ktic3: null,  // Three-tone pattern
            }
        };

        // KPIC-2: Two-note pitch pattern
        if (index > 0) {
            const prevPitch = notes[index - 1].pitch;
            annotation.patterns.kpic2 = `${prevPitch}→${note.pitch}`;
        }

        // KPIC-3: Three-note pitch pattern
        if (index > 1) {
            const prevPitch = notes[index - 1].pitch;
            const prevPrevPitch = notes[index - 2].pitch;
            annotation.patterns.kpic3 = `${prevPrevPitch}→${prevPrevPitch}→${note.pitch}`;
        }

        // KDIC-2: Two-note duration pattern (grace-aware)
        if (index > 0) {
            const prevNote = notes[index - 1];
            const prevDuration = formatDuration(prevNote.duration, prevNote.isGrace);
            const currentDuration = formatDuration(note.duration, note.isGrace);
            annotation.patterns.kdic2 = `${prevDuration}→${currentDuration}`;
        }

        // KDIC-3: Three-note duration pattern (grace-aware)
        if (index > 1) {
            const prevNote = notes[index - 1];
            const prevPrevNote = notes[index - 2];
            const prevPrevDuration = formatDuration(prevPrevNote.duration, prevPrevNote.isGrace);
            const prevDuration = formatDuration(prevNote.duration, prevNote.isGrace);
            const currentDuration = formatDuration(note.duration, note.isGrace);
            annotation.patterns.kdic3 = `${prevPrevDuration}→${prevDuration}→${currentDuration}`;
        }

        // KTIC-2: Two-tone pattern (only for notes with lyrics)
        if (note.tone && index > 0) {
            const prevTone = notes[index - 1].tone;
            if (prevTone) {
                annotation.patterns.ktic2 = `${prevTone}→${note.tone}`;
            }
        }

        // KTIC-3: Three-tone pattern (only for notes with lyrics)
        if (note.tone && index > 1) {
            const prevTone = notes[index - 1].tone;
            const prevPrevTone = notes[index - 2].tone;
            if (prevTone && prevPrevTone) {
                annotation.patterns.ktic3 = `${prevPrevTone}→${prevTone}→${note.tone}`;
            }
        }

        return annotation;
    });

    // Statistics
    const graceCount = annotatedNotes.filter(n => n.isGrace).length;
    const mainCount = annotatedNotes.filter(n => !n.isGrace).length;
    const withLyrics = annotatedNotes.filter(n => n.lyric).length;

    console.log(`  ✅ Annotated ${annotatedNotes.length} notes`);
    console.log(`     - Main notes: ${mainCount}`);
    console.log(`     - Grace notes: ${graceCount}`);
    console.log(`     - With lyrics: ${withLyrics}`);

    return {
        songName,
        generatedDate: new Date().toISOString(),
        totalNotes: annotatedNotes.length,
        mainNotes: mainCount,
        graceNotes: graceCount,
        notesWithLyrics: withLyrics,
        notes: annotatedNotes
    };
}

/**
 * Format duration with grace note prefix
 * Examples:
 * - formatDuration(1, false) → "1" (main whole note)
 * - formatDuration(1, true) → "g8th" (grace 8th note)
 * - formatDuration(0.5, false) → "2" (main half note)
 */
function formatDuration(duration, isGrace) {
    if (isGrace) {
        // Grace notes: g8th or g16th
        return duration <= 0.5 ? 'g16th' : 'g8th';
    } else {
        // Main notes: numeric duration values
        return duration.toString();
    }
}

/**
 * Process all songs
 */
function processAllSongs() {
    console.log('=== Per-Note KxxIC Annotation System ===\n');
    console.log('Distinguishing grace notes (g8th, g16th) from main notes (1, 2, 3, 8)');

    // Get all relationship files
    const relationshipFiles = fs.readdirSync(RELATIONSHIPS_DIR)
        .filter(f => f.endsWith('-relationships.json'));

    console.log(`\nFound ${relationshipFiles.length} relationship files\n`);

    let successCount = 0;
    let failCount = 0;

    relationshipFiles.forEach(file => {
        const songName = file.replace('-relationships.json', '');

        try {
            const annotated = annotateNotesWithPatterns(songName);

            if (annotated) {
                // Save to output directory
                const outputPath = path.join(OUTPUT_DIR, `${songName}-annotated.json`);
                fs.writeFileSync(outputPath, JSON.stringify(annotated, null, 2), 'utf8');
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            failCount++;
        }
    });

    console.log('\n=== Summary ===');
    console.log(`✅ Successfully annotated: ${successCount} songs`);
    console.log(`❌ Failed: ${failCount} songs`);
    console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

// Run if called directly
if (require.main === module) {
    processAllSongs();
}

module.exports = { annotateNotesWithPatterns };
