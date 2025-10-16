// Tuning Service - Handles tuning optimization and analysis
// Extracted from vertical-demo-server.js as part of Phase 2 refactoring

const tuningOptimizer = require('../utils/tuning-optimizer');

class TuningService {
    /**
     * Calculate optimal tuning for a song
     * @param {Object} songData - Song data object
     * @returns {Object} { optimal, bentCount, analysis, alternative, alternativeBentCount }
     */
    calculateOptimalTuning(songData) {
        let optimalTuning = songData.metadata.optimalTuning;
        let optimalBentCount = 0;

        // Get full tuning analysis
        const tuningAnalysis = tuningOptimizer.analyzeAllTunings(songData.notes);

        if (!optimalTuning) {
            optimalTuning = tuningAnalysis.optimal;
            optimalBentCount = tuningAnalysis.bentNotes;
            console.log(`Calculated optimal tuning: ${optimalTuning} (${optimalBentCount} bent notes)`);
        } else {
            optimalBentCount = tuningOptimizer.countBentNotes(songData.notes, optimalTuning);
            console.log(`Using stored optimal tuning: ${optimalTuning} (${optimalBentCount} bent notes)`);
        }

        // Find best alternative (2nd best tuning that's different from optimal)
        const alternativeResult = tuningAnalysis.allResults.find(r => r.tuning !== optimalTuning);
        const comparisonTuning = alternativeResult ? alternativeResult.tuning : 'C-D-F-G-A';
        const comparisonBentCount = alternativeResult ? alternativeResult.bentCount :
                                     tuningOptimizer.countBentNotes(songData.notes, comparisonTuning);

        console.log(`Optimal: ${optimalTuning} (${optimalBentCount} bent)`);
        console.log(`Alternative: ${comparisonTuning} (${comparisonBentCount} bent)`);

        return {
            optimal: optimalTuning,
            bentCount: optimalBentCount,
            analysis: tuningAnalysis,
            alternative: comparisonTuning,
            alternativeBentCount: comparisonBentCount
        };
    }

    /**
     * Get tuning from query parameter or use alternative
     * @param {string} queryTuning - Tuning from query parameter
     * @param {string} alternativeTuning - Alternative tuning to use as fallback
     * @returns {string} Selected tuning
     */
    getComparisonTuning(queryTuning, alternativeTuning) {
        return queryTuning || alternativeTuning;
    }

    /**
     * Count bent notes for a specific tuning
     * @param {Array} notes - Song notes
     * @param {string} tuning - Tuning system
     * @returns {number} Count of bent notes
     */
    countBentNotes(notes, tuning) {
        return tuningOptimizer.countBentNotes(notes, tuning);
    }

    /**
     * Analyze all available tunings for a song
     * @param {Array} notes - Song notes
     * @returns {Object} Full tuning analysis
     */
    analyzeAllTunings(notes) {
        return tuningOptimizer.analyzeAllTunings(notes);
    }
}

module.exports = TuningService;
