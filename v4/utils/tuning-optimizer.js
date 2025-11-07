/**
 * V4.2.37: Tuning Optimizer
 *
 * Finds the optimal tuning for a song by testing all candidate tunings
 * and selecting the one that produces the fewest bent notes.
 */

// Standard tuning systems to test
const TUNING_SYSTEMS = {
    // Vietnamese
    'C-D-E-G-A': 'Dan Tranh Standard (C-D-E-G-A)',
    'C-D-F-G-A': 'Dan Tranh Southern (C-D-F-G-A)',
    'C-D-E-G-B': 'Dan Tranh Central (C-D-E-G-B)',
    'C-Eb-F-G-Bb': 'Ru Con (C-Eb-F-G-Bb)',
    'D-F-G-A-C': 'Nam Ai (D-F-G-A-C)',
    'D-E-F#-A-B': 'Nam Xuan (D-E-F#-A-B)',
    'C-Eb-F-G-Ab': 'Oan (C-Eb-F-G-Ab)',

    // Common Pentatonic
    'A-C-D-E-G': 'Minor Pentatonic (A-C-D-E-G)',
    'C-D-F-G-Bb': 'Egyptian (C-D-F-G-Bb)',

    // Hexatonic
    'C-D-Eb-E-G-A': 'Blues Major (C-D-Eb-E-G-A)',
    'C-Eb-F-Gb-G-Bb': 'Blues Minor (C-Eb-F-Gb-G-Bb)'
};

// Pitch to semitone mapping (C4 = 0)
function pitchToSemitones(step, octave, baseOctave = 4) {
    const noteValues = {
        'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
        'Cb': -1, 'C#': 1, 'Db': 1, 'D#': 3, 'Eb': 3, 'E#': 5,
        'Fb': 4, 'F#': 6, 'Gb': 6, 'G#': 8, 'Ab': 8, 'A#': 10, 'Bb': 10, 'B#': 12
    };

    const semitonesFromC = noteValues[step] !== undefined ? noteValues[step] : 0;
    const octaveOffset = (octave - baseOctave) * 12;

    return semitonesFromC + octaveOffset;
}

// Parse tuning string into semitone array (relative to root)
function parseTuningToSemitones(tuningString) {
    const notes = tuningString.split('-');
    return notes.map(note => {
        // Remove octave info if present
        const cleanNote = note.replace(/[0-9]/g, '');
        return pitchToSemitones(cleanNote, 4, 4); // All relative to C4
    }).sort((a, b) => a - b); // Sort ascending
}

// Parse pitch string like "C4", "Eb5", "F#3" into step and octave
function parsePitchString(pitchStr) {
    if (!pitchStr || typeof pitchStr !== 'string') return null;
    const match = pitchStr.match(/^([A-G][b#]?)(\d+)$/);
    if (!match) return null;
    return { step: match[1], octave: parseInt(match[2]) };
}

// Count bent notes for a given tuning
function countBentNotes(notes, tuningString) {
    const tuningSemitones = parseTuningToSemitones(tuningString);

    // Get all unique pitches in the song
    // Handle both formats: {step, octave} OR {pitch: "C4"}
    const songPitches = notes
        .filter(n => !n.isGrace)
        .map(n => {
            if (n.step && n.octave !== undefined) {
                return pitchToSemitones(n.step, n.octave, 4);
            } else if (n.pitch) {
                const parsed = parsePitchString(n.pitch);
                if (parsed) return pitchToSemitones(parsed.step, parsed.octave, 4);
            }
            return null;
        })
        .filter(p => p !== null);

    // Count how many notes are NOT in the tuning
    let bentCount = 0;
    const uniquePitches = [...new Set(songPitches)];

    for (const pitch of uniquePitches) {
        // Check if this pitch exists in the tuning (modulo 12 for octave equivalence)
        const pitchClass = ((pitch % 12) + 12) % 12;
        const tuningClasses = tuningSemitones.map(s => ((s % 12) + 12) % 12);

        if (!tuningClasses.includes(pitchClass)) {
            // Count how many times this bent note appears
            bentCount += songPitches.filter(p => ((p % 12) + 12) % 12 === pitchClass).length;
        }
    }

    return bentCount;
}

// Find optimal tuning for a song
function findOptimalTuning(notes, candidateTunings = null) {
    // Use provided candidates or all Vietnamese tunings
    const candidates = candidateTunings || [
        'C-D-E-G-A',
        'C-D-F-G-A',
        'C-D-E-G-B',
        'C-Eb-F-G-Bb',
        'D-F-G-A-C',
        'A-C-D-E-G'
    ];

    let bestTuning = candidates[0];
    let lowestBentCount = Infinity;
    const results = [];

    for (const tuning of candidates) {
        const bentCount = countBentNotes(notes, tuning);
        results.push({ tuning, bentCount });

        if (bentCount < lowestBentCount) {
            lowestBentCount = bentCount;
            bestTuning = tuning;
        }
    }

    // Sort results by bent count
    results.sort((a, b) => a.bentCount - b.bentCount);

    return {
        optimal: bestTuning,
        bentNotes: lowestBentCount,
        allResults: results,
        description: TUNING_SYSTEMS[bestTuning] || bestTuning
    };
}

// Calculate optimal tuning from pitch class frequency
function calculateFrequencyBasedTuning(notes) {
    // Count pitch class frequencies
    const pitchCounts = {};

    notes
        .filter(n => !n.isGrace)
        .forEach(n => {
            let pitchClass;
            if (n.step) {
                pitchClass = n.step;
            } else if (n.pitch) {
                // Extract pitch class (remove octave number)
                pitchClass = n.pitch.replace(/[0-9]/g, '');
            }

            if (pitchClass) {
                pitchCounts[pitchClass] = (pitchCounts[pitchClass] || 0) + 1;
            }
        });

    // Get top 5 most frequent pitch classes
    const sorted = Object.entries(pitchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(x => x[0]);

    // Sort alphabetically for standard notation
    sorted.sort();

    return sorted.join('-');
}

// Analyze all tunings for a song (for display)
function analyzeAllTunings(notes) {
    // V4.X: Calculate optimal tuning from frequency (top 5 pitch classes)
    const frequencyTuning = calculateFrequencyBasedTuning(notes);
    const frequencyBentCount = countBentNotes(notes, frequencyTuning);

    console.log(`[Tuning] Frequency-based (top 5): ${frequencyTuning} (${frequencyBentCount} bent)`);

    // Also test all pre-defined tunings for comparison (PENTATONIC ONLY)
    const pentatonicTunings = Object.keys(TUNING_SYSTEMS).filter(t => {
        const noteCount = t.split('-').length;
        return noteCount === 5;  // Only 5-note scales
    });

    const comparisonResult = findOptimalTuning(notes, pentatonicTunings);
    console.log(`[Tuning] Best pre-defined: ${comparisonResult.optimal} (${comparisonResult.bentNotes} bent)`);

    // Always prefer frequency-based tuning (top 5 notes)
    return {
        optimal: frequencyTuning,
        bentNotes: frequencyBentCount,
        allResults: [
            { tuning: frequencyTuning, bentCount: frequencyBentCount },
            ...comparisonResult.allResults
        ].sort((a, b) => a.bentCount - b.bentCount),
        description: `Frequency-based (${frequencyTuning})`
    };
}

module.exports = {
    findOptimalTuning,
    analyzeAllTunings,
    countBentNotes,
    TUNING_SYSTEMS
};
