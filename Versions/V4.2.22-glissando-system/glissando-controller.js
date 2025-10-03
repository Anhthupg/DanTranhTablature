/**
 * Glissando Controller - Perfect Glissando Sign Implementation
 * Automatically draws glissando paths for all candidate notes
 *
 * Path Calculation Rules:
 * - Y-From: Edgemost string Y position (string closest to target note)
 * - Y-To: Immediate following note's Y position (includes grace notes)
 * - X-To: Immediate following note's X position (includes grace notes)
 * - X-From: Midway for normal notes, 1/3 for dotted notes
 */

class GlissandoController {
    constructor() {
        this.svg = null;
        this.notes = [];
        this.strings = [];
        this.glissandoCandidates = [];
        this.glissandoPaths = [];
        this.chevronWidth = 14;
        this.chevronDepth = 9;
        this.strokeWidth = 2;

        // Duration-to-color mapping
        // Maps duration values to colors (will be populated during analysis)
        this.durationColorMap = {};

        // Track which glissandos are currently shown
        this.activeGlissandos = new Set();
    }

    /**
     * Initialize with SVG element ID
     */
    initialize(svgId) {
        this.svg = document.getElementById(svgId);
        if (!this.svg) {
            console.error(`SVG with ID "${svgId}" not found`);
            return false;
        }

        // Extract notes from SVG (circles with data-note-index)
        this.extractNotesFromSVG();

        // Extract string positions from SVG (string lines)
        this.extractStringsFromSVG();

        console.log(`Glissando Controller initialized:`, {
            notes: this.notes.length,
            strings: this.strings.length
        });

        return true;
    }

    /**
     * Extract note positions from SVG
     */
    extractNotesFromSVG() {
        this.notes = [];
        const noteCircles = this.svg.querySelectorAll('circle[data-note-index]');

        noteCircles.forEach(circle => {
            const index = parseInt(circle.getAttribute('data-note-index'));
            const cx = parseFloat(circle.getAttribute('cx'));
            const cy = parseFloat(circle.getAttribute('cy'));
            const isGrace = circle.classList.contains('grace-note');
            const duration = parseFloat(circle.getAttribute('data-duration')) || 0.5;
            const isDotted = circle.getAttribute('data-dotted') === 'true';

            this.notes.push({
                index,
                x: cx,
                y: cy,
                isGrace,
                duration,
                isDotted,
                element: circle
            });
        });

        // Sort by index to ensure correct order
        this.notes.sort((a, b) => a.index - b.index);
    }

    /**
     * Extract string Y positions from SVG
     */
    extractStringsFromSVG() {
        this.strings = [];
        const stringLines = this.svg.querySelectorAll('line.string');

        stringLines.forEach(line => {
            const y = parseFloat(line.getAttribute('y1'));
            const stringNum = parseInt(line.getAttribute('data-string-number'));

            this.strings.push({
                number: stringNum,
                y: y
            });
        });

        // Sort by Y position
        this.strings.sort((a, b) => a.y - b.y);
    }

    /**
     * Analyze current SVG notes and find glissando candidates
     * Works directly with SVG data-note-index attributes
     * Returns ALL main notes with duration info and percentages
     */
    analyzeSVGNotes() {
        if (this.notes.length === 0) {
            console.error('No notes extracted from SVG');
            return;
        }

        // Filter to main notes only
        const mainNotes = this.notes.filter(n => !n.isGrace);
        const totalMainNotes = mainNotes.length;

        // Count duration frequencies
        const durationCounts = {};
        mainNotes.forEach(note => {
            durationCounts[note.duration] = (durationCounts[note.duration] || 0) + 1;
        });

        // Store duration stats for display
        this.durationStats = {};
        Object.entries(durationCounts).forEach(([duration, count]) => {
            this.durationStats[duration] = {
                count,
                percentage: (count / totalMainNotes * 100).toFixed(1)
            };
        });

        // Find ALL candidates (no exclusion, must have following note)
        this.glissandoCandidates = [];

        mainNotes.forEach((note, i) => {
            // Check: main note, has following note
            if (i < mainNotes.length - 1) {
                this.glissandoCandidates.push({
                    noteIndex: note.index,  // SVG data-note-index
                    duration: note.duration,
                    pitch: note.element.getAttribute('data-pitch') || 'Unknown'
                });
            }
        });

        // Sort by duration (longest first)
        this.glissandoCandidates.sort((a, b) => b.duration - a.duration);

        // Create duration-to-color map
        const uniqueDurations = [...new Set(this.glissandoCandidates.map(c => c.duration))];
        uniqueDurations.sort((a, b) => b - a); // Longest first

        const colors = ['#FFD700', '#3498DB', '#9B59B6', '#95A5A6', '#E67E22', '#E74C3C']; // Extended palette
        uniqueDurations.forEach((duration, index) => {
            this.durationColorMap[duration] = colors[Math.min(index, colors.length - 1)];
        });

        console.log(`Analyzed SVG: Found ${this.glissandoCandidates.length} candidates across ${uniqueDurations.length} durations`);
        console.log(`Duration stats:`, this.durationStats);
        console.log(`Duration colors:`, this.durationColorMap);
    }

    /**
     * Load glissando analysis data by song name (fetches from server)
     * NOTE: Currently not used - we analyze SVG directly instead
     */
    async loadAnalysisByName(songName) {
        try {
            // Fetch analysis from server
            const response = await fetch(`/api/glissando-by-name/${encodeURIComponent(songName)}`);
            const data = await response.json();

            if (data.error) {
                console.error('Error loading glissando analysis:', data.error);
                return null;
            }

            // Load candidates (simple array format)
            this.loadCandidates(data.glissandoCandidates || []);

            console.log(`Loaded analysis for "${songName}": ${this.glissandoCandidates.length} candidates`);
            return data;
        } catch (error) {
            console.error('Error loading glissando analysis:', error);
            return null;
        }
    }

    /**
     * Load glissando candidates from analyzer data
     */
    loadCandidates(candidates) {
        this.glissandoCandidates = candidates;
        console.log(`Loaded ${candidates.length} glissando candidates`);
    }

    /**
     * Get color for a glissando based on candidate note's duration
     * All notes with same duration get same color
     */
    getPriorityColor(candidateIndex) {
        // Find the candidate's duration
        const candidate = this.glissandoCandidates.find(c => c.noteIndex === candidateIndex);
        if (!candidate) return '#95A5A6'; // Grey fallback

        // Return color from duration map
        return this.durationColorMap[candidate.duration] || '#95A5A6';
    }

    /**
     * Calculate edgemost string Y toward target note
     * Finds the string closest to the target note's Y position
     */
    calculateEdgemostStringY(targetNoteY) {
        if (this.strings.length === 0) return 740; // Default lowest string

        // Find string with minimum distance to target
        let closestString = this.strings[0];
        let minDistance = Math.abs(this.strings[0].y - targetNoteY);

        for (const str of this.strings) {
            const distance = Math.abs(str.y - targetNoteY);
            if (distance < minDistance) {
                minDistance = distance;
                closestString = str;
            }
        }

        return closestString.y;
    }

    /**
     * Find immediate following note (includes grace notes)
     */
    findImmediateFollowingNote(candidateNoteIndex) {
        // Find all notes after the candidate
        const followingNotes = this.notes.filter(n => n.index > candidateNoteIndex);

        if (followingNotes.length === 0) return null;

        // Return the first one (could be grace or main note)
        return followingNotes[0];
    }

    /**
     * Calculate X-From position
     * - Midway for normal notes (not dotted)
     * - 1/3 from candidate (2/3 before target) for dotted notes
     */
    calculateXFrom(candidateNote, targetNote) {
        const candidateX = candidateNote.x;
        const targetX = targetNote.x;
        const distance = targetX - candidateX;

        if (candidateNote.isDotted) {
            // Dotted: 1/3 from candidate, 2/3 before target
            return candidateX + (distance * 1/3);
        } else {
            // Normal: midway
            return candidateX + (distance * 0.5);
        }
    }

    /**
     * Generate glissando chevrons
     */
    generateGlissando(params) {
        const {
            startX,
            startY,
            endX,
            endY,
            chevronWidth = this.chevronWidth,
            chevronDepth = this.chevronDepth,
            color = this.color,
            strokeWidth = this.strokeWidth
        } = params;

        // Calculate path vector
        const dx = endX - startX;
        const dy = endY - startY;
        const pathLength = Math.sqrt(dx * dx + dy * dy);

        // Unit vector along path
        const unitX = dx / pathLength;
        const unitY = dy / pathLength;

        // Perpendicular unit vector (rotated 90° counterclockwise)
        const perpX = -unitY;
        const perpY = unitX;

        // Calculate number of chevrons that fit
        const numChevrons = Math.floor(pathLength / chevronDepth);

        // Calculate chevron spacing vector
        const spacingX = unitX * chevronDepth;
        const spacingY = unitY * chevronDepth;

        // Calculate arm offsets (from chevron point)
        const halfWidth = chevronWidth / 2;
        const leftArmX = -unitX * chevronDepth + perpX * halfWidth;
        const leftArmY = -unitY * chevronDepth + perpY * halfWidth;
        const rightArmX = -unitX * chevronDepth - perpX * halfWidth;
        const rightArmY = -unitY * chevronDepth - perpY * halfWidth;

        // Generate chevron elements
        const chevrons = [];

        for (let i = 0; i < numChevrons; i++) {
            // Current chevron point position
            const pointX = startX + spacingX * i;
            const pointY = startY + spacingY * i;

            // Calculate arm positions
            const leftX = pointX + leftArmX;
            const leftY = pointY + leftArmY;
            const rightX = pointX + rightArmX;
            const rightY = pointY + rightArmY;

            // Create polyline element
            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('points', `${leftX.toFixed(2)},${leftY.toFixed(2)} ${pointX.toFixed(2)},${pointY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)}`);
            polyline.setAttribute('stroke', color);
            polyline.setAttribute('stroke-width', strokeWidth);
            polyline.setAttribute('fill', 'none');
            polyline.setAttribute('stroke-linecap', 'round');
            polyline.setAttribute('stroke-linejoin', 'miter');
            polyline.classList.add('glissando-chevron');

            chevrons.push(polyline);
        }

        return chevrons;
    }

    /**
     * Draw glissando for a specific candidate note
     */
    drawGlissandoForCandidate(candidateNoteIndex) {
        // Find the candidate note
        const candidateNote = this.notes.find(n => n.index === candidateNoteIndex);
        if (!candidateNote) {
            console.warn(`Candidate note #${candidateNoteIndex} not found`);
            return null;
        }

        // Find immediate following note
        const targetNote = this.findImmediateFollowingNote(candidateNoteIndex);
        if (!targetNote) {
            console.warn(`No following note found for candidate #${candidateNoteIndex}`);
            return null;
        }

        // Calculate path endpoints
        const xFrom = this.calculateXFrom(candidateNote, targetNote);
        const yFrom = this.calculateEdgemostStringY(targetNote.y);
        const xTo = targetNote.x;
        const yTo = targetNote.y;

        // Get priority color
        const color = this.getPriorityColor(candidateNoteIndex);

        console.log(`Drawing glissando for note #${candidateNoteIndex}:`, {
            candidate: `(${candidateNote.x.toFixed(1)}, ${candidateNote.y.toFixed(1)})`,
            target: `(${targetNote.x.toFixed(1)}, ${targetNote.y.toFixed(1)})`,
            path: `(${xFrom.toFixed(1)}, ${yFrom.toFixed(1)}) → (${xTo.toFixed(1)}, ${yTo.toFixed(1)})`,
            dotted: candidateNote.isDotted,
            color
        });

        // Generate chevrons with priority color
        const chevrons = this.generateGlissando({
            startX: xFrom,
            startY: yFrom,
            endX: xTo,
            endY: yTo,
            color
        });

        // Insert chevrons into SVG (before notes for proper layering)
        const firstNote = this.svg.querySelector('circle');
        chevrons.forEach(chevron => {
            this.svg.insertBefore(chevron, firstNote);
        });

        // Store path data
        this.glissandoPaths.push({
            candidateIndex: candidateNoteIndex,
            targetIndex: targetNote.index,
            xFrom, yFrom, xTo, yTo,
            chevrons,
            color
        });

        // Mark as active
        this.activeGlissandos.add(candidateNoteIndex);

        return { xFrom, yFrom, xTo, yTo, chevrons, color };
    }

    /**
     * Draw all glissandos for loaded candidates
     */
    drawAllGlissandos() {
        if (this.glissandoCandidates.length === 0) {
            console.warn('No glissando candidates loaded');
            return;
        }

        console.log(`Drawing ${this.glissandoCandidates.length} glissando paths...`);

        this.glissandoCandidates.forEach(candidate => {
            this.drawGlissandoForCandidate(candidate.noteIndex);
        });

        console.log(`✓ Drew ${this.glissandoPaths.length} glissando paths`);
    }

    /**
     * Clear all glissando paths
     */
    clearAllGlissandos() {
        this.glissandoPaths.forEach(path => {
            path.chevrons.forEach(chevron => chevron.remove());
        });

        this.glissandoPaths = [];
        console.log('Cleared all glissando paths');
    }

    /**
     * Toggle glissando for a specific note (click handler)
     */
    toggleGlissandoForNote(noteIndex) {
        // Check if this note is a candidate
        const isCandidate = this.glissandoCandidates.some(c => c.noteIndex === noteIndex);
        if (!isCandidate) {
            console.log(`Note #${noteIndex} is not a glissando candidate`);
            return;
        }

        // Check if glissando is currently shown
        if (this.activeGlissandos.has(noteIndex)) {
            // Remove glissando
            this.removeGlissandoForNote(noteIndex);
        } else {
            // Draw glissando
            this.drawGlissandoForCandidate(noteIndex);
        }
    }

    /**
     * Remove glissando for a specific note
     */
    removeGlissandoForNote(noteIndex) {
        const pathIndex = this.glissandoPaths.findIndex(p => p.candidateIndex === noteIndex);

        if (pathIndex === -1) {
            console.warn(`No glissando path found for note #${noteIndex}`);
            return;
        }

        // Remove chevrons from DOM
        const path = this.glissandoPaths[pathIndex];
        path.chevrons.forEach(chevron => chevron.remove());

        // Remove from arrays
        this.glissandoPaths.splice(pathIndex, 1);
        this.activeGlissandos.delete(noteIndex);

        console.log(`Removed glissando for note #${noteIndex}`);
    }

    /**
     * Enable click-to-toggle on all candidate notes
     */
    enableClickToToggle() {
        this.glissandoCandidates.forEach(candidate => {
            const noteCircle = this.svg.querySelector(`circle[data-note-index="${candidate.noteIndex}"]`);

            if (noteCircle) {
                // Add visual indicator (cursor)
                noteCircle.style.cursor = 'pointer';

                // Add click handler
                noteCircle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleGlissandoForNote(candidate.noteIndex);
                });

                // Add hover effect
                noteCircle.addEventListener('mouseenter', () => {
                    const color = this.getPriorityColor(candidate.noteIndex);
                    noteCircle.style.filter = `drop-shadow(0 0 8px ${color})`;
                });

                noteCircle.addEventListener('mouseleave', () => {
                    noteCircle.style.filter = '';
                });
            }
        });

        console.log(`Enabled click-to-toggle on ${this.glissandoCandidates.length} candidate notes`);
    }

    /**
     * Toggle glissando visibility
     */
    toggleGlissandos(visible) {
        const display = visible ? 'block' : 'none';

        this.glissandoPaths.forEach(path => {
            path.chevrons.forEach(chevron => {
                chevron.style.display = display;
            });
        });

        console.log(`Glissandos ${visible ? 'shown' : 'hidden'}`);
    }
}

// Create global instance
window.glissandoController = new GlissandoController();
