// Simple replacement for redrawStringsWithNewTuning function
function redrawStringsWithNewTuning(newTuning) {
    console.log('🔧 redrawStringsWithNewTuning called with:', newTuning);
    const svg = document.getElementById('tablatureSvg');

    // First, remove ALL existing bent indicators (both original and any added)
    const allBentGroups = svg.querySelectorAll('.bent-note-group');
    allBentGroups.forEach(group => group.remove());

    const allBentArrows = svg.querySelectorAll('.bent-arrow-tail');
    allBentArrows.forEach(arrow => arrow.remove());

    const allBentTexts = svg.querySelectorAll('.bent-line-char');
    allBentTexts.forEach(text => text.remove());

    // SIMPLE APPROACH: Position strings using fixed spacing from a reference
    const C4_BASE_Y = 380; // Fixed reference point for C4
    const SEMITONE_SPACING = 30; // Pixels per semitone

    const pitchOrder = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    // Generate string positions for the new tuning
    const newStrings = {};
    newTuning.forEach((pitchClass, index) => {
        const stringNum = index + 1;
        const octave = 4; // Start at octave 4
        const fullNote = pitchClass + octave;

        // Calculate Y position: each semitone is 30 pixels
        const semitones = (octave - 4) * 12 + (pitchOrder[pitchClass] || 0);
        const baseY = C4_BASE_Y + (semitones * SEMITONE_SPACING);

        newStrings[stringNum] = { note: fullNote, y: baseY, pitchClass: pitchClass };
        console.log('Positioning string', stringNum, ':', fullNote, 'at Y=', baseY);
    });

    // Update string lines
    const stringLines = svg.querySelectorAll('.string-line');
    stringLines.forEach((line, index) => {
        const stringConfig = newStrings[index + 1];
        if (stringConfig) {
            const scaledY = stringConfig.y * currentZoomY;
            line.setAttribute('y1', scaledY);
            line.setAttribute('y2', scaledY);
            line.setAttribute('data-base-y1', stringConfig.y);
            line.setAttribute('data-base-y2', stringConfig.y);

            // Update string label
            const label = svg.querySelector(`.string-label[data-string-number="${index + 1}"]`);
            if (label) {
                label.textContent = `String ${index + 1}: ${stringConfig.note}`;
                const labelY = (stringConfig.y - 5) * currentZoomY;
                label.setAttribute('y', labelY);
                label.setAttribute('data-base-y', stringConfig.y - 5);
            }
        }
    });

    // Notes stay in their original positions - only strings move to align with them
}