const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load Dan Tranh configuration
const danTranhConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/dan-tranh-config.json'), 'utf8'));
const DEFAULT_STRING_COUNT = danTranhConfig.stringConfiguration.default;

// Load comprehensive tuning systems database
const tuningSystems = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/tuning-systems.json'), 'utf8'));

// Pentatonic Tuning System - Based on collection analysis
// Top 5 pitch classes: D, A, G, C, E (covers 81.6% of all notes)
// Remaining notes require string bending
const baseY = 110;
const pixelsPerCent = 0.3;

// Generate string configuration based on song's actual tuning
// Dan Tranh uses the detected tuning from the song, starting at lowest note used
function generateDanTranhStrings(tuning, lowestNote = 'E3', maxStrings = 17) {
    const strings = {};
    let stringNum = 1;

    // Extract note and octave from lowestNote
    const match = lowestNote.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) return strings;

    const [, startPitch, startOctaveStr] = match;
    let octave = parseInt(startOctaveStr);

    // Find starting position in tuning array
    let noteIndex = tuning.indexOf(startPitch);
    if (noteIndex === -1) {
        // If exact note not in tuning, find closest
        noteIndex = 0;
    }

    // Calculate semitone offsets for the specific tuning
    const pitchOrder = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    while (stringNum <= maxStrings && octave <= 7) {
        const pitch = tuning[noteIndex];
        const noteName = `${pitch}${octave}`;
        const semitones = (octave - 3) * 12 + (pitchOrder[pitch] || 0);
        const yPos = baseY + (semitones * 100 * pixelsPerCent);
        strings[stringNum] = { note: noteName, y: yPos, pitchClass: pitch };
        stringNum++;

        // Move to next note in tuning
        noteIndex++;
        if (noteIndex >= tuning.length) {
            noteIndex = 0;
            octave++;
        }
    }

    return strings;
}

// Default 17-string configuration with standard pentatonic tuning
// Will be overridden by song-specific tuning
const DEFAULT_TUNING = ['C', 'D', 'E', 'G', 'A'];
const STRING_CONFIG = generateDanTranhStrings(DEFAULT_TUNING, 'E3', 17);

// 12-color system from CLAUDE.md
const COLORS = {
    mainNote: { fill: '#008080', stroke: '#005959' },  // Teal with darker teal stroke
    graceNote: { fill: '#FFD700', stroke: '#CC9900' }, // Gold with darker gold stroke
    toneMarking: { fill: '#9B59B6', stroke: '#7D3C98' },
    melisma: { fill: '#E74C3C', stroke: '#C0392B' },
    bentNote: { fill: '#E74C3C', stroke: '#C0392B' }   // Red for bent notes
};

// Calculate semitone distance between two notes
function getSemitoneDistance(note1, note2) {
    const pitchOrder = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    const match1 = note1.match(/^([A-G][#b]?)(\d+)$/);
    const match2 = note2.match(/^([A-G][#b]?)(\d+)$/);
    if (!match1 || !match2) return 0;

    const [, pitch1, octave1] = match1;
    const [, pitch2, octave2] = match2;

    const semitones1 = parseInt(octave1) * 12 + (pitchOrder[pitch1] || 0);
    const semitones2 = parseInt(octave2) * 12 + (pitchOrder[pitch2] || 0);

    return semitones2 - semitones1;
}

// Find closest open string below a given note
function findClosestOpenString(noteName, stringConfig, tuning) {
    const noteMatch = noteName.match(/^([A-G][#b]?)(\d+)$/);
    if (!noteMatch) return null;

    const [, pitchClass, octave] = noteMatch;
    const openStrings = Object.entries(stringConfig)
        .filter(([_, config]) => tuning.includes(config.pitchClass))
        .sort((a, b) => a[1].y - b[1].y); // Sort by Y position (low to high)

    // Find the closest open string below or at this note
    let closestString = null;
    let minDistance = Infinity;

    for (const [stringNum, config] of openStrings) {
        const distance = getSemitoneDistance(config.note, noteName);
        if (distance >= 0 && distance < minDistance) {
            minDistance = distance;
            closestString = { stringNum: parseInt(stringNum), config, semitoneDistance: distance };
        }
    }

    return closestString;
}

// Calculate song-specific pentatonic tuning (top 5 pitch classes)
function calculateSongTuning(noteElements) {
    const pitchClassCounts = {};

    noteElements.forEach(noteEl => {
        const pitch = noteEl.querySelector('pitch');
        if (!pitch) return;

        const step = pitch.querySelector('step')?.textContent;
        const alter = pitch.querySelector('alter')?.textContent || '0';
        if (step) {
            const pitchClass = step + (alter === '1' ? '#' : alter === '-1' ? 'b' : '');
            pitchClassCounts[pitchClass] = (pitchClassCounts[pitchClass] || 0) + 1;
        }
    });

    // Sort by frequency and take most frequent notes
    const sortedPitches = Object.entries(pitchClassCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([pitch, _]) => pitch);

    // If we have fewer than 5 notes, intelligently fill in missing ones
    let tuning = sortedPitches.slice(0, 5);

    if (tuning.length < 5) {
        // Use the comprehensive tuning database
        const tuningKey = tuning.sort().join(',');
        let fullTuning = null;

        // Check pattern completions based on note count
        if (tuning.length === 3 && tuningSystems.patternCompletions['3-note'][tuningKey]) {
            fullTuning = tuningSystems.patternCompletions['3-note'][tuningKey];
        } else if (tuning.length === 4 && tuningSystems.patternCompletions['4-note'][tuningKey]) {
            fullTuning = tuningSystems.patternCompletions['4-note'][tuningKey];
        } else {
            // Fill with logical notes based on what we have
            const hasC = tuning.includes('C');
            const hasD = tuning.includes('D');
            const hasE = tuning.includes('E');
            const hasF = tuning.includes('F');
            const hasG = tuning.includes('G');
            const hasA = tuning.includes('A');
            const hasBb = tuning.includes('Bb');
            const hasB = tuning.includes('B');

            // Add missing notes in order of preference
            if (!hasD && tuning.length < 5) tuning.push('D');
            if (!hasA && tuning.length < 5) tuning.push('A');
            if (!hasE && tuning.length < 5) tuning.push('E');
            if (!hasG && tuning.length < 5) tuning.push('G');
            if (!hasC && tuning.length < 5) tuning.push('C');
            if (!hasF && tuning.length < 5) tuning.push('F');
            if (!hasBb && tuning.length < 5) tuning.push('Bb');
            if (!hasB && tuning.length < 5) tuning.push('B');
        }

        if (fullTuning) {
            tuning = fullTuning;
        }
    }

    // Sort by chromatic position (C=0, C#/Db=1, D=2, etc.)
    const chromaticOrder = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8,
        'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    tuning = tuning.slice(0, 5).sort((a, b) => chromaticOrder[a] - chromaticOrder[b]);

    return tuning;
}

// Generate song-specific string configuration
function generateSongSpecificStrings(tuning, startOctave, endOctave) {
    const strings = {};
    let stringNum = 1;

    // Define semitone offsets from C for all notes (including accidentals)
    const semitoneFromC = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8,
        'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    for (let octave = startOctave; octave <= endOctave; octave++) {
        for (const pitch of tuning) {
            const noteName = `${pitch}${octave}`;
            const semitones = (octave - 3) * 12 + semitoneFromC[pitch];
            const yPos = baseY + (semitones * 100 * pixelsPerCent);
            strings[stringNum] = { note: noteName, y: yPos, pitchClass: pitch };
            stringNum++;
        }
    }
    return strings;
}

// Parse multi-part score (for ensemble pieces with multiple đàn tranh)
function parseMultiPartScore(doc, xmlPath, parts) {
    const partData = [];

    parts.forEach((part, partIndex) => {
        const notes = [];
        const noteElements = part.querySelectorAll('note');

        // Calculate song-specific tuning for this part
        const songTuning = calculateSongTuning(noteElements);

        // Calculate octave range from actual notes
        const octaves = [];
        noteElements.forEach(noteEl => {
            const pitch = noteEl.querySelector('pitch');
            if (pitch) {
                const octave = parseInt(pitch.querySelector('octave')?.textContent);
                if (octave) octaves.push(octave);
            }
        });
        const minOctave = Math.min(...octaves);
        const maxOctave = Math.max(...octaves);

        // Generate 17-string configuration based on song's tuning
        const startNote = songTuning.includes('E') ? 'E3' :
                          songTuning.includes('D') ? 'D3' :
                          songTuning.includes('F') ? 'F3' : `${songTuning[0]}3`;
        const SONG_SPECIFIC_STRINGS = generateDanTranhStrings(songTuning, startNote, 17);

        let currentX = 120;

        noteElements.forEach((noteEl, index) => {
            // Check for rests first - advance X but don't create a note
            const rest = noteEl.querySelector('rest');
            if (rest) {
                const duration = noteEl.querySelector('duration')?.textContent || '1';
                currentX += parseInt(duration) * 60;
                return;
            }

            const pitch = noteEl.querySelector('pitch');
            if (!pitch) return;

            const step = pitch.querySelector('step')?.textContent;
            const octave = pitch.querySelector('octave')?.textContent;
            const alter = pitch.querySelector('alter')?.textContent || '0';
            const duration = noteEl.querySelector('duration')?.textContent || '1';
            const grace = noteEl.querySelector('grace') !== null;
            const lyricEl = noteEl.querySelector('lyric text');
            const lyric = lyricEl ? lyricEl.textContent : '';

            const slurStart = noteEl.querySelector('notations slur[type="start"]') !== null;
            const slurStop = noteEl.querySelector('notations slur[type="stop"]') !== null;
            let slurType = null;
            if (slurStart && slurStop) slurType = 'both';
            else if (slurStart) slurType = 'start';
            else if (slurStop) slurType = 'stop';

            const noteName = step + (alter === '1' ? '#' : alter === '-1' ? 'b' : '') + octave;
            const pitchClass = noteName.match(/^([A-G][#b]?)/)?.[1];

            let stringNum = null;
            let stringY = null;
            let isBent = false;
            let bendFromString = null;
            let bendRatio = 0;

            const openStringMatch = Object.entries(SONG_SPECIFIC_STRINGS).find(
                ([_, config]) => config.note === noteName
            );

            if (openStringMatch) {
                stringNum = parseInt(openStringMatch[0]);
                stringY = openStringMatch[1].y;
                isBent = false;
            } else {
                const closestString = findClosestOpenString(noteName, SONG_SPECIFIC_STRINGS, songTuning);
                if (closestString) {
                    stringNum = closestString.stringNum;
                    stringY = closestString.y;
                    isBent = true;
                    bendFromString = closestString.stringNum;
                    bendRatio = closestString.bendRatio;
                }
            }

            if (stringNum !== null) {
                notes.push({
                    noteName,
                    string: stringNum,
                    stringY,
                    x: currentX,
                    duration: parseInt(duration),
                    grace,
                    lyric,
                    slurType,
                    index,
                    isBent,
                    bendFromString,
                    bendRatio
                });

                if (!grace) currentX += parseInt(duration) * 60;
            }
        });

        partData.push({
            partIndex,
            partNumber: partIndex + 1,
            notes,
            tuning: songTuning,
            stringConfig: SONG_SPECIFIC_STRINGS
        });
    });

    return {
        isMultiPart: true,
        parts: partData,
        title: path.basename(xmlPath, '.musicxml.xml'),
        // For metadata, use combined notes from all parts
        notes: partData.flatMap(p => p.notes),
        tuning: partData[0].tuning, // Use first part's tuning for overall metadata
        stringConfig: partData[0].stringConfig
    };
}

// Parse MusicXML and extract note data
async function parseMusicXML(xmlPath) {
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    const dom = new JSDOM(xmlContent, { contentType: 'text/xml' });
    const doc = dom.window.document;

    // Check if there are multiple parts (for ensemble pieces with 2+ đàn tranh)
    const parts = doc.querySelectorAll('part');
    const hasMultipleParts = parts.length > 1;

    if (hasMultipleParts) {
        // Parse each part separately
        return parseMultiPartScore(doc, xmlPath, parts);
    }

    // Single part - use original logic
    const notes = [];
    const lyrics = [];

    // Extract notes
    const noteElements = doc.querySelectorAll('note');

    // Calculate song-specific tuning for analysis
    const songTuning = calculateSongTuning(noteElements);
    // Generate 17-string configuration based on song's tuning
    const startNote = songTuning.includes('E') ? 'E3' :
                      songTuning.includes('D') ? 'D3' :
                      songTuning.includes('F') ? 'F3' : `${songTuning[0]}3`;
    const SONG_SPECIFIC_STRINGS = generateDanTranhStrings(songTuning, startNote, 17);

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

        // Calculate note name (keeping original notation)
        const noteName = step + (alter === '1' ? '#' : alter === '-1' ? 'b' : '') + octave;

        // Map note to song-specific pentatonic string system with bending support
        let stringNum = null;
        let stringY = null;
        let isBent = false;
        let bendFromString = null;
        let bendRatio = 0;

        // Extract pitch class from note name
        const pitchClass = noteName.match(/^([A-G][#b]?)/)?.[1];

        // Check if note is on an open string (song-specific)
        const openStringMatch = Object.entries(SONG_SPECIFIC_STRINGS).find(
            ([_, config]) => config.note === noteName
        );

        if (openStringMatch) {
            // Note is on an open string - no bending needed
            stringNum = parseInt(openStringMatch[0]);
            stringY = openStringMatch[1].y;
            isBent = false;
        } else {
            // Note requires bending - find closest open string below
            const closestString = findClosestOpenString(noteName, SONG_SPECIFIC_STRINGS, songTuning);

            if (closestString && closestString.semitoneDistance > 0) {
                // This note should be bent from the closest open string
                stringNum = closestString.stringNum;
                bendFromString = closestString.stringNum;  // Should be the string number, not the note name
                isBent = true;

                // Calculate proportional Y position based on semitone distance
                // Find the next open string above for reference
                const nextOpenString = Object.entries(SONG_SPECIFIC_STRINGS).find(([_, config]) => {
                    const dist = getSemitoneDistance(closestString.config.note, config.note);
                    return dist > 0 && songTuning.includes(config.pitchClass);
                });

                if (nextOpenString) {
                    const lowerY = closestString.config.y;
                    const upperY = nextOpenString[1].y;
                    const totalSemitones = getSemitoneDistance(closestString.config.note, nextOpenString[1].note);
                    bendRatio = closestString.semitoneDistance / totalSemitones;
                    stringY = lowerY + (upperY - lowerY) * bendRatio;
                } else {
                    // No string above, just offset proportionally
                    stringY = closestString.config.y + (closestString.semitoneDistance * 100 * pixelsPerCent);
                }
            } else {
                // Fallback to first string if no match found
                const firstString = Object.entries(SONG_SPECIFIC_STRINGS)[0];
                stringNum = parseInt(firstString[0]);
                stringY = firstString[1].y;
                console.warn(`Could not map note ${noteName}, using first string`);
            }
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
            slur: slurType,
            isBent,
            bendFromString,
            bendRatio
        });

        // Advance X position based on duration
        currentX += grace ? 25 : parseInt(duration) * 85;
    });

    return {
        notes,
        title: path.basename(xmlPath, '.musicxml.xml'),
        tuning: songTuning,
        stringConfig: SONG_SPECIFIC_STRINGS
    };
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

// Generate multi-part SVG tablature (stacked parallel tablatures)
function generateMultiPartTablatureSVG(songData) {
    const { parts } = songData;
    const partSVGs = [];
    let currentYOffset = 0;
    const partSpacing = 150; // Space between parts

    parts.forEach((partData, index) => {
        const partSVG = generateSinglePartSVG(partData, currentYOffset, index + 1);
        partSVGs.push(partSVG);
        currentYOffset += partSVG.height + partSpacing;
    });

    const maxX = Math.max(...partSVGs.map(p => p.width));
    const totalHeight = currentYOffset - partSpacing; // Remove last spacing

    let svg = `
<svg id="tablatureSvg" xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${totalHeight}">
    <defs>
        <linearGradient id="resonanceBand" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#666666;stop-opacity:0.2" />
            <stop offset="50%" style="stop-color:#666666;stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:#666666;stop-opacity:0.2" />
        </linearGradient>
    </defs>
    <rect x="0" y="0" width="${maxX}" height="${totalHeight}" fill="transparent"/>

    ${partSVGs.map(p => p.svg).join('\n')}
</svg>`;

    return svg;
}

// Generate SVG for a single part (used by both single and multi-part scores)
function generateSinglePartSVG(partData, yOffset = 0, partNumber = null) {
    const { notes, stringConfig, tuning } = partData;
    const lastNoteX = Math.max(...notes.map(n => n.x));
    const maxX = lastNoteX + 320 + 100;

    // Always show all 17 strings consistently
    // Color: grey for non-played, black for played
    const playedStringNums = new Set(notes.map(n => n.string));

    // Determine the starting note based on the song's tuning
    let startNote = 'E3';  // Default starting note
    let startPitch = 'E';
    let startOctave = 3;

    // Check if E is in the tuning
    if (!tuning.includes('E')) {
        // If no E, check for D or F
        if (tuning.includes('D')) {
            startPitch = 'D';
            startNote = 'D3';
        } else if (tuning.includes('F')) {
            startPitch = 'F';
            startNote = 'F3';
        } else {
            // Use first note in tuning
            startPitch = tuning[0];
            startNote = `${tuning[0]}3`;
        }
    }

    // Generate 17-string configuration based on song's tuning
    const standardStringConfig = generateDanTranhStrings(tuning, startNote, 17);

    // Always show all 17 strings
    let stringsToShow = [];
    for (let i = 1; i <= 17; i++) {
        if (standardStringConfig[i]) {
            stringsToShow.push([String(i), standardStringConfig[i]]);
        }
    }

    const allStringConfigs = stringsToShow;

    const stringYPositions = allStringConfigs.map(([num, config]) => config.y);
    const minStringY = Math.min(...stringYPositions);
    const maxStringY = Math.max(...stringYPositions);

    const topPadding = 80;
    const bottomPadding = 100;  // Extra padding to ensure all strings visible
    const minY = minStringY - topPadding;
    const maxY = maxStringY + bottomPadding;
    const svgHeight = maxY - minY;

    let svg = '';

    // Part label if this is a multi-part score
    if (partNumber !== null) {
        svg += `
    <text x="20" y="${yOffset + 20}" font-size="16" font-weight="bold" fill="#2C3E50">
        Đàn Tranh ${partNumber}
    </text>
    <text x="20" y="${yOffset + 38}" font-size="12" fill="#7f8c8d" font-family="monospace">
        Tuning: ${tuning.join('-')}
    </text>`;
    }

    // String lines (all strings: grey for non-played, theme-adaptive for played)
    allStringConfigs.forEach(([stringNum, config]) => {
        const adjustedY = config.y - minY + 50 + yOffset;
        const isPlayed = playedStringNums.has(parseInt(stringNum));
        const lineClass = isPlayed ? "string-line-played" : "string-line-unplayed";
        const labelClass = isPlayed ? "string-label-played" : "string-label-unplayed";
        svg += `
    <line x1="120" y1="${adjustedY}" x2="${maxX}" y2="${adjustedY}"
          stroke-width="3" class="string-line ${lineClass}"/>
    <text x="20" y="${adjustedY + 5}" font-size="12" font-weight="bold" class="string-label ${labelClass}">
        String ${stringNum}: ${config.note}
    </text>`;
    });

    // Bent indicators now handled inline with text characters

    // Debug: Log note processing start
    console.log(`Processing ${notes.length} notes for SVG generation`);

    // Notes and resonance bands
    notes.forEach((note, index) => {
        const stringConfig = allStringConfigs.find(([num, _]) => parseInt(num) === note.string);
        if (!stringConfig) return;

        // For bent notes, use the calculated proportional Y position
        // For open notes, use the string's Y position
        const noteY = note.isBent && note.y ? note.y : stringConfig[1].y;
        const adjustedY = noteY - minY + 50 + yOffset;
        const bandHeight = 30;
        const circleRadius = 12;

        // Resonance band (V1 style: 320px wide, 10px height)
        const resonanceWidth = 320;

        // Use normal grey resonance bands
        const fillGradient = "url(#resonanceBand)";

        svg += `
    <rect x="${note.x}" y="${adjustedY - 5}"
          width="${resonanceWidth}" height="10"
          fill="${fillGradient}" stroke="none" rx="2" opacity="0.9"
          data-note-index="${index}" class="resonance-band"/>`;


        // Determine if this is a grace note for sizing
        const isGrace = note.grace || note.isGrace || false;
        const noteRadius = isGrace ? 6 : circleRadius;

        // Store bent note indicator to draw later (on top of everything)
        if (note.isBent) {
            // Find the closest lower pitch string (which appears HIGHER on screen - smaller Y value)
            const currentStringY = adjustedY;
            let lowerStringY = currentStringY;

            // Find the previous string (lower pitch, smaller Y value since Y increases downward)
            for (const [num, config] of allStringConfigs.reverse()) {
                const stringY = config.y - minY + 50 + yOffset;
                if (stringY < currentStringY && (lowerStringY === currentStringY || stringY > lowerStringY)) {
                    lowerStringY = stringY;
                    break;
                }
            }
            allStringConfigs.reverse(); // Restore original order

            // Calculate eighth note distance (assuming standard spacing)
            const eighthNoteDistance = 50; // Adjust based on your note spacing
            const arrowStartX = note.x - eighthNoteDistance;
            const arrowStartY = lowerStringY;  // This is the string being bent (higher on screen)
            const arrowEndX = note.x - noteRadius;  // Offset to left edge of note circle (radius depends on note type)
            const arrowEndY = adjustedY;  // Target note position


            // ADD RED DOT at the start position
            svg += `
    <text x="${arrowStartX}" y="${lowerStringY}" text-anchor="middle"
          dominant-baseline="middle" class="bent-arrow-tail"
          data-base-x="${arrowStartX}" data-base-y="${lowerStringY}"
          style="font-size: 16px; fill: #FF0000; font-weight: bold;">●</text>`;

            // CREATE RED LINE connecting dot to bent note center
            const lineChar = '▬';
            const lineStartX = arrowStartX;
            const lineStartY = lowerStringY;
            const lineEndX = note.x; // Center of bent note
            const lineEndY = adjustedY; // Center of bent note

            // Calculate line parameters
            const lineDx = lineEndX - lineStartX;
            const lineDy = lineEndY - lineStartY;
            const connectionLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
            const lineAngle = Math.atan2(lineDy, lineDx) * 180 / Math.PI;

            // Create line using multiple rotated characters
            const charSpacing = 8;
            const charCount = Math.floor(connectionLength / charSpacing);

            for (let i = 1; i < charCount; i++) {
                const ratio = i / charCount;
                const charX = lineStartX + lineDx * ratio;
                const charY = lineStartY + lineDy * ratio;

                svg += `
    <text x="${charX}" y="${charY}" text-anchor="middle"
          dominant-baseline="middle" class="bent-line-char"
          data-base-x="${charX}" data-base-y="${charY}"
          data-ratio="${ratio}" data-start-x="${lineStartX}" data-start-y="${lineStartY}"
          data-end-x="${lineEndX}" data-end-y="${lineEndY}"
          transform="rotate(${lineAngle} ${charX} ${charY})"
          style="font-size: 16px; fill: #FF0000; font-weight: bold; opacity: 0.8; stroke: #FF0000; stroke-width: 3px;">━</text>`;
            }

            // Calculate initial angle and dimensions for bent band
            const dx = arrowEndX - arrowStartX;
            const dy = arrowEndY - arrowStartY;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const lineLength = Math.sqrt(dx * dx + dy * dy);

            // Bent band similar to resonance band
            const bentBandWidth = lineLength + 10; // Length of the connection
            const bentBandHeight = 6; // Thin band similar to resonance band

            // Position the band to connect from dot to note
            const bentBandX = arrowStartX - 5; // Start slightly before the dot
            const bentBandY = arrowStartY - bentBandHeight/2; // Center vertically on the line

            // Text-based bent bands are created inline above
        }
        const noteFontSize = isGrace ? 10 : 16;

        // Note circle (red for bent notes for debugging, grey for normal)
        const noteColor = '#666666'; // All notes grey by default (bent notes controlled by toggle)
        svg += `
    <circle cx="${note.x}" cy="${adjustedY}" r="${noteRadius}"
            fill="${noteColor}" stroke="#2C3E50" stroke-width="2"
            data-note-index="${index}" class="note-circle"/>
    <text x="${note.x}" y="${adjustedY}"
          text-anchor="middle" font-size="${noteFontSize}" fill="white" font-weight="bold"
          dominant-baseline="middle"
          class="note-name" data-note-index="${index}" pointer-events="none">
        ${note.noteName || note.pitch || ''}
    </text>`;

        // Note index (V1 style: #1, #2, #3...)
        svg += `
    <text x="${note.x}" y="${adjustedY - 35}"
          text-anchor="middle" font-size="9px" fill="#666" font-weight="bold" opacity="0.3">
        #${index + 1}
    </text>`;

        // Lyric (V1 style: rotated -90°, fixed distance from note)
        if (note.lyric) {
            const lyricX = note.x + 15;  // Offset 15px to the right of note
            const lyricY = adjustedY + 40;  // Fixed 40px below note center
            svg += `
    <text x="${lyricX}" y="${lyricY}" text-anchor="start"
          style="font-family: Arial; font-size: 14px; fill: #2C3E50; font-weight: bold;"
          transform="rotate(-90, ${lyricX}, ${lyricY})" class="lyric-text"
          data-note-index="${index}">
        ${note.lyric}
    </text>`;
        }
    });

    // Bent indicators are now inline with notes as text characters

    return {
        svg,
        width: maxX,
        height: svgHeight + (partNumber !== null ? 60 : 0) // Extra height for label
    };
}

// Generate V1-style SVG tablature
function generateTablatureSVG(songData) {
    // Check if this is a multi-part score
    if (songData.isMultiPart) {
        return generateMultiPartTablatureSVG(songData);
    }

    // Single part - use the single part generator
    const singlePartData = {
        notes: songData.notes,
        stringConfig: songData.stringConfig,
        tuning: songData.tuning
    };

    const partSVG = generateSinglePartSVG(singlePartData, 0, null);

    return `
<svg id="tablatureSvg" xmlns="http://www.w3.org/2000/svg" width="${partSVG.width}" height="${partSVG.height}">
    <defs>
        <linearGradient id="resonanceBand" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#666666;stop-opacity:0.2" />
            <stop offset="50%" style="stop-color:#666666;stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:#666666;stop-opacity:0.2" />
        </linearGradient>
        <linearGradient id="bentBand" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#FF0000;stop-opacity:0.3" />
            <stop offset="50%" style="stop-color:#FF0000;stop-opacity:0.7" />
            <stop offset="100%" style="stop-color:#FF0000;stop-opacity:0.3" />
        </linearGradient>
    </defs>
    <rect x="0" y="0" width="${partSVG.width}" height="${partSVG.height}" fill="transparent"/>
    ${partSVG.svg}
</svg>`;
}

// Original single-part SVG generation (kept for reference, now using generateSinglePartSVG)
function generateTablatureSVG_ORIGINAL(songData) {
    const { notes, title, stringConfig } = songData;
    // Calculate maxX to include:
    // - Last note position
    // - Resonance band width (320px extends to the right)
    // - Extra padding for safety (100px)
    const lastNoteX = Math.max(...notes.map(n => n.x));
    const maxX = lastNoteX + 320 + 100; // Include full resonance band + padding

    // Use only song-specific pentatonic strings that are actually played
    const playedStringNums = new Set(notes.map(n => n.string));
    const usedStringConfigs = Object.entries(stringConfig)
        .filter(([stringNum, _]) => playedStringNums.has(parseInt(stringNum)))
        .sort((a, b) => a[1].y - b[1].y); // Sort by Y position (top to bottom)

    // Store for metadata display - count of unique open strings
    songData.usedStrings = playedStringNums;

    // Calculate adaptive height based on used strings with proper padding
    const stringYPositions = usedStringConfigs.map(([num, config]) => config.y);
    const minStringY = Math.min(...stringYPositions);
    const maxStringY = Math.max(...stringYPositions);

    // Ensure minimum padding above and below strings (extra padding for lyrics)
    const topPadding = 120; // Extra padding for lyrics above top string
    const bottomPadding = 100; // Extra padding for lyrics below bottom string
    const minY = minStringY - topPadding;
    const maxY = maxStringY + bottomPadding;
    const svgHeight = maxY - minY;

    let svg = `
<svg id="tablatureSvg" xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${svgHeight}">
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

    // Collect bent indicators to draw them last
    const bentIndicators = [];

    // Draw notes
    notes.forEach(note => {
        const adjustedY = note.y - minY + 50; // Adjust for removed viewBox
        const isGrace = note.grace;
        const radius = isGrace ? 6 : 12;

        // Use grey for all notes by default (bent notes will be toggled red via button)
        const noteColor = isGrace ?
            { fill: '#808080', stroke: '#666666' } :  // Light grey for grace notes
            { fill: '#666666', stroke: '#444444' };   // Dark grey for main notes (including bent)

        // Enhanced resonance band with gradient
        const bandWidth = isGrace ? 80 : 320;
        const bandHeight = isGrace ? 8 : 12;
        const gradientId = `grad-${note.index}`;

        // Find the corresponding string line Y position for this note
        const stringConfig = usedStringConfigs.find(([num, config]) =>
            Math.abs(config.y - note.y) < 1); // Find string with matching Y position

        let stringLineY = adjustedY; // Default fallback
        if (stringConfig) {
            // Use the exact string line Y position
            stringLineY = stringConfig[1].y - minY + 50;
        }

        // Add gradient definition for this note
        svg += `
    <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${isGrace ? '#808080' : '#666666'};stop-opacity:0.1" />
            <stop offset="50%" style="stop-color:${isGrace ? '#808080' : '#666666'};stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:${isGrace ? '#808080' : '#666666'};stop-opacity:0.05" />
        </linearGradient>
    </defs>`;

        // Position band exactly centered on the note (which is on the string line)
        svg += `
    <rect x="${note.x - 10}" y="${adjustedY - bandHeight/2}"
          width="${bandWidth}" height="${bandHeight}"
          fill="url(#${gradientId})"
          rx="4" class="resonance-band"
          data-note-index="${note.index}"
          data-string-y="${adjustedY}"/>`;

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

        // Store bent indicator to draw later on top
        if (note.isBent) {
            // Find the closest lower pitch string (which appears HIGHER on screen - smaller Y value)
            const currentStringY = adjustedY;
            let lowerStringY = currentStringY;

            // Find the previous string (lower pitch, smaller Y value since Y increases downward)
            const stringConfigs = Array.from(usedStringConfigs);
            for (let i = stringConfigs.length - 1; i >= 0; i--) {
                const [num, config] = stringConfigs[i];
                const stringY = config.y - minY + 50;
                if (stringY < currentStringY) {
                    lowerStringY = stringY;
                    break;
                }
            }

            // Calculate eighth note distance
            const eighthNoteDistance = 50;
            const arrowStartX = note.x - eighthNoteDistance;
            const arrowStartY = lowerStringY;  // This is the string being bent (higher on screen)
            const arrowEndX = note.x;
            const arrowEndY = adjustedY;  // Target note position

            bentIndicators.push(`
    <g class="bent-note-group" data-note-index="${note.index}">
        <!-- Arrow head at bent note position -->
        <text x="${arrowEndX}" y="${arrowEndY - 5}" text-anchor="middle"
              style="font-size: 35px; fill: #FF0000; font-weight: bold; stroke: #FF0000; stroke-width: 1px;">↘</text>
        <!-- BEND text at starting position -->
        <text x="${arrowStartX}" y="${arrowStartY + 5}" text-anchor="middle"
              style="font-size: 16px; fill: #FF0000; font-weight: bold; stroke: #FF0000; stroke-width: 0.5px;">BEND</text>
    </g>`);
        }
    });

    // Draw all bent indicators on top of everything else
    svg += bentIndicators.join('');

    svg += `
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

// Pattern Analysis System - KPIC (Kinetic Pitch Contour)
function analyzeKPIC(notes, windowSize = 2) {
    const patterns = new Map();

    for (let i = 0; i <= notes.length - windowSize; i++) {
        const pattern = notes.slice(i, i + windowSize)
            .map(note => note.noteName)
            .join('→');

        if (!patterns.has(pattern)) {
            patterns.set(pattern, []);
        }
        patterns.get(pattern).push(i);
    }

    return patterns;
}

// Pattern Analysis System - KRIC (Kinetic Rhythm Contour)
function analyzeKRIC(notes, windowSize = 2) {
    const patterns = new Map();

    for (let i = 0; i <= notes.length - windowSize; i++) {
        const pattern = notes.slice(i, i + windowSize)
            .map(note => note.duration)
            .join('→');

        if (!patterns.has(pattern)) {
            patterns.set(pattern, []);
        }
        patterns.get(pattern).push(i);
    }

    return patterns;
}

// Calculate pattern efficiency (Learn Only calculation)
function calculatePatternEfficiency(notes) {
    // Analyze different pattern sizes
    const kpic2 = analyzeKPIC(notes, 2);
    const kpic3 = analyzeKPIC(notes, 3);
    const kric2 = analyzeKRIC(notes, 2);
    const kric3 = analyzeKRIC(notes, 3);

    // Find the most efficient pattern size (highest repetition savings)
    let maxSavings = 0;
    let bestPatternType = 'none';
    let learnOnly = notes.length; // Default: learn all notes

    // Test KPIC-2 patterns
    let kpic2Savings = 0;
    kpic2.forEach((occurrences, pattern) => {
        if (occurrences.length > 1) {
            kpic2Savings += (occurrences.length - 1); // Save 1 note per repeat
        }
    });

    if (kpic2Savings > maxSavings) {
        maxSavings = kpic2Savings;
        bestPatternType = 'KPIC-2';
        learnOnly = notes.length - kpic2Savings;
    }

    // Test KPIC-3 patterns
    let kpic3Savings = 0;
    kpic3.forEach((occurrences, pattern) => {
        if (occurrences.length > 1) {
            kpic3Savings += (occurrences.length - 1) * 2; // Save 2 notes per repeat
        }
    });

    if (kpic3Savings > maxSavings) {
        maxSavings = kpic3Savings;
        bestPatternType = 'KPIC-3';
        learnOnly = notes.length - kpic3Savings;
    }

    // Test KRIC patterns (similar logic)
    let kric2Savings = 0;
    kric2.forEach((occurrences, pattern) => {
        if (occurrences.length > 1) {
            kric2Savings += (occurrences.length - 1);
        }
    });

    if (kric2Savings > maxSavings) {
        maxSavings = kric2Savings;
        bestPatternType = 'KRIC-2';
        learnOnly = notes.length - kric2Savings;
    }

    const efficiency = maxSavings > 0 ? Math.round((maxSavings / notes.length) * 100) : 0;

    return {
        learnOnly: Math.max(1, learnOnly), // At least 1 note to learn
        totalNotes: notes.length,
        savings: maxSavings,
        efficiency: efficiency,
        bestPattern: bestPatternType,
        patterns: {
            kpic2: kpic2.size,
            kpic3: kpic3.size,
            kric2: kric2.size,
            kric3: kric3.size
        }
    };
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

    // Sort pitches musically using the same order as the tablature generation (highest to lowest)
    pitchList.sort((a, b) => {
        const orderA = pitchOrder[a] || 999;
        const orderB = pitchOrder[b] || 999;

        // Sort highest to lowest (same as tablature)
        return orderB - orderA;
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

        /* Theme-adaptive string colors */
        .string-line-played {
            stroke: #2C3E50;
            opacity: 0.6;
        }
        .string-line-unplayed {
            stroke: #999999;
            opacity: 0.4;
        }
        .string-label-played {
            fill: #2C3E50;
        }
        .string-label-unplayed {
            fill: #AAAAAA;
        }

        /* Dark themes: white for played strings */
        body.theme-dark-grey .string-line-played,
        body.theme-black .string-line-played {
            stroke: #ECF0F1;
            opacity: 0.8;
        }
        body.theme-dark-grey .string-label-played,
        body.theme-black .string-label-played {
            fill: #ECF0F1;
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
        <header style="padding-bottom: 15px;">
            <h1 style="margin-bottom: 10px;">${toTitleCase(songData.title)}</h1>

            <!-- Compact Metrics Row -->
            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap; margin-bottom: 8px;">
                <!-- Tuning -->
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 14px; color: #95a5a6;">Tuning:</span>
                    <span style="font-size: 16px; font-family: monospace; color: #27ae60; font-weight: 600;">${songData.tuning ? songData.tuning.join('-') : 'C-D-E-G-A'}</span>
                </div>

                <!-- Total Notes -->
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-size: 16px; color: #e74c3c; font-weight: 600;">${songData.notes.length}</span>
                    <span style="font-size: 14px; color: #95a5a6;">Total Notes</span>
                </div>

                <!-- Open-String Notes -->
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-size: 16px; color: #3498db; font-weight: 600;">${metadata?.bendingMetrics?.openStringNotes || 0}</span>
                    <span style="font-size: 14px; color: #95a5a6;">Open-String Notes</span>
                </div>

                <!-- Bent Notes (clickable button) -->
                <button id="bentStringsMetric" onclick="toggleBentNotesHighlight(); return false;" type="button"
                     style="display: flex; align-items: center; gap: 5px; cursor: pointer; padding: 6px 12px; border-radius: 5px; border: 2px solid #27ae60; background: white; transition: all 0.2s; font-family: inherit;"
                     title="Click to highlight bent notes in red">
                    <span style="font-size: 16px; color: #27ae60; font-weight: 600;">
                        <span id="bentStringsCount">${metadata?.bendingMetrics?.uniqueBentStrings || 0}</span> Bent Strings / <span id="bentNotesCount">${metadata?.bendingMetrics?.bentNotes || 0}</span> Bent Notes
                    </span>
                </button>

                <!-- Learn Only -->
                ${metadata?.patternEfficiency ? `
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-size: 16px; color: #9b59b6; font-weight: 600;">${metadata.patternEfficiency.learnOnly}</span>
                    <span style="font-size: 14px; color: #95a5a6;">Patterns</span>
                </div>
                ` : ''}
            </div>
        </header>

        <!-- Theme selector and Back button - top right corner -->
        <div style="position: fixed; right: 20px; top: 20px; display: flex; gap: 15px; align-items: center; z-index: 1001;">
            <a href="/" class="back-link" style="position: static; margin: 0; padding: 8px 16px; font-size: 14px;">← Back to Library</a>
            <div class="theme-selector" style="display: flex; gap: 10px;">
                <button class="theme-btn" onclick="setTheme('white')" style="background: white; border: 2px solid #ccc; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;" title="White"></button>
                <button class="theme-btn" onclick="setTheme('light-grey')" style="background: #D0D0D0; border: 2px solid #ccc; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;" title="Light Grey"></button>
                <button class="theme-btn" onclick="setTheme('dark-grey')" style="background: #2C3E50; border: 2px solid #34495E; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;" title="Dark Grey"></button>
                <button class="theme-btn" onclick="setTheme('black')" style="background: black; border: 2px solid #333; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;" title="Black"></button>
            </div>
        </div>

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

            const svg = document.getElementById('tablatureSvg');

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
            const svg = document.getElementById('tablatureSvg');

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

            // Update resonance bands - center them based on their associated note
            const bands = svg.querySelectorAll('.resonance-band');
            bands.forEach(band => {
                const baseX = parseFloat(band.getAttribute('data-base-x'));
                const baseWidth = parseFloat(band.getAttribute('data-base-width'));
                const bandHeight = parseFloat(band.getAttribute('height'));

                // Get the associated note to find its current Y position
                const noteIndex = band.getAttribute('data-note-index');
                const associatedNote = svg.querySelector(\`.note-circle[data-note-index="\${noteIndex}"]\`);

                if (associatedNote) {
                    const noteY = parseFloat(associatedNote.getAttribute('cy'));

                    // Center the band on the note's Y position
                    const scaledX = 120 + (baseX - 120) * currentZoomX;
                    const scaledY = noteY - bandHeight / 2; // Center band on note
                    const scaledWidth = baseWidth * currentZoomX;

                    band.setAttribute('x', scaledX - 10);
                    band.setAttribute('y', scaledY);
                    band.setAttribute('width', scaledWidth);
                }
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
                } else if (text.classList.contains('note-name')) {
                    // Note names (labels inside note heads) - position relative to their note
                    const noteIndex = text.getAttribute('data-note-index');
                    const associatedNote = svg.querySelector(\`.note-circle[data-note-index="\${noteIndex}"]\`);

                    if (associatedNote) {
                        const noteX = parseFloat(associatedNote.getAttribute('cx'));
                        const noteY = parseFloat(associatedNote.getAttribute('cy'));

                        // Keep note name perfectly centered in note
                        text.setAttribute('x', noteX);
                        text.setAttribute('y', noteY);
                    }
                } else {
                    // Other text - scale with tablature
                    const scaledX = 120 + (baseX - 120) * currentZoomX;
                    const scaledY = baseY * currentZoomY;

                    text.setAttribute('x', scaledX);
                    text.setAttribute('y', scaledY);
                }
            });

            // Update bent note elements (dots and line characters)
            const bentTails = svg.querySelectorAll('.bent-arrow-tail');
            bentTails.forEach(tail => {
                const baseX = parseFloat(tail.getAttribute('data-base-x'));
                const baseY = parseFloat(tail.getAttribute('data-base-y'));

                // Scale the tail position (red dot)
                const scaledX = 120 + (baseX - 120) * currentZoomX;
                const scaledY = baseY * currentZoomY;

                tail.setAttribute('x', scaledX);
                tail.setAttribute('y', scaledY);
            });

            // Update bent line characters
            const bentLineChars = svg.querySelectorAll('.bent-line-char');
            bentLineChars.forEach(char => {
                const ratio = parseFloat(char.getAttribute('data-ratio'));
                const startX = parseFloat(char.getAttribute('data-start-x'));
                const startY = parseFloat(char.getAttribute('data-start-y'));
                const endX = parseFloat(char.getAttribute('data-end-x'));
                const endY = parseFloat(char.getAttribute('data-end-y'));

                // Scale start and end positions
                const scaledStartX = 120 + (startX - 120) * currentZoomX;
                const scaledStartY = startY * currentZoomY;
                const scaledEndX = 120 + (endX - 120) * currentZoomX;
                const scaledEndY = endY * currentZoomY;

                // Calculate new position based on ratio
                const newDx = scaledEndX - scaledStartX;
                const newDy = scaledEndY - scaledStartY;
                const newCharX = scaledStartX + newDx * ratio;
                const newCharY = scaledStartY + newDy * ratio;

                // Calculate new angle
                const newAngle = Math.atan2(newDy, newDx) * 180 / Math.PI;

                char.setAttribute('x', newCharX);
                char.setAttribute('y', newCharY);
                char.setAttribute('transform', \`rotate(\${newAngle} \${newCharX} \${newCharY})\`);
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
            const svg = document.getElementById('tablatureSvg');
            const baseWidth = parseFloat(svg.getAttribute('data-base-width'));

            // Account for resonance band extension (340px) to show complete tablature
            const fullTablatureWidth = baseWidth + 340;

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
            const svg = document.getElementById('tablatureSvg');
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

        // Bent notes highlight toggle
        let bentNotesHighlighted = false;

        function toggleBentNotesHighlight() {
            const svg = document.getElementById('tablatureSvg');
            const metric = document.getElementById('bentStringsMetric');
            if (!svg || !metric) return;

            const bentNoteCircles = [];
            const allNotes = svg.querySelectorAll('.note-circle');

            // First, collect all bent arrow tail positions
            const bentTailPositions = [];
            const bentTails = svg.querySelectorAll('.bent-arrow-tail');

            console.log('Found bent tails:', bentTails.length);

            bentTails.forEach(tail => {
                const x = parseFloat(tail.getAttribute('data-base-x') || tail.getAttribute('x'));
                const y = parseFloat(tail.getAttribute('data-base-y') || tail.getAttribute('y'));
                if (!isNaN(x) && !isNaN(y)) {
                    bentTailPositions.push({ x, y });
                }
            });

            console.log('Bent tail positions:', bentTailPositions);

            // Now check each note to see if it has a bent indicator near it
            allNotes.forEach(noteCircle => {
                const noteX = parseFloat(noteCircle.getAttribute('cx'));
                const noteY = parseFloat(noteCircle.getAttribute('cy'));

                // Check if any bent tail is positioned to the left of this note (bent indicator)
                for (let pos of bentTailPositions) {
                    // Bent tails are typically 50px to the left and at similar Y position
                    if (pos.x < noteX && pos.x > (noteX - 100) && Math.abs(pos.y - noteY) < 80) {
                        console.log(\`Found bent note at x=\${noteX}, y=\${noteY} with tail at x=\${pos.x}, y=\${pos.y}\`);
                        bentNoteCircles.push(noteCircle);
                        break;
                    }
                }
            });

            console.log('Total bent notes found:', bentNoteCircles.length);

            if (!bentNotesHighlighted) {
                // Highlight ON
                bentNoteCircles.forEach(circle => {
                    circle.setAttribute('data-original-fill', circle.getAttribute('fill'));
                    circle.setAttribute('fill', '#E74C3C');
                });
                bentNotesHighlighted = true;
                metric.style.background = '#E74C3C';
                metric.style.borderColor = '#E74C3C';
                metric.querySelector('span').style.color = 'white';
            } else {
                // Highlight OFF
                bentNoteCircles.forEach(circle => {
                    const originalFill = circle.getAttribute('data-original-fill') || '#666666';
                    circle.setAttribute('fill', originalFill);
                });
                bentNotesHighlighted = false;
                metric.style.background = 'white';
                metric.style.borderColor = '#27ae60';
                metric.querySelector('span').style.color = '#27ae60';
            }
        }

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

            // Calculate pattern efficiency (KPIC/KRIC analysis)
            const patternEfficiency = calculatePatternEfficiency(songData.notes);
            console.log(`Pattern analysis: Learn ${patternEfficiency.learnOnly}/${patternEfficiency.totalNotes} (${patternEfficiency.efficiency}% efficiency, best: ${patternEfficiency.bestPattern})`);

            // Calculate used strings (before generating HTML)
            const usedStrings = new Set(songData.notes.map(n => n.string));
            songData.usedStrings = usedStrings;

            // Generate viewer HTML
            const viewerHTML = generateViewer(songData, metadata);

            // Update metadata with corrected data (post slur-to-tie conversion + pattern analysis)
            if (metadata) {
                metadata.noteCount = songData.notes.length;
                metadata.processedDate = new Date().toISOString();

                // Calculate bending metrics
                const bentNotes = songData.notes.filter(n => n.isBent);
                const bentStrings = new Set(bentNotes.map(n => n.string));
                const openNotes = songData.notes.filter(n => !n.isBent);

                metadata.bendingMetrics = {
                    totalNotes: songData.notes.length,
                    openStringNotes: openNotes.length,
                    bentNotes: bentNotes.length,
                    bentNotePercentage: ((bentNotes.length / songData.notes.length) * 100).toFixed(1),
                    uniqueBentStrings: bentStrings.size,
                    openStringsUsed: Array.from(usedStrings).sort((a, b) => a - b)
                };

                // Update string count based on open strings (pentatonic system)
                metadata.strings = usedStrings.size;

                // Add song-specific tuning
                metadata.tuning = songData.tuning;

                // Update with calculated pattern efficiency
                metadata.patternEfficiency = patternEfficiency;

                // Write updated metadata
                fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
                console.log(`Updated metadata: noteCount = ${metadata.noteCount}, strings = ${metadata.strings}, tuning = ${songData.tuning.join('-')}, bentNotes = ${bentNotes.length} (${metadata.bendingMetrics.bentNotePercentage}%)`);
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