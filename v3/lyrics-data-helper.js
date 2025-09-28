// Vietnamese Folk Song Lyrics Data Helper
// For Dan Tranh Tablature V3 - Lyrics Tab Integration

/**
 * Lyrics Data Structure for Vietnamese Folk Songs
 * These are traditional folk songs in the public domain
 */

const vietnameseFolkSongs = {
    "Đò đưa quan họ": {
        vietnamese: `
            Đò đưa quan họ bát nước trôi
            Anh đưa em tới bến sông Hồi
            Nước chảy xiết về đâu có biết
            Tình anh với em trăm năm không vơi
        `,
        english: `
            The ferry carries folk songs and floating bowls
            I take you to the Hoi river dock
            The flowing water knows not where it goes
            My love for you will never fade in a hundred years
        `,
        romanized: `
            Do dua quan ho bat nuoc troi
            Anh dua em toi ben song Hoi
            Nuoc chay xiet ve dau co biet
            Tinh anh voi em tram nam khong voi
        `
    },

    "Bà rằng bà rí": {
        vietnamese: `
            Bà rằng bà rí, bà rằng bà rí
            Con chim bác mắc mưa rơi
            Đêm dài tựa gối ôm lòng
            Nhớ người yêu ở chốn nào rồi
        `,
        english: `
            Grandmother said this, grandmother said that
            Uncle bird is caught in the falling rain
            Long nights leaning on pillow, embracing heart
            Missing the beloved who is now somewhere far
        `,
        romanized: `
            Ba rang ba ri, ba rang ba ri
            Con chim bac mac mua roi
            Dem dai tua goi om long
            Nho nguoi yeu o chon nao roi
        `
    },

    "Bài chòi": {
        vietnamese: `
            Bài chòi ai ơi bài chòi
            Chòi thầy chòi trò ai người khéo hơn
            Em về với bố với mẹ
            Anh ở lại đây một mình cô đơn
        `,
        english: `
            Card game, oh dear, card game
            Teacher's cards, student's cards, who is more skillful
            You return to father and mother
            I stay here alone and lonely
        `,
        romanized: `
            Bai choi ai oi bai choi
            Choi thay choi tro ai nguoi kheo hon
            Em ve voi bo voi me
            Anh o lai day mot minh co don
        `
    },

    "Ly hoai nam": {
        vietnamese: `
            Có ai qua sông mua tôi cái nang
            Che nắng che mưa cho tôi đi đường
            Tôi đi tứ xứ lang thang
            Lấy vàng lấy bạc nuôi thân tôi thôi
        `,
        english: `
            Does anyone cross the river to buy me a hat
            To shade from sun and rain for my journey
            I wander the four directions
            To earn gold and silver to sustain myself
        `,
        romanized: `
            Co ai qua song mua toi cai nang
            Che nang che mua cho toi di duong
            Toi di tu xu lang thang
            Lay vang lay bac nuoi than toi thoi
        `
    },

    "Hát ru": {
        vietnamese: `
            Ru ơi ru con ru con ngủ đi
            Mẹ đi cấy lúa ngoài đồng về khuya
            Gà mái kêu trong sân nhà
            Báo tin mẹ đã về nhà rồi con
        `,
        english: `
            Sleep my child, sleep my child, go to sleep
            Mother goes to plant rice in the field, returning late
            The hen crows in the yard
            Announcing that mother has come home, my child
        `,
        romanized: `
            Ru oi ru con ru con ngu di
            Me di cay lua ngoai dong ve khuya
            Ga mai keu trong san nha
            Bao tin me da ve nha roi con
        `
    }
};

/**
 * Extract lyrics data for a given song name
 * First tries to extract from relationships.json data, then falls back to static database
 * @param {string} songName - The name of the song
 * @param {object} relationshipData - Optional parsed relationships.json data
 * @returns {object} Lyrics data structure
 */
function extractLyricsData(songName, relationshipData = null) {
    // First try to extract lyrics from MusicXML data if available
    if (relationshipData && relationshipData.notes) {
        const extractedLyrics = extractLyricsFromMusicXML(relationshipData);
        if (extractedLyrics.hasLyrics) {
            return extractedLyrics;
        }
    }

    // Fall back to static database
    // Normalize song name for lookup
    const normalizedName = songName.toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Find matching song in database
    const matchingKey = Object.keys(vietnameseFolkSongs).find(key => {
        const keyNormalized = key.toLowerCase()
            .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
            .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
            .replace(/[ìíịỉĩ]/g, 'i')
            .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
            .replace(/[ùúụủũưừứựửữ]/g, 'u')
            .replace(/[ỳýỵỷỹ]/g, 'y')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return keyNormalized.includes(normalizedName) || normalizedName.includes(keyNormalized);
    });

    if (matchingKey) {
        const songData = vietnameseFolkSongs[matchingKey];
        return {
            originalLyrics: songData.vietnamese.trim(),
            englishTranslation: songData.english.trim(),
            romanizedLyrics: songData.romanized.trim(),
            hasLyrics: true,
            source: 'database'
        };
    }

    // Return default structure if no lyrics found
    return {
        originalLyrics: "Lyrics not available for this song.",
        englishTranslation: "English translation not available.",
        romanizedLyrics: "Romanized lyrics not available.",
        hasLyrics: false,
        source: 'none'
    };
}

/**
 * Extract lyrics from MusicXML relationship data
 * @param {object} relationshipData - Parsed relationships.json data
 * @returns {object} Extracted lyrics with phrases
 */
function extractLyricsFromMusicXML(relationshipData) {
    const notes = relationshipData.notes || [];
    const syllables = [];

    // Extract all lyric syllables from notes
    notes.forEach((note, index) => {
        if (note.lyrics && note.lyrics.text && note.lyrics.text.trim()) {
            syllables.push({
                text: note.lyrics.text.trim(),
                noteIndex: index,
                noteId: note.id,
                timing: note.timing,
                syllabic: note.lyrics.syllabic,
                hasExtend: note.lyrics.hasExtend,
                melismaGroup: note.relationships?.melismaGroup
            });
        }
    });

    if (syllables.length === 0) {
        return {
            hasLyrics: false,
            source: 'musicxml'
        };
    }

    // Create Vietnamese phrases from syllables
    const phrases = createVietnamesePhrases(syllables);

    // Format for display
    const originalLyrics = phrases.map(p => p.text).join('\n');
    const romanized = createRomanizedVersion(originalLyrics);

    return {
        originalLyrics: originalLyrics,
        romanizedLyrics: romanized,
        englishTranslation: "Translation will be provided for traditional folk songs.",
        phrases: phrases,
        syllables: syllables,
        hasLyrics: true,
        source: 'musicxml',
        interactive: true // Enable interactive features
    };
}

/**
 * Create Vietnamese phrases from syllables using linguistic patterns
 * @param {array} syllables - Array of syllable objects
 * @returns {array} Array of phrase objects
 */
function createVietnamesePhrases(syllables) {
    const phrases = [];
    let currentPhrase = {
        text: '',
        syllables: [],
        startIndex: 0,
        endIndex: 0
    };

    syllables.forEach((syllable, index) => {
        // Add syllable to current phrase
        if (currentPhrase.text) {
            currentPhrase.text += ' ';
        }
        currentPhrase.text += syllable.text;
        currentPhrase.syllables.push(syllable);
        currentPhrase.endIndex = index;

        // Check for phrase breaks
        const shouldBreak =
            // End of sentence markers
            syllable.text.match(/[.!?]$/) ||
            // Musical phrase boundary (large timing gap)
            (index < syllables.length - 1 &&
             syllables[index + 1].timing - syllable.timing > 100) ||
            // Every 7-10 syllables for readability
            currentPhrase.syllables.length >= 8;

        if (shouldBreak || index === syllables.length - 1) {
            phrases.push({...currentPhrase});
            currentPhrase = {
                text: '',
                syllables: [],
                startIndex: index + 1,
                endIndex: index + 1
            };
        }
    });

    return phrases;
}

/**
 * Create romanized version of Vietnamese text
 * @param {string} vietnameseText - Vietnamese text with diacritics
 * @returns {string} Romanized version
 */
function createRomanizedVersion(vietnameseText) {
    return vietnameseText
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[ÌÍỊỈĨ]/g, 'I')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/[ỲÝỴỶỸ]/g, 'Y')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

/**
 * Vietnamese phrase break detection patterns
 * Used for creating meaningful line breaks in the lyrics display
 */
const vietnamesePhrasePatterns = {
    // Strong breaks (sentence endings)
    strong: /[.!?]/g,

    // Medium breaks (clause separators)
    medium: /[,;]/g,

    // Weak breaks (discourse markers)
    weak: /\s+(và|hay|hoặc|nhưng|mà|thì|nên|rồi|xong|được|thôi)\s+/gi,

    // Address terms and particles
    address: /\s+(em|anh|chị|cô|bác|ông|bà|ơi|ạ|nhé|nha|đi)\s+/gi
};

/**
 * Create template variables for the dual-panel viewer
 * @param {object} lyricsData - Lyrics data from extractLyricsData
 * @returns {object} Template variables
 */
function createLyricsTemplateVars(lyricsData) {
    return {
        ORIGINAL_LYRICS: lyricsData.originalLyrics || "No Vietnamese lyrics available",
        ENGLISH_TRANSLATION: lyricsData.englishTranslation || "No English translation available",
        ROMANIZED_LYRICS: lyricsData.romanizedLyrics || "No romanized lyrics available",

        // Additional analysis content
        MUSICAL_ANALYSIS: "This traditional Vietnamese folk song demonstrates the pentatonic scale structure typical of Northern Vietnamese music.",
        PERFORMANCE_NOTES: "Play with gentle finger techniques, emphasizing the flowing melody that mimics the movement of water.",
        CULTURAL_CONTEXT: "This song represents the traditional folk culture of Northern Vietnam, often sung during festivals and community gatherings.",
        HISTORICAL_BACKGROUND: "Dating back several centuries, this melody has been passed down through generations of Vietnamese musicians.",
        REGIONAL_VARIATIONS: "Different regions of Vietnam have their own interpretations, with variations in lyrics and melodic ornaments."
    };
}

module.exports = {
    vietnameseFolkSongs,
    extractLyricsData,
    vietnamesePhrasePatterns,
    createLyricsTemplateVars
};