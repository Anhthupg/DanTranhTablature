#!/usr/bin/env node

/**
 * Add new collapsible sections to all existing song HTML files
 * Preserves existing optimal and comparison tuning functionality
 */

const fs = require('fs');
const path = require('path');

class SectionUpdater {
    constructor() {
        this.newSectionsCSS = `
        /* New Collapsible Sections Styles */
        .move-controls {
            display: flex;
            gap: 5px;
            margin-right: 10px;
        }

        .move-arrow {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 4px;
            color: white;
            cursor: pointer;
            padding: 2px 8px;
            font-size: 14px;
            transition: background 0.2s ease;
        }

        .move-arrow:hover {
            background: rgba(255,255,255,0.4);
        }

        .move-arrow:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .lyrics-panel .panel-header {
            background: linear-gradient(135deg, #8E44AD 0%, #9B59B6 100%);
        }

        .additional-info-panel .panel-header {
            background: linear-gradient(135deg, #27AE60 0%, #2ECC71 100%);
        }

        .analysis-panel .panel-header {
            background: linear-gradient(135deg, #E67E22 0%, #F39C12 100%);
        }

        .placeholder-content {
            padding: 20px;
            text-align: center;
            color: #7F8C8D;
            font-style: italic;
        }`;

        this.newSectionsHTML = `
        <!-- New Collapsible Sections -->
        <div class="tuning-panel lyrics-panel" id="lyricsPanel" data-order="2">
            <div class="panel-header" onclick="togglePanel('lyrics')">
                <div class="move-controls">
                    <button class="move-arrow" onclick="moveSection('lyricsPanel', 'up'); event.stopPropagation();">▲</button>
                    <button class="move-arrow" onclick="moveSection('lyricsPanel', 'down'); event.stopPropagation();">▼</button>
                </div>
                <h3>📝 Lyrics</h3>
                <span class="collapse-indicator" id="lyricsCollapse">▼</span>
            </div>
            <div class="panel-content expanded" id="lyricsContent">
                <div class="placeholder-content">
                    Lyrics data will appear here when available.
                </div>
            </div>
        </div>

        <div class="tuning-panel additional-info-panel" id="additionalInfoPanel" data-order="3">
            <div class="panel-header" onclick="togglePanel('additionalInfo')">
                <div class="move-controls">
                    <button class="move-arrow" onclick="moveSection('additionalInfoPanel', 'up'); event.stopPropagation();">▲</button>
                    <button class="move-arrow" onclick="moveSection('additionalInfoPanel', 'down'); event.stopPropagation();">▼</button>
                </div>
                <h3>💡 Additional Information</h3>
                <span class="collapse-indicator" id="additionalInfoCollapse">▼</span>
            </div>
            <div class="panel-content expanded" id="additionalInfoContent">
                <div class="placeholder-content">
                    Song metadata and information will be displayed here.
                </div>
            </div>
        </div>

        <div class="tuning-panel analysis-panel" id="analysisPanel" data-order="4">
            <div class="panel-header" onclick="togglePanel('analysis')">
                <div class="move-controls">
                    <button class="move-arrow" onclick="moveSection('analysisPanel', 'up'); event.stopPropagation();">▲</button>
                    <button class="move-arrow" onclick="moveSection('analysisPanel', 'down'); event.stopPropagation();">▼</button>
                </div>
                <h3>📊 Pattern Analysis</h3>
                <span class="collapse-indicator" id="analysisCollapse">▼</span>
            </div>
            <div class="panel-content expanded" id="analysisContent">
                <div class="placeholder-content">
                    Pattern analysis and visualization tools will be available here.
                </div>
            </div>
        </div>`;

        this.newSectionsJS = `
        // Section movement functionality
        function moveSection(panelId, direction) {
            const panel = document.getElementById(panelId);
            if (!panel) return;

            const container = panel.parentElement;
            const allPanels = Array.from(container.querySelectorAll(".tuning-panel:not(#optimalPanel)"));
            const currentIndex = allPanels.indexOf(panel);

            if (direction === "up" && currentIndex > 0) {
                const prevPanel = allPanels[currentIndex - 1];
                const currentOrder = parseInt(panel.dataset.order);
                const prevOrder = parseInt(prevPanel.dataset.order);

                panel.dataset.order = prevOrder;
                prevPanel.dataset.order = currentOrder;
                panel.style.order = prevOrder;
                prevPanel.style.order = currentOrder;
            } else if (direction === "down" && currentIndex < allPanels.length - 1) {
                const nextPanel = allPanels[currentIndex + 1];
                const currentOrder = parseInt(panel.dataset.order);
                const nextOrder = parseInt(nextPanel.dataset.order);

                panel.dataset.order = nextOrder;
                nextPanel.dataset.order = currentOrder;
                panel.style.order = nextOrder;
                nextPanel.style.order = currentOrder;
            }
            updateMoveButtons();
        }

        function updateMoveButtons() {
            const allPanels = Array.from(document.querySelectorAll(".tuning-panel:not(#optimalPanel)"));
            allPanels.sort((a, b) => parseInt(a.dataset.order) - parseInt(b.dataset.order));

            allPanels.forEach((panel, index) => {
                const upButton = panel.querySelector(".move-arrow:first-child");
                const downButton = panel.querySelector(".move-arrow:last-child");

                if (upButton) {
                    upButton.disabled = index === 0;
                    upButton.style.opacity = index === 0 ? "0.3" : "1";
                    upButton.style.cursor = index === 0 ? "not-allowed" : "pointer";
                }

                if (downButton) {
                    downButton.disabled = index === allPanels.length - 1;
                    downButton.style.opacity = index === allPanels.length - 1 ? "0.3" : "1";
                    downButton.style.cursor = index === allPanels.length - 1 ? "not-allowed" : "pointer";
                }
            });
        }`;
    }

    async updateAllSongs() {
        const processedDir = path.join(__dirname, 'data', 'processed');
        const songDirs = fs.readdirSync(processedDir).filter(dir =>
            fs.statSync(path.join(processedDir, dir)).isDirectory()
        );

        console.log(`🎵 Adding new sections to ${songDirs.length} songs...`);

        let updated = 0;
        let skipped = 0;

        for (const songDir of songDirs) {
            const htmlPath = path.join(processedDir, songDir, 'complete-dual-panel.html');

            if (fs.existsSync(htmlPath)) {
                try {
                    const success = this.updateSongFile(htmlPath, songDir);
                    if (success) {
                        updated++;
                        if (updated % 10 === 0) {
                            console.log(`✅ Updated ${updated}/${songDirs.length} songs...`);
                        }
                    } else {
                        skipped++;
                    }
                } catch (error) {
                    console.error(`❌ Error updating ${songDir}:`, error.message);
                    skipped++;
                }
            } else {
                skipped++;
            }
        }

        console.log(`\n🎉 Complete! Updated: ${updated}, Skipped: ${skipped}`);
        return { updated, skipped };
    }

    updateSongFile(htmlPath, songName) {
        let content = fs.readFileSync(htmlPath, 'utf8');

        // Check if sections already exist
        if (content.includes('lyricsPanel') || content.includes('moveSection')) {
            return false; // Already updated
        }

        // 1. Add CSS before </style>
        content = content.replace(
            /(\s+)(<\/style>)/,
            `$1${this.newSectionsCSS}$1$2`
        );

        // 2. Add HTML sections before <script>
        content = content.replace(
            /(\s+)(<script>)/,
            `$1${this.newSectionsHTML}$1$1$2`
        );

        // 3. Add JavaScript functions before first existing function
        const functionPattern = /(function\s+\w+\s*\()/;
        if (functionPattern.test(content)) {
            content = content.replace(
                functionPattern,
                `${this.newSectionsJS}\n\n        $1`
            );
        }

        // 4. Add initialization call to DOMContentLoaded
        content = content.replace(
            /(document\.addEventListener\(['"]DOMContentLoaded['"][^}]+)(}\s*\)\s*;)/,
            `$1
            // Initialize move button states
            updateMoveButtons();
        $2`
        );

        // Write updated content
        fs.writeFileSync(htmlPath, content, 'utf8');
        return true;
    }
}

// Run the updater
const updater = new SectionUpdater();
updater.updateAllSongs().then(result => {
    console.log(`\n📊 Summary:`);
    console.log(`   • Updated: ${result.updated} songs`);
    console.log(`   • Skipped: ${result.skipped} songs (already have sections or missing files)`);
    console.log(`\n🎯 All songs now have collapsible sections with move up/down functionality!`);
}).catch(error => {
    console.error('❌ Error:', error);
});