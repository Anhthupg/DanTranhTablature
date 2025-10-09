// Song Data Service - Handles all song loading and data extraction
// Extracted from vertical-demo-server.js as part of Phase 2 refactoring

const DataLoader = require('../utils/data-loader');

class SongDataService {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.dataLoader = new DataLoader(baseDir);
    }

    /**
     * Load song data with fallback logic
     * @param {string} requestedSong - Song name from query parameter
     * @returns {Object} { songDir, songData, relationshipsData }
     */
    loadSongData(requestedSong) {
        // Strip extensions (library sends "Song.musicxml.xml", we need "Song")
        let preferredSong = requestedSong
            ? requestedSong.replace('.musicxml.xml', '').replace('.xml', '')
            : 'Bà rằng bà rí';

        let songDir = preferredSong;

        console.log(`Query param: "${requestedSong}" → Preferred: "${preferredSong}"`);

        // Check if preferred song exists using DataLoader
        let relationshipsData = this.dataLoader.loadV3ProcessedData(preferredSong);

        if (!relationshipsData) {
            console.log(`Song not found: ${preferredSong}, using fallback...`);

            // Fall back to first available song
            const fallbackSong = this.dataLoader.findFirstAvailableSong();

            if (!fallbackSong) {
                throw new Error('No processed songs found in v3 data.');
            }

            songDir = fallbackSong;
            relationshipsData = this.dataLoader.loadV3ProcessedData(fallbackSong);
            console.log(`Using fallback: ${songDir}`);
        } else {
            console.log(`✓ Loading song: ${songDir}`);
        }

        // Convert to V4 format
        const songData = this.dataLoader.convertV3ToV4Format(relationshipsData, songDir);

        return { songDir, songData, relationshipsData };
    }

    /**
     * Extract lyrics from MusicXML
     * @param {string} songDir - Song directory name
     * @returns {Array} Array of lyric strings
     */
    extractLyrics(songDir) {
        const xmlContent = this.dataLoader.loadMusicXML(songDir);

        if (!xmlContent) {
            return [];
        }

        try {
            return this.dataLoader.extractLyricsFromXML(xmlContent);
        } catch (err) {
            console.log('Lyrics extraction failed:', err.message);
            return [];
        }
    }

    /**
     * Load lyrics segmentation data with fallback
     * @param {string} songDir - Song directory name
     * @param {Array} lyrics - Extracted lyrics
     * @param {Array} notes - Song notes
     * @returns {Object|null} Segmentation data or null
     */
    loadLyricsSegmentation(songDir, lyrics, notes) {
        // Try to load pre-segmented lyrics data
        let segmentationResult = this.dataLoader.loadLyricsSegmentation(songDir);

        if (!segmentationResult && lyrics.length > 0) {
            // Fall back to on-the-fly segmentation
            console.log('No pre-segmented lyrics, generating on-the-fly...');
            const PhraseSegmenter = require('../processors/phrase-segmenter');
            const phraseSegmenter = new PhraseSegmenter();

            const syllables = lyrics.map((text, i) => ({
                text,
                index: i,
                noteIndices: [i],
                noteDurations: [1.0]
            }));

            segmentationResult = phraseSegmenter.segment(syllables, notes);
        }

        return segmentationResult;
    }

    /**
     * Load relationships data for a song
     * @param {string} songDir - Song directory name
     * @returns {Object|null} Relationships data or null
     */
    loadRelationships(songDir) {
        return this.dataLoader.loadRelationships(songDir);
    }

    /**
     * Calculate basic song statistics
     * @param {Object} songData - Song data object
     * @returns {Object} Statistics object
     */
    calculateStatistics(songData) {
        const graceNotes = songData.notes.filter(n => n.isGrace).length;
        const gracePercentage = ((graceNotes / songData.notes.length) * 100).toFixed(1);
        const uniquePitches = [...new Set(songData.notes.map(n => `${n.step}${n.octave}`))].length;

        return {
            totalNotes: songData.notes.length,
            graceNotes,
            gracePercentage,
            uniquePitches
        };
    }
}

module.exports = SongDataService;
