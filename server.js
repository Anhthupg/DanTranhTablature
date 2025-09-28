const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp3': 'audio/mpeg',
    '.xml': 'text/xml'
};

const server = http.createServer((req, res) => {
    // Handle root request
    let filePath = req.url === '/' ? '/index.html' : req.url;

    // Decode URL-encoded characters (e.g., %20 to space)
    filePath = decodeURIComponent(filePath);

    // Security: prevent directory traversal
    filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');

    // Full file path
    const fullPath = path.join(__dirname, filePath);

    // Get file extension for MIME type
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'text/plain';

    // Check if file exists
    fs.access(fullPath, fs.constants.R_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        // Read and serve the file
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                return;
            }

            // Set CORS headers to allow cross-origin requests
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });

            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🎵  Đàn Tranh Music Library Server v3.7  🎵           ║
║                                                            ║
║     Server running at: http://localhost:${PORT}              ║
║                                                            ║
║     Press Ctrl+C to stop the server                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Logs:
`);
});

// Log requests
server.on('request', (req, res) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
});