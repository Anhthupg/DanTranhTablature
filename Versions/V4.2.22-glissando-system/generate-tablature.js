/**
 * V4 Tablature Generator
 * Uses V3's optimal 0.125px/cent spacing for C1-B8 range
 * Handles different tuning systems and bent note detection
 */

const fs = require('fs');
const path = require('path');

class TablatureGenerator {
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
    }

    /**
     * Calculate Y position based on note and octave (from V3)
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
        const noteWithOctave = pitch + octave;
        return !openStringNotes.some(s =>
            s.pitch === pitch && s.octave === octave
        );
    }

    /**
     * Generate SVG tablature for a tuning system (V3-style design)
     */
    generateTablatureSVG(tuningKey, songNotes = [], width = 2000, height = 600) {
        const tuningNotes = this.tuningSystems[tuningKey];
        const strings = this.generatePentatonicStrings(tuningNotes, 3, 17);

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;

        // Add CSS for consistent styling
        svg += `  <style>\n`;
        svg += `    .open-string-note { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }\n`;
        svg += `    .bent-note { filter: drop-shadow(0 2px 6px rgba(230,126,34,0.3)); }\n`;
        svg += `    .note-index { font-family: 'Segoe UI', system-ui, sans-serif; }\n`;
        svg += `    .resonance-band { opacity: 0.35; }\n`;
        svg += `  </style>\n\n`;

        // Add string lines with V3 styling
        strings.forEach(string => {
            const isUsed = songNotes.some(n =>
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

        // Add sample notes with V3-style bent note detection
        if (songNotes.length > 0) {
            songNotes.forEach((note, index) => {
                const x = 100 + (index * 120); // More spacing for visual clarity
                const y = this.calculateYPosition(note.pitch, note.octave);
                const isBent = this.isBentNote(note.pitch, note.octave, strings);

                // Add resonance band (triangle) for each note
                svg += `  <polygon points="${x},${y-6} ${x+160},${y-6} ${x+160},${y+6} ${x},${y+6}" `;
                svg += `fill="${isBent ? '#E67E22' : '#008080'}" class="resonance-band"/>\n`;

                // Bent note indicator (arrow) if needed
                if (isBent) {
                    svg += `  <path d="M${x-25} ${y} L${x-12} ${y-6} L${x-12} ${y+6} Z" `;
                    svg += `fill="#FF0000" opacity="0.8"/>\n`;
                    svg += `  <text x="${x-35}" y="${y+4}" font-size="8" fill="#FF0000" `;
                    svg += `font-weight="bold">BEND</text>\n`;
                }

                // Note circle with V3 colors
                const fillColor = isBent ? '#E67E22' : '#008080';
                const strokeColor = isBent ? '#D35400' : '#005959';

                svg += `  <circle cx="${x}" cy="${y}" r="12" `;
                svg += `fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" `;
                svg += `class="${isBent ? 'bent-note' : 'open-string-note'}"/>\n`;

                // Note label inside circle
                svg += `  <text x="${x}" y="${y + 5}" text-anchor="middle" `;
                svg += `font-size="16" fill="white" font-weight="bold">${note.pitch}</text>\n`;

                // Note index above the note
                svg += `  <text x="${x}" y="${y - 18}" text-anchor="middle" `;
                svg += `font-size="8" fill="#333" class="note-index">#${index + 1}</text>\n`;
            });
        }

        svg += `</svg>`;
        return svg;
    }

    /**
     * Count bent notes for a song in a given tuning
     */
    countBentNotes(songNotes, tuningKey) {
        const tuningNotes = this.tuningSystems[tuningKey];
        const strings = this.generatePentatonicStrings(tuningNotes, 3, 17);

        return songNotes.filter(note =>
            this.isBentNote(note.pitch, note.octave, strings)
        ).length;
    }

    /**
     * Generate demo tablature with sample notes
     */
    generateDemoTablature(tuningKey) {
        // Sample notes for demonstration
        const sampleNotes = [
            { pitch: 'D', octave: 4 },
            { pitch: 'G', octave: 4 },
            { pitch: 'A', octave: 4 },
            { pitch: 'F', octave: 4 }, // This might be bent depending on tuning
            { pitch: 'C', octave: 5 },
            { pitch: 'E', octave: 5 },
            { pitch: 'Bb', octave: 4 }, // This might be bent depending on tuning
            { pitch: 'G', octave: 5 }
        ];

        return {
            svg: this.generateTablatureSVG(tuningKey, sampleNotes),
            bentCount: this.countBentNotes(sampleNotes, tuningKey),
            tuning: tuningKey
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TablatureGenerator;
}

// Test generation if run directly
if (require.main === module) {
    const generator = new TablatureGenerator();

    console.log('Generating demo tablatures for all tuning systems...\n');

    Object.keys(generator.tuningSystems).forEach(tuning => {
        const result = generator.generateDemoTablature(tuning);
        console.log(`${tuning}: ${result.bentCount} bent notes`);

        // Save to file for testing
        const filename = `demo-${tuning.replace(/[^A-Za-z0-9]/g, '-')}.svg`;
        fs.writeFileSync(path.join(__dirname, 'test', filename), result.svg);
    });

    console.log('\nDemo SVGs generated in test/ directory');
}