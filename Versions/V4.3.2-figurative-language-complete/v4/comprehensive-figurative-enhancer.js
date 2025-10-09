#!/usr/bin/env node

/**
 * Comprehensive Figurative Language Taxonomy Enhancement
 *
 * Processes all 121 Vietnamese folk songs with:
 * - Complete 5-dimensional figurative language analysis
 * - Cultural weight scoring
 * - Complexity scoring
 * - Statistical summaries
 *
 * Output: Enhanced taxonomy with weights and scores for each song
 */

const fs = require('fs');
const path = require('path');
const EnhancedFigurativeDetector = require('./parsers/enhanced-figurative-detector.js');

class ComprehensiveFigurativeEnhancer {
    constructor() {
        this.detector = new EnhancedFigurativeDetector();
        this.songsDir = path.join(__dirname, 'data/lyrics-segmentations');
        this.outputDir = path.join(__dirname, 'data/figurative-enhanced');

        // Cultural weight coefficients
        this.culturalWeights = {
            culturalScope: {
                'vietnamese_specific': 1.0,
                'regional_vietnamese': 0.9,
                'east_asian': 0.5,
                'universal': 0.2
            },
            meaningDepth: {
                'highly_symbolic': 1.0,
                'multi_layered': 0.75,
                'layered': 0.5,
                'surface': 0.25
            },
            vietnameseCategory: {
                'điển_tích': 1.0,        // Cultural allusion - highest
                'tục_ngữ': 0.9,          // Proverb
                'thành_ngữ': 0.8,        // Idiom
                'ca_dao_formula': 0.7,   // Folk song pattern
                'từ_láy': 0.6,           // Reduplication
                'từ_kết_hợp': 0.4        // Collocation
            }
        };

        // Complexity scoring factors
        this.complexityFactors = {
            uniqueExpressionsWeight: 0.3,
            dimensionalDiversityWeight: 0.25,
            semanticRichnessWeight: 0.25,
            culturalDepthWeight: 0.2
        };

        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Calculate cultural weight for a single expression
     */
    calculateExpressionCulturalWeight(expression) {
        const c = expression.classification;

        const scopeWeight = this.culturalWeights.culturalScope[c.culturalScope] || 0;
        const depthWeight = this.culturalWeights.meaningDepth[c.meaningDepth] || 0;
        const categoryWeight = this.culturalWeights.vietnameseCategory[c.vietnameseCategory] || 0;

        // Weighted average
        return (scopeWeight * 0.4 + depthWeight * 0.35 + categoryWeight * 0.25);
    }

    /**
     * Calculate cultural weights for all expressions in a song
     */
    calculateSongCulturalWeights(phrases) {
        const weights = [];
        let totalWeight = 0;

        phrases.forEach(phrase => {
            if (phrase.figurativeExpressions) {
                phrase.figurativeExpressions.forEach(expr => {
                    const weight = this.calculateExpressionCulturalWeight(expr);
                    weights.push({
                        expression: expr.vietnamese,
                        weight: weight,
                        classification: expr.classification
                    });
                    totalWeight += weight;
                });
            }
        });

        return {
            individualWeights: weights,
            averageWeight: weights.length > 0 ? totalWeight / weights.length : 0,
            totalWeight: totalWeight,
            weightedExpressionCount: weights.length
        };
    }

    /**
     * Calculate dimensional diversity score (0-1)
     */
    calculateDimensionalDiversity(analysis) {
        // Count unique values across dimensions
        const uniqueCategories = Object.keys(analysis.byVietnameseCategory || {}).length;
        const uniqueMechanisms = Object.keys(analysis.bySemanticMechanism || {}).length;
        const uniqueScopes = Object.keys(analysis.byCulturalScope || {}).length;
        const uniqueDepths = Object.keys(analysis.byMeaningDepth || {}).length;

        // Maximum possible unique values per dimension
        const maxCategories = 6;  // thành_ngữ, tục_ngữ, từ_láy, etc.
        const maxMechanisms = 6;  // literal, metaphorical, etc.
        const maxScopes = 4;      // universal, east_asian, etc.
        const maxDepths = 4;      // surface, layered, etc.

        const categoryScore = uniqueCategories / maxCategories;
        const mechanismScore = uniqueMechanisms / maxMechanisms;
        const scopeScore = uniqueScopes / maxScopes;
        const depthScore = uniqueDepths / maxDepths;

        return (categoryScore + mechanismScore + scopeScore + depthScore) / 4;
    }

    /**
     * Calculate semantic richness score (0-1)
     */
    calculateSemanticRichness(analysis) {
        const total = analysis.totalExpressions || 0;
        const unique = analysis.uniqueExpressions || 0;

        if (total === 0) return 0;

        // Diversity ratio
        const diversityRatio = unique / total;

        // Feature richness
        const featureCount = Object.keys(analysis.featureDistribution || {}).length;
        const featureScore = Math.min(featureCount / 10, 1.0);  // Cap at 10 features

        return (diversityRatio * 0.6 + featureScore * 0.4);
    }

    /**
     * Calculate overall complexity score (0-100)
     */
    calculateComplexityScore(analysis, culturalWeights) {
        const uniqueScore = Math.min(analysis.uniqueExpressions / 10, 1.0);  // Cap at 10
        const diversityScore = this.calculateDimensionalDiversity(analysis);
        const richnessScore = this.calculateSemanticRichness(analysis);
        const culturalScore = Math.min(culturalWeights.averageWeight, 1.0);

        const f = this.complexityFactors;
        const rawScore = (
            uniqueScore * f.uniqueExpressionsWeight +
            diversityScore * f.dimensionalDiversityWeight +
            richnessScore * f.semanticRichnessWeight +
            culturalScore * f.culturalDepthWeight
        );

        return Math.round(rawScore * 100);  // Scale to 0-100
    }

    /**
     * Generate comprehensive statistics for a song
     */
    generateSongStatistics(phrases, analysis, culturalWeights, complexityScore) {
        return {
            overview: {
                totalPhrases: phrases.length,
                totalSyllables: phrases.reduce((sum, p) => sum + (p.syllableCount || 0), 0),
                averagePhraseLength: (phrases.reduce((sum, p) => sum + (p.syllableCount || 0), 0) / phrases.length).toFixed(2)
            },

            figurativeLanguage: {
                totalExpressions: analysis.totalExpressions,
                uniqueExpressions: analysis.uniqueExpressions,
                expressionDensity: (analysis.totalExpressions / phrases.length).toFixed(2),
                expressionCoverage: `${((analysis.uniqueExpressions / phrases.length) * 100).toFixed(1)}%`
            },

            dimensionalDistribution: {
                byVietnameseCategory: analysis.byVietnameseCategory || {},
                bySemanticMechanism: analysis.bySemanticMechanism || {},
                byCulturalScope: analysis.byCulturalScope || {},
                byMeaningDepth: analysis.byMeaningDepth || {}
            },

            culturalWeights: {
                averageWeight: culturalWeights.averageWeight.toFixed(3),
                totalWeight: culturalWeights.totalWeight.toFixed(3),
                weightedExpressionCount: culturalWeights.weightedExpressionCount,
                topWeightedExpressions: culturalWeights.individualWeights
                    .sort((a, b) => b.weight - a.weight)
                    .slice(0, 5)
            },

            complexityMetrics: {
                overallComplexityScore: complexityScore,
                complexityLevel: this.getComplexityLevel(complexityScore),
                dimensionalDiversity: (this.calculateDimensionalDiversity(analysis) * 100).toFixed(1) + '%',
                semanticRichness: (this.calculateSemanticRichness(analysis) * 100).toFixed(1) + '%'
            },

            featureAnalysis: {
                totalFeatures: Object.keys(analysis.featureDistribution || {}).length,
                topFeatures: Object.entries(analysis.featureDistribution || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([feature, count]) => ({ feature, count }))
            }
        };
    }

    /**
     * Get complexity level label
     */
    getComplexityLevel(score) {
        if (score >= 80) return 'Very High';
        if (score >= 60) return 'High';
        if (score >= 40) return 'Moderate';
        if (score >= 20) return 'Low';
        return 'Minimal';
    }

    /**
     * Process a single song
     */
    processSong(songFile) {
        const filePath = path.join(this.songsDir, songFile);
        const songData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        console.log(`Processing: ${songData.songTitle}`);

        // Extract figurative expressions from each phrase
        songData.phrases.forEach(phrase => {
            phrase.figurativeExpressions = this.detector.extractFromPhrase(phrase);
        });

        // Analyze patterns
        const analysis = this.detector.analyzePatterns(songData.phrases);

        // Calculate cultural weights
        const culturalWeights = this.calculateSongCulturalWeights(songData.phrases);

        // Calculate complexity score
        const complexityScore = this.calculateComplexityScore(analysis, culturalWeights);

        // Generate comprehensive statistics
        const statistics = this.generateSongStatistics(
            songData.phrases,
            analysis,
            culturalWeights,
            complexityScore
        );

        // Assess richness
        const richness = this.detector.assessRichness(analysis);

        // Compile enhanced output
        const enhancedSong = {
            metadata: {
                songTitle: songData.songTitle,
                totalSyllables: songData.totalSyllables,
                segmentedBy: songData.segmentedBy,
                enhancedDate: new Date().toISOString().split('T')[0],
                enhancementVersion: '1.0'
            },

            phrases: songData.phrases,

            figurativeAnalysis: {
                patterns: analysis,
                richness: richness,
                culturalWeights: culturalWeights,
                complexityScore: complexityScore
            },

            statistics: statistics
        };

        // Save enhanced version
        const outputPath = path.join(this.outputDir, songFile);
        fs.writeFileSync(outputPath, JSON.stringify(enhancedSong, null, 2));

        console.log(`  ✓ Complexity: ${complexityScore}/100 (${statistics.complexityMetrics.complexityLevel})`);
        console.log(`  ✓ Cultural Weight: ${culturalWeights.averageWeight.toFixed(3)}`);
        console.log(`  ✓ Expressions: ${analysis.totalExpressions} (${analysis.uniqueExpressions} unique)`);

        return {
            songTitle: songData.songTitle,
            complexityScore: complexityScore,
            culturalWeight: culturalWeights.averageWeight,
            expressionCount: analysis.totalExpressions
        };
    }

    /**
     * Process all songs
     */
    processAllSongs() {
        console.log('=== Comprehensive Figurative Language Enhancement ===\n');

        const songFiles = fs.readdirSync(this.songsDir)
            .filter(f => f.endsWith('.json'))
            .sort();

        console.log(`Found ${songFiles.length} songs to process\n`);

        const results = [];

        songFiles.forEach((file, index) => {
            console.log(`[${index + 1}/${songFiles.length}]`);
            const result = this.processSong(file);
            results.push(result);
            console.log('');
        });

        // Generate collection summary
        const summary = this.generateCollectionSummary(results);

        // Save summary
        const summaryPath = path.join(this.outputDir, '_COLLECTION_SUMMARY.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

        console.log('=== Enhancement Complete ===');
        console.log(`Processed: ${results.length} songs`);
        console.log(`Output directory: ${this.outputDir}`);
        console.log(`\nCollection Summary:`);
        console.log(`  Average Complexity: ${summary.aggregateMetrics.averageComplexity.toFixed(1)}/100`);
        console.log(`  Average Cultural Weight: ${summary.aggregateMetrics.averageCulturalWeight.toFixed(3)}`);
        console.log(`  Total Expressions: ${summary.aggregateMetrics.totalExpressions}`);
        console.log(`\nTop 10 by Complexity:`);
        summary.rankings.byComplexity.slice(0, 10).forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.songTitle}: ${s.complexityScore}/100`);
        });
    }

    /**
     * Generate collection-wide summary
     */
    generateCollectionSummary(results) {
        return {
            metadata: {
                totalSongs: results.length,
                generatedDate: new Date().toISOString().split('T')[0],
                version: '1.0'
            },

            aggregateMetrics: {
                averageComplexity: results.reduce((sum, r) => sum + r.complexityScore, 0) / results.length,
                averageCulturalWeight: results.reduce((sum, r) => sum + r.culturalWeight, 0) / results.length,
                totalExpressions: results.reduce((sum, r) => sum + r.expressionCount, 0),
                uniqueExpressions: new Set(results.map(r => r.songTitle)).size
            },

            rankings: {
                byComplexity: [...results].sort((a, b) => b.complexityScore - a.complexityScore).slice(0, 20),
                byCulturalWeight: [...results].sort((a, b) => b.culturalWeight - a.culturalWeight).slice(0, 20),
                byExpressionCount: [...results].sort((a, b) => b.expressionCount - a.expressionCount).slice(0, 20)
            },

            distribution: {
                complexityLevels: {
                    'Very High (80-100)': results.filter(r => r.complexityScore >= 80).length,
                    'High (60-79)': results.filter(r => r.complexityScore >= 60 && r.complexityScore < 80).length,
                    'Moderate (40-59)': results.filter(r => r.complexityScore >= 40 && r.complexityScore < 60).length,
                    'Low (20-39)': results.filter(r => r.complexityScore >= 20 && r.complexityScore < 40).length,
                    'Minimal (0-19)': results.filter(r => r.complexityScore < 20).length
                }
            },

            allSongs: results
        };
    }
}

// Run if called directly
if (require.main === module) {
    const enhancer = new ComprehensiveFigurativeEnhancer();
    enhancer.processAllSongs();
}

module.exports = ComprehensiveFigurativeEnhancer;
