#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the existing generation logic
const generateViewerModule = require('./generate-viewer.js');

// Load song list
const songList = JSON.parse(fs.readFileSync('./data/song-list.json', 'utf8'));

// Find "Cô nói sao" song data
const song = songList.find(s => s.name === 'Cô nói sao');
if (!song) {
    console.error('❌ Song "Cô nói sao" not found');
    process.exit(1);
}

console.log('📝 Generating tuning variants for:', song.title);

// Define tuning variants to generate
const tuningVariants = [
    { name: 'optimal', tuning: song.tuning, suffix: '' },
    { name: 'pentatonic', tuning: ['C', 'D', 'E', 'G', 'A'], suffix: '_pentatonic' },
    { name: 'experimental', tuning: ['D', 'F', 'G', 'A', 'C'], suffix: '_experimental' },
    { name: 'chromatic', tuning: ['A', 'C', 'D', 'E', 'G'], suffix: '_chromatic' }
];

// Generate each tuning variant
tuningVariants.forEach(variant => {
    console.log(`\n🎵 Generating ${variant.name} tuning: ${variant.tuning.join('-')}`);

    // Create modified song data with new tuning
    const modifiedSong = {
        ...song,
        tuning: variant.tuning,
        title: song.title + (variant.suffix ? ` (${variant.name})` : '')
    };

    // Generate viewer with custom tuning
    try {
        generateViewerModule.generateViewer(modifiedSong);

        // If suffix provided, copy the file with suffix name
        if (variant.suffix) {
            const originalPath = `./data/processed/${encodeURIComponent(song.title)}/viewer.html`;
            const variantPath = `./data/processed/${encodeURIComponent(song.title)}/viewer${variant.suffix}.html`;

            if (fs.existsSync(originalPath)) {
                fs.copyFileSync(originalPath, variantPath);
                console.log(`✅ Created: ${variantPath}`);
            }
        } else {
            console.log(`✅ Generated optimal tuning viewer`);
        }

    } catch (error) {
        console.error(`❌ Failed to generate ${variant.name} tuning:`, error.message);
    }
});

console.log('\n🎉 Tuning variant generation complete!');
console.log('\n📋 Available files:');
console.log('   • viewer.html (optimal tuning)');
console.log('   • viewer_pentatonic.html');
console.log('   • viewer_experimental.html');
console.log('   • viewer_chromatic.html');