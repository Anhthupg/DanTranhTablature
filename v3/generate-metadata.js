const fs = require('fs');
const path = require('path');

const processedDir = path.join(__dirname, 'data', 'processed');

// Get all directories
const dirs = fs.readdirSync(processedDir).filter(file => {
    const fullPath = path.join(processedDir, file);
    return fs.statSync(fullPath).isDirectory();
});

console.log(`Processing ${dirs.length} songs...`);

dirs.forEach(dir => {
    const dirPath = path.join(processedDir, dir);
    const relationshipsPath = path.join(dirPath, 'relationships.json');
    const metadataPath = path.join(dirPath, 'metadata.json');

    if (fs.existsSync(relationshipsPath)) {
        try {
            const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

            // Extract pitch classes and count frequencies
            const pitchCounts = {};
            let usedStrings = new Set();
            let bentNotes = 0;

            relationships.notes.forEach(note => {
                if (!note.isGrace) {
                    const pitchClass = note.pitch.pitchClass;
                    pitchCounts[pitchClass] = (pitchCounts[pitchClass] || 0) + 1;
                }
            });

            // Get top 5 most frequent pitch classes for tuning
            const sortedPitches = Object.entries(pitchCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([pitch]) => pitch)
                .sort(); // Alphabetical order

            // Create tuning string
            const tuning = sortedPitches.join('-');

            // Count bent notes (notes not in tuning)
            relationships.notes.forEach(note => {
                if (!note.isGrace) {
                    if (!sortedPitches.includes(note.pitch.pitchClass)) {
                        bentNotes++;
                    }
                }
            });

            // Estimate strings used (unique pitch classes)
            const uniquePitches = new Set();
            relationships.notes.forEach(note => {
                if (!note.isGrace) {
                    uniquePitches.add(note.pitch.fullNote);
                }
            });
            const stringsUsed = uniquePitches.size;

            // Create metadata object
            const metadata = {
                songName: relationships.metadata.songName,
                totalNotes: relationships.metadata.totalNotes,
                mainNotes: relationships.metadata.mainNotes,
                graceNotes: relationships.metadata.graceNotes,
                tuning: tuning,
                stringsUsed: stringsUsed,
                bentNotes: bentNotes,
                bentPercentage: Math.round((bentNotes / relationships.metadata.mainNotes) * 100),
                uniquePatterns: Math.ceil(relationships.metadata.mainNotes / 4), // Rough estimate
                region: detectRegion(dir)
            };

            // Write metadata file
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
            console.log(`✅ ${dir}: ${metadata.totalNotes} notes, tuning: ${tuning}`);

        } catch (e) {
            console.error(`❌ Error processing ${dir}:`, e.message);
        }
    } else {
        console.log(`⚠️ ${dir}: No relationships.json found`);
    }
});

function detectRegion(name) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('bắc') || nameLower.includes('hà tĩnh')) return 'Northern';
    if (nameLower.includes('nam') || nameLower.includes('đồng tháp')) return 'Southern';
    if (nameLower.includes('trung') || nameLower.includes('quảng') || nameLower.includes('huế')) return 'Central';
    if (nameLower.includes('highland')) return 'Highland';
    return 'Unknown';
}

console.log('\n✅ Metadata generation complete!');