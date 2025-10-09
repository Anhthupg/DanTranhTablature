/**
 * Từ Láy (Reduplication) Tagger
 *
 * Detects and classifies Vietnamese reduplication patterns (từ láy)
 *
 * Types:
 * - Total reduplication: chiều chiều, xanh xanh (complete word repetition)
 * - Partial reduplication: lững thững, lầm lũi (phonetic variation)
 * - Rhyming reduplication: lững lờ, bâng khuâng (sound rhyming)
 */

const fs = require('fs');
const path = require('path');

/**
 * Known Vietnamese reduplication patterns
 */
const KNOWN_REDUPLICATIONS = {
    // Total reduplications (complete repetition)
    'chiều chiều': {
        type: 'total_reduplication',
        baseWord: 'chiều',
        function: 'emphasis_evocative',
        meaning: 'Evocative evening/afternoon (more poetic than plain "chiều")',
        emotionalEffect: 'Nostalgic, melancholic'
    },
    'xanh xanh': {
        type: 'total_reduplication',
        baseWord: 'xanh',
        function: 'emphasis_descriptive',
        meaning: 'Greenish/blue-ish (softer than definite "xanh")',
        emotionalEffect: 'Gentle, vague'
    },
    'đỏ đỏ': {
        type: 'total_reduplication',
        baseWord: 'đỏ',
        function: 'emphasis_descriptive',
        meaning: 'Reddish (softer color)',
        emotionalEffect: 'Gentle, approximate'
    },
    'buồn buồn': {
        type: 'total_reduplication',
        baseWord: 'buồn',
        function: 'emphasis_emotional',
        meaning: 'Somewhat sad (lighter than "buồn")',
        emotionalEffect: 'Subtle melancholy'
    },

    // Partial reduplications (phonetic variation)
    'lững thững': {
        type: 'partial_reduplication',
        baseWord: 'lững',
        function: 'descriptive_manner',
        meaning: 'Leisurely, slow and deliberate',
        emotionalEffect: 'Calm, unhurried'
    },
    'lầm lũi': {
        type: 'partial_reduplication',
        baseWord: 'lầm',
        function: 'descriptive_manner',
        meaning: 'Quietly, stealthily',
        emotionalEffect: 'Secretive, withdrawn'
    },
    'lung tung': {
        type: 'partial_reduplication',
        baseWord: 'lung',
        function: 'descriptive_manner',
        meaning: 'Messy, disorganized',
        emotionalEffect: 'Chaotic'
    },

    // Rhyming reduplications (sound beauty)
    'lững lờ': {
        type: 'rhyming_reduplication',
        baseWord: 'lững',
        function: 'onomatopoeia_sound',
        meaning: 'Wandering aimlessly',
        emotionalEffect: 'Dreamy, unfocused'
    },
    'bâng khuâng': {
        type: 'rhyming_reduplication',
        baseWord: 'bâng',
        function: 'emotional_state',
        meaning: 'Pensive, wistful',
        emotionalEffect: 'Melancholic contemplation'
    },
    'thẫn thờ': {
        type: 'rhyming_reduplication',
        baseWord: 'thẫn',
        function: 'emotional_state',
        meaning: 'Dazed, absent-minded',
        emotionalEffect: 'Lost in thought'
    },
    'miên man': {
        type: 'rhyming_reduplication',
        baseWord: 'miên',
        function: 'descriptive_state',
        meaning: 'Lingering, endless',
        emotionalEffect: 'Continuous, flowing'
    }
};

class TuLayReduplicationTagger {
    /**
     * Detect if a word pair forms a reduplication
     * @param {string} word1 - First word
     * @param {string} word2 - Second word
     * @returns {Object|null} - Reduplication data if found
     */
    detectReduplication(word1, word2) {
        if (!word1 || !word2) {
            return null;
        }

        const normalized1 = word1.toLowerCase().trim();
        const normalized2 = word2.toLowerCase().trim();
        const pair = `${normalized1} ${normalized2}`;

        // Check known reduplications first
        if (KNOWN_REDUPLICATIONS[pair]) {
            return {
                word: pair,
                ...KNOWN_REDUPLICATIONS[pair]
            };
        }

        // Detect total reduplication (exact match)
        if (normalized1 === normalized2) {
            return {
                word: pair,
                type: 'total_reduplication',
                baseWord: normalized1,
                function: 'emphasis',
                meaning: `Emphasized/evocative form of "${normalized1}"`,
                emotionalEffect: 'Intensification or softening',
                isKnownPattern: false
            };
        }

        // Detect partial reduplication (same initial consonant, similar sound)
        if (this.hasPartialReduplication(normalized1, normalized2)) {
            return {
                word: pair,
                type: 'partial_reduplication',
                baseWord: normalized1,
                function: 'descriptive_variation',
                meaning: `Phonetic variant of "${normalized1}"`,
                emotionalEffect: 'Sound-based emphasis',
                isKnownPattern: false
            };
        }

        // Detect rhyming reduplication (different initial, same final sound)
        if (this.hasRhymingReduplication(normalized1, normalized2)) {
            return {
                word: pair,
                type: 'rhyming_reduplication',
                baseWord: normalized1,
                function: 'sound_beauty',
                meaning: `Rhyming compound with "${normalized1}"`,
                emotionalEffect: 'Rhythmic, poetic',
                isKnownPattern: false
            };
        }

        return null;
    }

    /**
     * Check if two words have partial reduplication (same initial, similar vowels)
     * @param {string} word1 - First word
     * @param {string} word2 - Second word
     * @returns {boolean}
     */
    hasPartialReduplication(word1, word2) {
        if (word1.length < 2 || word2.length < 2) {
            return false;
        }

        // Same initial consonant
        const initial1 = word1[0];
        const initial2 = word2[0];

        if (initial1 !== initial2) {
            return false;
        }

        // Similar vowel sounds (basic check)
        const vowels1 = word1.match(/[aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ]/g) || [];
        const vowels2 = word2.match(/[aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ]/g) || [];

        return vowels1.length > 0 && vowels2.length > 0;
    }

    /**
     * Check if two words have rhyming reduplication (different initial, same ending)
     * @param {string} word1 - First word
     * @param {string} word2 - Second word
     * @returns {boolean}
     */
    hasRhymingReduplication(word1, word2) {
        if (word1.length < 2 || word2.length < 2) {
            return false;
        }

        // Different initial consonant
        if (word1[0] === word2[0]) {
            return false;
        }

        // Similar ending sounds (basic rhyme check)
        const ending1 = word1.slice(-2);
        const ending2 = word2.slice(-2);

        // Check if endings rhyme (loose definition)
        return ending1 === ending2 || 
               this.areRhymingSounds(ending1, ending2);
    }

    /**
     * Check if two endings are rhyming sounds
     * @param {string} ending1 
     * @param {string} ending2 
     * @returns {boolean}
     */
    areRhymingSounds(ending1, ending2) {
        const rhymePairs = [
            ['ng', 'nh'], ['nh', 'ng'],
            ['ng', 'n'], ['n', 'ng'],
            ['m', 'n'], ['n', 'm'],
            ['i', 'y'], ['y', 'i'],
            ['o', 'u'], ['u', 'o']
        ];

        return rhymePairs.some(pair => 
            (ending1.endsWith(pair[0]) && ending2.endsWith(pair[1])) ||
            (ending1.endsWith(pair[1]) && ending2.endsWith(pair[0]))
        );
    }

    /**
     * Extract all reduplications from a phrase
     * @param {Array} wordMapping - Array of word mappings
     * @returns {Array} - Array of detected reduplications
     */
    extractReduplicationsFromPhrase(wordMapping) {
        if (!Array.isArray(wordMapping) || wordMapping.length < 2) {
            return [];
        }

        const reduplications = [];

        for (let i = 0; i < wordMapping.length - 1; i++) {
            const redup = this.detectReduplication(
                wordMapping[i].vn,
                wordMapping[i + 1].vn
            );

            if (redup) {
                reduplications.push({
                    position: i,
                    words: [wordMapping[i].vn, wordMapping[i + 1].vn],
                    ...redup
                });
            }
        }

        return reduplications;
    }

    /**
     * Analyze reduplication patterns across all phrases
     * @param {Array} phrases - Array of phrases with wordMapping
     * @returns {Object} - Reduplication analysis
     */
    analyzeReduplicationPatterns(phrases) {
        const typeCounts = {
            total_reduplication: 0,
            partial_reduplication: 0,
            rhyming_reduplication: 0
        };

        const positionCounts = {
            phraseBeginning: 0,
            phraseMiddle: 0,
            phraseEnding: 0
        };

        const allReduplications = [];
        let totalReduplications = 0;
        let totalPhrases = 0;

        phrases.forEach(phrase => {
            if (phrase.wordMapping && Array.isArray(phrase.wordMapping)) {
                totalPhrases++;
                const redups = this.extractReduplicationsFromPhrase(phrase.wordMapping);

                redups.forEach(redup => {
                    // Count by type
                    typeCounts[redup.type]++;

                    // Count by position in phrase
                    const phraseLength = phrase.wordMapping.length;
                    if (redup.position === 0) {
                        positionCounts.phraseBeginning++;
                    } else if (redup.position >= phraseLength - 2) {
                        positionCounts.phraseEnding++;
                    } else {
                        positionCounts.phraseMiddle++;
                    }

                    allReduplications.push({
                        phraseId: phrase.id,
                        ...redup
                    });

                    totalReduplications++;
                });
            }
        });

        const reduplicationPercentage = totalPhrases > 0
            ? parseFloat(((totalReduplications / totalPhrases) * 100).toFixed(2))
            : 0;

        return {
            typeCounts,
            positionCounts,
            totalReduplications,
            reduplicationPercentage,
            allReduplications,
            uniquePatterns: [...new Set(allReduplications.map(r => r.word))].length
        };
    }

    /**
     * Determine reduplication style
     * @param {Object} reduplicationAnalysis - Result from analyzeReduplicationPatterns
     * @returns {Object} - Style analysis
     */
    determineReduplicationStyle(reduplicationAnalysis) {
        const { reduplicationPercentage, typeCounts } = reduplicationAnalysis;

        let style = 'direct_simple';
        let interpretation = '';

        if (reduplicationPercentage === 0) {
            style = 'direct_simple';
            interpretation = 'No reduplication - direct, unadorned language';
        } else if (reduplicationPercentage < 10) {
            style = 'occasional_reduplication';
            interpretation = 'Occasional reduplication for emphasis';
        } else if (reduplicationPercentage < 25) {
            style = 'moderate_reduplication';
            interpretation = 'Moderate use of reduplication for sound and meaning';
        } else {
            style = 'heavy_reduplication';
            interpretation = 'Rich use of reduplication - highly evocative, rhythmic';
        }

        // Determine dominant type
        const sortedTypes = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1]);
        const dominantType = sortedTypes.length > 0 && sortedTypes[0][1] > 0
            ? sortedTypes[0][0]
            : 'none';

        return {
            style,
            interpretation,
            dominantType,
            reduplicationPercentage,
            evidence: typeCounts
        };
    }

    /**
     * Process a lyrics file and add reduplication analysis
     * @param {string} lyricsFilePath - Path to lyrics JSON
     * @returns {Object} - Enhanced lyrics data
     */
    processLyricsFile(lyricsFilePath) {
        try {
            const lyricsData = JSON.parse(fs.readFileSync(lyricsFilePath, 'utf8'));

            // Extract reduplications from each phrase
            lyricsData.phrases = lyricsData.phrases.map(phrase => {
                const reduplications = this.extractReduplicationsFromPhrase(phrase.wordMapping);

                if (reduplications.length > 0) {
                    return {
                        ...phrase,
                        reduplications
                    };
                }

                return phrase;
            });

            // Analyze reduplication patterns
            const reduplicationAnalysis = this.analyzeReduplicationPatterns(lyricsData.phrases);

            // Determine style
            const reduplicationStyle = this.determineReduplicationStyle(reduplicationAnalysis);

            // Add analysis to data
            lyricsData.reduplicationAnalysis = {
                patterns: reduplicationAnalysis,
                style: reduplicationStyle,
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

        console.log(`Processing ${files.length} lyrics files for reduplication detection...`);

        let successCount = 0;
        let errorCount = 0;

        files.forEach(file => {
            const inputPath = path.join(inputDir, file);
            const outputPath = path.join(outputDir, file);

            const enhancedData = this.processLyricsFile(inputPath);

            if (enhancedData) {
                fs.writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2), 'utf8');

                const analysis = enhancedData.reduplicationAnalysis;
                console.log(`✓ ${file}: ${analysis.patterns.totalReduplications} reduplications (${analysis.patterns.reduplicationPercentage}%), style: ${analysis.style.style}`);
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
    const tagger = new TuLayReduplicationTagger();

    const inputDir = path.join(__dirname, '../data/lyrics-segmentations');
    const outputDir = path.join(__dirname, '../data/lyrics-segmentations-with-reduplication');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    tagger.processAllFiles(inputDir, outputDir);
}

module.exports = TuLayReduplicationTagger;
