/**
 * Glissando Controller - Perfect Glissando Sign Implementation
 * Automatically draws glissando paths for all candidate notes
 *
 * Path Calculation Rules:
 * - Y-From: FURTHEST string from target (absolute top or bottom, INCLUDING GREY STRINGS)
 * - Y-To: Immediate following note's Y position (includes grace notes)
 * - X-To: Immediate following note's X position (includes grace notes)
 * - X-From: Midway for normal notes, 1/3 for dotted notes
 *
 * String Boundaries:
 * - Uses absolute tablature boundaries (all 20 strings: black + grey)
 * - Calculates distance from target to both absolute top and absolute bottom
 * - Draws from whichever boundary is FURTHEST to maximize glissando length
 */

class GlissandoController {
    constructor() {
        this.svg = null;
        this.notes = [];
        this.strings = [];        // Used strings only (black)
        this.allStrings = [];     // ALL strings including grey (for glissando boundaries)
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
     * Extracts ALL strings (both used black and unused grey) for glissando boundaries
     */
    extractStringsFromSVG() {
        this.strings = [];
        this.allStrings = []; // ALL strings including grey (for glissando boundaries)

        // Try multiple selectors to find string lines
        let stringLines = this.svg.querySelectorAll('line.string-line');
        console.log(`%cTrying 'line.string-line': found ${stringLines.length}`, 'color: orange; font-weight: bold;');

        if (stringLines.length === 0) {
            // Fallback: try all line elements
            stringLines = this.svg.querySelectorAll('line');
            console.log(`%cFallback: trying all 'line' elements: found ${stringLines.length}`, 'color: orange; font-weight: bold;');

            // Filter to horizontal lines only (y1 === y2) - these are strings
            const horizontalLines = Array.from(stringLines).filter(line => {
                const y1 = parseFloat(line.getAttribute('y1'));
                const y2 = parseFloat(line.getAttribute('y2'));
                return Math.abs(y1 - y2) < 1; // Horizontal line
            });

            console.log(`%cFiltered to ${horizontalLines.length} horizontal lines (strings)`, 'color: orange; font-weight: bold;');
            stringLines = horizontalLines;
        }

        stringLines.forEach((line, index) => {
            const y = parseFloat(line.getAttribute('y1'));
            const stringNum = parseInt(line.getAttribute('data-string-number')) || (index + 1);
            const stroke = line.getAttribute('stroke');

            // Store ALL strings (both black and grey) for glissando boundaries
            this.allStrings.push({
                number: stringNum,
                y: y,
                isUsed: stroke === '#000000' || stroke === 'black'
            });

            // Only include USED strings (black #000000) in main strings array
            if (stroke === '#000000' || stroke === 'black') {
                this.strings.push({
                    number: stringNum,
                    y: y
                });
            }
        });

        // Sort both arrays by Y position
        this.strings.sort((a, b) => a.y - b.y);
        this.allStrings.sort((a, b) => a.y - b.y);

        if (this.allStrings.length > 0) {
            const absoluteTopString = this.allStrings[0]; // Smallest Y = absolute top (could be grey)
            const absoluteBottomString = this.allStrings[this.allStrings.length - 1]; // Largest Y = absolute bottom (could be grey)

            console.log(`%c
╔═══════════════════════════════════════════════════════════════╗
║  TABLATURE STRING BOUNDARIES (ALL STRINGS - INCLUDING GREY)   ║
╠═══════════════════════════════════════════════════════════════╣
║  ABSOLUTE TOP:    String ${String(absoluteTopString.number).padStart(2)} at Y = ${String(absoluteTopString.y).padStart(6)} ${absoluteTopString.isUsed ? '(BLACK)' : '(GREY) '}  ║
║  ABSOLUTE BOTTOM: String ${String(absoluteBottomString.number).padStart(2)} at Y = ${String(absoluteBottomString.y).padStart(6)} ${absoluteBottomString.isUsed ? '(BLACK)' : '(GREY) '}  ║
╚═══════════════════════════════════════════════════════════════╝
            `, 'font-weight: bold; font-size: 14px; color: #2196F3;');
        }
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

        // Create duration-to-color map (all black, opacity handled separately)
        const uniqueDurations = [...new Set(this.glissandoCandidates.map(c => c.duration))];
        uniqueDurations.sort((a, b) => b - a); // Longest first

        // All glissandos use black color, differentiation via opacity
        uniqueDurations.forEach((duration) => {
            this.durationColorMap[duration] = '#000000';  // All black
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
     * Get opacity for a glissando based on duration hierarchy
     * Longest duration = 1.0 (100%)
     * Each subsequent duration = -20% opacity
     * Example: 1st = 1.0, 2nd = 0.80, 3rd = 0.60, 4th = 0.40, 5th+ = 0.20
     */
    getDurationOpacity(candidateIndex) {
        const candidate = this.glissandoCandidates.find(c => c.noteIndex === candidateIndex);
        if (!candidate) return 1.0;

        // Get all unique durations sorted (longest first)
        const uniqueDurations = [...new Set(this.glissandoCandidates.map(c => c.duration))];
        uniqueDurations.sort((a, b) => b - a);

        // Find this duration's rank (0 = longest)
        const rank = uniqueDurations.indexOf(candidate.duration);

        // Calculate opacity: 1.0 for longest, then -0.20 for each step down, minimum 0.20
        const opacity = Math.max(0.2, 1.0 - (rank * 0.20));

        return opacity;
    }

    /**
     * Calculate glissando start Y position
     * Starts from the furthest string (INCLUDING GREY STRINGS) from target note
     * Uses absolute top/bottom of entire tablature, not just used strings
     */
    calculateGlissandoStartY(candidateY, targetY) {
        if (this.allStrings.length === 0) {
            console.error('%c⚠️ NO STRINGS FOUND! Cannot calculate glissando start position',
                'color: red; font-size: 14px; font-weight: bold;');
            console.error('Available allStrings:', this.allStrings);
            return targetY; // Fallback to target Y
        }

        const absoluteTopString = this.allStrings[0]; // Smallest Y = absolute top (may be grey)
        const absoluteBottomString = this.allStrings[this.allStrings.length - 1]; // Largest Y = absolute bottom (may be grey)

        // Calculate distances from target to absolute top and bottom
        const distanceFromTop = Math.abs(targetY - absoluteTopString.y);
        const distanceFromBottom = Math.abs(targetY - absoluteBottomString.y);

        // Choose the FURTHEST string (INCLUDING GREY)
        const furthestString = distanceFromTop > distanceFromBottom ? absoluteTopString : absoluteBottomString;
        const chosenEnd = distanceFromTop > distanceFromBottom ? 'TOP' : 'BOTTOM';

        console.log(`%c━━━ GLISSANDO CALCULATION ━━━`, 'font-weight: bold; color: #2196F3;');
        console.log(`  Target note:           Y = ${targetY.toFixed(1)}`);
        console.log(`  Absolute TOP string:   Y = ${absoluteTopString.y.toFixed(1)} (distance: ${distanceFromTop.toFixed(1)}) ${absoluteTopString.isUsed ? 'BLACK' : 'GREY'}`);
        console.log(`  Absolute BOTTOM string: Y = ${absoluteBottomString.y.toFixed(1)} (distance: ${distanceFromBottom.toFixed(1)}) ${absoluteBottomString.isUsed ? 'BLACK' : 'GREY'}`);
        console.log(`%c  ✓ Drawing from ${chosenEnd} string at Y = ${furthestString.y.toFixed(1)} ${furthestString.isUsed ? '(BLACK)' : '(GREY)'}`,
            'font-weight: bold; font-size: 13px; color: #4CAF50; background: #E8F5E9; padding: 4px 8px;');

        return furthestString.y;
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
     * Find previous note (includes grace notes)
     */
    findPreviousNote(targetNoteIndex) {
        // Find all notes before the target
        const previousNotes = this.notes.filter(n => n.index < targetNoteIndex);

        if (previousNotes.length === 0) return null;

        // Return the last note before the target (could be grace or main)
        return previousNotes[previousNotes.length - 1];
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
     * ZOOM-AWARE: Stores base path endpoints, chevron arms stay constant size
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
            strokeWidth = this.strokeWidth,
            opacity = 1.0
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

        // Calculate arm offsets (from chevron point) - CONSTANT SIZE
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

            // Store BASE path endpoints for zoom transformation
            polyline.setAttribute('data-base-start-x', startX);
            polyline.setAttribute('data-base-start-y', startY);
            polyline.setAttribute('data-base-end-x', endX);
            polyline.setAttribute('data-base-end-y', endY);
            polyline.setAttribute('data-chevron-index', i);  // Which chevron in the path

            polyline.setAttribute('points', `${leftX.toFixed(2)},${leftY.toFixed(2)} ${pointX.toFixed(2)},${pointY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)}`);
            polyline.setAttribute('stroke', color);
            polyline.setAttribute('stroke-width', strokeWidth);
            polyline.setAttribute('stroke-opacity', opacity);  // Apply hierarchical opacity
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
     * @param {number} candidateNoteIndex - Index of the candidate note
     * @param {number} customXDelta - Optional custom X delta (overrides calculated delta)
     */
    drawGlissandoForCandidate(candidateNoteIndex, customXDelta = null) {
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
        let xFrom, xTo;
        if (customXDelta !== null) {
            // Use custom X delta (for First/Last special cases)
            xFrom = candidateNote.x + (customXDelta * 0.5); // Midway with custom delta
            xTo = candidateNote.x + customXDelta;
        } else {
            // Standard calculation
            xFrom = this.calculateXFrom(candidateNote, targetNote);
            xTo = targetNote.x;
        }

        const yFrom = this.calculateGlissandoStartY(candidateNote.y, targetNote.y);
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

        // Generate chevrons with priority color and hierarchical opacity
        const opacity = this.getDurationOpacity(candidateNoteIndex);
        const chevrons = this.generateGlissando({
            startX: xFrom,
            startY: yFrom,
            endX: xTo,
            endY: yTo,
            color,
            opacity
        });

        // Insert chevrons into SVG (before notes for proper layering)
        const firstNote = this.svg.querySelector('circle');
        chevrons.forEach(chevron => {
            this.svg.insertBefore(chevron, firstNote);
        });

        // Store path data (no label)
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

    /**
     * Calculate first priority X delta (longest duration note's delta)
     */
    getFirstPriorityXDelta() {
        if (this.glissandoCandidates.length === 0) {
            return null;
        }

        // Find longest duration candidate
        const sortedCandidates = [...this.glissandoCandidates].sort((a, b) => b.duration - a.duration);
        const firstPriority = sortedCandidates[0];

        // Find the notes
        const candidateNote = this.notes.find(n => n.index === firstPriority.noteIndex);
        const targetNote = this.findImmediateFollowingNote(firstPriority.noteIndex);

        if (!candidateNote || !targetNote) {
            return null;
        }

        // Calculate delta X
        const deltaX = targetNote.x - candidateNote.x;
        console.log(`First priority X delta: ${deltaX.toFixed(1)}px (Note #${firstPriority.noteIndex} → #${targetNote.index})`);

        return deltaX;
    }

    /**
     * Draw glissando that TARGETS a specific note (glissando ends at this note)
     * @param {number} targetNoteIndex - Index of the target note (where glissando ends)
     * @param {number} xDelta - X distance for the glissando
     */
    drawGlissandoToNote(targetNoteIndex, xDelta) {
        // Find the target note
        const targetNote = this.notes.find(n => n.index === targetNoteIndex);
        if (!targetNote) {
            console.warn(`Target note #${targetNoteIndex} not found`);
            return null;
        }

        // Calculate starting position (xDelta before target)
        const xFrom = targetNote.x - (xDelta * 0.5); // Midway point
        const xTo = targetNote.x;
        const yFrom = this.calculateGlissandoStartY(targetNote.y - 50, targetNote.y); // Start from edgemost string
        const yTo = targetNote.y;

        // Use black color for special glissandos
        const color = '#000000';
        const opacity = 1.0;

        console.log(`Drawing glissando TO note #${targetNoteIndex}:`, {
            target: `(${targetNote.x.toFixed(1)}, ${targetNote.y.toFixed(1)})`,
            path: `(${xFrom.toFixed(1)}, ${yFrom.toFixed(1)}) → (${xTo.toFixed(1)}, ${yTo.toFixed(1)})`,
            deltaX: xDelta
        });

        // Generate chevrons
        const chevrons = this.generateGlissando({
            startX: xFrom,
            startY: yFrom,
            endX: xTo,
            endY: yTo,
            color,
            opacity
        });

        // Insert chevrons into SVG
        const firstNote = this.svg.querySelector('circle');
        chevrons.forEach(chevron => {
            this.svg.insertBefore(chevron, firstNote);
        });

        // Store path data
        this.glissandoPaths.push({
            candidateIndex: targetNoteIndex,
            targetIndex: targetNoteIndex,
            xFrom, yFrom, xTo, yTo,
            chevrons,
            color
        });

        // Mark as active
        this.activeGlissandos.add(targetNoteIndex);

        return { xFrom, yFrom, xTo, yTo, chevrons, color };
    }
}

// Create global instance
window.glissandoController = new GlissandoController();
