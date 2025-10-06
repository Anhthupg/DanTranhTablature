#!/usr/bin/env node

/**
 * Enhanced Figurative Language Detector
 * Multi-Dimensional Vietnamese Expression Analysis
 *
 * Uses 5-dimensional taxonomy instead of exclusive categories
 */

class EnhancedFigurativeDetector {
    constructor() {
        // Knowledge base with multi-dimensional classifications
        this.expressionDatabase = {
            // Thành ngữ (Idioms)
            'tang tình': {
                literal: 'mourning appearance',
                meaning: 'simple, plain clothes revealing inner beauty',
                classification: {
                    vietnameseCategory: 'thành_ngữ',
                    semanticMechanism: 'metaphorical',
                    culturalScope: 'vietnamese_specific',
                    fixedness: 'semi_fixed',
                    meaningDepth: 'multi_layered'
                },
                features: ['appearance_metaphor', 'beauty_in_simplicity', 'traditional_aesthetic'],
                context: 'Common motif in Vietnamese folk poetry: modest appearance concealing inner virtue/beauty'
            },

            'xui ai': {
                literal: 'what/who moves',
                meaning: 'rhetorical question expressing unexplained emotional stirring',
                classification: {
                    vietnameseCategory: 'thành_ngữ',
                    semanticMechanism: 'metaphorical',
                    culturalScope: 'vietnamese_specific',
                    fixedness: 'frozen',
                    meaningDepth: 'layered'
                },
                features: ['rhetorical_question', 'emotional_metaphor', 'ca_dao_pattern'],
                context: 'Expresses spontaneous emotional movement common in Vietnamese poetry'
            },

            'lòng thương': {
                literal: 'heart of love/compassion',
                meaning: 'loving heart combining affection and compassionate care',
                classification: {
                    vietnameseCategory: 'từ_kết_hợp',
                    semanticMechanism: 'metaphorical',
                    culturalScope: 'vietnamese_specific',
                    fixedness: 'semi_fixed',
                    meaningDepth: 'multi_layered'
                },
                features: ['container_metaphor', 'dual_emotion', 'traditional_love_concept'],
                context: 'Vietnamese "thương" uniquely combines romantic love with compassionate care'
            },

            // Từ kết hợp (Collocations)
            'trong lòng': {
                literal: 'inside heart',
                meaning: 'in the heart - seat of emotions and feelings',
                classification: {
                    vietnameseCategory: 'từ_kết_hợp',
                    semanticMechanism: 'metaphorical',
                    culturalScope: 'east_asian',
                    fixedness: 'frozen',
                    meaningDepth: 'layered'
                },
                features: ['container_metaphor', 'emotion_localization', 'heart_symbolism'],
                context: 'Heart as emotional container is central Vietnamese metaphor'
            },

            'gánh nước': {
                literal: 'carry water with shoulder pole',
                meaning: 'traditional daily labor done by women',
                classification: {
                    vietnameseCategory: 'từ_kết_hợp',
                    semanticMechanism: 'metonymic',
                    culturalScope: 'vietnamese_specific',
                    fixedness: 'frozen',
                    meaningDepth: 'layered'
                },
                features: ['labor_imagery', 'gender_traditional', 'rural_life'],
                context: 'Water-carrying with bamboo pole is iconic Vietnamese rural image'
            },

            'tưới cây': {
                literal: 'irrigate plants',
                meaning: 'nurturing life, caring for growth',
                classification: {
                    vietnameseCategory: 'từ_kết_hợp',
                    semanticMechanism: 'metaphorical',
                    culturalScope: 'universal',
                    fixedness: 'semi_fixed',
                    meaningDepth: 'layered'
                },
                features: ['nurturing_metaphor', 'growth_care', 'daily_labor'],
                context: 'Simple act of watering symbolizes nurturing nature'
            },

            // Từ láy (Reduplication)
            'chiều chiều': {
                literal: 'afternoon afternoon',
                meaning: 'every afternoon, habitually at twilight',
                classification: {
                    vietnameseCategory: 'từ_láy',
                    semanticMechanism: 'literal',
                    culturalScope: 'vietnamese_specific',
                    fixedness: 'frozen',
                    meaningDepth: 'layered'
                },
                features: ['total_reduplication', 'temporal_emphasis', 'habitual_aspect'],
                context: 'Reduplication emphasizing recurring time and contemplative mood'
            },

            // Ca dao formula (Folk song patterns)
            'tây lầu': {
                literal: 'western upper floor',
                meaning: 'elevated vantage point for sunset contemplation',
                classification: {
                    vietnameseCategory: 'ca_dao_formula',
                    semanticMechanism: 'metaphorical',
                    culturalScope: 'vietnamese_specific',
                    fixedness: 'semi_fixed',
                    meaningDepth: 'multi_layered'
                },
                features: ['spatial_metaphor', 'contemplation_space', 'architectural_symbolism'],
                context: 'Western balconies face sunset, symbolizing reflection and longing in Vietnamese poetry'
            }
        };
    }

    /**
     * Analyze expression with multi-dimensional classification
     * @param {string} text - Vietnamese text to analyze
     * @returns {Object|null} - Multi-dimensional analysis or null
     */
    analyzeExpression(text) {
        const lowerText = text.toLowerCase();

        // Check database
        for (const [vn, data] of Object.entries(this.expressionDatabase)) {
            if (lowerText.includes(vn.toLowerCase())) {
                return {
                    vietnamese: vn,
                    literal: data.literal,
                    meaning: data.meaning,
                    classification: data.classification,
                    features: data.features,
                    culturalContext: data.context,
                    words: vn.split(' ')
                };
            }
        }

        // Auto-detect reduplication
        const words = text.trim().split(/\s+/);
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i] === words[i + 1]) {
                return {
                    vietnamese: `${words[i]} ${words[i]}`,
                    literal: `${words[i]} ${words[i]}`,
                    meaning: `emphatic repetition of "${words[i]}"`,
                    classification: {
                        vietnameseCategory: 'từ_láy',
                        semanticMechanism: 'literal',
                        culturalScope: 'vietnamese_specific',
                        fixedness: 'frozen',
                        meaningDepth: 'surface'
                    },
                    features: ['total_reduplication', 'emphasis'],
                    culturalContext: 'Vietnamese reduplication for emphasis or poetic effect',
                    words: [words[i], words[i]]
                };
            }
        }

        return null;
    }

    /**
     * Extract all figurative expressions from phrase
     * @param {Object} phrase - Phrase with text and wordMapping
     * @returns {Array} - Array of detected expressions
     */
    extractFromPhrase(phrase) {
        const expressions = [];
        const text = phrase.text;

        // Check each known expression
        for (const [vn, data] of Object.entries(this.expressionDatabase)) {
            if (text.toLowerCase().includes(vn.toLowerCase())) {
                expressions.push({
                    vietnamese: vn,
                    literal: data.literal,
                    meaning: data.meaning,
                    classification: data.classification,
                    features: data.features,
                    culturalContext: data.context,
                    words: vn.split(' ')
                });
            }
        }

        return expressions;
    }

    /**
     * Analyze patterns with multi-dimensional statistics
     * @param {Array} phrases - Phrases with expression data
     * @returns {Object} - Multi-dimensional analysis
     */
    analyzePatterns(phrases) {
        const allExpressions = [];
        const counts = {};

        // Dimensional counters
        const byCategory = {};
        const byMechanism = {};
        const byScope = {};
        const byDepth = {};
        const byFeature = {};

        phrases.forEach(phrase => {
            if (phrase.figurativeExpressions) {
                phrase.figurativeExpressions.forEach(expr => {
                    allExpressions.push(expr);

                    // Count occurrences
                    counts[expr.vietnamese] = (counts[expr.vietnamese] || 0) + 1;

                    // Dimensional statistics
                    const c = expr.classification;
                    byCategory[c.vietnameseCategory] = (byCategory[c.vietnameseCategory] || 0) + 1;
                    byMechanism[c.semanticMechanism] = (byMechanism[c.semanticMechanism] || 0) + 1;
                    byScope[c.culturalScope] = (byScope[c.culturalScope] || 0) + 1;
                    byDepth[c.meaningDepth] = (byDepth[c.meaningDepth] || 0) + 1;

                    // Feature distribution
                    expr.features.forEach(feat => {
                        byFeature[feat] = (byFeature[feat] || 0) + 1;
                    });
                });
            }
        });

        return {
            totalExpressions: allExpressions.length,
            uniqueExpressions: Object.keys(counts).length,
            expressionCounts: counts,

            // Multi-dimensional distributions
            byVietnameseCategory: byCategory,
            bySemanticMechanism: byMechanism,
            byCulturalScope: byScope,
            byMeaningDepth: byDepth,
            featureDistribution: byFeature,

            mostCommon: Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([expr, count]) => ({ expression: expr, count }))
        };
    }

    /**
     * Assess cultural and linguistic richness
     * @param {Object} analysis - Pattern analysis
     * @returns {Object} - Assessment
     */
    assessRichness(analysis) {
        const total = analysis.totalExpressions;
        const unique = analysis.uniqueExpressions;

        // Cultural richness
        let culturalRichness = 'literal';
        if (total === 0) culturalRichness = 'literal';
        else if (unique >= 8) culturalRichness = 'very_rich';
        else if (unique >= 5) culturalRichness = 'rich';
        else if (unique >= 3) culturalRichness = 'moderate';
        else culturalRichness = 'minimal';

        // Dominant dimensions
        const dominantCategory = this.getDominant(analysis.byVietnameseCategory);
        const dominantMechanism = this.getDominant(analysis.bySemanticMechanism);
        const dominantDepth = this.getDominant(analysis.byMeaningDepth);

        return {
            culturalRichness,
            dominantVietnameseCategory: dominantCategory,
            dominantSemanticMechanism: dominantMechanism,
            dominantMeaningDepth: dominantDepth,
            expressionDensity: total > 0 ? (unique / total).toFixed(2) : 0,
            description: this.generateDescription(culturalRichness, dominantCategory, dominantMechanism)
        };
    }

    getDominant(distribution) {
        const entries = Object.entries(distribution);
        if (entries.length === 0) return 'none';
        return entries.sort((a, b) => b[1] - a[1])[0][0];
    }

    generateDescription(richness, category, mechanism) {
        const richnessDesc = {
            literal: 'Direct, literal language',
            minimal: 'Some figurative elements',
            moderate: 'Balanced literal and figurative',
            rich: 'Culturally rich figurative language',
            very_rich: 'Highly sophisticated figurative expressions'
        };

        const categoryDesc = {
            'thành_ngữ': 'with prevalent idioms',
            'tục_ngữ': 'featuring proverbs and wisdom',
            'từ_láy': 'emphasizing reduplication',
            'từ_kết_hợp': 'using natural collocations',
            'ca_dao_formula': 'following folk song patterns',
            'none': ''
        };

        const mechanismDesc = {
            'metaphorical': 'primarily metaphorical',
            'symbolic': 'highly symbolic',
            'literal': 'straightforward',
            'metonymic': 'using metonymy',
            'none': ''
        };

        return `${richnessDesc[richness]} ${categoryDesc[category]}, ${mechanismDesc[mechanism]}`;
    }
}

module.exports = EnhancedFigurativeDetector;
