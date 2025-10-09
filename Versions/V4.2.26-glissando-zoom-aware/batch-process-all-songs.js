/**
 * Batch Process All Folk Songs
 * Extracts lyrics, generates segmentations, and creates relationships
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

class BatchFolkSongProcessor {
    constructor() {
        this.parser = new xml2js.Parser();
        this.musicxmlDir = path.join(__dirname, 'data', 'musicxml');
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.relationshipsDir = path.join(__dirname, 'data', 'relationships');

        // Ensure directories exist
        [this.lyricsDir, this.relationshipsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Extract lyrics from MusicXML
     */
    async extractLyrics(songName) {
        const xmlPath = path.join(this.musicxmlDir, `${songName}.musicxml.xml`);
        const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
        const parsedXML = await this.parser.parseStringPromise(xmlContent);

        const lyrics = [];
        const parts = parsedXML['score-partwise'].part;
        if (!parts || parts.length === 0) return lyrics;

        const part = parts[0];
        const measures = part.measure;

        for (const measure of measures) {
            const notes = measure.note || [];
            for (const noteData of notes) {
                if (noteData.rest) continue;
                if (noteData.grace) continue;  // Skip grace notes

                const lyricData = noteData.lyric ? noteData.lyric[0] : null;
                if (lyricData && lyricData.text && lyricData.text[0]) {
                    const text = lyricData.text[0].trim();
                    if (text) lyrics.push(text);
                }
            }
        }

        return lyrics;
    }

    /**
     * Simple phrase segmentation based on punctuation
     */
    segmentLyrics(lyrics, songName) {
        const allText = lyrics.join(' ');
        const phrases = [];
        let phraseId = 1;

        // Split by common Vietnamese phrase delimiters
        const segments = allText.split(/[.,!?;]+/).filter(s => s.trim());

        for (const segment of segments) {
            const text = segment.trim();
            if (!text) continue;

            const words = text.split(/\s+/);
            const wordMapping = words.map(vn => ({
                vn: vn,
                en: ''  // Will be filled if needed
            }));

            // Detect linguistic type
            const linguisticType = this.detectLinguisticType(text);

            phrases.push({
                id: phraseId++,
                text: text,
                syllableCount: words.length,
                type: linguisticType,
                linguisticType: linguisticType,
                english: '',  // Will be filled if needed
                wordMapping: wordMapping
            });
        }

        return {
            songTitle: songName,
            totalSyllables: lyrics.length,
            segmentedBy: 'Automatic (punctuation-based)',
            segmentationDate: new Date().toISOString().split('T')[0],
            phrases: phrases,
            statistics: {
                totalSyllables: lyrics.length,
                totalPhrases: phrases.length,
                averagePhraseLength: (lyrics.length / phrases.length).toFixed(2)
            }
        };
    }

    /**
     * Detect linguistic type from text patterns
     */
    detectLinguisticType(text) {
        if (text.includes('?') || text.startsWith('Đi đâu') || text.includes('gì')) return 'question';
        if (text.includes('ơi') || text.includes('Ới')) return 'exclamatory';
        if (text.includes('o o') || text.includes('hò') || text.includes('hừ')) return 'onomatopoeia';
        if (text.includes('khổ') || text.includes('lười')) return 'complaint';
        return 'narrative';
    }

    /**
     * Process a single song
     */
    async processSong(songName) {
        console.log(`\n📝 Processing: ${songName}`);

        try {
            // Extract lyrics
            const lyrics = await this.extractLyrics(songName);
            if (lyrics.length === 0) {
                console.log(`  ⏭️  No lyrics found`);
                return false;
            }

            console.log(`  ✓ Extracted ${lyrics.length} syllables`);

            // Generate segmentation
            const segmentation = this.segmentLyrics(lyrics, songName);
            console.log(`  ✓ Segmented into ${segmentation.phrases.length} phrases`);

            // Save segmentation
            const segmentationPath = path.join(this.lyricsDir, `${songName}.json`);
            fs.writeFileSync(segmentationPath, JSON.stringify(segmentation, null, 2));
            console.log(`  ✓ Saved segmentation`);

            // Generate relationships
            const V4RelationshipsGenerator = require('./generate-v4-relationships');
            const relGenerator = new V4RelationshipsGenerator();
            await relGenerator.generateRelationships(songName);
            console.log(`  ✓ Generated relationships`);

            return true;
        } catch (error) {
            console.error(`  ❌ Error:`, error.message);
            return false;
        }
    }

    /**
     * Batch process all songs
     */
    async processAll() {
        const files = fs.readdirSync(this.musicxmlDir)
            .filter(f => f.endsWith('.musicxml.xml'))
            .map(f => f.replace('.musicxml.xml', ''));

        console.log(`\n🔄 Processing ${files.length} songs...\n`);

        let success = 0;
        let skipped = 0;
        let failed = 0;

        for (const songName of files) {
            // Skip if already processed
            const segPath = path.join(this.lyricsDir, `${songName}.json`);
            const relPath = path.join(this.relationshipsDir, `${songName}-relationships.json`);

            if (fs.existsSync(segPath) && fs.existsSync(relPath)) {
                console.log(`⏭️  ${songName} (already processed)`);
                skipped++;
                continue;
            }

            const result = await this.processSong(songName);
            if (result) {
                success++;
            } else {
                failed++;
            }
        }

        console.log(`\n═══════════════════════════════════`);
        console.log(`✅ Successfully processed: ${success}`);
        console.log(`⏭️  Skipped (already done): ${skipped}`);
        console.log(`❌ Failed (no lyrics): ${failed}`);
        console.log(`═══════════════════════════════════\n`);
    }
}

// Run batch processing
if (require.main === module) {
    const processor = new BatchFolkSongProcessor();
    processor.processAll();
}

module.exports = BatchFolkSongProcessor;
