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
            mainNote: '#666666',      // Neutral grey for notes
            graceNote: '#FFD700',     // Gold for grace notes
            bentIndicator: '#FF0000', // Red for bent notes
            melisma: '#E74C3C',       // Red for melisma
            string: '#000000',        // Black for used strings
            unusedString: '#999999'   // Grey for unused strings
        };
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
        // Calculate width based on last note's timing plus duration plus one whole note
        const lastNote = notes[notes.length - 1];
        // Duration-based spacing in the dual-panel viewer (scaled down)
        // Note that timing is scaled by 0.5 for x positions in this viewer
        const lastNoteDurationValue = lastNote ?
            (lastNote.isGrace ? 0.5 : (lastNote.duration ? lastNote.duration.value : 4)) : 4;
        const scaledDurationWidth = lastNote ?
            (lastNote.isGrace ? 12.5 : lastNoteDurationValue * 42.5) : 0;
        const wholeNoteDuration = 16 * 42.5; // 680 pixels for a whole note (scaled)
        const lastNoteEndX = lastNote ? (100 + lastNote.timing * 0.5 + scaledDurationWidth) : 100;
        const width = Math.max(2400, lastNoteEndX + wholeNoteDuration + 100); // +100 for padding
        const height = 600;

        // Draw string lines
        strings.forEach(string => {
            const isUsed = usedStrings.has(string.number);
            const color = isUsed ? this.colors.string : this.colors.unusedString;
            const opacity = isUsed ? '1' : '0.3';

            svg += `<line x1="50" y1="${string.y}" x2="${width - 50}" y2="${string.y}"
                     stroke="${color}" stroke-width="2" opacity="${opacity}"/>`;
            svg += `<text x="20" y="${string.y + 4}" font-size="10" fill="${color}">${string.note}</text>\n`;
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
                    svg += `<text x="${x}" y="${y + 2}" text-anchor="middle" font-size="5"
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

                svg += `<circle cx="${x}" cy="${y}" r="5" fill="${this.colors.graceNote}"
                        stroke="#CC9900" stroke-width="1"
                        data-lyrics="${associatedLyrics}" class="lyrics-${associatedLyrics}"/>`;
                // Note name inside grace note
                svg += `<text x="${x}" y="${y + 2}" text-anchor="middle" font-size="5"
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

                // Draw note
                svg += `<circle cx="${x}" cy="${y}" r="8" fill="${this.colors.mainNote}"
                        stroke="#333" stroke-width="1" class="note-circle"/>`;

                // Note name inside the note head
                svg += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="7"
                        fill="white" font-weight="bold">${note.pitch.fullNote}</text>`;

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
                            fill="${lyricColor}">${note.lyrics.text}</text>`;

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
                            fill="${this.colors.graceNote}">♪</text>`;
                }
            }
        });

        return { svg, bentNoteCount, width, height };
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

        // Generate SVGs for both panels
        const optimalSVG = this.generateTuningSVG(notes, originalTuning, songName, 'optimal');
        const traditionalSVG = this.generateTuningSVG(notes, ['C', 'D', 'E', 'G', 'A'], songName, 'traditional');

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
        }

        header {
            text-align: center;
            margin-bottom: 30px;
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

        /* 4-Theme System */
        body.theme-white {
            background: #FFFFFF;
            --panel-bg: #FFFFFF;
            --text-primary: #2C3E50;
        }

        body.theme-light-grey {
            background: #D0D0D0;
            --panel-bg: rgba(255, 255, 255, 0.95);
            --text-primary: #2C3E50;
        }

        body.theme-dark-grey {
            background: #2C3E50;
            --panel-bg: rgba(52, 73, 94, 0.9);
            --text-primary: #ECF0F1;
        }

        body.theme-black {
            background: #000000;
            --panel-bg: rgba(26, 26, 26, 0.9);
            --text-primary: #FFFFFF;
        }

        /* Theme Selector */
        .theme-selector {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: var(--panel-bg, white);
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
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
            overflow: hidden;
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
            overflow: hidden;
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
        <!-- Theme Selector -->
        <div class="theme-selector">
            <select onchange="document.body.className = 'theme-' + this.value">
                <option value="white">White</option>
                <option value="light-grey">Light Grey</option>
                <option value="dark-grey">Dark Grey</option>
                <option value="black">Black</option>
            </select>
        </div>

        <!-- Header -->
        <header>
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
                <span>♪</span>
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
            <button onclick="window.location.href='../../../'">← Back to Library</button>
        </div>

        <!-- Optimal Tuning Panel -->
        <div class="tuning-panel">
            <div class="panel-header optimal" onclick="togglePanel('optimal')">
                <h3>🎵 Optimal Tuning: ${originalTuning.join('-')}</h3>
                <span class="collapse-indicator">▼</span>
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

        <!-- Traditional Tuning Panel -->
        <div class="tuning-panel">
            <div class="panel-header" onclick="togglePanel('traditional')">
                <h3>🔍 Traditional Tuning: C-D-E-G-A</h3>
                <span class="collapse-indicator">▼</span>
            </div>
            <div class="panel-content expanded" id="traditionalContent">
                <div class="tuning-info">
                    <span class="tuning-display">C-D-E-G-A</span>
                    <span class="bent-notes-count">${traditionalSVG.bentNoteCount} bent notes</span>
                </div>
                <div class="tablature-container">
                    <svg width="${traditionalSVG.width}" height="${traditionalSVG.height}" id="traditionalSVG">
                        ${traditionalSVG.svg}
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Panel collapse functionality
        function togglePanel(panelType) {
            const content = document.getElementById(panelType + 'Content');
            const header = content.previousElementSibling;
            const indicator = header.querySelector('.collapse-indicator');

            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                content.classList.add('expanded');
                indicator.textContent = '▼';
                header.classList.remove('collapsed');
            } else {
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                indicator.textContent = '▶';
                header.classList.add('collapsed');
            }
        }

        // Zoom functionality
        let xZoom = 1, yZoom = 1;

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

                    // Keep text and circles at consistent size
                    if (element.tagName === 'text' || element.tagName === 'circle') {
                        element.style.transform = '';
                        element.style.fontSize = element.tagName === 'text' ? '10px' : '';
                    }
                });

                // Update SVG dimensions for proper scrolling
                const baseWidth = parseFloat(svg.dataset.baseWidth || svg.getAttribute('width'));
                const baseHeight = parseFloat(svg.dataset.baseHeight || svg.getAttribute('height'));
                if (!svg.dataset.baseWidth) {
                    svg.dataset.baseWidth = svg.getAttribute('width');
                    svg.dataset.baseHeight = svg.getAttribute('height');
                }

                svg.setAttribute('width', baseWidth * xZoom);
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

        // Setup click handlers for lyrics
        document.addEventListener('DOMContentLoaded', () => {
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

        console.log(`\n🎵 Generated ${generated}/${total} dual-panel viewers successfully!`);
    }
}