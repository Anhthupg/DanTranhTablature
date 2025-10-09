// Script to extract complete note sequence from analysis data
const analysisData = {"kpic_patterns": {"full": {"kpic-2": [{"pattern": ["C5", "C5"], "count": 16, "positions": [0, 1, 15, 32, 45, 46, 47, 56, 75, 88, 89, 90, 103, 120, 133, 134], "analysis_mode": "full"}, {"pattern": ["A4", "C5"], "count": 14, "positions": [7, 14, 25, 35, 44, 53, 58, 68, 78, 87, 102, 113, 123, 132], "analysis_mode": "full"}, {"pattern": ["C5", "A4"], "count": 14, "positions": [13, 24, 26, 38, 43, 57, 67, 69, 81, 86, 100, 112, 114, 131], "analysis_mode": "full"}, {"pattern": ["C5", "D5"], "count": 10, "positions": [2, 8, 16, 48, 54, 59, 91, 98, 104, 106], "analysis_mode": "full"}, {"pattern": ["D5", "E5"], "count": 10, "positions": [3, 10, 17, 19, 21, 49, 60, 92, 107, 109], "analysis_mode": "full"}, {"pattern": ["E5", "D5"], "count": 9, "positions": [11, 18, 20, 22, 61, 65, 96, 108, 110], "analysis_mode": "full"}, {"pattern": ["D5", "C5"], "count": 9, "positions": [12, 23, 55, 62, 66, 97, 99, 105, 111], "analysis_mode": "full"}, {"pattern": ["G4", "C5"], "count": 8, "positions": [31, 37, 42, 74, 80, 85, 119, 130], "analysis_mode": "full"}, {"pattern": ["A4", "G4"], "count": 6, "positions": [27, 39, 70, 82, 115, 127], "analysis_mode": "full"}, {"pattern": ["C5", "G4"], "count": 6, "positions": [33, 36, 76, 79, 121, 124], "analysis_mode": "full"}]}};

const graceNoteIndices = [3, 10, 19, 21, 49, 51, 60, 92, 94, 107, 109];

function getPitchFromAnalysisData(noteIndex) {
    if (typeof analysisData === 'undefined' || !analysisData.kpic_patterns || !analysisData.kpic_patterns.full) {
        return 'C5';
    }
    for (const [kpicKey, patterns] of Object.entries(analysisData.kpic_patterns.full)) {
        for (const pattern of patterns) {
            const positions = pattern.positions;
            const patternNotes = pattern.pattern;
            for (let i = 0; i < positions.length; i++) {
                const startPos = positions[i];
                for (let j = 0; j < patternNotes.length; j++) {
                    if (startPos + j === noteIndex) {
                        let pitch = patternNotes[j];
                        // Add grace note prefix if this is a grace note
                        if (graceNoteIndices.includes(noteIndex)) {
                            pitch = 'g' + pitch;
                        }
                        return pitch;
                    }
                }
            }
        }
    }
    return 'C5';
}

// Extract complete note sequence
const noteSequence = [];
for (let i = 0; i < 189; i++) {
    const pitch = getPitchFromAnalysisData(i);
    const isGrace = graceNoteIndices.includes(i);
    noteSequence.push({
        index: i,
        pitch: pitch,
        isGrace: isGrace
    });
}

console.log('Complete Note Sequence (0-188):');
console.log('================================');

// Print in groups of 10 for readability
for (let i = 0; i < noteSequence.length; i += 10) {
    const chunk = noteSequence.slice(i, i + 10);
    const display = chunk.map(note => `${note.index}:${note.pitch}${note.isGrace ? '(g)' : ''}`).join(' ');
    console.log(`${i.toString().padStart(3)}-${Math.min(i+9, noteSequence.length-1).toString().padEnd(3)}: ${display}`);
}

// Now analyze the 3-section structure
console.log('\n\nStructural Analysis:');
console.log('===================');

const motifPositions = [0, 46, 89];
const signaturePositions = [22, 65, 110];

console.log('\n7-note Opening Motif positions:', motifPositions);
motifPositions.forEach((pos, i) => {
    const motif = noteSequence.slice(pos, pos + 7);
    const motifStr = motif.map(n => n.pitch).join('-');
    console.log(`Section ${i+1} Motif (${pos}-${pos+6}): ${motifStr}`);
});

console.log('\n16-note Signature Phrase positions:', signaturePositions);
signaturePositions.forEach((pos, i) => {
    const signature = noteSequence.slice(pos, pos + 16);
    const sigStr = signature.map(n => n.pitch).join('-');
    console.log(`Section ${i+1} Signature (${pos}-${pos+15}): ${sigStr}`);
});

// Define section boundaries
const sections = [
    { name: 'Section 1', start: 0, end: 45, length: 46 },
    { name: 'Section 2', start: 46, end: 88, length: 43 },
    { name: 'Section 3', start: 89, end: 131, length: 43 },
    { name: 'Truncated 4th', start: 132, end: 188, length: 57 }
];

console.log('\nSection Analysis:');
sections.forEach(section => {
    const sectionNotes = noteSequence.slice(section.start, section.end + 1);
    const pitches = sectionNotes.map(n => n.pitch).join('-');
    console.log(`\n${section.name} (notes ${section.start}-${section.end}, ${section.length} notes):`);
    console.log(`  Pitches: ${pitches}`);
});

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { noteSequence, sections, motifPositions, signaturePositions };
}