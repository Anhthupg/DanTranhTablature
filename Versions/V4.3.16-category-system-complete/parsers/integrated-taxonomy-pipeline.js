#!/usr/bin/env node

/**
 * Integrated Taxonomy Pipeline
 *
 * Processes all lyrics files through the complete Tier 1 linguistic analysis pipeline:
 * 1. Vietnamese tone extraction (6 tones)
 * 2. Hierarchical pronoun detection (family/social/romantic)
 * 3. Rich modifier detection (classifiers & metaphors)
 * 4. Từ láy (reduplication) tagging
 * 5. LLM-based idiom detection (idioms, proverbs, cultural phrases)
 *
 * Implements the complete taxonomy specification for Vietnamese traditional music analysis
 */

const fs = require('fs');
const path = require('path');

const VietnameseToneExtractor = require('./vietnamese-tone-extractor');
const HierarchicalPronounDetector = require('./hierarchical-pronoun-detector');
const RichModifierDetector = require('./rich-modifier-detector');
const TuLayReduplicationTagger = require('./tu-lay-reduplication-tagger');
const LocalIdiomDetector = require('./local-idiom-detector');

class IntegratedTaxonomyPipeline {
    constructor(useLLM = false) {
        this.toneExtractor = new VietnameseToneExtractor();
        this.pronounDetector = new HierarchicalPronounDetector();
        this.modifierDetector = new RichModifierDetector();
        this.reduplicationTagger = new TuLayReduplicationTagger();

        // Auto-detect: Use LLM if API key available, otherwise local
        const hasApiKey = process.env.ANTHROPIC_API_KEY;
        this.useLLM = useLLM || hasApiKey;

        if (this.useLLM && hasApiKey) {
            console.log('🤖 Using LLM-based idiom detection (Claude API)\n');
            const LLMIdiomDetector = require('./llm-idiom-detector');
            this.idiomDetector = new LLMIdiomDetector();
        } else {
            console.log('💻 Using local rule-based idiom detection\n');
            this.idiomDetector = new LocalIdiomDetector();
        }
    }

    /**
     * Process a single lyrics file through all parsers
     * @param {string} inputPath - Path to input lyrics JSON
     * @returns {Promise<Object>} - Fully enhanced lyrics data
     */
    async processSingleFile(inputPath) {
        try {
            console.log(`\nProcessing: ${path.basename(inputPath)}`);

            // Load base lyrics data
            let data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

            // Step 1: Extract Vietnamese tones
            console.log('  → Extracting Vietnamese tones...');
            data = this.toneExtractor.processLyricsFile(inputPath);
            if (!data) throw new Error('Tone extraction failed');

            // Step 2: Detect hierarchical pronouns
            console.log('  → Detecting hierarchical pronouns...');
            data.phrases = data.phrases.map(phrase => {
                const pronouns = this.pronounDetector.extractPronounsFromPhrase(phrase.wordMapping);
                return pronouns.length > 0 ? { ...phrase, pronouns } : phrase;
            });
            const pronounAnalysis = this.pronounDetector.analyzePronounPatterns(data.phrases);
            const socialRegister = this.pronounDetector.determineSocialRegister(pronounAnalysis);
            data.pronounAnalysis = {
                patterns: pronounAnalysis,
                socialRegister,
                processingDate: new Date().toISOString().split('T')[0]
            };

            // Step 3: Detect rich modifiers
            console.log('  → Detecting rich modifiers...');
            data.phrases = data.phrases.map(phrase => {
                const modifiers = this.modifierDetector.extractModifiersFromPhrase(phrase.wordMapping);
                return modifiers.length > 0 ? { ...phrase, modifiers } : phrase;
            });
            const modifierAnalysis = this.modifierDetector.analyzeModifierPatterns(data.phrases);
            const poeticStyle = this.modifierDetector.determinePoeticStyle(modifierAnalysis);
            data.modifierAnalysis = {
                patterns: modifierAnalysis,
                poeticStyle,
                processingDate: new Date().toISOString().split('T')[0]
            };

            // Step 4: Tag từ láy (reduplication)
            console.log('  → Tagging từ láy (reduplication)...');
            data.phrases = data.phrases.map(phrase => {
                const reduplications = this.reduplicationTagger.extractReduplicationsFromPhrase(phrase.wordMapping);
                return reduplications.length > 0 ? { ...phrase, reduplications } : phrase;
            });
            const reduplicationAnalysis = this.reduplicationTagger.analyzeReduplicationPatterns(data.phrases);
            const reduplicationStyle = this.reduplicationTagger.determineReduplicationStyle(reduplicationAnalysis);
            data.reduplicationAnalysis = {
                patterns: reduplicationAnalysis,
                style: reduplicationStyle,
                processingDate: new Date().toISOString().split('T')[0]
            };

            // Step 5: Detect idioms (LLM or local based on API key)
            if (this.useLLM) {
                console.log('  → Detecting idioms with LLM...');
                for (let i = 0; i < data.phrases.length; i++) {
                    const phrase = data.phrases[i];
                    const idioms = await this.idiomDetector.extractIdiomsFromPhrase(phrase);
                    if (idioms.length > 0) {
                        data.phrases[i].idioms = idioms;
                    }
                    // Rate limiting: 1 request per second
                    if (i < data.phrases.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } else {
                console.log('  → Detecting idioms locally...');
                for (let i = 0; i < data.phrases.length; i++) {
                    const phrase = data.phrases[i];
                    const idioms = this.idiomDetector.extractIdiomsFromPhrase(phrase);
                    if (idioms.length > 0) {
                        data.phrases[i].idioms = idioms;
                    }
                }
            }
            const idiomAnalysis = this.idiomDetector.analyzeIdiomPatterns(data.phrases);
            const culturalAssessment = this.idiomDetector.assessCulturalRichness(idiomAnalysis);
            data.idiomAnalysis = {
                patterns: idiomAnalysis,
                culturalAssessment,
                processingDate: new Date().toISOString().split('T')[0]
            };

            // Add pipeline metadata
            data.taxonomyPipeline = {
                version: '2.0',
                processedBy: 'IntegratedTaxonomyPipeline',
                processingDate: new Date().toISOString().split('T')[0],
                parsersApplied: [
                    'VietnameseToneExtractor',
                    'HierarchicalPronounDetector',
                    'RichModifierDetector',
                    'TuLayReduplicationTagger',
                    this.useLLM ? 'LLMIdiomDetector' : 'LocalIdiomDetector'
                ]
            };

            console.log('  ✓ Complete');
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
        console.log('║   Integrated Taxonomy Pipeline - Tier 1 Processing       ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');
        console.log(`Input:  ${inputDir}`);
        console.log(`Output: ${outputDir}`);
        console.log(`Files:  ${files.length}\n`);

        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        let successCount = 0;
        let errorCount = 0;
        const startTime = Date.now();

        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const inputPath = path.join(inputDir, file);
            const outputPath = path.join(outputDir, file);

            console.log(`\n[${index + 1}/${files.length}] ${file}`);

            const enhancedData = await this.processSingleFile(inputPath);

            if (enhancedData) {
                fs.writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2), 'utf8');

                // Print summary
                const tone = enhancedData.toneAnalysis?.distribution?.totalSyllables || 0;
                const pronouns = enhancedData.pronounAnalysis?.patterns?.totalPronouns || 0;
                const modifiers = enhancedData.modifierAnalysis?.patterns?.totalModifiers || 0;
                const redups = enhancedData.reduplicationAnalysis?.patterns?.totalReduplications || 0;
                const idioms = enhancedData.idiomAnalysis?.patterns?.totalIdioms || 0;

                console.log(`  📊 Tones: ${tone} | Pronouns: ${pronouns} | Modifiers: ${modifiers} | Reduplication: ${redups} | Idioms: ${idioms}`);
                successCount++;
            } else {
                errorCount++;
            }
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║                    Pipeline Complete                      ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log(`\n✓ Success: ${successCount} files`);
        console.log(`✗ Errors:  ${errorCount} files`);
        console.log(`⏱ Duration: ${duration}s\n`);
    }

    /**
     * Generate collection-level statistics
     * @param {string} enhancedDir - Directory with enhanced lyrics files
     * @returns {Object} - Collection statistics
     */
    generateCollectionStats(enhancedDir) {
        const files = fs.readdirSync(enhancedDir).filter(f => f.endsWith('.json'));

        const stats = {
            totalSongs: files.length,
            toneDistribution: { ngang: 0, sắc: 0, huyền: 0, hỏi: 0, ngã: 0, nặng: 0 },
            pronounUsage: {},
            modifierTypes: {},
            reduplicationTypes: { total_reduplication: 0, partial_reduplication: 0, rhyming_reduplication: 0 },
            socialRegisters: {},
            poeticStyles: {},
            idiomUsage: {},
            idiomTypes: { idiom: 0, proverb: 0, cultural_phrase: 0, metaphor: 0 },
            culturalRichness: {}
        };

        files.forEach(file => {
            const data = JSON.parse(fs.readFileSync(path.join(enhancedDir, file), 'utf8'));

            // Aggregate tone distribution
            if (data.toneAnalysis?.distribution?.counts) {
                Object.entries(data.toneAnalysis.distribution.counts).forEach(([tone, count]) => {
                    stats.toneDistribution[tone] += count;
                });
            }

            // Aggregate pronoun usage
            if (data.pronounAnalysis?.patterns?.counts) {
                Object.entries(data.pronounAnalysis.patterns.counts).forEach(([pronoun, count]) => {
                    stats.pronounUsage[pronoun] = (stats.pronounUsage[pronoun] || 0) + count;
                });
            }

            // Aggregate modifier types
            if (data.modifierAnalysis?.patterns?.types) {
                Object.entries(data.modifierAnalysis.patterns.types).forEach(([type, count]) => {
                    stats.modifierTypes[type] = (stats.modifierTypes[type] || 0) + count;
                });
            }

            // Aggregate reduplication types
            if (data.reduplicationAnalysis?.patterns?.typeCounts) {
                Object.entries(data.reduplicationAnalysis.patterns.typeCounts).forEach(([type, count]) => {
                    stats.reduplicationTypes[type] += count;
                });
            }

            // Count social registers
            const register = data.pronounAnalysis?.socialRegister?.dominantRegister;
            if (register) {
                stats.socialRegisters[register] = (stats.socialRegisters[register] || 0) + 1;
            }

            // Count poetic styles
            const style = data.modifierAnalysis?.poeticStyle?.poeticStyle;
            if (style) {
                stats.poeticStyles[style] = (stats.poeticStyles[style] || 0) + 1;
            }

            // Aggregate idiom usage
            if (data.idiomAnalysis?.patterns?.idiomCounts) {
                Object.entries(data.idiomAnalysis.patterns.idiomCounts).forEach(([idiom, count]) => {
                    stats.idiomUsage[idiom] = (stats.idiomUsage[idiom] || 0) + count;
                });
            }

            // Aggregate idiom types
            if (data.idiomAnalysis?.patterns?.typeDistribution) {
                Object.entries(data.idiomAnalysis.patterns.typeDistribution).forEach(([type, count]) => {
                    stats.idiomTypes[type] += count;
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
    const pipeline = new IntegratedTaxonomyPipeline();

    const inputDir = path.join(__dirname, '../data/lyrics-segmentations');
    const outputDir = path.join(__dirname, '../data/lyrics-enhanced-tier1');

    // Process all files
    (async () => {
        await pipeline.processAllFiles(inputDir, outputDir);

        // Generate collection stats
        console.log('\n📊 Generating collection-level statistics...\n');
        const stats = pipeline.generateCollectionStats(outputDir);

        const statsPath = path.join(outputDir, '_collection-stats.json');
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');

        console.log('Collection Statistics:');
        console.log(`  Total Songs: ${stats.totalSongs}`);
        console.log(`  Tone Distribution: ${JSON.stringify(stats.toneDistribution)}`);
        console.log(`  Top Pronouns: ${Object.entries(stats.pronounUsage).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([p, c]) => `${p}(${c})`).join(', ')}`);
        console.log(`  Top Idioms: ${Object.entries(stats.idiomUsage).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([i, c]) => `${i}(${c})`).join(', ')}`);
        console.log(`  Poetic Styles: ${JSON.stringify(stats.poeticStyles)}`);
        console.log(`  Cultural Richness: ${JSON.stringify(stats.culturalRichness)}`);
        console.log(`\n✓ Stats saved to: ${statsPath}\n`);
    })();
}

module.exports = IntegratedTaxonomyPipeline;
