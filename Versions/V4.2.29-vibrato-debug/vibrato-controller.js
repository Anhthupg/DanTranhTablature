/**
 * V4 Vibrato Controller - Pitch Class Based Vibrato System
 *
 * Vietnamese Music Rule: Vibrato applies to entire pitch classes (all octaves)
 * Example: Enabling F4 vibrato also enables F5, F6, etc.
 *
 * Features:
 * - Radio buttons for each used pitch class
 * - Vibrato duration: From note center until next note on same string OR half note duration
 * - Only affects used strings and used notes
 * - Automatic pitch class grouping (F4, F5, F6 all affected by "F" button)
 */

class VibratoController {
    constructor() {
        this.enabled = {}; // { 'C': true, 'D': false, ... }
        this.vibratoGenerator = null; // Reference to VibratoSineWaveGenerator

        // Vibrato parameters
        this.AMPLITUDE = 10; // Wave depth in pixels
        this.FREQUENCY = 3;  // Number of cycles
        this.HALF_NOTE_DURATION_PX = 85 * 0.5; // Half note in pixels (duration * 85)
    }

    /**
     * Initialize vibrato system for a specific SVG
     * @param {string} svgId - ID of SVG element
     * @param {string} containerId - ID of container for radio buttons
     */
    initialize(svgId, containerId) {
        // Store reference to SVG ID immediately
        this.currentSvgId = svgId;

        const svg = document.getElementById(svgId);
        if (!svg) {
            console.warn(`SVG #${svgId} not found during initialization - will retry when toggled`);
            // Create empty UI that will work when SVG appears
            this.createVibratoUI(containerId, []);
            return;
        }

        // Extract used pitch classes from SVG notes
        const usedPitchClasses = this.extractUsedPitchClasses(svg);

        // Create radio button UI
        this.createVibratoUI(containerId, usedPitchClasses);

        // Initialize vibrato generator
        if (!this.vibratoGenerator) {
            this.vibratoGenerator = new VibratoSineWaveGenerator();
        }

        console.log(`Vibrato initialized for ${usedPitchClasses.length} pitch classes:`, usedPitchClasses);
    }

    /**
     * Extract pitch classes from SVG notes
     * Returns unique pitch classes (C, D, E, etc.) from all notes
     */
    extractUsedPitchClasses(svg) {
        const notes = svg.querySelectorAll('circle[data-pitch]');
        console.log('Total circles with data-pitch:', notes.length);

        const pitchClasses = new Set();

        notes.forEach(note => {
            const pitch = note.getAttribute('data-pitch'); // e.g., "F4", "G5"
            const stringNum = note.getAttribute('data-string');
            console.log('Note:', pitch, 'String:', stringNum);
            if (pitch) {
                const pitchClass = pitch.replace(/[0-9]/g, ''); // "F4" → "F"
                pitchClasses.add(pitchClass);
            }
        });

        const result = Array.from(pitchClasses).sort();
        console.log('Extracted pitch classes:', result);
        return result;
    }

    /**
     * Create radio button UI for vibrato control
     */
    createVibratoUI(containerId, pitchClasses) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container #${containerId} not found`);
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Create title
        const title = document.createElement('div');
        title.textContent = 'Vibrato by Pitch Class:';
        title.style.marginBottom = '8px';
        title.style.fontWeight = 'bold';
        container.appendChild(title);

        // Create radio buttons for each pitch class
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '12px';
        buttonContainer.style.flexWrap = 'wrap';

        pitchClasses.forEach(pitchClass => {
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.cursor = 'pointer';

            const radio = document.createElement('input');
            radio.type = 'checkbox'; // Use checkbox for independent toggles
            radio.id = `vibrato-${pitchClass}`;
            radio.name = `vibrato-${pitchClass}`;
            radio.value = pitchClass;

            radio.addEventListener('change', (e) => {
                this.toggleVibrato(pitchClass, e.target.checked);
            });

            const span = document.createElement('span');
            span.textContent = pitchClass;
            span.style.marginLeft = '4px';

            label.appendChild(radio);
            label.appendChild(span);
            buttonContainer.appendChild(label);

            // Initialize state
            this.enabled[pitchClass] = false;
        });

        container.appendChild(buttonContainer);
    }

    /**
     * Toggle vibrato for a pitch class
     * @param {string} pitchClass - Pitch class (C, D, E, etc.)
     * @param {boolean} enable - Enable or disable
     */
    toggleVibrato(pitchClass, enable) {
        this.enabled[pitchClass] = enable;
        console.log(`Vibrato ${enable ? 'enabled' : 'disabled'} for pitch class ${pitchClass}`);

        // Redraw all vibratos
        this.updateVibratos();
    }

    /**
     * Update all vibratos based on current state
     */
    updateVibratos() {
        const svg = document.getElementById(this.currentSvgId);
        if (!svg) {
            console.warn('SVG not found:', this.currentSvgId);
            return;
        }

        // Initialize vibrato generator if needed
        if (!this.vibratoGenerator) {
            this.vibratoGenerator = window.vibratoGenerator || new VibratoSineWaveGenerator();
        }

        // Clear existing vibratos
        this.vibratoGenerator.clearVibratos(svg);

        // Find all enabled pitch classes
        const enabledClasses = Object.keys(this.enabled).filter(pc => this.enabled[pc]);
        console.log('Enabled pitch classes:', enabledClasses);
        if (enabledClasses.length === 0) return;

        // Group notes by string
        const notesByString = this.groupNotesByString(svg, enabledClasses);
        console.log('Notes grouped by string:', notesByString);

        // Draw vibratos for each string
        Object.entries(notesByString).forEach(([stringNum, stringNotes]) => {
            console.log(`String ${stringNum} has ${stringNotes.length} enabled notes`);

            // Sort by x position
            stringNotes.sort((a, b) => a.x - b.x);

            // Draw vibrato for each note
            stringNotes.forEach((note, index) => {
                const nextNote = stringNotes[index + 1];

                // Calculate vibrato end position
                const startX = note.x + note.radius; // Start at note edge (center + radius)
                const endX = nextNote
                    ? nextNote.x - nextNote.radius // End at next note edge
                    : note.x + this.HALF_NOTE_DURATION_PX; // Or half note duration

                console.log(`Note ${note.pitch} at x=${note.x}, y=${note.y}, startX=${startX}, endX=${endX}, length=${endX-startX}px`);

                // Only draw if there's space
                if (endX > startX) {
                    const vibratoPath = this.vibratoGenerator.createVibratoPath(
                        startX,
                        note.y,
                        endX,
                        note.y,
                        {
                            amplitude: this.AMPLITUDE,
                            frequency: this.FREQUENCY
                        }
                    );

                    console.log('Created vibrato path:', vibratoPath);
                    console.log('Path d attribute:', vibratoPath.getAttribute('d'));

                    // Insert vibrato before notes (so it appears behind)
                    const firstNote = svg.querySelector('circle');
                    svg.insertBefore(vibratoPath, firstNote);
                    console.log('Vibrato path inserted into SVG');
                }
            });
        });
    }

    /**
     * Group notes by string, filtering by enabled pitch classes
     * @param {SVGElement} svg - SVG element
     * @param {string[]} enabledClasses - Enabled pitch classes (C, D, E, etc.)
     * @returns {Object} Notes grouped by string number
     */
    groupNotesByString(svg, enabledClasses) {
        const notesByString = {};
        const noteElements = svg.querySelectorAll('circle[data-pitch][data-string]');
        console.log('Found circles with data-pitch and data-string:', noteElements.length);

        noteElements.forEach(noteEl => {
            const pitch = noteEl.getAttribute('data-pitch'); // "F4"
            const pitchClass = pitch.replace(/[0-9]/g, ''); // "F"

            // Skip if pitch class not enabled
            if (!enabledClasses.includes(pitchClass)) return;

            const stringNum = noteEl.getAttribute('data-string');
            const x = parseFloat(noteEl.getAttribute('cx'));
            const y = parseFloat(noteEl.getAttribute('cy'));
            const isGrace = noteEl.classList.contains('grace-note');
            const radius = isGrace ? 6 : 12;

            if (!notesByString[stringNum]) {
                notesByString[stringNum] = [];
            }

            notesByString[stringNum].push({
                x,
                y,
                radius,
                pitch,
                pitchClass,
                element: noteEl
            });
        });

        return notesByString;
    }

    /**
     * Clear all vibratos
     */
    clearAll() {
        const svg = document.getElementById(this.currentSvgId);
        if (!svg) return;

        this.vibratoGenerator.clearVibratos(svg);

        // Disable all pitch classes
        Object.keys(this.enabled).forEach(pc => {
            this.enabled[pc] = false;
            const checkbox = document.getElementById(`vibrato-${pc}`);
            if (checkbox) checkbox.checked = false;
        });
    }

    /**
     * Enable vibrato for specific pitch classes
     * @param {string[]} pitchClasses - Array of pitch classes to enable
     */
    enablePitchClasses(pitchClasses) {
        pitchClasses.forEach(pc => {
            this.enabled[pc] = true;
            const checkbox = document.getElementById(`vibrato-${pc}`);
            if (checkbox) checkbox.checked = true;
        });

        this.updateVibratos();
    }
}

// Export for use in templates
if (typeof window !== 'undefined') {
    window.VibratoController = VibratoController;
}
