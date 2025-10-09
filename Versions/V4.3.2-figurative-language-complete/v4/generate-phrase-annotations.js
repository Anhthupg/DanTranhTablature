// v4/generate-phrase-annotations.js
// Generates synchronized phrase annotation SVG aligned with tablature notes

const fs = require('fs');
const path = require('path');

class PhraseAnnotationsGenerator {
    constructor() {
        // Semantic domain definitions
        this.domains = {
            characters: ['bà', 'chồng', 'cô', 'tôi', 'em', 'chàng', 'con', 'mẹ', 'ông'],
            emotions: ['khổ', 'thương', 'tang', 'tình', 'nhớ'],
            actions: ['đi', 'làm', 'gánh', 'tưới', 'ru', 'ngủ', 'thấy', 'nối'],
            nature: ['chiều', 'gió', 'cây', 'nước', 'đồng', 'lầu', 'mùa'],
            abstract: ['duyên', 'đời', 'lòng'],
            vocatives: ['ơi', 'hỡi', 'ới', 'ư', 'này', 'ha']
        };

        // Icon mapping for semantic domains
        this.iconMap = {
            characters: '👤',
            emotions: '😢',
            actions: '🗣️',
            nature: '🌳',
            abstract: '💭',
            vocatives: '📣'
        };

        this.labelMap = {
            characters: 'characters',
            emotions: 'emotion',
            actions: 'action',
            nature: 'nature',
            abstract: 'abstract',
            vocatives: 'vocative'
        };
    }

    /**
     * Main generation method
     */
    generate(songName) {
        console.log(`\n=== Generating Phrase Annotations for ${songName} ===`);

        // Load data sources
        const lyricsPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${songName}.json`);
        const relationshipsPath = path.join(__dirname, 'data', 'relationships', `${songName}-relationships.json`);

        if (!fs.existsSync(lyricsPath)) {
            console.error(`Lyrics segmentation not found: ${lyricsPath}`);
            return null;
        }

        if (!fs.existsSync(relationshipsPath)) {
            console.error(`Relationships not found: ${relationshipsPath}`);
            return null;
        }

        const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));
        const relationshipsData = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

        console.log(`Loaded ${lyricsData.phrases.length} phrases`);
        console.log(`Loaded ${relationshipsData.wordToNoteMap.length} note-lyric relationships`);
        console.log(`Loaded ${relationshipsData.notes.length} notes with positions`);

        // Calculate phrase positions from note coordinates
        const phrasePositions = this.calculatePhrasePositions(
            lyricsData.phrases,
            relationshipsData.wordToNoteMap,
            relationshipsData.notes
        );

        // Analyze structure (parallelism + semantics)
        const analysis = this.analyzeStructure(lyricsData.phrases);

        // Build phrase objects for rendering
        const annotatedPhrases = lyricsData.phrases.map((phrase, idx) => {
            const position = phrasePositions[idx];

            if (!position) {
                console.warn(`No position data for phrase ${phrase.id}`);
                return null;
            }

            const parallelism = this.getParallelismLevel(phrase, analysis);
            const semantics = this.getSemanticClusters(phrase);
            const functionLabel = this.getFunctionLabel(phrase, idx, lyricsData.phrases.length);

            return {
                id: phrase.id,
                text: phrase.text,
                position: position,
                parallelismClass: parallelism.class,
                parallelismBadge: parallelism.badge,
                dominantDomainClass: `domain-${semantics.dominantDomain}`,
                semanticIcons: semantics.icons,
                functionLabel: functionLabel,
                hoverText: this.generateHoverText(phrase, parallelism, semantics, functionLabel)
            };
        }).filter(p => p !== null);

        const svgWidth = Math.max(...phrasePositions.filter(p => p).map(p => p.endX)) + 200;

        console.log(`Generated ${annotatedPhrases.length} annotated phrases`);
        console.log(`SVG width: ${svgWidth}px`);

        return {
            phrases: annotatedPhrases,
            svgWidth: svgWidth,
            analysis: analysis // Return for potential use in Track 1
        };
    }

    /**
     * Calculate phrase start/end X positions from note relationships
     */
    calculatePhrasePositions(phrases, relationships, allNotes) {
        // Create note lookup map by ID
        const noteMap = {};
        allNotes.forEach(note => {
            noteMap[note.id] = note;
        });

        return phrases.map(phrase => {
            // Get all note mappings for this phrase
            const phraseMappings = relationships.filter(r => r.phraseId === phrase.id);

            if (phraseMappings.length === 0) {
                console.warn(`No note mappings for phrase ${phrase.id}`);
                return null;
            }

            // Get first note's X position (use mainNoteId for consistent positioning)
            const firstNoteId = phraseMappings[0].mainNoteId;
            const firstNote = noteMap[firstNoteId];

            if (!firstNote) {
                console.warn(`First note not found: ${firstNoteId} for phrase ${phrase.id}`);
                return null;
            }

            // Get last note's X position
            const lastMapping = phraseMappings[phraseMappings.length - 1];
            const lastNoteId = lastMapping.mainNoteId;
            const lastNote = noteMap[lastNoteId];

            if (!lastNote) {
                console.warn(`Last note not found: ${lastNoteId} for phrase ${phrase.id}`);
                return null;
            }

            // Notes in relationshipsData.notes have x and y positions from server generation
            const startX = firstNote.x || 150; // Fallback to default start
            const endX = lastNote.x || startX + 100; // Fallback

            return {
                phraseId: phrase.id,
                startX: startX,
                endX: endX,
                width: endX - startX,
                centerX: (startX + endX) / 2
            };
        }).filter(p => p !== null);
    }

    /**
     * Analyze structure: detect parallelism and semantic patterns
     */
    analyzeStructure(phrases) {
        const exactRefrains = this.detectExactRefrains(phrases);
        const structuralParallels = this.detectStructuralParallels(phrases);
        const semanticParallels = this.detectSemanticParallels(phrases);
        const sections = this.detectSections(phrases, exactRefrains);

        return {
            exactRefrains,
            structuralParallels,
            semanticParallels,
            sections  // V4.2.7: Section-level groupings
        };
    }

    /**
     * Detect section-level structures (verses, refrains, intro, coda)
     * V4.2.7: Macro-structure detection
     */
    detectSections(phrases, exactRefrains) {
        // Reset section counters for each song
        this.sectionCounters = {
            verse: 0,
            refrain: 0,
            dialogue: 0
        };

        const sections = [];
        let currentSection = null;
        let sectionStartIdx = 0;

        // Build a map of which phrases are refrains
        const refrainPhraseIds = new Set();
        exactRefrains.forEach(refrain => {
            refrain.phraseIds.forEach(id => refrainPhraseIds.add(id));
        });

        phrases.forEach((phrase, idx) => {
            const isRefrain = refrainPhraseIds.has(phrase.id);
            const sectionType = this.determineSectionType(phrase, isRefrain, idx, phrases.length);

            // Start new section if type changes
            if (!currentSection || currentSection.type !== sectionType) {
                // Close previous section
                if (currentSection) {
                    currentSection.endPhraseId = phrases[idx - 1].id;
                    currentSection.phraseCount = idx - sectionStartIdx;
                    sections.push(currentSection);
                }

                // Start new section
                currentSection = {
                    id: sections.length + 1,
                    type: sectionType,
                    label: this.getSectionLabel(sectionType, sections.length + 1),
                    startPhraseId: phrase.id,
                    startIdx: idx,
                    phraseIds: [phrase.id]
                };
                sectionStartIdx = idx;
            } else {
                // Continue current section
                currentSection.phraseIds.push(phrase.id);
            }
        });

        // Close final section
        if (currentSection) {
            currentSection.endPhraseId = phrases[phrases.length - 1].id;
            currentSection.phraseCount = phrases.length - sectionStartIdx;
            sections.push(currentSection);
        }

        return sections;
    }

    /**
     * Determine section type based on phrase characteristics
     */
    determineSectionType(phrase, isRefrain, index, totalPhrases) {
        // Intro: First phrases before any refrain
        if (index === 0) return 'intro';

        // Coda: Last phrase if it's unique
        if (index === totalPhrases - 1 && !isRefrain) return 'coda';

        // Refrain block
        if (isRefrain || phrase.type?.includes('refrain') || phrase.linguisticType === 'exclamatory') {
            return 'refrain';
        }

        // Question-answer dialogue
        if (phrase.linguisticType === 'question' || phrase.linguisticType === 'answer') {
            return 'dialogue';
        }

        // Complaint/narrative verse
        if (phrase.linguisticType === 'complaint' || phrase.type?.includes('complaint')) {
            return 'verse';
        }

        // Default: narrative verse
        return 'verse';
    }

    /**
     * Get human-readable section label
     */
    getSectionLabel(sectionType, sectionNumber) {
        // Track section type counters separately
        if (!this.sectionCounters) {
            this.sectionCounters = {
                verse: 0,
                refrain: 0,
                dialogue: 0
            };
        }

        const labels = {
            'intro': 'Intro',
            'verse': () => `Verse ${++this.sectionCounters.verse}`,
            'refrain': () => `Refrain ${++this.sectionCounters.refrain}`,
            'dialogue': () => `Dialogue ${++this.sectionCounters.dialogue}`,
            'coda': 'Coda'
        };

        const label = labels[sectionType];
        return typeof label === 'function' ? label() : (label || `Section ${sectionNumber}`);
    }

    /**
     * Level 1: Exact repetition detection
     */
    detectExactRefrains(phrases) {
        const textGroups = {};

        phrases.forEach(p => {
            // Normalize: lowercase + remove punctuation for matching
            const normalized = p.text.trim().toLowerCase().replace(/[,\.!?;:]/g, '');
            if (!textGroups[normalized]) textGroups[normalized] = [];
            textGroups[normalized].push(p.id);
        });

        return Object.entries(textGroups)
            .filter(([text, ids]) => ids.length > 1)
            .map(([text, ids]) => ({
                text: text,
                phraseIds: ids,
                count: ids.length
            }));
    }

    /**
     * Level 2: Structural parallelism (same pattern, different words)
     */
    detectStructuralParallels(phrases) {
        const patternGroups = {};

        phrases.forEach(p => {
            const pattern = this.extractPattern(p.wordMapping);
            if (!patternGroups[pattern]) patternGroups[pattern] = [];
            patternGroups[pattern].push(p.id);
        });

        return Object.entries(patternGroups)
            .filter(([pattern, ids]) => ids.length > 1)
            .map(([pattern, ids]) => ({
                pattern: pattern,
                phraseIds: ids,
                count: ids.length
            }));
    }

    /**
     * Extract grammatical pattern from word mapping
     */
    extractPattern(wordMapping) {
        return wordMapping.map(w => {
            const en = w.en.toLowerCase();

            if (['oh', 'o (vocative)', 'hey', '(exclamation)'].includes(en)) return 'EXCL';
            if (['mrs.', 'mr.', 'miss/aunt'].includes(en)) return 'TITLE';
            if (w.vn.match(/^[A-Z]/)) return 'NAME';
            if (['go', 'carry', 'water', 'see', 'do/make', 'sleep'].includes(en)) return 'VERB';
            if (['who', 'what', 'where'].includes(en)) return 'Q-WORD';
            if (['is/be', 'that/which'].includes(en)) return 'COPULA';

            return 'OTHER';
        }).join('-');
    }

    /**
     * Level 3: Semantic parallelism (same themes)
     */
    detectSemanticParallels(phrases) {
        const semanticGroups = {};

        phrases.forEach(p => {
            const themes = this.extractThemes(p.wordMapping);
            themes.forEach(theme => {
                if (!semanticGroups[theme]) semanticGroups[theme] = [];
                semanticGroups[theme].push(p.id);
            });
        });

        return semanticGroups;
    }

    /**
     * Extract semantic themes from word mapping
     */
    extractThemes(wordMapping) {
        const themes = new Set();

        wordMapping.forEach(w => {
            const vn = w.vn.toLowerCase();

            Object.entries(this.domains).forEach(([domain, keywords]) => {
                if (keywords.includes(vn)) {
                    themes.add(domain);
                }
            });
        });

        return Array.from(themes);
    }

    /**
     * Determine parallelism level for a phrase
     */
    getParallelismLevel(phrase, analysis) {
        // Check if exact refrain
        const exactRefrain = analysis.exactRefrains.find(r =>
            r.phraseIds.includes(phrase.id)
        );

        if (exactRefrain) {
            const index = exactRefrain.phraseIds.indexOf(phrase.id) + 1;
            return {
                class: 'exact-refrain',
                badge: {
                    text: `REFRAIN (${index}/${exactRefrain.count})`,
                    badgeClass: 'exact'
                }
            };
        }

        // Check if structural parallel
        const pattern = this.extractPattern(phrase.wordMapping);
        const structuralMatch = analysis.structuralParallels.find(p =>
            p.pattern === pattern && p.count > 1
        );

        if (structuralMatch && structuralMatch.phraseIds.length > 1) {
            return {
                class: 'structural-parallel',
                badge: {
                    text: 'STRUCTURAL',
                    badgeClass: 'structural'
                }
            };
        }

        return {
            class: '',
            badge: null
        };
    }

    /**
     * Get semantic clusters for a phrase
     */
    getSemanticClusters(phrase) {
        const clusters = {};

        phrase.wordMapping.forEach(word => {
            const vn = word.vn.toLowerCase();

            Object.entries(this.domains).forEach(([domain, keywords]) => {
                if (keywords.includes(vn)) {
                    if (!clusters[domain]) clusters[domain] = [];
                    clusters[domain].push(word.vn);
                }
            });
        });

        const icons = Object.entries(clusters).map(([domain, words], idx) => ({
            icon: this.iconMap[domain],
            label: this.labelMap[domain],
            iconClass: domain,
            yOffset: idx * 20
        }));

        const dominantDomain = Object.entries(clusters)
            .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'other';

        return {
            icons: icons,
            dominantDomain: dominantDomain,
            allClusters: clusters
        };
    }

    /**
     * Determine functional role of phrase in song structure
     */
    getFunctionLabel(phrase, index, totalPhrases) {
        if (index === 0) return { text: 'OPENING' };
        if (index === totalPhrases - 1) return { text: 'CLOSING' };
        if (phrase.linguisticType === 'question') return { text: 'QUESTION' };
        if (phrase.linguisticType === 'answer') return { text: 'ANSWER' };
        if (phrase.linguisticType === 'exclamatory') return { text: 'EXCLAMATION' };
        if (phrase.type?.includes('refrain')) return { text: 'ANCHOR' };
        if (phrase.linguisticType === 'complaint') return { text: 'COMPLAINT' };
        return null;
    }

    /**
     * Generate hover tooltip text
     */
    generateHoverText(phrase, parallelism, semantics, functionLabel) {
        let text = `Phrase ${phrase.id}: "${phrase.text}"\n`;
        text += `Translation: ${phrase.english}\n`;

        if (parallelism.badge) {
            text += `Parallelism: ${parallelism.badge.text}\n`;
        }

        if (semantics.icons.length > 0) {
            const domains = semantics.icons.map(i => i.label).join(', ');
            text += `Semantic domains: ${domains}\n`;
        }

        if (functionLabel) {
            text += `Function: ${functionLabel.text}\n`;
        }

        return text;
    }
}

module.exports = PhraseAnnotationsGenerator;
