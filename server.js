const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('.'));

// Routes for different versions
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'comparison-dashboard.html'));
});

// Original version
app.get('/original', (req, res) => {
    res.sendFile(path.join(__dirname, 'analytical_tablature.html'));
});

// New version (when it exists)
app.get('/v2', (req, res) => {
    const v2Path = path.join(__dirname, 'v2', 'index.html');
    if (fs.existsSync(v2Path)) {
        res.sendFile(v2Path);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>V2 - Not Yet Created</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .message {
                        text-align: center;
                        padding: 40px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 10px;
                        backdrop-filter: blur(10px);
                    }
                    h1 { margin-bottom: 20px; }
                    p { font-size: 18px; opacity: 0.9; }
                    .status {
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 5px;
                        display: inline-block;
                    }
                </style>
            </head>
            <body>
                <div class="message">
                    <h1>V2 Development Area</h1>
                    <p>The new scalable version will appear here once development begins.</p>
                    <div class="status">Ready for parallel development</div>
                </div>
            </body>
            </html>
        `);
    }
});

// API endpoint for data extraction from original
app.get('/api/extract-original-data', (req, res) => {
    // This would be called by v2 to get data from original
    res.json({
        message: 'Data extraction endpoint ready',
        instructions: 'Use client-side JavaScript to extract data from original'
    });
});

// API endpoint for v2 data (when available)
app.get('/api/v2/data/:type', (req, res) => {
    const dataType = req.params.type;
    const v2DataPath = path.join(__dirname, 'v2', 'data', 'test-song', `${dataType}.json`);

    if (fs.existsSync(v2DataPath)) {
        const data = JSON.parse(fs.readFileSync(v2DataPath, 'utf8'));
        res.json(data);
    } else {
        res.status(404).json({ error: `Data type '${dataType}' not found` });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        versions: {
            original: fs.existsSync(path.join(__dirname, 'analytical_tablature.html')),
            v2: fs.existsSync(path.join(__dirname, 'v2', 'index.html'))
        },
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     Dan Tranh Tablature Development Server                ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  🚀 Server running at: http://localhost:${PORT}              ║
║                                                            ║
║  📍 Available routes:                                      ║
║     • Dashboard:    http://localhost:${PORT}/                ║
║     • Original:     http://localhost:${PORT}/original        ║
║     • Version 2:    http://localhost:${PORT}/v2              ║
║     • Health:       http://localhost:${PORT}/api/health      ║
║                                                            ║
║  📂 Static files served from: ./                          ║
║                                                            ║
║  💡 Tips:                                                  ║
║     • Use the dashboard for side-by-side comparison       ║
║     • Original version is read-only                       ║
║     • V2 development happens in /v2 directory             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});