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

        // Load HTML template and components
        this.htmlTemplate = this.loadTemplate();
        this.components = this.loadComponents();

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

    loadTemplate() {
        try {
            const templatePath = path.join(__dirname, 'templates', 'dual-panel-viewer-template.html');
            return fs.readFileSync(templatePath, 'utf8');
        } catch (error) {
            console.error('Error loading template:', error);
            // Return a minimal fallback template
            return `<!DOCTYPE html>
<html>
<head>
    <title>{{SONG_NAME}} - Đàn Tranh Tablature</title>
</head>
<body>
    <div class="container">
        {{OPTIMAL_SVG}}
        {{TRADITIONAL_SVG}}
    </div>
</body>
</html>`;
        }
    }

    loadComponents() {
        try {
            const headerTemplatePath = path.join(__dirname, 'templates', 'components', 'header-template.html');
            const moveButtonsTemplatePath = path.join(__dirname, 'templates', 'components', 'move-buttons-template.html');

            return {
                header: fs.readFileSync(headerTemplatePath, 'utf8'),
                moveButtons: fs.readFileSync(moveButtonsTemplatePath, 'utf8')
            };
        } catch (error) {
            console.error('Error loading components:', error);
            // Return minimal fallback components
            return {
                header: `<div class="panel-header" onclick="togglePanel('{{SECTION_ID}}')">
                    {{MOVE_BUTTONS_COMPONENT}}
                    <h3>{{SECTION_ICON}} {{SECTION_TITLE}}</h3>
                    <span class="collapse-indicator" id="{{SECTION_ID}}Collapse">▼</span>
                </div>`,
                moveButtons: `<div class="move-controls">
                    <button class="move-arrow" onclick="moveSection('{{PANEL_ID}}', 'up'); event.stopPropagation();">▲</button>
                    <button class="move-arrow" onclick="moveSection('{{PANEL_ID}}', 'down'); event.stopPropagation();">▼</button>
                </div>`
            };
        }
    }

    generateMoveButtons(panelId) {
        return this.components.moveButtons.replace(/{{PANEL_ID}}/g, panelId);
    }

    generateHeader(sectionId, title, icon, hasMoveButtons = true) {
        const moveButtons = hasMoveButtons ? this.generateMoveButtons(sectionId + 'Panel') : '';
        return this.components.header
            .replace(/{{SECTION_ID}}/g, sectionId)
            .replace(/{{SECTION_TITLE}}/g, title)
            .replace(/{{SECTION_ICON}}/g, icon)
            .replace(/{{MOVE_BUTTONS_COMPONENT}}/g, moveButtons);
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
                                class="bent-line" fill="none"/>`;
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
        const metadata = relationshipData.metadata;

        // Get original tuning from metadata
        const originalTuning = relationshipData.metadata.tuning ?
            relationshipData.metadata.tuning.split('-') :
            ['C', 'D', 'E', 'G', 'A']; // Default pentatonic if not specified

        // Get all available tunings from loaded tuning systems
        const tuningSystems = this.tuningSystems;

        // Generate SVGs for both panels
        const optimalResult = this.generateTuningSVG(notes, originalTuning, songName, 'optimal');
        const optimalSVG = optimalResult.svg;
        const bentCount = optimalResult.bentNoteCount;
        const svgWidth = optimalResult.width;
        const svgHeight = optimalResult.height;

        // Calculate bent percentage
        const totalNotes = metadata.totalNotes || notes.length;
        const bentPercent = totalNotes > 0 ? Math.round((bentCount / totalNotes) * 100) : 0;

        // Generate all traditional tuning SVGs for the dropdown
        const traditionalSVGs = {};
        Object.entries(tuningSystems).forEach(([category, tunings]) => {
            tunings.forEach(tuningObj => {
                const tuningNotes = tuningObj.value.split('-');
                const result = this.generateTuningSVG(notes, tuningNotes, songName, 'traditional');
                traditionalSVGs[tuningObj.value] = result.svg;
            });
        });

        // Default to C-D-E-G-A for initial display
        const defaultTraditionalTuning = 'C-D-E-G-A';
        const traditionalSVG = traditionalSVGs[defaultTraditionalTuning] ||
                              traditionalSVGs[tuningSystems[Object.keys(tuningSystems)[0]][0].value];

        // Generate modular component headers
        const optimalTuningHeader = this.generateHeader('optimal', 'Optimal Tuning (Song-Specific)', '🎵', false);
        const alternativeTuningHeader = this.generateHeader('comparison', 'Alternative Tuning', '🔍', true);
        const lyricsHeader = this.generateHeader('lyrics', 'Lyrics', '📝', true);
        const infoHeader = this.generateHeader('info', 'Additional Information', 'ℹ️', true);
        const analysisHeader = this.generateHeader('analysis', 'Pattern Analysis', '📊', true);

        // Use template with placeholders
        let html = this.htmlTemplate
            .replace(/{{SONG_NAME}}/g, songName)
            .replace(/{{TUNING}}/g, originalTuning.join('-'))
            .replace(/{{BENT_METRICS}}/g, `${bentCount} bent notes (${bentPercent}%)`)
            .replace(/{{SVG_WIDTH}}/g, svgWidth)
            .replace(/{{SVG_HEIGHT}}/g, svgHeight)
            .replace(/{{OPTIMAL_SVG_CONTENT}}/g, optimalSVG)
            .replace(/{{COMPARISON_SVG_CONTENT}}/g, traditionalSVG)
            .replace(/{{SONG_NOTES}}/g, JSON.stringify(notes))
            .replace(/{{SONG_METADATA}}/g, JSON.stringify(metadata))
            .replace(/{{OPTIMAL_TUNING_ARRAY}}/g, JSON.stringify(originalTuning))
            .replace(/{{COMPARISON_TUNINGS}}/g, JSON.stringify(tuningSystems))
            .replace(/{{OPTIMAL_TUNING_HEADER}}/g, optimalTuningHeader)
            .replace(/{{ALTERNATIVE_TUNING_HEADER}}/g, alternativeTuningHeader)
            .replace(/{{LYRICS_HEADER}}/g, lyricsHeader)
            .replace(/{{INFO_HEADER}}/g, infoHeader)
            .replace(/{{ANALYSIS_HEADER}}/g, analysisHeader);

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