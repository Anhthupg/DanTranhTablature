// Vertical Header Demo Server - Dedicated server for vertical layout
// V4.2.42: Phase 2 Refactoring - Service Layer Architecture

const express = require('express');
const path = require('path');
const ServerTablatureGenerator = require('./server-tablature-generator');

// V4.2.41: Template system
const TemplateLoader = require('./utils/template-loader');
const TemplateComposer = require('./utils/template-composer');

const app = express();
const port = process.env.PORT || 3006;

// Create generator instance (still needed for API routes)
const tablatureGen = new ServerTablatureGenerator();

// Initialize template system
const templateLoader = new TemplateLoader(__dirname);
const templateComposer = new TemplateComposer(templateLoader);

// ============================================================================
// ROUTE MODULES - Clean separation of concerns
// ============================================================================

// Main page routes (with service layer)
require('./routes/main-page')(app, __dirname, templateComposer);

// Static file serving and controllers
require('./routes/static-routes')(app, __dirname);

// API endpoints
require('./routes/api-routes')(app, __dirname, tablatureGen);

// ============================================================================
// ADDITIONAL API ENDPOINTS
// ============================================================================

const fs = require('fs');

// Word Journey Sankey API endpoint
app.get('/api/word-journey-sankey', (req, res) => {
    try {
        const sankeyPath = path.join(__dirname, 'data', 'word-journey-sankey.json');

        // Check if sankey file exists and is recent (< 1 hour old)
        if (fs.existsSync(sankeyPath)) {
            const stats = fs.statSync(sankeyPath);
            const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60;

            if (ageMinutes < 60) {
                const sankeyData = JSON.parse(fs.readFileSync(sankeyPath, 'utf8'));
                res.json(sankeyData);
                console.log(`[API] Word journey sankey served from cache (${ageMinutes.toFixed(1)} min old)`);
                return;
            }
        }

        // Regenerate if old or missing
        const { generateWordJourneySankey } = require('./generate-word-journey-sankey');
        generateWordJourneySankey();

        const sankeyData = JSON.parse(fs.readFileSync(sankeyPath, 'utf8'));
        res.json(sankeyData);
        console.log('[API] Word journey sankey regenerated and served');
    } catch (error) {
        console.error('[API] Word journey sankey error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Vibrato controller
app.get('/vibrato-controller.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'vibrato-controller.js'));
});

// Vibrato test HTML
app.get('/vibrato-test.html', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, 'vibrato-test.html'));
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(port, () => {
    console.log(`🚀 Vertical Header Demo Server running on http://localhost:${port}`);
    console.log(`📋 Features:`);
    console.log(`   • Vertical headers (80px left panels)`);
    console.log(`   • Move arrows (▲ ▼) in vertical layout`);
    console.log(`   • Metric cards with cross-highlighting`);
    console.log(`   • Complete UI terminology annotations`);
    console.log(`   • Interactive tablature with data attributes`);
    console.log(`\n🏗️  Architecture:`);
    console.log(`   • Service Layer: song-data, tuning, tablature, lyrics, phrase`);
    console.log(`   • Route Modules: main-page, static-routes, api-routes`);
    console.log(`   • Template System: TemplateLoader + TemplateComposer`);
    console.log(`\n✨ Perfect for your 100+ metrics statistical analysis!`);
});

module.exports = app;
