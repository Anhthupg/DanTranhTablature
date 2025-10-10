/**
 * Word Journey Map Generator - Sankey Diagram
 * Flow: Vietnamese word → English meaning → Semantic category → Songs
 * Thickness = frequency
 */

const fs = require('fs');
const path = require('path');

// Semantic category classifier
function classifySemanticCategory(vietnameseWord, englishMeaning) {
    const categories = {
        emotion: ['love', 'feelings', 'miss', 'longing', 'heart', 'sad', 'happy', 'pain', 'sorrow', 'joy'],
        nature: ['river', 'mountain', 'moon', 'flower', 'tree', 'wind', 'rain', 'sky', 'water', 'cloud', 'forest', 'leaf'],
        family: ['mother', 'father', 'brother', 'sister', 'child', 'you (younger)', 'you (older brother/male)', 'classifier (animals)', 'son', 'daughter'],
        social: ['friend', 'people', 'village', 'together', 'we', 'they', 'who', 'someone'],
        work: ['work', 'drill', 'labor', 'field', 'farm', 'harvest'],
        time: ['day', 'night', 'morning', 'evening', 'spring', 'summer', 'autumn', 'winter', 'year', 'time'],
        place: ['home', 'house', 'here', 'there', 'where', 'far', 'near', 'road', 'path'],
        expression: ['oh', 'ah', 'alas', 'call out', '(vocative)', 'exclamation']
    };

    const lowerMeaning = englishMeaning.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => lowerMeaning.includes(keyword))) {
            return category;
        }
    }

    return 'other';
}

// Load vocabulary and song data
function loadData() {
    const vocabPath = path.join(__dirname, 'data/vocabulary-metrics.json');
    const libraryPath = path.join(__dirname, 'data/library/song-library.json');

    const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
    const songLibrary = JSON.parse(fs.readFileSync(libraryPath, 'utf-8'));

    return { vocabData, songLibrary };
}

// Generate Sankey node and link structure
function generateSankeyData(vocabData, songLibrary, topN = 30) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    let nodeIndex = 0;

    // Helper to get or create node
    function getNodeIndex(id, label, layer) {
        if (!nodeMap.has(id)) {
            nodeMap.set(id, nodeIndex);
            nodes.push({
                id: nodeIndex,
                name: label,
                layer: layer,
                type: layer
            });
            nodeIndex++;
        }
        return nodeMap.get(id);
    }

    // Process top N words
    const topWords = vocabData.topWords.slice(0, topN);

    topWords.forEach(wordData => {
        const vnWord = wordData.word;
        const enMeaning = wordData.english;
        const frequency = wordData.frequency;
        const songCount = wordData.appearsInSongs;

        // Layer 1: Vietnamese word
        const wordNodeId = `word_${vnWord}`;
        const wordIndex = getNodeIndex(wordNodeId, vnWord, 'word');

        // Layer 2: English meaning
        const meaningNodeId = `meaning_${enMeaning}`;
        const meaningIndex = getNodeIndex(meaningNodeId, enMeaning, 'meaning');

        // Layer 3: Semantic category
        const category = classifySemanticCategory(vnWord, enMeaning);
        const categoryNodeId = `category_${category}`;
        const categoryIndex = getNodeIndex(categoryNodeId, category, 'category');

        // Layer 4: Songs (aggregate)
        const songsNodeId = `songs_${vnWord}`;
        const songsIndex = getNodeIndex(songsNodeId, `${songCount} songs`, 'songs');

        // Link: word → meaning
        links.push({
            source: wordIndex,
            target: meaningIndex,
            value: frequency,
            type: 'word-to-meaning'
        });

        // Link: meaning → category
        links.push({
            source: meaningIndex,
            target: categoryIndex,
            value: frequency,
            type: 'meaning-to-category'
        });

        // Link: category → songs
        links.push({
            source: categoryIndex,
            target: songsIndex,
            value: songCount,
            type: 'category-to-songs'
        });
    });

    return { nodes, links };
}

// Generate detailed word journey data
function generateWordJourneyData(vocabData, songLibrary) {
    const journeys = [];

    vocabData.topWords.slice(0, 50).forEach(wordData => {
        const vnWord = wordData.word;
        const enMeaning = wordData.english;
        const frequency = wordData.frequency;
        const songCount = wordData.appearsInSongs;
        const category = classifySemanticCategory(vnWord, enMeaning);

        journeys.push({
            vietnamese: vnWord,
            english: enMeaning,
            category: category,
            frequency: frequency,
            songCount: songCount,
            percentage: wordData.percentage,
            songPercentage: wordData.songPercentage,
            // Example: "thương" → love → emotion → 28 songs
            journeyPath: `${vnWord} → ${enMeaning} → ${category} → ${songCount} songs`
        });
    });

    return journeys;
}

// Generate category statistics
function generateCategoryStats(journeys) {
    const categoryStats = {};

    journeys.forEach(journey => {
        const cat = journey.category;
        if (!categoryStats[cat]) {
            categoryStats[cat] = {
                category: cat,
                totalFrequency: 0,
                totalSongs: 0,
                wordCount: 0,
                words: []
            };
        }

        categoryStats[cat].totalFrequency += journey.frequency;
        categoryStats[cat].totalSongs += journey.songCount;
        categoryStats[cat].wordCount += 1;
        categoryStats[cat].words.push({
            word: journey.vietnamese,
            english: journey.english,
            frequency: journey.frequency
        });
    });

    return Object.values(categoryStats).sort((a, b) => b.totalFrequency - a.totalFrequency);
}

// Main generator
function generateWordJourneySankey() {
    console.log('Generating Word Journey Sankey data...');

    const { vocabData, songLibrary } = loadData();

    // Generate Sankey diagram data
    const sankeyData = generateSankeyData(vocabData, songLibrary, 30);

    // Generate detailed journey data
    const journeys = generateWordJourneyData(vocabData, songLibrary);

    // Generate category statistics
    const categoryStats = generateCategoryStats(journeys);

    // Create output object
    const output = {
        metadata: {
            generatedAt: new Date().toISOString(),
            totalWords: vocabData.overview.totalWords,
            uniqueWords: vocabData.overview.uniqueWords,
            totalSongs: vocabData.overview.totalSongs,
            description: 'Word Journey Map: Vietnamese word → English meaning → Semantic category → Songs'
        },
        sankey: sankeyData,
        journeys: journeys,
        categoryStats: categoryStats,
        // Example journey for reference
        exampleJourney: {
            word: 'thương',
            path: 'thương → love/feelings → emotion → 30 songs',
            insight: 'Shows how the word "thương" (love/feelings) flows through 30 songs in the emotional category'
        }
    };

    // Write to file
    const outputPath = path.join(__dirname, 'data/word-journey-sankey.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✓ Word Journey Sankey data generated: ${outputPath}`);
    console.log(`  - Nodes: ${sankeyData.nodes.length}`);
    console.log(`  - Links: ${sankeyData.links.length}`);
    console.log(`  - Journeys: ${journeys.length}`);
    console.log(`  - Categories: ${categoryStats.length}`);

    // Print category summary
    console.log('\nTop Categories by Frequency:');
    categoryStats.slice(0, 5).forEach((cat, i) => {
        console.log(`  ${i + 1}. ${cat.category}: ${cat.totalFrequency} occurrences, ${cat.wordCount} unique words, ${cat.totalSongs} total song appearances`);
    });
}

// Run if called directly
if (require.main === module) {
    generateWordJourneySankey();
}

module.exports = { generateWordJourneySankey, classifySemanticCategory };
