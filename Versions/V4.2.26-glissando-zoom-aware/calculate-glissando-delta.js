/**
 * Calculate X delta for first priority glissando to apply to first note
 */

const fs = require('fs');
const path = require('path');

const songFile = 'b_r.json';
const songPath = path.join(__dirname, 'data', 'processed', songFile);

// Read song data
const songData = JSON.parse(fs.readFileSync(songPath, 'utf8'));

// Find first priority candidate (longest duration, note #5)
const firstPriorityNote = songData.notes.find(n => n.index === 5);
const firstPriorityTarget = songData.notes.find(n => n.index === 7); // Following note

// Find first note and its target
const firstNote = songData.notes.find(n => n.index === 1);
const firstNoteTarget = songData.notes.find(n => n.index === 2);

if (firstPriorityNote && firstPriorityTarget) {
    console.log('\n=== FIRST PRIORITY GLISSANDO (Note #5 → #7) ===');
    console.log(`Candidate: ${firstPriorityNote.pitch} (${firstPriorityNote.duration} beats) - "${firstPriorityNote.lyric}"`);
    console.log(`Target: ${firstPriorityTarget.pitch} - "${firstPriorityTarget.lyric}"`);
    
    // Calculate X positions (using standard spacing: duration * 85px per beat)
    const spacing = 85;
    let currentX = 150; // Starting X position
    
    // Calculate positions for all notes up to note #7
    const note1X = currentX; // Note #1
    currentX += firstNote.duration * spacing; // 2 * 85 = 170
    
    const note2X = currentX; // Note #2
    currentX += songData.notes.find(n => n.index === 2).duration * spacing;
    
    const note3X = currentX; // Note #3
    currentX += songData.notes.find(n => n.index === 3).duration * spacing;
    
    // Note #4 is grace note
    const note4X = currentX + (1 * 85 / 4); // Grace notes use 1/4 duration spacing
    
    const note5X = currentX + (1 * 85 / 4) + 12; // After grace note + grace radius
    const note7X = note5X + (firstPriorityNote.duration * spacing);
    
    const firstPriorityDeltaX = note7X - note5X;
    const firstPriorityMidwayX = note5X + (firstPriorityDeltaX * 0.5);
    
    console.log(`Note #5 X: ${note5X.toFixed(1)}px`);
    console.log(`Note #7 X: ${note7X.toFixed(1)}px`);
    console.log(`Delta X: ${firstPriorityDeltaX.toFixed(1)}px`);
    console.log(`Glissando starts at: ${firstPriorityMidwayX.toFixed(1)}px (midway)`);
    
    console.log('\n=== FIRST NOTE GLISSANDO (Note #1 → #2) ===');
    console.log(`Candidate: ${firstNote.pitch} (${firstNote.duration} beats) - "${firstNote.lyric}"`);
    console.log(`Target: ${firstNoteTarget.pitch} - "${firstNoteTarget.lyric}"`);
    
    const note1TargetDeltaX = note2X - note1X;
    const note1MidwayX = note1X + (note1TargetDeltaX * 0.5);
    
    console.log(`Note #1 X: ${note1X.toFixed(1)}px`);
    console.log(`Note #2 X: ${note2X.toFixed(1)}px`);
    console.log(`Current Delta X: ${note1TargetDeltaX.toFixed(1)}px`);
    console.log(`Current Glissando starts at: ${note1MidwayX.toFixed(1)}px (midway)`);
    
    console.log('\n=== APPLYING FIRST PRIORITY DELTA ===');
    const newNote1GlissandoStartX = note1X + (firstPriorityDeltaX * 0.5);
    const newNote1TargetX = note1X + firstPriorityDeltaX;
    
    console.log(`New Delta X for Note #1: ${firstPriorityDeltaX.toFixed(1)}px (same as first priority)`);
    console.log(`New Glissando starts at: ${newNote1GlissandoStartX.toFixed(1)}px`);
    console.log(`New Target X: ${newNote1TargetX.toFixed(1)}px`);
    
    console.log('\n✓ First note glissando will use same X delta as first priority glissando');
}
