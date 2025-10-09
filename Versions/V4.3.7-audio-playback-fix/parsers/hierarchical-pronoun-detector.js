/**
 * Hierarchical Pronoun Detector
 *
 * Detects and classifies Vietnamese hierarchical pronouns that reveal social structure
 *
 * Categories:
 * - Family pronouns: con/mẹ, anh/em, ông/bà
 * - Social pronouns: thầy/trò, ông/tôi
 * - Romantic pronouns: anh/em, chàng/nàng
 */

const fs = require('fs');
const path = require('path');

/**
 * Vietnamese hierarchical pronoun dictionary
 */
const PRONOUNS = {
    // Family pronouns
    con: {
        category: 'family',
        relationship: 'child',
        register: 'intimate',
        hierarchy: 'younger/lower',
        english: 'child/I (child speaking)'
    },
    mẹ: {
        category: 'family',
        relationship: 'mother',
        register: 'intimate',
        hierarchy: 'elder/higher',
        english: 'mother/you (to mother)'
    },
    má: {
        category: 'family',
        relationship: 'mother',
        register: 'intimate',
        hierarchy: 'elder/higher',
        english: 'mom/you (to mom)'
    },
    cha: {
        category: 'family',
        relationship: 'father',
        register: 'intimate',
        hierarchy: 'elder/higher',
        english: 'father/you (to father)'
    },
    ba: {
        category: 'family',
        relationship: 'father',
        register: 'intimate',
        hierarchy: 'elder/higher',
        english: 'dad/you (to dad)'
    },
    anh: {
        category: 'family_romantic',
        relationship: 'older_sibling_or_boyfriend',
        register: 'intimate',
        hierarchy: 'elder/equal',
        english: 'older brother/you (romantic)'
    },
    chị: {
        category: 'family_romantic',
        relationship: 'older_sister_or_girlfriend',
        register: 'intimate',
        hierarchy: 'elder/equal',
        english: 'older sister/you (romantic)'
    },
    em: {
        category: 'family_romantic',
        relationship: 'younger_sibling_or_lover',
        register: 'intimate',
        hierarchy: 'younger/equal',
        english: 'younger sibling/I (romantic)'
    },
    ông: {
        category: 'family_formal',
        relationship: 'grandfather_or_sir',
        register: 'formal',
        hierarchy: 'elder/higher',
        english: 'grandfather/sir/you (formal)'
    },
    bà: {
        category: 'family_formal',
        relationship: 'grandmother_or_madam',
        register: 'formal',
        hierarchy: 'elder/higher',
        english: 'grandmother/madam/you (formal)'
    },

    // Social pronouns
    thầy: {
        category: 'social',
        relationship: 'teacher',
        register: 'formal',
        hierarchy: 'higher',
        english: 'teacher/you (to teacher)'
    },
    trò: {
        category: 'social',
        relationship: 'student',
        register: 'formal',
        hierarchy: 'lower',
        english: 'student/I (student speaking)'
    },
    tôi: {
        category: 'social',
        relationship: 'self_formal',
        register: 'formal',
        hierarchy: 'neutral',
        english: 'I (formal)'
    },
    ta: {
        category: 'social',
        relationship: 'self_collective',
        register: 'collective',
        hierarchy: 'neutral',
        english: 'we/I (collective)'
    },
    mình: {
        category: 'romantic',
        relationship: 'self_intimate',
        register: 'intimate',
        hierarchy: 'equal',
        english: 'I/you (very intimate)'
    },

    // Romantic/poetic pronouns
    chàng: {
        category: 'romantic',
        relationship: 'young_man',
        register: 'poetic',
        hierarchy: 'equal',
        english: 'lad/you (poetic, male)'
    },
    nàng: {
        category: 'romantic',
        relationship: 'young_woman',
        register: 'poetic',
        hierarchy: 'equal',
        english: 'lass/you (poetic, female)'
    },
    người: {
        category: 'romantic',
        relationship: 'person_beloved',
        register: 'poetic',
        hierarchy: 'equal',
        english: 'person/you (beloved)'
    }
};

class HierarchicalPronounDetector {
    /**
     * Detect if a word is a hierarchical pronoun
     * @param {string} word - Vietnamese word
     * @returns {Object|null} - Pronoun data if found, null otherwise
     */
    detectPronoun(word) {
        if (!word || typeof word !== 'string') {
            return null;
        }

        const normalized = word.toLowerCase().trim();

        if (PRONOUNS[normalized]) {
            return {
                pronoun: normalized,
                ...PRONOUNS[normalized]
            };
        }

        return null;
    }

    /**
     * Extract all pronouns from word mappings in a phrase
     * @param {Array} wordMapping - Array of word mappings
     * @returns {Array} - Array of detected pronouns with positions
     */
    extractPronounsFromPhrase(wordMapping) {
        if (!Array.isArray(wordMapping)) {
            return [];
        }

        const pronouns = [];

        wordMapping.forEach((word, index) => {
            const pronounData = this.detectPronoun(word.vn);
            if (pronounData) {
                pronouns.push({
                    position: index,
                    word: word.vn,
                    ...pronounData
                });
            }
        });

        return pronouns;
    }

    /**
     * Analyze pronoun usage patterns across all phrases
     * @param {Array} phrases - Array of phrases with wordMapping
     * @returns {Object} - Pronoun analysis
     */
    analyzePronounPatterns(phrases) {
        const pronounCounts = {};
        const pronounsByCategory = {};
        const pronounsByPhraseType = {};
        let totalPronouns = 0;

        phrases.forEach(phrase => {
            if (phrase.wordMapping && Array.isArray(phrase.wordMapping)) {
                const pronounsInPhrase = this.extractPronounsFromPhrase(phrase.wordMapping);

                pronounsInPhrase.forEach(p => {
                    // Count by pronoun
                    pronounCounts[p.pronoun] = (pronounCounts[p.pronoun] || 0) + 1;

                    // Count by category
                    pronounsByCategory[p.category] = (pronounsByCategory[p.category] || 0) + 1;

                    // Count by phrase type (question/answer/exclamatory/etc)
                    const phraseType = phrase.linguisticType || phrase.type || 'unknown';
                    if (!pronounsByPhraseType[p.pronoun]) {
                        pronounsByPhraseType[p.pronoun] = {};
                    }
                    pronounsByPhraseType[p.pronoun][phraseType] =
                        (pronounsByPhraseType[p.pronoun][phraseType] || 0) + 1;

                    totalPronouns++;
                });
            }
        });

        return {
            counts: pronounCounts,
            categories: pronounsByCategory,
            contextByPhraseType: pronounsByPhraseType,
            totalPronouns,
            uniquePronouns: Object.keys(pronounCounts).length
        };
    }

    /**
     * Determine social register of the song based on pronoun usage
     * @param {Object} pronounAnalysis - Result from analyzePronounPatterns
     * @returns {Object} - Social register analysis
     */
    determineSocialRegister(pronounAnalysis) {
        const { categories, counts } = pronounAnalysis;

        let dominantRegister = 'unknown';
        let dominantCategory = 'unknown';
        let interpretation = '';

        // Determine dominant category
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1]);

        if (sortedCategories.length > 0) {
            dominantCategory = sortedCategories[0][0];
        }

        // Determine register based on pronouns used
        if (counts['mình'] || counts['chàng'] || counts['nàng']) {
            dominantRegister = 'intimate_romantic';
            interpretation = 'Very intimate romantic relationship (Southern style)';
        } else if (counts['anh'] && counts['em']) {
            dominantRegister = 'intimate_romantic';
            interpretation = 'Intimate romantic relationship (Northern style)';
        } else if (counts['con'] || counts['mẹ'] || counts['cha']) {
            dominantRegister = 'family_intimate';
            interpretation = 'Family intimacy (parent-child)';
        } else if (counts['ông'] || counts['bà']) {
            dominantRegister = 'family_formal';
            interpretation = 'Formal family or respectful address';
        } else if (counts['thầy'] || counts['trò']) {
            dominantRegister = 'social_formal';
            interpretation = 'Formal social hierarchy (teacher-student)';
        } else if (counts['ta']) {
            dominantRegister = 'collective';
            interpretation = 'Collective voice (work song or communal)';
        } else if (counts['tôi']) {
            dominantRegister = 'formal_neutral';
            interpretation = 'Formal neutral register';
        }

        return {
            dominantRegister,
            dominantCategory,
            interpretation,
            evidence: counts
        };
    }

    /**
     * Process a lyrics file and add pronoun analysis
     * @param {string} lyricsFilePath - Path to lyrics segmentation JSON
     * @returns {Object} - Enhanced lyrics data with pronoun information
     */
    processLyricsFile(lyricsFilePath) {
        try {
            const lyricsData = JSON.parse(fs.readFileSync(lyricsFilePath, 'utf8'));

            // Extract pronouns from each phrase
            lyricsData.phrases = lyricsData.phrases.map(phrase => {
                const pronouns = this.extractPronounsFromPhrase(phrase.wordMapping);

                if (pronouns.length > 0) {
                    return {
                        ...phrase,
                        pronouns
                    };
                }

                return phrase;
            });

            // Analyze pronoun patterns
            const pronounAnalysis = this.analyzePronounPatterns(lyricsData.phrases);

            // Determine social register
            const socialRegister = this.determineSocialRegister(pronounAnalysis);

            // Add pronoun analysis to data
            lyricsData.pronounAnalysis = {
                patterns: pronounAnalysis,
                socialRegister,
                processingDate: new Date().toISOString().split('T')[0]
            };

            return lyricsData;

        } catch (error) {
            console.error(`Error processing ${lyricsFilePath}:`, error.message);
            return null;
        }
    }

    /**
     * Process all lyrics files in a directory
     * @param {string} inputDir - Directory containing lyrics files
     * @param {string} outputDir - Directory to save enhanced files
     */
    processAllFiles(inputDir, outputDir) {
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));

        console.log(`Processing ${files.length} lyrics files for pronoun detection...`);

        let successCount = 0;
        let errorCount = 0;

        files.forEach(file => {
            const inputPath = path.join(inputDir, file);
            const outputPath = path.join(outputDir, file);

            const enhancedData = this.processLyricsFile(inputPath);

            if (enhancedData) {
                fs.writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2), 'utf8');

                const analysis = enhancedData.pronounAnalysis;
                console.log(`✓ ${file}: ${analysis.patterns.totalPronouns} pronouns (${analysis.patterns.uniquePronouns} unique), register: ${analysis.socialRegister.dominantRegister}`);
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
    const detector = new HierarchicalPronounDetector();

    const inputDir = path.join(__dirname, '../data/lyrics-segmentations-with-tones');
    const outputDir = path.join(__dirname, '../data/lyrics-segmentations-with-tones-pronouns');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    detector.processAllFiles(inputDir, outputDir);
}

module.exports = HierarchicalPronounDetector;
