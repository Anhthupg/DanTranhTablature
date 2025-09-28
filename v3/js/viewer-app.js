// Shared Viewer Application for Dan Tranh Tablature V3
// Handles all song pages with dynamic content loading

(function() {
    'use strict';

    // Get song name from URL path
    const pathParts = window.location.pathname.split('/');
    const songFolder = pathParts[pathParts.length - 2];
    
    // Tab definitions
    const tabs = [
        { id: 'lyrics', label: 'Lyrics', icon: '📝' },
        { id: 'musical', label: 'Musical Analysis', icon: '🎵' },
        { id: 'performance', label: 'Performance', icon: '🎭' },
        { id: 'cultural', label: 'Cultural Context', icon: '🏛️' },
        { id: 'historical', label: 'Historical Background', icon: '📜' },
        { id: 'regional', label: 'Regional Variations', icon: '🗺️' },
        { id: 'technique', label: 'Technique Guide', icon: '✋' },
        { id: 'ornaments', label: 'Ornaments', icon: '🎨' },
        { id: 'rhythm', label: 'Rhythm Patterns', icon: '🥁' },
        { id: 'structure', label: 'Song Structure', icon: '🏗️' }
    ];

    // Load analysis data
    async function loadAnalysisData() {
        // Check if data is embedded in the page first (for file:// protocol)
        if (window.analysisData) {
            return window.analysisData;
        }

        // Otherwise try to fetch from JSON file (for http:// protocol)
        try {
            const response = await fetch('analysis-data.json');
            if (!response.ok) throw new Error('Failed to load analysis data');
            return await response.json();
        } catch (error) {
            console.error('Error loading analysis data:', error);
            return null;
        }
    }

    // Create tab navigation
    function createTabNavigation(container) {
        const nav = document.createElement('div');
        nav.className = 'tab-navigation';
        
        tabs.forEach(tab => {
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.dataset.tab = tab.id;
            button.innerHTML = `${tab.icon} ${tab.label}`;
            button.onclick = () => switchTab(tab.id);
            nav.appendChild(button);
        });
        
        container.appendChild(nav);
    }

    // Create content panels
    function createContentPanels(container, data) {
        const contentArea = document.createElement('div');
        contentArea.className = 'tab-content-area';
        
        tabs.forEach(tab => {
            const panel = document.createElement('div');
            panel.className = 'tab-panel';
            panel.id = `panel-${tab.id}`;
            panel.style.display = tab.id === 'lyrics' ? 'block' : 'none';
            
            if (tab.id === 'lyrics' && data.lyrics) {
                createLyricsPanel(panel, data.lyrics);
            } else if (data[tab.id]) {
                panel.innerHTML = data[tab.id];
            } else {
                panel.innerHTML = `<p>Content for ${tab.label} coming soon...</p>`;
            }
            
            contentArea.appendChild(panel);
        });
        
        container.appendChild(contentArea);
    }

    // Create V1-style interactive lyrics panel
    function createLyricsPanel(panel, lyricsData) {
        // Headers
        const headers = document.createElement('div');
        headers.className = 'lyrics-headers';
        headers.innerHTML = `
            <div class="vietnamese-header">Tiếng Việt (Vietnamese)</div>
            <div class="english-header">English Translation</div>
        `;
        panel.appendChild(headers);

        // Control buttons
        const controls = document.createElement('div');
        controls.className = 'lyrics-controls';
        controls.innerHTML = `
            <button class="control-btn" onclick="playLyrics()">▶ Play</button>
            <button class="control-btn" onclick="pauseLyrics()">⏸ Pause</button>
            <button class="control-btn" onclick="stopLyrics()">⏹ Stop</button>
            <button class="control-btn" onclick="toggleEditMode()">✏️ Edit</button>
            <button class="control-btn" onclick="toggleTranslation()">🌐 Translate</button>
            <button class="control-btn" onclick="toggleAudio()">🔊 Audio</button>
            <button class="control-btn" onclick="resetLineBreaks()">↻ Reset</button>
            <span style="margin-left: 10px; font-size: 12px; color: #7F8C8D;">
                Click pipes | to add line breaks
            </span>
        `;
        panel.appendChild(controls);

        // Content grid
        const grid = document.createElement('div');
        grid.className = 'lyrics-content-grid';
        
        const vietnameseDiv = document.createElement('div');
        vietnameseDiv.className = 'vietnamese-lyrics';
        vietnameseDiv.id = 'vietnameseLyrics';
        
        const englishDiv = document.createElement('div');
        englishDiv.className = 'english-lyrics';
        englishDiv.id = 'englishLyrics';
        
        // Build Vietnamese display with pipe separators
        if (lyricsData.phrases && lyricsData.phrases.length > 0) {
            let vietnameseHTML = '';
            let englishHTML = '';
            
            lyricsData.phrases.forEach((phrase, phraseIndex) => {
                if (phraseIndex > 0) {
                    vietnameseHTML += '<span class="pipe-separator" onclick="toggleLineBreak(this)"> | </span>';
                    englishHTML += '<span class="pipe-separator"> | </span>';
                }
                
                // Split phrase into words
                const words = phrase.text ? phrase.text.split(' ') : [phrase];
                words.forEach((word, wordIndex) => {
                    if (wordIndex > 0) {
                        vietnameseHTML += '<span class="pipe-separator" onclick="toggleLineBreak(this)"> | </span>';
                    }
                    vietnameseHTML += '<span class="word-segment" onclick="highlightWord(this)">' + word + '</span>';
                });
                
                // English translation
                englishHTML += '<span>' + (phrase.translation || '[Translation pending]') + '</span>';
            });
            
            vietnameseDiv.innerHTML = vietnameseHTML;
            englishDiv.innerHTML = englishHTML;
        } else if (lyricsData.syllables && lyricsData.syllables.length > 0) {
            // Fallback to syllables if no phrases
            vietnameseDiv.innerHTML = lyricsData.syllables.join(' | ');
            englishDiv.innerHTML = '[Translation will be provided]';
        } else {
            vietnameseDiv.innerHTML = 'No lyrics available';
            englishDiv.innerHTML = 'No translation available';
        }
        
        grid.appendChild(vietnameseDiv);
        grid.appendChild(englishDiv);
        panel.appendChild(grid);

        // Bottom controls
        const bottomControls = document.createElement('div');
        bottomControls.className = 'lyrics-bottom-controls';
        bottomControls.innerHTML = `
            <div class="font-controls">
                <label>Font:
                    <select id="fontFamily" onchange="changeFontFamily(this.value)">
                        <option value="default">Default</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                    </select>
                </label>
                <label>Size:
                    <select id="fontSize" onchange="changeFontSize(this.value)">
                        <option value="14px">Small</option>
                        <option value="16px" selected>Medium</option>
                        <option value="18px">Large</option>
                        <option value="20px">Extra Large</option>
                    </select>
                </label>
            </div>
            <button class="control-btn" onclick="startLearning()">▶ Start Learning</button>
        `;
        panel.appendChild(bottomControls);
    }

    // Switch tab
    function switchTab(tabId) {
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.style.display = panel.id === `panel-${tabId}` ? 'block' : 'none';
        });
    }

    // Global functions for lyrics interaction
    window.toggleLineBreak = function(element) {
        element.classList.toggle('line-break');
        
        // Find corresponding English pipe
        const allVietnamesePipes = document.querySelectorAll('#vietnameseLyrics .pipe-separator');
        const allEnglishPipes = document.querySelectorAll('#englishLyrics .pipe-separator');
        const index = Array.from(allVietnamesePipes).indexOf(element);
        
        if (index >= 0 && allEnglishPipes[index]) {
            allEnglishPipes[index].classList.toggle('line-break');
        }
    };

    window.highlightWord = function(element) {
        document.querySelectorAll('.word-segment').forEach(el => {
            el.classList.remove('highlighted');
        });
        element.classList.add('highlighted');
    };

    window.resetLineBreaks = function() {
        document.querySelectorAll('.pipe-separator').forEach(el => {
            el.classList.remove('line-break');
        });
    };

    window.changeFontFamily = function(value) {
        const lyrics = document.querySelectorAll('.vietnamese-lyrics, .english-lyrics');
        const fontFamily = value === 'default' ? 'inherit' : value;
        lyrics.forEach(el => el.style.fontFamily = fontFamily);
    };

    window.changeFontSize = function(value) {
        const lyrics = document.querySelectorAll('.vietnamese-lyrics, .english-lyrics');
        lyrics.forEach(el => el.style.fontSize = value);
    };

    // Stub functions for controls
    window.playLyrics = function() { console.log('Playing lyrics...'); };
    window.pauseLyrics = function() { console.log('Paused'); };
    window.stopLyrics = function() { console.log('Stopped'); };
    window.toggleEditMode = function() { console.log('Edit mode toggled'); };
    window.toggleTranslation = function() { console.log('Translation mode toggled'); };
    window.toggleAudio = function() { console.log('Audio toggled'); };
    window.startLearning = function() { console.log('Learning mode started'); };

    // Initialize when DOM ready
    document.addEventListener('DOMContentLoaded', async function() {
        const container = document.getElementById('analysis-container');
        if (!container) {
            console.error('Analysis container not found');
            return;
        }

        // Load data and create interface
        const data = await loadAnalysisData();
        if (data) {
            createTabNavigation(container);
            createContentPanels(container, data);
            
            // Set first tab as active
            document.querySelector('.tab-button').classList.add('active');
        } else {
            container.innerHTML = '<p>Error loading analysis data</p>';
        }
    });
})();