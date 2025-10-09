/**
 * Dynamic String Engine for Dan Tranh Tablature
 * Scalable solution for 1300+ songs with any string combination
 *
 * Features:
 * - Automatic string detection from song data
 * - Efficient caching for performance
 * - Support for 1-30+ strings
 * - Handles any pitch combination
 * - Microtone support ready
 */

class DynamicStringEngine {
    constructor() {
        // Cache for string configurations to optimize performance
        this.stringConfigCache = new Map();

        // Standard Dan Tranh tunings for reference
        this.standardTunings = {
            pentatonic: ['C', 'D', 'E', 'G', 'A'],
            hexatonic: ['C', 'D', 'E', 'F', 'G', 'A'],
            heptatonic: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
            chromatic: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        };

        // MIDI mapping for all notes
        this.midiMap = this.generateMidiMap();

        // Y-position calculation parameters
        this.layoutConfig = {
            startY: 50,           // Starting Y position
            minSpacing: 30,       // Minimum pixels between strings
            maxSpacing: 100,      // Maximum pixels between strings
            semitoneSpacing: 15,  // Base pixels per semitone
            octaveBonus: 20       // Extra spacing for octave jumps
        };
    }

    /**
     * Generate complete MIDI mapping for all possible notes
     */
    generateMidiMap() {
        const map = new Map();
        const notes = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
        const enharmonics = {
            'C#': 'Db', 'Db': 'C#',
            'D#': 'Eb', 'Eb': 'D#',
            'F#': 'Gb', 'Gb': 'F#',
            'G#': 'Ab', 'Ab': 'G#',
            'A#': 'Bb', 'Bb': 'A#'
        };

        // Generate for octaves 0-8
        for (let octave = 0; octave <= 8; octave++) {
            for (let i = 0; i < 12; i++) {
                const midi = octave * 12 + i;
                const noteName = notes[i];

                // Primary note name
                if (noteName.length === 1 || noteName.includes('#')) {
                    const noteStr = noteName + octave;
                    map.set(noteStr, midi);
                }

                // Enharmonic equivalent
                if (noteName.includes('#') || noteName.includes('b')) {
                    const noteStr = noteName + octave;
                    map.set(noteStr, midi);
                }
            }
        }

        // Add specific commonly used notes
        const commonNotes = {
            'C2': 36, 'D2': 38, 'E2': 40, 'F2': 41, 'G2': 43, 'A2': 45, 'B2': 47,
            'C3': 48, 'D3': 50, 'E3': 52, 'F3': 53, 'G3': 55, 'A3': 57, 'B3': 59,
            'C4': 60, 'D4': 62, 'E4': 64, 'F4': 65, 'G4': 67, 'A4': 69, 'B4': 71,
            'C5': 72, 'D5': 74, 'E5': 76, 'F5': 77, 'G5': 79, 'A5': 81, 'B5': 83,
            'C6': 84, 'D6': 86, 'E6': 88, 'F6': 89, 'G6': 91, 'A6': 93, 'B6': 95
        };

        Object.entries(commonNotes).forEach(([note, midi]) => {
            map.set(note, midi);
        });

        return map;
    }

    /**
     * Parse note with microtone support
     */
    parseNote(noteStr) {
        if (!noteStr) return null;

        // Handle microtone notation (e.g., "C4+15cents")
        const microtoneMatch = noteStr.match(/^([A-G][#b]?\d)([-+]\d+)cents?$/);
        if (microtoneMatch) {
            const baseNote = microtoneMatch[1];
            const cents = parseInt(microtoneMatch[2]);
            const baseMidi = this.midiMap.get(baseNote);

            if (baseMidi !== undefined) {
                return {
                    note: noteStr,
                    midi: baseMidi + (cents / 100),
                    baseNote: baseNote,
                    microtone: cents
                };
            }
        }

        // Standard note
        const midi = this.midiMap.get(noteStr);
        if (midi !== undefined) {
            return {
                note: noteStr,
                midi: midi,
                baseNote: noteStr,
                microtone: 0
            };
        }

        return null;
    }

    /**
     * Analyze song and generate optimal string configuration
     */
    analyzeS    /**
     * Analyze song and generate optimal string configuration
     */
    analyzeSong(songData) {
        const cacheKey = this.getCacheKey(songData);

        // Check cache first
        if (this.stringConfigCache.has(cacheKey)) {
            return this.stringConfigCache.get(cacheKey);
        }

        // Extract all unique pitches used in the song
        const pitches = new Set();
        const bentNotes = new Set();

        songData.notes.forEach(note => {
            if (note.pitch && note.pitch !== 'Unknown') {
                if (note.bent) {
                    bentNotes.add(note.pitch);
                } else {
                    pitches.add(note.pitch);
                }
            }
        });

        // Convert to array and sort by MIDI value
        const openStrings = Array.from(pitches).sort((a, b) => {
            const midiA = this.parseNote(a)?.midi || 0;
            const midiB = this.parseNote(b)?.midi || 0;
            return midiA - midiB;
        });

        // Generate string configuration
        const config = this.generateStringConfig(openStrings, bentNotes);

        // Cache the result
        this.stringConfigCache.set(cacheKey, config);

        return config;
    }

    /**
     * Generate cache key for a song
     */
    getCacheKey(songData) {
        // Create unique key based on pitches used
        const pitches = songData.notes
            .map(n => n.pitch)
            .filter(p => p)
            .sort()
            .join(',');
        return `song_${pitches.length}_${this.hashCode(pitches)}`;
    }

    /**
     * Simple hash function for cache keys
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Generate string configuration with optimal spacing
     */
    generateStringConfig(openStrings, bentNotes = new Set()) {
        const strings = {};
        const positions = [];
        let currentY = this.layoutConfig.startY;

        openStrings.forEach((pitch, index) => {
            const noteData = this.parseNote(pitch);
            if (!noteData) return;

            // Calculate spacing from previous string
            let spacing = this.layoutConfig.minSpacing;

            if (index > 0) {
                const prevNote = this.parseNote(openStrings[index - 1]);
                if (prevNote) {
                    const interval = noteData.midi - prevNote.midi;

                    // Proportional spacing based on interval
                    spacing = interval * this.layoutConfig.semitoneSpacing;

                    // Add bonus for octave jumps
                    if (interval >= 12) {
                        spacing += this.layoutConfig.octaveBonus;
                    }

                    // Apply constraints
                    spacing = Math.max(this.layoutConfig.minSpacing,
                                     Math.min(this.layoutConfig.maxSpacing, spacing));
                }
            }

            // Determine string number (traditional Dan Tranh numbering)
            const stringNum = this.getTraditionalStringNumber(pitch, index);

            // Add to configuration
            strings[stringNum] = {
                note: pitch,
                yPos: currentY,
                midiValue: noteData.midi,
                index: index,
                stringNum: stringNum
            };

            positions.push({
                string: stringNum,
                note: pitch,
                y: currentY,
                midi: noteData.midi,
                intervalFromPrevious: index > 0 ?
                    noteData.midi - this.parseNote(openStrings[index - 1]).midi : 0
            });

            currentY += spacing;
        });

        return {
            strings: strings,
            positions: positions,
            openStrings: openStrings,
            bentNotes: Array.from(bentNotes),
            stringCount: openStrings.length,
            totalHeight: currentY,
            pitchRange: {
                lowest: openStrings[0],
                highest: openStrings[openStrings.length - 1]
            }
        };
    }

    /**
     * Get traditional Dan Tranh string number
     */
    getTraditionalStringNumber(pitch, index) {
        // Traditional mapping based on pitch
        const traditionalMap = {
            'C2': 1, 'D2': 2, 'E2': 3, 'F2': 3, 'G2': 4, 'A2': 4, 'B2': 5,
            'C3': 5, 'D3': 5, 'E3': 6, 'F3': 6, 'G3': 7, 'A3': 8, 'B3': 8,
            'C4': 5, 'D4': 5, 'E4': 6, 'F4': 6, 'G4': 7, 'A4': 8, 'B4': 8,
            'C5': 9, 'D5': 10, 'E5': 11, 'F5': 12, 'G5': 12, 'A5': 13, 'B5': 14,
            'C6': 15, 'D6': 16, 'E6': 17, 'F6': 18, 'G6': 19, 'A6': 20, 'B6': 21
        };

        return traditionalMap[pitch] || (index + 5); // Default to index + 5
    }

    /**
     * Find position for a note (with bending if needed)
     */
    findNotePosition(pitch, stringConfig) {
        const noteData = this.parseNote(pitch);
        if (!noteData) return null;

        // Check if it's on an open string
        for (const [stringNum, config] of Object.entries(stringConfig.strings)) {
            if (config.note === pitch) {
                return {
                    string: parseInt(stringNum),
                    y: config.yPos,
                    requiresBending: false,
                    exact: true
                };
            }
        }

        // Find surrounding strings for bending
        let lowerString = null;
        let upperString = null;

        for (const config of stringConfig.positions) {
            if (config.midi < noteData.midi) {
                lowerString = config;
            } else if (config.midi > noteData.midi && !upperString) {
                upperString = config;
                break;
            }
        }

        if (!lowerString) {
            // Note is below all strings
            return null;
        }

        let y, bendInfo;

        if (upperString) {
            // Interpolate between two strings
            const totalInterval = upperString.midi - lowerString.midi;
            const noteInterval = noteData.midi - lowerString.midi;
            const ratio = noteInterval / totalInterval;

            y = lowerString.y + (upperString.y - lowerString.y) * ratio;

            bendInfo = {
                fromString: lowerString.string,
                fromY: lowerString.y,
                semitones: noteInterval,
                ratio: ratio
            };
        } else {
            // Note is above all strings - extrapolate
            const semitones = noteData.midi - lowerString.midi;
            y = lowerString.y + (semitones * this.layoutConfig.semitoneSpacing);

            bendInfo = {
                fromString: lowerString.string,
                fromY: lowerString.y,
                semitones: semitones,
                ratio: Math.min(semitones / 12, 1) // Cap at 1 octave
            };
        }

        return {
            string: lowerString.string,
            y: y,
            requiresBending: true,
            bendInfo: bendInfo
        };
    }

    /**
     * Batch process multiple songs efficiently
     */
    batchAnalyzeSongs(songs) {
        const results = new Map();

        songs.forEach((song, index) => {
            // Process with progress callback
            if (index % 100 === 0) {
                console.log(`Processing song ${index + 1} of ${songs.length}...`);
            }

            const config = this.analyzeSong(song);
            results.set(song.id || song.title, config);
        });

        console.log(`✅ Processed ${songs.length} songs`);
        console.log(`📊 Cache size: ${this.stringConfigCache.size} configurations`);

        return results;
    }

    /**
     * Get statistics for all processed songs
     */
    getStatistics() {
        const stats = {
            totalConfigurations: this.stringConfigCache.size,
            stringCounts: new Map(),
            commonPitches: new Map(),
            averageStringCount: 0
        };

        let totalStrings = 0;

        this.stringConfigCache.forEach(config => {
            // Count string configurations
            const count = config.stringCount;
            stats.stringCounts.set(count, (stats.stringCounts.get(count) || 0) + 1);
            totalStrings += count;

            // Count pitch usage
            config.openStrings.forEach(pitch => {
                stats.commonPitches.set(pitch, (stats.commonPitches.get(pitch) || 0) + 1);
            });
        });

        stats.averageStringCount = totalStrings / this.stringConfigCache.size;

        // Sort common pitches by frequency
        stats.mostCommonPitches = Array.from(stats.commonPitches.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);

        return stats;
    }

    /**
     * Clear cache (useful for memory management with 1300+ songs)
     */
    clearCache() {
        this.stringConfigCache.clear();
        console.log('✅ String configuration cache cleared');
    }

    /**
     * Export configuration for persistence
     */
    exportCache() {
        return {
            version: '2.0',
            timestamp: new Date().toISOString(),
            configurations: Array.from(this.stringConfigCache.entries()),
            statistics: this.getStatistics()
        };
    }

    /**
     * Import saved configurations
     */
    importCache(data) {
        if (data.version !== '2.0') {
            console.warn('⚠️ Cache version mismatch');
        }

        data.configurations.forEach(([key, config]) => {
            this.stringConfigCache.set(key, config);
        });

        console.log(`✅ Imported ${data.configurations.length} configurations`);
    }
}

// Singleton instance
const stringEngine = new DynamicStringEngine();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicStringEngine;
} else {
    window.DynamicStringEngine = DynamicStringEngine;
    window.stringEngine = stringEngine;
}

console.log('🎵 Dynamic String Engine v2.0 loaded');
console.log('📚 Ready to process 1300+ songs efficiently');