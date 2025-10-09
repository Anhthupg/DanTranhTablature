/**
 * V4 Server-Side Tablature Generator with V3 Duration Spacing & V4.0.2 Features
 * - Duration-based spacing: note.duration * 85px (V3 standard)
 * - Triangle resonance bands (V4.0.1)
 * - Red bent note indicators with toggle (V4.0.2)
 * - Template-driven, modular architecture
 */

const fs = require('fs');
const path = require('path');

class ServerTablatureGenerator {
    constructor() {
        // V3 spacing standards
        this.PIXELS_PER_CENT = 0.125;
        this.BASE_Y = 100;
        this.DURATION_MULTIPLIER = 85;  // V3 standard: duration * 85px
        this.GRACE_NOTE_SPACING = 25;   // V3 standard: 25px for grace notes

        // Note to cents mapping
        this.noteToCents = {
            'C': 0, 'C#': 100, 'Db': 100, 'D': 200, 'D#': 300, 'Eb': 300,
            'E': 400, 'F': 500, 'F#': 600, 'Gb': 600, 'G': 700, 'G#': 800,
            'Ab': 800, 'A': 900, 'A#': 1000, 'Bb': 1000, 'B': 1100,
            'Cx': 200, 'C##': 200, 'Dx': 400, 'D##': 400,
            'Ex': 600, 'E##': 600, 'Fx': 700, 'F##': 700,
            'Gx': 900, 'G##': 900, 'Ax': 1100, 'A##': 1100,
            'Bx': 200, 'B##': 200, 'Cbb': 1000, 'Dbb': 0,
            'Ebb': 200, 'Fbb': 400, 'Gbb': 500, 'Abb': 700, 'Bbb': 900
        };

        // Tuning systems
        this.tuningSystems = {
            'C-D-E-G-A': ['C', 'D', 'E', 'G', 'A'],
            'C-D-F-G-A': ['C', 'D', 'F', 'G', 'A'],
            'C-D-E-G-Bb': ['C', 'D', 'E', 'G', 'Bb'],
            'C-Eb-F-G-Bb': ['C', 'Eb', 'F', 'G', 'Bb'],
            'D-E-G-A-B': ['D', 'E', 'G', 'A', 'B']
        };
    }

    /**
     * Generate SVG content for a song with proper duration-based spacing
     */
    generateSVG(songData, tuningKey, showBentNotes = true) {
        const { notes } = songData;
        const tuningNotes = this.tuningSystems[tuningKey] || this.tuningSystems['C-D-E-G-A'];
        const strings = this.generatePentatonicStrings(tuningNotes);

        // Calculate positions with duration-based spacing (V3 style)
        let currentX = 150; // Start position after string labels
        const positionedNotes = notes.map(note => {
            const positioned = {
                ...note,
                x: currentX,
                y: this.calculateYPosition(note.step, note.octave)
            };
            // V3 spacing: grace notes = 25px, regular notes = duration * 85px
            currentX += note.isGrace ? this.GRACE_NOTE_SPACING : (note.duration * this.DURATION_MULTIPLIER);
            return positioned;
        });

        // Calculate SVG width based on last note position PLUS its duration
        // This ensures the full musical duration is preserved
        const lastNote = positionedNotes[positionedNotes.length - 1];
        const lastNoteDuration = lastNote ? (lastNote.isGrace ? this.GRACE_NOTE_SPACING : (lastNote.duration * this.DURATION_MULTIPLIER)) : 0;
        const width = lastNote ? lastNote.x + lastNoteDuration + 400 : 2000; // Increased padding to 400px
        const height = 800;

        return this.createSVGMarkup(strings, positionedNotes, width, height, songData.metadata, showBentNotes);
    }

    /**
     * Create complete SVG markup with V4.0.2 features
     */
    createSVGMarkup(strings, notes, width, height, metadata, showBentNotes) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            /* V4.0.2 Approved Styles */
            .string-line { stroke: #333; stroke-width: 3; }
            .string-label { font-family: Arial; font-size: 14px; font-weight: bold; fill: #2c3e50; }
            .note-circle { fill: #333333; stroke: #000; stroke-width: 2; }
            .note-text { font-family: Arial; font-size: 10px; font-weight: bold; fill: white; text-anchor: middle; }
            .grace-note { fill: #FFD700; stroke: #CC9900; }
            .bent-note { fill: #FF0000; stroke: #CC0000; }
            .lyric-text { font-family: Arial; font-size: 12px; fill: #2c3e50; }

            /* V4.0.1 Triangle Resonance Bands */
            .resonance-triangle { fill: #666666; opacity: 0.35; }
            .resonance-triangle-bent { fill: #FF0000; opacity: 0.35; }

            /* V4.0.2 Bent Note Indicators (toggle-able) */
            .bent-indicator { fill: #FF0000; font-size: 12px; font-weight: bold; }
            .bent-line { stroke: #FF0000; stroke-width: 4; stroke-linecap: round; }
            .bent-elements { display: ${showBentNotes ? 'block' : 'none'}; }
        </style>
    </defs>

    <!-- String Lines -->
${this.generateStringLines(strings, width, notes)}

    <!-- String Labels -->
${this.generateStringLabels(strings)}

    <!-- Notes with Triangle Resonance Bands -->
${this.generateNotesWithTriangles(strings, notes, showBentNotes)}

    <!-- Lyrics -->
${this.generateLyrics(notes)}
</svg>`;
    }

    /**
     * Generate pentatonic strings (17 strings starting at E3)
     */
    generatePentatonicStrings(tuningNotes) {
        const strings = [];
        let noteIndex = 0;
        let octave = 3;

        for (let i = 0; i < 17; i++) {
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
     * Calculate Y position (V3 standard)
     */
    calculateYPosition(pitchClass, octave) {
        const cents = this.noteToCents[pitchClass] || 0;
        const octaveCents = (octave - 3) * 1200;
        const totalCents = cents + octaveCents;
        return this.BASE_Y + (totalCents * this.PIXELS_PER_CENT);
    }

    /**
     * Generate string lines (used/unused styling)
     */
    generateStringLines(strings, width, notes) {
        return strings.map(s => {
            const isUsed = notes.some(n => Math.abs(n.y - s.y) < 5);
            const color = isUsed ? '#000000' : '#999999';
            const opacity = isUsed ? '1' : '0.3';
            return `    <line x1="100" y1="${s.y}" x2="${width - 20}" y2="${s.y}" stroke="${color}" stroke-width="3" opacity="${opacity}"/>`;
        }).join('\n');
    }

    /**
     * Generate string labels
     */
    generateStringLabels(strings) {
        return strings.map(s =>
            `    <text x="50" y="${s.y + 5}" class="string-label">${s.note}</text>`
        ).join('\n');
    }

    /**
     * Generate notes with V4.0.1 triangle resonance bands and V4.0.2 bent indicators
     */
    generateNotesWithTriangles(strings, notes, showBentNotes) {
        let svg = '';

        notes.forEach((note, index) => {
            const { x, y, isGrace } = note;
            const isBent = this.isBentNote(note.step, note.octave, strings);

            // V4.0.1: Triangle resonance band
            const noteRadius = isGrace ? 6 : 12;
            const bandHeight = 12;
            const triangleLength = 160;

            const startX = x + noteRadius;
            const topY = y - bandHeight / 2;
            const bottomY = y + bandHeight / 2;
            const endX = startX + triangleLength;

            // V4.0.7: Group all bent elements with data-bent="true" for unified toggling
            const triangleClass = isBent ? 'resonance-triangle-bent' : 'resonance-triangle';
            const bentAttr = isBent ? ' data-bent="true"' : '';
            svg += `    <polygon points="${startX},${topY} ${startX},${bottomY} ${endX},${y}" class="${triangleClass}"${bentAttr}/>\n`;

            // V4.0.2: Bent note indicators (red dot + red line)
            if (isBent) {
                const nearestString = this.findNearestLowerString(strings, y);
                if (nearestString) {
                    const dotX = x - 15;
                    const dotY = nearestString.y;

                    svg += `    <text x="${dotX}" y="${dotY + 4}" class="bent-indicator bent-elements" data-bent="true" text-anchor="middle">●</text>\n`;
                    svg += `    <line x1="${dotX}" y1="${dotY}" x2="${x}" y2="${y}" class="bent-line bent-elements" data-bent="true"/>\n`;
                }
            }

            // Note circle
            const circleClass = isGrace ? 'grace-note' : (isBent ? 'bent-note' : 'note-circle');
            svg += `    <circle cx="${x}" cy="${y}" r="${noteRadius}" class="${circleClass}"${bentAttr}/>\n`;

            // String number (for regular notes only)
            if (!isGrace) {
                const stringNum = this.findStringNumber(strings, note.step, note.octave);
                if (stringNum) {
                    svg += `    <text x="${x}" y="${y + 4}" class="note-text">${stringNum}</text>\n`;
                }
            }
        });

        return svg;
    }

    /**
     * Generate lyrics synchronized with notes
     */
    generateLyrics(notes) {
        return notes.map(note => {
            if (note.lyric && note.lyric.trim()) {
                return `    <text x="${note.x}" y="${note.y + 40}" class="lyric-text">${this.escapeXML(note.lyric)}</text>`;
            }
            return '';
        }).filter(l => l).join('\n');
    }

    /**
     * Check if note is bent (not on open string)
     */
    isBentNote(pitchClass, octave, strings) {
        return !strings.some(s => s.pitch === pitchClass && s.octave === octave);
    }

    /**
     * Find nearest lower-sounding string (for bent note indicator)
     */
    findNearestLowerString(strings, noteY) {
        let nearest = null;
        let minDistance = Infinity;

        strings.forEach(string => {
            if (string.y < noteY) {
                const distance = noteY - string.y;
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = string;
                }
            }
        });

        return nearest;
    }

    /**
     * Find string number for a pitch
     */
    findStringNumber(strings, pitchClass, octave) {
        const string = strings.find(s => s.pitch === pitchClass && s.octave === octave);
        return string ? string.string : '';
    }

    /**
     * Escape XML special characters
     */
    escapeXML(str) {
        return str.replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }
}

module.exports = ServerTablatureGenerator;