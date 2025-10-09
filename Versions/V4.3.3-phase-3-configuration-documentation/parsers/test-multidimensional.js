#!/usr/bin/env node

/**
 * Test Multi-Dimensional Figurative Language Analysis
 * Demonstrates improved taxonomy on "Lý chiều chiều"
 */

const fs = require('fs');
const path = require('path');
const EnhancedFigurativeDetector = require('./enhanced-figurative-detector');

const detector = new EnhancedFigurativeDetector();

// Load song
const inputPath = path.join(__dirname, '../data/lyrics-enhanced-tier1/Lý chiều chiều.json');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  Multi-Dimensional Figurative Language Analysis          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('Song: "Lý chiều chiều"\n');

// Process each phrase
data.phrases.forEach(phrase => {
    const expressions = detector.extractFromPhrase(phrase);

    if (expressions.length > 0) {
        phrase.figurativeExpressions = expressions;

        console.log(`Phrase ${phrase.id}: "${phrase.text}"`);
        expressions.forEach(expr => {
            console.log(`\n  Expression: "${expr.vietnamese}"`);
            console.log(`  Literal: ${expr.literal}`);
            console.log(`  Meaning: ${expr.meaning}`);
            console.log(`  Classification:`);
            console.log(`    - Vietnamese Category: ${expr.classification.vietnameseCategory}`);
            console.log(`    - Semantic Mechanism: ${expr.classification.semanticMechanism}`);
            console.log(`    - Cultural Scope: ${expr.classification.culturalScope}`);
            console.log(`    - Fixedness: ${expr.classification.fixedness}`);
            console.log(`    - Meaning Depth: ${expr.classification.meaningDepth}`);
            console.log(`  Features: ${expr.features.join(', ')}`);
        });
        console.log('');
    }
});

// Analyze patterns
const analysis = detector.analyzePatterns(data.phrases);

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║              Multi-Dimensional Statistics                 ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log(`Total Expressions: ${analysis.totalExpressions}`);
console.log(`Unique Expressions: ${analysis.uniqueExpressions}\n`);

console.log('By Vietnamese Category:');
Object.entries(analysis.byVietnameseCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
});

console.log('\nBy Semantic Mechanism:');
Object.entries(analysis.bySemanticMechanism).forEach(([mech, count]) => {
    console.log(`  ${mech}: ${count}`);
});

console.log('\nBy Cultural Scope:');
Object.entries(analysis.byCulturalScope).forEach(([scope, count]) => {
    console.log(`  ${scope}: ${count}`);
});

console.log('\nBy Meaning Depth:');
Object.entries(analysis.byMeaningDepth).forEach(([depth, count]) => {
    console.log(`  ${depth}: ${count}`);
});

console.log('\nTop Features:');
const topFeatures = Object.entries(analysis.featureDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
topFeatures.forEach(([feat, count]) => {
    console.log(`  ${feat}: ${count}`);
});

// Assessment
const assessment = detector.assessRichness(analysis);
console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                    Assessment                             ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log(`Cultural Richness: ${assessment.culturalRichness}`);
console.log(`Dominant Vietnamese Category: ${assessment.dominantVietnameseCategory}`);
console.log(`Dominant Semantic Mechanism: ${assessment.dominantSemanticMechanism}`);
console.log(`Dominant Meaning Depth: ${assessment.dominantMeaningDepth}`);
console.log(`Expression Density: ${assessment.expressionDensity}`);
console.log(`\nDescription: ${assessment.description}\n`);

// Save enhanced version
data.figurativeLanguageAnalysis = {
    patterns: analysis,
    assessment: assessment,
    processingDate: new Date().toISOString().split('T')[0],
    taxonomy: 'multi_dimensional_v1.0',
    analyzedBy: 'Claude Assistant (EnhancedFigurativeDetector)'
};

const outputPath = path.join(__dirname, '../data/lyrics-enhanced-tier1/Lý chiều chiều.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

console.log(`✅ Enhanced analysis saved to: Lý chiều chiều.json\n`);
