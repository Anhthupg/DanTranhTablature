/**
 * Dan Tranh Library Integration Script v3.0
 * Updates existing library to use the new dynamic string system
 * Supports 1-30+ strings with proportional spacing
 */

// Import the module (adjust path as needed)
import { DanTranhTablature } from './danTranh.module.js';

/**
 * Integration class to update existing library
 */
class LibraryIntegration {
    constructor() {
        this.tablatureInstances = new Map();
        this.currentSongData = null;
    }

    /**
     * Initialize the integration on page load
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Setup integration with existing library
     */
    setup() {
        console.log('🎵 Initializing Dan Tranh Dynamic String System v3...');

        // Find all song thumbnails
        this.setupThumbnails();

        // Setup song viewer if it exists
        this.setupSongViewer();

        // Add global styles
        this.addGlobalStyles();

        // Listen for navigation changes
        this.setupNavigationListeners();
    }

    /**
     * Setup thumbnails to show string count
     */
    setupThumbnails() {
        const thumbnails = document.querySelectorAll('.song-thumbnail, .song-card, [data-song-id], .song-item');

        thumbnails.forEach(thumbnail => {
            // Extract song data from thumbnail
            const songId = thumbnail.dataset.songId || thumbnail.id || this.extractSongIdFromElement(thumbnail);
            if (!songId) return;

            // Add string count indicator
            this.addStringCountIndicator(thumbnail, songId);
        });

        console.log(`✅ Updated ${thumbnails.length} song thumbnails`);
    }

    /**
     * Extract song ID from various element structures
     */
    extractSongIdFromElement(element) {
        // Try href attribute
        const link = element.querySelector('a[href*="song"]') || element.closest('a[href*="song"]');
        if (link) {
            const match = link.href.match(/song[s]?\/([^\/]+)/i);
            if (match) return match[1];
        }

        // Try title or text content
        const title = element.querySelector('.song-title, h3, h4');
        if (title) {
            return this.titleToId(title.textContent);
        }

        return null;
    }

    /**
     * Convert title to ID format
     */
    titleToId(title) {
        return title.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    /**
     * Add string count indicator to thumbnail
     */
    addStringCountIndicator(thumbnail, songId) {
        // Create indicator element
        const indicator = document.createElement('div');
        indicator.className = 'string-count-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10;
        `;

        // Get string count for this song
        const stringCount = this.getStringCountForSong(songId);
        indicator.textContent = `${stringCount} strings`;

        // Add to thumbnail
        thumbnail.style.position = 'relative';
        thumbnail.appendChild(indicator);
    }

    /**
     * Get string count for a specific song
     */
    getStringCountForSong(songId) {
        // Extract from song data or detect dynamically
        const songElement = document.querySelector(`[data-song-id="${songId}"]`);
        if (songElement) {
            const songData = this.extractSongData(songElement);
            if (songData && songData.notes) {
                const usedStrings = this.detectUsedStrings(songData.notes);
                return usedStrings.length;
            }
        }

        // Default string counts for known songs
        const songStringCounts = {
            'ba_rang_ba_ri': 7,
            'xia_ca_me': 4,
            'single_string': 1,
            'two_string': 2,
            // Will be dynamically detected
        };

        return songStringCounts[songId] || 'auto';
    }

    /**
     * Extract song data from element
     */
    extractSongData(element) {
        // Try to extract from data attributes
        const dataStr = element.dataset.songData;
        if (dataStr) {
            try {
                return JSON.parse(dataStr);
            } catch (e) {
                console.warn('Failed to parse song data:', e);
            }
        }

        // Try to extract from script tag
        const scriptTag = element.querySelector('script[type="application/json"]');
        if (scriptTag) {
            try {
                return JSON.parse(scriptTag.textContent);
            } catch (e) {
                console.warn('Failed to parse script data:', e);
            }
        }

        return null;
    }

    /**
     * Detect which strings are used in the notes
     */
    detectUsedStrings(notes) {
        const usedPitches = new Set();
        notes.forEach(note => {
            if (note.pitch && !note.bent) {
                usedPitches.add(note.pitch);
            }
        });
        return Array.from(usedPitches);
    }

    /**
     * Setup the song viewer with new tablature system
     */
    setupSongViewer() {
        // Find existing tablature container
        const existingContainers = document.querySelectorAll(
            '.tablature-container, .song-viewer, #tablatureSvg, [data-tablature]'
        );

        existingContainers.forEach(container => {
            // Replace with new dynamic system
            this.replaceTablature(container);
        });
    }

    /**
     * Replace old tablature with new dynamic system
     */
    replaceTablature(oldContainer) {
        // Get parent element
        const parent = oldContainer.parentElement;

        // Try to extract existing song data
        const existingData = this.extractExistingTablatureData(oldContainer);

        // Create new container
        const newContainer = document.createElement('div');
        newContainer.id = 'dynamic-tablature-' + Date.now();
        newContainer.className = 'dynamic-tablature-container';

        // Add controls
        const controls = this.createControls(newContainer.id);
        parent.insertBefore(controls, oldContainer);

        // Replace old container
        parent.replaceChild(newContainer, oldContainer);

        // Initialize new tablature system
        const tablature = new DanTranhTablature(newContainer.id, {
            showIntervals: true,
            showBending: true,
            displayMode: 'played',
            onNoteClick: (note, index) => this.handleNoteClick(note, index)
        });

        // Store instance
        this.tablatureInstances.set(newContainer.id, tablature);

        // Load existing data if available
        if (existingData) {
            tablature.loadSong(existingData);
        }

        console.log(`✅ Replaced tablature with dynamic system: ${newContainer.id}`);

        return tablature;
    }

    /**
     * Extract data from existing tablature
     */
    extractExistingTablatureData(container) {
        // Try to find notes in SVG
        const notes = [];
        const circles = container.querySelectorAll('circle[data-note], .note, .note-circle');

        circles.forEach(circle => {
            const pitch = circle.dataset.pitch || circle.dataset.note;
            const time = parseFloat(circle.dataset.time || circle.getAttribute('cx') / 30 - 4);
            const duration = parseFloat(circle.dataset.duration || 1);

            if (pitch) {
                notes.push({ pitch, time, duration });
            }
        });

        if (notes.length > 0) {
            // Detect open strings from the notes
            const openStrings = this.detectOpenStrings(notes);

            return {
                title: document.querySelector('#songTitle')?.textContent || 'Unknown Song',
                notes: notes,
                openStrings: openStrings
            };
        }

        return null;
    }

    /**
     * Create control panel for tablature
     */
    createControls(containerId) {
        const controls = document.createElement('div');
        controls.className = 'tablature-controls';
        controls.style.cssText = `
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        `;

        controls.innerHTML = `
            <div class="control-group">
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 5px;">Display Mode</label>
                <select id="displayMode-${containerId}" class="display-mode-selector" style="
                    padding: 8px;
                    border: 2px solid #667eea;
                    border-radius: 5px;
                    background: white;
                    cursor: pointer;
                ">
                    <option value="played">Only Played Strings</option>
                    <option value="all">All Available Strings</option>
                </select>
            </div>

            <div class="control-group">
                <label style="font-size: 12px; color: #666; display: block; margin-bottom: 5px;">String Spacing</label>
                <input type="range" id="spacing-${containerId}" min="10" max="40" value="20" style="width: 100px;">
                <span id="spacingValue-${containerId}" style="margin-left: 10px; font-weight: bold; color: #667eea;">20px</span>
            </div>

            <div class="control-group">
                <input type="checkbox" id="showIntervals-${containerId}" checked>
                <label for="showIntervals-${containerId}" style="margin-left: 5px; cursor: pointer;">Show Intervals</label>
            </div>

            <div class="control-group">
                <input type="checkbox" id="showBending-${containerId}" checked>
                <label for="showBending-${containerId}" style="margin-left: 5px; cursor: pointer;">Show Bending</label>
            </div>

            <button id="export-${containerId}" style="
                padding: 8px 15px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">Export SVG</button>
        `;

        // Add event listeners
        setTimeout(() => this.setupControlListeners(containerId), 100);

        return controls;
    }

    /**
     * Setup control event listeners
     */
    setupControlListeners(containerId) {
        const tablature = this.tablatureInstances.get(containerId);
        if (!tablature) return;

        // Display mode
        const displayMode = document.getElementById(`displayMode-${containerId}`);
        if (displayMode) {
            displayMode.addEventListener('change', (e) => {
                tablature.setOptions({ displayMode: e.target.value });
            });
        }

        // Spacing
        const spacing = document.getElementById(`spacing-${containerId}`);
        const spacingValue = document.getElementById(`spacingValue-${containerId}`);
        if (spacing) {
            spacing.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                spacingValue.textContent = value + 'px';
                tablature.setOptions({ baseSpacing: value });
            });
        }

        // Show intervals
        const showIntervals = document.getElementById(`showIntervals-${containerId}`);
        if (showIntervals) {
            showIntervals.addEventListener('change', (e) => {
                tablature.setOptions({ showIntervals: e.target.checked });
            });
        }

        // Show bending
        const showBending = document.getElementById(`showBending-${containerId}`);
        if (showBending) {
            showBending.addEventListener('change', (e) => {
                tablature.setOptions({ showBending: e.target.checked });
            });
        }

        // Export
        const exportBtn = document.getElementById(`export-${containerId}`);
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const svgString = tablature.exportSVG();
                this.downloadSVG(svgString, 'tablature.svg');
            });
        }
    }

    /**
     * Download SVG file
     */
    downloadSVG(svgString, filename) {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Handle note click events
     */
    handleNoteClick(note, index) {
        console.log('Note clicked:', note, 'at index:', index);

        // You can add custom behavior here
        // For example, play the note sound, show details, etc.
        if (this.onNoteClick) {
            this.onNoteClick(note, index);
        }
    }

    /**
     * Setup navigation listeners for SPA routing
     */
    setupNavigationListeners() {
        // Listen for URL changes
        window.addEventListener('popstate', () => this.handleNavigation());

        // Listen for link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href*="song"], .song-link');
            if (link) {
                setTimeout(() => this.handleNavigation(), 100);
            }
        });

        // Listen for custom navigation events
        window.addEventListener('songChanged', (e) => {
            this.loadSongData(e.detail);
        });
    }

    /**
     * Handle navigation changes
     */
    handleNavigation() {
        // Check if we're on a song page
        const songMatch = window.location.pathname.match(/song[s]?\/([^\/]+)/);
        if (songMatch) {
            const songId = songMatch[1];
            this.loadSongById(songId);
        }
    }

    /**
     * Load song by ID
     */
    loadSongById(songId) {
        // This would fetch from your API/database
        console.log(`Loading song: ${songId}`);

        // Example: fetch from API
        // fetch(`/api/songs/${songId}`)
        //     .then(res => res.json())
        //     .then(data => this.loadSongData(data));
    }

    /**
     * Load song data into tablature
     */
    loadSongData(songData) {
        // Find the active tablature instance
        const tablature = Array.from(this.tablatureInstances.values())[0];
        if (!tablature) {
            console.warn('No tablature instance found');
            return;
        }

        // Convert your song format to the expected format
        const convertedSong = this.convertSongFormat(songData);

        // Load into tablature
        tablature.loadSong(convertedSong);

        console.log(`✅ Loaded song: ${convertedSong.title}`);
    }

    /**
     * Convert existing song format to new format
     */
    convertSongFormat(oldFormat) {
        // Handle various format types
        let notes = [];

        if (oldFormat.notes && Array.isArray(oldFormat.notes)) {
            notes = oldFormat.notes;
        } else if (oldFormat.noteData && Array.isArray(oldFormat.noteData)) {
            notes = oldFormat.noteData.map(note => ({
                pitch: note.pitch || note.note,
                time: note.time || note.position || note.x,
                duration: note.duration || note.length || 1,
                grace: note.grace || false,
                bent: note.bent || false
            }));
        } else if (oldFormat.tablature) {
            // Extract from tablature format
            notes = this.extractNotesFromTablature(oldFormat.tablature);
        }

        // Ensure notes are properly formatted
        notes = notes.map(note => ({
            pitch: this.normalizePitch(note.pitch || note.note),
            time: parseFloat(note.time || 0),
            duration: parseFloat(note.duration || 1),
            grace: note.grace || false,
            bent: note.bent || false
        }));

        return {
            title: oldFormat.title || oldFormat.name || 'Unknown Song',
            composer: oldFormat.composer || oldFormat.author || 'Traditional',
            notes: notes,
            openStrings: oldFormat.openStrings || this.detectOpenStrings(notes)
        };
    }

    /**
     * Normalize pitch notation
     */
    normalizePitch(pitch) {
        if (!pitch) return 'Unknown';

        // Handle various notations
        pitch = pitch.toString().trim();

        // Convert lowercase to uppercase
        pitch = pitch.charAt(0).toUpperCase() + pitch.slice(1);

        // Handle flat notation variations
        pitch = pitch.replace(/♭/g, 'b').replace(/♯/g, '#');

        return pitch;
    }

    /**
     * Extract notes from tablature format
     */
    extractNotesFromTablature(tablature) {
        const notes = [];

        if (typeof tablature === 'string') {
            // Parse tablature string format
            const lines = tablature.split('\n');
            // Implementation depends on your tablature format
        } else if (typeof tablature === 'object') {
            // Handle object format
            for (const key in tablature) {
                if (tablature[key].pitch) {
                    notes.push(tablature[key]);
                }
            }
        }

        return notes;
    }

    /**
     * Auto-detect open strings from notes
     */
    detectOpenStrings(notes) {
        const usedPitches = new Set();
        notes.forEach(note => {
            if (note.pitch && !note.bent) {
                usedPitches.add(note.pitch);
            }
        });

        return Array.from(usedPitches).sort((a, b) => {
            // Sort by MIDI number
            const midiA = this.noteToMidi(a);
            const midiB = this.noteToMidi(b);
            return midiA - midiB;
        });
    }

    /**
     * Simple note to MIDI conversion
     */
    noteToMidi(note) {
        const noteMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        const parts = note.match(/([A-G])([#b]?)(\d+)/);
        if (!parts) return 0;

        let midi = noteMap[parts[1]];
        if (parts[2] === '#') midi++;
        if (parts[2] === 'b') midi--;
        midi += (parseInt(parts[3]) + 1) * 12;

        return midi;
    }

    /**
     * Add global styles for the integration
     */
    addGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .dynamic-tablature-container {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                overflow-x: auto;
            }

            .string-count-indicator {
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }

            .tablature-controls {
                animation: slideDown 0.3s ease;
            }

            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .note-circle {
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            }

            .note-circle:hover {
                filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.4));
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Song Database Integration
 * Connect with existing song data
 */
class SongDatabase {
    constructor() {
        this.songs = new Map();
        this.loadExistingSongs();
    }

    loadExistingSongs() {
        // Try to load from existing song data
        if (window.songData) {
            this.importSongData(window.songData);
        }

        // Try to load from localStorage
        const stored = localStorage.getItem('danTranhSongs');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.importSongData(data);
            } catch (e) {
                console.warn('Failed to load stored songs:', e);
            }
        }
    }

    importSongData(data) {
        if (Array.isArray(data)) {
            data.forEach(song => this.addSong(song));
        } else if (typeof data === 'object') {
            Object.values(data).forEach(song => this.addSong(song));
        }
    }

    addSong(song) {
        const id = song.id || song.title?.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (id) {
            this.songs.set(id, song);
        }
    }

    getSong(id) {
        return this.songs.get(id);
    }

    getAllSongs() {
        return Array.from(this.songs.values());
    }
}

// Auto-initialize when script loads
const libraryIntegration = new LibraryIntegration();
const songDatabase = new SongDatabase();

libraryIntegration.songDatabase = songDatabase;
libraryIntegration.init();

// Export for manual use
window.DanTranhLibrary = libraryIntegration;
window.DanTranhSongDatabase = songDatabase;

console.log('🎵 Dan Tranh Library Integration v3.0 loaded');
console.log('📚 Access via window.DanTranhLibrary and window.DanTranhSongDatabase');
console.log(`🎼 ${songDatabase.songs.size} songs loaded in database`);