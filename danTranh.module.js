/**
 * Dan Tranh Dynamic String System Module
 * Version 3.0
 *
 * A complete solution for rendering Dan Tranh tablature with:
 * - Dynamic string generation (1-30+ strings)
 * - Proportional spacing based on musical intervals
 * - Chromatic note support with bending visualization
 * - Multiple tuning systems (pentatonic, hexachord, heptachord, chromatic)
 */

export class DanTranhTablature {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            baseSpacing: options.baseSpacing || 20, // pixels per semitone
            minSpacing: options.minSpacing || 40,   // minimum string spacing
            maxSpacing: options.maxSpacing || 120,  // maximum string spacing
            showIntervals: options.showIntervals !== false,
            showBending: options.showBending !== false,
            displayMode: options.displayMode || 'played', // 'played' or 'all'
            ...options
        };

        this.currentSong = null;
        this.currentStrings = [];
        this.stringPositions = [];

        this.initializeContainer();
    }

    // Note frequency mappings
    static NOTE_FREQUENCIES = {
        'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78,
        'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83,
        'Ab2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,
        'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56,
        'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65,
        'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,
        'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13,
        'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30,
        'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25,
        'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61,
        'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77,
        'C6': 1046.50, 'C#6': 1108.73, 'Db6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51,
        'Eb6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'Gb6': 1479.98, 'G6': 1567.98
    };

    initializeContainer() {
        this.container.innerHTML = `
            <div class="dan-tranh-tablature">
                <svg class="tablature-svg" width="1400" height="600"></svg>
            </div>
        `;
        this.svg = this.container.querySelector('.tablature-svg');
    }

    /**
     * Load a song and render the tablature
     * @param {Object} song - Song object with title, notes, and openStrings
     */
    loadSong(song) {
        this.currentSong = song;
        this.analyzeAndGenerateStrings();
        this.render();
    }

    /**
     * Convert note name to MIDI number
     */
    noteToMidi(note) {
        if (!note || note === 'Unknown') return 0;

        const noteMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        const parts = note.match(/([A-G])([#b]?)(\d+)/);
        if (!parts) return 0;

        let midi = noteMap[parts[1]];
        if (parts[2] === '#') midi++;
        if (parts[2] === 'b') midi--;
        midi += (parseInt(parts[3]) + 1) * 12;

        return midi;
    }

    /**
     * Parse note with microtone support (e.g., "C4+15cents")
     */
    parseNoteWithMicrotone(noteStr) {
        if (!noteStr || noteStr === 'Unknown') return null;

        // Handle microtone notation
        const microtoneMatch = noteStr.match(/^([A-G][#b]?\d)([-+]\d+)cents?$/);
        if (microtoneMatch) {
            const baseNote = microtoneMatch[1];
            const microtone = parseInt(microtoneMatch[2]);
            const frequency = DanTranhTablature.NOTE_FREQUENCIES[baseNote];

            if (!frequency) return null;

            // Apply microtone adjustment
            const factor = Math.pow(2, microtone / 1200);
            return {
                note: noteStr,
                midi: this.noteToMidi(baseNote) + (microtone / 100),
                frequency: frequency * factor,
                baseNote: baseNote,
                microtone: microtone
            };
        }

        // Standard note
        const frequency = DanTranhTablature.NOTE_FREQUENCIES[noteStr];
        if (!frequency) return null;

        return {
            note: noteStr,
            midi: this.noteToMidi(noteStr),
            frequency: frequency,
            baseNote: noteStr,
            microtone: 0
        };
    }

    /**
     * Analyze song and generate dynamic string configuration
     */
    analyzeAndGenerateStrings() {
        if (!this.currentSong) return;

        if (this.options.displayMode === 'played') {
            // Only show strings that are actually used
            const usedNotes = new Set();
            this.currentSong.notes.forEach(note => {
                if (!note.bent) {
                    usedNotes.add(note.pitch);
                }
            });
            this.currentStrings = Array.from(usedNotes).sort((a, b) =>
                this.noteToMidi(a) - this.noteToMidi(b)
            );
        } else {
            // Show all available strings
            this.currentStrings = this.currentSong.openStrings || [];
        }

        // Calculate proportional positions
        this.stringPositions = this.calculateStringPositions();
    }

    /**
     * Calculate proportional string positions based on intervals
     */
    calculateStringPositions() {
        if (this.currentStrings.length === 0) return [];

        const positions = [];
        let currentY = 80;

        positions.push({
            note: this.currentStrings[0],
            y: currentY,
            stringNum: 1
        });

        for (let i = 1; i < this.currentStrings.length; i++) {
            const prevMidi = this.noteToMidi(this.currentStrings[i - 1]);
            const currMidi = this.noteToMidi(this.currentStrings[i]);
            const semitones = currMidi - prevMidi;

            // Calculate spacing based on interval
            let spacing = semitones * this.options.baseSpacing;

            // Apply constraints
            spacing = Math.max(
                this.options.minSpacing,
                Math.min(this.options.maxSpacing, spacing)
            );

            currentY += spacing;
            positions.push({
                note: this.currentStrings[i],
                y: currentY,
                stringNum: i + 1,
                intervalFromPrevious: semitones
            });
        }

        return positions;
    }

    /**
     * Get interval name from semitones
     */
    getIntervalName(semitones) {
        const names = {
            0: 'P1', 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4',
            6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7',
            11: 'M7', 12: 'P8', 13: 'm9', 14: 'M9', 15: 'm10',
            16: 'M10', 17: 'P11', 18: 'A11', 19: 'P12'
        };
        return names[semitones] || `+${semitones}st`;
    }

    /**
     * Find position for a note (with bending if needed)
     */
    findNotePosition(pitch) {
        // Check if it's on an open string
        const stringIndex = this.currentStrings.indexOf(pitch);
        if (stringIndex >= 0) {
            return {
                y: this.stringPositions[stringIndex].y,
                stringNum: stringIndex + 1,
                requiresBending: false
            };
        }

        // Note requires bending - find surrounding strings
        const noteMidi = this.noteToMidi(pitch);
        let lowerString = null;
        let upperString = null;

        for (let i = 0; i < this.stringPositions.length; i++) {
            const stringMidi = this.noteToMidi(this.stringPositions[i].note);

            if (stringMidi < noteMidi) {
                lowerString = { ...this.stringPositions[i], midi: stringMidi };
            }
            if (stringMidi > noteMidi && !upperString) {
                upperString = { ...this.stringPositions[i], midi: stringMidi };
            }
        }

        if (!lowerString) {
            // Note is below all strings
            return null;
        }

        let y;
        if (upperString) {
            // Interpolate between two strings
            const ratio = (noteMidi - lowerString.midi) / (upperString.midi - lowerString.midi);
            y = lowerString.y + (upperString.y - lowerString.y) * ratio;
        } else {
            // Note is above all strings
            const semitones = noteMidi - lowerString.midi;
            y = lowerString.y + semitones * this.options.baseSpacing;
        }

        return {
            y: y,
            baseY: lowerString.y,
            baseStringNum: lowerString.stringNum,
            requiresBending: true,
            bendingSemitones: noteMidi - lowerString.midi
        };
    }

    /**
     * Render the complete tablature
     */
    render() {
        if (!this.currentSong || this.stringPositions.length === 0) return;

        // Clear SVG
        this.svg.innerHTML = '';

        // Calculate dimensions
        const maxTime = Math.max(...this.currentSong.notes.map(n => n.time + n.duration));
        const width = Math.max(1400, maxTime * 30 + 200);
        const maxY = this.stringPositions[this.stringPositions.length - 1].y;
        const height = Math.max(300, maxY + 150);

        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Add styles
        this.addStyles();

        // Draw strings
        this.drawStrings(width);

        // Draw notes
        this.drawNotes();
    }

    /**
     * Add SVG styles
     */
    addStyles() {
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = `
            .string-line { stroke: #333; stroke-width: 1; }
            .string-label { font-size: 14px; font-weight: 600; fill: #666; }
            .note-circle { cursor: pointer; transition: all 0.2s; }
            .note-circle:hover { filter: brightness(1.2); stroke-width: 3; }
            .bending-line { stroke: #ff6b6b; stroke-width: 2; fill: none; stroke-dasharray: 5,3; opacity: 0.7; }
            .bend-text { font-size: 10px; fill: #ff6b6b; }
            .duration-bar { opacity: 0.3; }
        `;
        this.svg.appendChild(style);
    }

    /**
     * Draw string lines and labels
     */
    drawStrings(width) {
        this.stringPositions.forEach((pos, index) => {
            // String line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '100');
            line.setAttribute('x2', width - 50);
            line.setAttribute('y1', pos.y);
            line.setAttribute('y2', pos.y);
            line.setAttribute('class', 'string-line');
            line.setAttribute('data-string-note', pos.note);
            this.svg.appendChild(line);

            // String label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', '20');
            label.setAttribute('y', pos.y + 5);
            label.setAttribute('class', 'string-label');

            let text = `${pos.stringNum}: ${pos.note}`;
            if (this.options.showIntervals && pos.intervalFromPrevious) {
                text += ` (+${pos.intervalFromPrevious} ${this.getIntervalName(pos.intervalFromPrevious)})`;
            }
            label.textContent = text;
            this.svg.appendChild(label);
        });
    }

    /**
     * Draw all notes with bending if needed
     */
    drawNotes() {
        this.currentSong.notes.forEach((note, noteIndex) => {
            const position = this.findNotePosition(note.pitch);
            if (!position) return;

            const x = 120 + note.time * 30;

            // Draw bending line if needed
            if (position.requiresBending && this.options.showBending) {
                this.drawBendingCurve(x, position);
            }

            // Draw note circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', position.y);
            circle.setAttribute('r', note.grace ? '6' : '10');
            circle.setAttribute('fill', note.grace ? '#FFD700' : '#667eea');
            circle.setAttribute('stroke', position.requiresBending ? '#ff6b6b' : '#333');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('class', 'note-circle');
            circle.setAttribute('data-note-index', noteIndex);
            circle.setAttribute('data-pitch', note.pitch);
            circle.setAttribute('data-time', note.time);

            if (position.requiresBending) {
                circle.setAttribute('data-bent', 'true');
                circle.setAttribute('data-bend-semitones', position.bendingSemitones);
            }

            this.svg.appendChild(circle);

            // Draw duration bar
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', position.y - 2);
            rect.setAttribute('width', note.duration * 25);
            rect.setAttribute('height', '4');
            rect.setAttribute('fill', '#667eea');
            rect.setAttribute('class', 'duration-bar');
            this.svg.appendChild(rect);

            // Add click handler
            circle.addEventListener('click', () => this.onNoteClick(note, noteIndex));
        });
    }

    /**
     * Draw bending curve and text
     */
    drawBendingCurve(x, position) {
        // Bending curve
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const controlX = x - 20;
        const controlY = (position.baseY + position.y) / 2;
        const d = `M ${x - 5} ${position.baseY} Q ${controlX} ${controlY} ${x} ${position.y}`;
        path.setAttribute('d', d);
        path.setAttribute('class', 'bending-line');
        this.svg.appendChild(path);

        // Bend amount text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x - 25);
        text.setAttribute('y', (position.baseY + position.y) / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'bend-text');
        text.textContent = `+${position.bendingSemitones}`;
        this.svg.appendChild(text);
    }

    /**
     * Handle note click events
     */
    onNoteClick(note, index) {
        if (this.options.onNoteClick) {
            this.options.onNoteClick(note, index);
        }
        console.log('Note clicked:', note);
    }

    /**
     * Update display options
     */
    setOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        if (this.currentSong) {
            this.analyzeAndGenerateStrings();
            this.render();
        }
    }

    /**
     * Export SVG as string
     */
    exportSVG() {
        return new XMLSerializer().serializeToString(this.svg);
    }

    /**
     * Get current string configuration
     */
    getStringConfiguration() {
        return {
            strings: this.currentStrings,
            positions: this.stringPositions,
            count: this.currentStrings.length
        };
    }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DanTranhTablature;
}