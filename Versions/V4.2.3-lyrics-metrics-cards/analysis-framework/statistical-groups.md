# Dan Tranh Tablature - Statistical Analysis Framework

## 13 Statistical Groups (450+ Metrics Total)

### A. Basic Musical (7 metrics)
- Total note count
- Unique pitch count
- Duration range (shortest to longest)
- Tempo (BPM)
- Time signature
- Total duration (seconds)
- String usage count
**Status**: 🟡 Pending

### B. Pitch Contour - No Rhythm (18+ metrics)
- Ascending intervals distribution
- Descending intervals distribution
- Leap frequency (>3rd)
- Step frequency (2nd)
- Contour complexity index
- Peak pitch frequency
- Valley pitch frequency
- Pitch range (lowest to highest)
- Most common pitch
- Pitch entropy
- Melodic arch patterns
- Zigzag patterns
- Plateau patterns
- Chromatic passages
- Pentatonic adherence
- Modal characteristics
- Pitch class distribution
- Octave distribution
**Status**: 🟡 Pending

### C. Duration/Rhythm - No Pitch (19+ metrics)
- Note duration distribution
- Rest duration distribution
- Syncopation index
- Rhythmic density
- Beat subdivision usage
- Dotted rhythm frequency
- Triplet frequency
- Acceleration patterns
- Deceleration patterns
- Rhythmic motif count
- Isorhythm detection
- Polyrhythm presence
- Cross-rhythm patterns
- Hemiola occurrences
- Metric modulation
- Tempo rubato index
- Rhythmic entropy
- Groove consistency
- Swing factor
**Status**: 🟡 Pending

### D. Melody Interplay - Pitch+Rhythm (25+ metrics)
- Melodic rhythm correlation
- High pitch with short duration frequency
- Low pitch with long duration frequency
- Pitch acceleration (rising + speeding)
- Pitch deceleration (falling + slowing)
- Melodic climax timing
- Phrase peak alignment
- Cadential patterns
- Motivic development index
- Sequence detection
- Melodic inversion patterns
- Retrograde patterns
- Augmentation patterns
- Diminution patterns
- Fragmentation index
- Melodic density changes
- Call-response patterns
- Question-answer phrases
- Melodic tension curves
- Resolution patterns
- Suspension frequency
- Anticipation notes
- Passing tone density
- Neighbor tone usage
- Appoggiatura frequency
**Status**: 🟡 Pending

### E. Vietnamese Linguistic (25+ metrics)
- Total syllable count
- Unique word count
- Tone mark distribution (6 tones)
- Syllable-per-note ratio
- Word length distribution
- Verse structure
- Rhyme scheme detection
- Alliteration frequency
- Assonance patterns
- Consonance patterns
- Poetic meter (lục bát, song thất lục bát)
- Line length consistency
- Stanza patterns
- Refrain detection
- Vocative usage ("ơi", "à")
- Particle frequency
- Reduplication patterns
- Compound word usage
- Sino-Vietnamese vs native ratio
- Regional dialect markers
- Formal vs colloquial register
- Emotional word frequency
- Nature imagery frequency
- Cultural reference density
- Pronoun usage patterns
**Status**: 🟡 Pending

### F. Word-Musical Correlations (45+ metrics)
- Syllable stress to beat alignment
- Word boundary to phrase alignment
- Semantic emphasis pitch correlation
- Question words to rising pitch
- Statement words to falling pitch
- Emotional words to ornament correlation
- Action verbs to rhythmic density
- Descriptive adjectives to sustained notes
- Proper nouns to pitch emphasis
- Repeated words to melodic motifs
- Rhyme to cadence alignment
- Line ending to phrase ending sync
- Caesura to rest correlation
- Enjambment to slur correlation
- Vowel length to note duration
- Consonant clusters to articulation
- Open syllables to legato
- Closed syllables to staccato
- Diphthongs to pitch bends
- Tone contour to melodic contour
- High tone to high pitch correlation
- Low tone to low pitch correlation
- Rising tone to ascending melody
- Falling tone to descending melody
- Dipping tone to melodic turn
- Level tone to repeated pitch
- Tone change to interval size
- Word emphasis to dynamic accent
- Particle to grace note correlation
- Interjection to ornament density
- Vocative to pitch peak
- Compound word to phrase unity
- Parallelism to sequence correlation
- Antithesis to contrary motion
- Metaphor to melodic painting
- Onomatopoeia to rhythmic mimicry
- Repetition to ostinato
- Question to suspension
- Answer to resolution
- Narrative to recitative style
- Dialogue to call-response
- Description to melismatic style
- Exclamation to accent
- Enumeration to sequential patterns
- Comparison to parallel intervals
**Status**: 🟡 Pending

### G. Tone-Musical Correlations (50+ metrics)
[Detailed Vietnamese tone to musical parameter mappings]
- Ngang (level) tone correlations
- Huyền (falling) tone correlations
- Sắc (rising) tone correlations
- Nặng (drop) tone correlations
- Hỏi (dipping) tone correlations
- Ngã (rising glottalized) tone correlations
- Tone contour to pitch contour matching
- Tone duration to note duration
- Tone transition to interval type
- Multi-syllable tone patterns
- Tone sandhi musical representation
- Northern vs Southern tone realization
- [... continues with 38 more specific metrics]
**Status**: 🟡 Pending

### H. Phrase Position Correlations (50+ metrics)
- Beginning phrase characteristics
- Middle phrase characteristics
- Ending phrase characteristics
- Anacrusis patterns
- Pickup note frequency
- Phrase length distribution
- Phrase overlap frequency
- Elision patterns
- Phrase extension techniques
- Phrase compression techniques
- Antecedent-consequent balance
- Period structure analysis
- Sentence structure analysis
- Phrase rhythm patterns
- Phrase contour types
- Opening gesture types
- Closing gesture types
- Transitional passages
- Bridge characteristics
- Climax positioning
- [... continues with 30 more metrics]
**Status**: 🟡 Pending

### I. Melisma & Grace Analysis (50+ metrics)
- Melisma frequency per phrase
- Melisma length distribution
- Grace note density
- Grace note to main note ratio
- Ornament type distribution
- Trill frequency
- Turn frequency
- Mordent frequency
- Appoggiatura vs acciaccatura ratio
- Slide/portamento frequency
- Vibrato indication
- Bent note frequency
- Pre-bend vs release bend
- Multi-grace clusters
- Ornament chains
- Syllable to melisma correlation
- Word importance to ornament density
- Emotional content to decoration
- Regional ornament preferences
- Traditional vs modern ornament usage
- [... continues with 30 more metrics]
**Status**: 🟡 Pending

### J. Cultural & Contextual (30+ metrics)
- Regional style markers
- Northern pentatonic adherence
- Southern modal inflections
- Central hybrid characteristics
- Highland ethnic influences
- Court music (nhã nhạc) elements
- Folk music (dân ca) elements
- Ceremonial music markers
- Festival music characteristics
- Love song conventions
- Work song patterns
- Lullaby characteristics
- Historical period indicators
- Modern fusion elements
- Chinese influence markers
- Cham influence markers
- Khmer influence markers
- Western influence markers
- Improvisation indicators
- Call-and-response patterns
- Audience participation cues
- Seasonal references
- Geographic references
- Instrument-specific idioms
- Vocal imitation patterns
- Gender-specific patterns
- Age-specific patterns
- Social class indicators
- Religious/spiritual elements
- Narrative structure types
**Status**: 🟡 Pending

### K. Tuning & Technical (35+ metrics)
- Tuning system detection
- Pentatonic scale adherence
- Diatonic intrusions
- Microtonal inflections
- String crossing frequency
- Hand position changes
- Fingering complexity
- Plucking pattern variety
- Tremolo usage
- Glissando frequency
- Harmonic usage
- Open string usage
- Stopped string ratio
- Bending technique frequency
- Vibrato technique analysis
- Double stop frequency
- Chord usage (if any)
- Pedal tone usage
- Drone characteristics
- Register distribution
- Tessitura analysis
- String tension implications
- Physical difficulty rating
- Hand span requirements
- Coordination complexity
- Velocity requirements
- Endurance demands
- Memory load estimation
- Reading difficulty
- Interpretive ambiguity
- Performance duration
- Practice time estimation
- Technical étude potential
- Concert suitability
- Teaching sequence position
**Status**: 🟡 Pending

### L. Comparative Analysis (40+ metrics)
- Similarity to other songs in collection
- Shared motif inventory
- Common progression patterns
- Rhythmic template matching
- Structural archetype classification
- Generational evolution tracking
- Regional variation mapping
- Performer style detection
- Arrangement complexity comparison
- Version history analysis
- Transcription accuracy metrics
- Source reliability indicators
- Performance tradition adherence
- Innovation index
- Traditionalism score
- Fusion element percentage
- Cross-cultural borrowing
- Influence network position
- Popularity correlation factors
- Learning curve comparison
- Pedagogical value rating
- Repertoire essentiality score
- Cultural significance weight
- Historical importance factor
- Aesthetic unity measure
- Emotional impact rating
- Memorability score
- Distinctiveness index
- Recognizability factor
- Variation potential
- Improvisation friendliness
- Ensemble adaptability
- Solo performance suitability
- Competition piece potential
- Recording frequency
- Citation frequency
- Teaching frequency
- Performance frequency
- Preservation priority
- Documentation completeness
**Status**: 🟡 Pending

### M. Advanced Mathematical (50+ metrics)
- Fractal dimension of melody
- Self-similarity index
- Information entropy
- Compression ratio
- Markov chain predictability
- N-gram frequency distributions
- Fourier transform peaks
- Wavelet analysis coefficients
- Autocorrelation functions
- Cross-correlation with corpus
- Spectral centroid trajectory
- Zipf's law compliance
- Benford's law analysis
- Golden ratio presence
- Fibonacci sequence detection
- Prime number relationships
- Symmetry operations count
- Topology of phrase space
- Graph theory metrics
- Network analysis measures
- Clustering coefficients
- Modularity index
- Centrality measures
- Distance matrices
- Similarity matrices
- Dissimilarity indices
- Euclidean distances
- Manhattan distances
- Cosine similarity scores
- Jaccard indices
- Levenshtein distances
- Dynamic time warping
- Hidden Markov models
- Neural network features
- Machine learning features
- Principal components
- Factor loadings
- Canonical correlations
- Regression coefficients
- Classification accuracy
- Prediction confidence
- Anomaly detection scores
- Outlier indices
- Novelty measures
- Surprise factors
- Expectation violations
- Cognitive load estimates
- Perceptual complexity
- Aesthetic measures
- Beauty indices
**Status**: 🟡 Pending

## Implementation Priority

### Phase 1 - Essential Metrics
- Group A: Basic Musical
- Group B: Pitch Contour (core metrics)
- Group C: Duration/Rhythm (core metrics)

### Phase 2 - Cultural Context
- Group E: Vietnamese Linguistic
- Group F: Word-Musical Correlations
- Group J: Cultural & Contextual

### Phase 3 - Advanced Analysis
- Group D: Melody Interplay
- Group G: Tone-Musical Correlations
- Group H: Phrase Position Correlations

### Phase 4 - Specialized Studies
- Group I: Melisma & Grace Analysis
- Group K: Tuning & Technical
- Group L: Comparative Analysis

### Phase 5 - Research Features
- Group M: Advanced Mathematical

## Notes
- Each metric will include statistical measures: mean, median, mode, standard deviation, range
- Metrics can be filtered by song region, time period, or other metadata
- Results exportable in JSON, CSV, and visualization formats
- Real-time calculation for individual songs, batch processing for collections