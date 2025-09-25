const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve V2 static files
app.use(express.static('v2'));
app.use('/src', express.static('v2/src'));
app.use('/data', express.static('v2/data'));

// Main V2 route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'v2', 'index.html'));
});

// Data extraction tool
app.get('/extractor', (req, res) => {
    res.sendFile(path.join(__dirname, 'v2', 'src', 'migration', 'data-extractor.html'));
});

// API endpoints for V2 data
app.get('/api/data/:type', (req, res) => {
    const dataType = req.params.type;
    const dataPath = path.join(__dirname, 'v2', 'data', 'test-song', `${dataType}.json`);

    if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        res.json(data);
    } else {
        res.status(404).json({
            error: `Data type '${dataType}' not found`,
            available: ['notes', 'patterns', 'sections', 'strings']
        });
    }
});

// Save extracted data
app.post('/api/data/:type', (req, res) => {
    const dataType = req.params.type;
    const dataPath = path.join(__dirname, 'v2', 'data', 'test-song');

    // Create directory if it doesn't exist
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
    }

    const filePath = path.join(dataPath, `${dataType}.json`);
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));

    res.json({
        success: true,
        message: `${dataType} data saved`,
        path: filePath
    });
});

// List available songs
app.get('/api/songs', (req, res) => {
    const dataDir = path.join(__dirname, 'v2', 'data');

    if (fs.existsSync(dataDir)) {
        const songs = fs.readdirSync(dataDir).filter(dir => {
            return fs.statSync(path.join(dataDir, dir)).isDirectory();
        });
        res.json(songs);
    } else {
        res.json(['test-song']);
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        version: 'v2.0',
        port: PORT,
        environment: 'development',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     Dan Tranh Tablature - V2 (Development)                ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  🚀 Server running at: http://localhost:${PORT}              ║
║                                                            ║
║  📍 Available routes:                                      ║
║     • Main:       http://localhost:${PORT}/                  ║
║     • Extractor:  http://localhost:${PORT}/extractor         ║
║     • API:        http://localhost:${PORT}/api/              ║
║                                                            ║
║  💡 This is the NEW SCALABLE VERSION                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});