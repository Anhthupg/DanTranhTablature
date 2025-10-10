/**
 * V4 Batch Tablature Generator - Generate SVG Tablatures for All 128 Songs
 * Creates complete, rendered SVG tablatures from processed JSON data
 */

const fs = require('fs');
const path = require('path');

class V4TablatureGenerator {
    constructor() {
        this.processedDir = path.join(__dirname, 'data', 'processed');
        this.outputDir = path.join(__dirname, 'data', 'tablatures');

        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // V3's optimal spacing
        this.PIXELS_PER_CENT = 0.125;
        this.BASE_Y = 100;
        this.NOTE_SPACING = 40; // Horizontal spacing between notes

        // Note to cents mapping
        this.noteToCents = {
            'C': 0, 'C#': 100, 'Db': 100, 'D': 200, 'D#': 300, 'Eb': 300,
            'E': 400, 'F': 500, 'F#': 600, 'Gb': 600, 'G': 700, 'G#': 800,
            'Ab': 800, 'A': 900, 'A#': 1000, 'Bb': 1000, 'B': 1100,
            'Cx': 200, 'C##': 200, 'Dx': 400, 'D##': 400,
            'Ex': 600, 'E##': 600, 'Fx': 700, 'F##': 700,
            'Gx': 900, 'G##': 900, 'Ax': 1100, 'A##': 1100,
            'Bx': 200, 'B##': 200, 'Cbb': 1000, 'Dbb': 0,
            'Ebb': 200, 'Fbb': 400, 'Gbb': 500, 'Abb': 700, 'Bbb': 900
        };

        // Tuning systems
        this.tuningSystems = {
            'C-D-E-G-A': ['C', 'D', 'E', 'G', 'A'],
            'C-D-F-G-A': ['C', 'D', 'F', 'G', 'A'],
            'C-D-E-G-Bb': ['C', 'D', 'E', 'G', 'Bb'],
            'C-Eb-F-G-Bb': ['C', 'Eb', 'F', 'G', 'Bb'],
            'D-E-G-A-B': ['D', 'E', 'G', 'A', 'B']
        };
    }

    /**
     * Generate tablatures for all processed songs
     */
    async generateAll() {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   V4 Tablature Generator - Creating SVG Tablatures       ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        const files = fs.readdirSync(this.processedDir).filter(f => f.endsWith('.json'));
        console.log(`Found ${files.length} processed song files\n`);

        let generated = 0;
        let errors = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = Math.round((i + 1) / files.length * 100);

            try {
                const songData = JSON.parse(fs.readFileSync(path.join(this.processedDir, file), 'utf8'));
                console.log(`[${i+1}/${files.length}] Generating: ${songData.metadata.title} (${progress}%)`);

                await this.generateTablature(songData);
                generated++;
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
                errors++;
            }
        }

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log(`║   Generation Complete!                                     ║`);
        console.log(`║   Generated: ${generated}/${files.length} tablatures`);
        console.log(`║   Errors: ${errors}`);
        console.log('╚════════════════════════════════════════════════════════════╝\n');
    }

    /**
     * Generate tablature for a single song
     */
    async generateTablature(songData) {
        const { metadata, notes, lyrics } = songData;
        const tuning = metadata.optimalTuning || 'C-D-E-G-A';

        // Generate strings for this tuning
        const strings = this.generatePentatonicStrings(tuning);

        // Calculate SVG dimensions
        const width = 200 + (notes.length * this.NOTE_SPACING);
        const height = 800;

        // Generate SVG content
        const svg = this.createSVG(strings, notes, width, height, metadata);

        // Save to file
        const filename = this.sanitizeFileName(metadata.title);
        const outputPath = path.join(this.outputDir, `${filename}.svg`);
        fs.writeFileSync(outputPath, svg);

        console.log(`   ✓ Created: ${filename}.svg (${notes.length} notes, ${width}x${height}px)`);
    }

    /**
     * Create complete SVG markup
     */
    createSVG(strings, notes, width, height, metadata) {
        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .string-line { stroke: #333; stroke-width: 3; }
            .string-label { font-family: Arial; font-size: 14px; font-weight: bold; fill: #2c3e50; }
            .note-circle { fill: #008080; stroke: #005959; stroke-width: 2; }
            .note-text { font-family: Arial; font-size: 10px; font-weight: bold; fill: white; text-anchor: middle; }
            .grace-note { fill: #999999; stroke: #000000; }
            .bent-note { fill: #E67E22; stroke: #D35400; }
            .lyric-text { font-family: Arial; font-size: 12px; fill: #2c3e50; }
            .resonance-band { fill: #008080; opacity: 0.3; }
        </style>
    </defs>

    <!-- Title -->
    <text x="10" y="30" style="font-size: 20px; font-weight: bold; fill: #2c3e50;">${this.escapeXML(metadata.title)}</text>
    <text x="10" y="50" style="font-size: 14px; fill: #666;">Tuning: ${metadata.optimalTuning} | ${notes.length} notes | ${metadata.genre}</text>

    <!-- String Lines -->
    ${this.generateStringLines(strings, width)}

    <!-- String Labels -->
    ${this.generateStringLabels(strings)}

    <!-- Notes -->
    ${this.generateNotes(strings, notes)}

    <!-- Lyrics -->
    ${this.generateLyrics(notes)}
</svg>`;

        return svg;
    }

    /**
     * Generate pentatonic strings
     */
    generatePentatonicStrings(tuningKey) {
        const tuningNotes = this.tuningSystems[tuningKey] || this.tuningSystems['C-D-E-G-A'];
        const strings = [];
        let noteIndex = 0;
        let octave = 3;

        for (let i = 0; i < 17; i++) {
            const note = tuningNotes[noteIndex];
            strings.push({
                string: i + 1,
                note: note + octave,
                pitch: note,
                octave: octave,
                y: this.calculateYPosition(note, octave)
            });

            noteIndex++;
            if (noteIndex >= tuningNotes.length) {
                noteIndex = 0;
                octave++;
            }
        }

        return strings;
    }

    /**
     * Calculate Y position for a note
     */
    calculateYPosition(pitchClass, octave) {
        const cents = this.noteToCents[pitchClass] || 0;
        const octaveCents = (octave - 3) * 1200;
        const totalCents = cents + octaveCents;
        return this.BASE_Y + (totalCents * this.PIXELS_PER_CENT);
    }

    /**
     * Generate string lines
     */
    generateStringLines(strings, width) {
        return strings.map(s =>
            `<line x1="100" y1="${s.y}" x2="${width - 20}" y2="${s.y}" class="string-line"/>`
        ).join('\n    ');
    }

    /**
     * Generate string labels
     */
    generateStringLabels(strings) {
        return strings.map(s =>
            `<text x="50" y="${s.y + 5}" class="string-label">${s.note}</text>`
        ).join('\n    ');
    }

    /**
     * Generate notes
     */
    generateNotes(strings, notes) {
        let notesSVG = '';
        let x = 150; // Start position after string labels

        notes.forEach((note, index) => {
            if (!note.pitch) return;

            // Parse pitch
            const pitchMatch = note.pitch.match(/^([A-G][#b]?)(\d+)$/);
            if (!pitchMatch) return;

            const [, pitchClass, octave] = pitchMatch;
            const y = this.calculateYPosition(pitchClass, parseInt(octave));

            // Check if bent note
            const isOpen = strings.some(s => s.pitch === pitchClass && s.octave === parseInt(octave));
            const isBent = !isOpen;
            const isGrace = note.isGrace;

            // Calculate radius
            const radius = isGrace ? 6 : 12;

            // Draw resonance band
            const bandWidth = 320;
            const bandHeight = 3;
            notesSVG += `<rect x="${x - bandWidth/2}" y="${y - bandHeight/2}" width="${bandWidth}" height="${bandHeight}" class="resonance-band"/>\n    `;

            // Draw note circle
            const circleClass = isGrace ? 'grace-note' : (isBent ? 'bent-note' : 'note-circle');
            notesSVG += `<circle cx="${x}" cy="${y}" r="${radius}" class="${circleClass}"/>\n    `;

            // Draw string number (for regular notes only)
            if (!isGrace) {
                const stringNum = this.findStringNumber(strings, pitchClass, parseInt(octave));
                if (stringNum) {
                    notesSVG += `<text x="${x}" y="${y + 4}" class="note-text">${stringNum}</text>\n    `;
                }
            }

            x += this.NOTE_SPACING;
        });

        return notesSVG;
    }

    /**
     * Find string number for a pitch
     */
    findStringNumber(strings, pitchClass, octave) {
        const string = strings.find(s => s.pitch === pitchClass && s.octave === octave);
        return string ? string.string : '';
    }

    /**
     * Generate lyrics
     */
    generateLyrics(notes) {
        let lyricsSVG = '';
        let x = 150;

        notes.forEach((note, index) => {
            if (note.lyric && note.lyric.trim()) {
                const pitchMatch = note.pitch.match(/^([A-G][#b]?)(\d+)$/);
                if (pitchMatch) {
                    const [, pitchClass, octave] = pitchMatch;
                    const y = this.calculateYPosition(pitchClass, parseInt(octave));
                    lyricsSVG += `<text x="${x}" y="${y + 40}" class="lyric-text">${this.escapeXML(note.lyric)}</text>\n    `;
                }
            }
            x += this.NOTE_SPACING;
        });

        return lyricsSVG;
    }

    /**
     * Escape XML special characters
     */
    escapeXML(str) {
        return str.replace(/[<>&'"]/g, c => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    /**
     * Sanitize filename
     */
    sanitizeFileName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '_')
            .replace(/-+/g, '_')
            .substring(0, 50);
    }
}

// Run if executed directly
if (require.main === module) {
    const generator = new V4TablatureGenerator();
    generator.generateAll().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = V4TablatureGenerator;