// Tablature Service - Orchestrates tablature generation
// Extracted from vertical-demo-server.js as part of Phase 2 refactoring

const ServerTablatureGenerator = require('../server-tablature-generator');

class TablatureService {
    constructor() {
        this.generator = new ServerTablatureGenerator();
    }

    /**
     * Generate tablatures for both optimal and comparison tunings
     * @param {Object} songData - Song data object
     * @param {string} optimalTuning - Optimal tuning
     * @param {string} comparisonTuning - Comparison tuning
     * @param {boolean} showBentNotes - Whether to show bent notes
     * @returns {Object} { optimalSVG, comparisonSVG, optimalPositionedNotes, width }
     */
    generateTablatures(songData, optimalTuning, comparisonTuning, showBentNotes = true) {
        // Generate optimal tuning tablature (bent notes visible/red by default)
        const optimalSVG = this.generator.generateSVG(songData, optimalTuning, showBentNotes);
        const optimalPositionedNotes = this.generator.getLastGeneratedNotes();
        const optimalSvgWidth = this.generator.getLastGeneratedWidth();

        // Generate comparison tablature
        const comparisonSVG = this.generator.generateSVG(songData, comparisonTuning, showBentNotes);

        return {
            optimalSVG,
            comparisonSVG,
            optimalPositionedNotes,
            width: optimalSvgWidth
        };
    }

    /**
     * Extract SVG content (without outer <svg> tags)
     * @param {string} svgString - Full SVG string
     * @returns {string} Inner SVG content
     */
    extractSvgContent(svgString) {
        const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
        return match ? match[1] : svgString;
    }

    /**
     * Generate single tablature
     * @param {Object} songData - Song data object
     * @param {string} tuning - Tuning system
     * @param {boolean} showBentNotes - Whether to show bent notes
     * @returns {string} SVG string
     */
    generateSingleTablature(songData, tuning, showBentNotes = true) {
        return this.generator.generateSVG(songData, tuning, showBentNotes);
    }

    /**
     * Get positioned notes from last generation
     * @returns {Array} Positioned notes
     */
    getLastGeneratedNotes() {
        return this.generator.getLastGeneratedNotes();
    }

    /**
     * Get width from last generation
     * @returns {number} SVG width
     */
    getLastGeneratedWidth() {
        return this.generator.getLastGeneratedWidth();
    }
}

module.exports = TablatureService;
