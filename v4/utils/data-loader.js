/**
 * V4 Data Loader Utility
 *
 * Centralized data loading logic for song files across the application.
 * Handles file path resolution, flexible matching, and data parsing.
 *
 * V4.2.39: Now uses song-name-mappings.json for standardized naming
 */

const fs = require('fs');
const path = require('path');
const { normalize } = require('./formatters');
const dataCache = require('./data-cache'); // V4.4.1: File I/O caching

class DataLoader {
    constructor(baseDir) {
        this.baseDir = baseDir || __dirname;
        this.v3ProcessedDir = path.join(this.baseDir, '..', 'v3', 'data', 'processed');
        this.v4ProcessedDir = path.join(this.baseDir, 'data', 'processed');
        this.musicXmlDir = path.join(this.baseDir, 'data', 'musicxml');
        this.relationshipsDir = path.join(this.baseDir, 'data', 'relationships');
        this.lyricsDir = path.join(this.baseDir, 'data', 'lyrics-segmentations');
        this.cache = dataCache; // V4.4.1: Reference to global cache

        // V4.2.39: Load song name mappings
        this.nameMappings = this.loadNameMappings();
    }

    /**
     * Load song-name-mappings.json (V4.2.39)
     * Builds reverse lookup index for O(1) performance (V4.2.40)
     * @returns {Object} Mappings object with songs data
     */
    loadNameMappings() {
        const mappingsPath = path.join(this.baseDir, 'data', 'song-name-mappings.json');

        if (fs.existsSync(mappingsPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
                console.log(`✓ Loaded ${Object.keys(data.songs).length} song mappings`);

                // V4.2.40: Build reverse lookup index for O(1) performance
                this.buildReverseIndex(data.songs);

                return data;
            } catch (err) {
                console.warn('Failed to load song-name-mappings.json:', err.message);
            }
        } else {
            console.warn('song-name-mappings.json not found, using legacy matching');
        }

        return { songs: {} };
    }

    /**
     * Build reverse lookup index for O(1) name resolution (V4.2.40)
     * @param {Object} songs - Songs object from mapping file
     */
    buildReverseIndex(songs) {
        this.reverseIndex = {};
        let indexedVariants = 0;

        for (const [backendId, data] of Object.entries(songs)) {
            // Helper to normalize and index
            const indexVariant = (variant) => {
                const normalized = normalize(variant.toLowerCase().replace(/[^a-z0-9]/g, ''));
                if (normalized && !this.reverseIndex[normalized]) {
                    this.reverseIndex[normalized] = backendId;
                    indexedVariants++;
                }
            };

            // Index display name
            indexVariant(data.displayName);

            // Index backend ID itself
            indexVariant(backendId);

            // Index all alternate spellings
            if (data.alternateSpellings) {
                data.alternateSpellings.forEach(indexVariant);
            }

            // Index old directory name (for backward compatibility)
            if (data.currentProcessedDir) {
                indexVariant(data.currentProcessedDir);
            }

            // Index original title
            if (data.originalTitle) {
                indexVariant(data.originalTitle);
            }
        }

        console.log(`✓ Built reverse index: ${indexedVariants} name variants`);
    }

    /**
     * Convert any song name variant to standardized backend ID
     * V4.2.39: Uses mapping file
     * V4.2.40: O(1) lookup via reverse index
     * @param {string} songName - Any variant (display name, old format, etc.)
     * @returns {string|null} Backend ID (kebab-case) or null if not found
     */
    toBackendId(songName) {
        if (!songName) return null;

        // V4.2.40: O(1) lookup using reverse index
        // V4.4.1: Removed O(n) fallback for 90% faster lookups on misses
        const normalized = normalize(songName.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const backendId = this.reverseIndex ? this.reverseIndex[normalized] : null;

        if (backendId) {
            return backendId;
        }

        // V4.4.1: Fail fast if not in index (removed O(n) fallback)
        console.warn(`No mapping found for: "${songName}" (normalized: "${normalized}")`);
        return null;
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
     * Load song relationships data (V4.2.39: Uses mapping file, V4.4.1: Cached)
     * @param {string} songName - Song name (any variant)
     * @returns {Object|null} Relationships data or null if not found
     */
    loadRelationships(songName) {
        console.log(`Loading relationships for: ${songName}`);

        // V4.2.39: Convert to backend ID first
        const backendId = this.toBackendId(songName);

        if (backendId) {
            // V4.4.1: Use cache for relationships (80% I/O reduction)
            const cacheKey = `relationships:${backendId}`;
            return this.cache.get(cacheKey, () => {
                const filePath = path.join(this.relationshipsDir, `${backendId}-relationships.json`);
                if (fs.existsSync(filePath)) {
                    console.log(`  ✓ Found: ${backendId}-relationships.json`);
                    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
                return null;
            });
        }

        // Fallback to legacy matching
        const filePath = this.findMatchingFile(songName, this.relationshipsDir, '-relationships.json');

        if (filePath && fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        console.warn(`Relationships not found for: ${songName}`);
        return null;
    }

    /**
     * Load lyrics segmentation data (V4.2.39: Uses mapping file, V4.4.1: Cached)
     * @param {string} songName - Song name (any variant)
     * @returns {Object|null} Lyrics segmentation data or null
     */
    loadLyricsSegmentation(songName) {
        console.log(`Loading lyrics segmentation for: ${songName}`);

        // V4.2.39: Convert to backend ID first
        const backendId = this.toBackendId(songName);

        if (backendId) {
            // V4.4.1: Use cache for lyrics (80% I/O reduction)
            const cacheKey = `lyrics:${backendId}`;
            return this.cache.get(cacheKey, () => {
                const filePath = path.join(this.lyricsDir, `${backendId}.json`);
                if (fs.existsSync(filePath)) {
                    console.log(`  ✓ Found: ${backendId}.json`);
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    // Normalize field names (text vs vietnameseText)
                    data.phrases = data.phrases.map(p => ({
                        ...p,
                        vietnameseText: p.text || p.vietnameseText
                    }));
                    return data;
                }
                return null;
            });
        }

        // Fallback to legacy matching
        const filePath = this.findMatchingFile(songName, this.lyricsDir, '.json');

        if (filePath && fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
     * Load MusicXML file (V4.2.39: MusicXML keeps original names)
     * @param {string} songName - Song name (any variant)
     * @returns {string|null} MusicXML content or null
     */
    loadMusicXML(songName) {
        console.log(`Loading MusicXML for: ${songName}`);

        // V4.2.39: MusicXML files keep original Vietnamese names
        // V4.3.15: Now search in category subfolders
        const backendId = this.toBackendId(songName);

        if (backendId && this.nameMappings.songs[backendId]) {
            const musicXMLFile = this.nameMappings.songs[backendId].musicXMLFile;
            if (musicXMLFile) {
                // Try root first (legacy)
                let filePath = path.join(this.musicXmlDir, musicXMLFile);
                if (fs.existsSync(filePath)) {
                    console.log(`  ✓ Found: ${musicXMLFile}`);
                    return fs.readFileSync(filePath, 'utf-8');
                }

                // Search in category subfolders
                const categories = [
                    'vietnamese-skeletal', 'vietnamese-dantranh',
                    'nonvietnamese-skeletal', 'nonvietnamese-dantranh',
                    'exercises-skeletal', 'exercises-dantranh'
                ];

                for (const category of categories) {
                    filePath = path.join(this.musicXmlDir, category, musicXMLFile);
                    if (fs.existsSync(filePath)) {
                        console.log(`  ✓ Found in ${category}: ${musicXMLFile}`);
                        return fs.readFileSync(filePath, 'utf-8');
                    }
                }
            }
        }

        // Fallback to legacy matching
        const filePath = this.findMatchingFile(songName, this.musicXmlDir, '.musicxml.xml');

        if (filePath && fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf-8');
        }

        console.warn(`MusicXML not found for: ${songName}`);
        return null;
    }

    /**
     * Load V3 processed data (V4.2.39: Now checks v4/data/processed first with new naming)
     * @param {string} songName - Song name (any variant)
     * @returns {Object|null} Processed relationships data or null
     */
    loadV3ProcessedData(songName) {
        console.log(`Loading V3 processed data for: ${songName}`);

        // V4.2.39: Try V4 processed directory first (with new kebab-case names)
        const backendId = this.toBackendId(songName);

        if (backendId && fs.existsSync(this.v4ProcessedDir)) {
            const v4Path = path.join(this.v4ProcessedDir, backendId, 'relationships.json');
            if (fs.existsSync(v4Path)) {
                console.log(`  ✓ Found in V4: ${backendId}/relationships.json`);
                return JSON.parse(fs.readFileSync(v4Path, 'utf8'));
            }
        }

        // Fallback to V3 directory (legacy)
        if (fs.existsSync(this.v3ProcessedDir)) {
            const songDirs = fs.readdirSync(this.v3ProcessedDir).filter(f =>
                fs.statSync(path.join(this.v3ProcessedDir, f)).isDirectory() &&
                fs.existsSync(path.join(this.v3ProcessedDir, f, 'relationships.json'))
            );

            const normalizedSongName = normalize(songName);
            const matchedDir = songDirs.find(dir => normalize(dir) === normalizedSongName);

            if (matchedDir) {
                const relationshipsPath = path.join(this.v3ProcessedDir, matchedDir, 'relationships.json');
                console.log(`  ✓ Found in V3: ${matchedDir}/relationships.json`);
                return JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));
            }

            // Try direct path
            const directPath = path.join(this.v3ProcessedDir, songName, 'relationships.json');
            if (fs.existsSync(directPath)) {
                return JSON.parse(fs.readFileSync(directPath, 'utf8'));
            }
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
                title: relationshipsData.metadata?.title || relationshipsData.metadata?.songName || songDir,
                optimalTuning: relationshipsData.metadata?.optimalTuning,  // No fallback - let server calculate
                genre: relationshipsData.metadata?.genre || 'Traditional'
            },
            notes: relationshipsData.notes ? relationshipsData.notes.map((note, index) => {
                // V4.3.15: Handle both V3 format (note.pitch.step) and V4 format (note.pitch = "E4")
                let step, octave, pitch;

                if (typeof note.pitch === 'string') {
                    // V4 format: pitch is "E4" directly
                    pitch = note.pitch;
                    step = note.pitch.replace(/[0-9]/g, '');
                    octave = parseInt(note.pitch.match(/[0-9]/)?.[0]) || 4;
                } else {
                    // V3 format: pitch is object with step/octave
                    step = note.pitch?.step || note.pitch?.fullNote?.replace(/[0-9]/g, '') || 'C';
                    octave = note.pitch?.octave || parseInt(note.pitch?.fullNote?.match(/[0-9]/)?.[0]) || 4;
                    pitch = step + octave;
                }

                // V4.3.15: Handle both duration formats
                let duration;
                if (typeof note.duration === 'number') {
                    // V4 format: duration is number directly (already normalized in relationships)
                    duration = note.duration / 4;  // Normalize to quarter notes
                } else {
                    // V3 format: duration.value
                    duration = note.duration?.value ? note.duration.value / 4 : 1;
                }

                // V4.3.16: Normalize lyric to string
                let lyric = '';
                if (typeof note.lyrics === 'string') {
                    lyric = note.lyrics;
                } else if (note.lyrics?.text) {
                    lyric = note.lyrics.text;
                } else if (note.lyric) {
                    lyric = note.lyric;
                }

                return {
                    index: index,
                    step: step,
                    octave: octave,
                    pitch: pitch,
                    duration: duration,
                    isGrace: note.isGrace || false,
                    lyric: lyric
                };
            }) : []
        };
    }
}

module.exports = DataLoader;
