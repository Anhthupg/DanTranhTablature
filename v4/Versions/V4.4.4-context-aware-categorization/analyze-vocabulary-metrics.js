/**
 * Vietnamese Vocabulary Metrics Analyzer
 * Analyzes all words across 121 songs for linguistic insights
 */

const fs = require('fs');
const path = require('path');

class VocabularyAnalyzer {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.outputPath = path.join(__dirname, 'data', 'vocabulary-metrics.json');

        // Context-aware rules for ambiguous words (checked BEFORE default patterns)
        this.contextRules = [
            // "con" + animal = both nature
            {
                word: 'con',
                nextPattern: /^(khỉ|cò|voi|bò|gà|chó|mèo|cá|chim|én|sẻ|quạ|diều|hâu)$/i,
                category: 'nature',
                description: 'animal classifier'
            },
            {
                word: /^(khỉ|voi|bò|gà|chó|mèo|cá|chim|én|sẻ|quạ|diều|hâu)$/i,
                prevWord: 'con',
                category: 'nature',
                description: 'animal name after classifier'
            },
            // "nhà" + possessive = family (vs nhà = house = place)
            {
                word: 'nhà',
                nextPattern: /^(tôi|ta|mình|nó|người)$/i,
                category: 'family',
                description: 'family possessive'
            },
            // "đời" + personal = emotion (vs đời = time period)
            {
                word: 'đời',
                nextPattern: /^(tôi|ta|mình|người)$/i,
                category: 'emotion',
                description: 'personal life/existence'
            }
        ];
    }

    categorizeWord(word, index, allWords, semanticPatterns) {
        const wordLower = word.toLowerCase();
        const nextWord = allWords[index + 1] ? allWords[index + 1].toLowerCase() : '';
        const prevWord = allWords[index - 1] ? allWords[index - 1].toLowerCase() : '';

        // Check context rules first
        for (const rule of this.contextRules) {
            // Rule with nextPattern
            if (rule.nextPattern && rule.word) {
                const wordMatch = typeof rule.word === 'string'
                    ? wordLower === rule.word
                    : rule.word.test(wordLower);

                if (wordMatch && rule.nextPattern.test(nextWord)) {
                    return rule.category;
                }
            }

            // Rule with prevWord
            if (rule.prevWord && rule.word) {
                const wordMatch = typeof rule.word === 'string'
                    ? wordLower === rule.word
                    : rule.word.test(wordLower);

                if (wordMatch && prevWord === rule.prevWord) {
                    return rule.category;
                }
            }
        }

        // Default pattern matching
        for (const [category, pattern] of Object.entries(semanticPatterns)) {
            if (pattern.test(wordLower)) {
                return category;
            }
        }

        return 'other';
    }

    async analyze() {
        const files = fs.readdirSync(this.lyricsDir).filter(f => f.endsWith('.json'));

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Vietnamese Vocabulary Metrics Analyzer                   ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        // Data structures
        const wordFrequency = {};  // word → count
        const wordInSongs = {};     // word → Set of song names
        const wordCategories = {};  // word → {nature: 5, family: 3, ...} (category frequency per word)
        const wordByType = {        // linguistic type → words
            exclamatory: new Set(),
            question: new Set(),
            answer: new Set(),
            narrative: new Set(),
            complaint: new Set(),
            onomatopoeia: new Set()
        };

        const semanticCategories = {
            nature: new Set(),
            family: new Set(),
            emotion: new Set(),
            work: new Set(),
            time: new Set(),
            place: new Set()
        };

        // Semantic keyword patterns
        const semanticPatterns = {
            nature: /trăng|sông|chiều|hoa|cò|đò|mây|núi|biển|cây|lá|rừng|đồng|rẫy|mưa|gió|sao/,
            family: /chồng|vợ|mẹ|cha|con|anh|em|bà|ông|cô|chú|bác|cháu/,
            emotion: /thương|nhớ|buồn|vui|khổ|đau|yêu|ghét|sợ|giận|hạnh phúc/,
            work: /làm|giã|đập|chèo|kéo|cày|bừa|trồng|thu|dệt|may|nấu/,
            time: /chiều|sáng|trưa|tối|đêm|hôm|mai|ngày|tháng|năm|mùa/,
            place: /làng|thành|phố|chợ|nhà|lầu|cầu|đò|thuyền|bến|sông|núi/
        };

        let totalWords = 0;
        let totalPhrases = 0;

        // Process all files
        files.forEach(file => {
            const songName = file.replace('.json', '');
            const lyricsData = JSON.parse(fs.readFileSync(path.join(this.lyricsDir, file), 'utf8'));

            lyricsData.phrases.forEach(phrase => {
                totalPhrases++;
                const type = phrase.linguisticType;

                if (phrase.wordMapping) {
                    // Extract all words in the phrase for context-aware categorization
                    const allWords = phrase.wordMapping.map(m => m.vn);

                    phrase.wordMapping.forEach((mapping, index) => {
                        const word = mapping.vn.toLowerCase().trim();
                        if (!word || word.length === 0) return;

                        totalWords++;

                        // Frequency count
                        wordFrequency[word] = (wordFrequency[word] || 0) + 1;

                        // Track which songs use this word
                        if (!wordInSongs[word]) wordInSongs[word] = new Set();
                        wordInSongs[word].add(songName);

                        // Linguistic type categorization
                        if (wordByType[type]) {
                            wordByType[type].add(word);
                        }

                        // Context-aware semantic categorization
                        const category = this.categorizeWord(word, index, allWords, semanticPatterns);

                        // Track category frequency per word
                        if (!wordCategories[word]) {
                            wordCategories[word] = {};
                        }
                        wordCategories[word][category] = (wordCategories[word][category] || 0) + 1;

                        // Also add to semanticCategories Set (for backwards compatibility)
                        if (category !== 'other' && semanticCategories[category]) {
                            semanticCategories[category].add(word);
                        }
                    });
                }
            });
        });

        // Analysis results
        const uniqueWords = Object.keys(wordFrequency).length;

        // Helper function to get dominant category for a word
        const getDominantCategory = (word) => {
            if (!wordCategories[word]) return 'other';

            const categories = wordCategories[word];
            let maxCategory = 'other';
            let maxCount = 0;

            for (const [category, count] of Object.entries(categories)) {
                if (count > maxCount) {
                    maxCount = count;
                    maxCategory = category;
                }
            }

            return maxCategory;
        };

        // Most frequent words with English translations
        const topWords = Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 100)
            .map(([word, count]) => {
                // Get English translation from first occurrence
                let english = word;
                for (const file of files) {
                    const lyricsData = JSON.parse(fs.readFileSync(path.join(this.lyricsDir, file), 'utf8'));
                    for (const phrase of lyricsData.phrases) {
                        if (phrase.wordMapping) {
                            const mapping = phrase.wordMapping.find(m => m.vn.toLowerCase() === word.toLowerCase());
                            if (mapping && mapping.en && mapping.en.trim()) {
                                english = mapping.en;
                                break;
                            }
                        }
                    }
                    if (english !== word) break;
                }

                // Calculate dominant category and get category distribution
                const dominantCategory = getDominantCategory(word);
                const categoryBreakdown = wordCategories[word] || {};

                return {
                    word,
                    english,
                    frequency: count,
                    percentage: ((count / totalWords) * 100).toFixed(2),
                    appearsInSongs: wordInSongs[word].size,
                    songPercentage: ((wordInSongs[word].size / files.length) * 100).toFixed(1),
                    category: dominantCategory,
                    categoryBreakdown  // Shows all contexts: {nature: 45, family: 12}
                };
            });

        // Rare words (appear in only 1 song)
        const rareWords = Object.entries(wordFrequency)
            .filter(([word, count]) => wordInSongs[word].size === 1)
            .sort((a, b) => b[1] - a[1])
            .map(([word, count]) => ({
                word,
                frequency: count,
                songName: Array.from(wordInSongs[word])[0]
            }));

        // Universal words (appear in 50%+ of songs)
        const universalWords = Object.entries(wordFrequency)
            .filter(([word, count]) => wordInSongs[word].size >= files.length * 0.5)
            .sort((a, b) => wordInSongs[b].size - wordInSongs[a].size)
            .map(([word, count]) => ({
                word,
                frequency: count,
                appearsInSongs: wordInSongs[word].size,
                songPercentage: ((wordInSongs[word].size / files.length) * 100).toFixed(1)
            }));

        // Semantic category statistics
        const semanticStats = {};
        for (const [category, words] of Object.entries(semanticCategories)) {
            const wordList = Array.from(words);
            const totalOccurrences = wordList.reduce((sum, word) => sum + wordFrequency[word], 0);

            semanticStats[category] = {
                uniqueWords: words.size,
                totalOccurrences,
                percentage: ((totalOccurrences / totalWords) * 100).toFixed(2),
                topWords: wordList
                    .map(word => ({ word, count: wordFrequency[word] }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 20)
            };
        }

        // Linguistic type statistics
        const linguisticStats = {};
        for (const [type, words] of Object.entries(wordByType)) {
            const wordList = Array.from(words);
            const totalOccurrences = wordList.reduce((sum, word) => sum + (wordFrequency[word] || 0), 0);

            linguisticStats[type] = {
                uniqueWords: words.size,
                totalOccurrences,
                percentage: totalOccurrences > 0 ? ((totalOccurrences / totalWords) * 100).toFixed(2) : '0',
                topWords: wordList
                    .map(word => ({ word, count: wordFrequency[word] || 0 }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 15)
            };
        }

        // Word length distribution
        const lengthDistribution = {};
        Object.keys(wordFrequency).forEach(word => {
            const len = word.length;
            if (!lengthDistribution[len]) lengthDistribution[len] = { count: 0, words: [] };
            lengthDistribution[len].count++;
            if (lengthDistribution[len].words.length < 10) {
                lengthDistribution[len].words.push(word);
            }
        });

        // Build final metrics object
        const metrics = {
            overview: {
                totalWords,
                uniqueWords,
                totalPhrases,
                totalSongs: files.length,
                averageWordsPerPhrase: (totalWords / totalPhrases).toFixed(2),
                vocabularyDiversity: ((uniqueWords / totalWords) * 100).toFixed(2) + '%'
            },
            topWords,
            universalWords,
            rareWords: rareWords.slice(0, 50),
            semanticCategories: semanticStats,
            linguisticTypes: linguisticStats,
            wordLengthDistribution: lengthDistribution,
            generatedAt: new Date().toISOString()
        };

        // Save to file
        fs.writeFileSync(this.outputPath, JSON.stringify(metrics, null, 2), 'utf8');

        // Print summary
        console.log(`✅ Analysis Complete!\n`);
        console.log(`📊 Overview:`);
        console.log(`   Total words: ${totalWords.toLocaleString()}`);
        console.log(`   Unique words: ${uniqueWords.toLocaleString()}`);
        console.log(`   Total phrases: ${totalPhrases}`);
        console.log(`   Total songs: ${files.length}`);
        console.log(`   Vocabulary diversity: ${metrics.overview.vocabularyDiversity}\n`);

        console.log(`🔝 Top 10 Most Frequent Words:`);
        topWords.slice(0, 10).forEach((w, i) => {
            console.log(`   ${i + 1}. "${w.word}" - ${w.frequency}× (${w.percentage}%, in ${w.appearsInSongs} songs)`);
        });

        console.log(`\n🌍 Universal Words (50%+ of songs): ${universalWords.length}`);
        console.log(`🎯 Rare Words (1 song only): ${rareWords.length}\n`);

        console.log(`📝 Semantic Categories:`);
        Object.entries(semanticStats).forEach(([cat, stats]) => {
            console.log(`   ${cat}: ${stats.uniqueWords} words, ${stats.totalOccurrences}× (${stats.percentage}%)`);
        });

        console.log(`\n💾 Saved to: ${this.outputPath}\n`);

        return metrics;
    }
}

if (require.main === module) {
    const analyzer = new VocabularyAnalyzer();
    analyzer.analyze().catch(console.error);
}

module.exports = VocabularyAnalyzer;
