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

        // Vibrato parameters (user-adjustable via sliders)
        // Musical units (not pixels - will be converted based on zoom)
        this.amplitudeCents = 100; // Pitch variation in cents, peak-to-trough (40-400 range)
                                    // Example: 100 cents = semitone = ±50 cents from center
        this.cyclesPerQuarter = 3; // Cycles per quarter note (1-10 range)

        this.STROKE_WIDTH = 3; // Match string line weight
        this.CENTS_TO_PX_BASE = 0.3; // Base: 0.3px per cent (from pentatonic spacing)
        this.QUARTER_NOTE_PX_BASE = 85; // Base: quarter note = 85px
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

        // Register callback to redraw vibratos when zoom changes
        if (window.zoomController) {
            // Determine section name from svgId (e.g., 'optimalSvg' → 'optimal')
            const section = svgId.replace('Svg', '').replace('svg', '');
            window.zoomController.onZoomChange(section, () => {
                console.log(`[Vibrato] Zoom changed for ${section}, redrawing vibratos...`);
                this.updateVibratos();
            });
            console.log(`Vibrato registered for zoom changes on section: ${section}`);
        }

        console.log(`Vibrato initialized for ${usedPitchClasses.length} pitch classes:`, usedPitchClasses);
    }

    /**
     * Ensure zoom callback is registered (defensive - handles SVG reload cases)
     */
    ensureZoomCallback() {
        if (!window.zoomController) return;

        // Determine section name from svgId (e.g., 'optimalSvg' → 'optimal')
        const section = this.currentSvgId.replace('Svg', '').replace('svg', '');

        // Check if callback already registered
        const callbacks = window.zoomController.onZoomChangeCallbacks[section];
        if (callbacks && callbacks.length > 0) {
            // Already registered
            return;
        }

        // Register callback
        window.zoomController.onZoomChange(section, () => {
            console.log(`[Vibrato] Zoom changed for ${section}, redrawing vibratos...`);
            this.updateVibratos();
        });
        console.log(`[Vibrato] Registered zoom callback for ${section}`);
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

        // Single-line layout: title, checkboxes, sliders all inline
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '12px';

        // Create title
        const title = document.createElement('span');
        title.textContent = 'Vibrato Rung on:';
        title.style.fontWeight = 'bold';
        wrapper.appendChild(title);

        // Create checkboxes inline
        pitchClasses.forEach(pitchClass => {
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.cursor = 'pointer';
            label.style.gap = '2px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `vibrato-${pitchClass}`;
            checkbox.name = `vibrato-${pitchClass}`;
            checkbox.value = pitchClass;

            checkbox.addEventListener('change', (e) => {
                this.toggleVibrato(pitchClass, e.target.checked);
            });

            const span = document.createElement('span');
            span.textContent = pitchClass;

            label.appendChild(checkbox);
            label.appendChild(span);
            wrapper.appendChild(label);

            // Initialize state
            this.enabled[pitchClass] = false;
        });

        // Amplitude slider (cents) - displays peak-to-trough range
        const ampLabel = document.createElement('label');
        ampLabel.style.display = 'flex';
        ampLabel.style.alignItems = 'center';
        ampLabel.style.gap = '4px';
        ampLabel.style.marginLeft = '10px';
        ampLabel.innerHTML = '<span style="font-size: 11px;">Depth:</span>';

        const ampSlider = document.createElement('input');
        ampSlider.type = 'range';
        ampSlider.min = '40';
        ampSlider.max = '400';
        ampSlider.step = '10';
        ampSlider.value = this.amplitudeCents;
        ampSlider.style.width = '80px';

        const ampValue = document.createElement('span');
        // Show both peak-to-trough and ± from center for clarity
        ampValue.textContent = this.amplitudeCents + '¢ (±' + (this.amplitudeCents/2) + '¢)';
        ampValue.style.fontSize = '11px';
        ampValue.style.minWidth = '80px';

        ampSlider.addEventListener('input', (e) => {
            this.amplitudeCents = parseFloat(e.target.value);
            ampValue.textContent = this.amplitudeCents + '¢ (±' + (this.amplitudeCents/2) + '¢)';
            this.updateVibratos();
        });

        ampLabel.appendChild(ampSlider);
        ampLabel.appendChild(ampValue);
        wrapper.appendChild(ampLabel);

        // Frequency slider (cycles per quarter note)
        const freqLabel = document.createElement('label');
        freqLabel.style.display = 'flex';
        freqLabel.style.alignItems = 'center';
        freqLabel.style.gap = '4px';
        freqLabel.innerHTML = '<span style="font-size: 11px;">Speed:</span>';

        const freqSlider = document.createElement('input');
        freqSlider.type = 'range';
        freqSlider.min = '1';
        freqSlider.max = '10';
        freqSlider.step = '0.5';
        freqSlider.value = this.cyclesPerQuarter;
        freqSlider.style.width = '80px';

        const freqValue = document.createElement('span');
        freqValue.textContent = this.cyclesPerQuarter + 'x';
        freqValue.style.fontSize = '11px';
        freqValue.style.minWidth = '30px';

        freqSlider.addEventListener('input', (e) => {
            this.cyclesPerQuarter = parseFloat(e.target.value);
            freqValue.textContent = this.cyclesPerQuarter + 'x';
            this.updateVibratos();
        });

        freqLabel.appendChild(freqSlider);
        freqLabel.appendChild(freqValue);
        wrapper.appendChild(freqLabel);

        container.appendChild(wrapper);
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

        // Ensure zoom callback is registered (defensive - handles SVG reload)
        this.ensureZoomCallback();

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
                    // Get current zoom levels
                    const zoomX = window.zoomController ? window.zoomController.getZoomX('optimal') : 1.0;
                    const zoomY = window.zoomController ? window.zoomController.getZoomY('optimal') : 1.0;

                    // Calculate amplitude in pixels (zoom-aware)
                    // cents (peak-to-trough) → base pixels → apply Y-zoom
                    // Example: 100¢ × 0.3px/¢ × 1.0 = 30px peak-to-trough (±15px from center)
                    const amplitudePx = this.amplitudeCents * this.CENTS_TO_PX_BASE * zoomY;

                    // Calculate frequency (zoom-aware)
                    // Length in current pixels (already scaled by X-zoom)
                    const lengthPx = endX - startX;
                    // Convert to quarter notes (unscaled)
                    const quarterNotes = lengthPx / (this.QUARTER_NOTE_PX_BASE * zoomX);
                    // Calculate total cycles
                    const cycles = quarterNotes * this.cyclesPerQuarter;

                    console.log(`Zoom X=${zoomX}, Y=${zoomY}, amp=${amplitudePx}px peak-to-trough (${this.amplitudeCents}¢ = ±${this.amplitudeCents/2}¢), cycles=${cycles.toFixed(2)} (${this.cyclesPerQuarter}/qtr × ${quarterNotes.toFixed(2)}qtrs)`);

                    const vibratoPath = this.vibratoGenerator.createVibratoPath(
                        startX,
                        note.y,
                        endX,
                        note.y,
                        {
                            amplitude: amplitudePx,
                            frequency: cycles,
                            strokeWidth: this.STROKE_WIDTH
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
