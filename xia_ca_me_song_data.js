/**
 * Xỉa Cá Mè - Corrected Song Data
 *
 * This song should have 4 unique pitches on 4 strings:
 * - String 5: C4
 * - String 6: F4
 * - String 7: G4
 * - String 9: C5
 *
 * Current issue: Only showing strings 7 and 9
 * Fix: Properly map all 25 notes to their correct strings
 */

const xiaCaMeSongData = {
    title: 'Xỉa Cá Mè',
    composer: 'Vietnamese Folk Song',
    tempo: 120,
    timeSignature: '4/4',

    // Define the 4 strings needed for this song
    openStrings: ['C4', 'F4', 'G4', 'C5'],

    // String mapping for Dan Tranh
    stringMapping: {
        'C4': 5,  // String 5
        'F4': 6,  // String 6
        'G4': 7,  // String 7
        'C5': 9   // String 9
    },

    // All 25 notes with correct pitch assignments
    notes: [
        // Phrase 1: "Xỉa cá Mè. Đè cá Chép."
        { pitch: 'C5', time: 0, duration: 1, lyric: 'Xỉa', string: 9, index: 1 },
        { pitch: 'C5', time: 1, duration: 1, lyric: 'cá', string: 9, index: 2 },
        { pitch: 'C5', time: 2, duration: 1, lyric: 'Mè.', string: 9, index: 3 },
        { pitch: 'C5', time: 3, duration: 1, lyric: 'Đè', string: 9, index: 4 },
        { pitch: 'C5', time: 4, duration: 1, lyric: 'cá', string: 9, index: 5 },
        { pitch: 'C5', time: 5, duration: 1, lyric: 'Chép.', string: 9, index: 6 },

        // Phrase 2: "Chân nào đẹp (thì) đi buôn men."
        { pitch: 'G4', time: 6, duration: 1, lyric: 'Chân', string: 7, index: 7 },
        { pitch: 'F4', time: 7, duration: 0.5, lyric: '', string: 6, index: 8 },
        { pitch: 'C5', time: 7.5, duration: 1, lyric: 'nào', string: 9, index: 9 },
        { pitch: 'C5', time: 8.5, duration: 1, lyric: 'đẹp', string: 9, index: 10 },
        { pitch: 'C5', time: 9.5, duration: 0.5, lyric: '(thì)', string: 9, index: 11 },
        { pitch: 'G4', time: 10, duration: 1, lyric: 'đi', string: 7, index: 12 },
        { pitch: 'G4', time: 11, duration: 1, lyric: 'buôn', string: 7, index: 13 },
        { pitch: 'G4', time: 12, duration: 1, lyric: 'men.', string: 7, index: 14 },
        { pitch: 'F4', time: 13, duration: 0.5, lyric: '', string: 6, index: 15 },

        // Phrase 3: "Chân nào đen (thì)"
        { pitch: 'G4', time: 13.5, duration: 1, lyric: 'Chân', string: 7, index: 16 },
        { pitch: 'C5', time: 14.5, duration: 1, lyric: 'nào', string: 9, index: 17 },
        { pitch: 'C4', time: 15.5, duration: 0.5, lyric: '', string: 5, index: 18 },
        { pitch: 'G4', time: 16, duration: 1, lyric: 'đen', string: 7, index: 19 },
        { pitch: 'C5', time: 17, duration: 1, lyric: '(thì)', string: 9, index: 20 },

        // Final notes
        { pitch: 'C5', time: 18, duration: 0.5, lyric: '', string: 9, index: 21 },
        { pitch: 'F4', time: 18.5, duration: 0.5, lyric: '', string: 6, index: 22 },
        { pitch: 'C4', time: 19, duration: 0.5, lyric: '', string: 5, index: 23 },
        { pitch: 'G4', time: 19.5, duration: 0.5, lyric: '', string: 7, index: 24 },
        { pitch: 'C5', time: 20, duration: 1, lyric: '', string: 9, index: 25 }
    ],

    // Lyrics with note mappings
    lyrics: [
        { text: 'Xỉa', noteIndex: 0, string: 9 },
        { text: 'cá', noteIndex: 1, string: 9 },
        { text: 'Mè.', noteIndex: 2, string: 9 },
        { text: 'Đè', noteIndex: 3, string: 9 },
        { text: 'cá', noteIndex: 4, string: 9 },
        { text: 'Chép.', noteIndex: 5, string: 9 },
        { text: 'Chân', noteIndex: 6, string: 7 },
        { text: '', noteIndex: 7, string: 6 },
        { text: 'nào', noteIndex: 8, string: 9 },
        { text: 'đẹp', noteIndex: 9, string: 9 },
        { text: '(thì)', noteIndex: 10, string: 9 },
        { text: 'đi', noteIndex: 11, string: 7 },
        { text: 'buôn', noteIndex: 12, string: 7 },
        { text: 'men.', noteIndex: 13, string: 7 },
        { text: '', noteIndex: 14, string: 6 },
        { text: 'Chân', noteIndex: 15, string: 7 },
        { text: 'nào', noteIndex: 16, string: 9 },
        { text: '', noteIndex: 17, string: 5 },
        { text: 'đen', noteIndex: 18, string: 7 },
        { text: '(thì)', noteIndex: 19, string: 9 }
    ],

    // Song analysis
    analysis: {
        totalNotes: 25,
        uniquePitches: 4,
        pitchList: ['C4', 'F4', 'G4', 'C5'],
        stringsUsed: [5, 6, 7, 9],
        stringCount: 4,
        patterns: 10,
        efficiency: '10 patterns → 25 notes'
    },

    // Display settings
    displaySettings: {
        xZoom: 0.38,  // 38% zoom
        yZoom: 1.41,  // 141% zoom
        showLyrics: true,
        showStringNumbers: true,
        highlightPatterns: true
    }
};

// Function to integrate with existing system
function fixXiaCaMeStrings() {
    // Update the dynamic string configuration
    if (window.dynamicStringConfig) {
        // Ensure all 4 strings are defined
        window.dynamicStringConfig = {
            ...window.dynamicStringConfig,
            5: { note: 'C4', yPos: 85, midiValue: 60 },   // String 5
            6: { note: 'F4', yPos: 145, midiValue: 65 },  // String 6
            7: { note: 'G4', yPos: 265, midiValue: 67 },  // String 7
            9: { note: 'C5', yPos: 415, midiValue: 72 }   // String 9
        };
    }

    // Return the corrected song data
    return xiaCaMeSongData;
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { xiaCaMeSongData, fixXiaCaMeStrings };
} else {
    window.xiaCaMeSongData = xiaCaMeSongData;
    window.fixXiaCaMeStrings = fixXiaCaMeStrings;
}

// Auto-fix on load if in browser environment
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check if this is the Xỉa Cá Mè page
        const songTitle = document.querySelector('#songTitle, .song-title, h1');
        if (songTitle && songTitle.textContent.includes('Xỉa Cá Mè')) {
            console.log('🎵 Fixing Xỉa Cá Mè string configuration...');
            const fixedData = fixXiaCaMeStrings();
            console.log('✅ Fixed: Now showing', fixedData.analysis.stringCount, 'strings');

            // Dispatch event for other systems to update
            window.dispatchEvent(new CustomEvent('songDataFixed', {
                detail: fixedData
            }));
        }
    });
}