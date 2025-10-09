// Vertical Header Demo Server - Dedicated server for vertical layout
const express = require('express');
const path = require('path');
const fs = require('fs');
const TablatureGenerator = require('./generate-tablature');

const app = express();
const port = 3006; // Vertical demo on port 3006

// Create tablature generator instance
const tablatureGen = new TablatureGenerator();

// Serve the vertical header template
app.get('/', (req, res) => {
    const verticalTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'v4-vertical-header-sections-annotated.html'), 'utf8');

    // Generate tablatures for different tuning systems
    const optimalResult = tablatureGen.generateDemoTablature('C-D-E-G-A');
    const alt1Result = tablatureGen.generateDemoTablature('C-D-F-G-A');
    const alt2Result = tablatureGen.generateDemoTablature('C-D-E-G-Bb');
    const alt3Result = tablatureGen.generateDemoTablature('C-Eb-F-G-Bb');

    // Extract just the inner SVG content (without the outer <svg> tags)
    const extractSvgContent = (svgString) => {
        const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
        return match ? match[1] : svgString;
    };

    // Replace placeholders with generated tablature data
    const populatedTemplate = verticalTemplate
        .replace(/{{SONG_NAME}}/g, 'Lý Chiều Chiều')
        .replace(/{{SVG_WIDTH}}/g, '2000')
        .replace(/{{SVG_HEIGHT}}/g, '600')
        .replace(/{{OPTIMAL_SVG_CONTENT}}/g, extractSvgContent(optimalResult.svg))
        .replace(/{{COMPARISON_SVG_CONTENT}}/g, extractSvgContent(alt1Result.svg))
        .replace(/{{UNIQUE_PITCHES}}/g, '5')
        .replace(/{{PITCH_RANGE}}/g, '17')
        .replace(/{{ASCENDING_PERCENTAGE}}/g, '34.2')
        .replace(/{{TONE_NGANG_PERCENTAGE}}/g, '23.5')
        .replace(/{{TONE_NGA_PERCENTAGE}}/g, '12.5')
        .replace(/{{TONE_MELODY_CORRELATION}}/g, '78.4')
        .replace(/{{MELISMA_COUNT}}/g, '8')
        .replace(/{{GRACE_PERCENTAGE}}/g, '14.0');

    res.send(populatedTemplate);
});

// Serve static files for any additional resources
app.use('/static', express.static(path.join(__dirname, 'templates')));

// Serve the client-side tablature generator
app.get('/static/client-tablature-generator.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client-tablature-generator.js'));
});

app.listen(port, () => {
    console.log(`🚀 Vertical Header Demo Server running on http://localhost:${port}`);
    console.log(`📋 Features:`);
    console.log(`   • Vertical headers (80px left panels)`);
    console.log(`   • Move arrows (▲ ▼) in vertical layout`);
    console.log(`   • Metric cards with cross-highlighting`);
    console.log(`   • Complete UI terminology annotations`);
    console.log(`   • Interactive tablature with data attributes`);
    console.log(`\n✨ Perfect for your 100+ metrics statistical analysis!`);
});

module.exports = app;