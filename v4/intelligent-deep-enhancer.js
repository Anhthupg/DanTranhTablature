#!/usr/bin/env node

/**
 * Intelligent Deep Figurative Language Enhancer
 *
 * Analyzes song complexity and processes 1-2 songs per run:
 * - Complex songs (10+ phrases, rich content): 1 song
 * - Simple songs (5- phrases, minimal content): 2 songs
 *
 * Usage: node intelligent-deep-enhancer.js [song1] [song2]
 */

const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, 'data/lyrics-enhanced-tier1');

// Songs remaining for enhancement
const PENDING_SONGS = [
    "Bengu Adai",
    "Bỏ bộ",
    "Bồ Các là bác chim Ri",
    "Buộc lưng con ếch",
    "Cặp bù kè"
];

class IntelligentEnhancer {

    /**
     * Analyze complexity of a song to determine processing batch size
     */
    analyzeComplexity(songData) {
        const phraseCount = songData.phrases ? songData.phrases.length : 0;
        const avgSyllables = songData.totalSyllables / phraseCount;
        const hasIdioms = songData.phrases.some(p => p.idioms && p.idioms.length > 0);
        const hasPronouns = songData.pronounAnalysis &&
            songData.pronounAnalysis.patterns.totalPronouns > 5;
        const hasModifiers = songData.modifierAnalysis &&
            songData.modifierAnalysis.patterns.totalModifiers > 3;

        let complexityScore = 0;

        // Phrase count impact
        if (phraseCount >= 10) complexityScore += 3;
        else if (phraseCount >= 7) complexityScore += 2;
        else complexityScore += 1;

        // Content richness
        if (avgSyllables >= 8) complexityScore += 2;
        else if (avgSyllables >= 6) complexityScore += 1;

        if (hasIdioms) complexityScore += 2;
        if (hasPronouns) complexityScore += 1;
        if (hasModifiers) complexityScore += 1;

        return {
            score: complexityScore,
            level: complexityScore >= 7 ? 'complex' :
                   complexityScore >= 4 ? 'moderate' : 'simple',
            phraseCount,
            avgSyllables: avgSyllables.toFixed(1),
            hasIdioms,
            hasPronouns,
            hasModifiers
        };
    }

    /**
     * Determine batch size based on complexities
     */
    determineBatchSize(songs) {
        const complexities = songs.map(song => {
            const inputPath = path.join(INPUT_DIR, `${song}.json`);
            if (!fs.existsSync(inputPath)) return null;

            const songData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
            return {
                name: song,
                complexity: this.analyzeComplexity(songData)
            };
        }).filter(x => x !== null);

        console.log('\n📊 Complexity Analysis:');
        console.log('═══════════════════════════════════════════════════════════\n');

        complexities.forEach(({name, complexity}) => {
            console.log(`📝 ${name}`);
            console.log(`   Level: ${complexity.level.toUpperCase()}`);
            console.log(`   Score: ${complexity.score}/10`);
            console.log(`   Phrases: ${complexity.phraseCount}`);
            console.log(`   Avg syllables/phrase: ${complexity.avgSyllables}`);
            console.log(`   Has idioms: ${complexity.hasIdioms ? '✓' : '✗'}`);
            console.log(`   Has pronouns: ${complexity.hasPronouns ? '✓' : '✗'}`);
            console.log(`   Has modifiers: ${complexity.hasModifiers ? '✓' : '✗'}\n`);
        });

        // Determine batch
        const firstComplexity = complexities[0]?.complexity;

        if (!firstComplexity) {
            console.log('❌ No songs found to process\n');
            return [];
        }

        // Complex song: process 1 only
        if (firstComplexity.level === 'complex') {
            console.log('🎯 Strategy: Process 1 COMPLEX song this session\n');
            return [complexities[0].name];
        }

        // Moderate: check if we can add another
        if (firstComplexity.level === 'moderate') {
            if (complexities.length >= 2 && complexities[1].complexity.level === 'simple') {
                console.log('🎯 Strategy: Process 1 MODERATE + 1 SIMPLE song this session\n');
                return [complexities[0].name, complexities[1].name];
            }
            console.log('🎯 Strategy: Process 1 MODERATE song this session\n');
            return [complexities[0].name];
        }

        // Simple: process 2
        if (complexities.length >= 2) {
            console.log('🎯 Strategy: Process 2 SIMPLE songs this session\n');
            return [complexities[0].name, complexities[1].name];
        }

        console.log('🎯 Strategy: Process 1 SIMPLE song this session\n');
        return [complexities[0].name];
    }

    /**
     * Display recommendations for next conversation
     */
    displayRecommendations() {
        const batch = this.determineBatchSize(PENDING_SONGS);

        if (batch.length === 0) {
            console.log('✅ All songs complete!\n');
            return;
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 RECOMMENDED FOR THIS SESSION:');
        console.log('═══════════════════════════════════════════════════════════\n');

        batch.forEach((song, i) => {
            console.log(`${i + 1}. ${song}`);
        });

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('📝 REMAINING FOR FUTURE SESSIONS:');
        console.log('═══════════════════════════════════════════════════════════\n');

        const remaining = PENDING_SONGS.filter(s => !batch.includes(s));
        remaining.forEach((song, i) => {
            console.log(`${i + 1}. ${song}`);
        });

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('💡 RECOMMENDATION:');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(`Process ${batch.length} song${batch.length > 1 ? 's' : ''} this conversation`);
        console.log(`${remaining.length} song${remaining.length !== 1 ? 's' : ''} remaining for future conversations`);
        console.log(`Estimated total conversations: ${Math.ceil(PENDING_SONGS.length / 1.5)}`);
        console.log('');
    }
}

// Run analysis
if (require.main === module) {
    const enhancer = new IntelligentEnhancer();
    enhancer.displayRecommendations();
}

module.exports = IntelligentEnhancer;
