/**
 * Client-Side Tablature Generator for V4
 * Enables dynamic tablature generation and updates in the browser
 * Based on V3's optimal spacing system
 */

class ClientTablatureGenerator {
    constructor() {
        // V3's optimal spacing: 0.125px per cent (C1-B8 coverage)
        this.PIXELS_PER_CENT = 0.125;
        this.BASE_Y = 100; // Base position for C3

        // Note to cents mapping (from V3)
        this.noteToCents = {
            'C': 0, 'C#': 100, 'Db': 100, 'D': 200, 'D#': 300, 'Eb': 300,
            'E': 400, 'F': 500, 'F#': 600, 'Gb': 600, 'G': 700, 'G#': 800,
            'Ab': 800, 'A': 900, 'A#': 1000, 'Bb': 1000, 'B': 1100,
            // Double sharps/flats
            'Cx': 200, 'C##': 200, 'Dx': 400, 'D##': 400,
            'Ex': 600, 'E##': 600, 'Fx': 700, 'F##': 700,
            'Gx': 900, 'G##': 900, 'Ax': 1100, 'A##': 1100,
            'Bx': 200, 'B##': 200, 'Cbb': 1000, 'Dbb': 0,
            'Ebb': 200, 'Fbb': 400, 'Gbb': 500, 'Abb': 700, 'Bbb': 900
        };

        // Tuning systems
        this.tuningSystems = {
            'C-D-E-G-A': ['C', 'D', 'E', 'G', 'A'], // Standard pentatonic
            'C-D-F-G-A': ['C', 'D', 'F', 'G', 'A'], // Northern
            'C-D-E-G-Bb': ['C', 'D', 'E', 'G', 'Bb'], // Southern
            'C-Eb-F-G-Bb': ['C', 'Eb', 'F', 'G', 'Bb'], // Central
            'D-E-G-A-B': ['D', 'E', 'G', 'A', 'B'] // Modern
        };

        // Demo notes for testing
        this.demoNotes = [
            { pitch: 'D', octave: 4 },
            { pitch: 'G', octave: 4 },
            { pitch: 'A', octave: 4 },
            { pitch: 'F', octave: 4 },
            { pitch: 'C', octave: 5 },
            { pitch: 'E', octave: 5 },
            { pitch: 'Bb', octave: 4 },
            { pitch: 'G', octave: 5 }
        ];
    }

    /**
     * Calculate Y position based on note and octave
     */
    calculateYPosition(note, octave) {
        const pitchClass = note.replace(/[0-9]/g, '');
        const cents = this.noteToCents[pitchClass] || 0;
        const octaveCents = (octave - 3) * 1200; // C3 as reference
        const totalCents = cents + octaveCents;

        // Apply V3's formula: 0.125px per cent from BASE_Y
        return this.BASE_Y + (totalCents * this.PIXELS_PER_CENT);
    }

    /**
     * Generate pentatonic strings based on tuning system
     */
    generatePentatonicStrings(tuningNotes, startOctave = 3, count = 17) {
        const strings = [];
        let noteIndex = 0;
        let octave = startOctave;

        for (let i = 0; i < count; i++) {
            const note = tuningNotes[noteIndex];
            strings.push({
                string: i + 1,
                note: note + octave,
                pitch: note,
                octave: octave,
                y: this.calculateYPosition(note, octave)
            });

            noteIndex++;
            if (noteIndex >= tuningNotes.length) {
                noteIndex = 0;
                octave++;
            }
        }

        return strings;
    }

    /**
     * Check if a note is bent (not an open string note)
     */
    isBentNote(pitch, octave, openStringNotes) {
        return !openStringNotes.some(s =>
            s.pitch === pitch && s.octave === octave
        );
    }

    /**
     * Generate complete SVG content for tablature
     */
    generateSVGContent(tuningKey, songNotes = null, width = 2000, height = 600, showBentNotes = true) {
        const tuningNotes = this.tuningSystems[tuningKey];
        if (!tuningNotes) {
            console.error('Invalid tuning key:', tuningKey);
            return '';
        }

        const strings = this.generatePentatonicStrings(tuningNotes, 3, 17);
        const notes = songNotes || this.demoNotes;

        let svg = '';

        // Add CSS for consistent styling with V3-style bent note indicators
        svg += `  <style>\n`;
        svg += `    .note { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }\n`;
        svg += `    .note-index { font-family: 'Segoe UI', system-ui, sans-serif; }\n`;
        svg += `    .resonance-band { opacity: 0.35; }\n`;
        svg += `    .bent-indicator { fill: #FF0000; font-size: 10px; font-weight: bold; }\n`;
        svg += `    .bent-line { stroke: #FF0000; stroke-width: 1.5; stroke-dasharray: 3,2; fill: none; }\n`;
        svg += `    .bent-elements { display: ${showBentNotes ? 'block' : 'none'}; }\n`;
        svg += `  </style>\n\n`;

        // Add string lines with V3 styling
        strings.forEach(string => {
            const isUsed = notes.some(n =>
                Math.abs(this.calculateYPosition(n.pitch, n.octave) - string.y) < 5
            );
            const strokeColor = isUsed ? '#000000' : '#999999';
            const opacity = isUsed ? '1' : '0.3';

            svg += `  <line x1="50" y1="${string.y}" x2="${width}" y2="${string.y}" `;
            svg += `stroke="${strokeColor}" stroke-width="2" opacity="${opacity}"/>\n`;

            // String labels positioned at x=20
            svg += `  <text x="20" y="${string.y + 4}" font-size="10" fill="${strokeColor}" `;
            svg += `opacity="${opacity}">${string.note}</text>\n`;
        });

        // Add notes with V3-style bent note detection
        notes.forEach((note, index) => {
            const x = 100 + (index * 120);
            const y = this.calculateYPosition(note.pitch, note.octave);
            const isBent = this.isBentNote(note.pitch, note.octave, strings);

            // Determine colors based on bent state and visibility
            let noteFill = '#333333'; // Default black
            let resonanceFill = '#666666'; // Darker gray for better visibility

            if (isBent && showBentNotes) {
                noteFill = '#FF0000'; // Red for bent notes when shown
                resonanceFill = '#FF0000'; // Red resonance band when shown
            }

            // Add V3-style triangle resonance band for each note
            const noteRadius = 12;
            const bandHeight = 12;
            const triangleLength = 160;

            const startX = x + noteRadius;  // Start at right edge of note head
            const topY = y - bandHeight / 2;    // Top point
            const bottomY = y + bandHeight / 2; // Bottom point
            const endX = startX + triangleLength; // End point

            svg += `  <polygon points="${startX},${topY} ${startX},${bottomY} ${endX},${y}" `;
            svg += `fill="${resonanceFill}" opacity="0.35" class="resonance-triangle" `;
            svg += `data-bent="${isBent}" data-note-y="${y}" data-band-height="${bandHeight}" data-note-x="${x}"/>\n`;

            // Bent note indicators (always generate for bent notes)
            if (isBent) {
                // Find the nearest lower-sounding string (higher Y position on screen)
                // This is the string the player would press to achieve the bent note
                let nearestLowerString = null;
                let minDistance = Infinity;

                strings.forEach(string => {
                    if (string.y < y) { // Higher on screen = lower sounding
                        const distance = y - string.y;
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestLowerString = string;
                        }
                    }
                });

                if (nearestLowerString) {
                    // Red dot indicator on the nearest lower string (where to press)
                    const dotX = x - 15; // Position before the note
                    const dotY = nearestLowerString.y; // Y position of the string to press
                    const dotDisplay = showBentNotes ? '' : 'style="display: none;"';
                    svg += `  <text x="${dotX}" y="${dotY + 4}" font-size="12" fill="#FF0000" `;
                    svg += `text-anchor="middle" class="bent-indicator" ${dotDisplay}>●</text>\n`;

                    // Smooth line from dot on lower string to center of bent note (2x thicker than strings)
                    const lineDisplay = showBentNotes ? '' : 'style="display: none;"';
                    svg += `  <line x1="${dotX}" y1="${dotY}" x2="${x}" y2="${y}" `;
                    svg += `stroke="#FF0000" stroke-width="4" stroke-linecap="round" `;
                    svg += `class="bent-line" ${lineDisplay}/>\n`;
                }
            }

            // Note circle with dynamic color based on bent state
            svg += `  <circle cx="${x}" cy="${y}" r="12" `;
            svg += `fill="${noteFill}" stroke="#000000" stroke-width="2" class="note" data-bent="${isBent}"/>\n`;

            // Note label inside circle
            svg += `  <text x="${x}" y="${y + 5}" text-anchor="middle" `;
            svg += `font-size="16" fill="white" font-weight="bold">${note.pitch}</text>\n`;

            // Note index above the note
            svg += `  <text x="${x}" y="${y - 18}" text-anchor="middle" `;
            svg += `font-size="8" fill="#333" class="note-index">#${index + 1}</text>\n`;
        });

        return svg;
    }

    /**
     * Count bent notes for a given tuning
     */
    countBentNotes(songNotes, tuningKey) {
        const tuningNotes = this.tuningSystems[tuningKey];
        if (!tuningNotes) return 0;

        const strings = this.generatePentatonicStrings(tuningNotes, 3, 17);
        const notes = songNotes || this.demoNotes;

        return notes.filter(note =>
            this.isBentNote(note.pitch, note.octave, strings)
        ).length;
    }

    /**
     * Update an SVG element with new tablature
     */
    updateSVG(svgElementId, tuningKey, songNotes = null, showBentNotes = true) {
        const svgElement = document.getElementById(svgElementId);
        if (!svgElement) {
            console.error('SVG element not found:', svgElementId);
            return;
        }

        // Get SVG dimensions
        const width = svgElement.getAttribute('width') || 2000;
        const height = svgElement.getAttribute('height') || 600;

        // Generate new content
        const svgContent = this.generateSVGContent(tuningKey, songNotes, width, height, showBentNotes);

        // Update the SVG
        svgElement.innerHTML = svgContent;

        return this.countBentNotes(songNotes, tuningKey);
    }

    /**
     * Toggle bent note indicators and colors
     */
    toggleBentNotes(svgElementId, visible) {
        const svgElement = document.getElementById(svgElementId);
        if (!svgElement) {
            console.error('SVG element not found:', svgElementId);
            return;
        }

        // Toggle visibility of bent indicators and lines
        const bentElements = svgElement.querySelectorAll('.bent-indicator, .bent-line');
        bentElements.forEach(element => {
            element.style.display = visible ? '' : 'none';
        });

        // Toggle note colors and triangle resonance colors for bent notes
        const notes = svgElement.querySelectorAll('.note[data-bent="true"]');
        const resonanceTriangles = svgElement.querySelectorAll('.resonance-triangle[data-bent="true"]');

        notes.forEach(note => {
            note.setAttribute('fill', visible ? '#FF0000' : '#333333');
        });

        resonanceTriangles.forEach(triangle => {
            triangle.setAttribute('fill', visible ? '#FF0000' : '#666666');
        });

        console.log(`Toggled ${bentElements.length} bent indicators and ${notes.length} note colors to ${visible ? 'red' : 'black'}`);
    }

    /**
     * Parse tuning key from dropdown value
     */
    parseTuningKey(dropdownValue) {
        // Extract the tuning key from values like "C-D-F-G-A (Northern)"
        const match = dropdownValue.match(/^([A-G#b-]+)/);
        return match ? match[1] : null;
    }
}

// Create global instance for use in HTML
window.tablatureGenerator = new ClientTablatureGenerator();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientTablatureGenerator;
}