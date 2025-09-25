const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static('.'));

// Serve original version only
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'analytical_tablature.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     Dan Tranh Tablature - ORIGINAL (Production)           ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  📍 Server running at: http://localhost:${PORT}              ║
║                                                            ║
║  ⚠️  This is your WORKING VERSION - Read Only             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});