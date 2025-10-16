// Static Routes Module - Extracted from vertical-demo-server.js
// Handles all static file serving and controller endpoints

const path = require('path');

module.exports = function(app, baseDir) {
    // Serve static files
    app.use('/static', require('express').static(path.join(baseDir, 'templates')));

    // Client-side tablature generator
    app.get('/static/client-tablature-generator.js', (req, res) => {
        res.sendFile(path.join(baseDir, 'client-tablature-generator.js'));
    });

    // V4.0.5: Zoom controller
    app.get('/zoom-controller.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'zoom-controller.js'));
    });

    // V4.0.9: Library controller
    app.get('/library-controller.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'library-controller.js'));
    });

    // V4.0.11: Visual state controller
    app.get('/visual-state-controller.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'visual-state-controller.js'));
    });

    // V4.0.12: Audio playback controller
    app.get('/audio-playback-controller.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path.join(baseDir, 'audio-playback-controller.js'));
    });

    // V4: Audio controller v2 (cache-busted version)
    app.get('/audio-playback-controller-v2.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path.join(baseDir, 'audio-playback-controller-v2.js'));
    });

    // V4.0.13: Visual state manager
    app.get('/visual-state-manager.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'visual-state-manager.js'));
    });

    // V4.2.0: Lyrics controller
    app.get('/lyrics-controller.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'lyrics-controller.js'));
    });

    // V4.2.5: Phrase bars controller
    app.get('/phrase-bars-controller.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'phrase-bars-controller.js'));
    });

    // V4.2.22: Debug label generator component
    app.get('/debug-label-generator.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'templates', 'components', 'debug-label-generator.js'));
    });

    // V4.3.5: Pattern visualization controller
    app.get('/pattern-visualization-controller.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'controllers', 'pattern-visualization-controller.js'));
    });

    // Glissando controller
    app.get('/glissando-controller.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'glissando-controller.js'));
    });

    // V4.3.34: Fingering controller (3-stage toggle: All/1/3/Hide)
    app.get('/fingering-controller.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(baseDir, 'fingering-controller.js'));
    });

    // All Tablatures Viewer page
    app.get('/tablatures', (req, res) => {
        const tablatureViewerPath = path.join(baseDir, 'templates', 'all-tablatures-viewer.html');
        res.sendFile(tablatureViewerPath);
    });

    // Serve tablature SVG files
    app.use('/data/tablatures', require('express').static(path.join(baseDir, 'data', 'tablatures')));

    // Serve pattern analysis JSON files (V4.3.5: Tier 3 patterns)
    app.use('/data/patterns', require('express').static(path.join(baseDir, 'data', 'patterns')));
};
