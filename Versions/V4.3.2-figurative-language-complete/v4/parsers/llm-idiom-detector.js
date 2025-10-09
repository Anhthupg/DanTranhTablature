#!/usr/bin/env node

/**
 * LLM-Based Idiom Detector
 *
 * Uses Claude LLM to detect Vietnamese idioms, proverbs, and cultural phrases
 * in traditional music lyrics, providing meanings and cultural context.
 *
 * Tier 1 Linguistic Analysis - Component 5/5
 */

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

class LLMIdiomDetector {
    constructor() {
        this.apiKey = process.env.ANTHROPIC_API_KEY;
        if (!this.apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable not set');
        }
        this.client = new Anthropic({ apiKey: this.apiKey });
    }

    /**
     * Extract idioms from a phrase using Claude LLM
     * @param {Object} phrase - Phrase object with text and wordMapping
     * @returns {Promise<Array>} - Array of detected idioms
     */
    async extractIdiomsFromPhrase(phrase) {
        const prompt = `Analyze this Vietnamese phrase from traditional folk music and identify any idioms, proverbs, or culturally significant multi-word expressions:

"${phrase.text}"

For each idiom/expression found, provide:
1. The exact Vietnamese text (as it appears in the phrase)
2. Literal English translation
3. Idiomatic/cultural meaning
4. Type (idiom, proverb, cultural_phrase, metaphor)
5. Cultural context (brief explanation)

Respond in JSON format:
{
  "idioms": [
    {
      "vietnamese": "exact phrase",
      "literal": "word-for-word translation",
      "meaning": "idiomatic meaning",
      "type": "idiom|proverb|cultural_phrase|metaphor",
      "context": "brief cultural explanation",
      "words": ["word1", "word2", ...]
    }
  ]
}

If no idioms found, return: {"idioms": []}`;

        try {
            const response = await this.client.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const result = JSON.parse(response.content[0].text);
            return result.idioms || [];
        } catch (error) {
            console.error(`  ✗ LLM error for phrase "${phrase.text}": ${error.message}`);
            return [];
        }
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
     * @returns {Promise<Object>} - Enhanced data with idiom analysis
     */
    async processSingleFile(inputPath) {
        try {
            console.log(`\nProcessing: ${path.basename(inputPath)}`);

            const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

            if (!data.phrases || data.phrases.length === 0) {
                throw new Error('No phrases found in file');
            }

            // Extract idioms from each phrase (with rate limiting)
            console.log(`  → Detecting idioms in ${data.phrases.length} phrases...`);

            for (let i = 0; i < data.phrases.length; i++) {
                const phrase = data.phrases[i];

                // LLM call with progress indicator
                process.stdout.write(`\r  → Processing phrase ${i + 1}/${data.phrases.length}...`);

                const idioms = await this.extractIdiomsFromPhrase(phrase);

                if (idioms.length > 0) {
                    data.phrases[i].idioms = idioms;
                }

                // Rate limiting: 1 request per second
                if (i < data.phrases.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            console.log(); // New line after progress

            // Analyze patterns
            const idiomAnalysis = this.analyzeIdiomPatterns(data.phrases);
            const culturalAssessment = this.assessCulturalRichness(idiomAnalysis);

            data.idiomAnalysis = {
                patterns: idiomAnalysis,
                culturalAssessment,
                processingDate: new Date().toISOString().split('T')[0]
            };

            console.log(`  ✓ Found ${idiomAnalysis.totalIdioms} idioms (${idiomAnalysis.uniqueIdioms} unique)`);
            console.log(`  ✓ Cultural richness: ${culturalAssessment.culturalRichness}`);

            return data;

        } catch (error) {
            console.error(`  ✗ Error: ${error.message}`);
            return null;
        }
    }

    /**
     * Process all files in a directory
     * @param {string} inputDir - Input directory with lyrics files
     * @param {string} outputDir - Output directory for enhanced files
     */
    async processAllFiles(inputDir, outputDir) {
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));

        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║        LLM-Based Idiom Detection - Tier 1 Processing     ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');
        console.log(`Input:  ${inputDir}`);
        console.log(`Output: ${outputDir}`);
        console.log(`Files:  ${files.length}\n`);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        let successCount = 0;
        let errorCount = 0;
        const startTime = Date.now();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const inputPath = path.join(inputDir, file);
            const outputPath = path.join(outputDir, file);

            console.log(`\n[${i + 1}/${files.length}] ${file}`);

            const enhancedData = await this.processSingleFile(inputPath);

            if (enhancedData) {
                fs.writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2), 'utf8');

                const idioms = enhancedData.idiomAnalysis?.patterns?.totalIdioms || 0;
                const richness = enhancedData.idiomAnalysis?.culturalAssessment?.culturalRichness || 'unknown';

                console.log(`  📊 Idioms: ${idioms} | Richness: ${richness}`);
                successCount++;
            } else {
                errorCount++;
            }

            // Rate limiting between files
            if (i < files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║              Idiom Detection Complete                     ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log(`\n✓ Success: ${successCount} files`);
        console.log(`✗ Errors:  ${errorCount} files`);
        console.log(`⏱ Duration: ${duration}s\n`);
    }

    /**
     * Generate collection-level idiom statistics
     * @param {string} enhancedDir - Directory with enhanced lyrics files
     * @returns {Object} - Collection idiom statistics
     */
    generateCollectionStats(enhancedDir) {
        const files = fs.readdirSync(enhancedDir).filter(f => f.endsWith('.json'));

        const stats = {
            totalSongs: files.length,
            idiomUsage: {},
            typeDistribution: { idiom: 0, proverb: 0, cultural_phrase: 0, metaphor: 0 },
            culturalRichness: {}
        };

        files.forEach(file => {
            const data = JSON.parse(fs.readFileSync(path.join(enhancedDir, file), 'utf8'));

            // Aggregate idiom usage
            if (data.idiomAnalysis?.patterns?.idiomCounts) {
                Object.entries(data.idiomAnalysis.patterns.idiomCounts).forEach(([idiom, count]) => {
                    stats.idiomUsage[idiom] = (stats.idiomUsage[idiom] || 0) + count;
                });
            }

            // Aggregate type distribution
            if (data.idiomAnalysis?.patterns?.typeDistribution) {
                Object.entries(data.idiomAnalysis.patterns.typeDistribution).forEach(([type, count]) => {
                    stats.typeDistribution[type] += count;
                });
            }

            // Count cultural richness levels
            const richness = data.idiomAnalysis?.culturalAssessment?.culturalRichness;
            if (richness) {
                stats.culturalRichness[richness] = (stats.culturalRichness[richness] || 0) + 1;
            }
        });

        return stats;
    }
}

// CLI execution
if (require.main === module) {
    const detector = new LLMIdiomDetector();

    const inputDir = path.join(__dirname, '../data/lyrics-segmentations');
    const outputDir = path.join(__dirname, '../data/lyrics-enhanced-tier1-idioms');

    // Process all files
    (async () => {
        await detector.processAllFiles(inputDir, outputDir);

        // Generate collection stats
        console.log('\n📊 Generating collection-level idiom statistics...\n');
        const stats = detector.generateCollectionStats(outputDir);

        const statsPath = path.join(outputDir, '_idiom-collection-stats.json');
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');

        console.log('Collection Idiom Statistics:');
        console.log(`  Total Songs: ${stats.totalSongs}`);
        console.log(`  Total Unique Idioms: ${Object.keys(stats.idiomUsage).length}`);
        console.log(`  Type Distribution: ${JSON.stringify(stats.typeDistribution)}`);
        console.log(`  Top Idioms: ${Object.entries(stats.idiomUsage).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([i, c]) => `${i}(${c})`).join(', ')}`);
        console.log(`  Richness Levels: ${JSON.stringify(stats.culturalRichness)}`);
        console.log(`\n✓ Stats saved to: ${statsPath}\n`);
    })();
}

module.exports = LLMIdiomDetector;
