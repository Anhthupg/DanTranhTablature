const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// String configuration with proportional spacing based on musical intervals (cents)
// Base at D4 (string 5), then calculate positions based on semitone distances
// 1 semitone = 100 cents, using 0.3 pixels per cent for good visual spacing
const baseY = 110;
const pixelsPerCent = 0.3;

const STRING_CONFIG = {
    5: { note: 'D4', y: baseY },                           // D4: base position
    7: { note: 'G4', y: baseY + (500 * pixelsPerCent) },   // G4: +500 cents (5 semitones from D4)
    8: { note: 'A4', y: baseY + (700 * pixelsPerCent) },   // A4: +700 cents (7 semitones from D4)
    9: { note: 'C5', y: baseY + (1000 * pixelsPerCent) },  // C5: +1000 cents (10 semitones from D4)
    10: { note: 'D5', y: baseY + (1200 * pixelsPerCent) }, // D5: +1200 cents (12 semitones from D4)
    11: { note: 'E5', y: baseY + (1400 * pixelsPerCent) }, // E5: +1400 cents (14 semitones from D4)
    12: { note: 'G5', y: baseY + (1700 * pixelsPerCent) }  // G5: +1700 cents (17 semitones from D4)
};

// 12-color system from CLAUDE.md
const COLORS = {
    mainNote: { fill: '#008080', stroke: '#005959' },  // Teal with darker teal stroke
    graceNote: { fill: '#FFD700', stroke: '#CC9900' }, // Gold with darker gold stroke
    toneMarking: { fill: '#9B59B6', stroke: '#7D3C98' },
    melisma: { fill: '#E74C3C', stroke: '#C0392B' }
};

// Parse MusicXML and extract note data
async function parseMusicXML(xmlPath) {
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    const dom = new JSDOM(xmlContent, { contentType: 'text/xml' });
    const doc = dom.window.document;

    const notes = [];
    const lyrics = [];

    // Extract notes
    const noteElements = doc.querySelectorAll('note');
    let currentX = 120; // Starting X position

    noteElements.forEach((noteEl, index) => {
        const pitch = noteEl.querySelector('pitch');
        if (!pitch) return; // Skip rests

        const step = pitch.querySelector('step')?.textContent;
        const octave = pitch.querySelector('octave')?.textContent;
        const alter = pitch.querySelector('alter')?.textContent || '0';
        const duration = noteEl.querySelector('duration')?.textContent || '1';
        const grace = noteEl.querySelector('grace') !== null;
        const lyricEl = noteEl.querySelector('lyric text');
        const lyric = lyricEl ? lyricEl.textContent : '';

        // Detect slurs (they are in notations section) - check ANY slur number
        const slurStart = noteEl.querySelector('notations slur[type="start"]') !== null;
        const slurStop = noteEl.querySelector('notations slur[type="stop"]') !== null;
        let slurType = null;
        if (slurStart && slurStop) {
            slurType = 'both';
        } else if (slurStart) {
            slurType = 'start';
        } else if (slurStop) {
            slurType = 'stop';
        }

        // Calculate note name
        const noteName = step + (alter === '1' ? '#' : alter === '-1' ? 'b' : '') + octave;

        // Find matching string with comprehensive mapping
        let stringNum = null;
        let stringY = null;

        // Special mapping for Xỉa Cá Mè to distribute notes across 4 strings
        const isXiaCaMe = path.basename(xmlPath, '.musicxml.xml').toLowerCase().normalize('NFC').includes('xỉa') ||
                         path.basename(xmlPath, '.musicxml.xml').toLowerCase().includes('xia');

        // Create a more comprehensive mapping including bent notes
        const noteToString = isXiaCaMe ? {
            // Special mapping for Xỉa Cá Mè - proportional spacing based on cents
            'C4': { num: 5, y: 110 },   // String 5 for C4 (base)
            'F4': { num: 6, y: 310 },   // String 6 for F4 (+500 cents = +200px)
            'G4': { num: 7, y: 390 },   // String 7 for G4 (+700 cents = +280px)
            'C5': { num: 9, y: 590 }    // String 9 for C5 (+1200 cents = +480px)
        } : {
            // Standard mapping for all other songs
            // Octave 2
            'F2': { num: 5, y: STRING_CONFIG[5].y },

            // Octave 3 - using proportional spacing
            'C3': { num: 5, y: STRING_CONFIG[5].y }, 'C#3': { num: 5, y: STRING_CONFIG[5].y },
            'Db3': { num: 5, y: STRING_CONFIG[5].y }, 'D3': { num: 5, y: STRING_CONFIG[5].y },
            'D#3': { num: 5, y: STRING_CONFIG[5].y }, 'Eb3': { num: 5, y: STRING_CONFIG[5].y },
            'E3': { num: 7, y: STRING_CONFIG[7].y }, 'F3': { num: 7, y: STRING_CONFIG[7].y },
            'E#3': { num: 7, y: STRING_CONFIG[7].y }, 'F#3': { num: 7, y: STRING_CONFIG[7].y },
            'Gb3': { num: 7, y: STRING_CONFIG[7].y }, 'G3': { num: 7, y: STRING_CONFIG[7].y },
            'G#3': { num: 7, y: STRING_CONFIG[7].y }, 'Ab3': { num: 8, y: STRING_CONFIG[8].y },
            'A3': { num: 8, y: STRING_CONFIG[8].y }, 'A#3': { num: 8, y: STRING_CONFIG[8].y },
            'Bb3': { num: 8, y: STRING_CONFIG[8].y }, 'B3': { num: 8, y: STRING_CONFIG[8].y },
            'B#3': { num: 9, y: STRING_CONFIG[9].y }, 'Cb3': { num: 8, y: STRING_CONFIG[8].y },

            // Octave 4 (main range) - using proportional spacing
            'C4': { num: 9, y: STRING_CONFIG[9].y }, 'C#4': { num: 9, y: STRING_CONFIG[9].y },
            'Db4': { num: 5, y: STRING_CONFIG[5].y }, 'D4': { num: 5, y: STRING_CONFIG[5].y },
            'D#4': { num: 5, y: STRING_CONFIG[5].y }, 'Eb4': { num: 5, y: STRING_CONFIG[5].y },
            'E4': { num: 7, y: STRING_CONFIG[7].y }, 'F4': { num: 7, y: STRING_CONFIG[7].y },
            'Fb4': { num: 7, y: STRING_CONFIG[7].y }, 'E#4': { num: 7, y: STRING_CONFIG[7].y },
            'F#4': { num: 7, y: STRING_CONFIG[7].y }, 'Gb4': { num: 7, y: STRING_CONFIG[7].y },
            'G4': { num: 7, y: STRING_CONFIG[7].y }, 'G#4': { num: 8, y: STRING_CONFIG[8].y },
            'Ab4': { num: 8, y: STRING_CONFIG[8].y }, 'A4': { num: 8, y: STRING_CONFIG[8].y },
            'A#4': { num: 9, y: STRING_CONFIG[9].y }, 'Bb4': { num: 9, y: STRING_CONFIG[9].y },
            'B4': { num: 9, y: STRING_CONFIG[9].y }, 'B#4': { num: 9, y: STRING_CONFIG[9].y },
            'Cb4': { num: 9, y: STRING_CONFIG[9].y },

            // Octave 5 (main range) - using proportional spacing
            'C5': { num: 9, y: STRING_CONFIG[9].y }, 'C#5': { num: 10, y: STRING_CONFIG[10].y },
            'Db5': { num: 10, y: STRING_CONFIG[10].y }, 'D5': { num: 10, y: STRING_CONFIG[10].y },
            'D#5': { num: 11, y: STRING_CONFIG[11].y }, 'Eb5': { num: 11, y: STRING_CONFIG[11].y },
            'E5': { num: 11, y: STRING_CONFIG[11].y }, 'F5': { num: 11, y: STRING_CONFIG[11].y },
            'Fb5': { num: 11, y: STRING_CONFIG[11].y }, 'E#5': { num: 11, y: STRING_CONFIG[11].y },
            'F#5': { num: 12, y: STRING_CONFIG[12].y }, 'Gb5': { num: 12, y: STRING_CONFIG[12].y },
            'G5': { num: 12, y: STRING_CONFIG[12].y }, 'G#5': { num: 12, y: STRING_CONFIG[12].y },
            'Ab5': { num: 12, y: STRING_CONFIG[12].y }, 'A5': { num: 12, y: STRING_CONFIG[12].y },
            'A#5': { num: 12, y: STRING_CONFIG[12].y }, 'Bb5': { num: 12, y: STRING_CONFIG[12].y },
            'B5': { num: 12, y: STRING_CONFIG[12].y }, 'Cb5': { num: 9, y: STRING_CONFIG[9].y },

            // Octave 6 - using proportional spacing
            'C6': { num: 12, y: STRING_CONFIG[12].y }, 'C#6': { num: 12, y: STRING_CONFIG[12].y },
            'Db6': { num: 12, y: STRING_CONFIG[12].y }, 'D6': { num: 12, y: STRING_CONFIG[12].y },
            'D#6': { num: 12, y: STRING_CONFIG[12].y }, 'Eb6': { num: 12, y: STRING_CONFIG[12].y },
            'E6': { num: 12, y: STRING_CONFIG[12].y }, 'F6': { num: 12, y: STRING_CONFIG[12].y },
            'F#6': { num: 12, y: STRING_CONFIG[12].y }, 'Gb6': { num: 12, y: STRING_CONFIG[12].y },
            'G6': { num: 12, y: STRING_CONFIG[12].y }
        };

        const mapping = noteToString[noteName];
        if (mapping) {
            stringNum = mapping.num;
            stringY = mapping.y;
        } else {
            // Default to middle string if not found
            console.warn(`Note ${noteName} not in mapping, defaulting to string 9`);
            stringNum = 9;
            stringY = 410;
        }

        notes.push({
            index,
            x: currentX,
            y: stringY,
            string: stringNum,
            noteName,
            duration: parseInt(duration),
            grace,
            lyric,
            slur: slurType
        });

        // Advance X position based on duration
        currentX += grace ? 25 : parseInt(duration) * 85;
    });

    return { notes, title: path.basename(xmlPath, '.musicxml.xml') };
}

// Convert slurs between identical pitches to ties and combine them
// This is the CRITICAL conversion for accurate analysis (V1-compatible)
function convertSlursToTies(notes) {
    const convertedNotes = [];
    let i = 0;

    while (i < notes.length) {
        const currentNote = { ...notes[i] }; // Copy the note

        // Check if this note starts a slur
        if (currentNote.slur === 'start' || currentNote.slur === 'both') {
            // Collect all notes in this slur
            const slurNotes = [currentNote];
            let j = i + 1;

            while (j < notes.length && j < i + 20) { // Safety limit
                const nextNote = notes[j];

                // Include grace notes that come before the slur end
                if (nextNote.grace) {
                    slurNotes.push({ ...nextNote });
                    j++;
                    continue;
                }

                slurNotes.push({ ...nextNote });

                if (nextNote.slur === 'stop' || nextNote.slur === 'both') {
                    break;
                }
                j++;
            }

            // Check if all non-grace notes have the same pitch
            const mainNotes = slurNotes.filter(n => !n.grace);
            if (mainNotes.length > 0) {
                const firstPitch = mainNotes[0].noteName;
                const allSamePitch = mainNotes.every(n => n.noteName === firstPitch);

                if (allSamePitch && mainNotes.length > 1) {
                    // Check if multiple notes have different lyrics - if so, DON'T combine (they're not ties)
                    const notesWithLyrics = mainNotes.filter(n => n.lyric && n.lyric.trim());
                    const hasMultipleLyrics = notesWithLyrics.length > 1;

                    if (!hasMultipleLyrics) {
                        // Safe to combine - either no lyrics or only one lyric across all notes
                        const combinedNote = { ...mainNotes[0] };
                        const combinedDuration = mainNotes.reduce((sum, n) => sum + n.duration, 0);
                        combinedNote.duration = combinedDuration;
                        combinedNote.slur = null; // Remove slur marking

                        // Keep first lyric if any
                        for (const note of mainNotes) {
                            if (note.lyric) {
                                combinedNote.lyric = note.lyric;
                                break;
                            }
                        }

                        // Add combined note
                        convertedNotes.push(combinedNote);

                        // Add any grace notes that were in the slur
                        const graceNotes = slurNotes.filter(n => n.grace);
                        convertedNotes.push(...graceNotes);

                        console.log(`Combined ${mainNotes.length} ${firstPitch} notes into 1 (duration: ${combinedDuration}) - TRUE TIE`);
                    } else {
                        // Multiple lyrics = melisma, not tie - keep all notes separate
                        convertedNotes.push(...slurNotes);
                        console.log(`Kept ${mainNotes.length} ${firstPitch} notes separate - MELISMA (multiple lyrics: ${notesWithLyrics.map(n => n.lyric).join(', ')})`);
                    }
                } else {
                    // Keep all notes as-is if they don't have the same pitch
                    convertedNotes.push(...slurNotes);
                }
            } else {
                // No main notes, just add grace notes
                convertedNotes.push(...slurNotes);
            }

            // Skip to the end of the slur
            i = j + 1;
        } else {
            // Not part of a slur, add as-is
            convertedNotes.push(currentNote);
            i++;
        }
    }

    // Recalculate X positions for the converted notes
    let currentX = 120;
    convertedNotes.forEach(note => {
        note.x = currentX;
        currentX += note.grace ? 25 : note.duration * 85;
    });

    console.log(`Slur-to-tie conversion: ${notes.length} -> ${convertedNotes.length} notes`);

    // ADDITIONAL V1 STEP: Check for consecutive same-pitch notes without explicit slurs (implicit ties)
    const finalNotes = [];
    let idx = 0;

    while (idx < convertedNotes.length) {
        const currentNote = convertedNotes[idx];

        // Check for consecutive same-pitch notes without slur marking
        if (!currentNote.grace && idx + 1 < convertedNotes.length) {
            const nextNote = convertedNotes[idx + 1];
            if (!nextNote.grace &&
                nextNote.noteName === currentNote.noteName) {

                // Check total lyrics across both notes - should be 0 or 1 total, not 2
                const currentLyric = currentNote.lyric && currentNote.lyric.trim();
                const nextLyric = nextNote.lyric && nextNote.lyric.trim();
                const totalLyrics = [currentLyric, nextLyric].filter(Boolean).length;

                if (totalLyrics <= 1) { // 0 or 1 lyric total across both notes
                    // Combine them (implicit tie)
                    const combinedNote = { ...currentNote };
                    combinedNote.duration = currentNote.duration + nextNote.duration;

                    // Keep the lyric from whichever note has it
                    if (nextLyric) {
                        combinedNote.lyric = nextNote.lyric;
                    }

                    finalNotes.push(combinedNote);
                    console.log(`Combined 2 consecutive ${currentNote.noteName} notes (implicit tie, duration: ${combinedNote.duration})`);
                    idx += 2; // Skip both notes
                    continue;
                }
            }
        }

        // Not an implicit tie, add as-is
        finalNotes.push(currentNote);
        idx++;
    }

    // Recalculate X positions and re-index the final notes
    let finalX = 120;
    finalNotes.forEach((note, newIndex) => {
        note.x = finalX;
        note.index = newIndex + 1; // Re-index from 1 instead of 0
        finalX += note.grace ? 25 : note.duration * 85;
    });

    console.log(`Final conversion (with implicit ties): ${convertedNotes.length} -> ${finalNotes.length} notes`);
    return finalNotes;
}

// Generate V1-style SVG tablature
function generateTablatureSVG(songData) {
    const { notes, title } = songData;
    const maxX = Math.max(...notes.map(n => n.x)) + 200;

    // Find which strings are actually used
    const playedStrings = new Set(notes.map(n => n.string));

    // Extract all unique pitches from the song
    const uniquePitches = new Set();
    notes.forEach(note => {
        if (note.noteName) {
            uniquePitches.add(note.noteName);
        }
    });

    // Create unique string assignments for each unique pitch
    // Comprehensive pitch order system - designed so C notes start each octave
    const pitchOrder = {
        // Octave 3
        'C3': 0, 'C#3': 1, 'Db3': 1, 'D3': 2, 'D#3': 3, 'Eb3': 3, 'E3': 4, 'F3': 5, 'F#3': 6, 'Gb3': 6, 'G3': 7, 'G#3': 8, 'Ab3': 8, 'A3': 9, 'A#3': 10, 'Bb3': 10, 'B3': 11,

        // Octave 4 (main reference)
        'C4': 12, 'C#4': 13, 'Db4': 13, 'D4': 14, 'D#4': 15, 'Eb4': 15, 'E4': 16, 'F4': 17, 'F#4': 18, 'Gb4': 18, 'G4': 19, 'G#4': 20, 'Ab4': 20, 'A4': 21, 'A#4': 22, 'Bb4': 22, 'B4': 23,

        // Octave 5
        'C5': 24, 'C#5': 25, 'Db5': 25, 'D5': 26, 'D#5': 27, 'Eb5': 27, 'E5': 28, 'F5': 29, 'F#5': 30, 'Gb5': 30, 'G5': 31, 'G#5': 32, 'Ab5': 32, 'A5': 33, 'A#5': 34, 'Bb5': 34, 'B5': 35,

        // Octave 6
        'C6': 36, 'C#6': 37, 'Db6': 37, 'D6': 38, 'D#6': 39, 'Eb6': 39, 'E6': 40, 'F6': 41, 'F#6': 42, 'Gb6': 42, 'G6': 43
    };

    // Sort unique pitches by musical order with proper octave grouping
    const sortedPitches = Array.from(uniquePitches).sort((a, b) => {
        const orderA = pitchOrder[a] || 999;
        const orderB = pitchOrder[b] || 999;

        // First sort by octave (C4 comes before any other note in octave 4)
        const octaveA = Math.floor(orderA / 12);
        const octaveB = Math.floor(orderB / 12);

        if (octaveA !== octaveB) {
            return octaveA - octaveB;
        }

        // Within same octave, sort chromatically from C
        return orderA - orderB;
    });

    // Assign each unique pitch to its own string position
    const usedStringConfigs = [];
    const pitchToStringAssignment = new Map();
    const usedYPositions = new Set();

    sortedPitches.forEach((pitch, index) => {
        // Calculate proportional Y position based on semitones from first pitch
        const firstPitchSemitones = pitchOrder[sortedPitches[0]] || 0;
        const thisPitchSemitones = pitchOrder[pitch] || 0;
        const semitoneDistance = thisPitchSemitones - firstPitchSemitones;

        // Use proportional spacing based on actual musical intervals
        const baseY = 150;
        let yPosition = baseY + (semitoneDistance * 30); // 30px per semitone (proportional to cents)

        // Avoid exact duplicates by adding small offset if position already used
        while (usedYPositions.has(yPosition)) {
            yPosition += 5; // Small 5px offset to prevent overlaps
        }
        usedYPositions.add(yPosition);

        const stringNum = index + 1; // Assign sequential string numbers
        const config = { note: pitch, y: yPosition };

        usedStringConfigs.push([stringNum.toString(), config]);
        pitchToStringAssignment.set(pitch, stringNum);
    });

    // Store for metadata display - use the pitch count
    songData.usedStrings = new Set(sortedPitches.map((pitch, index) => index + 1));

    // Update note mapping to use the new pitch-based string assignments
    notes.forEach(note => {
        if (note.noteName && pitchToStringAssignment.has(note.noteName)) {
            const newStringNum = pitchToStringAssignment.get(note.noteName);
            const newConfig = usedStringConfigs.find(([num, config]) => num == newStringNum)[1];
            note.string = newStringNum;
            note.y = newConfig.y;
        }
    });

    // Calculate adaptive height based on used strings with proper padding
    const stringYPositions = usedStringConfigs.map(([num, config]) => config.y);
    const minStringY = Math.min(...stringYPositions);
    const maxStringY = Math.max(...stringYPositions);

    // Ensure minimum padding above and below strings
    const topPadding = 80;
    const bottomPadding = 80;
    const minY = minStringY - topPadding;
    const maxY = maxStringY + bottomPadding;
    const svgHeight = maxY - minY;

    let svg = `
<svg id="tablature" xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${svgHeight}">
    <!-- Transparent background for direct drawing -->
    <rect x="0" y="0" width="${maxX}" height="${svgHeight}" fill="transparent"/>

    <!-- String lines -->`;

    // Draw only used string lines (without labels first)
    usedStringConfigs.forEach(([stringNum, config]) => {
        const adjustedY = config.y - minY + 50; // Adjust for removed viewBox
        svg += `
    <line x1="100" y1="${adjustedY}" x2="${maxX}" y2="${adjustedY}"
          stroke="var(--text-secondary)" stroke-width="3" class="string-line"/>`;
    });

    // Draw notes
    notes.forEach(note => {
        const adjustedY = note.y - minY + 50; // Adjust for removed viewBox
        const isGrace = note.grace;
        const radius = isGrace ? 6 : 12;

        // Use theme background colors for note heads (save other colors for filtering)
        const noteColor = isGrace ?
            { fill: '#808080', stroke: '#666666' } :  // Grey for grace notes
            { fill: '#666666', stroke: '#444444' };   // Dark grey for main notes

        // Enhanced resonance band with gradient
        const bandWidth = isGrace ? 80 : 320;
        const bandHeight = isGrace ? 8 : 12;
        const gradientId = `grad-${note.index}`;

        // Add gradient definition for this note
        svg += `
    <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${isGrace ? '#808080' : '#666666'};stop-opacity:0.1" />
            <stop offset="50%" style="stop-color:${isGrace ? '#808080' : '#666666'};stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:${isGrace ? '#808080' : '#666666'};stop-opacity:0.05" />
        </linearGradient>
    </defs>`;

        svg += `
    <rect x="${note.x - 10}" y="${adjustedY - bandHeight/2 - 2}"
          width="${bandWidth}" height="${bandHeight}"
          fill="url(#${gradientId})"
          rx="4" class="resonance-band"/>`;

        // Note circle with shadow
        svg += `
    <circle cx="${note.x}" cy="${adjustedY}" r="${radius}"
            class="note-circle"
            fill="${noteColor.fill}"
            stroke="${noteColor.stroke}"
            stroke-width="2"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
            data-note-index="${note.index}"
            data-is-grace="${isGrace}"/>`;

        // String number inside circle
        svg += `
    <text x="${note.x}" y="${adjustedY + 5}"
          text-anchor="middle" class="string-number"
          style="font-size: ${isGrace ? '10px' : '14px'}; fill: white; font-weight: bold;"
          data-note-index="${note.index}">
        ${note.string}
    </text>`;

        // Note index
        svg += `
    <text x="${note.x}" y="${adjustedY - radius - 15}"
          text-anchor="middle" class="note-index"
          style="font-size: 9px; fill: var(--text-secondary); opacity: 0.7;"
          data-note-index="${note.index}">
        #${note.index}
    </text>`;

        // Lyrics
        if (note.lyric) {
            svg += `
    <text x="${note.x + 4}" y="${adjustedY + 40}"
          text-anchor="start" class="lyric-text"
          style="font-size: 11px; fill: var(--text-primary); font-weight: bold;"
          transform="rotate(-90, ${note.x + 4}, ${adjustedY + 40})"
          data-note-index="${note.index}">
        ${note.lyric}
    </text>`;
        }
    });

    <!-- String labels drawn last to appear on top -->`;

    // Draw string labels on top of everything (no background box)
    usedStringConfigs.forEach(([stringNum, config]) => {
        const adjustedY = config.y - minY + 50; // Adjust for removed viewBox
        const labelText = config.note ? `String ${stringNum}: ${config.note}` : `String ${stringNum}: ${STRING_CONFIG[stringNum]?.note || ''}`;
        svg += `
    <text x="20" y="${adjustedY + 5}" class="string-label"
          style="font-size: 12px; fill: var(--text-primary); font-weight: bold;">
        ${labelText}
    </text>`;
    });

    svg += `
</svg>`;

    return svg;
}

// Vietnamese-aware Title Case function (same as library)
function toTitleCase(str) {
    const lowercaseWords = ['và', 'của', 'cho', 'với', 'từ', 'trong', 'trên', 'dưới', 'về', 'đến', 'tại', 'bên', 'theo', 'cùng', 'như', 'hay', 'hoặc', 'nhưng', 'mà', 'để', 'khi', 'nếu', 'vì', 'do', 'bởi', 'qua', 'ra', 'vào', 'lên', 'xuống', 'em', 'con', 'là', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'quan', 'họ', 'ru', 'hò'];
    const words = str.split(/\s+/);
    return words.map(function(word, index) {
        if (index === 0) {
            return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
        }
        if (lowercaseWords.includes(word.toLowerCase())) {
            return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    }).join(' ');
}

// Generate complete HTML viewer
function generateViewer(songData, metadata) {
    const svg = generateTablatureSVG(songData);

    // Calculate strings display
    let stringsDisplay;
    const titleNormalized = songData.title.toLowerCase().normalize('NFC');

    // Extract unique pitches from all notes in the song
    const uniquePitches = new Set();
    songData.notes.forEach(note => {
        if (note.noteName) {
            uniquePitches.add(note.noteName);
        }
    });

    // Pitch ordering system (same as in tablature generation)
    const pitchOrder = {
        'C4': 0, 'C#4': 1, 'Db4': 1, 'D4': 2, 'D#4': 3, 'Eb4': 3, 'E4': 4, 'F4': 5, 'F#4': 6, 'Gb4': 6, 'G4': 7, 'G#4': 8, 'Ab4': 8, 'A4': 9, 'A#4': 10, 'Bb4': 10, 'B4': 11,
        'C5': 12, 'C#5': 13, 'Db5': 13, 'D5': 14, 'D#5': 15, 'Eb5': 15, 'E5': 16, 'F5': 17, 'F#5': 18, 'Gb5': 18, 'G5': 19, 'G#5': 20, 'Ab5': 20, 'A5': 21, 'A#5': 22, 'Bb5': 22, 'B5': 23
    };

    // Convert pitches to strings and sort them musically
    const pitchToStringMap = {
        'C4': 5, 'D4': 5, 'E4': 7, 'F4': 7, 'G4': 7, 'A4': 8, 'B4': 9, 'C5': 9,
        'D5': 10, 'E5': 11, 'F5': 11, 'G5': 12, 'A5': 12, 'B5': 12
    };

    // Get unique strings for the unique pitches
    const uniqueStrings = new Set();
    const pitchList = [];

    Array.from(uniquePitches).forEach(pitch => {
        pitchList.push(pitch);
        const stringNum = pitchToStringMap[pitch];
        if (stringNum) {
            uniqueStrings.add(stringNum);
        }
    });

    // Sort pitches musically using the same order as the tablature generation
    pitchList.sort((a, b) => {
        const orderA = pitchOrder[a] || 999;
        const orderB = pitchOrder[b] || 999;

        // First sort by octave (C4 comes before any other note in octave 4)
        const octaveA = Math.floor(orderA / 12);
        const octaveB = Math.floor(orderB / 12);

        if (octaveA !== octaveB) {
            return octaveA - octaveB;
        }

        // Within same octave, sort chromatically from C
        return orderA - orderB;
    });

    // Clean up pitch names for display (handle accidentals consistently)
    const cleanedPitches = pitchList.map(pitch => {
        // Normalize accidental notation: use # and b consistently
        return pitch.replace('♯', '#').replace('♭', 'b');
    });

    // Display format: "4 (C4, D4, F4, G4)" showing unique pitches
    stringsDisplay = `${cleanedPitches.length} (${cleanedPitches.join(', ')})`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${toTitleCase(songData.title)} - Đàn Tranh V3 Viewer</title>
    <style>
        :root {
            /* 12-color system from V1 */
            --main-note: #008080;
            --main-note-dark: #005959;
            --grace-note: #FFD700;
            --grace-note-dark: #CC9900;
            --tone-mark: #9B59B6;
            --tone-mark-dark: #7D3C98;
            --melisma: #E74C3C;
            --melisma-dark: #C0392B;
            --kpic-1: #0066CC;
            --kpic-2: #3498DB;
            --kpic-3: #5DADE2;
            --kpic-4: #85C1E9;
            --kric-1: #27AE60;
            --kric-2: #52BE80;
            --kric-3: #76D7A4;
            --kric-4: #A9DFBF;
        }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            transition: background 0.3s ease;
            overflow-x: auto;
            overflow-y: auto;
        }

        /* Theme System - 4 Standard Themes */
        body {
            background: #D0D0D0;
            --text-primary: #2C3E50;
            --text-secondary: #34495E;
            --card-bg: rgba(255, 255, 255, 0.95);
            --card-text: #2C3E50;
        }

        body.theme-white {
            background: #FFFFFF;
            --text-primary: #2C3E50;
            --text-secondary: #7F8C8D;
            --card-bg: white;
            --card-text: #2C3E50;
        }

        body.theme-light-grey {
            background: #D0D0D0;
            --text-primary: #2C3E50;
            --text-secondary: #34495E;
            --card-bg: rgba(255, 255, 255, 0.95);
            --card-text: #2C3E50;
        }

        body.theme-dark-grey {
            background: #2C3E50;
            --text-primary: #ECF0F1;
            --text-secondary: #BDC3C7;
            --card-bg: rgba(52, 73, 94, 0.9);
            --card-text: #ECF0F1;
        }

        body.theme-black {
            background: #000000;
            --text-primary: white;
            --text-secondary: #CCCCCC;
            --card-bg: rgba(26, 26, 26, 0.9);
            --card-text: white;
        }

        .container {
            position: relative;
            width: 100%;
            padding: 0;
        }

        header {
            text-align: center;
            background: var(--card-bg);
            padding: 20px;
            margin: 0;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h1 {
            color: var(--card-text);
            margin: 0 0 5px 0;
            font-size: 1.8em;
        }

        .metadata {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 20px 0;
            color: var(--text-secondary);
        }

        .metadata-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .metadata-label {
            font-weight: bold;
            color: var(--kpic-1);
        }

        .controls {
            background: var(--card-bg);
            padding: 15px 20px;
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 25px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            max-width: 90%;
        }

        .controls label,
        .controls span {
            color: var(--card-text);
        }

        input[type="range"] {
            accent-color: var(--kpic-2);
        }

        .back-link {
            background: var(--kpic-2);
            color: white;
        }

        .back-link:hover {
            background: var(--kpic-1);
        }

        .zoom-controls {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .zoom-btn {
            padding: 8px 16px;
            background: var(--main-note);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .zoom-btn:hover {
            background: var(--main-note-dark);
            transform: scale(1.05);
        }

        .tablature-container {
            margin-top: 150px; /* Space for fixed header */
            padding: 20px;
            min-height: calc(100vh - 150px);
            overflow-x: auto;
            overflow-y: auto;
            width: 100%;
        }

        #tablature {
            display: block;
        }

        .note-circle {
            cursor: pointer;
            transition: all 0.3s;
        }

        .note-circle:hover {
            filter: drop-shadow(0 0 10px rgba(0, 128, 128, 0.6));
            transform: scale(1.1);
        }

        .string-label {
            font-size: 12px;
            fill: #666;
        }

        .string-number {
            font-size: 10px;
            fill: white;
            font-weight: bold;
        }

        .back-link {
            position: fixed;
            top: 90px;
            left: 20px;
            padding: 10px 20px;
            background: var(--kpic-2);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            transition: all 0.3s;
            z-index: 1001;
            font-size: 14px;
        }

        .back-link:hover {
            background: var(--kpic-1);
            transform: translateX(-5px);
        }

        .efficiency-badge {
            background: var(--kric-1);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${toTitleCase(songData.title)}</h1>
            <div class="metadata">
                <div class="metadata-item">
                    <span class="metadata-label">Notes:</span>
                    <span>${metadata?.noteCount || songData.notes.length}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Unique:</span>
                    <span>${metadata?.uniqueNotes || '?'}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Strings:</span>
                    <span>${stringsDisplay}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Tempo:</span>
                    <span>${metadata?.tempo || '120'} BPM</span>
                </div>
                ${metadata?.patternEfficiency ? `
                <div class="metadata-item">
                    <span class="efficiency-badge">
                        Learn ${metadata.patternEfficiency.learnOnly} patterns → Play ${metadata.patternEfficiency.totalNotes} notes
                    </span>
                </div>
                ` : ''}
            </div>
        </header>

        <a href="/" class="back-link">← Back to Library</a>

        <div class="controls">
            <div class="zoom-controls">
                <div style="display: flex; gap: 30px; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <label style="color: #666; min-width: 60px;">X-Zoom:</label>
                        <input type="range" id="xZoomSlider" min="1" max="200" value="100"
                               style="width: 200px;" oninput="updateXZoom()">
                        <span style="color: #666; min-width: 45px;"><span id="zoomLevelX">100</span>%</span>
                        <button class="zoom-btn" onclick="fitWidth()">Fit Width</button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <label style="color: #666; min-width: 60px;">Y-Zoom:</label>
                        <input type="range" id="yZoomSlider" min="1" max="200" value="100"
                               style="width: 200px;" oninput="updateYZoom()">
                        <span style="color: #666; min-width: 45px;"><span id="zoomLevelY">100</span>%</span>
                        <button class="zoom-btn" onclick="fitHeight()">Fit Height</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Theme selector - top right corner -->
        <div class="theme-selector" style="position: fixed; right: 20px; top: 20px; display: flex; gap: 10px; z-index: 1001;">
            <button class="theme-btn" onclick="setTheme('white')" style="background: white; border: 2px solid #ccc; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;" title="White"></button>
            <button class="theme-btn" onclick="setTheme('light-grey')" style="background: #D0D0D0; border: 2px solid #ccc; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;" title="Light Grey"></button>
            <button class="theme-btn" onclick="setTheme('dark-grey')" style="background: #2C3E50; border: 2px solid #34495E; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;" title="Dark Grey"></button>
            <button class="theme-btn" onclick="setTheme('black')" style="background: black; border: 2px solid #333; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;" title="Black"></button>
        </div>

        <div class="tablature-container">
            ${svg}
        </div>
    </div>

    <script>
        // Vietnamese-aware Title Case function (same as library)
        function toTitleCase(str) {
            const lowercaseWords = ['và', 'của', 'cho', 'với', 'từ', 'trong', 'trên', 'dưới', 'về', 'đến', 'tại', 'bên', 'theo', 'cùng', 'như', 'hay', 'hoặc', 'nhưng', 'mà', 'để', 'khi', 'nếu', 'vì', 'do', 'bởi', 'qua', 'ra', 'vào', 'lên', 'xuống', 'em', 'con', 'là', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'quan', 'họ', 'ru', 'hò'];
            const words = str.split(/\\s+/);
            return words.map(function(word, index) {
                if (index === 0) {
                    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
                }
                if (lowercaseWords.includes(word.toLowerCase())) {
                    return word.toLowerCase();
                }
                return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
            }).join(' ');
        }

        let currentZoomX = 1;
        let currentZoomY = 1;
        let initialized = false;
        let containerWidth = 0;
        let containerHeight = 0;

        function initializeZoom() {
            if (initialized) {
                console.log('Already initialized, skipping...');
                return;
            }
            console.log('Starting zoom initialization...');

            const svg = document.getElementById('tablature');

            // Store base positions for all elements
            const notes = svg.querySelectorAll('.note-circle');
            notes.forEach(note => {
                note.setAttribute('data-base-x', note.getAttribute('cx'));
                note.setAttribute('data-base-y', note.getAttribute('cy'));
            });

            const bands = svg.querySelectorAll('.resonance-band');
            bands.forEach(band => {
                band.setAttribute('data-base-x', band.getAttribute('x'));
                band.setAttribute('data-base-y', band.getAttribute('y'));
                band.setAttribute('data-base-width', band.getAttribute('width'));
            });

            const strings = svg.querySelectorAll('.string-line');
            strings.forEach(line => {
                line.setAttribute('data-base-y1', line.getAttribute('y1'));
                line.setAttribute('data-base-y2', line.getAttribute('y2'));
            });

            const texts = svg.querySelectorAll('text');
            texts.forEach(text => {
                text.setAttribute('data-base-x', text.getAttribute('x'));
                text.setAttribute('data-base-y', text.getAttribute('y'));
                const transform = text.getAttribute('transform');
                if (transform) {
                    text.setAttribute('data-base-transform', transform);
                }
            });

            // Store SVG base dimensions
            svg.setAttribute('data-base-width', svg.getAttribute('width'));
            svg.setAttribute('data-base-height', svg.getAttribute('height'));
            const viewBox = svg.getAttribute('viewBox');
            if (viewBox) {
                svg.setAttribute('data-base-viewbox', viewBox);
            }

            initialized = true;
            console.log('Zoom initialization complete');
        }

        function updateZoom() {
            console.log('updateZoom called - X:', currentZoomX, 'Y:', currentZoomY);
            const svg = document.getElementById('tablature');

            // Initialize if needed
            if (!initialized) {
                console.log('Initializing zoom...');
                initializeZoom();
            }

            // Update note positions only
            const notes = svg.querySelectorAll('.note-circle');
            console.log('Found', notes.length, 'notes to update');
            notes.forEach((note, i) => {
                const baseX = parseFloat(note.getAttribute('data-base-x'));
                const baseY = parseFloat(note.getAttribute('data-base-y'));

                const scaledX = 120 + (baseX - 120) * currentZoomX;
                const scaledY = baseY * currentZoomY;

                if (i === 0 || i === 1 || i === notes.length - 1) {
                    console.log('Note ' + i + ': baseX=', baseX, 'baseY=', baseY, '-> scaledX=', scaledX, 'scaledY=', scaledY);
                }

                note.setAttribute('cx', scaledX);
                note.setAttribute('cy', scaledY);
            });

            // Update resonance bands - position and width only
            const bands = svg.querySelectorAll('.resonance-band');
            bands.forEach(band => {
                const baseX = parseFloat(band.getAttribute('data-base-x'));
                const baseY = parseFloat(band.getAttribute('data-base-y'));
                const baseWidth = parseFloat(band.getAttribute('data-base-width'));

                const scaledX = 120 + (baseX - 120) * currentZoomX;
                const scaledY = baseY * currentZoomY; // Center on string
                const scaledWidth = baseWidth * currentZoomX;

                band.setAttribute('x', scaledX - 10);
                band.setAttribute('y', scaledY);
                band.setAttribute('width', scaledWidth);
            });

            // Update string lines - Y position and X length
            const strings = svg.querySelectorAll('.string-line');
            const baseWidthForStrings = parseFloat(svg.getAttribute('data-base-width'));
            const newWidthForStrings = 120 + (baseWidthForStrings - 120) * currentZoomX;

            // Ensure string lines cover all resonance bands (320px wide) + 10px extra
            // Resonance bands extend 160px each direction from note center, so +170px from last note
            const minStringLength = newWidthForStrings + 170;

            strings.forEach(line => {
                const baseY = parseFloat(line.getAttribute('data-base-y1'));
                const scaledY = baseY * currentZoomY;

                line.setAttribute('y1', scaledY);
                line.setAttribute('y2', scaledY);
                // Keep x1 at label-safe position, extend x2 to cover all resonance bands
                line.setAttribute('x1', 100); // Respect the SVG generation setting
                line.setAttribute('x2', minStringLength); // Ensure coverage of resonance bands
            });

            // Update text positions
            const texts = svg.querySelectorAll('text');
            texts.forEach(text => {
                const baseX = parseFloat(text.getAttribute('data-base-x'));
                const baseY = parseFloat(text.getAttribute('data-base-y'));

                if (text.classList.contains('string-label')) {
                    // String labels - only Y changes
                    text.setAttribute('y', baseY * currentZoomY);
                } else if (text.classList.contains('lyric-text')) {
                    // Lyrics - position relative to their note
                    const noteIndex = text.getAttribute('data-note-index');
                    const associatedNote = svg.querySelector(\`.note-circle[data-note-index="\${noteIndex}"]\`);

                    if (associatedNote) {
                        const noteX = parseFloat(associatedNote.getAttribute('cx'));
                        const noteY = parseFloat(associatedNote.getAttribute('cy'));

                        // Keep lyrics at constant offset from note
                        const lyricX = noteX + 4;
                        const lyricY = noteY + 40;

                        text.setAttribute('x', lyricX);
                        text.setAttribute('y', lyricY);

                        // Update rotation around the new position
                        text.setAttribute('transform', \`rotate(-90, \${lyricX}, \${lyricY})\`);
                    }
                } else if (text.classList.contains('note-index')) {
                    // Note index numbers - position above their note
                    const noteIndex = text.getAttribute('data-note-index');
                    const associatedNote = svg.querySelector(\`.note-circle[data-note-index="\${noteIndex}"]\`);

                    if (associatedNote) {
                        const noteX = parseFloat(associatedNote.getAttribute('cx'));
                        const noteY = parseFloat(associatedNote.getAttribute('cy'));
                        const isGrace = associatedNote.getAttribute('data-is-grace') === 'true';
                        const radius = isGrace ? 6 : 12;

                        // Keep index at constant offset above note
                        text.setAttribute('x', noteX);
                        text.setAttribute('y', noteY - radius - 15);
                    }
                } else if (text.classList.contains('string-number')) {
                    // String numbers - position inside their note
                    const noteIndex = text.getAttribute('data-note-index');
                    const associatedNote = svg.querySelector(\`.note-circle[data-note-index="\${noteIndex}"]\`);

                    if (associatedNote) {
                        const noteX = parseFloat(associatedNote.getAttribute('cx'));
                        const noteY = parseFloat(associatedNote.getAttribute('cy'));

                        // Keep string number centered in note
                        text.setAttribute('x', noteX);
                        text.setAttribute('y', noteY + 4);
                    }
                } else {
                    // Other text - scale with tablature
                    const scaledX = 120 + (baseX - 120) * currentZoomX;
                    const scaledY = baseY * currentZoomY;

                    text.setAttribute('x', scaledX);
                    text.setAttribute('y', scaledY);
                }
            });

            // Update SVG dimensions - without viewBox
            const baseWidth = parseFloat(svg.getAttribute('data-base-width'));
            const baseHeight = parseFloat(svg.getAttribute('data-base-height'));

            // Calculate new dimensions
            const newWidth = 120 + (baseWidth - 120) * currentZoomX;
            const newHeight = baseHeight * currentZoomY;

            console.log('SVG dimensions: base', baseWidth, 'x', baseHeight, '-> new', newWidth, 'x', newHeight);

            svg.setAttribute('width', newWidth);
            svg.setAttribute('height', newHeight);

            document.getElementById('zoomLevelX').textContent = Math.round(currentZoomX * 100);
            document.getElementById('zoomLevelY').textContent = Math.round(currentZoomY * 100);
        }

        function updateXZoom() {
            const slider = document.getElementById('xZoomSlider');
            currentZoomX = parseFloat(slider.value) / 100;
            console.log('X-Zoom slider changed to:', slider.value, '%, zoom factor:', currentZoomX);
            updateZoom();
        }

        function updateYZoom() {
            const slider = document.getElementById('yZoomSlider');
            currentZoomY = parseFloat(slider.value) / 100;
            console.log('Y-Zoom slider changed to:', slider.value, '%, zoom factor:', currentZoomY);
            updateZoom();
        }

        function fitWidth() {
            const container = document.querySelector('.tablature-container');
            const svg = document.getElementById('tablature');
            const baseWidth = parseFloat(svg.getAttribute('data-base-width'));

            // Account for resonance band extension (170px) to show complete tablature
            const fullTablatureWidth = baseWidth + 170;

            containerWidth = container.clientWidth - 40; // Account for padding
            currentZoomX = containerWidth / fullTablatureWidth;

            console.log('Fit Width: container=', containerWidth, 'base=', baseWidth, 'zoom=', currentZoomX);

            // Update slider
            const slider = document.getElementById('xZoomSlider');
            slider.value = Math.round(currentZoomX * 100);

            updateZoom();
        }

        function fitHeight() {
            const container = document.querySelector('.tablature-container');
            const svg = document.getElementById('tablature');
            const baseHeight = parseFloat(svg.getAttribute('data-base-height'));

            containerHeight = window.innerHeight * 0.6; // Use 60% of viewport height
            currentZoomY = containerHeight / baseHeight;

            console.log('Fit Height: container=', containerHeight, 'base=', baseHeight, 'zoom=', currentZoomY);

            // Update slider
            const slider = document.getElementById('yZoomSlider');
            slider.value = Math.round(currentZoomY * 100);

            updateZoom();
        }

        // Note click handler
        document.querySelectorAll('.note-circle').forEach(note => {
            note.addEventListener('click', function() {
                const index = this.dataset.noteIndex;
                const isGrace = this.dataset.isGrace === 'true';
                console.log(\`Note #\${index} clicked (Grace: \${isGrace})\`);
            });
        });

        // Theme management
        function setTheme(theme) {
            document.body.className = '';
            if (theme === 'white') {
                document.body.classList.add('theme-white');
            } else if (theme === 'light-grey') {
                document.body.classList.add('theme-light-grey');
            } else if (theme === 'dark-grey') {
                document.body.classList.add('theme-dark-grey');
            } else if (theme === 'black') {
                document.body.classList.add('theme-black');
            }
            // Default is light-grey theme (no class needed)
            localStorage.setItem('tablatureTheme', theme);
        }

        // Initialize zoom on page load
        window.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded - initializing zoom system');
            initializeZoom();

            // Load saved theme or default to light-grey
            const savedTheme = localStorage.getItem('tablatureTheme') || 'light-grey';
            setTheme(savedTheme);

            // Set default to fit width and height
            setTimeout(() => {
                console.log('Setting default zoom to fit width and height');
                fitWidth();
                fitHeight();
            }, 100);
        });
    </script>
</body>
</html>`;
}

// Main processing function
async function processAllSongs() {
    const musicxmlDir = path.join(__dirname, 'data', 'musicxml');
    const processedDir = path.join(__dirname, 'data', 'processed');

    const files = fs.readdirSync(musicxmlDir).filter(f => f.endsWith('.xml'));

    console.log(`Processing ${files.length} songs...`);

    for (const file of files) {
        const xmlPath = path.join(musicxmlDir, file);
        const safeName = file.replace('.musicxml.xml', '').replace(/[^a-zA-Z0-9À-ỹ\s]/g, '_').replace(/\s+/g, '_');
        const outputDir = path.join(processedDir, safeName);

        // Load existing metadata if available
        let metadata = null;
        const metadataPath = path.join(outputDir, 'metadata.json');
        if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        }

        try {
            // Parse MusicXML
            const songData = await parseMusicXML(xmlPath);

            // Apply slur-to-tie conversion (CRITICAL for V1-compatible note counts)
            songData.notes = convertSlursToTies(songData.notes);

            // Calculate used strings (before generating HTML)
            const usedStrings = new Set(songData.notes.map(n => n.string));
            songData.usedStrings = usedStrings;

            // Generate viewer HTML
            const viewerHTML = generateViewer(songData, metadata);

            // Update metadata with corrected data (post slur-to-tie conversion + usedStrings calculated)
            if (metadata) {
                metadata.noteCount = songData.notes.length;
                metadata.processedDate = new Date().toISOString();

                // Update string count based on unique pitches
                const uniquePitches = new Set();
                songData.notes.forEach(note => {
                    if (note.noteName) {
                        uniquePitches.add(note.noteName);
                    }
                });
                metadata.strings = uniquePitches.size;

                // Also update pattern efficiency totalNotes to match corrected count
                if (metadata.patternEfficiency) {
                    metadata.patternEfficiency.totalNotes = songData.notes.length;
                }

                // Write updated metadata
                fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
                console.log(`Updated metadata: noteCount = ${metadata.noteCount}, strings = ${metadata.strings} (corrected)`);
            }

            // Save viewer
            const viewerPath = path.join(outputDir, 'viewer.html');
            fs.writeFileSync(viewerPath, viewerHTML);

            console.log(`✓ Generated viewer for: ${songData.title}`);
        } catch (err) {
            console.error(`✗ Error processing ${file}:`, err.message);
        }
    }

    console.log('Done! All viewers generated.');
}

// Run if called directly
if (require.main === module) {
    processAllSongs().catch(console.error);
}

module.exports = { parseMusicXML, generateViewer };