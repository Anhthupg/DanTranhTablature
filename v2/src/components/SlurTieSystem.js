/**
 * SlurTieSystem.js
 * Handles slur-to-tie conversion for Dan Tranh tablature
 *
 * In MusicXML, slurs and ties are different:
 * - Slur: Performance technique connecting different pitches
 * - Tie: Connects same pitch notes to extend duration
 *
 * For Dan Tranh, we need to convert appropriate slurs to ties
 */

export class SlurTieSystem {
    constructor() {
        this.slurs = [];
        this.ties = [];
        this.connections = new Map(); // noteId -> connection info
    }

    /**
     * Process notes to identify slur/tie connections
     * @param {Array} notes - Array of note objects
     */
    processNotes(notes) {
        this.slurs = [];
        this.ties = [];
        this.connections.clear();

        // Group consecutive notes to find connections
        for (let i = 0; i < notes.length - 1; i++) {
            const currentNote = notes[i];
            const nextNote = notes[i + 1];

            // Check if notes should be connected
            const connection = this.analyzeConnection(currentNote, nextNote);

            if (connection.type !== 'none') {
                this.addConnection(currentNote, nextNote, connection);
            }
        }

        return {
            slurs: this.slurs,
            ties: this.ties,
            connections: this.connections
        };
    }

    /**
     * Analyze if two notes should be connected and how
     */
    analyzeConnection(note1, note2) {
        // Skip if either is a grace note
        if (note1.isGrace || note2.isGrace) {
            return { type: 'none' };
        }

        // Check pitch relationship
        const samePitch = note1.pitch === note2.pitch;
        const sameString = note1.string === note2.string;

        // Check temporal proximity (adjust threshold as needed)
        const distance = Math.abs(note2.x - note1.x);
        const maxSlurDistance = 500; // Maximum X distance for slur
        const maxTieDistance = 300;  // Maximum X distance for tie

        if (samePitch && sameString && distance <= maxTieDistance) {
            // Same pitch on same string = TIE
            return {
                type: 'tie',
                reason: 'same pitch continuation',
                strength: 1.0
            };
        } else if (!samePitch && distance <= maxSlurDistance) {
            // Different pitches = SLUR (performance technique)
            // Check if it's a common ornamental pattern
            const interval = this.calculateInterval(note1.pitch, note2.pitch);

            if (Math.abs(interval) <= 2) {
                // Small interval, likely a slur
                return {
                    type: 'slur',
                    reason: 'melodic connection',
                    strength: 0.8,
                    interval: interval
                };
            }
        }

        return { type: 'none' };
    }

    /**
     * Add a connection between two notes
     */
    addConnection(note1, note2, connection) {
        const connectionData = {
            startNote: note1.id,
            endNote: note2.id,
            startX: note1.x,
            startY: note1.y,
            endX: note2.x,
            endY: note2.y,
            type: connection.type,
            metadata: connection
        };

        if (connection.type === 'tie') {
            this.ties.push(connectionData);
        } else if (connection.type === 'slur') {
            this.slurs.push(connectionData);
        }

        // Store in connections map for quick lookup
        this.connections.set(note1.id, { ...connectionData, direction: 'start' });
        this.connections.set(note2.id, { ...connectionData, direction: 'end' });
    }

    /**
     * Calculate interval between two pitches
     */
    calculateInterval(pitch1, pitch2) {
        const pitchMap = {
            'C4': 0, 'D4': 2, 'E4': 4, 'F4': 5, 'G4': 7, 'A4': 9, 'B4': 11,
            'C5': 12, 'D5': 14, 'E5': 16, 'F5': 17, 'G5': 19, 'A5': 21, 'B5': 23,
            'C6': 24, 'D6': 26, 'E6': 28, 'F6': 29, 'G6': 31
        };

        const p1 = pitchMap[pitch1] || 0;
        const p2 = pitchMap[pitch2] || 0;

        return p2 - p1;
    }

    /**
     * Generate SVG paths for ties
     */
    generateTiePath(tie) {
        const { startX, startY, endX, endY } = tie;

        // Calculate control points for bezier curve
        const midX = (startX + endX) / 2;
        const curveHeight = 20; // Height of the curve arc
        const curveDirection = startY < 350 ? 1 : -1; // Curve up or down

        // Create a quadratic bezier curve
        const path = `M ${startX} ${startY}
                      Q ${midX} ${startY + (curveHeight * curveDirection)}
                      ${endX} ${endY}`;

        return {
            d: path,
            stroke: '#8B4513', // Brown color for ties
            strokeWidth: 2,
            fill: 'none',
            opacity: 0.7
        };
    }

    /**
     * Generate SVG paths for slurs
     */
    generateSlurPath(slur) {
        const { startX, startY, endX, endY } = slur;

        // Calculate control points for bezier curve
        const midX = (startX + endX) / 2;
        const curveHeight = 30; // Slightly higher curve for slurs
        const curveDirection = startY < 350 ? 1 : -1;

        // Create a cubic bezier curve for smoother slur
        const path = `M ${startX} ${startY}
                      C ${startX + 20} ${startY + (curveHeight * curveDirection)}
                        ${endX - 20} ${endY + (curveHeight * curveDirection)}
                        ${endX} ${endY}`;

        return {
            d: path,
            stroke: '#4169E1', // Royal blue for slurs
            strokeWidth: 1.5,
            fill: 'none',
            opacity: 0.6,
            strokeDasharray: '5,3' // Dashed line for slurs
        };
    }

    /**
     * Render all connections to SVG
     */
    renderToSVG(svgElement) {
        // Create a group for connections
        const connectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        connectionGroup.setAttribute('id', 'connections');
        connectionGroup.setAttribute('class', 'slur-tie-connections');

        // Render ties first (behind slurs)
        this.ties.forEach((tie, index) => {
            const pathData = this.generateTiePath(tie);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            Object.entries(pathData).forEach(([attr, value]) => {
                path.setAttribute(attr, value);
            });

            path.setAttribute('id', `tie-${index}`);
            path.setAttribute('class', 'tie-path');
            connectionGroup.appendChild(path);
        });

        // Render slurs on top
        this.slurs.forEach((slur, index) => {
            const pathData = this.generateSlurPath(slur);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            Object.entries(pathData).forEach(([attr, value]) => {
                path.setAttribute(attr, value);
            });

            path.setAttribute('id', `slur-${index}`);
            path.setAttribute('class', 'slur-path');
            connectionGroup.appendChild(path);
        });

        // Insert before notes so connections appear behind
        const firstNote = svgElement.querySelector('.note-circle');
        if (firstNote) {
            svgElement.insertBefore(connectionGroup, firstNote);
        } else {
            svgElement.appendChild(connectionGroup);
        }

        return connectionGroup;
    }

    /**
     * Export connection data for storage
     */
    exportData() {
        return {
            slurs: this.slurs,
            ties: this.ties,
            metadata: {
                totalSlurs: this.slurs.length,
                totalTies: this.ties.length,
                exportedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Import connection data
     */
    importData(data) {
        this.slurs = data.slurs || [];
        this.ties = data.ties || [];

        // Rebuild connections map
        this.connections.clear();
        [...this.slurs, ...this.ties].forEach(connection => {
            this.connections.set(connection.startNote, { ...connection, direction: 'start' });
            this.connections.set(connection.endNote, { ...connection, direction: 'end' });
        });
    }

    /**
     * Check if a note has connections
     */
    hasConnection(noteId) {
        return this.connections.has(noteId);
    }

    /**
     * Get connection info for a note
     */
    getConnection(noteId) {
        return this.connections.get(noteId);
    }

    /**
     * Highlight connections for a selected note
     */
    highlightConnections(noteId) {
        const connection = this.connections.get(noteId);
        if (!connection) return;

        // Find and highlight the connection path
        const pathId = connection.type === 'tie'
            ? `tie-${this.ties.findIndex(t => t.startNote === connection.startNote)}`
            : `slur-${this.slurs.findIndex(s => s.startNote === connection.startNote)}`;

        const path = document.getElementById(pathId);
        if (path) {
            path.style.stroke = '#FF6347'; // Tomato red for highlight
            path.style.strokeWidth = '3';
            path.style.opacity = '1';

            // Reset after 2 seconds
            setTimeout(() => {
                const originalData = connection.type === 'tie'
                    ? this.generateTiePath(connection)
                    : this.generateSlurPath(connection);

                path.style.stroke = originalData.stroke;
                path.style.strokeWidth = originalData.strokeWidth;
                path.style.opacity = originalData.opacity;
            }, 2000);
        }
    }
}

// Factory function for creating slur/tie system
export function createSlurTieSystem() {
    return new SlurTieSystem();
}