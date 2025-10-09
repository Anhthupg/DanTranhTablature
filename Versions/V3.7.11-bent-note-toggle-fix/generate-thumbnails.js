const fs = require('fs');
const path = require('path');

/**
 * Generate thumbnail SVGs for all songs
 * Extracts a portion of the tablature to use as preview
 */

class ThumbnailGenerator {
    constructor() {
        this.processedDir = path.join(__dirname, 'data', 'processed');
        this.songsProcessed = 0;
    }

    /**
     * Generate thumbnails for all songs
     */
    async generateAll() {
        console.log('🎨 Generating thumbnails for all songs...\n');

        try {
            // Get all song directories
            const dirs = fs.readdirSync(this.processedDir)
                .filter(dir => fs.statSync(path.join(this.processedDir, dir)).isDirectory());

            for (const dir of dirs) {
                await this.generateThumbnail(dir);
            }

            console.log(`\n✅ Generated ${this.songsProcessed} thumbnails successfully!`);
        } catch (error) {
            console.error('Error generating thumbnails:', error);
        }
    }

    /**
     * Generate thumbnail for a single song
     */
    async generateThumbnail(dirName) {
        const viewerPath = path.join(this.processedDir, dirName, 'viewer.html');
        const dualPanelPath = path.join(this.processedDir, dirName, 'complete-dual-panel.html');
        const thumbnailPath = path.join(this.processedDir, dirName, 'thumbnail.svg');

        try {
            let htmlContent;

            // Try dual-panel viewer first, then regular viewer
            if (fs.existsSync(dualPanelPath)) {
                htmlContent = fs.readFileSync(dualPanelPath, 'utf8');
            } else if (fs.existsSync(viewerPath)) {
                htmlContent = fs.readFileSync(viewerPath, 'utf8');
            } else {
                console.log(`⚠️  No viewer found for ${dirName}`);
                // Generate a placeholder thumbnail
                this.generatePlaceholder(thumbnailPath, dirName);
                return;
            }

            // Extract SVG content
            const svgMatch = htmlContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
            if (!svgMatch) {
                console.log(`⚠️  No SVG found in ${dirName}`);
                this.generatePlaceholder(thumbnailPath, dirName);
                return;
            }

            // Create thumbnail SVG with just the first portion of the tablature
            const thumbnail = this.createThumbnailFromSVG(svgMatch[0], dirName);

            // Save thumbnail
            fs.writeFileSync(thumbnailPath, thumbnail);
            this.songsProcessed++;
            console.log(`✓ Generated thumbnail for: ${dirName}`);

        } catch (error) {
            console.error(`Error processing ${dirName}:`, error.message);
            this.generatePlaceholder(thumbnailPath, dirName);
        }
    }

    /**
     * Create a thumbnail from full SVG content
     */
    createThumbnailFromSVG(fullSvg, songName) {
        // Extract viewBox and initial dimensions
        const viewBoxMatch = fullSvg.match(/viewBox="([^"]*)"/);
        const widthMatch = fullSvg.match(/width="([^"]*)"/);

        // Parse SVG content
        const parser = new DOMParser();
        const svgContent = fullSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)[1];

        // Extract just strings and first few notes
        const lines = svgContent.split('\n');
        const thumbnailLines = [];
        let noteCount = 0;
        const maxNotes = 15; // Show first 15 notes

        for (const line of lines) {
            // Keep string lines
            if (line.includes('<line') && line.includes('stroke="#000"')) {
                thumbnailLines.push(line);
            }
            // Keep string labels
            else if (line.includes('<text') && line.includes('text-anchor="end"')) {
                thumbnailLines.push(line);
            }
            // Keep first few notes
            else if (line.includes('<circle') && noteCount < maxNotes) {
                thumbnailLines.push(line);
                noteCount++;
            }
            // Keep bent indicators for those notes
            else if (line.includes('stroke-dasharray="3,2"') && noteCount <= maxNotes) {
                thumbnailLines.push(line);
            }
        }

        // Create thumbnail SVG with fixed dimensions for card display
        return `<svg width="300" height="120" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="400" fill="#ffffff"/>
    <g transform="scale(0.5)">
        ${thumbnailLines.join('\n')}
    </g>
    <!-- Song name overlay -->
    <rect x="0" y="90" width="300" height="30" fill="rgba(0,128,128,0.9)"/>
    <text x="150" y="108" text-anchor="middle" fill="white" font-size="12" font-family="system-ui">
        ${this.formatSongName(songName)}
    </text>
</svg>`;
    }

    /**
     * Generate a placeholder thumbnail
     */
    generatePlaceholder(thumbnailPath, songName) {
        const formattedName = this.formatSongName(songName);
        const placeholder = `<svg width="300" height="120" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="120" fill="#f0f0f0"/>

    <!-- Musical staff lines -->
    <line x1="20" y1="30" x2="280" y2="30" stroke="#ddd" stroke-width="1"/>
    <line x1="20" y1="45" x2="280" y2="45" stroke="#ddd" stroke-width="1"/>
    <line x1="20" y1="60" x2="280" y2="60" stroke="#ddd" stroke-width="1"/>
    <line x1="20" y1="75" x2="280" y2="75" stroke="#ddd" stroke-width="1"/>

    <!-- Musical note symbol -->
    <text x="150" y="55" text-anchor="middle" fill="#999" font-size="24">♪</text>

    <!-- Song name -->
    <rect x="0" y="90" width="300" height="30" fill="rgba(0,128,128,0.9)"/>
    <text x="150" y="108" text-anchor="middle" fill="white" font-size="12" font-family="system-ui">
        ${formattedName}
    </text>
</svg>`;

        fs.writeFileSync(thumbnailPath, placeholder);
        console.log(`📝 Generated placeholder for: ${songName}`);
    }

    /**
     * Format song name for display
     */
    formatSongName(dirName) {
        return dirName
            .replace(/_/g, ' ')
            .replace(/  /g, ' (')
            .replace(/ $/, ')')
            .substring(0, 30); // Limit length for thumbnail
    }
}

// Simple DOM parser replacement for Node.js
class DOMParser {
    parseFromString(string, type) {
        return { documentElement: { innerHTML: string } };
    }
}

// Run generator
const generator = new ThumbnailGenerator();
generator.generateAll();