/**
 * Generate Dual-Panel Viewer with Vietnamese Lyrics Integration
 * Uses the enhanced template with interactive learning features
 */

const fs = require('fs');
const path = require('path');

// Load the original generator class
const OriginalGenerator = require('./generate-dual-panel-viewer.js');

class LyricsEnabledGenerator extends OriginalGenerator {
    constructor() {
        super();
    }

    /**
     * Generate HTML using template with lyrics integration
     */
    generateDualPanelHTML(relationshipData) {
        const songName = relationshipData.metadata.songName;
        const notes = relationshipData.notes;

        // Get original tuning from metadata
        const originalTuning = relationshipData.metadata.tuning ?
            relationshipData.metadata.tuning.split('-') :
            ['C', 'D', 'E', 'G', 'A']; // Default pentatonic if not specified

        // Get all available tunings from loaded tuning systems
        const tuningSystems = this.tuningSystems;

        // Load lyrics data helper
        const lyricsHelper = require('./lyrics-data-helper.js');
        const lyricsData = lyricsHelper.extractLyricsData(songName);
        const lyricsVars = lyricsHelper.createLyricsTemplateVars(lyricsData);

        // Generate SVGs for both panels
        const optimalSVG = this.generateTuningSVG(notes, originalTuning, songName, 'optimal');

        // Generate all traditional tuning SVGs for the dropdown
        const traditionalSVGs = {};
        Object.entries(tuningSystems).forEach(([category, tunings]) => {
            tunings.forEach(tuningObj => {
                const tuningNotes = tuningObj.value.split('-');
                traditionalSVGs[tuningObj.value] = this.generateTuningSVG(notes, tuningNotes, songName, 'traditional');
            });
        });

        // Default to C-D-E-G-A for initial display
        const defaultTraditionalTuning = 'C-D-E-G-A';
        const traditionalSVG = traditionalSVGs[defaultTraditionalTuning] ||
                              traditionalSVGs[tuningSystems[Object.keys(tuningSystems)[0]][0].value];

        // Load template file
        const templatePath = path.join(__dirname, 'templates', 'dual-panel-viewer-template.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        // Replace template variables
        html = html
            .replace(/{{SONG_NAME}}/g, songName)
            .replace(/{{TUNING}}/g, originalTuning.join('-'))
            .replace(/{{BENT_METRICS}}/g, `${optimalSVG.bentNoteCount} bent notes (${optimalSVG.bentPercentage}%)`)
            .replace(/{{SVG_WIDTH}}/g, optimalSVG.width)
            .replace(/{{SVG_HEIGHT}}/g, optimalSVG.height)
            .replace(/{{OPTIMAL_SVG_CONTENT}}/g, optimalSVG.content)
            .replace(/{{COMPARISON_SVG_CONTENT}}/g, traditionalSVG.content)
            .replace(/{{SONG_NOTES}}/g, JSON.stringify(notes))
            .replace(/{{SONG_METADATA}}/g, JSON.stringify(relationshipData.metadata))
            .replace(/{{OPTIMAL_TUNING_ARRAY}}/g, JSON.stringify(originalTuning))
            .replace(/{{COMPARISON_TUNINGS}}/g, JSON.stringify(traditionalSVGs))
            .replace(/{{ROMANIZED_LYRICS}}/g, lyricsVars.ROMANIZED_LYRICS)
            .replace(/{{ORIGINAL_LYRICS}}/g, lyricsVars.ORIGINAL_LYRICS)
            .replace(/{{ENGLISH_TRANSLATION}}/g, lyricsVars.ENGLISH_TRANSLATION)
            .replace(/{{MUSICAL_ANALYSIS}}/g, lyricsVars.MUSICAL_ANALYSIS)
            .replace(/{{PERFORMANCE_NOTES}}/g, lyricsVars.PERFORMANCE_NOTES)
            .replace(/{{CULTURAL_CONTEXT}}/g, lyricsVars.CULTURAL_CONTEXT)
            .replace(/{{HISTORICAL_BACKGROUND}}/g, lyricsVars.HISTORICAL_BACKGROUND)
            .replace(/{{REGIONAL_VARIATIONS}}/g, lyricsVars.REGIONAL_VARIATIONS);

        return html;
    }
}

// Test generation for "Đò đưa quan họ"
if (require.main === module) {
    const generator = new LyricsEnabledGenerator();

    console.log('🔄 Testing lyrics-enabled generation...');

    // Test with a sample song
    const testPath = path.join(__dirname, 'data', 'processed', 'Do_dua_quan_ho', 'relationships.json');
    if (fs.existsSync(testPath)) {
        const outputPath = path.join(__dirname, 'data', 'processed', 'Do_dua_quan_ho', 'complete-dual-panel.html');
        generator.generateViewer(testPath, outputPath);
        console.log('✅ Test generation completed!');
        console.log('🌐 View at: http://localhost:8080/data/processed/Do_dua_quan_ho/complete-dual-panel.html');
    } else {
        console.log('❌ Test file not found:', testPath);
    }
}

module.exports = LyricsEnabledGenerator;