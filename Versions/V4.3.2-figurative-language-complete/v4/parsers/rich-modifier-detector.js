/**
 * Rich Modifier Detector
 *
 * Detects Vietnamese poetic classifiers and metaphoric compounds that add emotional depth
 *
 * Types:
 * - Noun classifiers with emotional layers (con thuyền, cánh buồm)
 * - Metaphoric compounds (mảnh trăng, dòng sông)
 */

const fs = require('fs');
const path = require('path');

/**
 * Vietnamese classifiers and their emotional/metaphoric meanings
 */
const CLASSIFIERS = {
    // Animacy classifiers (add life/intimacy)
    con: {
        type: 'animacy',
        nouns: ['thuyền', 'đường', 'người', 'sông', 'mắt'],
        emotionalLayer: 'intimacy_life',
        meaning: 'Makes object intimate/alive (like a small living thing)',
        examples: ['con thuyền = little boat', 'con đường = dear path']
    },

    // Fragment/piece classifiers (suggest incompleteness/loneliness)
    mảnh: {
        type: 'fragment',
        nouns: ['trăng', 'đời', 'tình', 'bóng', 'hồn'],
        emotionalLayer: 'loneliness_incompleteness',
        meaning: 'Fragment/piece (suggests something broken or incomplete)',
        examples: ['mảnh trăng = moon fragment', 'mảnh đời = life fragment']
    },

    // Drop/particle classifiers (make precious/singular)
    giọt: {
        type: 'particle',
        nouns: ['sương', 'mưa', 'nước', 'lệ', 'máu'],
        emotionalLayer: 'preciousness',
        meaning: 'Drop/particle (makes substance precious and singular)',
        examples: ['giọt sương = dewdrop', 'giọt lệ = teardrop']
    },

    // Wave/layer classifiers (add flowing movement)
    làn: {
        type: 'wave_layer',
        nouns: ['gió', 'mây', 'sương', 'khói', 'nước'],
        emotionalLayer: 'flowing_ethereal',
        meaning: 'Wave/layer (wind/water moves like waves)',
        examples: ['làn gió = wind wave', 'làn sương = mist layer']
    },

    // Wing classifiers (add bird-like quality)
    cánh: {
        type: 'wing',
        nouns: ['buồm', 'hoa', 'cửa', 'chim'],
        emotionalLayer: 'flight_freedom',
        meaning: 'Wing (makes object bird-like, free)',
        examples: ['cánh buồm = sail wing', 'cánh hoa = flower petal']
    },

    // Flow/lineage classifiers (add continuity/ancestry)
    dòng: {
        type: 'flow_lineage',
        nouns: ['sông', 'máu', 'người', 'thời gian', 'lệ'],
        emotionalLayer: 'continuity_heritage',
        meaning: 'Flow/lineage (suggests ancestry, continuity)',
        examples: ['dòng sông = river flow', 'dòng máu = bloodline']
    },

    // Container classifiers (nurturing quality)
    bầu: {
        type: 'container',
        nouns: ['trời', 'không khí', 'tâm tư'],
        emotionalLayer: 'nurturing_containing',
        meaning: 'Gourd/container (sky as nurturing vessel)',
        examples: ['bầu trời = sky gourd', 'bầu không khí = atmosphere']
    },

    // Flap/evening classifiers (flowing like sunset)
    tà: {
        type: 'flap_flowing',
        nouns: ['áo', 'dài', 'nắng'],
        emotionalLayer: 'elegance_transition',
        meaning: 'Flap/evening (flows gracefully, transitional)',
        examples: ['tà áo = dress flap', 'tà dương = evening sun']
    },

    // Strand/thread classifiers (delicate connections)
    sợi: {
        type: 'strand',
        nouns: ['tóc', 'dây', 'tơ', 'mưa'],
        emotionalLayer: 'delicacy_connection',
        meaning: 'Strand/thread (delicate, connecting)',
        examples: ['sợi tóc = hair strand', 'sợi tơ = silk thread']
    },

    // Leaf/petal classifiers (ephemeral beauty)
    lá: {
        type: 'leaf',
        nouns: ['thư', 'cờ', 'bài'],
        emotionalLayer: 'ephemeral_beauty',
        meaning: 'Leaf/sheet (thin, ephemeral)',
        examples: ['lá thư = letter leaf', 'lá cờ = flag']
    }
};

/**
 * Common metaphoric compound patterns
 */
const METAPHORIC_PATTERNS = {
    // Time metaphors
    time: {
        patterns: ['mảnh trăng', 'cánh buồm thời gian', 'dòng thời gian'],
        theme: 'time_passage',
        interpretation: 'Time as flowing/fragmenting entity'
    },

    // Emotion metaphors
    emotion: {
        patterns: ['giọt lệ', 'mảnh tình', 'dòng lệ'],
        theme: 'emotional_expression',
        interpretation: 'Emotions as physical substances'
    },

    // Nature metaphors
    nature: {
        patterns: ['làn gió', 'giọt sương', 'cánh hoa'],
        theme: 'natural_imagery',
        interpretation: 'Nature with human-like qualities'
    },

    // Life metaphors
    life: {
        patterns: ['mảnh đời', 'con đường', 'dòng máu'],
        theme: 'life_journey',
        interpretation: 'Life as path/flow/fragment'
    }
};

class RichModifierDetector {
    /**
     * Detect if a word pair is a classifier + noun combination
     * @param {Array} wordMapping - Array of words in phrase
     * @param {number} index - Current word index
     * @returns {Object|null} - Modifier data if found
     */
    detectModifier(wordMapping, index) {
        if (!wordMapping || index >= wordMapping.length - 1) {
            return null;
        }

        const currentWord = wordMapping[index].vn.toLowerCase().trim();
        const nextWord = wordMapping[index + 1].vn.toLowerCase().trim();

        // Check if current word is a classifier
        if (CLASSIFIERS[currentWord]) {
            const classifier = CLASSIFIERS[currentWord];

            // Check if next word is in the classifier's noun list
            const isKnownNoun = classifier.nouns.includes(nextWord);

            return {
                position: index,
                classifier: currentWord,
                noun: nextWord,
                phrase: `${currentWord} ${nextWord}`,
                type: classifier.type,
                emotionalLayer: classifier.emotionalLayer,
                meaning: classifier.meaning,
                isKnownPattern: isKnownNoun,
                metaphorFamily: this.identifyMetaphorFamily(`${currentWord} ${nextWord}`)
            };
        }

        return null;
    }

    /**
     * Identify which metaphor family a phrase belongs to
     * @param {string} phrase - Classifier + noun phrase
     * @returns {string|null} - Metaphor family theme
     */
    identifyMetaphorFamily(phrase) {
        for (const [family, data] of Object.entries(METAPHORIC_PATTERNS)) {
            if (data.patterns.some(p => p.includes(phrase))) {
                return data.theme;
            }
        }
        return null;
    }

    /**
     * Extract all modifiers from a phrase
     * @param {Array} wordMapping - Array of word mappings
     * @returns {Array} - Array of detected modifiers
     */
    extractModifiersFromPhrase(wordMapping) {
        if (!Array.isArray(wordMapping)) {
            return [];
        }

        const modifiers = [];

        for (let i = 0; i < wordMapping.length - 1; i++) {
            const modifier = this.detectModifier(wordMapping, i);
            if (modifier) {
                modifiers.push(modifier);
            }
        }

        return modifiers;
    }

    /**
     * Calculate richness index for a phrase (modifiers per phrase)
     * @param {Array} modifiers - Detected modifiers in phrase
     * @param {number} phraseLength - Number of words in phrase
     * @returns {number} - Richness index (0 = simple, higher = richer)
     */
    calculatePhraseRichness(modifiers, phraseLength) {
        if (phraseLength === 0) return 0;
        return modifiers.length / phraseLength;
    }

    /**
     * Analyze modifier patterns across all phrases
     * @param {Array} phrases - Array of phrases with wordMapping
     * @returns {Object} - Modifier analysis
     */
    analyzeModifierPatterns(phrases) {
        const classifierCounts = {};
        const typesCounts = {};
        const emotionalLayers = {};
        const metaphorFamilies = {};
        const richnessIndex = {};
        let totalModifiers = 0;
        let totalPhrases = 0;

        phrases.forEach(phrase => {
            if (phrase.wordMapping && Array.isArray(phrase.wordMapping)) {
                totalPhrases++;
                const modifiers = this.extractModifiersFromPhrase(phrase.wordMapping);

                // Calculate richness for this phrase
                const richness = this.calculatePhraseRichness(
                    modifiers,
                    phrase.wordMapping.length
                );
                richnessIndex[`phrase_${phrase.id}`] = parseFloat(richness.toFixed(2));

                modifiers.forEach(m => {
                    // Count by classifier
                    classifierCounts[m.classifier] = (classifierCounts[m.classifier] || 0) + 1;

                    // Count by type
                    typesCounts[m.type] = (typesCounts[m.type] || 0) + 1;

                    // Count by emotional layer
                    emotionalLayers[m.emotionalLayer] = (emotionalLayers[m.emotionalLayer] || 0) + 1;

                    // Count by metaphor family
                    if (m.metaphorFamily) {
                        metaphorFamilies[m.metaphorFamily] = (metaphorFamilies[m.metaphorFamily] || 0) + 1;
                    }

                    totalModifiers++;
                });
            }
        });

        const averageRichness = totalPhrases > 0
            ? parseFloat((totalModifiers / totalPhrases).toFixed(2))
            : 0;

        return {
            classifiers: classifierCounts,
            types: typesCounts,
            emotionalLayers,
            metaphorFamilies,
            richnessIndex,
            averageRichness,
            totalModifiers,
            uniqueClassifiers: Object.keys(classifierCounts).length
        };
    }

    /**
     * Determine poetic style based on modifier usage
     * @param {Object} modifierAnalysis - Result from analyzeModifierPatterns
     * @returns {Object} - Poetic style analysis
     */
    determinePoeticStyle(modifierAnalysis) {
        const { averageRichness, emotionalLayers, metaphorFamilies } = modifierAnalysis;

        let poeticStyle = 'simple_direct';
        let interpretation = '';

        if (averageRichness === 0) {
            poeticStyle = 'simple_direct';
            interpretation = 'Simple, direct language with no poetic modifiers';
        } else if (averageRichness < 0.2) {
            poeticStyle = 'lightly_poetic';
            interpretation = 'Occasional poetic touches, mostly straightforward';
        } else if (averageRichness < 0.5) {
            poeticStyle = 'moderately_poetic';
            interpretation = 'Balanced mix of poetic and direct language';
        } else {
            poeticStyle = 'highly_poetic';
            interpretation = 'Rich poetic imagery, literary style';
        }

        // Determine dominant emotional layer
        const sortedLayers = Object.entries(emotionalLayers)
            .sort((a, b) => b[1] - a[1]);
        const dominantLayer = sortedLayers.length > 0 ? sortedLayers[0][0] : 'none';

        // Determine dominant metaphor family
        const sortedFamilies = Object.entries(metaphorFamilies)
            .sort((a, b) => b[1] - a[1]);
        const dominantMetaphor = sortedFamilies.length > 0 ? sortedFamilies[0][0] : 'none';

        return {
            poeticStyle,
            averageRichness,
            interpretation,
            dominantEmotionalLayer: dominantLayer,
            dominantMetaphorFamily: dominantMetaphor,
            evidence: {
                emotionalLayers,
                metaphorFamilies
            }
        };
    }

    /**
     * Process a lyrics file and add modifier analysis
     * @param {string} lyricsFilePath - Path to lyrics JSON
     * @returns {Object} - Enhanced lyrics data
     */
    processLyricsFile(lyricsFilePath) {
        try {
            const lyricsData = JSON.parse(fs.readFileSync(lyricsFilePath, 'utf8'));

            // Extract modifiers from each phrase
            lyricsData.phrases = lyricsData.phrases.map(phrase => {
                const modifiers = this.extractModifiersFromPhrase(phrase.wordMapping);

                if (modifiers.length > 0) {
                    return {
                        ...phrase,
                        modifiers
                    };
                }

                return phrase;
            });

            // Analyze modifier patterns
            const modifierAnalysis = this.analyzeModifierPatterns(lyricsData.phrases);

            // Determine poetic style
            const poeticStyle = this.determinePoeticStyle(modifierAnalysis);

            // Add analysis to data
            lyricsData.modifierAnalysis = {
                patterns: modifierAnalysis,
                poeticStyle,
                processingDate: new Date().toISOString().split('T')[0]
            };

            return lyricsData;

        } catch (error) {
            console.error(`Error processing ${lyricsFilePath}:`, error.message);
            return null;
        }
    }

    /**
     * Process all lyrics files
     * @param {string} inputDir - Input directory
     * @param {string} outputDir - Output directory
     */
    processAllFiles(inputDir, outputDir) {
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));

        console.log(`Processing ${files.length} lyrics files for modifier detection...`);

        let successCount = 0;
        let errorCount = 0;

        files.forEach(file => {
            const inputPath = path.join(inputDir, file);
            const outputPath = path.join(outputDir, file);

            const enhancedData = this.processLyricsFile(inputPath);

            if (enhancedData) {
                fs.writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2), 'utf8');

                const analysis = enhancedData.modifierAnalysis;
                console.log(`✓ ${file}: ${analysis.patterns.totalModifiers} modifiers (richness: ${analysis.patterns.averageRichness}), style: ${analysis.poeticStyle.poeticStyle}`);
                successCount++;
            } else {
                console.error(`✗ ${file}: Failed`);
                errorCount++;
            }
        });

        console.log(`\nComplete: ${successCount} success, ${errorCount} errors`);
    }
}

// Example usage
if (require.main === module) {
    const detector = new RichModifierDetector();

    const inputDir = path.join(__dirname, '../data/lyrics-segmentations-with-tones-pronouns');
    const outputDir = path.join(__dirname, '../data/lyrics-segmentations-with-tones-pronouns-modifiers');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    detector.processAllFiles(inputDir, outputDir);
}

module.exports = RichModifierDetector;
