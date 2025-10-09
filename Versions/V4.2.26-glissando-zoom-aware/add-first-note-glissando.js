/**
 * Add glissando to the first note of Bà Rằng Bà Rí
 * Uses first priority glissando format
 */

const fs = require('fs');
const path = require('path');

const songFile = 'b_r.json';
const songPath = path.join(__dirname, 'data', 'processed', songFile);

// Read song data
const songData = JSON.parse(fs.readFileSync(songPath, 'utf8'));

// Add glissando marker to note #1
const firstNote = songData.notes.find(n => n.index === 1);

if (firstNote) {
    // Add glissando property (first priority format)
    firstNote.hasGlissando = true;
    firstNote.glissandoType = 'first-priority';  // Same format as top candidate
    firstNote.glissandoDuration = firstNote.duration;
    firstNote.isDotted = false;  // Not dotted, so midway start position
    
    console.log(`✓ Added glissando to Note #1 (${firstNote.pitch} - "${firstNote.lyric}")`);
    console.log(`  Duration: ${firstNote.duration} beats`);
    console.log(`  Type: First priority format (midway start, edgemost string)`);
    
    // Save updated data
    fs.writeFileSync(songPath, JSON.stringify(songData, null, 2));
    console.log(`✓ Saved updated song data to ${songPath}`);
} else {
    console.error('❌ Could not find note #1');
}
