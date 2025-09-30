/**
 * AudioPlaybackController - V4.0.12
 *
 * Centralized audio playback system for Dan Tranh tablature
 * Features:
 * - Web Audio API-based Dan Tranh sound synthesis
 * - Rhythm-accurate playback using note durations
 * - Visual feedback with red glow and animation
 * - Single click: Play individual note
 * - Double click: Start playback from note onward
 * - Linked playback across both tablatures (same music)
 */

class AudioPlaybackController {
    constructor() {
        // Audio context
        this.audioContext = null;
        this.masterGain = null;

        // Playback state
        this.isPlaying = false;
        this.currentNoteIndex = 0;
        this.playbackTimeouts = [];
        this.glowRemovalTimeouts = [];  // V4.0.13: Track glow removal timeouts separately
        this.currentlyPlayingNote = null;

        // Note data (extracted from SVG)
        this.notes = [];

        // SVG references (both tablatures)
        this.svgElements = {
            optimal: null,
            alt1: null
        };

        // Button references
        this.playButton = null;
        this.stopButton = null;

        // Default tempo (can be overridden)
        this.tempo = 120; // BPM
        this.quarterNoteDuration = 60000 / this.tempo; // ms per quarter note
    }

    /**
     * Initialize audio context
     * V4.0.13: Buttons now use onclick handlers directly (multiple buttons, no IDs needed)
     */
    initialize() {
        console.log('AudioPlaybackController: Initializing...');

        // Initialize Web Audio API
        this.initializeAudioContext();

        // V4.0.13: No button references needed (onclick handlers in HTML)
        // Buttons call window.audioController.play() / .stop() directly

        console.log('AudioPlaybackController: Initialized');
    }

    /**
     * Initialize Web Audio API context
     */
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3; // Master volume

            console.log('AudioPlaybackController: Audio context created');
        } catch (error) {
            console.error('AudioPlaybackController: Failed to create audio context', error);
        }
    }

    /**
     * Set SVG references for both tablatures
     */
    setSVGReferences(optimalSvg, alt1Svg) {
        this.svgElements.optimal = optimalSvg;
        this.svgElements.alt1 = alt1Svg;

        // Extract note data from optimal tablature
        this.extractNotesFromSVG(optimalSvg);

        // Setup click handlers on notes
        this.setupNoteClickHandlers();

        console.log(`AudioPlaybackController: Extracted ${this.notes.length} notes`);
    }

    /**
     * Extract note data from SVG
     */
    extractNotesFromSVG(svg) {
        if (!svg) return;

        this.notes = [];

        // Find all note circles (class="note" or class="grace-note")
        const noteCircles = svg.querySelectorAll('circle.note, circle.grace-note');

        noteCircles.forEach((circle, index) => {
            const pitch = circle.getAttribute('data-pitch') || 'C4';
            const duration = parseFloat(circle.getAttribute('data-duration')) || 1;
            const isGrace = circle.classList.contains('grace-note');
            const noteId = circle.getAttribute('id') || `note-${index}`;

            this.notes.push({
                id: noteId,
                pitch: pitch,
                duration: duration,
                isGrace: isGrace,
                element: circle
            });
        });
    }

    /**
     * Setup click and double-click handlers on notes
     */
    setupNoteClickHandlers() {
        let clickTimer = null;
        const clickDelay = 300; // ms to distinguish single vs double click

        this.notes.forEach((note, index) => {
            note.element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (clickTimer === null) {
                    // First click
                    clickTimer = setTimeout(() => {
                        // Single click: Play just this note
                        this.playNote(note.pitch, note.duration, note.element);
                        clickTimer = null;
                    }, clickDelay);
                } else {
                    // Double click: Start playback from this note
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    this.playFrom(index);
                }
            });

            // Cursor set via CSS now (template line 67-69)
        });
    }

    /**
     * Play the tablature from the beginning
     */
    async play() {
        if (this.isPlaying) return;

        // Resume audio context (required by browsers after user gesture)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('AudioPlaybackController: Audio context resumed');
        }

        console.log('AudioPlaybackController: Starting playback');
        this.playFrom(0);
    }

    /**
     * Play from a specific note index
     */
    playFrom(startIndex) {
        // Stop any existing playback
        this.stop();

        this.isPlaying = true;
        this.currentNoteIndex = startIndex;

        // V4.0.13: No button state management (onclick handlers don't need enable/disable)

        // Schedule playback
        this.schedulePlayback(startIndex);
    }

    /**
     * Stop playback
     */
    stop() {
        console.log('AudioPlaybackController: Stopping playback');

        this.isPlaying = false;

        // Clear all scheduled timeouts (both playback and glow removal)
        this.playbackTimeouts.forEach(timeout => clearTimeout(timeout));
        this.playbackTimeouts = [];

        this.glowRemovalTimeouts.forEach(timeout => clearTimeout(timeout));
        this.glowRemovalTimeouts = [];

        // Remove glow from currently playing note
        if (this.currentlyPlayingNote) {
            this.removeNoteGlow(this.currentlyPlayingNote);
            this.currentlyPlayingNote = null;
        }

        // V4.0.13: No button state management (onclick handlers don't need enable/disable)
    }

    /**
     * Schedule playback of all notes from startIndex
     */
    schedulePlayback(startIndex) {
        let cumulativeTime = 0;

        for (let i = startIndex; i < this.notes.length; i++) {
            const note = this.notes[i];
            const noteDuration = this.calculateNoteDuration(note.duration, note.isGrace);

            // Schedule this note
            const timeout = setTimeout(() => {
                if (!this.isPlaying) return; // Check if stopped

                this.playNoteWithVisuals(note, noteDuration);

                // Check if last note
                if (i === this.notes.length - 1) {
                    // Schedule stop after last note finishes
                    setTimeout(() => this.stop(), noteDuration);
                }
            }, cumulativeTime);

            this.playbackTimeouts.push(timeout);

            // Add to cumulative time
            cumulativeTime += noteDuration;
        }
    }

    /**
     * Play a note with visual feedback
     * V4.0.13: Remove previous glow immediately instead of using timeout
     */
    playNoteWithVisuals(note, duration) {
        // Remove glow from previous note BEFORE adding to current note
        // This captures the CURRENT toggle state, not old state
        if (this.currentlyPlayingNote && this.currentlyPlayingNote !== note) {
            this.removeNoteGlow(this.currentlyPlayingNote);
        }

        // Play audio
        this.playNote(note.pitch, duration / 1000, note.element); // Convert ms to seconds for audio

        // Add visual glow to all instances (both tablatures)
        this.addNoteGlow(note);

        // No timeout needed - next note will remove this glow
        // Last note's glow removed by stop()
    }

    /**
     * Add green glow and animation to note (in both tablatures)
     * V4.0.13: Uses VisualStateManager for systematic state handling
     */
    addNoteGlow(note) {
        // Remove glow from previous note
        if (this.currentlyPlayingNote && this.currentlyPlayingNote !== note) {
            this.removeNoteGlow(this.currentlyPlayingNote);
        }

        this.currentlyPlayingNote = note;

        // Use VisualStateManager if available (V4.0.13+)
        if (window.visualStateManager) {
            window.visualStateManager.applyState(note.id, 'playback', {
                fill: '#27ae60',  // Green
                filter: 'drop-shadow(0 0 10px rgba(39, 174, 96, 0.8))'
            });

            // Add animation class (not managed by state manager)
            const elements = this.findElementsById(note.id);
            elements.forEach(el => el.classList.add('note-playing'));
        } else {
            // Fallback: Manual state management (V4.0.12 compatibility)
            this.addNoteGlowManual(note);
        }
    }

    /**
     * Remove glow from note (in both tablatures)
     * V4.0.13: Uses VisualStateManager for systematic state handling
     */
    removeNoteGlow(note) {
        if (!note) return;

        // Use VisualStateManager if available (V4.0.13+)
        if (window.visualStateManager) {
            window.visualStateManager.removeState(note.id, 'playback');

            // Remove animation class
            const elements = this.findElementsById(note.id);
            elements.forEach(el => el.classList.remove('note-playing'));
        } else {
            // Fallback: Manual state management (V4.0.12 compatibility)
            this.removeNoteGlowManual(note);
        }
    }

    /**
     * Find all instances of an element by ID (helper)
     */
    findElementsById(elementId) {
        const elements = [];
        Object.values(this.svgElements).forEach(svg => {
            if (!svg) return;
            const el = svg.querySelector(`#${elementId}`);
            if (el) elements.push(el);
        });
        return elements;
    }

    /**
     * LEGACY: Manual glow management (V4.0.12)
     * Kept for backward compatibility if VisualStateManager not loaded
     */
    addNoteGlowManual(note) {
        const noteId = note.id;

        Object.values(this.svgElements).forEach(svg => {
            if (!svg) return;

            const element = svg.querySelector(`#${noteId}`);
            if (element) {
                const currentFill = element.style.fill || '';
                element.dataset.originalFill = currentFill;

                element.classList.add('note-playing');
                element.style.fill = '#27ae60';
                element.style.filter = 'drop-shadow(0 0 10px rgba(39, 174, 96, 0.8))';
            }
        });
    }

    /**
     * LEGACY: Manual glow removal (V4.0.12)
     */
    removeNoteGlowManual(note) {
        const noteId = note.id;

        Object.values(this.svgElements).forEach(svg => {
            if (!svg) return;

            const element = svg.querySelector(`#${noteId}`);
            if (element) {
                element.classList.remove('note-playing');

                if ('originalFill' in element.dataset) {
                    element.style.fill = element.dataset.originalFill;
                    delete element.dataset.originalFill;
                }

                element.style.filter = '';
            }
        });
    }

    /**
     * Calculate note duration in milliseconds based on note value and grace note status
     * Note: durations are already normalized (1 = quarter note, 0.5 = eighth, etc.)
     * V4.1.3: Grace notes use 1/4 duration
     */
    calculateNoteDuration(noteValue, isGrace = false) {
        // Durations come pre-normalized from the parser
        // 1 = quarter note, 0.5 = eighth note, 2 = half note, etc.
        // Grace notes use 1/4 of their duration value
        const effectiveValue = isGrace ? (noteValue / 4) : noteValue;
        const result = this.quarterNoteDuration * effectiveValue;
        console.log(`Duration calc: noteValue=${noteValue}, isGrace=${isGrace}, effectiveValue=${effectiveValue}, result=${result}ms`);
        return result;
    }

    /**
     * Play a single note using Web Audio API
     * Synthesizes Dan Tranh-like plucked string sound (V0.11.3-compatible)
     */
    playNote(pitch, duration, element) {
        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const frequency = this.pitchToFrequency(pitch);

        // Determine if grace note (for volume/resonance adjustment)
        const isGrace = element && element.classList.contains('grace-note');

        // Create oscillator with triangle wave (matches V0.11.3)
        const oscillator = ctx.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, now);

        // Create gain envelope
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        // V0.11.3-compatible envelope and resonance
        const volume = isGrace ? 0.2 : 0.3;
        const resonanceDuration = isGrace ? duration + 1.5 : duration + 3.0;

        // Attack and decay envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
        gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + resonanceDuration);

        // Start and stop
        oscillator.start(now);
        oscillator.stop(now + resonanceDuration);
    }

    /**
     * Convert pitch string (e.g., "C4", "G5") to frequency in Hz
     */
    pitchToFrequency(pitch) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };

        // Parse pitch (e.g., "C4" -> note="C", octave=4)
        const match = pitch.match(/([A-G][b#]?)(\d+)/);
        if (!match) return 440; // Default to A4

        const note = match[1];
        const octave = parseInt(match[2]);

        // Calculate semitones from A4 (440 Hz)
        const semitones = (octave - 4) * 12 + (noteMap[note] - noteMap['A']);

        // Calculate frequency using equal temperament
        const frequency = 440 * Math.pow(2, semitones / 12);

        return frequency;
    }

    /**
     * Set tempo (BPM)
     */
    setTempo(bpm) {
        this.tempo = bpm;
        this.quarterNoteDuration = 60000 / this.tempo;
        console.log(`AudioPlaybackController: Tempo set to ${bpm} BPM`);
    }

    // ========================================
    // FUTURE PLAYBACK MODES (Extensibility)
    // ========================================

    /**
     * Play notes matching a filter function
     * @param {Function} filterFn - Filter function (note => boolean)
     * @param {Boolean} loop - Whether to loop playback
     */
    playFiltered(filterFn, loop = false) {
        const filteredNotes = this.notes.filter((note, index) => {
            note._originalIndex = index; // Store original position
            return filterFn(note);
        });

        if (filteredNotes.length === 0) {
            console.warn('AudioPlaybackController: No notes match filter');
            return;
        }

        console.log(`AudioPlaybackController: Playing ${filteredNotes.length} filtered notes`);

        // Play filtered notes
        this.playNoteList(filteredNotes, loop);
    }

    /**
     * Play a specific list of notes
     */
    playNoteList(noteList, loop = false) {
        this.stop();

        this.isPlaying = true;

        // V4.0.13: No button state management

        const playSequence = () => {
            let cumulativeTime = 0;

            noteList.forEach((note, i) => {
                const noteDuration = this.calculateNoteDuration(note.duration, note.isGrace);

                const timeout = setTimeout(() => {
                    if (!this.isPlaying) return;

                    this.playNoteWithVisuals(note, noteDuration);

                    // If last note and looping
                    if (i === noteList.length - 1) {
                        if (loop && this.isPlaying) {
                            setTimeout(() => playSequence(), noteDuration);
                        } else {
                            setTimeout(() => this.stop(), noteDuration);
                        }
                    }
                }, cumulativeTime);

                this.playbackTimeouts.push(timeout);
                cumulativeTime += noteDuration;
            });
        };

        playSequence();
    }

    /**
     * Play only notes matching a specific pattern ID
     * Usage: audioController.playPattern('kpic-3-1')
     */
    playPattern(patternId, loop = false) {
        this.playFiltered(note => {
            const patternAttr = note.element.getAttribute('data-pattern-id');
            return patternAttr && patternAttr.includes(patternId);
        }, loop);
    }

    /**
     * Play only notes with a specific linguistic tone
     * Usage: audioController.playLinguisticTone('ngang')
     */
    playLinguisticTone(tone, loop = false) {
        this.playFiltered(note => {
            const toneAttr = note.element.getAttribute('data-linguistic-tone');
            return toneAttr === tone;
        }, loop);
    }

    /**
     * Play only notes in a specific phrase
     * Usage: audioController.playPhrase(1, true) // Phrase 1, looped
     */
    playPhrase(phraseId, loop = false) {
        this.playFiltered(note => {
            const phraseAttr = note.element.getAttribute('data-phrase-id');
            return phraseAttr === String(phraseId);
        }, loop);
    }

    /**
     * Play only notes at a specific phrase position
     * Usage: audioController.playPhrasePosition('beginning')
     */
    playPhrasePosition(position, loop = false) {
        this.playFiltered(note => {
            const posAttr = note.element.getAttribute('data-phrase-position');
            return posAttr === position;
        }, loop);
    }

    /**
     * Play only notes on a specific string
     * Usage: audioController.playString(7) // Play string 7 notes
     */
    playString(stringNumber, loop = false) {
        this.playFiltered(note => {
            const stringAttr = note.element.getAttribute('data-string');
            return stringAttr === String(stringNumber);
        }, loop);
    }

    /**
     * Play only notes with a specific pitch
     * Usage: audioController.playPitch('G4')
     */
    playPitch(pitch, loop = false) {
        this.playFiltered(note => {
            return note.pitch === pitch;
        }, loop);
    }

    /**
     * Play only grace notes
     */
    playGraceNotes(loop = false) {
        this.playFiltered(note => note.isGrace, loop);
    }

    /**
     * Play only main notes (non-grace)
     */
    playMainNotes(loop = false) {
        this.playFiltered(note => !note.isGrace, loop);
    }

    /**
     * Play only bent notes
     */
    playBentNotes(loop = false) {
        this.playFiltered(note => {
            const bentAttr = note.element.getAttribute('data-bent');
            return bentAttr === 'true';
        }, loop);
    }

    /**
     * Play notes within a range (by index)
     * Usage: audioController.playRange(10, 20, true) // Notes 10-20, looped
     */
    playRange(startIndex, endIndex, loop = false) {
        const rangeNotes = this.notes.slice(startIndex, endIndex + 1);
        this.playNoteList(rangeNotes, loop);
    }

    /**
     * Calculate total duration of a note range (in milliseconds)
     * Used for phrase looping timing
     */
    calculateRangeDuration(startIndex, endIndex) {
        if (!this.notes || this.notes.length === 0) return 3000; // Default 3 seconds

        const rangeNotes = this.notes.slice(startIndex, endIndex + 1);
        const totalDuration = rangeNotes.reduce((sum, note) => {
            const duration = parseFloat(note.duration) || 1.0;
            return sum + (duration * this.quarterNoteDuration);
        }, 0);

        return totalDuration + 500; // Add 500ms pause before loop
    }
}

// Export for global use
window.AudioPlaybackController = AudioPlaybackController;