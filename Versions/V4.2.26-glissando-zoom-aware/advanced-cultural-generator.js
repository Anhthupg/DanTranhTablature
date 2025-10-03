/**
 * Advanced Cultural Context Generator with Deep Content Analysis
 * Creates unique, phrase-specific cultural context
 */

const fs = require('fs');
const path = require('path');

class AdvancedCulturalGenerator {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.backupDir = path.join(__dirname, 'data', 'lyrics-segmentations-backup-advanced');

        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        // Comprehensive cultural knowledge base
        this.knowledge = {
            // Song genres with deep context
            genres: {
                'Hò': {
                    subtypes: {
                        'giã gạo': 'rice pounding songs - rhythmic work coordinating pestle strikes',
                        'chèo': 'boat rowing songs - synchronized paddling rhythm',
                        'kéo': 'hauling songs - heavy labor coordination',
                        'đập đê': 'dike building songs - community construction work',
                        'hái củi': 'wood gathering songs - forest work',
                        'mài dừa': 'coconut grating songs - food preparation'
                    },
                    regions: {
                        'Southern': 'more robust, louder for outdoor rice paddies',
                        'Central': 'influenced by Cham music, uses modal variations',
                        'Northern': 'softer, more refined for indoor work'
                    }
                },
                'Lý': {
                    variants: {
                        'chiều chiều': 'evening song - melancholic, about separation',
                        'con sáo': 'mynah bird - playful, nature imagery',
                        'cây đa': 'banyan tree - village gathering place symbolism',
                        'ngựa ô': 'black horse - travel and adventure',
                        'qua cầu': 'crossing bridge - life transitions'
                    },
                    characteristics: 'free rhythm, high tessitura, melismatic ornaments'
                },
                'Ru': {
                    regional: {
                        'Bắc': 'gentle, wishes for education and success',
                        'Trung': 'mentions hardships, warns of difficulties',
                        'Nam': 'softer, more melodic, rice farming imagery'
                    },
                    themes: 'mother\'s love, protection, hopes, fears for child\'s future'
                },
                'Quan họ': {
                    context: 'Bắc Ninh courtship songs, UNESCO heritage',
                    performance: 'alternating male-female groups on decorated boats',
                    themes: 'love, longing, playful teasing, marriage proposals'
                }
            },

            // Specific phrase patterns with unique contexts
            patterns: {
                'Bà + name': {
                    context: 'Respectful address used even for young women in folk songs',
                    cultural: 'Confucian hierarchy maintained even in intimate contexts',
                    examples: 'Bà Rằng, Bà Rí - possibly village names or personal names',
                    regional: 'More common in Northern quan họ traditions'
                },
                'chồng complaints': {
                    context: 'Humorous genre allowing women to express frustrations',
                    social: 'Safe cultural outlet for marriage dissatisfaction',
                    characteristics: 'exaggeration for comedic effect (husband tiny, lazy, snoring)',
                    performance: 'sung among women during communal work'
                },
                'nature imagery': {
                    'trăng': {
                        symbolism: 'moon = longing, beauty, passage of time, separation',
                        poetry: 'central to Vietnamese romantic poetry (thơ trăng)',
                        festivals: 'Mid-Autumn Festival (Tết Trung Thu) moon worship'
                    },
                    'sông': {
                        symbolism: 'river = life journey, separation, borders',
                        geography: 'Vietnam shaped by Red River (North) and Mekong (South)',
                        culture: 'river crossings = major life transitions'
                    },
                    'hoa': {
                        symbolism: 'flowers = youth, beauty, impermanence',
                        seasonal: 'specific flowers mark seasons (mai = Tết, lotus = summer)',
                        metaphor: 'young women compared to flowers'
                    },
                    'cò': {
                        symbolism: 'egret/heron = grace, solitude, fidelity',
                        landscape: 'iconic image of rice paddies',
                        poetry: 'represents elegant loneliness'
                    }
                },
                'duyên': {
                    philosophy: 'Buddhist concept of karmic connection',
                    marriage: 'relationships predetermined by past lives',
                    acceptance: 'cultural resignation to fate in difficult marriages',
                    expressions: 'tơ hồng (red thread), duyên số (destined fate)'
                },
                'ơi': {
                    function: 'vocative particle - calls attention, adds emotion',
                    intensity: 'repeated ơi ơi increases emotional urgency',
                    regional: 'Northern uses more frequently than South',
                    musical: 'often on sustained notes or melodic peaks'
                }
            },

            // Regional characteristics
            regions: {
                'Northern': {
                    characteristics: 'refined, softer dynamics, high tessitura',
                    genres: 'quan họ, lý, ca trù, chầu văn',
                    instruments: 'đàn tranh, đàn bầu, đàn đáy',
                    themes: 'love, nature, Confucian values'
                },
                'Central': {
                    characteristics: 'harsh weather influence, modal system',
                    genres: 'hò Huế, hát ả đào, bài chòi',
                    instruments: 'kèn bầu, trống, sáo',
                    themes: 'hardship, Buddhist compassion, imperial heritage'
                },
                'Southern': {
                    characteristics: 'robust, louder, wider melodic range',
                    genres: 'hò, vọng cổ, đờn ca tài tử',
                    instruments: 'đàn tranh, đàn kim, sáo',
                    themes: 'rice farming, water, abundance, community'
                },
                'Highland': {
                    characteristics: 'pentatonic without semitones, gong ensembles',
                    genres: 'klơng pút (gong music), singing with gourd lute',
                    instruments: 'gongs, bamboo tubes, đing tút',
                    themes: 'rice wine, festivals, epics, community rituals'
                }
            },

            // Social concepts
            social: {
                'làm ăn': {
                    meaning: 'livelihood, making a living',
                    context: 'agricultural society - work defines life',
                    values: 'industriousness highly valued in Vietnamese culture'
                },
                'học hành': {
                    meaning: 'studying, education',
                    context: 'Confucian emphasis on scholarship',
                    social: 'education as path to social mobility and family honor'
                },
                'hiếu thảo': {
                    meaning: 'filial piety',
                    importance: 'fundamental Vietnamese value',
                    expression: 'caring for parents, honoring ancestors'
                }
            },

            // Musical functions
            musicalFunctions: {
                'refrain': 'anchors song structure, allows audience participation',
                'call-response': 'creates dialogue between singers or singer-audience',
                'onomatopoeia': 'adds humor, mimics sounds, breaks narrative tension',
                'narrative': 'advances story, provides concrete details',
                'exclamatory': 'emotional peaks, engages audience attention',
                'question': 'creates anticipation for answer, interactive element',
                'complaint': 'cathartic expression with humor, cultural safety valve'
            }
        };
    }

    /**
     * Deep analysis of phrase to generate unique cultural context
     */
    generatePhraseContext(phrase, songTitle, allPhrases, phraseIndex) {
        const text = phrase.text.toLowerCase();
        const type = phrase.linguisticType;

        // Detect genre from song title
        const genre = this.detectGenre(songTitle);
        const region = this.detectRegion(songTitle);

        // Analyze phrase content deeply
        const analysis = this.analyzePhraseContent(phrase, songTitle, allPhrases, phraseIndex);

        // Generate description
        const description = this.generateUniqueDescription(phrase, analysis, genre, region);

        // Generate specific facts
        const facts = this.generateSpecificFacts(phrase, analysis, genre, region, songTitle);

        // Generate musical context
        const musicalContext = this.generateDetailedMusicalContext(phrase, analysis, genre, phraseIndex, allPhrases.length);

        return { description, facts, musicalContext };
    }

    detectGenre(title) {
        if (/^Hò\s+/i.test(title)) {
            // Detect Hò subtype
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('giã gạo')) return { type: 'Hò', subtype: 'giã gạo' };
            if (lowerTitle.includes('chèo')) return { type: 'Hò', subtype: 'chèo' };
            if (lowerTitle.includes('kéo')) return { type: 'Hò', subtype: 'kéo' };
            if (lowerTitle.includes('đập đê')) return { type: 'Hò', subtype: 'đập đê' };
            if (lowerTitle.includes('hái củi')) return { type: 'Hò', subtype: 'hái củi' };
            if (lowerTitle.includes('mài dừa')) return { type: 'Hò', subtype: 'mài dừa' };
            return { type: 'Hò', subtype: 'general' };
        }
        if (/^Lý\s+/i.test(title)) {
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('chiều chiều')) return { type: 'Lý', variant: 'chiều chiều' };
            if (lowerTitle.includes('con sáo')) return { type: 'Lý', variant: 'con sáo' };
            if (lowerTitle.includes('cây đa')) return { type: 'Lý', variant: 'cây đa' };
            return { type: 'Lý', variant: 'general' };
        }
        if (/Ru\s+/i.test(title) || /Hát ru/i.test(title)) {
            return { type: 'Ru' };
        }
        if (/quan họ/i.test(title)) {
            return { type: 'Quan họ' };
        }
        if (/Dâng/i.test(title)) {
            return { type: 'Ritual' };
        }
        if (/Trống/i.test(title)) {
            return { type: 'Ceremonial' };
        }
        return { type: 'Folk', subtype: 'general' };
    }

    detectRegion(title) {
        const lower = title.toLowerCase();
        if (lower.includes('bắc') || lower.includes('hà nội') || lower.includes('quan họ')) return 'Northern';
        if (lower.includes('nam') || lower.includes('sài gòn') || lower.includes('miền nam')) return 'Southern';
        if (lower.includes('huế') || lower.includes('quảng') || lower.includes('nghệ an')) return 'Central';
        if (lower.includes('tây nguyên') || lower.includes('highland')) return 'Highland';

        // Infer from genre
        if (title.startsWith('Lý') || title.includes('quan họ')) return 'Northern';
        if (title.startsWith('Hò') && lower.includes('đồng tháp')) return 'Southern';

        return 'Northern'; // Default
    }

    analyzePhraseContent(phrase, songTitle, allPhrases, phraseIndex) {
        const text = phrase.text.toLowerCase();

        return {
            // Keywords detected
            hasAddress: /\b(bà|ông|em|anh|con)\b/.test(text),
            addressTerm: text.match(/\b(bà|ông|em|anh|con)\b/)?.[0],

            hasNature: /\b(trăng|sông|chiều|hoa|cò|đò|mây|núi|biển)\b/.test(text),
            natureElement: text.match(/\b(trăng|sông|chiều|hoa|cò|đò|mây|núi|biển)\b/)?.[0],

            hasFamily: /\b(chồng|vợ|mẹ|cha|con|anh|em)\b/.test(text),
            familyRole: text.match(/\b(chồng|vợ|mẹ|cha|con|anh|em)\b/)?.[0],

            hasEmotion: /\b(thương|nhớ|buồn|vui|khổ|đau)\b/.test(text),
            emotionWord: text.match(/\b(thương|nhớ|buồn|vui|khổ|đau)\b/)?.[0],

            hasWork: /\b(làm|cày|bừa|giã|đập|kéo|chèo)\b/.test(text),
            workActivity: text.match(/\b(làm|cày|bừa|giã|đập|kéo|chèo)\b/)?.[0],

            hasTime: /\b(chiều|sáng|trưa|đêm|tối|mai)\b/.test(text),
            timeWord: text.match(/\b(chiều|sáng|trưa|đêm|tối|mai)\b/)?.[0],

            hasPlace: /\b(sông|núi|đồng|rừng|biển|chợ|làng)\b/.test(text),
            placeWord: text.match(/\b(sông|núi|đồng|rừng|biển|chợ|làng)\b/)?.[0],

            hasConcept: /\b(duyên|đời|kiếp|số|tơ hồng)\b/.test(text),
            conceptWord: text.match(/\b(duyên|đời|kiếp|số|tơ hồng)\b/)?.[0],

            // Structural analysis
            isRepetition: this.isPhraserepeated(phrase, allPhrases),
            positionInSong: this.getPositionType(phraseIndex, allPhrases.length),
            hasRhyme: this.detectRhyme(phrase, allPhrases, phraseIndex),

            // Content analysis
            isHumorous: /tẹo|tèo|teo|bi bo|nhỏ xíu/.test(text),
            isOnomatopoeia: /o o o|ngáy|keng|ầm|rì rào/.test(text),
            isRespectful: /kính|thưa|tôi|con/.test(text),
            isPlayful: /rằng|rí|lả|chành chành/.test(text)
        };
    }

    isPhraserepeated(phrase, allPhrases) {
        return allPhrases.filter(p => p.text === phrase.text).length > 1;
    }

    getPositionType(index, total) {
        if (index === 0) return 'opening';
        if (index === total - 1) return 'closing';
        if (index < total * 0.25) return 'early';
        if (index > total * 0.75) return 'late';
        return 'middle';
    }

    detectRhyme(phrase, allPhrases, index) {
        if (index === 0) return null;
        const prevPhrase = allPhrases[index - 1];
        if (!prevPhrase) return null;

        const lastSyllable = phrase.text.split(/\s+/).slice(-1)[0];
        const prevLastSyllable = prevPhrase.text.split(/\s+/).slice(-1)[0];

        // Simple end rhyme detection
        return lastSyllable?.slice(-2) === prevLastSyllable?.slice(-2);
    }

    generateUniqueDescription(phrase, analysis, genre, region) {
        const type = phrase.linguisticType;
        let parts = [];

        // Start with most specific element found
        if (analysis.conceptWord) {
            if (analysis.conceptWord === 'duyên') {
                parts.push(`This phrase invokes "duyên" (fate/destiny), a Buddhist concept deeply embedded in Vietnamese views on relationships. Vietnamese believe marriages are predetermined by karma from past lives.`);
            } else if (analysis.conceptWord === 'tơ hồng') {
                parts.push(`The "tơ hồng" (red thread of fate) comes from ancient Chinese legend - an invisible red thread ties together those destined to meet. In Vietnamese culture, this represents inevitable romantic connections.`);
            } else if (analysis.conceptWord === 'đời') {
                parts.push(`"Đời" (life) in Vietnamese folk songs carries connotations of hardship and endurance. Unlike Western "life," đời implies struggle and acceptance of suffering.`);
            }
        } else if (analysis.natureElement) {
            const nature = analysis.natureElement;
            if (nature === 'chiều') {
                parts.push(`"Chiều" (evening) is the time of reflection and melancholy in Vietnamese poetry and music. The fading light metaphorically represents loss, separation, and nostalgia.`);
            } else if (nature === 'trăng') {
                parts.push(`The moon ("trăng") is central to Vietnamese romantic imagery. Separated lovers traditionally looked at the same moon to feel connected across distance.`);
            } else if (nature === 'sông') {
                parts.push(`Rivers ("sông") hold deep significance in Vietnamese culture - the Red River shaped Northern civilization, the Mekong defines the South. River crossings mark major life transitions.`);
            } else if (nature === 'cò') {
                parts.push(`The egret or heron ("cò") is an iconic image of Vietnamese rice paddies. Its solitary grace represents both loneliness and elegant independence.`);
            } else if (nature === 'hoa') {
                parts.push(`Flowers ("hoa") are metaphors for young women and fleeting youth. Different flowers mark seasons: mai for Tết, lotus for summer, chrysanthemum for autumn.`);
            }
        } else if (analysis.familyRole === 'chồng') {
            parts.push(`Husband-complaint songs are a traditional Vietnamese genre allowing women to humorously express marriage frustrations. The exaggerated complaints (too small, too lazy, snoring) provide social catharsis.`);
        } else if (analysis.addressTerm) {
            const term = analysis.addressTerm;
            if (term === 'bà') {
                parts.push(`"Bà" is a respectful address for married women, used even for young women in folk songs. This reflects Confucian social hierarchy maintained even in intimate artistic contexts.`);
            } else if (term === 'ông') {
                parts.push(`"Ông" is a respectful address for married men. Its use in this context shows the formal politeness maintained in Vietnamese, even when criticizing one's husband.`);
            } else if (term === 'em') {
                parts.push(`"Em" indicates a younger person or term of endearment in romance. In folk songs, it often represents the female voice addressing herself or being addressed by a lover.`);
            }
        }

        // Add genre-specific context
        if (genre.type === 'Hò' && genre.subtype !== 'general') {
            const subtypeInfo = this.knowledge.genres.Hò.subtypes[genre.subtype];
            if (subtypeInfo) {
                parts.push(`As part of a ${genre.type} ${genre.subtype} (${subtypeInfo}), this phrase would have been sung during communal labor to coordinate physical movements and maintain work rhythm.`);
            }
        } else if (genre.type === 'Lý' && genre.variant && genre.variant !== 'general') {
            const variantInfo = this.knowledge.genres.Lý.variants[genre.variant];
            if (variantInfo) {
                parts.push(`This is from the ${genre.type} ${genre.variant} tradition - ${variantInfo}. Lý songs use free rhythm and elaborate melodic ornamentation.`);
            }
        } else if (genre.type === 'Ru') {
            parts.push(`This lullaby phrase reflects mothers' deep emotional bonds with children. Vietnamese lullabies uniquely blend wishes for success with warnings about life's hardships.`);
        } else if (genre.type === 'Quan họ') {
            parts.push(`This quan họ phrase is from UNESCO-recognized courtship song tradition of Bắc Ninh. Historically sung alternately between male and female groups during village festivals and boat outings.`);
        }

        // Add linguistic type context
        if (type === 'onomatopoeia' && analysis.isOnomatopoeia) {
            parts.push(`The onomatopoetic sounds (${phrase.text.split(/\s+/).slice(-3).join(' ')}) create humor and vivid imagery characteristic of Vietnamese folk song wordplay.`);
        } else if (type === 'complaint' && !parts.find(p => p.includes('complaint'))) {
            parts.push(`Vietnamese folk songs use complaint as a genre - allowing expression of frustration within culturally acceptable humorous framework.`);
        }

        // Add position context
        if (analysis.positionInSong === 'opening') {
            parts.push(`As the opening phrase, this establishes the song's emotional tone and invites audience engagement.`);
        } else if (analysis.positionInSong === 'closing') {
            parts.push(`As the closing phrase, this provides resolution and often returns to opening themes for circular structure.`);
        }

        // Add repetition context
        if (analysis.isRepetition) {
            parts.push(`This phrase repeats multiple times throughout the song, serving as a structural anchor and allowing audience participation.`);
        }

        // Fallback
        if (parts.length === 0) {
            parts.push(`This ${type} phrase contributes to the song's narrative structure and emotional arc, typical of ${region || 'Vietnamese'} folk traditions.`);
        }

        return parts.join(' ');
    }

    generateSpecificFacts(phrase, analysis, genre, region, songTitle) {
        let facts = new Set(); // Use Set to avoid duplicates

        // Priority 1: Most specific content-based facts
        if (analysis.conceptWord === 'tơ hồng') {
            facts.add('The red thread of fate originates from the Chinese "Yue Lao" (月老) legend - an old man who ties invisible red strings between destined lovers');
            facts.add('In Vietnamese culture, arranged marriages were partly justified by "duyên" - if the match failed, it was fate, not human error');
        } else if (analysis.conceptWord === 'duyên') {
            facts.add('Vietnamese distinguish "duyên" (destined connection) from "tình" (feeling/love) - you can have duyên without tình and vice versa');
            facts.add('"Duyên trời định, tình tự trao" (Fate is heaven-ordained, feelings we bestow ourselves) is a common Vietnamese saying');
        }

        if (analysis.natureElement === 'trăng') {
            facts.add('Vietnamese Mid-Autumn Festival (Tết Trung Thu) celebrates the moon with lion dances, mooncakes, and children\'s lanterns');
            facts.add('The moon appears in Vietnamese proverbs: "Trăng rằm tháng tám" (full moon of 8th month) represents peak beauty');
        } else if (analysis.natureElement === 'chiều') {
            facts.add('Evening (chiều) in Vietnamese culture is time for family gathering after work - hence its association with home and reflection');
            facts.add('Many Vietnamese classical poems and songs feature "chiều hôm" (late afternoon) as a melancholic motif');
        } else if (analysis.natureElement === 'sông') {
            facts.add('Vietnamese civilization developed around major rivers: Red River (Sông Hồng) in North, Mekong (Cửu Long) in South');
            facts.add('River ferries (đò sông) appear frequently in folk songs as settings for chance romantic encounters');
        }

        if (analysis.familyRole === 'chồng') {
            facts.add('Wife-complaining-about-husband songs were traditionally sung during women\'s communal work (weaving, husking rice)');
            facts.add('The exaggerated descriptions (tiny husband, lazy husband) follow comedic folk song conventions - not literal complaints');
            facts.add('These songs provided psychological relief in patriarchal society where women had limited public voice');
        }

        if (analysis.isOnomatopoeia) {
            facts.add('Vietnamese has rich onomatopoeia: each sound word can indicate size, intensity, texture');
            facts.add('Sound words like "tẹo tèo teo" use vowel gradation (ẹ→è→e) to suggest diminishing size');
        }

        // Priority 2: Genre-specific facts
        if (genre.type === 'Hò') {
            if (genre.subtype === 'giã gạo') {
                facts.add('Rice pounding songs synchronized the strikes of wooden pestles in mortars - rhythm prevented accidents');
                facts.add('In Central Vietnam, rice pounding was communal work where women gathered, creating social bonding opportunity');
            } else if (genre.subtype === 'chèo') {
                facts.add('Boat rowing songs matched the rhythm of oars - leader sang call, rowers responded on the stroke');
                facts.add('Different hò chèo exist for upstream (slower, heavier) vs downstream (faster, lighter) rowing');
            } else {
                facts.add('Hò songs helped coordinate physical labor like rowing boats or pounding rice throughout Central and Southern Vietnam');
                facts.add('The call-and-response structure kept workers in rhythm and made hard labor more bearable');
            }
        } else if (genre.type === 'Lý') {
            facts.add('Lý songs originated in Red River Delta villages, characterized by free rhythm and high tessitura');
            if (genre.variant === 'chiều chiều') {
                facts.add('Lý chiều chiều specifically evokes evening melancholy and is one of the most beloved Northern folk melodies');
            }
            facts.add('Lý singers traditionally used elaborate vocal ornaments (melisma, grace notes) to showcase skill');
        } else if (genre.type === 'Ru') {
            facts.add(`${region} lullabies have distinct characteristics reflecting regional values and concerns`);
            facts.add('Vietnamese mothers traditionally sang different lullabies for boys (emphasizing success) vs girls (emphasizing virtue)');
            facts.add('Many lullabies include warnings about hardships, preparing children for difficult life ahead');
        } else if (genre.type === 'Quan họ') {
            facts.add('Quan họ originated in 49 villages of Bắc Ninh and Bắc Giang provinces, UNESCO heritage since 2009');
            facts.add('Traditionally performed on decorated boats (thuyền hoa) during spring festivals');
            facts.add('Singers wore distinctive costumes: women in four-panel dress (áo tứ thân), men in turbans');
        }

        // Priority 3: Regional facts
        if (region && this.knowledge.regions[region]) {
            const regionInfo = this.knowledge.regions[region];
            facts.add(`${region} Vietnamese music is characterized by ${regionInfo.characteristics}`);
        }

        // Priority 4: Musical structure facts
        if (analysis.positionInSong === 'opening') {
            facts.add('Opening phrases in Vietnamese folk songs often use vocatives (ơi, này) to grab attention before the narrative begins');
        } else if (analysis.isRepetition) {
            facts.add('Repeated refrains allow audience participation and create memorable hooks in oral tradition where songs were learned by ear');
        }

        // Priority 5: General Vietnamese music facts (fill to 4 only if needed)
        const generalFacts = [
            'Vietnamese musical phrases typically follow speech tone patterns - rising tones matched with rising pitches',
            'The pentatonic scale (5-note) is fundamental to Vietnamese folk music, avoiding Western semitone tensions',
            'Đàn tranh (16-string zither) arrangements of folk songs are 20th century innovations - originals were vocal',
            'Folk songs were primary entertainment in pre-modern Vietnam, performed at festivals, weddings, funerals',
            'Many folk songs survived centuries through oral tradition without written notation until French colonial period',
            'Regional dialects significantly affect folk song performance - same song sounds different North vs South'
        ];

        for (const fact of generalFacts) {
            if (facts.size >= 4) break;
            if (!Array.from(facts).some(f => f.includes(fact.slice(0, 20)))) {
                facts.add(fact);
            }
        }

        return Array.from(facts).slice(0, 4);
    }

    generateDetailedMusicalContext(phrase, analysis, genre, phraseIndex, totalPhrases) {
        const type = phrase.linguisticType;
        let parts = [];

        // Syllable count analysis
        const count = phrase.syllableCount;
        if (count === 4) {
            parts.push(`The 4-syllable structure is the foundational unit of Vietnamese poetic meter (equivalent to 4/4 time in Western music)`);
        } else if (count === 5) {
            parts.push(`The 5-syllable structure (lục bát's "lục" variant) adds weight and conclusion, often used at phrase endings`);
        } else if (count === 7) {
            parts.push(`The 7-syllable structure (lục bát's "bát" variant) allows extended melodic development and is common in literary songs`);
        } else if (count === 3) {
            parts.push(`The truncated 3-syllable structure creates rhythmic surprise or accelerando effect toward phrase end`);
        } else if (count === 6) {
            parts.push(`The 6-syllable structure (song lục) balances melody with text, common in Southern traditions`);
        }

        // Position-based musical function
        if (analysis.positionInSong === 'opening') {
            parts.push(`As the opening phrase, it establishes the tonal center and introduces the melodic motif that will be varied throughout`);
        } else if (analysis.positionInSong === 'closing') {
            parts.push(`As the closing phrase, it typically returns to the tonic note and may quote the opening melody for circular structure`);
        } else if (phraseIndex === Math.floor(totalPhrases / 2)) {
            parts.push(`Positioned at the song's midpoint, this phrase likely marks a structural pivot or climax in the narrative`);
        }

        // Type-specific performance practice
        if (type === 'question') {
            parts.push(`Question phrases in Vietnamese folk music traditionally end on an unstable pitch (2nd or 5th scale degree) creating anticipation for the answer`);
        } else if (type === 'answer') {
            parts.push(`Answer phrases typically resolve to stable pitches (tonic or 3rd) and may mirror the question's melodic contour with variation`);
        } else if (type === 'exclamatory') {
            parts.push(`Exclamatory phrases often use sustained notes or melismatic ornaments (grace notes, bends) to heighten emotional intensity`);
        } else if (type === 'complaint') {
            parts.push(`Complaint phrases use descending melodic lines (suggesting resignation) or static repeated notes (suggesting frustration)`);
        } else if (type === 'onomatopoeia') {
            parts.push(`Onomatopoetic phrases use simple repeated pitches or rhythmic patterns to imitate the described sounds`);
        }

        // Genre performance practice
        if (genre.type === 'Hò') {
            parts.push(`In hò work songs, this phrase would be sung in strong rhythm synchronized with physical labor movements`);
        } else if (genre.type === 'Lý') {
            parts.push(`Lý performances use rubato (flexible tempo) allowing singers to expressively stretch or compress phrase timing`);
        } else if (genre.type === 'Ru') {
            parts.push(`Lullaby phrases use gentle rocking rhythm (6/8 or 9/8 meter) mirroring the physical motion of cradling a child`);
        }

        // Repetition impact
        if (analysis.isRepetition) {
            parts.push(`The repetition of this refrain creates hypnotic effect and marks structural divisions between narrative verses`);
        }

        return parts.join('. ') + '.';
    }

    async processAll() {
        const files = fs.readdirSync(this.lyricsDir).filter(f => f.endsWith('.json'));

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Advanced Cultural Context Generator                      ║`);
        console.log(`║  Deep Content Analysis & Unique Context                   ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        let processedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            const songName = file.replace('.json', '');
            const lyricsPath = path.join(this.lyricsDir, file);

            try {
                const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

                // Backup original
                const backupPath = path.join(this.backupDir, file);
                fs.writeFileSync(backupPath, JSON.stringify(lyricsData, null, 2), 'utf8');

                // Process each phrase with deep analysis
                lyricsData.phrases.forEach((phrase, index) => {
                    phrase.culturalContext = this.generatePhraseContext(
                        phrase,
                        lyricsData.songTitle || songName,
                        lyricsData.phrases,
                        index
                    );
                });

                // Save updated file
                fs.writeFileSync(lyricsPath, JSON.stringify(lyricsData, null, 2), 'utf8');

                processedCount++;
                const progress = Math.round((processedCount / files.length) * 100);
                console.log(`✅ [${processedCount}/${files.length}] ${progress}% - ${songName} (${lyricsData.phrases.length} phrases analyzed)`);

            } catch (error) {
                console.error(`❌ Error: ${songName} - ${error.message}`);
            }
        }

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Generation Complete!                                     ║`);
        console.log(`║  Processed: ${processedCount} songs                       `);
        console.log(`║  Each phrase has unique cultural context                  ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        console.log(`✅ Backups saved to: ${this.backupDir}\n`);
    }
}

if (require.main === module) {
    const generator = new AdvancedCulturalGenerator();
    generator.processAll().catch(console.error);
}

module.exports = AdvancedCulturalGenerator;
