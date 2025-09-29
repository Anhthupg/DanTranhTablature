// Layout Demo Server - Compare all 3 interface options
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3005; // Demo server on port 3005

// Serve static template files
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// Hybrid templates routes
app.get('/hybrid1', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'hybrid1-tabbed-sections.html'));
});

app.get('/hybrid2', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'hybrid2-hierarchical-sections.html'));
});

app.get('/hybrid3', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'hybrid3-split-screen-toggle.html'));
});

app.get('/vertical', (req, res) => {
    const verticalTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'v4-vertical-header-sections-annotated.html'), 'utf8');

    // Replace placeholders with sample data
    const populatedTemplate = verticalTemplate
        .replace(/{{SONG_NAME}}/g, 'Lý Chiều Chiều')
        .replace(/{{SVG_WIDTH}}/g, '800')
        .replace(/{{SVG_HEIGHT}}/g, '200')
        .replace(/{{OPTIMAL_SVG_CONTENT}}/g, `
            <!-- Sample tablature content -->
            <line x1="50" y1="50" x2="750" y2="50" stroke="#ddd" stroke-width="3"/>
            <line x1="50" y1="80" x2="750" y2="80" stroke="#ddd" stroke-width="3"/>
            <line x1="50" y1="110" x2="750" y2="110" stroke="#ddd" stroke-width="3"/>
            <line x1="50" y1="140" x2="750" y2="140" stroke="#ddd" stroke-width="3"/>
            <line x1="50" y1="170" x2="750" y2="170" stroke="#ddd" stroke-width="3"/>

            <circle cx="120" cy="80" r="12" fill="#008080" stroke="#005959" stroke-width="2" data-syllable="Lý" data-tone="huyền"/>
            <circle cx="180" cy="110" r="8" fill="#FFD700" stroke="#CC9900" stroke-width="2" data-grace="true"/>
            <circle cx="220" cy="140" r="12" fill="#008080" stroke="#005959" stroke-width="2" data-syllable="chiều" data-tone="ngang"/>
            <circle cx="280" cy="110" r="12" fill="#008080" stroke="#005959" stroke-width="2" data-syllable="chiều" data-tone="ngang"/>
            <circle cx="340" cy="170" r="12" fill="#008080" stroke="#005959" stroke-width="2" data-syllable="về" data-tone="sắc"/>

            <text x="25" y="85" font-size="12" fill="#666">G4</text>
            <text x="25" y="115" font-size="12" fill="#666">D4</text>
            <text x="25" y="145" font-size="12" fill="#666">A3</text>
            <text x="25" y="175" font-size="12" fill="#666">E3</text>
        `)
        .replace(/{{UNIQUE_PITCHES}}/g, '5')
        .replace(/{{PITCH_RANGE}}/g, '17')
        .replace(/{{ASCENDING_PERCENTAGE}}/g, '34.2')
        .replace(/{{TONE_NGANG_PERCENTAGE}}/g, '23.5')
        .replace(/{{TONE_NGA_PERCENTAGE}}/g, '12.5')
        .replace(/{{TONE_MELODY_CORRELATION}}/g, '78.4')
        .replace(/{{MELISMA_COUNT}}/g, '8')
        .replace(/{{GRACE_PERCENTAGE}}/g, '14.0');

    res.send(populatedTemplate);
});

// Main demo page with all options
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>V4 Layout Options + Hybrid Solutions Demo</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f8f9fa;
                }
                .layout-option {
                    background: white;
                    border: 2px solid #ddd;
                    border-radius: 10px;
                    margin: 20px 0;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .option-title {
                    color: #2c3e50;
                    margin: 0 0 10px 0;
                    font-size: 24px;
                }
                .option-description {
                    color: #7f8c8d;
                    margin-bottom: 15px;
                    line-height: 1.6;
                }
                .demo-button {
                    background: #3498db;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    text-decoration: none;
                    display: inline-block;
                    margin-right: 10px;
                }
                .demo-button:hover {
                    background: #2980b9;
                }
                .pros-cons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-top: 15px;
                }
                .pros, .cons {
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .pros {
                    background: #d4edda;
                    border: 1px solid #c3e6cb;
                }
                .cons {
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                }
                .current-choice {
                    background: #fff3cd;
                    border: 2px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <h1 style="text-align: center; color: #2c3e50;">V4 Layout Options Comparison</h1>
            <p style="text-align: center; color: #7f8c8d;">Compare different interface designs for complex musical analysis</p>

            <div class="current-choice">
                <h3 style="margin: 0 0 10px 0; color: #856404;">🎯 Your Current Choice: 10 Focused Collapsible Sections</h3>
                <p style="margin: 0; color: #856404;">
                    <strong>Perfect solution!</strong> Each section focuses on one analysis type (pitch, rhythm, tones, etc.)
                    with cross-highlighting between sections. Users see one thing at a time but connections are visible.
                    Example: "Ngã tone in 80% of melismas on rank #17 notes" highlights across multiple sections.
                </p>
                <a href="/focused" class="demo-button" style="background: #e67e22; margin-top: 10px;">View Your Chosen Layout</a>
            </div>

            <div class="layout-option">
                <h2 class="option-title">Option 1: Interactive Dashboard</h2>
                <p class="option-description">
                    <strong>Layout:</strong> Grid-based dashboard with tablature (top 40%) + 3-panel analysis workspace (bottom 60%)
                    <br><strong>Features:</strong> Metric tree browser, detailed results panel, correlation network visualization, floating actions
                    <br><strong>Best for:</strong> Power users who want to see multiple analysis types simultaneously
                </p>

                <div class="pros-cons">
                    <div class="pros">
                        <strong>✅ Pros:</strong><br>
                        • All analysis visible at once<br>
                        • Professional analytical interface<br>
                        • Efficient for comparing metrics<br>
                        • Handles complex correlations well<br>
                        • Scales to 100+ metrics
                    </div>
                    <div class="cons">
                        <strong>❌ Cons:</strong><br>
                        • Can feel overwhelming<br>
                        • Requires larger screens<br>
                        • Complex to implement<br>
                        • May distract from music focus<br>
                        • Information overload risk
                    </div>
                </div>

                <a href="/templates/option1-interactive-dashboard.html" class="demo-button" target="_blank">View Demo</a>
                <a href="javascript:alert('Grid layout: Tablature 40% + 3 analysis panels 60%')" class="demo-button" style="background: #95a5a6;">Layout Details</a>
            </div>

            <div class="layout-option">
                <h2 class="option-title">Option 2: Tabbed Analysis Environment</h2>
                <p class="option-description">
                    <strong>Layout:</strong> Tablature strip (top 30%) + main tabs + sub-tabs for detailed analysis
                    <br><strong>Features:</strong> 10 main tabs (Overview, Pitch, Rhythm, etc.) with sub-categories, cross-tab linking
                    <br><strong>Best for:</strong> Organized exploration of different analysis types with clear categorization
                </p>

                <div class="pros-cons">
                    <div class="pros">
                        <strong>✅ Pros:</strong><br>
                        • Familiar interface pattern<br>
                        • Clear organization<br>
                        • Easy to implement<br>
                        • Good for step-by-step analysis<br>
                        • Cross-tab navigation
                    </div>
                    <div class="cons">
                        <strong>❌ Cons:</strong><br>
                        • Can't see correlations simultaneously<br>
                        • Requires tab switching<br>
                        • Less visual connection display<br>
                        • May lose analysis flow<br>
                        • Limited cross-reference viewing
                    </div>
                </div>

                <a href="/templates/option2-tabbed-analysis.html" class="demo-button" target="_blank">View Demo</a>
                <a href="javascript:alert('Tabbed layout: Tablature 30% + Main tabs + Sub-tabs')" class="demo-button" style="background: #95a5a6;">Layout Details</a>
            </div>

            <div class="layout-option">
                <h2 class="option-title">Option 3: Mind Map Interface</h2>
                <p class="option-description">
                    <strong>Layout:</strong> Tablature strip (top 20%) + interactive mind map canvas (bottom 80%)
                    <br><strong>Features:</strong> Central song node with expandable branches, visual connections, zoom navigation
                    <br><strong>Best for:</strong> Visual learners who prefer spatial relationship exploration
                </p>

                <div class="pros-cons">
                    <div class="pros">
                        <strong>✅ Pros:</strong><br>
                        • Visually intuitive relationships<br>
                        • Spatial navigation<br>
                        • Beautiful, unique interface<br>
                        • Great for correlation discovery<br>
                        • Engaging user experience
                    </div>
                    <div class="cons">
                        <strong>❌ Cons:</strong><br>
                        • Complex to implement well<br>
                        • May be unfamiliar to users<br>
                        • Hard to show detailed metrics<br>
                        • Requires good spatial design<br>
                        • Performance challenges
                    </div>
                </div>

                <a href="/templates/option3-mind-map-interface.html" class="demo-button" target="_blank">View Demo</a>
                <a href="javascript:alert('Mind map: Central node + 4 primary branches + secondary nodes')" class="demo-button" style="background: #95a5a6;">Layout Details</a>
            </div>

            <hr style="margin: 40px 0; border: none; border-top: 2px solid #ddd;">

            <h2 style="text-align: center; color: #2c3e50; margin: 30px 0;">🔗 Hybrid Solutions</h2>
            <p style="text-align: center; color: #7f8c8d; margin-bottom: 30px;">Combining the best features from multiple approaches</p>

            <div class="layout-option">
                <h2 class="option-title">Hybrid 1: Tabbed Sections with Pop-Out</h2>
                <p class="option-description">
                    <strong>Concept:</strong> Start with tabbed environment (hierarchical clarity + minimal padding) but allow tabs to "pop out" for side-by-side comparison
                    <br><strong>Features:</strong> Normal tab switching + pop-out buttons + side-by-side view mode + endless horizontal scroll
                    <br><strong>Best of both:</strong> Tab clarity when focused + section comparison when needed
                </p>

                <div class="pros-cons">
                    <div class="pros">
                        <strong>✅ Pros:</strong><br>
                        • Hierarchical clarity (from tabs)<br>
                        • Minimal padding (efficient space)<br>
                        • Side-by-side comparison (when needed)<br>
                        • Progressive complexity<br>
                        • User controls when to compare
                    </div>
                    <div class="cons">
                        <strong>❌ Cons:</strong><br>
                        • More complex interaction model<br>
                        • Learning curve for pop-out feature<br>
                        • State management complexity<br>
                        • Potential UI confusion
                    </div>
                </div>

                <a href="/hybrid1" class="demo-button" target="_blank">View Hybrid 1 Demo</a>
                <a href="javascript:alert('Tabs with ↗ pop-out buttons + Single/Side-by-Side/Scroll modes')" class="demo-button" style="background: #95a5a6;">How It Works</a>
            </div>

            <div class="layout-option">
                <h2 class="option-title">Hybrid 2: Hierarchical Collapsible Sections</h2>
                <p class="option-description">
                    <strong>Concept:</strong> Collapsible sections with tab-style hierarchy indicators, minimal padding, and category filtering
                    <br><strong>Features:</strong> Numbered hierarchy (1. 2. 3.) + color-coded levels + category tabs + side-by-side toggle
                    <br><strong>Best of both:</strong> Section flexibility + hierarchical organization + space efficiency
                </p>

                <div class="pros-cons">
                    <div class="pros">
                        <strong>✅ Pros:</strong><br>
                        • Clear hierarchy with numbering<br>
                        • Minimal padding design<br>
                        • Category filtering<br>
                        • Familiar collapsible interface<br>
                        • Side-by-side toggle option
                    </div>
                    <div class="cons">
                        <strong>❌ Cons:</strong><br>
                        • Still requires scrolling in categories<br>
                        • Less simultaneous comparison<br>
                        • Hierarchy might feel rigid<br>
                        • Category switching needed
                    </div>
                </div>

                <a href="/hybrid2" class="demo-button" target="_blank">View Hybrid 2 Demo</a>
                <a href="javascript:alert('Hierarchical sections with 1.2.3. numbering + Category tabs + Toggle modes')" class="demo-button" style="background: #95a5a6;">How It Works</a>
            </div>

            <div class="layout-option">
                <h2 class="option-title">Hybrid 3: Split-Screen Toggle</h2>
                <p class="option-description">
                    <strong>Concept:</strong> Three distinct view modes: Tabbed (clarity), Sections (comparison), Horizontal Scroll (endless)
                    <br><strong>Features:</strong> Mode buttons to switch between tab style, section style, and horizontal scroll
                    <br><strong>Best of both:</strong> User chooses the view mode that fits their current analysis needs
                </p>

                <div class="pros-cons">
                    <div class="pros">
                        <strong>✅ Pros:</strong><br>
                        • Three optimized view modes<br>
                        • User controls experience<br>
                        • Each mode optimized for its purpose<br>
                        • Maximum flexibility<br>
                        • Progressive complexity
                    </div>
                    <div class="cons">
                        <strong>❌ Cons:</strong><br>
                        • Mode switching complexity<br>
                        • Three different interaction models<br>
                        • Implementation complexity<br>
                        • Potential user confusion
                    </div>
                </div>

                <a href="/hybrid3" class="demo-button" target="_blank">View Hybrid 3 Demo</a>
                <a href="javascript:alert('3 modes: Tabbed (clarity) + Sections (comparison) + Scroll (endless)')" class="demo-button" style="background: #95a5a6;">How It Works</a>
            </div>

            <div style="background: #e8f5e8; border: 2px solid #27ae60; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #27ae60;">🎯 Analysis & Recommendation</h3>
                <p style="margin: 0; color: #155724; line-height: 1.6;">
                    <strong>Your instinct is correct!</strong> Both Tabbed Environment (hierarchical clarity + minimal padding) and
                    Focused Sections (side-by-side + endless scroll) have unique strengths.
                    <br><br>
                    <strong>My recommendation:</strong> <strong>Hybrid 1 (Tabbed with Pop-Out)</strong> gives you the best of both:
                    <br>
                    • ✅ <strong>Hierarchical clarity</strong> of tabs when analyzing one topic
                    • ✅ <strong>Minimal padding</strong> for space efficiency
                    • ✅ <strong>Side-by-side comparison</strong> when you need it (pop-out tabs)
                    • ✅ <strong>Endless horizontal scroll</strong> in comparison mode
                    • ✅ <strong>Progressive complexity</strong> - simple by default, powerful when needed
                    <br><br>
                    This lets users start with familiar tabs but "graduate" to advanced comparison when exploring correlations!
                </p>
                <a href="/hybrid1" class="demo-button" style="background: #27ae60; margin-top: 15px;">Try Recommended Hybrid</a>
                <a href="/focused" class="demo-button" style="background: #3498db; margin-top: 15px;">Compare with Focused Sections</a>
            </div>

        </body>
        </html>
    `);
});

// Serve the focused layout (your preferred choice)
app.get('/focused', (req, res) => {
    const focusedTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'v4-focused-analysis-template.html'), 'utf8');

    // Replace placeholders with sample data
    const populatedTemplate = focusedTemplate
        .replace(/{{SONG_NAME}}/g, 'Lý Chiều Chiều')
        .replace(/{{SVG_WIDTH}}/g, '800')
        .replace(/{{SVG_HEIGHT}}/g, '200')
        .replace(/{{OPTIMAL_SVG_CONTENT}}/g, `
            <!-- Sample tablature content -->
            <line x1="50" y1="50" x2="750" y2="50" stroke="#ddd" stroke-width="3"/>
            <line x1="50" y1="80" x2="750" y2="80" stroke="#ddd" stroke-width="3"/>
            <line x1="50" y1="110" x2="750" y2="110" stroke="#ddd" stroke-width="3"/>
            <line x1="50" y1="140" x2="750" y2="140" stroke="#ddd" stroke-width="3"/>
            <line x1="50" y1="170" x2="750" y2="170" stroke="#ddd" stroke-width="3"/>

            <circle cx="120" cy="80" r="12" fill="#008080" stroke="#005959" stroke-width="2" data-syllable="Lý" data-tone="huyen"/>
            <circle cx="180" cy="110" r="8" fill="#FFD700" stroke="#CC9900" stroke-width="2" data-grace="true"/>
            <circle cx="220" cy="140" r="12" fill="#008080" stroke="#005959" stroke-width="2" data-syllable="chiều" data-tone="ngang"/>
            <circle cx="280" cy="110" r="12" fill="#008080" stroke="#005959" stroke-width="2" data-syllable="chiều" data-tone="ngang"/>
            <circle cx="340" cy="170" r="12" fill="#008080" stroke="#005959" stroke-width="2" data-syllable="về" data-tone="sac"/>

            <text x="25" y="85" font-size="12" fill="#666">G4</text>
            <text x="25" y="115" font-size="12" fill="#666">D4</text>
            <text x="25" y="145" font-size="12" fill="#666">A3</text>
            <text x="25" y="175" font-size="12" fill="#666">E3</text>
        `)
        .replace(/{{UNIQUE_PITCHES}}/g, '5')
        .replace(/{{PITCH_RANGE}}/g, '17')
        .replace(/{{ASCENDING_PERCENTAGE}}/g, '34.2')
        .replace(/{{RHYTHMIC_DIVERSITY}}/g, '4')
        .replace(/{{SYNCOPATION_INDEX}}/g, '18.9')
        .replace(/{{PITCH_RHYTHM_CORRELATION}}/g, '67.3')
        .replace(/{{TONE_NGANG_PERCENTAGE}}/g, '23.5')
        .replace(/{{TONE_NGA_PERCENTAGE}}/g, '12.5')
        .replace(/{{TONE_MELODY_CORRELATION}}/g, '78.4')
        .replace(/{{SYLLABLE_COUNT}}/g, '34')
        .replace(/{{LYRIC_COVERAGE}}/g, '59.6')
        .replace(/{{BEGINNING_PITCH_AVG}}/g, 'D4')
        .replace(/{{ENDING_PITCH_AVG}}/g, 'G4')
        .replace(/{{MELISMA_COUNT}}/g, '8')
        .replace(/{{GRACE_PERCENTAGE}}/g, '14.0')
        .replace(/{{EXACT_PATTERNS_COUNT}}/g, '12')
        .replace(/{{TRANSPOSITION_COUNT}}/g, '5')
        .replace(/{{TONE_PITCH_CORRELATION}}/g, '78.4')
        .replace(/{{WORD_MELODY_CORRELATION}}/g, '65.2')
        .replace(/{{REGIONAL_SIMILARITY}}/g, '85.7')
        .replace(/{{TRADITIONAL_SCORE}}/g, '8.3');

    res.send(populatedTemplate);
});

app.listen(port, () => {
    console.log(`🚀 Layout Demo Server running on http://localhost:${port}`);
    console.log(`📋 Compare all layout options:`);
    console.log(`   Main Demo: http://localhost:${port}`);
    console.log(`   Option 1 (Dashboard): http://localhost:${port}/templates/option1-interactive-dashboard.html`);
    console.log(`   Option 2 (Tabbed): http://localhost:${port}/templates/option2-tabbed-analysis.html`);
    console.log(`   Option 3 (Mind Map): http://localhost:${port}/templates/option3-mind-map-interface.html`);
    console.log(`   Your Choice (Focused): http://localhost:${port}/focused`);
});

module.exports = app;