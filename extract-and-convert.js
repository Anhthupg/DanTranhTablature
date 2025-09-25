/**
 * Extract and Convert Script
 * Extracts all data from original HTML and converts to V2 format
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// First install jsdom: npm install jsdom

class DataExtractor {
    constructor() {
        this.sourceFile = path.join(__dirname, 'analytical_tablature.html');
        this.outputDir = path.join(__dirname, 'v2', 'data', 'song-001');
        this.data = {
            metadata: {},
            notes: [],
            patterns: {},
            sections: [],
            strings: [],
            lyrics: []
        };
    }

    async extract() {
        console.log('📊 Starting data extraction from original...\n');

        // Read the HTML file
        const html = fs.readFileSync(this.sourceFile, 'utf8');
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Extract all components
        this.extractNotes(document);
        this.extractPatterns(html);
        this.extractSections(html);
        this.extractStrings();
        this.extractMetadata();

        // Save to files
        this.saveData();

        console.log('\n✅ Extraction complete!');
        this.printSummary();
    }

    extractNotes(document) {
        console.log('📍 Extracting notes...');
        const circles = document.querySelectorAll('.note-circle');

        circles.forEach(circle => {
            const note = {
                id: parseInt(circle.getAttribute('data-note-index')),
                x: parseFloat(circle.getAttribute('cx')),
                y: parseFloat(circle.getAttribute('cy')),
                baseX: parseFloat(circle.getAttribute('data-base-x')),
                baseY: parseFloat(circle.getAttribute('data-base-y')),
                isGrace: circle.getAttribute('data-is-grace') === 'true',
                radius: circle.getAttribute('r') ? parseFloat(circle.getAttribute('r')) : 12
            };

            // Determine string and pitch from Y position
            const stringInfo = this.getStringFromY(note.y);
            note.string = stringInfo.string;
            note.pitch = stringInfo.pitch;

            this.data.notes.push(note);
        });

        // Sort by ID
        this.data.notes.sort((a, b) => a.id - b.id);
        console.log(`   ✓ Found ${this.data.notes.length} notes`);
    }

    extractPatterns(html) {
        console.log('📊 Extracting patterns...');

        // Find analysisData in script tags
        const analysisMatch = html.match(/const analysisData = ({[\s\S]*?});/);
        if (analysisMatch) {
            try {
                // Use Function constructor to safely evaluate
                const analysisData = new Function('return ' + analysisMatch[1])();
                this.data.patterns = analysisData;

                // Count patterns
                let patternCount = 0;
                if (analysisData.kpic_patterns) {
                    Object.values(analysisData.kpic_patterns).forEach(mode => {
                        Object.values(mode).forEach(level => {
                            patternCount += level.length;
                        });
                    });
                }
                console.log(`   ✓ Found ${patternCount} pattern types`);
            } catch (e) {
                console.error('   ✗ Failed to parse patterns:', e.message);
            }
        }
    }

    extractSections(html) {
        console.log('📑 Extracting sections...');

        // Look for section definitions
        const sectionMatch = html.match(/const sectionParts = ({[\s\S]*?});/);
        if (sectionMatch) {
            try {
                const sectionParts = new Function('return ' + sectionMatch[1])();

                Object.entries(sectionParts).forEach(([name, data]) => {
                    // Parse the sections string to get note ranges
                    const rangeMatches = data.sections.matchAll(/Notes (\d+)-(\d+)/g);
                    for (const match of rangeMatches) {
                        this.data.sections.push({
                            id: name.toLowerCase().replace(/\s+/g, '-'),
                            name: name,
                            type: data.type,
                            description: data.description,
                            noteRange: [parseInt(match[1]), parseInt(match[2])],
                            analysis: data.analysis
                        });
                    }
                });

                console.log(`   ✓ Found ${this.data.sections.length} sections`);
            } catch (e) {
                console.error('   ✗ Failed to parse sections:', e.message);
            }
        }

        // If no sections found, use defaults
        if (this.data.sections.length === 0) {
            this.data.sections = [
                { id: 'intro', name: 'Introduction', noteRange: [0, 6] },
                { id: 'development', name: 'Development', noteRange: [7, 21] },
                { id: 'signature', name: 'Signature', noteRange: [22, 37] },
                { id: 'closing', name: 'Closing', noteRange: [38, 45] }
            ];
            console.log('   ℹ Using default sections');
        }
    }

    extractStrings() {
        console.log('🎸 Extracting strings...');
        this.data.strings = [
            { number: 5, note: 'D4', y: 110, frequency: 293.66 },
            { number: 7, note: 'G4', y: 260, frequency: 392.00 },
            { number: 8, note: 'A4', y: 320, frequency: 440.00 },
            { number: 9, note: 'C5', y: 410, frequency: 523.25 },
            { number: 10, note: 'D5', y: 470, frequency: 587.33 },
            { number: 11, note: 'E5', y: 530, frequency: 659.25 },
            { number: 12, note: 'G5', y: 620, frequency: 783.99 }
        ];
        console.log(`   ✓ Defined ${this.data.strings.length} strings`);
    }

    extractMetadata() {
        console.log('📋 Creating metadata...');
        this.data.metadata = {
            id: 'song-001',
            title: 'Dan Tranh Traditional Piece',
            extractedAt: new Date().toISOString(),
            sourceFile: 'analytical_tablature.html',
            version: '2.0',
            stats: {
                totalNotes: this.data.notes.length,
                graceNotes: this.data.notes.filter(n => n.isGrace).length,
                regularNotes: this.data.notes.filter(n => !n.isGrace).length,
                sections: this.data.sections.length,
                strings: this.data.strings.length,
                xRange: {
                    min: Math.min(...this.data.notes.map(n => n.x)),
                    max: Math.max(...this.data.notes.map(n => n.x))
                },
                yRange: {
                    min: Math.min(...this.data.notes.map(n => n.y)),
                    max: Math.max(...this.data.notes.map(n => n.y))
                }
            }
        };
        console.log('   ✓ Metadata created');
    }

    getStringFromY(y) {
        const stringMap = [
            { y: 110, string: 5, pitch: 'D4' },
            { y: 260, string: 7, pitch: 'G4' },
            { y: 320, string: 8, pitch: 'A4' },
            { y: 410, string: 9, pitch: 'C5' },
            { y: 470, string: 10, pitch: 'D5' },
            { y: 530, string: 11, pitch: 'E5' },
            { y: 620, string: 12, pitch: 'G5' }
        ];

        // Find closest string
        let closest = stringMap[0];
        let minDiff = Math.abs(y - closest.y);

        for (const s of stringMap) {
            const diff = Math.abs(y - s.y);
            if (diff < minDiff) {
                minDiff = diff;
                closest = s;
            }
        }

        return closest;
    }

    saveData() {
        console.log('\n💾 Saving extracted data...');

        // Create output directory
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
            console.log(`   ✓ Created directory: ${this.outputDir}`);
        }

        // Save each data type
        const files = [
            { name: 'metadata.json', data: this.data.metadata },
            { name: 'notes.json', data: this.data.notes },
            { name: 'patterns.json', data: this.data.patterns },
            { name: 'sections.json', data: this.data.sections },
            { name: 'strings.json', data: this.data.strings }
        ];

        files.forEach(file => {
            const filePath = path.join(this.outputDir, file.name);
            fs.writeFileSync(filePath, JSON.stringify(file.data, null, 2));
            console.log(`   ✓ Saved ${file.name} (${JSON.stringify(file.data).length} bytes)`);
        });

        // Create index file
        const indexPath = path.join(this.outputDir, 'index.json');
        fs.writeFileSync(indexPath, JSON.stringify({
            id: 'song-001',
            title: this.data.metadata.title,
            files: files.map(f => f.name),
            stats: this.data.metadata.stats,
            created: this.data.metadata.extractedAt
        }, null, 2));
        console.log(`   ✓ Created index.json`);
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 EXTRACTION SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Notes:     ${this.data.notes.length}`);
        console.log(`  - Regular:     ${this.data.notes.filter(n => !n.isGrace).length}`);
        console.log(`  - Grace:       ${this.data.notes.filter(n => n.isGrace).length}`);
        console.log(`Sections:        ${this.data.sections.length}`);
        console.log(`Strings:         ${this.data.strings.length}`);
        console.log(`Pattern Types:   ${Object.keys(this.data.patterns.kpic_patterns || {}).length}`);
        console.log(`\nOutput Dir:      ${this.outputDir}`);
        console.log('='.repeat(50));
    }
}

// Check if jsdom is installed
try {
    require('jsdom');
    // Run extraction
    const extractor = new DataExtractor();
    extractor.extract().catch(console.error);
} catch (e) {
    console.log('⚠️  jsdom not installed. Installing now...');
    console.log('Run: npm install jsdom');
    console.log('Then run this script again: node extract-and-convert.js');
}