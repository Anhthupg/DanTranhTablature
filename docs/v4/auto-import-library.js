/**
 * V4 Auto-Import Library System
 * Watches for new MusicXML files and automatically updates the library
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

class V4LibraryManager {
    constructor() {
        this.musicXMLDir = path.join(__dirname, 'data', 'musicxml');
        this.libraryFile = path.join(__dirname, 'data', 'library', 'song-library.json');
        this.processedDir = path.join(__dirname, 'data', 'processed');

        // Ensure directories exist
        this.ensureDirectories();
    }

    /**
     * Ensure all required directories exist
     */
    ensureDirectories() {
        const dirs = [
            this.musicXMLDir,
            path.dirname(this.libraryFile),
            this.processedDir
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }

    /**
     * Extract metadata from MusicXML file
     */
    extractMetadata(musicXMLPath) {
        try {
            const xmlContent = fs.readFileSync(musicXMLPath, 'utf8');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Extract basic metadata
            const title = this.extractTitle(xmlDoc);
            const notes = this.extractNotes(xmlDoc);
            const tempo = this.extractTempo(xmlDoc);
            const timeSignature = this.extractTimeSignature(xmlDoc);

            // Calculate metrics
            const totalNotes = notes.length;
            const uniquePitches = [...new Set(notes.map(n => n.pitch))].length;
            const detectedTuning = this.detectTuning(notes);
            const bentNotes = this.countBentNotes(notes, detectedTuning);
            const bentStrings = this.countBentStrings(notes, detectedTuning);

            // Determine region and genre from title
            const region = this.detectRegion(title);
            const genre = this.detectGenre(title);

            return {
                title,
                filename: path.basename(musicXMLPath),
                region,
                genre,
                optimalTuning: detectedTuning,
                totalNotes,
                uniquePitches,
                bentStrings,
                bentNotes,
                tempo,
                timeSignature,
                lastModified: fs.statSync(musicXMLPath).mtime.toISOString(),
                processed: false
            };
        } catch (error) {
            console.error(`Error extracting metadata from ${musicXMLPath}:`, error.message);
            return null;
        }
    }

    /**
     * Extract title from MusicXML
     */
    extractTitle(xmlDoc) {
        const titleElement = xmlDoc.getElementsByTagName('work-title')[0] ||
                           xmlDoc.getElementsByTagName('movement-title')[0];
        return titleElement ? titleElement.textContent.trim() : null;
    }

    /**
     * Extract notes from MusicXML
     */
    extractNotes(xmlDoc) {
        const notes = [];
        const noteElements = xmlDoc.getElementsByTagName('note');

        for (let i = 0; i < noteElements.length; i++) {
            const noteElement = noteElements[i];
            const pitch = this.extractPitch(noteElement);
            const duration = this.extractDuration(noteElement);

            if (pitch) {
                notes.push({ pitch, duration });
            }
        }

        return notes;
    }

    /**
     * Extract pitch from note element
     */
    extractPitch(noteElement) {
        const pitchElement = noteElement.getElementsByTagName('pitch')[0];
        if (!pitchElement) return null;

        const step = pitchElement.getElementsByTagName('step')[0]?.textContent;
        const octave = pitchElement.getElementsByTagName('octave')[0]?.textContent;
        const alter = pitchElement.getElementsByTagName('alter')[0]?.textContent;

        if (!step || !octave) return null;

        let pitch = step;
        if (alter) {
            const alterValue = parseInt(alter);
            if (alterValue > 0) pitch += '#'.repeat(alterValue);
            if (alterValue < 0) pitch += 'b'.repeat(Math.abs(alterValue));
        }

        return pitch + octave;
    }

    /**
     * Extract duration from note element
     */
    extractDuration(noteElement) {
        const durationElement = noteElement.getElementsByTagName('duration')[0];
        return durationElement ? parseInt(durationElement.textContent) : 1;
    }

    /**
     * Extract tempo from MusicXML
     */
    extractTempo(xmlDoc) {
        const tempoElement = xmlDoc.getElementsByTagName('per-minute')[0];
        return tempoElement ? parseInt(tempoElement.textContent) : null;
    }

    /**
     * Extract time signature from MusicXML
     */
    extractTimeSignature(xmlDoc) {
        const beatsElement = xmlDoc.getElementsByTagName('beats')[0];
        const beatTypeElement = xmlDoc.getElementsByTagName('beat-type')[0];

        if (beatsElement && beatTypeElement) {
            return `${beatsElement.textContent}/${beatTypeElement.textContent}`;
        }
        return '4/4'; // Default
    }

    /**
     * Detect tuning system from note frequencies
     */
    detectTuning(notes) {
        const pitchCounts = {};
        notes.forEach(note => {
            const pitchClass = note.pitch.replace(/[0-9]/g, '');
            pitchCounts[pitchClass] = (pitchCounts[pitchClass] || 0) + 1;
        });

        // Get most frequent 5 pitches
        const topPitches = Object.entries(pitchCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([pitch,]) => pitch);

        // Match to known tuning systems
        const tuningSystems = {
            'C-D-E-G-A': ['C', 'D', 'E', 'G', 'A'],
            'C-D-F-G-A': ['C', 'D', 'F', 'G', 'A'],
            'C-D-E-G-Bb': ['C', 'D', 'E', 'G', 'Bb'],
            'C-Eb-F-G-Bb': ['C', 'Eb', 'F', 'G', 'Bb'],
            'D-E-G-A-B': ['D', 'E', 'G', 'A', 'B']
        };

        for (const [tuningName, tuningNotes] of Object.entries(tuningSystems)) {
            const matches = tuningNotes.filter(note => topPitches.includes(note)).length;
            if (matches >= 4) { // At least 4/5 match
                return tuningName;
            }
        }

        return 'C-D-E-G-A'; // Default
    }

    /**
     * Count bent notes for detected tuning
     */
    countBentNotes(notes, tuning) {
        const tuningNotes = tuning.split('-');
        return notes.filter(note => {
            const pitchClass = note.pitch.replace(/[0-9]/g, '');
            return !tuningNotes.includes(pitchClass);
        }).length;
    }

    /**
     * Count bent strings for detected tuning
     */
    countBentStrings(notes, tuning) {
        const tuningNotes = tuning.split('-');
        const bentPitches = new Set();

        notes.forEach(note => {
            const pitchClass = note.pitch.replace(/[0-9]/g, '');
            if (!tuningNotes.includes(pitchClass)) {
                bentPitches.add(pitchClass);
            }
        });

        return bentPitches.size;
    }

    /**
     * Detect region from song title
     */
    detectRegion(title) {
        const titleLower = title.toLowerCase();

        // Northern indicators
        if (titleLower.includes('quan họ') || titleLower.includes('quan ho') ||
            titleLower.includes('bắc') || titleLower.includes('hà nội')) {
            return 'Northern';
        }

        // Southern indicators
        if (titleLower.includes('nam bộ') || titleLower.includes('cải lương') ||
            titleLower.includes('sài gòn') || titleLower.includes('mekong')) {
            return 'Southern';
        }

        // Central indicators
        if (titleLower.includes('huế') || titleLower.includes('trung bộ') ||
            titleLower.includes('hội an') || titleLower.includes('quảng')) {
            return 'Central';
        }

        // Highland indicators
        if (titleLower.includes('tây nguyên') || titleLower.includes('highland') ||
            titleLower.includes('đắk lắk') || titleLower.includes('gia lai')) {
            return 'Highland';
        }

        return 'Unknown';
    }

    /**
     * Detect genre from song title
     */
    detectGenre(title) {
        const titleLower = title.toLowerCase();

        if (titleLower.includes('lý ')) return 'Lý';
        if (titleLower.includes('hò ') || titleLower.includes('ho ')) return 'Hò';
        if (titleLower.includes('ru ') || titleLower.includes('hát ru')) return 'Ru Con';
        if (titleLower.includes('quan họ') || titleLower.includes('quan ho')) return 'Quan Họ';
        if (titleLower.includes('chèo') || titleLower.includes('cheo')) return 'Hát Chèo';
        if (titleLower.includes('xẩm') || titleLower.includes('xam')) return 'Hát Xẩm';
        if (titleLower.includes('ca trù') || titleLower.includes('ca tru')) return 'Ca Trù';

        return 'Traditional';
    }

    /**
     * Scan MusicXML directory and update library
     */
    scanAndUpdateLibrary() {
        console.log('Scanning MusicXML directory for new files...');

        if (!fs.existsSync(this.musicXMLDir)) {
            console.log(`MusicXML directory not found: ${this.musicXMLDir}`);
            return;
        }

        // Load existing library
        let library = [];
        if (fs.existsSync(this.libraryFile)) {
            library = JSON.parse(fs.readFileSync(this.libraryFile, 'utf8'));
        }

        const existingFiles = new Set(library.map(song => song.filename));

        // Scan for MusicXML files
        const files = fs.readdirSync(this.musicXMLDir)
            .filter(file => file.toLowerCase().endsWith('.xml') || file.toLowerCase().endsWith('.musicxml'));

        let newFiles = 0;
        files.forEach(file => {
            if (!existingFiles.has(file)) {
                const filePath = path.join(this.musicXMLDir, file);
                const metadata = this.extractMetadata(filePath);

                if (metadata) {
                    library.push(metadata);
                    newFiles++;
                    console.log(`Added: ${metadata.title} (${metadata.region}, ${metadata.genre})`);
                }
            }
        });

        // Save updated library
        fs.writeFileSync(this.libraryFile, JSON.stringify(library, null, 2));
        console.log(`Library updated: ${newFiles} new files added, ${library.length} total songs`);

        return library;
    }

    /**
     * Get library with sorting and filtering
     */
    getLibrary(sortBy = 'title', filterBy = {}) {
        if (!fs.existsSync(this.libraryFile)) {
            return [];
        }

        let library = JSON.parse(fs.readFileSync(this.libraryFile, 'utf8'));

        // Apply filters
        Object.entries(filterBy).forEach(([key, value]) => {
            if (value && value !== 'all') {
                library = library.filter(song => song[key] === value);
            }
        });

        // Apply sorting
        library.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];

            if (typeof aVal === 'number') {
                return sortBy.includes('bent') ? bVal - aVal : aVal - bVal; // Bent notes: high to low
            }

            return aVal.localeCompare(bVal);
        });

        return library;
    }

    /**
     * Get unique values for filtering
     */
    getFilterOptions() {
        if (!fs.existsSync(this.libraryFile)) {
            return {};
        }

        const library = JSON.parse(fs.readFileSync(this.libraryFile, 'utf8'));

        return {
            regions: [...new Set(library.map(s => s.region))].sort(),
            genres: [...new Set(library.map(s => s.genre))].sort(),
            tunings: [...new Set(library.map(s => s.optimalTuning))].sort(),
            totalNotesRange: {
                min: Math.min(...library.map(s => s.totalNotes)),
                max: Math.max(...library.map(s => s.totalNotes))
            },
            bentNotesRange: {
                min: Math.min(...library.map(s => s.bentNotes)),
                max: Math.max(...library.map(s => s.bentNotes))
            }
        };
    }

    /**
     * Start watching for new files
     */
    startWatching() {
        if (!fs.existsSync(this.musicXMLDir)) {
            console.log('Creating MusicXML directory for file watching...');
            fs.mkdirSync(this.musicXMLDir, { recursive: true });
        }

        console.log(`Watching for new MusicXML files in: ${this.musicXMLDir}`);

        fs.watch(this.musicXMLDir, (eventType, filename) => {
            if (eventType === 'rename' && filename &&
                (filename.toLowerCase().endsWith('.xml') || filename.toLowerCase().endsWith('.musicxml'))) {

                console.log(`New file detected: ${filename}`);
                setTimeout(() => {
                    this.scanAndUpdateLibrary();
                }, 1000); // Wait for file to be fully written
            }
        });
    }
}

// Export for use in other files
module.exports = V4LibraryManager;

// Auto-start if run directly
if (require.main === module) {
    const libraryManager = new V4LibraryManager();

    // Initial scan
    libraryManager.scanAndUpdateLibrary();

    // Start watching
    libraryManager.startWatching();

    console.log('V4 Library Manager is running...');
    console.log(`📁 Place new MusicXML files in: ${libraryManager.musicXMLDir}`);
    console.log('🔄 Library will automatically update when new files are added');
}