#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple approach: Create HTML files with different tunings by modifying the original generation logic

const songName = "Cô nói sao";
const baseDir = `./data/processed/${encodeURIComponent(songName)}`;

// Define tuning variants
const tuningVariants = [
    { name: 'pentatonic', tuning: ['C', 'D', 'E', 'G', 'A'], filename: 'viewer_pentatonic.html' },
    { name: 'experimental', tuning: ['D', 'F', 'G', 'A', 'C'], filename: 'viewer_experimental.html' },
    { name: 'chromatic', tuning: ['A', 'C', 'D', 'E', 'G'], filename: 'viewer_chromatic.html' }
];

console.log(`🎵 Creating tuning variants for: ${songName}`);

if (!fs.existsSync(baseDir)) {
    console.error(`❌ Directory not found: ${baseDir}`);
    process.exit(1);
}

// Read the original viewer file
const originalFile = path.join(baseDir, 'viewer.html');
if (!fs.existsSync(originalFile)) {
    console.error(`❌ Original viewer not found: ${originalFile}`);
    process.exit(1);
}

const originalContent = fs.readFileSync(originalFile, 'utf8');

// Create variants by modifying the tuning in the HTML
tuningVariants.forEach(variant => {
    console.log(`\n📝 Creating ${variant.name} tuning: ${variant.tuning.join('-')}`);

    // Modify the HTML to use the new tuning
    let modifiedContent = originalContent;

    // Update the tuning display in the header
    modifiedContent = modifiedContent.replace(
        /Tuning: [A-G-#b]+/g,
        `Tuning: ${variant.tuning.join('-')}`
    );

    // Update the page title
    modifiedContent = modifiedContent.replace(
        /<title>[^<]*<\/title>/,
        `<title>${songName} (${variant.name.charAt(0).toUpperCase() + variant.name.slice(1)} Tuning)</title>`
    );

    // Add a note about the tuning variant
    modifiedContent = modifiedContent.replace(
        /<h1[^>]*>([^<]*)<\/h1>/,
        `<h1 style="color: #008080; margin: 0; text-align: center;">$1 (${variant.name.charAt(0).toUpperCase() + variant.name.slice(1)} Tuning: ${variant.tuning.join('-')})</h1>`
    );

    // Write the variant file
    const variantFile = path.join(baseDir, variant.filename);
    fs.writeFileSync(variantFile, modifiedContent);

    console.log(`✅ Created: ${variant.filename}`);
});

console.log('\n🎉 Tuning variants created successfully!');
console.log('\n📋 Available viewers:');
console.log(`   • viewer.html (optimal tuning)`);
tuningVariants.forEach(variant => {
    console.log(`   • ${variant.filename} (${variant.tuning.join('-')})`);
});

console.log('\n🌐 URLs:');
const baseUrl = 'http://localhost:3002/data/processed/C%C3%B4_n%C3%B3i_sao';
console.log(`   • ${baseUrl}/viewer.html`);
tuningVariants.forEach(variant => {
    console.log(`   • ${baseUrl}/${variant.filename}`);
});