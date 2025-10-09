// V4 Localhost Server
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3004; // V4 on port 3004

// Serve static files from V4 data directory
app.use(express.static(path.join(__dirname, 'data', 'processed')));

// V4 Main page - Song list
app.get('/', (req, res) => {
    const processedDir = path.join(__dirname, 'data', 'processed');

    if (!fs.existsSync(processedDir)) {
        return res.send(`
            <h1>V4 System</h1>
            <p>No V4 songs generated yet.</p>
            <p>Run: <code>node generate-all-v4.js</code> to populate V4 songs</p>
        `);
    }

    const songs = fs.readdirSync(processedDir)
        .filter(dir => fs.statSync(path.join(processedDir, dir)).isDirectory())
        .map(dir => {
            const songName = dir.replace(/_/g, ' ');
            return {
                name: songName,
                path: `/${dir}/v4-analysis.html`,
                directory: dir
            };
        });

    const songList = songs.map(song =>
        `<li><a href="${song.path}" target="_blank">${song.name}</a></li>`
    ).join('');

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dan Tranh Tablature V4 - Advanced Analysis</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
                h1 { color: #3498db; }
                ul { list-style: none; padding: 0; }
                li { margin: 10px 0; }
                a { text-decoration: none; color: #2c3e50; font-weight: bold; }
                a:hover { color: #3498db; }
                .stats { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>Dan Tranh Tablature V4</h1>
            <p><strong>Advanced Linguistic-Musical Analysis System</strong></p>

            <div class="stats">
                <h3>V4 Features</h3>
                <ul>
                    <li>• Working move functionality (built-in)</li>
                    <li>• Full-width layout system</li>
                    <li>• Multiple tablature references</li>
                    <li>• Customizable analysis sections</li>
                    <li>• Interactive highlighting foundation</li>
                </ul>
            </div>

            <h2>V4 Song Collection (${songs.length} songs)</h2>
            <ul>
                ${songList}
            </ul>

            <div class="stats">
                <h3>Development</h3>
                <p>V4 Port: 3004 | V3 Port: 3002</p>
                <p>V4 Generator: <code>node generators/v4-clean-generator.js "Song Name"</code></p>
                <p>Batch Generate: <code>node generate-all-v4.js</code></p>
            </div>
        </body>
        </html>
    `);
});

// Individual song pages
app.get('/:songDir/v4-analysis.html', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'processed', req.params.songDir, 'v4-analysis.html');

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('V4 analysis not found');
    }
});

app.listen(port, () => {
    console.log(`🚀 V4 Server running on http://localhost:${port}`);
    console.log(`📁 Serving V4 analysis pages from: data/processed/`);
});