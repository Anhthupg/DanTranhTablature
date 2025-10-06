#!/usr/bin/env node

/**
 * Test LLM Idiom Detection on Single Song
 *
 * Quick test to verify API key and idiom detection quality
 * before processing entire collection.
 */

const IntegratedTaxonomyPipeline = require('./integrated-taxonomy-pipeline');
const path = require('path');

(async () => {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         LLM Idiom Detection - Single Song Test           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('❌ ANTHROPIC_API_KEY not set!');
        console.log('\nPlease run:');
        console.log('export ANTHROPIC_API_KEY="sk-ant-your-key-here"\n');
        process.exit(1);
    }

    console.log('✅ API key detected\n');

    // Test with "Lý chiều chiều" - has interesting phrases
    const inputPath = path.join(__dirname, '../data/lyrics-segmentations/Lý chiều chiều.json');
    const outputPath = path.join(__dirname, '../data/lyrics-enhanced-tier1/Lý chiều chiều.json');

    const pipeline = new IntegratedTaxonomyPipeline();

    console.log('Testing with: "Lý chiều chiều"\n');
    console.log('This song should have:');
    console.log('  - "chiều chiều" (reduplication + cultural phrase)');
    console.log('  - Poetic nature imagery');
    console.log('  - Possible metaphors\n');

    const startTime = Date.now();
    const result = await pipeline.processSingleFile(inputPath);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (result) {
        const fs = require('fs');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║                     Test Results                          ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        const idiomAnalysis = result.idiomAnalysis;
        console.log(`⏱  Processing time: ${duration}s`);
        console.log(`📊 Total idioms found: ${idiomAnalysis.patterns.totalIdioms}`);
        console.log(`🎯 Unique idioms: ${idiomAnalysis.patterns.uniqueIdioms}`);
        console.log(`\n📝 Idiom types:`);
        console.log(`   - Cultural phrases: ${idiomAnalysis.patterns.typeDistribution.cultural_phrase}`);
        console.log(`   - Idioms: ${idiomAnalysis.patterns.typeDistribution.idiom}`);
        console.log(`   - Proverbs: ${idiomAnalysis.patterns.typeDistribution.proverb}`);
        console.log(`   - Metaphors: ${idiomAnalysis.patterns.typeDistribution.metaphor}`);
        console.log(`\n🌟 Cultural richness: ${idiomAnalysis.culturalAssessment.culturalRichness}`);

        console.log(`\n📋 Most common idioms:`);
        idiomAnalysis.patterns.mostCommon.forEach((item, i) => {
            console.log(`   ${i + 1}. "${item.idiom}" (${item.count} times)`);
        });

        // Show sample idiom with meaning
        const phrases = result.phrases.filter(p => p.idioms && p.idioms.length > 0);
        if (phrases.length > 0 && phrases[0].idioms.length > 0) {
            const sampleIdiom = phrases[0].idioms[0];
            console.log(`\n💡 Sample idiom detection:`);
            console.log(`   Vietnamese: "${sampleIdiom.vietnamese}"`);
            console.log(`   Literal: "${sampleIdiom.literal}"`);
            console.log(`   Meaning: "${sampleIdiom.meaning}"`);
            console.log(`   Type: ${sampleIdiom.type}`);
            console.log(`   Context: "${sampleIdiom.context}"`);
        }

        console.log(`\n✅ Full results saved to:`);
        console.log(`   ${outputPath}\n`);

        console.log('Next steps:');
        console.log('  1. Review the results above');
        console.log('  2. If quality looks good, run full collection:');
        console.log('     node v4/parsers/integrated-taxonomy-pipeline.js');
        console.log('  3. Full collection will take ~1 hour for 122 songs\n');

    } else {
        console.log('\n❌ Processing failed\n');
        process.exit(1);
    }
})();
