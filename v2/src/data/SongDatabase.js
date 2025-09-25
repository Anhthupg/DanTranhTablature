/**
 * SongDatabase.js
 * Manages 1300+ songs with search, filtering, and recommendations
 */

export class SongDatabase {
    constructor() {
        this.songs = new Map();
        this.indices = {
            byTitle: new Map(),
            byComposer: new Map(),
            byPattern: new Map(),
            byTempo: new Map(),
            byNoteCount: new Map(),
            byDifficulty: new Map()
        };
        this.searchIndex = [];
        this.recommendations = new Map();
    }

    /**
     * Add song to database
     */
    addSong(songData) {
        const songId = songData.metadata.id || `song_${this.songs.size + 1}`;

        // Calculate additional metadata
        const enrichedData = {
            ...songData,
            id: songId,
            difficulty: this.calculateDifficulty(songData),
            tempo: this.estimateTempo(songData),
            searchText: this.createSearchText(songData),
            addedAt: Date.now()
        };

        // Add to main collection
        this.songs.set(songId, enrichedData);

        // Update indices
        this.updateIndices(enrichedData);

        // Update recommendations
        this.updateRecommendations(enrichedData);

        return songId;
    }

    /**
     * Update all indices
     */
    updateIndices(song) {
        // Title index
        const titleKey = song.metadata.title.toLowerCase();
        if (!this.indices.byTitle.has(titleKey)) {
            this.indices.byTitle.set(titleKey, []);
        }
        this.indices.byTitle.get(titleKey).push(song.id);

        // Composer index
        const composer = song.metadata.composer || 'Unknown';
        if (!this.indices.byComposer.has(composer)) {
            this.indices.byComposer.set(composer, []);
        }
        this.indices.byComposer.get(composer).push(song.id);

        // Pattern index (for similarity matching)
        if (song.patterns && song.patterns.kpic) {
            Object.values(song.patterns.kpic).forEach(patterns => {
                patterns.forEach(pattern => {
                    const key = pattern.pattern.join('-');
                    if (!this.indices.byPattern.has(key)) {
                        this.indices.byPattern.set(key, []);
                    }
                    this.indices.byPattern.get(key).push(song.id);
                });
            });
        }

        // Note count index (for difficulty grouping)
        const noteRange = Math.floor(song.notes.length / 50) * 50;
        const rangeKey = `${noteRange}-${noteRange + 49}`;
        if (!this.indices.byNoteCount.has(rangeKey)) {
            this.indices.byNoteCount.set(rangeKey, []);
        }
        this.indices.byNoteCount.get(rangeKey).push(song.id);

        // Search index
        this.searchIndex.push({
            id: song.id,
            text: song.searchText,
            title: song.metadata.title,
            composer: composer
        });
    }

    /**
     * Search songs
     */
    search(query, options = {}) {
        const {
            limit = 20,
            offset = 0,
            sortBy = 'relevance',
            filters = {}
        } = options;

        let results = [];

        if (!query) {
            // Return all songs if no query
            results = Array.from(this.songs.values());
        } else {
            // Fuzzy search
            const queryLower = query.toLowerCase();
            results = this.searchIndex
                .filter(item => {
                    return item.text.includes(queryLower) ||
                           this.fuzzyMatch(queryLower, item.title.toLowerCase()) > 0.5;
                })
                .map(item => this.songs.get(item.id));
        }

        // Apply filters
        if (filters.composer) {
            results = results.filter(song =>
                song.metadata.composer === filters.composer
            );
        }

        if (filters.difficulty) {
            results = results.filter(song =>
                song.difficulty === filters.difficulty
            );
        }

        if (filters.minNotes || filters.maxNotes) {
            results = results.filter(song => {
                const count = song.notes.length;
                return (!filters.minNotes || count >= filters.minNotes) &&
                       (!filters.maxNotes || count <= filters.maxNotes);
            });
        }

        // Sort results
        results = this.sortResults(results, sortBy, query);

        // Paginate
        return {
            total: results.length,
            songs: results.slice(offset, offset + limit),
            offset,
            limit
        };
    }

    /**
     * Find similar songs
     */
    findSimilar(songId, limit = 10) {
        const song = this.songs.get(songId);
        if (!song) return [];

        const similarities = [];

        // Compare with all other songs
        for (const [otherId, otherSong] of this.songs) {
            if (otherId === songId) continue;

            const similarity = this.calculateSimilarity(song, otherSong);
            similarities.push({
                id: otherId,
                song: otherSong,
                score: similarity
            });
        }

        // Sort by similarity and return top matches
        return similarities
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => ({
                ...item.song,
                similarityScore: item.score
            }));
    }

    /**
     * Calculate similarity between two songs
     */
    calculateSimilarity(song1, song2) {
        let score = 0;
        let factors = 0;

        // Note count similarity
        const noteDiff = Math.abs(song1.notes.length - song2.notes.length);
        const noteScore = 1 - (noteDiff / Math.max(song1.notes.length, song2.notes.length));
        score += noteScore * 2; // Weight: 2
        factors += 2;

        // Pattern similarity
        if (song1.patterns && song2.patterns) {
            const patterns1 = this.extractPatternSet(song1.patterns);
            const patterns2 = this.extractPatternSet(song2.patterns);
            const intersection = this.setIntersection(patterns1, patterns2);
            const union = this.setUnion(patterns1, patterns2);
            const patternScore = union.size > 0 ? intersection.size / union.size : 0;
            score += patternScore * 3; // Weight: 3
            factors += 3;
        }

        // Difficulty similarity
        const diffScore = song1.difficulty === song2.difficulty ? 1 : 0.5;
        score += diffScore;
        factors += 1;

        // Composer similarity
        if (song1.metadata.composer === song2.metadata.composer) {
            score += 1;
        }
        factors += 1;

        return score / factors;
    }

    /**
     * Get recommendations for a user
     */
    getRecommendations(userId, recentlyPlayed = [], limit = 10) {
        const recommendations = [];

        // If user has played songs, base recommendations on those
        if (recentlyPlayed.length > 0) {
            const playedPatterns = new Set();
            const playedDifficulties = new Set();

            recentlyPlayed.forEach(songId => {
                const song = this.songs.get(songId);
                if (song) {
                    playedDifficulties.add(song.difficulty);

                    // Collect patterns from played songs
                    if (song.patterns) {
                        const patterns = this.extractPatternSet(song.patterns);
                        patterns.forEach(p => playedPatterns.add(p));
                    }
                }
            });

            // Find songs with similar patterns but not recently played
            for (const [songId, song] of this.songs) {
                if (recentlyPlayed.includes(songId)) continue;

                let score = 0;

                // Pattern matching
                if (song.patterns) {
                    const songPatterns = this.extractPatternSet(song.patterns);
                    const commonPatterns = this.setIntersection(playedPatterns, songPatterns);
                    score += commonPatterns.size * 2;
                }

                // Difficulty progression
                if (playedDifficulties.has(song.difficulty) ||
                    playedDifficulties.has(song.difficulty - 1)) {
                    score += 3;
                }

                if (score > 0) {
                    recommendations.push({
                        ...song,
                        recommendationScore: score
                    });
                }
            }

            // Sort by recommendation score
            recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
        } else {
            // For new users, recommend popular/beginner songs
            const beginnerSongs = Array.from(this.songs.values())
                .filter(song => song.difficulty <= 2)
                .sort((a, b) => a.notes.length - b.notes.length);

            recommendations.push(...beginnerSongs);
        }

        return recommendations.slice(0, limit);
    }

    /**
     * Calculate difficulty level
     */
    calculateDifficulty(songData) {
        let difficulty = 1; // 1-5 scale

        const noteCount = songData.notes.length;
        const graceNotes = songData.notes.filter(n => n.isGrace).length;

        // Factor: Total notes
        if (noteCount > 200) difficulty++;
        if (noteCount > 400) difficulty++;

        // Factor: Grace note ratio
        const graceRatio = graceNotes / noteCount;
        if (graceRatio > 0.1) difficulty++;
        if (graceRatio > 0.2) difficulty++;

        // Factor: Pattern complexity
        if (songData.patterns) {
            const uniquePatterns = new Set();
            Object.values(songData.patterns.kpic || {}).forEach(patterns => {
                patterns.forEach(p => uniquePatterns.add(p.pattern.join('-')));
            });
            if (uniquePatterns.size > 20) difficulty++;
        }

        return Math.min(difficulty, 5);
    }

    /**
     * Estimate tempo from note durations
     */
    estimateTempo(songData) {
        if (!songData.notes || songData.notes.length === 0) return 120; // Default

        const durations = songData.notes
            .filter(n => !n.isGrace)
            .map(n => n.duration || 1);

        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

        // Convert to approximate BPM
        return Math.round(60 / avgDuration);
    }

    /**
     * Create searchable text
     */
    createSearchText(songData) {
        const parts = [
            songData.metadata.title,
            songData.metadata.composer,
            songData.metadata.source,
            `${songData.notes.length} notes`,
            `difficulty ${this.calculateDifficulty(songData)}`
        ];

        return parts.filter(Boolean).join(' ').toLowerCase();
    }

    /**
     * Fuzzy string matching
     */
    fuzzyMatch(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Extract pattern set for comparison
     */
    extractPatternSet(patterns) {
        const set = new Set();

        if (patterns.kpic) {
            Object.values(patterns.kpic).forEach(patternList => {
                patternList.forEach(p => {
                    set.add(p.pattern.join('-'));
                });
            });
        }

        return set;
    }

    /**
     * Set operations
     */
    setIntersection(set1, set2) {
        return new Set([...set1].filter(x => set2.has(x)));
    }

    setUnion(set1, set2) {
        return new Set([...set1, ...set2]);
    }

    /**
     * Sort results by various criteria
     */
    sortResults(results, sortBy, query) {
        switch (sortBy) {
            case 'title':
                return results.sort((a, b) =>
                    a.metadata.title.localeCompare(b.metadata.title)
                );

            case 'noteCount':
                return results.sort((a, b) => a.notes.length - b.notes.length);

            case 'difficulty':
                return results.sort((a, b) => a.difficulty - b.difficulty);

            case 'newest':
                return results.sort((a, b) => b.addedAt - a.addedAt);

            case 'relevance':
            default:
                // Score based on query match quality
                if (query) {
                    const queryLower = query.toLowerCase();
                    return results.sort((a, b) => {
                        const scoreA = this.fuzzyMatch(queryLower, a.metadata.title.toLowerCase());
                        const scoreB = this.fuzzyMatch(queryLower, b.metadata.title.toLowerCase());
                        return scoreB - scoreA;
                    });
                }
                return results;
        }
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const stats = {
            totalSongs: this.songs.size,
            totalNotes: 0,
            composers: new Set(),
            difficulties: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            averageNoteCount: 0,
            patterns: new Set()
        };

        for (const song of this.songs.values()) {
            stats.totalNotes += song.notes.length;
            stats.composers.add(song.metadata.composer || 'Unknown');
            stats.difficulties[song.difficulty]++;

            if (song.patterns) {
                const patterns = this.extractPatternSet(song.patterns);
                patterns.forEach(p => stats.patterns.add(p));
            }
        }

        stats.averageNoteCount = Math.round(stats.totalNotes / this.songs.size);
        stats.uniqueComposers = stats.composers.size;
        stats.uniquePatterns = stats.patterns.size;

        return stats;
    }

    /**
     * Export database to JSON
     */
    exportToJSON() {
        return {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            songs: Array.from(this.songs.values()),
            statistics: this.getStatistics()
        };
    }

    /**
     * Import from JSON
     */
    importFromJSON(data) {
        if (data.songs && Array.isArray(data.songs)) {
            data.songs.forEach(song => this.addSong(song));
            return true;
        }
        return false;
    }
}

// Create singleton instance
export const songDatabase = new SongDatabase();