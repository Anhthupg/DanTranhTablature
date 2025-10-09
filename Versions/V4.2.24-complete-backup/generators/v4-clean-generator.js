// V4 Clean Generator - Uses clean template without emojis
const fs = require('fs');
const path = require('path');

class V4CleanGenerator {
    constructor() {
        this.templatePath = path.join(__dirname, '../templates/v4-clean-template.html');
        this.outputDir = path.join(__dirname, '../data/processed');
        this.v3DataPath = path.join(__dirname, '../../v3/data/processed');
    }

    generateV4Page(songName) {
        console.log(`Generating V4 clean analysis for: ${songName}`);

        // Load V3 data as foundation
        const v3Data = this.loadV3Data(songName);
        if (!v3Data) {
            console.error(`V3 data not found for: ${songName}`);
            return false;
        }

        // Load clean template
        const template = fs.readFileSync(this.templatePath, 'utf8');

        // Replace template placeholders
        const finalHTML = template
            .replace(/{{SONG_NAME}}/g, songName)
            .replace(/{{SVG_WIDTH}}/g, v3Data.svgWidth)
            .replace(/{{SVG_HEIGHT}}/g, v3Data.svgHeight)
            .replace(/{{OPTIMAL_SVG_CONTENT}}/g, v3Data.optimalSVG)
            .replace(/{{COMPARISON_SVG_CONTENT}}/g, v3Data.comparisonSVG);

        // Write V4 output
        const outputPath = this.createOutputPath(songName);
        fs.writeFileSync(outputPath, finalHTML);

        console.log(`V4 clean page generated: ${outputPath}`);
        return true;
    }

    loadV3Data(songName) {
        try {
            const v3FilePath = path.join(this.v3DataPath, songName, 'complete-dual-panel.html');
            if (!fs.existsSync(v3FilePath)) return null;

            const v3HTML = fs.readFileSync(v3FilePath, 'utf8');

            // Extract SVG content from V3
            const optimalMatch = v3HTML.match(/<svg[^>]*id="optimalTablatureSvg"[^>]*>(.*?)<\/svg>/s);
            const comparisonMatch = v3HTML.match(/<svg[^>]*id="comparisonTablatureSvg"[^>]*>(.*?)<\/svg>/s);

            // Extract dimensions
            const widthMatch = v3HTML.match(/width="(\d+)"/);
            const heightMatch = v3HTML.match(/height="(\d+)"/);

            return {
                optimalSVG: optimalMatch ? optimalMatch[1] : '<text x="50" y="50">Tablature content loading...</text>',
                comparisonSVG: comparisonMatch ? comparisonMatch[1] : '<text x="50" y="50">Alternative tablature loading...</text>',
                svgWidth: widthMatch ? widthMatch[1] : '1000',
                svgHeight: heightMatch ? heightMatch[1] : '600'
            };
        } catch (error) {
            console.error(`Error loading V3 data for ${songName}:`, error);
            return {
                optimalSVG: '<text x="50" y="50">Error loading tablature</text>',
                comparisonSVG: '<text x="50" y="50">Error loading alternative tablature</text>',
                svgWidth: '1000',
                svgHeight: '600'
            };
        }
    }

    createOutputPath(songName) {
        const sanitizedName = songName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const outputDir = path.join(this.outputDir, sanitizedName);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        return path.join(outputDir, 'v4-analysis.html');
    }
}

// Command line interface
if (require.main === module) {
    const songName = process.argv[2];
    if (!songName) {
        console.log('Usage: node v4-clean-generator.js "Song Name"');
        process.exit(1);
    }

    const generator = new V4CleanGenerator();
    const success = generator.generateV4Page(songName);

    if (success) {
        console.log(`V4 clean analysis ready for: ${songName}`);
    } else {
        process.exit(1);
    }
}

module.exports = V4CleanGenerator;