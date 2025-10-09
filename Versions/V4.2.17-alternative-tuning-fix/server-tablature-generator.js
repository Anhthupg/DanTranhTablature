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
        // V4.1.3: Grace notes now use duration-based spacing like main notes

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
     * Generate SVG content for a song with proper grace note positioning
     * V4.1.3: Grace notes are positioned BEFORE their main note by backing up
     */
    generateSVG(songData, tuningKey, showBentNotes = true) {
        const { notes } = songData;
        const tuningNotes = this.tuningSystems[tuningKey] || this.tuningSystems['C-D-E-G-A'];
        const strings = this.generatePentatonicStrings(tuningNotes);

        // First pass: Position main notes only, collect grace notes
        let currentX = 150; // Start position after string labels
        const mainNotes = [];
        let graceBuffer = [];

        notes.forEach(note => {
            if (note.isGrace) {
                // Grace note belongs to the next main note
                graceBuffer.push(note);
            } else {
                // Main note
                const positioned = {
                    ...note,
                    x: currentX,
                    y: this.calculateYPosition(note.step, note.octave),
                    graceNotes: graceBuffer.length > 0 ? [...graceBuffer] : null
                };
                mainNotes.push(positioned);

                // Clear grace buffer
                graceBuffer = [];

                // Advance by full main note duration (with safety check)
                const noteDuration = note.duration || 1;
                if (isNaN(noteDuration)) {
                    console.error('[Tablature Generator] Note has NaN duration:', note);
                    currentX += this.DURATION_MULTIPLIER; // Default to quarter note spacing
                } else {
                    currentX += noteDuration * this.DURATION_MULTIPLIER;
                }
            }
        });

        // Second pass: Position grace notes BEFORE their main notes
        const allPositionedNotes = [];
        mainNotes.forEach(mainNote => {
            if (mainNote.graceNotes) {
                // Calculate total grace note spacing
                let totalGraceSpacing = 0;
                mainNote.graceNotes.forEach(grace => {
                    totalGraceSpacing += grace.duration * (this.DURATION_MULTIPLIER / 4);
                });

                // Position grace notes before main note
                let graceX = mainNote.x - totalGraceSpacing;
                mainNote.graceNotes.forEach(grace => {
                    const graceSpacing = grace.duration * (this.DURATION_MULTIPLIER / 4);

                    allPositionedNotes.push({
                        ...grace,
                        x: graceX,
                        y: this.calculateYPosition(grace.step, grace.octave),
                        graceType: this.classifyGraceNote(grace.duration),
                        isGrace: true
                    });

                    graceX += graceSpacing;
                });
            }

            // Add main note
            allPositionedNotes.push(mainNote);
        });

        // Calculate SVG width based on last main note
        const lastMainNote = mainNotes[mainNotes.length - 1];
        const lastDuration = (lastMainNote && lastMainNote.duration) || 1;
        const width = lastMainNote ? lastMainNote.x + lastDuration * this.DURATION_MULTIPLIER + 400 : 2000;
        const height = 800;

        if (isNaN(width)) {
            console.error('[Tablature Generator] Width is NaN! lastMainNote:', lastMainNote);
            console.error('[Tablature Generator] mainNotes count:', mainNotes.length);
        }

        // V4.2.7: Store positioned notes for phrase annotation system (accessible via lastGeneratedNotes property)
        this.lastGeneratedNotes = allPositionedNotes;
        this.lastGeneratedWidth = width;

        return this.createSVGMarkup(strings, allPositionedNotes, width, height, songData.metadata, showBentNotes);
    }

    /**
     * Get the positioned notes from the last generateSVG() call
     * V4.2.7: Added for phrase annotation system
     */
    getLastGeneratedNotes() {
        return this.lastGeneratedNotes || [];
    }

    getLastGeneratedWidth() {
        return this.lastGeneratedWidth || 2000;
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
            .note-text { font-family: Arial; font-weight: bold; fill: white; text-anchor: middle; dominant-baseline: middle; }
            .grace-note { fill: #999999; stroke: #000000; }
            .bent-note { fill: #FF0000; stroke: #CC0000; }
            .lyric-text { font-family: Arial; font-size: 12px; fill: #2c3e50; text-anchor: start; }

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

            // V4.0.8: Triangle resonance band - starts at note center with fixed radius offset
            const noteRadius = isGrace ? 6 : 12;
            const bandHeight = 12;
            const triangleLength = 160;

            // Start at note center (offset handled during zoom)
            const startX = x;
            const topY = y - bandHeight / 2;
            const bottomY = y + bandHeight / 2;
            const endX = startX + triangleLength;

            // V4.0.7: Group all bent elements with data-bent="true" for unified toggling
            const triangleClass = isBent ? 'resonance-triangle-bent' : 'resonance-triangle';
            const bentAttr = isBent ? ' data-bent="true"' : '';
            svg += `    <polygon points="${startX},${topY} ${startX},${bottomY} ${endX},${y}" class="${triangleClass}"${bentAttr} data-note-radius="${noteRadius}"/>\n`;

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

            // Note circle with audio playback data attributes (V4.0.12)
            // V4.1.3: Add grace type attribute
            const baseClass = isGrace ? 'grace-note' : (isBent ? 'bent-note' : 'note-circle');
            const circleClass = `note ${baseClass}`;  // Always include 'note' class for audio controller
            const pitch = `${note.step}${note.octave}`;  // e.g., "C4", "G5"
            const noteId = `note_${index}`;  // V4.2.5: Use underscore (matches relationships.json)
            const graceTypeAttr = note.graceType ? ` data-grace-type="${note.graceType}"` : '';
            svg += `    <circle id="${noteId}" cx="${x}" cy="${y}" r="${noteRadius}" class="${circleClass}"${bentAttr}${graceTypeAttr} data-pitch="${pitch}" data-duration="${note.duration || 1}"/>\n`;

            // V4.1.3: Add visual slash indicator for grace notes
            if (isGrace && note.graceType) {
                const slashLength = 20;
                const angle = -45 * Math.PI / 180; // -45 degrees
                const slashX1 = x + noteRadius * Math.cos(angle);
                const slashY1 = y - noteRadius * Math.sin(angle);
                const slashX2 = slashX1 + slashLength * Math.cos(angle);
                const slashY2 = slashY1 - slashLength * Math.sin(angle);
                svg += `    <line x1="${slashX1}" y1="${slashY1}" x2="${slashX2}" y2="${slashY2}" stroke="#000000" stroke-width="2" class="grace-slash"/>\n`;
            }

            // Note name with superscript octave (for all notes)
            const noteName = note.step + this.toSuperscript(note.octave);
            const fontSize = isGrace ? 11 : 22;  // Main: 22px (fills 24px diameter), Grace: 11px
            svg += `    <text x="${x}" y="${y}" class="note-text" font-size="${fontSize}" font-weight="bold" style="font-size: ${fontSize}px; font-weight: bold;">${noteName}</text>\n`;
        });

        return svg;
    }

    /**
     * Generate lyrics synchronized with notes
     */
    generateLyrics(notes) {
        return notes.map(note => {
            if (note.lyric && note.lyric.trim()) {
                const noteRadius = note.isGrace ? 6 : 12;
                const lyricX = note.x - noteRadius;  // Start at left edge of note
                return `    <text x="${lyricX}" y="${note.y + 40}" class="lyric-text">${this.escapeXML(note.lyric)}</text>`;
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
     * Convert number to Unicode superscript
     */
    toSuperscript(num) {
        const superscripts = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
        };
        return String(num).split('').map(digit => superscripts[digit] || digit).join('');
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

    /**
     * V4.1.3: Classify grace note type based on duration
     * @param {number} duration - Note duration (1 = quarter note, 0.5 = eighth, 0.25 = sixteenth)
     * @returns {string} - Grace note type: 'g16th', 'g8th', or 'g-other'
     */
    classifyGraceNote(duration) {
        if (duration <= 0.25) {
            return 'g16th';  // Grace 16th note or shorter
        } else if (duration <= 0.5) {
            return 'g8th';   // Grace 8th note
        } else {
            return 'g-other'; // Grace note with longer duration
        }
    }
}

module.exports = ServerTablatureGenerator;