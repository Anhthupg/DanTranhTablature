// Lyrics Service - Handles lyrics generation and processing
// Extracted from vertical-demo-server.js as part of Phase 2 refactoring

const LyricsTableGenerator = require('../generators/lyrics-table-generator');

class LyricsService {
    constructor() {
        this.lyricsTableGen = new LyricsTableGenerator();
    }

    /**
     * Generate color-coded lyrics HTML with clickable words and font controls
     * @param {Object|null} segmentationResult - Lyrics segmentation data
     * @returns {string} HTML for lyrics table
     */
    generateLyricsHTML(segmentationResult) {
        if (!segmentationResult || !segmentationResult.phrases || segmentationResult.phrases.length === 0) {
            return '<p style="padding: 20px; text-align: center; color: #999;">No lyrics available for this song.</p>';
        }

        try {
            return this.lyricsTableGen.generateTable(segmentationResult);
        } catch (err) {
            console.log('Lyrics HTML generation failed:', err.message);
            return '<p style="padding: 20px; text-align: center; color: #999;">Error generating lyrics display.</p>';
        }
    }

    /**
     * Extract lyrics from segmentation data
     * @param {Object} segmentationResult - Lyrics segmentation data
     * @returns {string} Plain text lyrics
     */
    extractPlainText(segmentationResult) {
        if (!segmentationResult || !segmentationResult.phrases) {
            return '';
        }

        return segmentationResult.phrases
            .map(phrase => phrase.text)
            .join(' ');
    }

    /**
     * Get lyrics statistics
     * @param {Object} segmentationResult - Lyrics segmentation data
     * @returns {Object} Statistics object
     */
    getLyricsStatistics(segmentationResult) {
        if (!segmentationResult) {
            return {
                phraseCount: 0,
                totalSyllables: 0,
                averagePhraseLength: 0
            };
        }

        const phraseCount = segmentationResult.phrases ? segmentationResult.phrases.length : 0;
        const totalSyllables = segmentationResult.totalSyllables || 0;
        const averagePhraseLength = phraseCount > 0 ? (totalSyllables / phraseCount).toFixed(2) : 0;

        return {
            phraseCount,
            totalSyllables,
            averagePhraseLength
        };
    }
}

module.exports = LyricsService;
