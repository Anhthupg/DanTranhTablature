/**
 * V4.2.37: Update Optimal Tunings for All Songs
 *
 * Analyzes all songs in the relationships directory and updates their
 * metadata with the calculated optimal tuning (fewest bent notes).
 */

const fs = require('fs');
const path = require('path');
const tuningOptimizer = require('./utils/tuning-optimizer');

const RELATIONSHIPS_DIR = path.join(__dirname, 'data', 'relationships');

function updateAllOptimalTunings() {
    console.log('🎵 V4.2.37: Analyzing Optimal Tunings for All Songs\n');

    // Get all relationship files
    const files = fs.readdirSync(RELATIONSHIPS_DIR)
        .filter(f => f.endsWith('-relationships.json'));

    console.log(`Found ${files.length} songs to analyze\n`);

    let updated = 0;
    let alreadyOptimal = 0;
    let errors = 0;

    const results = [];

    for (const file of files) {
        const filePath = path.join(RELATIONSHIPS_DIR, file);
        const songName = file.replace('-relationships.json', '');

        try {
            // Load relationships data
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!data.notes || data.notes.length === 0) {
                console.log(`⚠️  ${songName}: No notes found, skipping`);
                continue;
            }

            // Convert notes to format expected by optimizer
            const notes = data.notes.map(note => ({
                step: note.pitch?.step || 'C',
                octave: note.pitch?.octave || 4,
                isGrace: note.isGrace || false
            }));

            // Calculate optimal tuning
            const result = tuningOptimizer.findOptimalTuning(notes);

            // Get current tuning
            const currentTuning = data.metadata?.optimalTuning;

            // Store result
            results.push({
                song: songName,
                current: currentTuning || 'none',
                optimal: result.optimal,
                bentNotes: result.bentNotes,
                changed: currentTuning !== result.optimal
            });

            // Update metadata if different or missing
            if (!currentTuning || currentTuning !== result.optimal) {
                if (!data.metadata) {
                    data.metadata = {};
                }

                data.metadata.optimalTuning = result.optimal;
                data.metadata.optimalBentNotes = result.bentNotes;

                // Write back to file
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

                console.log(`✅ ${songName}`);
                console.log(`   ${currentTuning || 'none'} → ${result.optimal} (${result.bentNotes} bent notes)`);
                updated++;
            } else {
                console.log(`✓  ${songName}: Already optimal (${result.optimal}, ${result.bentNotes} bent)`);
                alreadyOptimal++;
            }

        } catch (error) {
            console.error(`❌ ${songName}: ${error.message}`);
            errors++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total songs analyzed: ${files.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Already optimal: ${alreadyOptimal}`);
    console.log(`Errors: ${errors}`);

    // Show tuning distribution
    console.log('\n' + '='.repeat(80));
    console.log('TUNING DISTRIBUTION');
    console.log('='.repeat(80));

    const tuningCounts = {};
    results.forEach(r => {
        tuningCounts[r.optimal] = (tuningCounts[r.optimal] || 0) + 1;
    });

    Object.entries(tuningCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([tuning, count]) => {
            const percentage = ((count / results.length) * 100).toFixed(1);
            console.log(`${tuning.padEnd(15)} ${count.toString().padStart(3)} songs (${percentage}%)`);
        });

    // Show songs with most bent notes
    console.log('\n' + '='.repeat(80));
    console.log('TOP 10 SONGS WITH MOST BENT NOTES (Even After Optimization)');
    console.log('='.repeat(80));

    results
        .sort((a, b) => b.bentNotes - a.bentNotes)
        .slice(0, 10)
        .forEach((r, i) => {
            console.log(`${(i + 1).toString().padStart(2)}. ${r.song.padEnd(40)} ${r.optimal.padEnd(15)} ${r.bentNotes} bent`);
        });

    // Show songs with zero bent notes
    console.log('\n' + '='.repeat(80));
    console.log('SONGS WITH ZERO BENT NOTES (Perfect Tuning Match)');
    console.log('='.repeat(80));

    const perfectMatches = results.filter(r => r.bentNotes === 0);
    console.log(`Found ${perfectMatches.length} songs with perfect tuning match:\n`);

    perfectMatches.forEach(r => {
        console.log(`   ${r.song.padEnd(40)} ${r.optimal}`);
    });

    console.log('\n✨ All optimal tunings updated!\n');
}

// Run the update
updateAllOptimalTunings();
