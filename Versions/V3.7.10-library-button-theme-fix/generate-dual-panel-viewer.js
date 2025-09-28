/**
 * Generate Dual-Panel Collapsible Viewer
 * Uses parsed relationship data to create complete visualization
 * With optimal 0.125px/cent spacing (C1-B8 coverage)
 */

const fs = require('fs');
const path = require('path');

class DualPanelGenerator {
    constructor() {
        // Optimal spacing: 0.125px per cent
        this.PIXELS_PER_CENT = 0.125;
        this.BASE_Y = 100; // Base position for C3

        // Load tuning systems from database
        this.tuningSystems = this.loadTuningSystems();

        // Note to cents mapping (including double sharps/flats)
        this.noteToCents = {
            'C': 0, 'C#': 100, 'Db': 100, 'D': 200, 'D#': 300, 'Eb': 300,
            'E': 400, 'F': 500, 'F#': 600, 'Gb': 600, 'G': 700, 'G#': 800,
            'Ab': 800, 'A': 900, 'A#': 1000, 'Bb': 1000, 'B': 1100, 'Cb': 1100,
            // Double sharps (x or ##)
            'Cx': 200, 'C##': 200,  // = D
            'Dx': 400, 'D##': 400,  // = E
            'Ex': 600, 'E##': 600,  // = F#
            'Fx': 700, 'F##': 700,  // = G
            'Gx': 900, 'G##': 900,  // = A
            'Ax': 1100, 'A##': 1100, // = B
            'Bx': 100, 'B##': 100,   // = C# (next octave)
            // Double flats (bb)
            'Cbb': 1000, // = Bb (previous octave)
            'Dbb': 0,    // = C
            'Ebb': 200,  // = D
            'Fbb': 300,  // = Eb
            'Gbb': 500,  // = F
            'Abb': 600,  // = Gb
            'Bbb': 800   // = Ab
        };

        // Enharmonic equivalents mapping (including double sharps/flats)
        this.enharmonicEquivalents = {
            // Single sharp/flat equivalents
            'C#': 'Db', 'Db': 'C#',
            'D#': 'Eb', 'Eb': 'D#',
            'E': 'Fb', 'Fb': 'E',
            'E#': 'F', 'F': 'E#',
            'F#': 'Gb', 'Gb': 'F#',
            'G#': 'Ab', 'Ab': 'G#',
            'A#': 'Bb', 'Bb': 'A#',
            'B': 'Cb', 'Cb': 'B',
            'B#': 'C', 'C': 'B#',

            // Double sharps
            'Cx': 'D', 'C##': 'D',
            'Dx': 'E', 'D##': 'E',
            'Ex': 'F#', 'E##': 'F#',
            'Fx': 'G', 'F##': 'G',
            'Gx': 'A', 'G##': 'A',
            'Ax': 'B', 'A##': 'B',
            'Bx': 'C#', 'B##': 'C#',

            // Double flats
            'Cbb': 'Bb',
            'Dbb': 'C',
            'Ebb': 'D',
            'Fbb': 'Eb',
            'Gbb': 'F',
            'Abb': 'Gb',
            'Bbb': 'Ab',

            // Reverse mappings
            'D': 'Cx',
            'E': 'Dx',
            'G': 'Fx',
            'A': 'Gx',
            'B': 'Ax'
        };

        // Color scheme
        this.colors = {
            mainNote: '#000000',      // Full black for notes and triangles
            graceNote: '#FFD700',     // Gold for grace notes
            bentIndicator: '#FF0000', // Red for bent notes
            melisma: '#E74C3C',       // Red for melisma
            string: '#000000',        // Black for used strings
            unusedString: '#999999'   // Grey for unused strings
        };
    }

    /**
     * Load tuning systems from JSON database
     */
    loadTuningSystems() {
        try {
            const tuningPath = path.join(__dirname, 'data', 'tuning-systems.json');
            const tuningData = JSON.parse(fs.readFileSync(tuningPath, 'utf8'));

            // Create hierarchical structure with categories
            const tuningSystems = {};

            // Add each category of tunings
            Object.entries(tuningData.scales).forEach(([category, tunings]) => {
                tuningSystems[category] = [];
                Object.entries(tunings).forEach(([name, notes]) => {
                    const tuningString = notes.join('-');
                    tuningSystems[category].push({
                        value: tuningString,
                        label: name
                    });
                });
            });

            return tuningSystems;
        } catch (error) {
            console.error('Error loading tuning systems:', error);
            // Return default structure if file can't be loaded
            return {
                'Vietnamese': [
                    { value: 'C-D-E-G-A', label: 'Traditional' }
                ],
                'Japanese': [
                    { value: 'D-E-F#-A-B', label: 'Hirajoshi' }
                ],
                'Arabic': [
                    { value: 'C-D-Eb-F#-G', label: 'Maqam' }
                ]
            };
        }
    }

    /**
     * Calculate Y position based on note and octave
     */
    calculateYPosition(note, octave) {
        const pitchClass = note.replace(/[0-9]/g, '');
        const cents = this.noteToCents[pitchClass] || 0;
        const totalCents = (octave - 3) * 1200 + cents;
        return this.BASE_Y + (totalCents * this.PIXELS_PER_CENT);
    }

    /**
     * Generate 17-string pattern for a tuning
     */
    generate17StringPattern(tuningPattern) {
        const strings = [];
        let stringNum = 1;
        let octave = 3;
        let patternIndex = 0;

        while (stringNum <= 17) {
            const note = tuningPattern[patternIndex % tuningPattern.length];
            const yPos = this.calculateYPosition(note, octave);

            strings.push({
                number: stringNum,
                note: `${note}${octave}`,
                pitchClass: note,
                y: yPos,
                octave: octave
            });

            stringNum++;
            patternIndex++;
            if (patternIndex % tuningPattern.length === 0) octave++;
        }

        return strings;
    }

    /**
     * Determine which strings are used in the song
     */
    determineUsedStrings(notes, strings) {
        const usedStrings = new Set();

        notes.forEach(note => {
            if (!note.isGrace) {
                // Find matching or nearest string
                const notePitch = note.pitch.fullNote;
                strings.forEach(string => {
                    if (string.note === notePitch ||
                        string.pitchClass === note.pitch.pitchClass) {
                        usedStrings.add(string.number);
                    }
                });
            }
        });

        return usedStrings;
    }

    /**
     * Generate SVG for a tuning panel
     */
    generateTuningSVG(notes, tuningPattern, songName, panelType) {
        const strings = this.generate17StringPattern(tuningPattern);
        const usedStrings = this.determineUsedStrings(notes, strings);

        let svg = '';
        let svgDefs = ''; // Store gradient definitions
        const gradientIds = new Set(); // Track unique gradient IDs

        // Calculate width based on last note's timing plus duration plus one whole note
        const lastNote = notes[notes.length - 1];
        // Duration-based spacing in the dual-panel viewer (scaled down)
        // Note that timing is scaled by 0.5 for x positions in this viewer
        const lastNoteDurationValue = lastNote ?
            (lastNote.isGrace ? 0.5 : (lastNote.duration ? lastNote.duration.value : 4)) : 4;
        const scaledDurationWidth = lastNote ?
            (lastNote.isGrace ? 12.5 : lastNoteDurationValue * 42.5) : 0;
        // Calculate width based on all elements that will be created
        let maxRightEdge = 2400; // Minimum width

        // Pre-calculate all element positions to find the rightmost edge
        notes.forEach(note => {
            const x = 100 + note.timing * 0.5;

            // Note circle with radius
            maxRightEdge = Math.max(maxRightEdge, x + 15);

            // Resonance triangle (160px extension from note edge)
            if (!note.isGrace) {
                maxRightEdge = Math.max(maxRightEdge, x + 12 + 160);
            }

            // Bent note indicators (up to 10px right of note)
            if (note.isBent) {
                maxRightEdge = Math.max(maxRightEdge, x + 22);
            }

            // Lyrics positioning (could extend further right)
            if (note.lyric) {
                const lyricLength = note.lyric.length * 6; // Approximate 6px per character
                maxRightEdge = Math.max(maxRightEdge, x + lyricLength);
            }
        });

        const width = maxRightEdge + 200; // Add more generous padding to prevent cutoff
        const height = 600;

        // Draw string lines
        strings.forEach(string => {
            const isUsed = usedStrings.has(string.number);
            const color = isUsed ? this.colors.string : this.colors.unusedString;
            const opacity = isUsed ? '1' : '0.3';

            svg += `<line x1="50" y1="${string.y}" x2="${width}" y2="${string.y}"
                     stroke="${color}" stroke-width="2" opacity="${opacity}"/>`;
            svg += `<text x="20" y="${string.y + 4}" font-size="10" fill="#000000">${string.note}</text>\n`;
        });

        // Draw notes with relationships
        let bentNoteCount = 0;
        let graceNoteOffset = {}; // Track offset for grace notes at same timing

        // Special handling for after-grace notes (like C5 after "bao")
        // These have slur type="stop" and should appear after their main note
        // but before any grace notes of the next main note

        notes.forEach((note, index) => {
            if (note.isGrace) {
                // Draw grace notes smaller
                const baseX = 100 + note.timing * 0.5;

                // Check if this is an after-grace (orphaned grace note at measure boundary)
                // Note #2 (C5) is at index 2, has timing 680 but belongs after "bao" at timing 340
                const isAfterGrace = (index === 2 && note.pitch.fullNote === 'C5');

                if (isAfterGrace) {
                    // Position after-grace note just before the next main note's grace notes
                    // "giờ" is at 100 + 680*0.5 = 440
                    // Bb4 grace (before "giờ") will be at 440 - 12.5 = 427.5
                    // C5 (after "bao") should be at 427.5 - 12.5 = 415
                    const nextMainNoteX = 100 + 680 * 0.5; // Position of "giờ"
                    const graceSpacing = 12.5;
                    // Count how many before-grace notes the next main note has (just 1: Bb4)
                    const numBeforeGraces = 1;
                    const x = nextMainNoteX - graceSpacing * (numBeforeGraces + 1); // 440 - 25 = 415

                    // Draw the after-grace note
                    const y = this.calculateYPosition(note.pitch.pitchClass, note.pitch.octave);
                    svg += `<circle cx="${x}" cy="${y}" r="5" fill="${this.colors.graceNote}"
                            stroke="#CC9900" stroke-width="1"
                            data-lyrics="bao" class="lyrics-bao"/>`;
                    svg += `<text x="${x}" y="${y + 2}" text-anchor="middle" font-size="8"
                            fill="#4A3C00" font-weight="bold">${note.pitch.fullNote}</text>`;
                    svg += `<text x="${x}" y="${y - 10}" text-anchor="middle" font-size="6"
                            fill="#666">${index + 1}</text>\n`;

                    return; // Skip normal grace note processing
                }

                // Normal before-grace notes
                // Check how many grace notes share this timing before this one
                const timingKey = note.timing.toString();
                if (!graceNoteOffset[timingKey]) {
                    graceNoteOffset[timingKey] = 0;
                }

                // Position grace notes with proper spacing (25px scaled = 12.5px in dual-panel)
                // Grace notes should appear to the left of their main note
                const graceSpacing = 12.5; // Half of 25px due to 0.5x scaling
                const x = baseX - graceSpacing - (graceNoteOffset[timingKey] * graceSpacing);
                graceNoteOffset[timingKey]++;

                const y = this.calculateYPosition(note.pitch.pitchClass, note.pitch.octave);

                // Determine which lyrics this grace note belongs to
                // For before-grace notes, they belong to the next main note's lyrics
                // Find the next main note
                let associatedLyrics = '';
                for (let j = index + 1; j < notes.length; j++) {
                    if (!notes[j].isGrace && notes[j].lyrics && notes[j].lyrics.text) {
                        associatedLyrics = notes[j].lyrics.text;
                        break;
                    }
                }

                // Add triangle resonance for grace notes too
                const graceNoteLength = 160; // Same length as main notes
                const graceBandHeight = 12;
                const graceRadius = 6;
                const graceStartX = x + graceRadius;
                const graceTopY = y - graceBandHeight / 2;
                const graceBottomY = y + graceBandHeight / 2;
                const graceEndX = graceStartX + graceNoteLength;

                svg += `<polygon points="${graceStartX},${graceTopY} ${graceStartX},${graceBottomY} ${graceEndX},${y}"
                        fill="var(--triangle-fill)" opacity="0.35" class="resonance-triangle"
                        data-note-y="${y}" data-band-height="${graceBandHeight}" data-note-x="${x}"/>`;

                svg += `<circle cx="${x}" cy="${y}" r="6" fill="${this.colors.graceNote}"
                        stroke="#CC9900" stroke-width="2"
                        data-lyrics="${associatedLyrics}" class="lyrics-${associatedLyrics}"/>`;
                // Note name inside grace note
                svg += `<text x="${x}" y="${y + 2}" text-anchor="middle" font-size="8"
                        fill="#4A3C00" font-weight="bold">${note.pitch.fullNote}</text>`;
                // Add note number above grace note
                svg += `<text x="${x}" y="${y - 10}" text-anchor="middle" font-size="6"
                        fill="#666">${index + 1}</text>\n`;
            } else {
                // Main notes
                const x = 100 + note.timing * 0.5;
                const y = this.calculateYPosition(note.pitch.pitchClass, note.pitch.octave);

                // Check if note requires bending (not in tuning)
                // Also check enharmonic equivalent (e.g., D# = Eb)
                const pitchClass = note.pitch.pitchClass;
                const enharmonic = this.enharmonicEquivalents[pitchClass];
                const requiresBending = !tuningPattern.includes(pitchClass) &&
                                       (!enharmonic || !tuningPattern.includes(enharmonic));

                if (requiresBending) {
                    bentNoteCount++;
                    // Find nearest lower string
                    const lowerString = this.findNearestLowerString(note, strings, tuningPattern);
                    if (lowerString) {
                        // Draw bent indicator
                        svg += `<text x="${x - 15}" y="${lowerString.y + 4}"
                                font-size="10" fill="${this.colors.bentIndicator}">●</text>`;
                        svg += `<line x1="${x - 10}" y1="${lowerString.y}" x2="${x}" y2="${y}"
                                stroke="${this.colors.bentIndicator}" stroke-width="1.5"
                                stroke-dasharray="3,2" fill="none"/>`;
                    }
                }

                // Draw resonance triangle attached to note head - taper rightward
                const halfNoteLength = 160; // Fixed length for half note (320px full note / 2)
                const bandHeight = 12;

                // Triangle starts at note head edge and tapers right to a point
                const noteRadius = 12;
                const startX = x + noteRadius; // Start at right edge of note head
                const topY = y - bandHeight / 2;
                const bottomY = y + bandHeight / 2;
                const endX = startX + halfNoteLength;

                svg += `<polygon points="${startX},${topY} ${startX},${bottomY} ${endX},${y}"
                        fill="var(--triangle-fill)" opacity="0.35" class="resonance-triangle"
                        data-note-y="${y}" data-band-height="${bandHeight}" data-note-x="${x}"/>`;

                // Draw note with CSS variables
                svg += `<circle cx="${x}" cy="${y}" r="12" fill="var(--note-fill)"
                        stroke="var(--note-fill)" stroke-width="2" class="note-circle"/>`;

                // Note name inside the note head - zoom-aware centering
                svg += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="16"
                        fill="var(--note-text)" font-weight="bold" class="note-label"
                        data-note-x="${x}" data-note-y="${y}">${note.pitch.fullNote}</text>`;

                // Note number above
                svg += `<text x="${x}" y="${y - 12}" text-anchor="middle" font-size="8"
                        fill="#333">${index + 1}</text>`;

                // Lyrics
                if (note.lyrics.text) {
                    let lyricColor = '#333';

                    // Check for melisma
                    if (note.relationships?.melismaGroup) {
                        lyricColor = this.colors.melisma;
                    }

                    svg += `<text x="${x}" y="${y + 25}" text-anchor="middle" font-size="10"
                            fill="${lyricColor}" class="lyric-text"
                            data-base-x="${x}" data-base-y="${y}" data-lyric-offset="25">${note.lyrics.text}</text>`;

                    // Draw melisma line if extending
                    if (note.lyrics.extendType === 'start') {
                        svg += `<line x1="${x + 10}" y1="${y + 25}" x2="${x + 50}" y2="${y + 25}"
                                stroke="${this.colors.melisma}" stroke-width="1"
                                stroke-dasharray="2,2"/>`;
                    }
                }

                // Grace note relationship indicator
                if (note.relationships?.graceContext?.precedingGraceNotes) {
                    svg += `<text x="${x - 15}" y="${y}" text-anchor="middle" font-size="6"
                            fill="${this.colors.graceNote}">*</text>`;
                }
            }
        });

        // Wrap SVG with defs section for gradients - ensure proper formatting
        const completeSvg = svgDefs ? `<defs>${svgDefs}</defs>${svg}` : svg;

        return { svg: completeSvg, bentNoteCount, width, height };
    }

    /**
     * Find nearest lower string for bending
     */
    findNearestLowerString(note, strings, tuningPattern) {
        const noteY = this.calculateYPosition(note.pitch.pitchClass, note.pitch.octave);

        let nearestString = null;
        let minDistance = Infinity;

        strings.forEach(string => {
            if (tuningPattern.includes(string.pitchClass) && string.y <= noteY) {
                const distance = noteY - string.y;
                if (distance < minDistance && distance > 0) {
                    minDistance = distance;
                    nearestString = string;
                }
            }
        });

        return nearestString;
    }

    /**
     * Generate complete HTML with dual panels
     */
    generateDualPanelHTML(relationshipData) {
        const songName = relationshipData.metadata.songName;
        const notes = relationshipData.notes;

        // Get original tuning from metadata
        const originalTuning = relationshipData.metadata.tuning ?
            relationshipData.metadata.tuning.split('-') :
            ['C', 'D', 'E', 'G', 'A']; // Default pentatonic if not specified

        // Get all available tunings from loaded tuning systems
        const tuningSystems = this.tuningSystems;

        // Generate SVGs for both panels
        const optimalSVG = this.generateTuningSVG(notes, originalTuning, songName, 'optimal');

        // Generate all traditional tuning SVGs for the dropdown
        const traditionalSVGs = {};
        Object.entries(tuningSystems).forEach(([category, tunings]) => {
            tunings.forEach(tuningObj => {
                const tuningNotes = tuningObj.value.split('-');
                traditionalSVGs[tuningObj.value] = this.generateTuningSVG(notes, tuningNotes, songName, 'traditional');
            });
        });

        // Default to C-D-E-G-A for initial display
        const defaultTraditionalTuning = 'C-D-E-G-A';
        const traditionalSVG = traditionalSVGs[defaultTraditionalTuning] ||
                              traditionalSVGs[tuningSystems[Object.keys(tuningSystems)[0]][0].value];

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${songName} - Complete Dual Panel Visualization</title>
    <style>
        /* DanTranhTuningAnalyzer v3.5.8 with Optimal Spacing */

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }

        .container {
            max-width: 1800px;
            margin: 0 auto;
            position: relative;
        }

        header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
        }

        .library-button {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            text-decoration: none;
            color: white;
            background: #3498db;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s ease;
            display: inline-block;
        }

        .library-button:hover {
            background: #2980b9;
            color: white;
            text-decoration: none;
        }

        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 32px;
        }

        h2 {
            color: #7f8c8d;
            font-weight: normal;
            font-size: 18px;
        }

        /* 2-Theme System: White and Black */
        :root {
            --bg-color: #FFFFFF;
            --note-fill: #000000;
            --note-text: #FFFFFF;
            --triangle-fill: #000000;
            --string-color: #000000;
            --text-color: #000000;
            --panel-bg: #FFFFFF;
        }

        body.theme-black {
            --bg-color: #000000;
            --note-fill: #FFFFFF;
            --note-text: #000000;
            --triangle-fill: #FFFFFF;
            --string-color: #FFFFFF;
            --text-color: #FFFFFF;
            --panel-bg: #000000;
        }

        body {
            background: var(--bg-color);
            color: var(--text-color);
        }

        .tablature-container {
            background: var(--bg-color);
        }

        .tuning-panel {
            background: var(--bg-color);
        }

        .panel-content {
            background: var(--bg-color);
        }

        svg {
            background: var(--bg-color);
        }

        /* Theme Toggle */
        .theme-toggle {
            position: absolute;
            top: 2rem;
            right: 2rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(0, 0, 0, 0.8);
            padding: 0.5rem 1rem;
            border-radius: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .theme-toggle label {
            font-size: 0.9rem;
            font-weight: 500;
            color: white;
            cursor: pointer;
        }

        /* Make toggle visible on black backgrounds too */
        body.theme-black .theme-toggle {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(0, 0, 0, 0.3);
        }

        body.theme-black .theme-toggle label {
            color: black;
        }

        .toggle-switch {
            position: relative;
            width: 50px;
            height: 24px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .toggle-switch::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: #000000;
            border-radius: 50%;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .toggle-switch.dark::before {
            transform: translateX(26px);
            background: #2C3E50;
        }

        /* Metrics Bar */
        .metrics-bar {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-around;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .metric-item {
            text-align: center;
        }

        .metric-value {
            font-size: 28px;
            font-weight: bold;
        }

        .metric-label {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 5px;
        }

        /* Dual Panels */
        .tuning-panel {
            background: var(--panel-bg, white);
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }

        .panel-header {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 15px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .panel-header.optimal {
            background: linear-gradient(135deg, #27ae60, #219a52);
        }

        .panel-header h3 {
            margin: 0;
            font-size: 20px;
        }

        .collapse-indicator {
            font-size: 18px;
            transition: transform 0.3s;
        }

        .panel-header.collapsed .collapse-indicator {
            transform: rotate(-90deg);
        }

        .panel-content {
            overflow-x: auto;
            overflow-y: hidden;
            transition: max-height 0.3s ease;
        }

        .panel-content.collapsed {
            max-height: 0;
        }

        .panel-content.expanded {
            max-height: 1200px;
        }

        .tuning-info {
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .tuning-display {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #008080;
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #ddd;
        }

        .bent-notes-count {
            font-size: 14px;
            color: #e74c3c;
            font-weight: 600;
        }

        .tablature-container {
            padding: 20px;
            overflow-x: auto;
            background: #fafafa;
        }

        /* Controls */
        .controls {
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            display: flex;
            gap: 20px;
            align-items: center;
        }

        button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }

        button:hover {
            background: #2980b9;
        }

        .zoom-slider {
            width: 150px;
        }

        /* Relationship Indicators */
        .relationship-legend {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            gap: 30px;
            font-size: 12px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 50%;
        }
    </style>
</head>
<body class="theme-white">
    <div class="container">
        <!-- Theme Toggle -->
        <div class="theme-toggle">
            <label for="themeToggle">Light</label>
            <div class="toggle-switch" id="themeToggle" onclick="toggleTheme()"></div>
            <label for="themeToggle">Dark</label>
        </div>

        <!-- Header -->
        <header>
            <a href="http://localhost:8080" class="library-button">Library</a>
            <h1>${songName}</h1>
            <h2>Complete Musical Relationships Visualization</h2>
        </header>

        <!-- Metrics Bar -->
        <div class="metrics-bar">
            <div class="metric-item">
                <div class="metric-value">${relationshipData.metadata.totalNotes}</div>
                <div class="metric-label">Total Notes</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${relationshipData.metadata.mainNotes}</div>
                <div class="metric-label">Main Notes</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${relationshipData.metadata.graceNotes}</div>
                <div class="metric-label">Grace Notes</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${relationshipData.graceNoteRelationships.length}</div>
                <div class="metric-label">Grace Relations</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${relationshipData.melismaRelationships.length}</div>
                <div class="metric-label">Melisma Groups</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${relationshipData.lyricStructure.phraseCount}</div>
                <div class="metric-label">Lyric Phrases</div>
            </div>
        </div>

        <!-- Relationship Legend -->
        <div class="relationship-legend">
            <div class="legend-item">
                <div class="legend-color" style="background: #FFD700"></div>
                <span>Grace Notes</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #E74C3C"></div>
                <span>Melisma</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #FF0000"></div>
                <span>Bent Notes</span>
            </div>
            <div class="legend-item">
                <span>●</span>
                <span>Bent from String</span>
            </div>
            <div class="legend-item">
                <span>*</span>
                <span>Has Grace Notes</span>
            </div>
        </div>

        <!-- Controls -->
        <div class="controls">
            <label>X-Zoom:</label>
            <input type="range" class="zoom-slider" min="10" max="200" value="100"
                   onchange="updateZoom('x', this.value)">
            <label>Y-Zoom:</label>
            <input type="range" class="zoom-slider" min="10" max="200" value="100"
                   onchange="updateZoom('y', this.value)">
            <button onclick="toggleBentNotes()">Toggle Bent Notes</button>
        </div>

        <!-- Optimal Tuning Panel -->
        <div class="tuning-panel">
            <div class="panel-header optimal" onclick="togglePanel('optimal')">
                <h3>Optimal Tuning: ${originalTuning.join('-')}</h3>
                <span class="collapse-indicator">v</span>
            </div>
            <div class="panel-content expanded" id="optimalContent">
                <div class="tuning-info">
                    <span class="tuning-display">${originalTuning.join('-')}</span>
                    <span class="bent-notes-count">${optimalSVG.bentNoteCount} bent notes</span>
                </div>
                <div class="tablature-container">
                    <svg width="${optimalSVG.width}" height="${optimalSVG.height}" id="optimalSVG">
                        ${optimalSVG.svg}
                    </svg>
                </div>
            </div>
        </div>

        <!-- Traditional Tuning Panel with Dropdown -->
        <div class="tuning-panel">
            <div class="panel-header" onclick="togglePanel('traditional')">
                <h3>Alternative Tuning: <select id="tuningSelector" onclick="event.stopPropagation()" onchange="changeTuning(this.value)" style="
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.3);
                    color: inherit;
                    font-size: inherit;
                    font-weight: inherit;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 0 5px;
                    max-width: 400px;
                ">
                    ${Object.entries(tuningSystems).map(([category, tunings]) => `
                        <optgroup label="── ${category} ──" style="font-weight: bold; color: #666;">
                            ${tunings.map(tuningObj =>
                                `<option value="${tuningObj.value}" ${tuningObj.value === defaultTraditionalTuning ? 'selected' : ''}>${tuningObj.label}</option>`
                            ).join('')}
                        </optgroup>
                    `).join('')}
                </select></h3>
                <span class="collapse-indicator">></span>
            </div>
            <div class="panel-content collapsed" id="traditionalContent">
                <div class="tuning-info">
                    <span class="tuning-display" id="tuningDisplay">${defaultTraditionalTuning}</span>
                    <span class="bent-notes-count" id="bentNotesCount">${traditionalSVG.bentNoteCount} bent notes</span>
                </div>
                <div class="tablature-container" id="traditionalContainer">
                    <svg width="${traditionalSVG.width}" height="${traditionalSVG.height}" id="traditionalSVG">
                        ${traditionalSVG.svg}
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Store all pre-generated traditional tuning SVGs
        const traditionalSVGs = ${JSON.stringify(traditionalSVGs)};

        // Function to change tuning
        function changeTuning(selectedTuning) {
            const svgData = traditionalSVGs[selectedTuning];
            if (!svgData) {
                console.error('Tuning not found:', selectedTuning);
                return;
            }

            // Update the display
            document.getElementById('tuningDisplay').textContent = selectedTuning;
            document.getElementById('bentNotesCount').textContent = svgData.bentNoteCount + ' bent notes';

            // Update the SVG
            const container = document.getElementById('traditionalContainer');
            container.innerHTML = '<svg width="' + svgData.width + '" height="' + svgData.height + '" id="traditionalSVG">' + svgData.svg + '</svg>';

            // Preserve current zoom level - don't change user's view
            const svg = document.getElementById('traditionalSVG');
            if (svg && (xZoom !== 1 || yZoom !== 1)) {
                // Apply current zoom levels to new SVG elements
                svg.querySelectorAll('*').forEach(element => {
                    // Store base positions for zoom calculations
                    element.dataset.baseX = element.getAttribute('x') || element.getAttribute('cx') || element.getAttribute('x1') || '0';
                    element.dataset.baseY = element.getAttribute('y') || element.getAttribute('cy') || element.getAttribute('y1') || '0';
                    element.dataset.baseX2 = element.getAttribute('x2') || '';
                    element.dataset.baseY2 = element.getAttribute('y2') || '';
                });

                // Apply existing zoom levels without changing sliders
                updateZoom('x', xZoom * 100);
                updateZoom('y', yZoom * 100);
            }
        }

        // Panel collapse functionality
        function togglePanel(panelType) {
            const content = document.getElementById(panelType + 'Content');
            const header = content.previousElementSibling;
            const indicator = header.querySelector('.collapse-indicator');

            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                content.classList.add('expanded');
                indicator.textContent = 'v';
                header.classList.remove('collapsed');
            } else {
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                indicator.textContent = '>';
                header.classList.add('collapsed');
            }
        }

        // Zoom functionality
        let xZoom = 1, yZoom = 1;

        // Calculate default zoom to fit content
        function calculateDefaultZoom() {
            // Get the first SVG to measure
            const svg = document.querySelector('svg');
            if (!svg) return { x: 100, y: 100 };

            // Use the declared SVG width which includes all content
            const declaredWidth = parseFloat(svg.getAttribute('width') || 0);
            const tablatureHeight = parseFloat(svg.getAttribute('height') || 0);

            if (declaredWidth === 0) return { x: 100, y: 100 };

            // Account for container padding and margins
            // The container has padding and the panels have margins
            const containerPadding = 120; // Increased to account for full container structure
            const screenWidth = window.innerWidth - containerPadding;
            const screenHeight = (window.innerHeight - 300) / 2; // Two panels with UI space

            // Smart zoom calculation - allow very small zoom for overview
            const xZoomPercent = Math.min(Math.max((screenWidth / declaredWidth) * 100, 1), 200); // Min 1% for full overview
            const yZoomPercent = Math.min(Math.max((screenHeight / tablatureHeight) * 100, 1), 200); // Min 1% for full overview

            console.log('Auto-zoom calculation:', {
                declaredWidth: declaredWidth + 'px',
                screenWidth: screenWidth + 'px',
                containerPadding: containerPadding + 'px',
                xZoomPercent: xZoomPercent.toFixed(1) + '%',
                yZoomPercent: yZoomPercent.toFixed(1) + '%'
            });

            return {
                x: xZoomPercent,
                y: yZoomPercent
            };
        }

        function updateZoom(axis, value) {
            const zoom = value / 100;
            if (axis === 'x') xZoom = zoom;
            else yZoom = zoom;

            document.querySelectorAll('svg').forEach(svg => {
                // Reset SVG transform
                svg.style.transform = '';

                // Apply zoom by transforming individual elements
                svg.querySelectorAll('*').forEach(element => {
                    if (!element.dataset.baseX) {
                        // Store original positions on first zoom
                        element.dataset.baseX = element.getAttribute('x') || element.getAttribute('cx') || element.getAttribute('x1') || '0';
                        element.dataset.baseY = element.getAttribute('y') || element.getAttribute('cy') || element.getAttribute('y1') || '0';
                        element.dataset.baseX2 = element.getAttribute('x2') || '';
                        element.dataset.baseY2 = element.getAttribute('y2') || '';

                        // Store width for rectangles (including resonance bands)
                        if (element.tagName === 'rect' && element.getAttribute('width')) {
                            element.dataset.baseWidth = element.getAttribute('width');
                        }
                    }

                    const baseX = parseFloat(element.dataset.baseX);
                    const baseY = parseFloat(element.dataset.baseY);
                    const baseX2 = element.dataset.baseX2 ? parseFloat(element.dataset.baseX2) : null;
                    const baseY2 = element.dataset.baseY2 ? parseFloat(element.dataset.baseY2) : null;

                    // Apply X-zoom (horizontal scaling from x=120 pivot point)
                    if (element.hasAttribute('x') || element.hasAttribute('cx') || element.hasAttribute('x1')) {
                        const pivotX = 120; // String label boundary
                        let newX;
                        if (baseX <= pivotX) {
                            newX = baseX; // Don't scale string labels area
                        } else {
                            newX = pivotX + (baseX - pivotX) * xZoom;
                        }

                        if (element.hasAttribute('x')) element.setAttribute('x', newX);
                        if (element.hasAttribute('cx')) element.setAttribute('cx', newX);
                        if (element.hasAttribute('x1')) element.setAttribute('x1', newX);
                    }

                    // Apply X-zoom to x2 coordinates (for lines)
                    if (baseX2 !== null && element.hasAttribute('x2')) {
                        const pivotX = 120;
                        let newX2;
                        if (baseX2 <= pivotX) {
                            newX2 = baseX2;
                        } else {
                            newX2 = pivotX + (baseX2 - pivotX) * xZoom;
                        }
                        element.setAttribute('x2', newX2);
                    }

                    // Apply Y-zoom (vertical scaling from top)
                    if (element.hasAttribute('y') || element.hasAttribute('cy') || element.hasAttribute('y1')) {
                        const newY = baseY * yZoom;

                        if (element.hasAttribute('y')) element.setAttribute('y', newY);
                        if (element.hasAttribute('cy')) element.setAttribute('cy', newY);
                        if (element.hasAttribute('y1')) element.setAttribute('y1', newY);
                    }

                    // Apply Y-zoom to y2 coordinates (for lines)
                    if (baseY2 !== null && element.hasAttribute('y2')) {
                        const newY2 = baseY2 * yZoom;
                        element.setAttribute('y2', newY2);
                    }

                    // Handle resonance triangle scaling - stick to note head
                    if (element.classList.contains('resonance-triangle') && element.tagName === 'polygon') {
                        // Recalculate triangle points based on zoom and note position
                        if (element.dataset.noteY && element.dataset.bandHeight && element.dataset.noteX) {
                            const noteY = parseFloat(element.dataset.noteY);
                            const noteX = parseFloat(element.dataset.noteX);
                            const bandHeight = parseFloat(element.dataset.bandHeight);
                            const scaledNoteY = noteY * yZoom;

                            // Calculate note position with X-zoom
                            const pivotX = 120;
                            const scaledNoteX = noteX <= pivotX ? noteX : pivotX + (noteX - pivotX) * xZoom;

                            // Triangle starts at right edge of scaled note head
                            const noteRadius = 12;
                            const startX = scaledNoteX + noteRadius;
                            const endX = startX + (160 * xZoom); // Scaled half-note length

                            // Recalculate triangle points
                            const topY = scaledNoteY - bandHeight / 2;
                            const bottomY = scaledNoteY + bandHeight / 2;
                            const newPoints = startX + ',' + topY + ' ' + startX + ',' + bottomY + ' ' + endX + ',' + scaledNoteY;
                            element.setAttribute('points', newPoints);
                        }
                    }

                    // Handle note label positioning to stay centered on note head
                    if (element.classList.contains('note-label') && element.dataset.noteX && element.dataset.noteY) {
                        const noteBaseX = parseFloat(element.dataset.noteX);
                        const noteBaseY = parseFloat(element.dataset.noteY);

                        // Calculate scaled note position
                        const pivotX = 120;
                        const scaledNoteX = noteBaseX <= pivotX ? noteBaseX : pivotX + (noteBaseX - pivotX) * xZoom;
                        const scaledNoteY = noteBaseY * yZoom;

                        // Center text on scaled note position
                        element.setAttribute('x', scaledNoteX);
                        element.setAttribute('y', scaledNoteY + 5); // Slight offset for center alignment
                    }

                    // Handle lyric text positioning to maintain constant distance from note
                    if (element.classList.contains('lyric-text') && element.dataset.baseY && element.dataset.lyricOffset) {
                        const noteBaseY = parseFloat(element.dataset.baseY);
                        const lyricOffset = parseFloat(element.dataset.lyricOffset);
                        const newNoteY = noteBaseY * yZoom;
                        const newLyricY = newNoteY + lyricOffset; // Fixed offset regardless of zoom
                        element.setAttribute('y', newLyricY);
                    }

                    // Keep circles at consistent size - NEVER modify font sizes
                    if (element.tagName === 'circle') {
                        element.style.transform = '';
                    }
                    // Text elements: preserve ALL original font sizes, NEVER override
                    if (element.tagName === 'text') {
                        element.style.transform = '';
                        // Explicitly preserve original font sizes regardless of zoom
                        const originalFontSize = element.getAttribute('font-size');
                        if (originalFontSize) {
                            element.style.fontSize = originalFontSize + 'px';
                            element.style.setProperty('font-size', originalFontSize + 'px', 'important');
                        }
                    }
                });

                // Update SVG dimensions for proper scrolling
                const baseWidth = parseFloat(svg.dataset.baseWidth || svg.getAttribute('width'));
                const baseHeight = parseFloat(svg.dataset.baseHeight || svg.getAttribute('height'));
                if (!svg.dataset.baseWidth) {
                    svg.dataset.baseWidth = svg.getAttribute('width');
                    svg.dataset.baseHeight = svg.getAttribute('height');
                }

                // Calculate actual width needed including rightmost elements
                // Find the rightmost element position after zoom
                let maxX = 0;
                svg.querySelectorAll('circle, rect, line, polygon').forEach(el => {
                    let rightEdge = 0;
                    if (el.tagName === 'circle') {
                        rightEdge = parseFloat(el.getAttribute('cx') || 0) + 15; // Add radius
                    } else if (el.tagName === 'rect') {
                        rightEdge = parseFloat(el.getAttribute('x') || 0) + parseFloat(el.getAttribute('width') || 0);
                    } else if (el.tagName === 'line') {
                        rightEdge = Math.max(parseFloat(el.getAttribute('x1') || 0), parseFloat(el.getAttribute('x2') || 0));
                    } else if (el.tagName === 'polygon') {
                        // Parse polygon points to find rightmost X coordinate
                        const points = el.getAttribute('points') || '';
                        const coords = points.split(/[\s,]+/).map(parseFloat);
                        for (let i = 0; i < coords.length; i += 2) {
                            if (!isNaN(coords[i])) {
                                rightEdge = Math.max(rightEdge, coords[i]);
                            }
                        }
                    }
                    maxX = Math.max(maxX, rightEdge);
                });

                // Use the larger of calculated width or base width * zoom
                const calculatedWidth = Math.max(baseWidth * xZoom, maxX + 150); // Add more padding to prevent cutoff
                svg.setAttribute('width', calculatedWidth);
                svg.setAttribute('height', baseHeight * yZoom);
            });
        }

        // Toggle bent notes visibility
        let bentNotesVisible = true;

        function toggleBentNotes() {
            bentNotesVisible = !bentNotesVisible;
            const opacity = bentNotesVisible ? '1' : '0';

            document.querySelectorAll('[stroke-dasharray="3,2"]').forEach(el => {
                el.style.opacity = opacity;
            });

            document.querySelectorAll('text').forEach(el => {
                if (el.textContent === '●') {
                    el.style.opacity = opacity;
                }
            });
        }

        // Audio Playback System (Prepared for Integration)
        class AudioPlayer {
            constructor() {
                this.audioContext = null;
                this.currentBuffer = null;
                this.source = null;
                this.isPlaying = false;
                this.playbackRate = 1.0;
                this.currentNoteIndex = 0;
                this.noteTimings = [];
            }

            async init() {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
            }

            async loadAudio(url) {
                try {
                    const response = await fetch(url);
                    const arrayBuffer = await response.arrayBuffer();
                    this.currentBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    return true;
                } catch (error) {
                    console.error('Failed to load audio:', error);
                    return false;
                }
            }

            play() {
                if (!this.currentBuffer || this.isPlaying) return;

                this.source = this.audioContext.createBufferSource();
                this.source.buffer = this.currentBuffer;
                this.source.playbackRate.value = this.playbackRate;
                this.source.connect(this.audioContext.destination);

                this.source.onended = () => {
                    this.isPlaying = false;
                    this.clearHighlights();
                };

                this.source.start(0);
                this.isPlaying = true;
                this.startHighlighting();
            }

            stop() {
                if (this.source && this.isPlaying) {
                    this.source.stop();
                    this.isPlaying = false;
                    this.clearHighlights();
                }
            }

            setPlaybackRate(rate) {
                this.playbackRate = rate;
                if (this.source) {
                    this.source.playbackRate.value = rate;
                }
            }

            // Note highlighting during playback
            startHighlighting() {
                const notes = document.querySelectorAll('circle[data-note-index]');
                const noteTimings = this.calculateNoteTimings(notes);

                let currentIndex = 0;
                const highlightNext = () => {
                    if (currentIndex >= notes.length || !this.isPlaying) {
                        return;
                    }

                    // Remove previous highlight
                    if (currentIndex > 0) {
                        notes[currentIndex - 1].classList.remove('playing');
                    }

                    // Add current highlight
                    notes[currentIndex].classList.add('playing');

                    // Schedule next highlight
                    const nextDelay = noteTimings[currentIndex] || 100;
                    currentIndex++;
                    setTimeout(highlightNext, nextDelay / this.playbackRate);
                };

                highlightNext();
            }

            calculateNoteTimings(notes) {
                // Calculate timing based on x positions and durations
                const timings = [];
                for (let i = 0; i < notes.length; i++) {
                    const x = parseFloat(notes[i].getAttribute('cx') || 0);
                    const duration = parseFloat(notes[i].dataset.duration || 0.5);
                    timings.push(duration * 1000); // Convert to milliseconds
                }
                return timings;
            }

            clearHighlights() {
                document.querySelectorAll('.playing').forEach(el => {
                    el.classList.remove('playing');
                });
            }
        }

        // Cross-Element Highlighting System
        class HighlightManager {
            constructor() {
                this.activeHighlights = new Set();
                this.highlightGroups = new Map();
            }

            registerGroup(groupId, elements) {
                this.highlightGroups.set(groupId, elements);
            }

            highlightGroup(groupId) {
                const elements = this.highlightGroups.get(groupId);
                if (!elements) return;

                // Clear existing highlights
                this.clearAll();

                // Add new highlights
                elements.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => {
                        el.classList.add('highlighted');
                        this.activeHighlights.add(el);
                    });
                });
            }

            highlightLyric(lyricText) {
                // Find all notes with this lyric
                const noteElements = document.querySelectorAll(\`[data-lyrics="\${lyricText}"]\`);
                const lyricElements = document.querySelectorAll(\`.lyric-text:contains("\${lyricText}")\`);

                this.clearAll();

                noteElements.forEach(el => {
                    el.classList.add('highlighted');
                    this.activeHighlights.add(el);
                });

                lyricElements.forEach(el => {
                    el.classList.add('highlighted');
                    this.activeHighlights.add(el);
                });
            }

            clearAll() {
                this.activeHighlights.forEach(el => {
                    el.classList.remove('highlighted');
                });
                this.activeHighlights.clear();
            }
        }

        // Initialize systems
        const audioPlayer = new AudioPlayer();
        const highlightManager = new HighlightManager();

        // Setup click handlers for lyrics and apply default zoom
        document.addEventListener('DOMContentLoaded', () => {
            // Apply default zoom after brief delay - CSS gradients should persist
            setTimeout(() => {
                const defaultZoom = calculateDefaultZoom();

                console.log('Auto-zoom condition check:', defaultZoom.x >= 1, defaultZoom.x < 200, defaultZoom.y >= 1, defaultZoom.y < 200);
                if (defaultZoom.x >= 1 && defaultZoom.x < 200 && defaultZoom.y >= 1 && defaultZoom.y < 200) { // SAFE AUTO-ZOOM with font preservation
                    console.log('AUTO-ZOOM CONDITION PASSED - Looking for sliders...');
                    const xSlider = document.querySelectorAll('.zoom-slider')[0];
                    const ySlider = document.querySelectorAll('.zoom-slider')[1];
                    console.log('Found sliders:', xSlider ? 'X-slider found' : 'X-slider missing', ySlider ? 'Y-slider found' : 'Y-slider missing');

                    if (xSlider) {
                        xSlider.value = defaultZoom.x;
                        updateZoom('x', defaultZoom.x);
                        // SAFE AUTO-ZOOM: Force font preservation after zoom
                        setTimeout(() => {
                            document.querySelectorAll('svg text').forEach(textEl => {
                                const originalSize = textEl.getAttribute('font-size');
                                if (originalSize) {
                                    textEl.style.fontSize = originalSize + 'px';
                                    textEl.style.setProperty('font-size', originalSize + 'px', 'important');
                                }
                            });
                        }, 50);
                    }
                    if (ySlider) {
                        ySlider.value = defaultZoom.y;
                        updateZoom('y', defaultZoom.y);
                        // SAFE AUTO-ZOOM: Force font preservation after Y-zoom
                        setTimeout(() => {
                            document.querySelectorAll('svg text').forEach(textEl => {
                                const originalSize = textEl.getAttribute('font-size');
                                if (originalSize) {
                                    textEl.style.fontSize = originalSize + 'px';
                                    textEl.style.setProperty('font-size', originalSize + 'px', 'important');
                                }
                            });
                        }, 100);
                    }

                    console.log('Applied auto-zoom with CSS-gradient resonance bands:', defaultZoom.x + '%, ' + defaultZoom.y + '%');
                }
            }, 500);

            // Lyric click highlighting
            document.querySelectorAll('.lyric-text').forEach(lyric => {
                lyric.addEventListener('click', () => {
                    const lyricText = lyric.textContent.trim();
                    highlightManager.highlightLyric(lyricText);
                });
            });

            // Note click highlighting
            document.querySelectorAll('circle[data-lyrics]').forEach(note => {
                note.addEventListener('click', () => {
                    const lyricText = note.dataset.lyrics;
                    highlightManager.highlightLyric(lyricText);
                });
            });

            // Pattern band click highlighting
            document.querySelectorAll('.resonance-band').forEach(band => {
                band.addEventListener('click', () => {
                    const pattern = band.dataset.pattern;
                    highlightManager.highlightGroup(pattern);
                });
            });
        });

        console.log('Loaded ${songName} with complete relationships');
        console.log('Grace notes: ${relationshipData.metadata.graceNotes}');
        console.log('Melisma groups: ${relationshipData.melismaRelationships.length}');
        console.log('Optimal spacing: 0.125px per cent');

        // Theme toggle functionality
        function toggleTheme() {
            const body = document.body;
            const toggle = document.getElementById('themeToggle');

            if (body.classList.contains('theme-black')) {
                // Switch to white theme
                body.classList.remove('theme-black');
                body.classList.add('theme-white');
                toggle.classList.remove('dark');
                localStorage.setItem('theme', 'white');
            } else {
                // Switch to black theme
                body.classList.remove('theme-white');
                body.classList.add('theme-black');
                toggle.classList.add('dark');
                localStorage.setItem('theme', 'black');
            }
        }

        // Load saved theme on page load
        document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('theme');
            const toggle = document.getElementById('themeToggle');

            if (savedTheme === 'black') {
                document.body.classList.remove('theme-white');
                document.body.classList.add('theme-black');
                toggle.classList.add('dark');
            }
        });
    </script>
</body>
</html>`;

        return html;
    }

    /**
     * Generate viewer file
     */
    generateViewer(relationshipFilePath, outputPath) {
        try {
            // Read relationship data
            const relationshipData = JSON.parse(fs.readFileSync(relationshipFilePath, 'utf8'));

            // Generate HTML
            const html = this.generateDualPanelHTML(relationshipData);

            // Save file
            fs.writeFileSync(outputPath, html);

            console.log(`✅ Generated dual-panel viewer: ${outputPath}`);
            console.log(`   • Total notes: ${relationshipData.metadata.totalNotes}`);
            console.log(`   • Grace notes: ${relationshipData.metadata.graceNotes}`);
            console.log(`   • Melisma groups: ${relationshipData.melismaRelationships.length}`);
            console.log(`   • Optimal spacing: 0.125px per cent`);

            return outputPath;

        } catch (error) {
            console.error(`❌ Error generating viewer: ${error.message}`);
            return null;
        }
    }
}

// Export for use
module.exports = DualPanelGenerator;

// Standalone execution
if (require.main === module) {
    const generator = new DualPanelGenerator();

    // Check if a specific song is provided as argument
    const songArg = process.argv[2];

    if (songArg) {
        // Generate for specific song
        const relationshipFile = path.join(__dirname, `data/processed/${songArg}/relationships.json`);
        const outputFile = path.join(__dirname, `data/processed/${songArg}/complete-dual-panel.html`);

        if (fs.existsSync(relationshipFile)) {
            const result = generator.generateViewer(relationshipFile, outputFile);
            if (result) {
                console.log(`✅ Generated dual-panel viewer for: ${songArg}`);
                console.log(`   Open: ${result}`);
            }
        } else {
            console.log(`❌ No relationships.json found for: ${songArg}`);
        }
    } else {
        // Generate for all songs that have relationships.json
        const processedDir = path.join(__dirname, 'data/processed');
        const songDirs = fs.readdirSync(processedDir);

        let generated = 0;
        let total = 0;

        console.log('🔄 Generating dual-panel viewers for all songs with relationships...\n');

        songDirs.forEach(songDir => {
            const relationshipFile = path.join(processedDir, songDir, 'relationships.json');
            if (fs.existsSync(relationshipFile)) {
                total++;
                const outputFile = path.join(processedDir, songDir, 'complete-dual-panel.html');
                const result = generator.generateViewer(relationshipFile, outputFile);
                if (result) {
                    generated++;
                    console.log(`✅ Generated: ${songDir}`);
                } else {
                    console.log(`❌ Failed: ${songDir}`);
                }
            }
        });

        console.log(`\nGenerated ${generated}/${total} dual-panel viewers successfully!`);
    }
}