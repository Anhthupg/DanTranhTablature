/**
 * Vietnamese Tone Extractor
 *
 * Extracts the 6 Vietnamese tones from syllable text based on diacritics
 *
 * The 6 tones:
 * - ngang (level tone): a, ă, â
 * - sắc (rising tone): á, ắ, ấ
 * - huyền (falling tone): à, ằ, ầ
 * - hỏi (broken/dipping tone): ả, ẳ, ẩ
 * - ngã (rising glottalized tone): ã, ẵ, ẫ
 * - nặng (heavy/drop tone): ạ, ặ, ậ
 */

const fs = require('fs');
const path = require('path');

/**
 * Vietnamese vowel characters mapped by tone
 */
const VIETNAMESE_TONES = {
    ngang: {
        pattern: /[aăâeêioôơuưy]/i,
        description: "Level tone (no diacritic)"
    },
    sắc: {
        pattern: /[áắấéếíóốớúứý]/i,
        description: "Rising tone (acute accent)"
    },
    huyền: {
        pattern: /[àằầèềìòồờùừỳ]/i,
        description: "Falling tone (grave accent)"
    },
    hỏi: {
        pattern: /[ảẳẩẻểỉỏổởủửỷ]/i,
        description: "Broken/dipping tone (hook above)"
    },
    ngã: {
        pattern: /[ãẵẫẽễĩõỗỡũữỹ]/i,
        description: "Rising glottalized tone (tilde)"
    },
    nặng: {
        pattern: /[ạặậẹệịọộợụựỵ]/i,
        description: "Heavy/drop tone (dot below)"
    }
};

class VietnameseToneExtractor {
    /**
     * Extract tone from a Vietnamese syllable
     * @param {string} syllable - Vietnamese syllable
     * @returns {string} - Tone name (ngang, sắc, huyền, hỏi, ngã, nặng)
     */
    extractTone(syllable) {
        if (!syllable || typeof syllable !== 'string') {
            return null;
        }

        // Check each tone pattern
        for (const [toneName, toneData] of Object.entries(VIETNAMESE_TONES)) {
            if (toneName === 'ngang') continue; // Check ngang last (default)

            if (toneData.pattern.test(syllable)) {
                return toneName;
            }
        }

        // If no tone mark found, it's ngang (level tone)
        return 'ngang';
    }

    /**
     * Extract tones from all syllables in a word mapping
     * @param {Array} wordMapping - Array of word mappings with {vn, en} structure
     * @returns {Array} - Array with tone information added
     */
    extractTonesFromWordMapping(wordMapping) {
        if (!Array.isArray(wordMapping)) {
            return [];
        }

        return wordMapping.map(word => ({
            ...word,
            tone: this.extractTone(word.vn)
        }));
    }

    /**
     * Calculate tone distribution for a song
     * @param {Array} phrases - Array of phrases with wordMapping
     * @returns {Object} - Tone distribution statistics
     */
    calculateToneDistribution(phrases) {
        const toneCounts = {
            ngang: 0,
            sắc: 0,
            huyền: 0,
            hỏi: 0,
            ngã: 0,
            nặng: 0
        };

        let totalSyllables = 0;

        phrases.forEach(phrase => {
            if (phrase.wordMapping && Array.isArray(phrase.wordMapping)) {
                phrase.wordMapping.forEach(word => {
                    const tone = this.extractTone(word.vn);
                    if (tone) {
                        toneCounts[tone]++;
                        totalSyllables++;
                    }
                });
            }
        });

        // Calculate percentages
        const tonePercentages = {};
        for (const [tone, count] of Object.entries(toneCounts)) {
            tonePercentages[tone] = totalSyllables > 0
                ? parseFloat(((count / totalSyllables) * 100).toFixed(2))
                : 0;
        }

        return {
            counts: toneCounts,
            percentages: tonePercentages,
            totalSyllables
        };
    }

    /**
     * Extract tone sequences (KTIC patterns - Tier 2)
     * @param {Array} phrases - Array of phrases with wordMapping
     * @returns {Object} - Tone transition patterns
     */
    extractToneSequences(phrases) {
        const toneSequences = {
            two_tone: {},  // KTIC-2: tone-to-tone transitions
            three_tone: {} // KTIC-3: three-tone sequences
        };

        phrases.forEach(phrase => {
            if (phrase.wordMapping && Array.isArray(phrase.wordMapping)) {
                const tones = phrase.wordMapping.map(word => this.extractTone(word.vn));

                // Two-tone sequences (KTIC-2)
                for (let i = 0; i < tones.length - 1; i++) {
                    const seq = `${tones[i]}→${tones[i+1]}`;
                    toneSequences.two_tone[seq] = (toneSequences.two_tone[seq] || 0) + 1;
                }

                // Three-tone sequences (KTIC-3)
                for (let i = 0; i < tones.length - 2; i++) {
                    const seq = `${tones[i]}→${tones[i+1]}→${tones[i+2]}`;
                    toneSequences.three_tone[seq] = (toneSequences.three_tone[seq] || 0) + 1;
                }
            }
        });

        return toneSequences;
    }

    /**
     * Process a lyrics segmentation file and add tone information
     * @param {string} lyricsFilePath - Path to lyrics segmentation JSON
     * @returns {Object} - Enhanced lyrics data with tone information
     */
    processLyricsFile(lyricsFilePath) {
        try {
            const lyricsData = JSON.parse(fs.readFileSync(lyricsFilePath, 'utf8'));

            // Add tone information to each word in wordMapping
            lyricsData.phrases = lyricsData.phrases.map(phrase => ({
                ...phrase,
                wordMapping: this.extractTonesFromWordMapping(phrase.wordMapping)
            }));

            // Calculate tone distribution
            const toneDistribution = this.calculateToneDistribution(lyricsData.phrases);

            // Extract tone sequences
            const toneSequences = this.extractToneSequences(lyricsData.phrases);

            // Add tone analysis to statistics
            lyricsData.toneAnalysis = {
                distribution: toneDistribution,
                sequences: toneSequences,
                processingDate: new Date().toISOString().split('T')[0]
            };

            return lyricsData;

        } catch (error) {
            console.error(`Error processing ${lyricsFilePath}:`, error.message);
            return null;
        }
    }

    /**
     * Process all lyrics segmentation files in a directory
     * @param {string} segmentationDir - Directory containing lyrics segmentation files
     * @param {string} outputDir - Directory to save enhanced files
     */
    processAllFiles(segmentationDir, outputDir) {
        const files = fs.readdirSync(segmentationDir).filter(f => f.endsWith('.json'));

        console.log(`Processing ${files.length} lyrics files for tone extraction...`);

        let successCount = 0;
        let errorCount = 0;

        files.forEach(file => {
            const inputPath = path.join(segmentationDir, file);
            const outputPath = path.join(outputDir, file);

            const enhancedData = this.processLyricsFile(inputPath);

            if (enhancedData) {
                fs.writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2), 'utf8');
                console.log(`✓ ${file}: ${enhancedData.toneAnalysis.distribution.totalSyllables} syllables, ${Object.keys(enhancedData.toneAnalysis.sequences.two_tone).length} tone transitions`);
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
    const extractor = new VietnameseToneExtractor();

    const segmentationDir = path.join(__dirname, '../data/lyrics-segmentations');
    const outputDir = path.join(__dirname, '../data/lyrics-segmentations-with-tones');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    extractor.processAllFiles(segmentationDir, outputDir);
}

module.exports = VietnameseToneExtractor;
