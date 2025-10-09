/**
 * V4 Data Loader Utility
 *
 * Centralized data loading logic for song files across the application.
 * Handles file path resolution, flexible matching, and data parsing.
 */

const fs = require('fs');
const path = require('path');
const { normalize } = require('./formatters');

class DataLoader {
    constructor(baseDir) {
        this.baseDir = baseDir || __dirname;
        this.v3ProcessedDir = path.join(this.baseDir, '..', 'v3', 'data', 'processed');
        this.musicXmlDir = path.join(this.baseDir, 'data', 'musicxml');
        this.relationshipsDir = path.join(this.baseDir, 'data', 'relationships');
        this.lyricsDir = path.join(this.baseDir, 'data', 'lyrics-segmentations');
    }

    /**
     * Find matching file using flexible name matching (diacritic-insensitive)
     * @param {string} songName - Song name to match
     * @param {string} directory - Directory to search
     * @param {string} extension - File extension to match
     * @returns {string|null} Full path to matched file or null
     */
    findMatchingFile(songName, directory, extension) {
        if (!fs.existsSync(directory)) {
            console.warn(`Directory not found: ${directory}`);
            return null;
        }

        const allFiles = fs.readdirSync(directory).filter(f => f.endsWith(extension));
        const normalizedSongName = normalize(songName.replace(/_/g, ' '));

        const matchedFile = allFiles.find(file => {
            const fileBase = file.replace(extension, '');
            const normalizedFile = normalize(fileBase);
            return normalizedFile === normalizedSongName;
        });

        if (matchedFile) {
            console.log(`  ✓ Matched: ${matchedFile}`);
            return path.join(directory, matchedFile);
        }

        // Try direct path as fallback
        const directPath = path.join(directory, `${songName}${extension}`);
        if (fs.existsSync(directPath)) {
            console.log(`  ✓ Direct match: ${songName}${extension}`);
            return directPath;
        }

        return null;
    }

    /**
     * Load song relationships data
     * @param {string} songName - Song name (e.g., "Bà rằng bà rí")
     * @returns {Object|null} Relationships data or null if not found
     */
    loadRelationships(songName) {
        console.log(`Loading relationships for: ${songName}`);

        const filePath = this.findMatchingFile(songName, this.relationshipsDir, '-relationships.json');

        if (filePath && fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        console.warn(`Relationships not found for: ${songName}`);
        return null;
    }

    /**
     * Load lyrics segmentation data
     * @param {string} songName - Song name
     * @returns {Object|null} Lyrics segmentation data or null
     */
    loadLyricsSegmentation(songName) {
        console.log(`Loading lyrics segmentation for: ${songName}`);

        const filePath = this.findMatchingFile(songName, this.lyricsDir, '.json');

        if (filePath && fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            // Normalize field names (text vs vietnameseText)
            data.phrases = data.phrases.map(p => ({
                ...p,
                vietnameseText: p.text || p.vietnameseText
            }));
            return data;
        }

        console.warn(`Lyrics segmentation not found for: ${songName}`);
        return null;
    }

    /**
     * Load MusicXML file
     * @param {string} songName - Song name
     * @returns {string|null} MusicXML content or null
     */
    loadMusicXML(songName) {
        console.log(`Loading MusicXML for: ${songName}`);

        const filePath = this.findMatchingFile(songName, this.musicXmlDir, '.musicxml.xml');

        if (filePath && fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf-8');
        }

        console.warn(`MusicXML not found for: ${songName}`);
        return null;
    }

    /**
     * Load V3 processed data (relationships from v3/data/processed/)
     * @param {string} songName - Song name
     * @returns {Object|null} V3 relationships data or null
     */
    loadV3ProcessedData(songName) {
        console.log(`Loading V3 processed data for: ${songName}`);

        const songDirs = fs.readdirSync(this.v3ProcessedDir).filter(f =>
            fs.statSync(path.join(this.v3ProcessedDir, f)).isDirectory() &&
            fs.existsSync(path.join(this.v3ProcessedDir, f, 'relationships.json'))
        );

        const normalizedSongName = normalize(songName);
        const matchedDir = songDirs.find(dir => normalize(dir) === normalizedSongName);

        if (matchedDir) {
            const relationshipsPath = path.join(this.v3ProcessedDir, matchedDir, 'relationships.json');
            return JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));
        }

        // Try direct path
        const directPath = path.join(this.v3ProcessedDir, songName, 'relationships.json');
        if (fs.existsSync(directPath)) {
            return JSON.parse(fs.readFileSync(directPath, 'utf8'));
        }

        console.warn(`V3 processed data not found for: ${songName}`);
        return null;
    }

    /**
     * Find first available song in V3 processed directory
     * @returns {string|null} First available song name or null
     */
    findFirstAvailableSong() {
        const songDirs = fs.readdirSync(this.v3ProcessedDir).filter(f =>
            fs.statSync(path.join(this.v3ProcessedDir, f)).isDirectory() &&
            fs.existsSync(path.join(this.v3ProcessedDir, f, 'relationships.json'))
        );

        return songDirs.length > 0 ? songDirs[0] : null;
    }

    /**
     * Extract lyrics from MusicXML content
     * @param {string} xmlContent - MusicXML file content
     * @returns {Array<string>} Array of lyric texts
     */
    extractLyricsFromXML(xmlContent) {
        const lyricMatches = xmlContent.match(/<lyric[^>]*>[\s\S]*?<text>([^<]+)<\/text>[\s\S]*?<\/lyric>/g) || [];

        return lyricMatches.map(match => {
            const textMatch = match.match(/<text>([^<]+)<\/text>/);
            return textMatch ? textMatch[1].trim() : '';
        }).filter(text => text.length > 0);
    }

    /**
     * Convert V3 relationships data to V4 songData format
     * @param {Object} relationshipsData - V3 relationships data
     * @param {string} songDir - Song directory name
     * @returns {Object} V4 songData format
     */
    convertV3ToV4Format(relationshipsData, songDir) {
        return {
            metadata: {
                title: relationshipsData.metadata?.title || songDir,
                optimalTuning: relationshipsData.metadata?.optimalTuning,  // No fallback - let server calculate
                genre: relationshipsData.metadata?.genre || 'Traditional'
            },
            notes: relationshipsData.notes ? relationshipsData.notes.map((note, index) => ({
                index: index,
                step: note.pitch?.step || note.pitch?.fullNote?.replace(/[0-9]/g, '') || 'C',
                octave: note.pitch?.octave || parseInt(note.pitch?.fullNote?.match(/[0-9]/)?.[0]) || 4,
                pitch: (note.pitch?.step || note.pitch?.fullNote?.replace(/[0-9]/g, '') || 'C') +
                       (note.pitch?.octave || parseInt(note.pitch?.fullNote?.match(/[0-9]/)?.[0]) || 4),
                duration: note.duration?.value ? note.duration.value / 4 : 1,
                isGrace: note.isGrace || false,
                lyric: note.lyrics?.text || ''
            })) : []
        };
    }
}

module.exports = DataLoader;
