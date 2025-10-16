/**
 * Generate Thematic Profiles for All Songs
 * Pre-calculates 6-axis radar data for each song
 * Enables similarity comparison and sorting
 */

const fs = require('fs');
const path = require('path');

class ThematicProfileGenerator {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.outputPath = path.join(__dirname, 'data', 'thematic-profiles.json');

        // Semantic patterns
        this.semanticPatterns = {
            nature: /trăng|sông|chiều|hoa|cò|đò|mây|núi|biển|cây|lá|rừng|đồng|rẫy|mưa|gió|sao|trời|sương|mù|nắng|bão|lũ|hạn|nước|ao|hồ|suối|giếng|non|cành|lúa|ngô|cảnh/i,
            family: /chồng|vợ|mẹ|cha|con|anh|em|bà|ông|cô|chú|bác|cháu|bố|me|chị|trai|gái|nàng|phu|thê|nhi|tử|phụ|mẫu|người|bạn/i,
            emotion: /thương|nhớ|buồn|vui|khổ|đau|yêu|ghét|sợ|sầu|hận|oan|tình|cảm|vui|hạnh|phúc|giận|ức|óa/i,
            work: /làm|giã|đập|chèo|kéo|cày|bừa|trồng|thu|dệt|may|nấu|hò|giã|mài|hái|săn|đánh|bắn|đan|chẻ|xẻ|đi/i,
            time: /chiều|sáng|trưa|tối|đêm|hôm|mai|ngày|tháng|năm|mùa|lúc|khi|thời|rồi|nay|xưa|sớm|trước|sau/i,
            place: /làng|thành|phố|chợ|nhà|lầu|cầu|đò|thuyền|bến|sông|núi|nơi|chốn|xứ|quê|hương|đất|trời|hang|hố|bờ|cửa|phủ|đình|chùa|miếu|quán|vườn|sân|đường|lối|xa/i
        };

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

    categorizeWord(word, index, allWords) {
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
        for (const [category, pattern] of Object.entries(this.semanticPatterns)) {
            if (pattern.test(wordLower)) {
                return category;
            }
        }

        return 'other';
    }

    detectRegion(songTitle) {
        const lower = songTitle.toLowerCase();
        if (lower.includes('bắc') || lower.includes('hà nội') || lower.startsWith('lý') || lower.includes('quan họ')) return 'Northern';
        if (lower.includes('nam') || lower.includes('sài gòn') || lower.includes('miền nam')) return 'Southern';
        if (lower.includes('huế') || lower.includes('quảng') || lower.includes('nghệ an') || lower.includes('trung')) return 'Central';
        if (lower.includes('tây nguyên') || lower.includes('highland')) return 'Highland';
        return 'Northern'; // Default
    }

    detectGenre(songTitle) {
        if (/^Hò\s+/i.test(songTitle)) return 'Hò';
        if (/^Lý\s+/i.test(songTitle)) return 'Lý';
        if (/Ru\s+/i.test(songTitle) || /Hát ru/i.test(songTitle)) return 'Ru';
        if (/quan họ/i.test(songTitle)) return 'Quan họ';
        if (/Dâng/i.test(songTitle)) return 'Ritual';
        if (/Trống/i.test(songTitle)) return 'Ceremonial';
        return 'Folk';
    }

    async generateAllProfiles() {
        const files = fs.readdirSync(this.lyricsDir).filter(f => f.endsWith('.json'));

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Thematic Profile Generator                               ║`);
        console.log(`║  Analyzing 6 themes across all songs                      ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        const profiles = [];
        let processedCount = 0;

        files.forEach(file => {
            const songName = file.replace('.json', '');
            const lyricsData = JSON.parse(fs.readFileSync(path.join(this.lyricsDir, file), 'utf8'));

            // Count words by theme
            const themeCounts = {
                nature: 0,
                family: 0,
                emotion: 0,
                work: 0,
                time: 0,
                place: 0,
                other: 0
            };

            let totalWords = 0;

            lyricsData.phrases.forEach(phrase => {
                if (phrase.wordMapping) {
                    // Extract all words in the phrase for context-aware categorization
                    const allWords = phrase.wordMapping.map(m => m.vn);

                    phrase.wordMapping.forEach((mapping, index) => {
                        totalWords++;
                        const category = this.categorizeWord(mapping.vn, index, allWords);
                        themeCounts[category]++;
                    });
                }
            });

            // Calculate percentages
            const themePercentages = {};
            Object.keys(themeCounts).forEach(theme => {
                themePercentages[theme] = totalWords > 0
                    ? ((themeCounts[theme] / totalWords) * 100).toFixed(2)
                    : 0;
            });

            // Build profile
            const profile = {
                songName,
                songTitle: lyricsData.songTitle || songName,
                region: this.detectRegion(lyricsData.songTitle || songName),
                genre: this.detectGenre(lyricsData.songTitle || songName),
                totalWords,
                totalPhrases: lyricsData.phrases.length,
                themeCounts,
                themePercentages,
                // 6-axis radar data (excluding 'other')
                radarData: [
                    parseFloat(themePercentages.nature),
                    parseFloat(themePercentages.family),
                    parseFloat(themePercentages.emotion),
                    parseFloat(themePercentages.work),
                    parseFloat(themePercentages.time),
                    parseFloat(themePercentages.place)
                ],
                // Dominant theme
                dominantTheme: Object.entries(themePercentages)
                    .filter(([k, v]) => k !== 'other')
                    .reduce((max, [k, v]) => parseFloat(v) > parseFloat(max[1]) ? [k, v] : max, ['none', 0])[0]
            };

            profiles.push(profile);

            processedCount++;
            const progress = Math.round((processedCount / files.length) * 100);
            if (processedCount % 10 === 0 || processedCount === files.length) {
                console.log(`✅ [${processedCount}/${files.length}] ${progress}% - ${songName}`);
            }
        });

        // Calculate collection averages by region and genre
        const collectionStats = this.calculateCollectionStats(profiles);

        // Calculate similarity matrix
        const similarityMatrix = this.calculateSimilarityMatrix(profiles);

        // For each song, find most similar songs
        profiles.forEach((profile, idx) => {
            const similarities = similarityMatrix[idx]
                .map((score, otherIdx) => ({
                    songName: profiles[otherIdx].songName,
                    songTitle: profiles[otherIdx].songTitle,
                    similarity: score
                }))
                .filter(s => s.songName !== profile.songName)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 10); // Top 10 most similar

            profile.similarSongs = similarities;
        });

        // Save comprehensive data
        const output = {
            profiles,
            collectionStats,
            metadata: {
                totalSongs: files.length,
                generatedAt: new Date().toISOString(),
                themeLabels: ['Nature', 'Family', 'Emotion', 'Work', 'Time', 'Place']
            }
        };

        fs.writeFileSync(this.outputPath, JSON.stringify(output, null, 2), 'utf8');

        // Print summary
        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Generation Complete!                                     ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        console.log(`✅ Generated ${profiles.length} thematic profiles`);
        console.log(`📊 Collection averages calculated for:`);
        console.log(`   - 4 regions: Northern, Southern, Central, Highland`);
        console.log(`   - 7 genres: Hò, Lý, Ru, Quan họ, Ritual, Ceremonial, Folk`);
        console.log(`\n🎯 Dominant Themes Distribution:`);

        const themeDistribution = {};
        profiles.forEach(p => {
            themeDistribution[p.dominantTheme] = (themeDistribution[p.dominantTheme] || 0) + 1;
        });

        Object.entries(themeDistribution)
            .sort((a, b) => b[1] - a[1])
            .forEach(([theme, count]) => {
                console.log(`   ${theme}: ${count} songs (${((count / profiles.length) * 100).toFixed(1)}%)`);
            });

        console.log(`\n💾 Saved to: ${this.outputPath}\n`);

        return output;
    }

    calculateCollectionStats(profiles) {
        const byRegion = {};
        const byGenre = {};

        profiles.forEach(profile => {
            // By region
            if (!byRegion[profile.region]) {
                byRegion[profile.region] = {
                    songs: [],
                    themeTotals: { nature: 0, family: 0, emotion: 0, work: 0, time: 0, place: 0 }
                };
            }
            byRegion[profile.region].songs.push(profile);
            Object.keys(byRegion[profile.region].themeTotals).forEach(theme => {
                byRegion[profile.region].themeTotals[theme] += parseFloat(profile.themePercentages[theme]);
            });

            // By genre
            if (!byGenre[profile.genre]) {
                byGenre[profile.genre] = {
                    songs: [],
                    themeTotals: { nature: 0, family: 0, emotion: 0, work: 0, time: 0, place: 0 }
                };
            }
            byGenre[profile.genre].songs.push(profile);
            Object.keys(byGenre[profile.genre].themeTotals).forEach(theme => {
                byGenre[profile.genre].themeTotals[theme] += parseFloat(profile.themePercentages[theme]);
            });
        });

        // Calculate averages
        Object.keys(byRegion).forEach(region => {
            const count = byRegion[region].songs.length;
            byRegion[region].themeAverages = {};
            Object.keys(byRegion[region].themeTotals).forEach(theme => {
                byRegion[region].themeAverages[theme] = (byRegion[region].themeTotals[theme] / count).toFixed(2);
            });
            byRegion[region].radarData = [
                parseFloat(byRegion[region].themeAverages.nature),
                parseFloat(byRegion[region].themeAverages.family),
                parseFloat(byRegion[region].themeAverages.emotion),
                parseFloat(byRegion[region].themeAverages.work),
                parseFloat(byRegion[region].themeAverages.time),
                parseFloat(byRegion[region].themeAverages.place)
            ];
        });

        Object.keys(byGenre).forEach(genre => {
            const count = byGenre[genre].songs.length;
            byGenre[genre].themeAverages = {};
            Object.keys(byGenre[genre].themeTotals).forEach(theme => {
                byGenre[genre].themeAverages[theme] = (byGenre[genre].themeTotals[theme] / count).toFixed(2);
            });
            byGenre[genre].radarData = [
                parseFloat(byGenre[genre].themeAverages.nature),
                parseFloat(byGenre[genre].themeAverages.family),
                parseFloat(byGenre[genre].themeAverages.emotion),
                parseFloat(byGenre[genre].themeAverages.work),
                parseFloat(byGenre[genre].themeAverages.time),
                parseFloat(byGenre[genre].themeAverages.place)
            ];
        });

        return { byRegion, byGenre };
    }

    calculateSimilarityMatrix(profiles) {
        const n = profiles.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 100; // Perfect similarity to self
                    continue;
                }

                // Calculate cosine similarity between radar vectors
                const a = profiles[i].radarData;
                const b = profiles[j].radarData;

                const dotProduct = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
                const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
                const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

                const similarity = magA && magB ? (dotProduct / (magA * magB)) * 100 : 0;
                matrix[i][j] = similarity.toFixed(2);
            }
        }

        return matrix;
    }
}

if (require.main === module) {
    const generator = new ThematicProfileGenerator();
    generator.generateAllProfiles().catch(console.error);
}

module.exports = ThematicProfileGenerator;
