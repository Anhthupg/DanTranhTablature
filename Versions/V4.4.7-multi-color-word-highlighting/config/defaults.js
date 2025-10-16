/**
 * Default Configuration for V4 Server
 * Centralized defaults for templates, paths, and system behavior
 *
 * @module config/defaults
 * @since V4.2.43
 */

const path = require('path');

// Base directory configuration
const BASE_DIR = path.resolve(__dirname, '..');

/**
 * Server configuration
 */
const SERVER = {
    port: process.env.PORT || 3006,
    host: 'localhost',
    timeout: 30000, // 30 seconds
};

/**
 * Path configuration
 */
const PATHS = {
    base: BASE_DIR,
    templates: path.join(BASE_DIR, 'templates'),
    components: path.join(BASE_DIR, 'templates', 'components'),
    sections: path.join(BASE_DIR, 'templates', 'sections'),
    data: path.join(BASE_DIR, 'data'),
    processed: path.join(BASE_DIR, 'data', 'processed'),
    relationships: path.join(BASE_DIR, 'data', 'relationships'),
    lyricsSegmentations: path.join(BASE_DIR, 'data', 'lyrics-segmentations'),
    patterns: path.join(BASE_DIR, 'data', 'patterns'),
    culturalEnhanced: path.join(BASE_DIR, 'data', 'cultural-enhanced'),
    figurativeEnhanced: path.join(BASE_DIR, 'data', 'figurative-enhanced'),
    library: path.join(BASE_DIR, 'data', 'library'),
    controllers: path.join(BASE_DIR, 'controllers'),
};

/**
 * Template configuration
 */
const TEMPLATES = {
    // Main templates
    main: 'v4-vertical-header-sections-annotated.html',
    libraryCard: 'library-card.html',

    // Default template settings
    cacheEnabled: process.env.NODE_ENV === 'production',
    maxNestingDepth: 10,
    validatePlaceholders: process.env.NODE_ENV === 'development',
    throwOnMissing: false,
};

/**
 * Component mapping
 * Maps placeholder names to component files
 */
const COMPONENTS = {
    'WORD_CLOUD_COMPONENT': 'word-cloud-visualization.html',
    'RADAR_CHART_COMPONENT': 'thematic-radar-chart.html',
    'SONG_RADAR_GALLERY_COMPONENT': 'song-radar-gallery.html',
    'WORD_JOURNEY_SANKEY_COMPONENT': 'word-journey-sankey.html',
    'GLISSANDO_PANEL': 'glissando-panel.html',
    'VOCABULARY_METRICS_SECTION': 'vocabulary-metrics-section.html',
    'ANNOTATED_PHRASES_SECTION': 'annotated-phrases-section.html',
    'LYRICS_SECTION': 'lyrics-section.html',
    'TAP_CHEVRON': 'tap-chevron-component.html',
    'VIBRATO_SINEWAVE': 'vibrato-sinewave.html',
};

/**
 * String configuration
 * Standard 17-string đàn tranh tuning starting at E3
 */
const STRING_CONFIG = {
    startNote: { note: 'E', octave: 3 },
    totalStrings: 17,
    tuningSystem: 'pentatonic', // C, D, E, G, A
    defaultZoom: 0.67,
    minStringsToDisplay: 5,
};

/**
 * Visual configuration
 * 12-color optimized palette and styling
 */
const VISUAL = {
    // Primary note types (4 colors)
    colors: {
        mainNote: { fill: '#008080', stroke: '#005959', text: '#FFFFFF' },
        graceNote: { fill: '#FFD700', stroke: '#CC9900', text: '#4A3C00' },
        tone: { fill: '#9B59B6', stroke: '#7D3C98', text: '#FFFFFF' },
        melisma: { fill: '#E74C3C', stroke: '#C0392B', text: '#FFFFFF' },

        // Pattern categories
        kpic: ['#0066CC', '#3498DB', '#5DADE2', '#85C1E9'],
        kric: ['#27AE60', '#52BE80', '#76D7A4', '#A9DFBF'],
    },

    // Glow system
    glow: {
        level1: '0 0 10px rgba(color, 0.4)',
        level2: '0 0 20px rgba(color, 0.6)',
        level3: '0 0 30px rgba(color, 0.8)',
        level4: '0 0 40px rgba(color, 1.0)',
    },

    // Note sizes
    noteRadius: {
        main: 12,
        grace: 6,
    },
};

/**
 * Data processing configuration
 */
const DATA = {
    // Cache settings
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hour in milliseconds

    // Default values for missing data
    defaults: {
        tempo: 120,
        timeSignature: '4/4',
        tuningSystem: 'C-D-E-G-A',
        region: 'Unknown',
    },

    // Pattern analysis
    patterns: {
        maxNestingDepth: 5,
        minPatternLength: 2,
        maxPatternLength: 4,
    },
};

/**
 * Audio playback configuration
 */
const AUDIO = {
    noteSpacing: 85, // pixels per beat
    graceNoteSpacing: 21.25, // 85/4 for grace notes
    playbackSpeed: 1.0,
    volume: 0.7,
};

/**
 * Development settings
 */
const DEV = {
    debug: process.env.NODE_ENV === 'development',
    logTemplates: false,
    logData: false,
    logPerformance: false,
};

module.exports = {
    SERVER,
    PATHS,
    TEMPLATES,
    COMPONENTS,
    STRING_CONFIG,
    VISUAL,
    DATA,
    AUDIO,
    DEV,

    // Convenience exports
    BASE_DIR,
    NODE_ENV: process.env.NODE_ENV || 'development',
};
