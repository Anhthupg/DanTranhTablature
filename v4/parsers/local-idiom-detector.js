#!/usr/bin/env node

/**
 * Local Rule-Based Idiom Detector
 *
 * Uses pattern matching and Vietnamese linguistic rules to detect idioms,
 * proverbs, and cultural phrases without requiring LLM API.
 *
 * Tier 1 Linguistic Analysis - Component 5/5 (Local Version)
 */

const fs = require('fs');
const path = require('path');

class LocalIdiomDetector {
    constructor() {
        // Common Vietnamese idioms and cultural phrases in folk music
        this.idiomDatabase = {
            // Reduplication patterns (từ láy)
            'chiều chiều': {
                type: 'cultural_phrase',
                literal: 'afternoon afternoon',
                meaning: 'late afternoon, twilight time',
                context: 'Poetic repetition indicating the passing of time'
            },
            'xa xa': {
                type: 'cultural_phrase',
                literal: 'far far',
                meaning: 'very distant, far away',
                context: 'Reduplication for emphasis of distance'
            },
            'ngày ngày': {
                type: 'cultural_phrase',
                literal: 'day day',
                meaning: 'every day, daily',
                context: 'Temporal reduplication indicating frequency'
            },

            // Common folk music idioms
            'gánh lo': {
                type: 'idiom',
                literal: 'carry worry',
                meaning: 'bear burden, carry concerns',
                context: 'Metaphor for life\'s hardships'
            },
            'dắt díu': {
                type: 'idiom',
                literal: 'lead together',
                meaning: 'support each other, mutual help',
                context: 'Traditional community values'
            },
            'ru con': {
                type: 'cultural_phrase',
                literal: 'lull child',
                meaning: 'lullaby singing',
                context: 'Traditional lullaby genre'
            },

            // Nature metaphors
            'trăng tàn': {
                type: 'metaphor',
                literal: 'moon withered',
                meaning: 'fading beauty, passing time',
                context: 'Moon as metaphor for beauty and time'
            },
            'sương khói': {
                type: 'metaphor',
                literal: 'dew smoke',
                meaning: 'misty atmosphere, ethereal quality',
                context: 'Nature imagery for mood'
            },

            // Proverbs
            'có công mài sắt': {
                type: 'proverb',
                literal: 'have effort grind iron',
                meaning: 'with effort, even iron can be ground',
                context: 'Perseverance leads to success'
            }
        };
    }

    /**
     * Extract idioms from a phrase using pattern matching
     * @param {Object} phrase - Phrase object with text and wordMapping
     * @returns {Array} - Array of detected idioms
     */
    extractIdiomsFromPhrase(phrase) {
        const idioms = [];
        const text = phrase.text.toLowerCase();

        // Check database for exact matches
        for (const [vn, data] of Object.entries(this.idiomDatabase)) {
            if (text.includes(vn.toLowerCase())) {
                idioms.push({
                    vietnamese: vn,
                    literal: data.literal,
                    meaning: data.meaning,
                    type: data.type,
                    context: data.context,
                    words: vn.split(' ')
                });
            }
        }

        // Detect reduplication patterns (từ láy)
        const words = text.split(' ');
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i] === words[i + 1]) {
                const reduplication = `${words[i]} ${words[i]}`;

                // Only add if not already in database
                if (!this.idiomDatabase[reduplication]) {
                    idioms.push({
                        vietnamese: reduplication,
                        literal: `${words[i]} ${words[i]}`,
                        meaning: `emphatic or poetic repetition of "${words[i]}"`,
                        type: 'cultural_phrase',
                        context: 'Vietnamese reduplication for emphasis or poetic effect',
                        words: [words[i], words[i]]
                    });
                }
            }
        }

        // Detect rhyming pairs (common in folk music)
        const rhymePairs = this.detectRhymingPairs(words);
        rhymePairs.forEach(pair => {
            idioms.push({
                vietnamese: pair.text,
                literal: pair.text,
                meaning: `rhyming phrase for musicality`,
                type: 'cultural_phrase',
                context: 'Rhyming pattern common in Vietnamese folk music',
                words: pair.words
            });
        });

        return idioms;
    }

    /**
     * Detect rhyming pairs in Vietnamese
     * @param {Array} words - Array of words
     * @returns {Array} - Rhyming pairs
     */
    detectRhymingPairs(words) {
        const pairs = [];

        for (let i = 0; i < words.length - 1; i++) {
            const w1 = words[i];
            const w2 = words[i + 1];

            // Simple rhyme detection (same ending sound)
            if (w1.length > 2 && w2.length > 2) {
                const ending1 = w1.slice(-2);
                const ending2 = w2.slice(-2);

                if (ending1 === ending2 && w1 !== w2) {
                    pairs.push({
                        text: `${w1} ${w2}`,
                        words: [w1, w2]
                    });
                }
            }
        }

        return pairs;
    }

    /**
     * Analyze idiom patterns across all phrases
     * @param {Array} phrases - Array of phrases with idiom data
     * @returns {Object} - Idiom pattern analysis
     */
    analyzeIdiomPatterns(phrases) {
        const allIdioms = [];
        const idiomCounts = {};
        const typeDistribution = {
            idiom: 0,
            proverb: 0,
            cultural_phrase: 0,
            metaphor: 0
        };

        phrases.forEach(phrase => {
            if (phrase.idioms && phrase.idioms.length > 0) {
                phrase.idioms.forEach(idiom => {
                    allIdioms.push(idiom);

                    // Count occurrences
                    idiomCounts[idiom.vietnamese] = (idiomCounts[idiom.vietnamese] || 0) + 1;

                    // Type distribution
                    if (typeDistribution.hasOwnProperty(idiom.type)) {
                        typeDistribution[idiom.type]++;
                    }
                });
            }
        });

        return {
            totalIdioms: allIdioms.length,
            uniqueIdioms: Object.keys(idiomCounts).length,
            idiomCounts,
            typeDistribution,
            mostCommon: Object.entries(idiomCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([idiom, count]) => ({ idiom, count }))
        };
    }

    /**
     * Determine the cultural richness of the lyrics
     * @param {Object} idiomAnalysis - Idiom pattern analysis
     * @returns {Object} - Cultural assessment
     */
    assessCulturalRichness(idiomAnalysis) {
        const { totalIdioms, uniqueIdioms, typeDistribution } = idiomAnalysis;

        let richness = 'minimal';
        if (totalIdioms === 0) {
            richness = 'literal';
        } else if (uniqueIdioms >= 5) {
            richness = 'very_rich';
        } else if (uniqueIdioms >= 3) {
            richness = 'rich';
        } else if (uniqueIdioms >= 1) {
            richness = 'moderate';
        }

        const dominantType = Object.entries(typeDistribution)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            culturalRichness: richness,
            dominantIdiomType: dominantType ? dominantType[0] : 'none',
            idiomDensity: totalIdioms > 0 ? (uniqueIdioms / totalIdioms).toFixed(2) : 0,
            description: this.getCulturalDescription(richness, dominantType ? dominantType[0] : 'none')
        };
    }

    /**
     * Get cultural description
     * @param {string} richness - Cultural richness level
     * @param {string} type - Dominant idiom type
     * @returns {string} - Description
     */
    getCulturalDescription(richness, type) {
        const descriptions = {
            literal: 'Direct, straightforward lyrics with minimal cultural references',
            minimal: 'Some cultural elements, mostly literal language',
            moderate: 'Balanced use of idioms and literal language',
            rich: 'Culturally rich with frequent idiomatic expressions',
            very_rich: 'Highly sophisticated use of Vietnamese cultural idioms'
        };

        const typeDesc = {
            idiom: ' - predominantly figurative idioms',
            proverb: ' - wisdom-focused with proverbs',
            cultural_phrase: ' - culturally-rooted expressions',
            metaphor: ' - metaphorical and poetic language',
            none: ''
        };

        return descriptions[richness] + typeDesc[type];
    }

    /**
     * Process a single lyrics file through idiom detection
     * @param {string} inputPath - Path to lyrics segmentation file
     * @returns {Object} - Enhanced data with idiom analysis
     */
    processSingleFile(inputPath) {
        try {
            console.log(`\nProcessing: ${path.basename(inputPath)}`);

            const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

            if (!data.phrases || data.phrases.length === 0) {
                throw new Error('No phrases found in file');
            }

            // Extract idioms from each phrase
            console.log(`  → Detecting idioms in ${data.phrases.length} phrases...`);

            for (let i = 0; i < data.phrases.length; i++) {
                const phrase = data.phrases[i];
                const idioms = this.extractIdiomsFromPhrase(phrase);

                if (idioms.length > 0) {
                    data.phrases[i].idioms = idioms;
                }
            }

            // Analyze patterns
            const idiomAnalysis = this.analyzeIdiomPatterns(data.phrases);
            const culturalAssessment = this.assessCulturalRichness(idiomAnalysis);

            data.idiomAnalysis = {
                patterns: idiomAnalysis,
                culturalAssessment,
                processingDate: new Date().toISOString().split('T')[0],
                detector: 'local_rule_based'
            };

            console.log(`  ✓ Found ${idiomAnalysis.totalIdioms} idioms (${idiomAnalysis.uniqueIdioms} unique)`);
            console.log(`  ✓ Cultural richness: ${culturalAssessment.culturalRichness}`);

            return data;

        } catch (error) {
            console.error(`  ✗ Error: ${error.message}`);
            return null;
        }
    }
}

module.exports = LocalIdiomDetector;
