/**
 * Automatic Cultural Context Generator
 * Processes all lyrics files and adds cultural context using built-in knowledge
 */

const fs = require('fs');
const path = require('path');

class AutoCulturalGenerator {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.backupDir = path.join(__dirname, 'data', 'lyrics-segmentations-backup');

        // Create backup directory
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        // Vietnamese cultural knowledge base
        this.culturalPatterns = {
            // Address terms
            'Bà': 'respectful address for married women, regardless of age in folk songs',
            'Ông': 'respectful address for married men',
            'Em': 'younger person or term of endearment',
            'Anh': 'older brother or romantic male partner',
            'Con': 'child, or humble self-reference',

            // Family/Social
            'chồng': 'husband - central figure in many complaint songs about marriage difficulties',
            'vợ': 'wife - often portrayed as suffering or patient',
            'mẹ': 'mother - revered figure in Vietnamese culture',
            'cha': 'father - authority figure',

            // Nature imagery
            'trăng': 'moon - symbol of beauty, longing, passage of time',
            'sông': 'river - represents life journey, separation',
            'chiều': 'evening - time of reflection and melancholy',
            'hoa': 'flower - beauty, youth, transience',
            'cò': 'egret/heron - grace, solitude',
            'đò': 'ferry - crossing, journey, transition',

            // Emotions/States
            'khổ': 'suffering/misery - common theme in folk songs',
            'thương': 'love/pity - complex emotion combining affection and compassion',
            'nhớ': 'longing/missing - separation theme',
            'buồn': 'sadness - often related to separation or hardship',

            // Activities
            'hò': 'work song - sung while laboring (rowing, farming, etc.)',
            'ru': 'lullaby - mothers singing to children',
            'lý': 'genre of Northern folk song',
            'quan họ': 'Bắc Ninh love exchange songs',

            // Concepts
            'duyên': 'fate/destiny in relationships - Buddhist concept',
            'đời': 'life/existence - often with suffering connotation',
            'tơ hồng': 'red thread of fate - Chinese/Vietnamese concept of destined relationships'
        };

        // Song genre patterns
        this.genrePatterns = {
            'Hò': {
                description: 'Work songs from Central and Southern Vietnam, sung during communal labor',
                facts: [
                    'Hò songs helped coordinate physical labor like rowing boats or pounding rice',
                    'Often featured call-and-response between workers to maintain rhythm',
                    'Different regions have distinct hò styles (hò mái, hò giã gạo, etc.)',
                    'The repetitive nature helped workers endure long hours of physical labor'
                ],
                musicalContext: 'Strong rhythmic foundation matching physical work movements'
            },
            'Lý': {
                description: 'Northern Vietnamese folk song genre, highly melodic and expressive',
                facts: [
                    'Lý songs originated in Red River Delta region',
                    'Often about love, nature, and daily life',
                    'Characterized by free rhythm and ornamented melodies',
                    'Each Lý variant (chiều chiều, con sáo, etc.) has distinct melodic character'
                ],
                musicalContext: 'Focuses on melodic beauty and expressive ornamentation'
            },
            'Ru': {
                description: 'Lullabies sung by mothers across all regions of Vietnam',
                facts: [
                    'Each region has distinct lullaby styles with local characteristics',
                    'Often express mothers\' hopes, worries, and love for children',
                    'Gentle, rocking rhythms mirror the motion of cradling',
                    'May include wishes for child\'s future or warnings about life\'s hardships'
                ],
                musicalContext: 'Soft, repetitive melodies with gentle rocking rhythm'
            },
            'Quan họ': {
                description: 'Courtship songs from Bắc Ninh province, sung alternately by men and women',
                facts: [
                    'UNESCO-recognized intangible cultural heritage since 2009',
                    'Performed during village festivals and boat outings',
                    'Features sophisticated call-and-response between male and female groups',
                    'Often includes playful teasing and expressions of affection'
                ],
                musicalContext: 'Alternating verses between groups with refrain sections'
            }
        };
    }

    /**
     * Generate cultural context for a specific phrase
     */
    generatePhraseContext(phrase, songTitle, allPhrases) {
        const text = phrase.text.toLowerCase();
        const type = phrase.linguisticType;

        // Detect relevant cultural elements in the phrase
        const relevantConcepts = Object.keys(this.culturalPatterns).filter(key =>
            text.includes(key.toLowerCase())
        );

        // Detect song genre from title
        let genre = null;
        if (songTitle.includes('Hò')) genre = 'Hò';
        else if (songTitle.includes('Lý')) genre = 'Lý';
        else if (songTitle.includes('Ru')) genre = 'Ru';
        else if (songTitle.includes('quan họ')) genre = 'Quan họ';

        // Generate description
        let description = this.generateDescription(phrase, relevantConcepts, genre, type);

        // Generate facts
        let facts = this.generateFacts(phrase, relevantConcepts, genre, songTitle);

        // Generate musical context
        let musicalContext = this.generateMusicalContext(phrase, genre, type);

        return {
            description,
            facts,
            musicalContext
        };
    }

    generateDescription(phrase, concepts, genre, type) {
        const text = phrase.text;

        // Build description from detected concepts
        let parts = [];

        if (concepts.length > 0) {
            const primaryConcept = concepts[0];
            const culturalNote = this.culturalPatterns[primaryConcept];
            parts.push(`This phrase features "${primaryConcept}" - ${culturalNote}.`);
        }

        // Add linguistic type context
        if (type === 'exclamatory') {
            parts.push('The exclamatory form adds emotional emphasis, common in Vietnamese folk music to engage listeners.');
        } else if (type === 'question') {
            parts.push('The questioning form invites response or reflection, typical of call-and-response folk traditions.');
        } else if (type === 'complaint') {
            parts.push('Complaint phrases are central to Vietnamese folk songs, expressing hardships with humor and acceptance.');
        } else if (type === 'narrative') {
            parts.push('This narrative phrase advances the story, grounding the emotional content in concrete imagery.');
        }

        // Add genre context if available
        if (genre && this.genrePatterns[genre]) {
            parts.push(this.genrePatterns[genre].description.split('.')[0] + '.');
        }

        // If no specific context found, provide general
        if (parts.length === 0) {
            parts.push('This phrase is part of traditional Vietnamese folk music, expressing themes common in rural Vietnamese culture.');
            parts.push(`As a ${type} phrase, it serves to ${this.getPhraseFunction(type)}.`);
        }

        return parts.join(' ');
    }

    generateFacts(phrase, concepts, genre, songTitle) {
        let facts = [];

        // Genre-specific facts
        if (genre && this.genrePatterns[genre]) {
            facts.push(...this.genrePatterns[genre].facts.slice(0, 2));
        }

        // Concept-specific facts
        if (concepts.includes('duyên')) {
            facts.push('The concept of "duyên" (fate/destiny) comes from Buddhist philosophy and is central to Vietnamese views on relationships');
        }
        if (concepts.includes('tơ hồng')) {
            facts.push('The "red thread of fate" (tơ hồng) originates from Chinese legend - an invisible red thread connects destined lovers');
        }
        if (concepts.includes('Bà') || concepts.includes('Ông')) {
            facts.push('Vietnamese uses formal address terms even in intimate folk songs, reflecting Confucian respect culture');
        }
        if (concepts.includes('chồng')) {
            facts.push('Wife-complaining-about-husband is a humorous folk song genre expressing women\'s frustrations within traditional marriage');
        }

        // Add general Vietnamese folk music facts if we need more
        while (facts.length < 4) {
            const generalFacts = [
                'Vietnamese folk songs preserve oral traditions passed down through generations without written notation',
                'Dan Tranh (16-string zither) arrangements of folk songs are relatively modern adaptations of vocal traditions',
                'Many folk songs use nature imagery to express human emotions indirectly',
                'The pentatonic scale used in Vietnamese folk music creates a distinctively Asian sound palette',
                'Regional variations exist - Northern songs tend to be more refined, Southern more robust',
                'Folk songs often served educational and social bonding functions in villages',
                'Repetition and variation are key structural principles in Vietnamese folk music',
                'The Vietnamese tonal language influences melodic contours in folk songs'
            ];
            const unusedFact = generalFacts.find(f => !facts.includes(f));
            if (unusedFact) facts.push(unusedFact);
            else break;
        }

        return facts.slice(0, 4);
    }

    generateMusicalContext(phrase, genre, type) {
        const syllableCount = phrase.syllableCount;

        let context = `This ${type} phrase contains ${syllableCount} syllables`;

        // Add syllable count context
        if (syllableCount === 4) {
            context += ', the most common phrase length in Vietnamese folk music, creating balanced musical phrasing';
        } else if (syllableCount === 5) {
            context += ', slightly longer than the typical 4-syllable pattern, adding emphasis or conclusion';
        } else if (syllableCount === 3) {
            context += ', shorter than typical, creating rhythmic variation or truncation for effect';
        } else if (syllableCount >= 6) {
            context += ', longer than typical, allowing for extended melodic development';
        }

        context += '. ';

        // Add type-specific musical context
        if (type === 'exclamatory') {
            context += 'As an exclamatory phrase, it likely features sustained notes or ascending contours for emotional expression.';
        } else if (type === 'question') {
            context += 'Question phrases typically end with rising pitch, mirroring the Vietnamese question intonation.';
        } else if (type === 'complaint') {
            context += 'Complaint phrases often use descending melodic lines or repeated pitches to convey resignation or frustration.';
        } else if (type === 'narrative') {
            context += 'Narrative phrases typically use moderate melodic range and steady rhythm to advance the story.';
        } else if (type === 'answer') {
            context += 'Answer phrases often mirror the melodic contour of the preceding question with variation.';
        } else if (type === 'onomatopoeia') {
            context += 'Onomatopoetic phrases use repeated notes or simple patterns to imitate sounds.';
        }

        // Add genre-specific context
        if (genre && this.genrePatterns[genre]) {
            context += ' ' + this.genrePatterns[genre].musicalContext + '.';
        }

        return context;
    }

    getPhraseFunction(type) {
        const functions = {
            'exclamatory': 'express emotion and engage the listener',
            'question': 'invite response or reflection',
            'answer': 'provide resolution to preceding questions',
            'complaint': 'express hardship with humor and cultural acceptance',
            'narrative': 'advance the story with concrete imagery',
            'onomatopoeia': 'create vivid sound imagery',
            'descriptive': 'paint detailed pictures of scenes or characters'
        };
        return functions[type] || 'contribute to the song\'s narrative flow';
    }

    /**
     * Process all songs automatically
     */
    async processAll() {
        const files = fs.readdirSync(this.lyricsDir).filter(f => f.endsWith('.json'));

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Auto-Generating Cultural Context for All Songs          ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const file of files) {
            const songName = file.replace('.json', '');
            const lyricsPath = path.join(this.lyricsDir, file);

            try {
                const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

                // Check if already has cultural context
                if (lyricsData.phrases.some(p => p.culturalContext)) {
                    console.log(`⏭️  SKIP: ${songName} (already has context)`);
                    skippedCount++;
                    continue;
                }

                // Backup original file
                const backupPath = path.join(this.backupDir, file);
                fs.writeFileSync(backupPath, JSON.stringify(lyricsData, null, 2), 'utf8');

                // Add cultural context to each phrase
                lyricsData.phrases.forEach(phrase => {
                    phrase.culturalContext = this.generatePhraseContext(
                        phrase,
                        lyricsData.songTitle || songName,
                        lyricsData.phrases
                    );
                });

                // Save updated file
                fs.writeFileSync(lyricsPath, JSON.stringify(lyricsData, null, 2), 'utf8');

                processedCount++;
                const progress = Math.round((processedCount / files.length) * 100);
                console.log(`✅ [${processedCount}/${files.length}] ${progress}% - ${songName} (${lyricsData.phrases.length} phrases)`);

            } catch (error) {
                console.error(`❌ Error: ${songName} - ${error.message}`);
                errorCount++;
            }
        }

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Generation Complete!                                     ║`);
        console.log(`║  Processed: ${processedCount} songs                       `);
        console.log(`║  Skipped: ${skippedCount} songs                           `);
        console.log(`║  Errors: ${errorCount} songs                              `);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        console.log(`✅ Original files backed up to: ${this.backupDir}`);
        console.log(`✅ Updated files saved to: ${this.lyricsDir}\n`);
        console.log(`🔄 Next: Restart server to see cultural context in UI\n`);
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new AutoCulturalGenerator();
    generator.processAll().catch(console.error);
}

module.exports = AutoCulturalGenerator;
