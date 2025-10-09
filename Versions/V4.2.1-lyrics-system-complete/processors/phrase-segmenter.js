/**
 * Vietnamese Phrase Segmentation Processor
 *
 * Segments Vietnamese folk song lyrics into meaningful poetic phrases
 * based on traditional dan ca structure and linguistic patterns
 */

class PhraseSegmenter {
    constructor() {
        // Vietnamese padding particles and their classifications
        this.vocativeParticles = ['ơi', 'ời', 'ới', 'í', 'i', 'ì', 'ĩ', 'à', 'ạ', 'vậy'];
        this.melodicBridges = ['tình là', 'tình la', 'ơi la', 'ơi lơi', 'leng keng', 'lắng lo'];
        this.rhythmicFillers = ['i í i í', 'a ha a ha', 'lá lá lá'];
        this.lowercaseWords = ['và', 'của', 'cho', 'với', 'từ', 'trong', 'em', 'con', 'là', 'quan', 'họ', 'ru', 'hò'];

        // FEEDBACK: Common refrain patterns that should create phrase boundaries
        this.refrainPatterns = [
            'cái duyên ông chồng làm khổ cái đời tôi',
            'ơi bà rí ơi',
            'bà rằng bà rí ơi',
            'làm khổ cái đời tôi'
        ];

        // FEEDBACK: Refrain start markers - break BEFORE these
        this.refrainStarts = ['cái duyên', 'ơi bà', 'nối dây'];

        // FEEDBACK: Max phrase length (syllables) before forced break
        // Most phrases are 3-5 syllables, with some refrains up to 7
        this.maxPhraseLength = 5;  // Stricter limit based on feedback

        // LINGUISTIC PATTERNS: Question markers
        this.questionMarkers = ['đâu', 'sao', 'nào', 'gì', 'ai'];

        // LINGUISTIC PATTERNS: Subject markers (answer patterns)
        this.subjectMarkers = ['bà', 'chồng', 'em', 'anh', 'tôi'];

        // LINGUISTIC PATTERNS: Exclamatory endings
        this.exclamatoryEndings = ['ơi', 'ời', 'ới', 'à', 'ạ'];

        // LINGUISTIC PATTERNS: Parallel phrase endings for grouping
        this.parallelEndings = ['bà rí ơi', 'bà rằng bà rí ơi'];

        // Feedback storage for learning from corrections
        this.feedbackLog = [];
    }

    /**
     * Classify a syllable by its function in the song
     */
    classifySyllable(text) {
        const textLower = text.toLowerCase().trim();

        // Check for melodic bridges (should be separate phrases)
        for (const bridge of this.melodicBridges) {
            if (textLower.includes(bridge)) {
                return { type: 'melodic_bridge', createSeparatePhrase: true, isPadding: true };
            }
        }

        // Check for rhythmic fillers (separate phrases)
        for (const filler of this.rhythmicFillers) {
            if (textLower.includes(filler)) {
                return { type: 'rhythmic', createSeparatePhrase: true, isPadding: true };
            }
        }

        // FEEDBACK CORRECTION: Single vocative particles like "Ới", "ơi" should NOT create separate phrases
        // They should merge with surrounding content
        if (this.vocativeParticles.includes(textLower)) {
            return { type: 'vocative', attachToNext: true, isPadding: true };
        }

        // Default: semantic content
        return { type: 'semantic', standalone: true, isPadding: false };
    }

    /**
     * Detect traditional Vietnamese folk song patterns
     */
    detectPattern(syllables) {
        // Count only semantic syllables (exclude padding)
        const semanticCount = syllables.filter(s => {
            const classification = this.classifySyllable(s.text);
            return !classification.isPadding;
        }).length;

        // Lục bát pattern (6-8 alternating)
        if (semanticCount === 6 || semanticCount === 8) {
            return {
                pattern: 'luc_bat',
                breakAfter: semanticCount,
                confidence: 0.9
            };
        }

        // Song thất lục bát (7-7-6-8)
        if ([7, 6, 8].includes(semanticCount)) {
            return {
                pattern: 'song_that_luc_bat',
                breakAfter: semanticCount,
                confidence: 0.8
            };
        }

        // Tám tự (8-syllable)
        if (semanticCount === 8) {
            return {
                pattern: 'tam_tu',
                breakAfter: 8,
                confidence: 0.7
            };
        }

        // Narrative/free form
        return {
            pattern: 'narrative',
            useBreathingPoints: true,
            confidence: 0.5
        };
    }

    /**
     * Detect phrase boundaries using multiple heuristics
     */
    detectPhraseBoundaries(syllables, notes) {
        const boundaries = [];

        syllables.forEach((syl, i) => {
            const classification = this.classifySyllable(syl.text);

            // Rule 1: Melodic bridges create boundaries
            if (classification.createSeparatePhrase) {
                boundaries.push({
                    position: i,
                    confidence: 0.95,
                    reason: 'melodic_bridge'
                });
            }

            // FEEDBACK CORRECTION: Check for refrain start patterns - break BEFORE them
            const remainingText = syllables.slice(i).map(s => s.text).join(' ').toLowerCase();
            for (const pattern of this.refrainStarts) {
                if (remainingText.startsWith(pattern) && i > 0) {
                    boundaries.push({
                        position: i - 1,  // Break before the pattern
                        confidence: 0.95,
                        reason: 'refrain_start'
                    });
                }
            }

            // Rule 2: SKIP vocative particles - they merge forward, don't create boundaries

            // Rule 3: Punctuation marks (if present in text) - UPDATED to include Western period
            if (syl.text.match(/[,.。!?]/)) {
                boundaries.push({
                    position: i,
                    confidence: 0.95,  // High confidence for explicit punctuation
                    reason: 'punctuation'
                });
            }

            // Rule 4: Long note durations (>= 2.0 quarter notes)
            if (syl.noteDurations && syl.noteDurations.some(d => d >= 2.0)) {
                boundaries.push({
                    position: i,
                    confidence: 0.7,
                    reason: 'long_note'
                });
            }

            // Rule 5: Melismatic passages (one syllable, many notes)
            if (syl.isMelisma && syl.noteIndices && syl.noteIndices.length >= 3) {
                boundaries.push({
                    position: i,
                    confidence: 0.65,
                    reason: 'melisma'
                });
            }
        });

        // Rule 6: Apply pattern-based boundaries
        const pattern = this.detectPattern(syllables);
        if (pattern.breakAfter) {
            boundaries.push({
                position: pattern.breakAfter - 1,
                confidence: pattern.confidence,
                reason: `pattern_${pattern.pattern}`
            });
        }

        // Merge boundaries and filter by confidence threshold
        return this.mergeBoundaries(boundaries, 0.7);
    }

    /**
     * Merge overlapping boundaries and keep highest confidence
     */
    mergeBoundaries(boundaries, threshold = 0.7) {
        // Filter by confidence
        const filtered = boundaries.filter(b => b.confidence >= threshold);

        // Group by position and keep highest confidence
        const positionMap = new Map();
        filtered.forEach(b => {
            if (!positionMap.has(b.position) || positionMap.get(b.position).confidence < b.confidence) {
                positionMap.set(b.position, b);
            }
        });

        // Return positions sorted
        return Array.from(positionMap.values())
            .sort((a, b) => a.position - b.position)
            .map(b => b.position);
    }

    /**
     * Analyze phrase positions (opening/middle/ending)
     */
    analyzePhrasePositions(phrase) {
        const words = phrase.syllables.map(s => s.text);
        const totalWords = words.length;

        // Extract opening, middle, ending positions
        const opening = totalWords >= 6 ? words.slice(0, 3) : words.slice(0, 2);
        const ending = totalWords >= 6 ? words.slice(-3) : words.slice(-2);

        const openingEnd = opening.length;
        const endingStart = totalWords - ending.length;
        const middle = totalWords > openingEnd + ending.length ?
            words.slice(openingEnd, endingStart) : [];

        return {
            opening: {
                words: opening,
                text: opening.join(' '),
                indices: Array.from({length: opening.length}, (_, i) => i)
            },
            middle: {
                words: middle,
                text: middle.join(' '),
                indices: Array.from({length: middle.length}, (_, i) => i + openingEnd)
            },
            ending: {
                words: ending,
                text: ending.join(' '),
                indices: Array.from({length: ending.length}, (_, i) => i + endingStart)
            }
        };
    }

    /**
     * Create phrases from syllables and detected boundaries
     */
    createPhrases(syllables, notes, boundaries) {
        const phrases = [];
        let currentPhrase = [];
        let phraseStartNote = 0;

        syllables.forEach((syl, i) => {
            currentPhrase.push(syl);

            // FEEDBACK: Enforce max phrase length (with refrain exception using lookahead)
            const semanticCount = currentPhrase.filter(s => {
                const c = this.classifySyllable(s.text);
                return !c.isPadding;
            }).length;

            const phraseText = currentPhrase.map(s => s.text).join(' ').toLowerCase();

            // LOOKAHEAD: Check if we're building a known refrain pattern
            const remainingText = syllables.slice(i - currentPhrase.length + 1, Math.min(i + 8, syllables.length))
                .map(s => s.text).join(' ').toLowerCase();
            const isInRefrain = this.refrainPatterns.some(r => remainingText.includes(r));

            const maxLength = isInRefrain ? 7 : this.maxPhraseLength;

            const shouldBreak = boundaries.includes(i) ||
                               i === syllables.length - 1 ||
                               (semanticCount >= maxLength && !isInRefrain);

            // Check if this position is a boundary or max length reached
            if (shouldBreak) {
                const phraseEndNote = syl.noteIndices ? syl.noteIndices[syl.noteIndices.length - 1] : 0;

                const vietnameseText = currentPhrase.map(s => s.text).join(' ');
                const semanticCount = currentPhrase.filter(s => {
                    const classification = this.classifySyllable(s.text);
                    return !classification.isPadding;
                }).length;

                const phrase = {
                    id: phrases.length,
                    syllables: currentPhrase,
                    startNoteIndex: phraseStartNote,
                    endNoteIndex: phraseEndNote,
                    vietnameseText,
                    englishText: '',  // Will be filled by translation service
                    syllableCount: semanticCount,
                    totalSyllables: currentPhrase.length,
                    type: this.detectPhraseType(currentPhrase),
                    hasBreak: false,
                    breakPosition: null,
                    isUserCorrected: false
                };

                // Add phrase position analysis
                phrase.positions = this.analyzePhrasePositions(phrase);

                phrases.push(phrase);

                currentPhrase = [];
                phraseStartNote = phraseEndNote + 1;
            }
        });

        // If no boundaries detected, create one phrase per 6 syllables (fallback)
        if (phrases.length === 0 && syllables.length > 0) {
            const chunkSize = 6;
            for (let i = 0; i < syllables.length; i += chunkSize) {
                const chunk = syllables.slice(i, i + chunkSize);
                const startNote = chunk[0].noteIndices ? chunk[0].noteIndices[0] : 0;
                const endNote = chunk[chunk.length - 1].noteIndices ?
                    chunk[chunk.length - 1].noteIndices[chunk[chunk.length - 1].noteIndices.length - 1] : 0;

                phrases.push({
                    id: phrases.length,
                    syllables: chunk,
                    startNoteIndex: startNote,
                    endNoteIndex: endNote,
                    vietnameseText: chunk.map(s => s.text).join(' '),
                    englishText: '',
                    syllableCount: chunk.length,
                    totalSyllables: chunk.length,
                    type: 'narrative',
                    hasBreak: false,
                    breakPosition: null,
                    isUserCorrected: false
                });
            }
        }

        return phrases;
    }

    /**
     * Detect phrase type based on content
     */
    detectPhraseType(syllables) {
        const text = syllables.map(s => s.text).join(' ').toLowerCase();

        // Check if mostly padding
        const paddingCount = syllables.filter(s => {
            const classification = this.classifySyllable(s.text);
            return classification.isPadding;
        }).length;

        if (paddingCount / syllables.length > 0.5) {
            return 'melodic_bridge';
        }

        // Check for melodic bridges
        if (this.melodicBridges.some(bridge => text.includes(bridge))) {
            return 'melodic_bridge';
        }

        // Check for ornamental patterns
        if (this.rhythmicFillers.some(filler => text.includes(filler))) {
            return 'ornamental';
        }

        // Default: semantic content
        return 'semantic';
    }

    /**
     * Analyze linguistic patterns in phrases (question/answer, parallel, exclamatory)
     */
    analyzeLinguisticPatterns(phrases) {
        phrases.forEach((phrase, i) => {
            const text = phrase.vietnameseText.toLowerCase();

            // Detect question phrases
            phrase.isQuestion = this.questionMarkers.some(q => text.includes(q));

            // Detect answer phrases (follows question, starts with subject)
            if (i > 0 && phrases[i-1].isQuestion) {
                phrase.isAnswer = this.subjectMarkers.some(s => text.startsWith(s));
                if (phrase.isAnswer) {
                    phrase.answersPhrase = i - 1;
                    phrases[i-1].answeredBy = i;
                }
            }

            // Detect exclamatory phrases
            phrase.isExclamatory = this.exclamatoryEndings.some(e => text.endsWith(e));

            // Detect parallel endings
            phrase.parallelGroup = null;
            for (const ending of this.parallelEndings) {
                if (text.endsWith(ending)) {
                    phrase.parallelGroup = ending;
                    break;
                }
            }

            // Update phrase type based on linguistic analysis
            if (phrase.isQuestion) phrase.linguisticType = 'question';
            else if (phrase.isAnswer) phrase.linguisticType = 'answer';
            else if (phrase.isExclamatory) phrase.linguisticType = 'exclamatory';
            else if (phrase.parallelGroup) phrase.linguisticType = 'refrain_variant';
            else phrase.linguisticType = 'narrative';
        });

        return phrases;
    }

    /**
     * Main segmentation method
     */
    segment(syllables, notes) {
        // Detect boundaries
        const boundaries = this.detectPhraseBoundaries(syllables, notes);

        // Create phrases
        let phrases = this.createPhrases(syllables, notes, boundaries);

        // Analyze linguistic patterns
        phrases = this.analyzeLinguisticPatterns(phrases);

        // Log segmentation for analysis
        console.log(`\nPhrase Segmentation Results:`);
        console.log(`Total syllables: ${syllables.length}`);
        console.log(`Detected boundaries: ${boundaries.length}`);
        console.log(`Created phrases: ${phrases.length}`);
        phrases.forEach((phrase, i) => {
            const lingType = phrase.linguisticType ? ` [${phrase.linguisticType}]` : '';
            const parallel = phrase.parallelGroup ? ` {parallel: ${phrase.parallelGroup}}` : '';
            console.log(`  Phrase ${i + 1}: "${phrase.vietnameseText}" (${phrase.syllableCount} syllables, type: ${phrase.type})${lingType}${parallel}`);
        });

        return {
            phrases,
            boundaries,
            statistics: {
                totalSyllables: syllables.length,
                totalPhrases: phrases.length,
                averagePhraseLength: syllables.length / phrases.length,
                semanticPhrases: phrases.filter(p => p.type === 'semantic').length,
                melodicBridges: phrases.filter(p => p.type === 'melodic_bridge').length,
                ornamentalPhrases: phrases.filter(p => p.type === 'ornamental').length
            }
        };
    }

    /**
     * Log user feedback for algorithm improvement
     */
    logFeedback(songTitle, originalPhrases, correctedPhrases, userComments) {
        this.feedbackLog.push({
            timestamp: new Date().toISOString(),
            songTitle,
            originalPhrases: originalPhrases.map(p => p.vietnameseText),
            correctedPhrases: correctedPhrases.map(p => p.vietnameseText),
            userComments,
            differences: this.analyzeDifferences(originalPhrases, correctedPhrases)
        });

        console.log(`\nFeedback logged for "${songTitle}"`);
        console.log(`User corrections: ${this.analyzeDifferences(originalPhrases, correctedPhrases).length} changes`);

        return this.feedbackLog.length - 1; // Return feedback ID
    }

    /**
     * Analyze differences between original and corrected phrases
     */
    analyzeDifferences(originalPhrases, correctedPhrases) {
        const differences = [];

        // Simple difference detection
        if (originalPhrases.length !== correctedPhrases.length) {
            differences.push({
                type: 'phrase_count_change',
                original: originalPhrases.length,
                corrected: correctedPhrases.length
            });
        }

        // Compare each phrase
        const minLength = Math.min(originalPhrases.length, correctedPhrases.length);
        for (let i = 0; i < minLength; i++) {
            if (originalPhrases[i].vietnameseText !== correctedPhrases[i].vietnameseText) {
                differences.push({
                    type: 'phrase_text_change',
                    phraseIndex: i,
                    original: originalPhrases[i].vietnameseText,
                    corrected: correctedPhrases[i].vietnameseText
                });
            }
        }

        return differences;
    }

    /**
     * Get feedback summary for algorithm improvement
     */
    getFeedbackSummary() {
        if (this.feedbackLog.length === 0) {
            return { message: 'No feedback logged yet' };
        }

        return {
            totalFeedbackEntries: this.feedbackLog.length,
            songsCorrected: [...new Set(this.feedbackLog.map(f => f.songTitle))],
            commonPatterns: this.extractCommonPatterns(),
            suggestedImprovements: this.suggestAlgorithmImprovements()
        };
    }

    /**
     * Extract common correction patterns from feedback
     */
    extractCommonPatterns() {
        const patterns = [];

        this.feedbackLog.forEach(feedback => {
            feedback.differences.forEach(diff => {
                if (diff.type === 'phrase_text_change') {
                    patterns.push({
                        original: diff.original,
                        corrected: diff.corrected,
                        song: feedback.songTitle
                    });
                }
            });
        });

        return patterns;
    }

    /**
     * Suggest algorithm improvements based on user feedback
     */
    suggestAlgorithmImprovements() {
        const suggestions = [];

        // Analyze patterns
        const patterns = this.extractCommonPatterns();

        // Look for particles that consistently trigger breaks
        const particleBreaks = patterns.filter(p =>
            this.vocativeParticles.some(particle => p.corrected.includes(particle))
        );

        if (particleBreaks.length > 2) {
            suggestions.push({
                type: 'particle_boundary',
                description: 'User consistently breaks at vocative particles',
                recommendation: 'Increase confidence for vocative boundaries'
            });
        }

        // Look for length patterns
        const phraseLengths = this.feedbackLog.flatMap(f =>
            f.correctedPhrases.map(p => p.split(' ').length)
        );

        if (phraseLengths.length > 0) {
            const avgLength = phraseLengths.reduce((a, b) => a + b, 0) / phraseLengths.length;
            suggestions.push({
                type: 'phrase_length',
                description: `Average corrected phrase length: ${avgLength.toFixed(1)} syllables`,
                recommendation: `Adjust algorithm to prefer ${Math.round(avgLength)}-syllable phrases`
            });
        }

        return suggestions;
    }

    /**
     * Apply learned patterns from feedback (future enhancement)
     */
    applyLearning(syllables, notes) {
        // This method can be enhanced to apply learned patterns
        // from user feedback to improve segmentation

        // For now, use standard segmentation
        return this.segment(syllables, notes);
    }
}

module.exports = PhraseSegmenter;