const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());

// ONLY serve V3 files, not root directory
app.use(express.static('v3'));

// V3 Progress Monitor
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'v3', 'monitoring', 'progress-dashboard.html'));
});

// V3 Template Test
app.get('/template', (req, res) => {
    res.sendFile(path.join(__dirname, 'v3', 'templates', 'song-viewer-template.html'));
});

// V3 Song Library
app.get('/library', (req, res) => {
    res.sendFile(path.join(__dirname, 'v3', 'index.html'));
});

// API endpoints for development
app.get('/api/v3/status', (req, res) => {
    const fs = require('fs');
    const templateExists = fs.existsSync(path.join(__dirname, 'v3', 'templates', 'song-viewer-template.html'));
    const libraryExists = fs.existsSync(path.join(__dirname, 'v3', 'index.html'));

    res.json({
        version: 'v3.0',
        status: 'development',
        steps: {
            template: templateExists ? 'completed' : 'pending',
            library: libraryExists ? 'completed' : 'pending',
            connections: 'pending',
            testing: 'pending'
        },
        progress: templateExists ? 25 : 0,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     Dan Tranh Tablature - V3 (Development)                ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  🚀 Server running at: http://localhost:${PORT}              ║
║                                                            ║
║  📍 Available routes:                                      ║
║     • Monitor:    http://localhost:${PORT}/                  ║
║     • Template:   http://localhost:${PORT}/template         ║
║     • Library:    http://localhost:${PORT}/library          ║
║     • Status API: http://localhost:${PORT}/api/v3/status    ║
║                                                            ║
║  💡 V3: Smart scaling with V1 experience                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});