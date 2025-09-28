#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load "Cô nói sao" original data
const coNoiSaoDir = './data/processed/Cô_nói_sao';
const metadataFile = path.join(coNoiSaoDir, 'metadata.json');

if (!fs.existsSync(metadataFile)) {
    console.error('❌ Cô nói sao metadata not found');
    process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
console.log('📝 Loaded Cô nói sao data:', metadata.title);

// Load the generation functions
const { generateDanTranhStrings } = require('./generate-viewer.js');

// Define simple pentatonic tuning patterns
const tuningPatterns = [
    { name: 'traditional', tuning: ['C', 'D', 'E', 'G', 'A'], description: 'Traditional Pentatonic' },
    { name: 'minor', tuning: ['A', 'C', 'D', 'E', 'G'], description: 'Minor Pentatonic' },
    { name: 'guitar', tuning: ['C', 'D', 'F', 'G', 'A'], description: 'Guitar-Style' },
    { name: 'modal', tuning: ['D', 'E', 'F', 'A', 'B'], description: 'Modal Variant' },
    { name: 'evening', tuning: ['C', 'Eb', 'F', 'G', 'Bb'], description: 'Evening Scale' },
    { name: 'experimental', tuning: ['D', 'F', 'G', 'A', 'C'], description: 'Experimental' }
];

console.log('\n🎵 Generating Cô nói sao tablatures with different tunings...\n');

tuningPatterns.forEach(pattern => {
    console.log(`📊 ${pattern.description}: ${pattern.tuning.join('-')}`);

    // Create modified song data with new tuning
    const modifiedSong = {
        ...metadata,
        tuning: pattern.tuning,
        title: `Cô nói sao (${pattern.description})`
    };

    // Generate string configuration for this tuning
    const stringConfig = generateDanTranhStrings(pattern.tuning, 'C3', 17);

    console.log(`   - Generated ${Object.keys(stringConfig).length} strings`);
    console.log(`   - Tuning pattern: ${pattern.tuning.join('-')}`);

    // For now, just log what would be generated
    // In a full implementation, this would call the SVG generation logic
    console.log(`   ✅ Would create: viewer_${pattern.name}.html\n`);
});

console.log('🎉 All tuning patterns processed!');
console.log('\n📋 This would create:');
tuningPatterns.forEach(pattern => {
    console.log(`   • viewer_${pattern.name}.html - ${pattern.description} (${pattern.tuning.join('-')})`);
});

console.log('\n💡 Each file would show the same Cô nói sao song with different string tuning systems.');