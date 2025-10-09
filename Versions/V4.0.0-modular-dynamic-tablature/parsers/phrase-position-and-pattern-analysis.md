# PHRASE POSITION & PATTERN ANALYSIS FRAMEWORK

## 📍 PHRASE POSITION DEFINITIONS

### **Method 1: Proportional Division**
```javascript
function definePhrasePosistions(lyrics) {
    const totalSyllables = lyrics.length;

    if (totalSyllables <= 4) {
        // Short phrases: first word = beginning, last word = ending, rest = middle
        return {
            beginning: lyrics.slice(0, 1),
            middle: lyrics.slice(1, -1),
            ending: lyrics.slice(-1)
        };
    } else if (totalSyllables <= 8) {
        // Medium phrases: first 2 = beginning, last 2 = ending, rest = middle
        return {
            beginning: lyrics.slice(0, 2),
            middle: lyrics.slice(2, -2),
            ending: lyrics.slice(-2)
        };
    } else {
        // Long phrases: first 3 = beginning, last 3 = ending, rest = middle
        return {
            beginning: lyrics.slice(0, 3),
            middle: lyrics.slice(3, -3),
            ending: lyrics.slice(-3)
        };
    }
}

// Example: "Lý chiều chiều về đâu mang theo"
// Beginning: ["Lý", "chiều"] (first 2)
// Middle: ["chiều", "về", "đâu", "mang"] (central 4)
// Ending: ["theo"] (last 1)
```

### **Method 2: Percentage-Based Division**
```javascript
function definePhrasePosistionsPercentage(lyrics) {
    const total = lyrics.length;
    const beginningCount = Math.ceil(total * 0.25); // First 25%
    const endingCount = Math.ceil(total * 0.25);    // Last 25%

    return {
        beginning: lyrics.slice(0, beginningCount),
        middle: lyrics.slice(beginningCount, total - endingCount),
        ending: lyrics.slice(total - endingCount),

        // Include percentages for analysis
        beginning_percentage: (beginningCount / total * 100).toFixed(1),
        middle_percentage: ((total - beginningCount - endingCount) / total * 100).toFixed(1),
        ending_percentage: (endingCount / total * 100).toFixed(1)
    };
}
```

### **Method 3: Linguistic Phrase Boundary Detection**
```javascript
function detectLinguisticPhraseBoundaries(lyrics) {
    const phrases = [];
    let currentPhrase = [];

    lyrics.forEach((syllable, index) => {
        currentPhrase.push(syllable);

        // Detect phrase boundaries based on:
        // 1. Punctuation marks in original text
        // 2. Semantic completion (question words, completion markers)
        // 3. Vietnamese linguistic patterns

        if (isPhraseBoundary(syllable, lyrics[index + 1])) {
            phrases.push([...currentPhrase]);
            currentPhrase = [];
        }
    });

    if (currentPhrase.length > 0) {
        phrases.push(currentPhrase);
    }

    // Label positions within each detected phrase
    return phrases.map(phrase => ({
        beginning: phrase.slice(0, Math.min(2, Math.ceil(phrase.length * 0.3))),
        middle: phrase.slice(Math.ceil(phrase.length * 0.3), Math.ceil(phrase.length * 0.7)),
        ending: phrase.slice(Math.ceil(phrase.length * 0.7))
    }));
}

function isPhraseBoundary(currentSyllable, nextSyllable) {
    // Vietnamese phrase boundary indicators
    const endingMarkers = ['đâu', 'sao', 'thế', 'rồi', 'à', 'ơi'];
    const questionWords = ['gì', 'ai', 'đâu', 'sao', 'nào', 'bao'];

    return endingMarkers.includes(currentSyllable) ||
           questionWords.includes(currentSyllable) ||
           !nextSyllable; // End of song
}
```

---

## 🔍 PATTERN ANALYSIS FRAMEWORK

### **1. EXACT PATTERNS** (Perfect Match)
```javascript
function findExactPatterns(sequence, patternLength) {
    const patterns = {};

    for (let i = 0; i <= sequence.length - patternLength; i++) {
        const pattern = sequence.slice(i, i + patternLength);
        const patternKey = pattern.join('-');

        if (!patterns[patternKey]) {
            patterns[patternKey] = {
                pattern: pattern,
                occurrences: [],
                frequency: 0
            };
        }

        patterns[patternKey].occurrences.push(i);
        patterns[patternKey].frequency++;
    }

    return Object.values(patterns).filter(p => p.frequency > 1);
}

// Example: Find exact 3-note pitch patterns
// Input: ["D4", "G4", "A4", "D4", "G4", "A4", "C5"]
// Output: [{ pattern: ["D4", "G4", "A4"], frequency: 2, occurrences: [0, 3] }]
```

### **2. PATTERNS WITH SUBSTITUTION** (One Element Different)
```javascript
function findSubstitutionPatterns(sequence, patternLength, maxSubstitutions = 1) {
    const patterns = {};

    for (let i = 0; i <= sequence.length - patternLength; i++) {
        const pattern = sequence.slice(i, i + patternLength);

        // Find all other subsequences with 1 substitution
        for (let j = i + 1; j <= sequence.length - patternLength; j++) {
            const candidate = sequence.slice(j, j + patternLength);
            const substitutions = countSubstitutions(pattern, candidate);

            if (substitutions <= maxSubstitutions && substitutions > 0) {
                const patternKey = createSubstitutionKey(pattern, candidate);

                if (!patterns[patternKey]) {
                    patterns[patternKey] = {
                        base_pattern: pattern,
                        variations: [],
                        substitution_count: substitutions
                    };
                }

                patterns[patternKey].variations.push({
                    pattern: candidate,
                    position: j,
                    substitution_positions: findSubstitutionPositions(pattern, candidate)
                });
            }
        }
    }

    return patterns;
}

function countSubstitutions(pattern1, pattern2) {
    let count = 0;
    for (let i = 0; i < pattern1.length; i++) {
        if (pattern1[i] !== pattern2[i]) count++;
    }
    return count;
}

// Example: Pitch patterns with 1 substitution
// Pattern: ["D4", "G4", "A4"]
// Variation: ["D4", "G4", "C5"] (A4 → C5 substitution)
```

### **3. PATTERNS WITH INSERTION** (Extra Elements Added)
```javascript
function findInsertionPatterns(sequence, basePatternLength, maxInsertions = 1) {
    const patterns = {};

    for (let i = 0; i <= sequence.length - basePatternLength; i++) {
        const basePattern = sequence.slice(i, i + basePatternLength);

        // Look for patterns that contain this base pattern with insertions
        for (let j = 0; j <= sequence.length - basePatternLength; j++) {
            if (i === j) continue;

            for (let extendedLength = basePatternLength + 1;
                 extendedLength <= basePatternLength + maxInsertions + 1 &&
                 j + extendedLength <= sequence.length;
                 extendedLength++) {

                const candidate = sequence.slice(j, j + extendedLength);
                const insertionAnalysis = analyzeInsertion(basePattern, candidate);

                if (insertionAnalysis.isValidInsertion) {
                    const patternKey = `${basePattern.join('-')}_with_insertions`;

                    if (!patterns[patternKey]) {
                        patterns[patternKey] = {
                            base_pattern: basePattern,
                            variations: []
                        };
                    }

                    patterns[patternKey].variations.push({
                        extended_pattern: candidate,
                        inserted_elements: insertionAnalysis.insertedElements,
                        insertion_positions: insertionAnalysis.insertionPositions
                    });
                }
            }
        }
    }

    return patterns;
}

function analyzeInsertion(basePattern, candidate) {
    // Use dynamic programming to find if candidate contains basePattern with insertions
    const dp = Array(basePattern.length + 1).fill().map(() => Array(candidate.length + 1).fill(false));
    dp[0][0] = true;

    // Allow insertions in candidate
    for (let j = 1; j <= candidate.length; j++) {
        dp[0][j] = true;
    }

    for (let i = 1; i <= basePattern.length; i++) {
        for (let j = 1; j <= candidate.length; j++) {
            // Match
            if (basePattern[i-1] === candidate[j-1]) {
                dp[i][j] = dp[i-1][j-1];
            }
            // Insertion in candidate
            dp[i][j] = dp[i][j] || dp[i][j-1];
        }
    }

    if (dp[basePattern.length][candidate.length]) {
        return {
            isValidInsertion: true,
            insertedElements: findInsertedElements(basePattern, candidate),
            insertionPositions: findInsertionPositions(basePattern, candidate)
        };
    }

    return { isValidInsertion: false };
}

// Example: Base pattern ["D4", "A4"] found in ["D4", "G4", "A4"] (G4 inserted)
```

### **4. PATTERNS WITH DELETION** (Elements Removed)
```javascript
function findDeletionPatterns(sequence, maxDeletions = 1) {
    const patterns = {};

    for (let patternLength = 3; patternLength <= 6; patternLength++) {
        for (let i = 0; i <= sequence.length - patternLength; i++) {
            const pattern = sequence.slice(i, i + patternLength);

            // Look for subsequences that could be this pattern with deletions
            for (let j = 0; j <= sequence.length - (patternLength - maxDeletions); j++) {
                if (i === j) continue;

                for (let candidateLength = patternLength - maxDeletions;
                     candidateLength < patternLength;
                     candidateLength++) {

                    if (j + candidateLength > sequence.length) continue;

                    const candidate = sequence.slice(j, j + candidateLength);
                    const deletionAnalysis = analyzeDeletion(pattern, candidate);

                    if (deletionAnalysis.isValidDeletion) {
                        const patternKey = `${pattern.join('-')}_with_deletions`;

                        if (!patterns[patternKey]) {
                            patterns[patternKey] = {
                                full_pattern: pattern,
                                reduced_variations: []
                            };
                        }

                        patterns[patternKey].reduced_variations.push({
                            reduced_pattern: candidate,
                            deleted_elements: deletionAnalysis.deletedElements,
                            deletion_positions: deletionAnalysis.deletionPositions
                        });
                    }
                }
            }
        }
    }

    return patterns;
}
```

### **5. TRANSPOSITION PATTERNS** (Same Intervals, Different Pitches)
```javascript
function findTranspositionPatterns(pitchSequence, patternLength) {
    const patterns = {};

    for (let i = 0; i <= pitchSequence.length - patternLength; i++) {
        const pattern = pitchSequence.slice(i, i + patternLength);
        const intervalPattern = calculateIntervalPattern(pattern);
        const intervalKey = intervalPattern.join('-');

        if (!patterns[intervalKey]) {
            patterns[intervalKey] = {
                interval_pattern: intervalPattern,
                transpositions: []
            };
        }

        patterns[intervalKey].transpositions.push({
            pitch_pattern: pattern,
            starting_pitch: pattern[0],
            transposition_level: calculateTranspositionLevel(pattern, patterns[intervalKey].transpositions[0]?.pitch_pattern),
            position: i
        });
    }

    return Object.values(patterns).filter(p => p.transpositions.length > 1);
}

function calculateIntervalPattern(pitches) {
    const intervals = [];
    for (let i = 1; i < pitches.length; i++) {
        const interval = pitchToMidi(pitches[i]) - pitchToMidi(pitches[i-1]);
        intervals.push(interval);
    }
    return intervals;
}

// Example: ["D4", "G4", "A4"] and ["F4", "Bb4", "C5"]
// Both have interval pattern [5, 2] (perfect 4th + major 2nd)
// Second is transposed up by 3 semitones
```

### **6. INVERSION PATTERNS** (Intervals Inverted)
```javascript
function findInversionPatterns(pitchSequence, patternLength) {
    const patterns = {};

    for (let i = 0; i <= pitchSequence.length - patternLength; i++) {
        const pattern = pitchSequence.slice(i, i + patternLength);
        const intervalPattern = calculateIntervalPattern(pattern);
        const invertedPattern = intervalPattern.map(interval => -interval);

        // Look for the inverted pattern elsewhere
        for (let j = 0; j <= pitchSequence.length - patternLength; j++) {
            if (i === j) continue;

            const candidate = pitchSequence.slice(j, j + patternLength);
            const candidateIntervals = calculateIntervalPattern(candidate);

            if (arraysEqual(candidateIntervals, invertedPattern)) {
                const patternKey = `inversion_${intervalPattern.join('-')}`;

                if (!patterns[patternKey]) {
                    patterns[patternKey] = {
                        original_intervals: intervalPattern,
                        inverted_intervals: invertedPattern,
                        occurrences: []
                    };
                }

                patterns[patternKey].occurrences.push({
                    original: { pattern, position: i },
                    inversion: { pattern: candidate, position: j }
                });
            }
        }
    }

    return patterns;
}

// Example: [+5, +2] (ascending 4th, ascending 2nd)
// Inversion: [-5, -2] (descending 4th, descending 2nd)
```

### **7. AUGMENTATION/DIMINUTION PATTERNS** (Same Intervals, Different Rhythms)
```javascript
function findAugmentationPatterns(melody, patternLength) {
    const patterns = {};

    for (let i = 0; i <= melody.length - patternLength; i++) {
        const pattern = melody.slice(i, i + patternLength);
        const pitchPattern = pattern.map(note => note.pitch);
        const rhythmPattern = pattern.map(note => note.duration);

        // Look for same pitch pattern with different rhythms
        for (let j = 0; j <= melody.length - patternLength; j++) {
            if (i === j) continue;

            const candidate = melody.slice(j, j + patternLength);
            const candidatePitches = candidate.map(note => note.pitch);
            const candidateRhythms = candidate.map(note => note.duration);

            if (arraysEqual(pitchPattern, candidatePitches)) {
                const rhythmRatio = calculateRhythmRatio(rhythmPattern, candidateRhythms);

                if (rhythmRatio !== 1.0) { // Different rhythms
                    const patternKey = `augmentation_${pitchPattern.join('-')}`;

                    if (!patterns[patternKey]) {
                        patterns[patternKey] = {
                            pitch_pattern: pitchPattern,
                            variations: []
                        };
                    }

                    patterns[patternKey].variations.push({
                        original_rhythm: rhythmPattern,
                        modified_rhythm: candidateRhythms,
                        rhythm_ratio: rhythmRatio,
                        modification_type: rhythmRatio > 1 ? 'augmentation' : 'diminution'
                    });
                }
            }
        }
    }

    return patterns;
}

// Example: Same pitches ["D4", "G4", "A4"]
// Original rhythm: [480, 240, 240]
// Augmented: [960, 480, 480] (2x longer)
```

### **8. RETROGRADE PATTERNS** (Reversed Sequences)
```javascript
function findRetrogradePatterns(sequence, patternLength) {
    const patterns = {};

    for (let i = 0; i <= sequence.length - patternLength; i++) {
        const pattern = sequence.slice(i, i + patternLength);
        const reversed = [...pattern].reverse();

        // Look for reversed pattern elsewhere
        for (let j = 0; j <= sequence.length - patternLength; j++) {
            if (i === j) continue;

            const candidate = sequence.slice(j, j + patternLength);

            if (arraysEqual(candidate, reversed)) {
                const patternKey = `retrograde_${pattern.join('-')}`;

                if (!patterns[patternKey]) {
                    patterns[patternKey] = {
                        original: pattern,
                        retrograde: reversed,
                        occurrences: []
                    };
                }

                patterns[patternKey].occurrences.push({
                    original_position: i,
                    retrograde_position: j
                });
            }
        }
    }

    return patterns;
}

// Example: ["D4", "G4", "A4"] original
// Retrograde: ["A4", "G4", "D4"]
```

### **9. MOTIVIC DEVELOPMENT PATTERNS** (Compositional Techniques)
```javascript
function findMotivicDevelopment(melody, baseMotifLength = 3) {
    const developments = {};

    for (let i = 0; i <= melody.length - baseMotifLength; i++) {
        const motif = melody.slice(i, i + baseMotifLength);
        const motifKey = `motif_${i}`;

        developments[motifKey] = {
            original_motif: motif,
            developments: {
                exact_repetitions: findExactRepetitions(motif, melody),
                transpositions: findTranspositions(motif, melody),
                inversions: findInversions(motif, melody),
                augmentations: findAugmentations(motif, melody),
                fragmentations: findFragmentations(motif, melody),
                sequences: findSequentialPatterns(motif, melody),
                combinations: findCombinationPatterns(motif, melody)
            }
        };
    }

    return developments;
}
```

### **10. SEQUENTIAL PATTERNS** (Progressive Transposition)
```javascript
function findSequentialPatterns(sequence, patternLength) {
    const sequences = [];

    for (let i = 0; i <= sequence.length - (patternLength * 2); i++) {
        const firstSegment = sequence.slice(i, i + patternLength);
        const secondSegment = sequence.slice(i + patternLength, i + patternLength * 2);

        const firstIntervals = calculateIntervalPattern(firstSegment);
        const secondIntervals = calculateIntervalPattern(secondSegment);

        if (arraysEqual(firstIntervals, secondIntervals)) {
            const transpositionInterval = calculateTranspositionInterval(firstSegment, secondSegment);

            sequences.push({
                base_pattern: firstSegment,
                transposed_pattern: secondSegment,
                interval_pattern: firstIntervals,
                transposition_interval: transpositionInterval,
                sequence_type: classifySequenceType(transpositionInterval)
            });
        }
    }

    return sequences;
}

function classifySequenceType(interval) {
    const intervalMap = {
        1: 'chromatic_sequence',
        2: 'whole_tone_sequence',
        3: 'minor_third_sequence',
        4: 'major_third_sequence',
        5: 'fourth_sequence',
        7: 'fifth_sequence'
    };

    return intervalMap[Math.abs(interval)] || 'irregular_sequence';
}
```

### **11. CROSS-DIMENSIONAL PATTERNS** (Across Pitch, Rhythm, Lyrics)
```javascript
function findCrossDimensionalPatterns(melody) {
    return {
        // Pitch-Rhythm combined patterns
        melodic_rhythm_motifs: findMelodicRhythmMotifs(melody),

        // Pitch-Lyric combined patterns
        pitch_syllable_motifs: findPitchSyllableMotifs(melody),

        // Rhythm-Lyric combined patterns
        rhythm_syllable_motifs: findRhythmSyllableMotifs(melody),

        // Triple combined patterns
        pitch_rhythm_lyric_motifs: findTripleCombinedMotifs(melody),

        // Tone-musical combined patterns
        tone_pitch_rhythm_motifs: findTonePitchRhythmMotifs(melody)
    };
}

function findMelodicRhythmMotifs(melody) {
    const motifs = {};

    for (let length = 2; length <= 4; length++) {
        for (let i = 0; i <= melody.length - length; i++) {
            const segment = melody.slice(i, i + length);
            const pitchPattern = segment.map(note => note.pitch);
            const rhythmPattern = segment.map(note => note.duration);

            const motifKey = `${pitchPattern.join('-')}_${rhythmPattern.join('-')}`;

            if (!motifs[motifKey]) {
                motifs[motifKey] = {
                    pitch_pattern: pitchPattern,
                    rhythm_pattern: rhythmPattern,
                    occurrences: []
                };
            }

            motifs[motifKey].occurrences.push(i);
        }
    }

    return Object.values(motifs).filter(m => m.occurrences.length > 1);
}
```

### **12. STATISTICAL PATTERN SIGNIFICANCE**
```javascript
function calculatePatternSignificance(patterns, totalSequenceLength) {
    return patterns.map(pattern => ({
        ...pattern,

        // Frequency-based metrics
        frequency_percentage: (pattern.frequency / totalSequenceLength * 100).toFixed(1),
        coverage_percentage: (pattern.frequency * pattern.pattern.length / totalSequenceLength * 100).toFixed(1),

        // Statistical significance
        expected_frequency: calculateExpectedFrequency(pattern.pattern, totalSequenceLength),
        significance_score: calculateSignificanceScore(pattern.frequency, pattern.expected_frequency),

        // Pattern quality metrics
        pattern_length_score: pattern.pattern.length,
        distribution_evenness: calculateDistributionEvenness(pattern.occurrences),
        pattern_complexity: calculatePatternComplexity(pattern.pattern)
    }));
}

function calculateExpectedFrequency(pattern, totalLength) {
    // Statistical expectation for random occurrence
    const patternLength = pattern.length;
    const uniqueElements = new Set(pattern).size;
    const probability = Math.pow(1 / uniqueElements, patternLength);
    return (totalLength - patternLength + 1) * probability;
}
```

---

## 🎵 COMPLETE PATTERN ANALYSIS SUITE

### **PATTERN TYPES TO IMPLEMENT:**

1. **Exact Patterns** - Perfect repetitions
2. **Substitution Patterns** - 1-2 elements different
3. **Insertion Patterns** - Extra elements added
4. **Deletion Patterns** - Elements removed
5. **Transposition Patterns** - Same intervals, different pitches
6. **Inversion Patterns** - Intervals flipped upside down
7. **Retrograde Patterns** - Sequences reversed
8. **Augmentation/Diminution** - Same pitches, different rhythms
9. **Sequential Patterns** - Progressive transposition
10. **Motivic Development** - Compositional transformation techniques
11. **Cross-Dimensional Patterns** - Pitch+rhythm+lyric combinations
12. **Fuzzy Patterns** - Approximate matches with similarity scoring

### **PHRASE POSITION METHODS:**

1. **Proportional Division** - Fixed percentages (25%-50%-25%)
2. **Linguistic Boundary Detection** - Vietnamese phrase markers
3. **Musical Phrase Detection** - Rest positions, cadences
4. **Semantic Segmentation** - Meaning-based boundaries
5. **Hybrid Approach** - Combine linguistic + musical cues

---

## ✅ RECOMMENDATION

**For V4 Implementation, I suggest starting with:**

**PHRASE POSITIONS:**
- **Method 2** (Percentage-based): 25% beginning, 50% middle, 25% ending
- **Method 3** (Linguistic boundaries): Vietnamese phrase completion markers

**PATTERN ANALYSIS:**
- **Level 1**: Exact patterns, substitution patterns, transposition patterns
- **Level 2**: Insertion/deletion patterns, sequential patterns
- **Level 3**: Cross-dimensional patterns, motivic development

This provides a solid foundation that can be expanded based on what patterns prove most musically meaningful in your Vietnamese traditional music collection.

**Ready to implement whichever approach you prefer!**