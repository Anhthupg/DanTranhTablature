/**
 * Phrase Bars Controller - V4.2.5
 * Visualizes LLM-segmented phrases as colored bars aligned with tablature
 *
 * Features:
 * - Horizontal bars spanning from first note to last note of each phrase
 * - Color-coded by linguistic type (same colors as lyrics section)
 * - Section name labels inside bars
 * - X-zoom synchronized with optimal tuning tablature
 * - 6 playback buttons per phrase (shared with lyrics section)
 */

class PhraseBarsController {
    constructor() {
        this.lyricsData = null;
        this.relationships = null;
        this.phraseBars = [];
        this.currentZoomX = 1.0;
        this.isLooping = {};  // Track loop state for each phrase

        // Linguistic type colors (same as lyrics-controller.js)
        this.typeColors = {
            'exclamatory': '#FF6B6B',      // Red
            'question': '#4ECDC4',         // Cyan
            'answer': '#95E1D3',           // Light cyan
            'narrative': '#A8E6CF',        // Light green
            'complaint': '#FFD93D',        // Yellow
            'onomatopoeia': '#C3AED6',     // Purple
            'descriptive': '#8AC4D0'       // Blue-grey
        };
    }

    async initialize() {
        console.log('[PhraseBars] Initializing...');

        // Load lyrics segmentation
        await this.loadLyricsData();

        // Load relationships (word-to-note mapping)
        await this.loadRelationships();

        // Create phrase bars visualization
        this.renderPhraseBars();

        // Attach to zoom controller AFTER rendering
        this.attachToZoomController();

        // Apply current zoom state from optimal tuning after a short delay
        setTimeout(() => {
            if (window.zoomController && window.zoomController.zoomState) {
                const currentXZoom = window.zoomController.zoomState.optimal?.x || 100;
                // If zoom is less than 10, it's already a decimal (1.0 = 100%), don't divide
                this.currentZoomX = currentXZoom < 10 ? currentXZoom : (currentXZoom / 100);
                console.log(`[PhraseBars] Syncing to current zoom: ${currentXZoom} → ${this.currentZoomX}x`);
                this.updatePhraseBarsZoom();
            }
        }, 100);

        console.log('[PhraseBars] Initialized successfully');
    }

    async refresh() {
        console.log('[PhraseBars] Refreshing for new song...');
        this.phraseBars = [];

        // Reload data for current song
        await this.loadLyricsData();
        await this.loadRelationships();

        // Re-render
        this.renderPhraseBars();

        // Reapply zoom
        setTimeout(() => {
            if (window.zoomController && window.zoomController.zoomState) {
                const currentXZoom = window.zoomController.zoomState.optimal?.x || 100;
                this.currentZoomX = currentXZoom < 10 ? currentXZoom : (currentXZoom / 100);
                this.updatePhraseBarsZoom();
            }
        }, 100);

        console.log('[PhraseBars] Refresh complete');
    }

    async loadLyricsData() {
        try {
            // V4.2.14: Get song from URL parameter (server-side routing)
            const urlParams = new URLSearchParams(window.location.search);
            let currentSong = urlParams.get('song') || window.libraryController?.currentSong || 'Bà rằng bà rí';

            // Strip extensions
            currentSong = currentSong.replace(/\.musicxml\.xml$/i, '').replace(/\.xml$/i, '');

            console.log(`[PhraseBars] Loading lyrics for: ${currentSong}`);

            const response = await fetch(`/api/lyrics/${encodeURIComponent(currentSong)}`);
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            this.lyricsData = await response.json();
            console.log(`[PhraseBars] Loaded ${this.lyricsData.phrases.length} phrases for ${currentSong}`);
        } catch (error) {
            console.error('[PhraseBars] Error loading lyrics:', error);
            this.lyricsData = { phrases: [] };
        }
    }

    async loadRelationships() {
        try {
            // V4.2.14: Get song from URL parameter (server-side routing)
            const urlParams = new URLSearchParams(window.location.search);
            let currentSong = urlParams.get('song') || window.libraryController?.currentSong || 'Bà rằng bà rí';

            // Strip extensions
            currentSong = currentSong.replace(/\.musicxml\.xml$/i, '').replace(/\.xml$/i, '');

            console.log(`[PhraseBars] Loading relationships for: ${currentSong}`);

            const response = await fetch(`/api/relationships/${encodeURIComponent(currentSong)}`);
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            this.relationships = await response.json();
            console.log(`[PhraseBars] Loaded relationships: ${this.relationships.metadata.totalSyllables} syllables mapped`);
        } catch (error) {
            console.error('[PhraseBars] Error loading relationships:', error);
            this.relationships = { wordToNoteMap: [], noteToWordMap: {} };
        }
    }

    renderPhraseBars() {
        const container = document.getElementById('phraseBarsContainer');
        if (!container) {
            console.error('[PhraseBars] Container not found');
            return;
        }

        const optimalSvg = document.getElementById('optimalSvg');
        if (!optimalSvg) {
            console.error('[PhraseBars] Optimal tuning SVG not found');
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Get optimal SVG width to match it
        const svgWidth = parseInt(optimalSvg.getAttribute('width')) || 2000;
        console.log(`[PhraseBars] Using SVG width: ${svgWidth}px to match optimal tuning`);

        // Create each phrase bar as a row
        for (const phrase of this.lyricsData.phrases) {
            console.log(`[PhraseBars] Processing phrase ${phrase.id}: "${phrase.text}"`);

            const phraseWords = phrase.wordMapping || [];
            if (phraseWords.length === 0) {
                console.warn(`[PhraseBars]   No word mapping for phrase ${phrase.id}`);
                continue;
            }

            // Find all word mappings for this phrase
            // Note: wordIndex in relationships uses GLOBAL indices, not per-phrase indices
            const phraseMappings = this.relationships.wordToNoteMap.filter(
                m => m.phraseId === phrase.id
            );

            if (phraseMappings.length === 0) {
                console.warn(`[PhraseBars]   No mappings found for phrase ${phrase.id}`);
                continue;
            }

            // Sort by wordIndex to ensure correct order
            phraseMappings.sort((a, b) => a.wordIndex - b.wordIndex);

            // Get first and last mappings
            const firstMapping = phraseMappings[0];
            const lastMapping = phraseMappings[phraseMappings.length - 1];

            if (!firstMapping || !lastMapping) {
                console.warn(`[PhraseBars]   Missing mapping for phrase ${phrase.id} (firstMapping: ${!!firstMapping}, lastMapping: ${!!lastMapping})`);
                console.warn(`[PhraseBars]   phraseWords.length: ${phraseWords.length}, phraseMappings.length: ${phraseMappings.length}`);
                continue;
            }

            // Get note positions from SVG
            // V4.2.6: Use corrected relationships mapping
            // - noteIds now correctly includes only:
            //   * Main note
            //   * POST-slur graces (belong to this note)
            //   * Melisma notes
            // - Pre-slur graces excluded (belong to NEXT note)
            const firstSvgId = firstMapping.mainNoteId;  // First note is always main
            const lastSvgId = lastMapping.noteIds[lastMapping.noteIds.length - 1];  // Last note in unit

            const firstNoteElement = optimalSvg.querySelector(`#${firstSvgId}`);
            const lastNoteElement = optimalSvg.querySelector(`#${lastSvgId}`);

            if (!firstNoteElement || !lastNoteElement) {
                console.warn(`[PhraseBars] Note elements not found for phrase ${phrase.id} - skipping`);
                console.warn(`[PhraseBars]   Looking for: ${firstSvgId} and ${lastSvgId}`);
                console.warn(`[PhraseBars]   firstNoteElement: ${!!firstNoteElement}, lastNoteElement: ${!!lastNoteElement}`);

                // Try to find any valid notes for this phrase
                let foundFirst = null;
                let foundLast = null;

                for (const noteId of phrase.noteIds || []) {
                    const noteEl = optimalSvg.querySelector(`#${noteId}`);
                    if (noteEl) {
                        if (!foundFirst) foundFirst = noteEl;
                        foundLast = noteEl;
                    }
                }

                if (foundFirst && foundLast) {
                    console.log(`[PhraseBars]   Using alternative notes: ${foundFirst.id} and ${foundLast.id}`);
                    const firstX = parseFloat(foundFirst.dataset.baseX || foundFirst.getAttribute('cx'));
                    const lastX = parseFloat(foundLast.dataset.baseX || foundLast.getAttribute('cx'));

                    const barData = this.createPhraseBar(phrase, firstX, lastX, phrase.id, svgWidth);
                    container.appendChild(barData.container);
                    this.phraseBars.push(barData);
                }
                continue;
            }

            // Get base X positions (before zoom)
            const firstX = parseFloat(firstNoteElement.dataset.baseX || firstNoteElement.getAttribute('cx'));
            const lastX = parseFloat(lastNoteElement.dataset.baseX || lastNoteElement.getAttribute('cx'));

            // Create bar row (div container with SVG bar + buttons)
            const barData = this.createPhraseBar(phrase, firstX, lastX, phrase.id, svgWidth);
            container.appendChild(barData.container);

            this.phraseBars.push(barData);
        }

        console.log(`[PhraseBars] Rendered ${this.phraseBars.length} phrase bars with playback buttons`);
    }

    createPhraseBar(phrase, x1, x2, y, svgWidth = 2000) {
        const container = document.createElement('div');
        container.className = 'phrase-bar-row';
        container.style.cssText = `
            position: relative;
            margin-bottom: 8px;
            width: 100%;
            overflow: visible;
            min-height: 50px;
        `;
        container.dataset.phraseId = phrase.id;

        const barHeight = 40;
        const color = this.typeColors[phrase.linguisticType] || '#999';

        // Create SVG for the bar (match optimal tuning SVG width)
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', svgWidth);
        svg.setAttribute('height', barHeight + 10);
        svg.style.display = 'block';
        svg.style.overflow = 'visible';
        svg.style.minWidth = svgWidth + 'px';

        const group = document.createElementNS(svgNS, 'g');

        // Rectangle bar - starts at x1 which matches the optimal tablature note position
        const rect = document.createElementNS(svgNS, 'rect');
        const barWidth = x2 - x1 + 24;

        rect.setAttribute('x', x1);
        rect.setAttribute('y', '5');
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('fill', color);
        rect.setAttribute('opacity', '0.7');
        rect.setAttribute('stroke', '#333');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '8');

        // Store base positions for zoom
        rect.dataset.baseX = x1;
        rect.dataset.baseWidth = barWidth;

        console.log(`[PhraseBars] Created bar for phrase ${phrase.id}: x=${x1}, width=${barWidth}`);
        group.appendChild(rect);

        // Phrase label with linguistic type (top-left of bar)
        const linguisticTypeLabel = this.getLinguisticTypeLabel(phrase.linguisticType);
        const labelText = document.createElementNS(svgNS, 'text');
        labelText.setAttribute('x', x1 + 5);
        labelText.setAttribute('y', 15);
        labelText.setAttribute('text-anchor', 'start');
        labelText.setAttribute('fill', '#000');
        labelText.setAttribute('font-size', '9');
        labelText.setAttribute('font-weight', '700');
        labelText.textContent = `P #${phrase.id}: ${linguisticTypeLabel}`;
        labelText.dataset.baseX = x1 + 5;
        group.appendChild(labelText);

        // Phrase text - Show Vietnamese phrase text (centered in bar)
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', (x1 + x2) / 2);
        text.setAttribute('y', barHeight / 2 + 8);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#000');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', '600');
        text.textContent = phrase.text;
        text.dataset.baseX = (x1 + x2) / 2;
        group.appendChild(text);

        svg.appendChild(group);
        container.appendChild(svg);

        // Create buttons overlaid on top of bar (positioned absolutely, 10px lower)
        const buttonsContainer = this.createPlaybackButtons(phrase.id);
        buttonsContainer.style.position = 'absolute';
        buttonsContainer.style.left = `${x1 + 5}px`;
        buttonsContainer.style.top = '35px';  // Moved 10px lower to bottom edge
        buttonsContainer.style.zIndex = '10';
        buttonsContainer.dataset.baseX = x1 + 5;
        container.appendChild(buttonsContainer);

        return { container, rect, text, labelText, buttonsContainer, baseX1: x1, baseX2: x2, baseY: y };
    }

    getLinguisticTypeLabel(linguisticType) {
        const typeMap = {
            'exclamatory': 'Exclamation',
            'question': 'Question',
            'answer': 'Answer',
            'narrative': 'Narrative',
            'complaint': 'Complaint',
            'onomatopoeia': 'Onomatopoeia',
            'descriptive': 'Descriptive'
        };
        return typeMap[linguisticType] || 'Unknown';
    }

    createPlaybackButtons(phraseId) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            gap: 2px;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.9);
            padding: 2px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        const buttonStyle = `
            background: white;
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 2px 4px;
            cursor: pointer;
            font-size: 10px;
            transition: all 0.2s;
            min-width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Play button
        const playBtn = document.createElement('button');
        playBtn.innerHTML = '▶';
        playBtn.title = 'Play phrase';
        playBtn.style.cssText = buttonStyle + 'background: #27AE60; color: white;';
        playBtn.onclick = () => this.playPhrase(phraseId);
        container.appendChild(playBtn);

        // Loop button - delegates to lyrics controller for consistency
        const loopBtn = document.createElement('button');
        loopBtn.innerHTML = '🔁';
        loopBtn.title = 'Toggle loop';
        loopBtn.style.cssText = buttonStyle;
        loopBtn.onclick = () => {
            if (window.lyricsController) {
                window.lyricsController.toggleLoop(phraseId, loopBtn);
            }
        };
        container.appendChild(loopBtn);

        // Stop button
        const stopBtn = document.createElement('button');
        stopBtn.innerHTML = '■';
        stopBtn.title = 'Stop playback';
        stopBtn.style.cssText = buttonStyle + 'background: #E74C3C; color: white;';
        stopBtn.onclick = () => this.stopPhrase(phraseId);
        container.appendChild(stopBtn);

        // Pronunciation button
        const pronunciationBtn = document.createElement('button');
        pronunciationBtn.innerHTML = '🗣';
        pronunciationBtn.title = 'Speak Vietnamese';
        pronunciationBtn.style.cssText = buttonStyle;
        pronunciationBtn.onclick = () => {
            const phrase = this.lyricsData.phrases.find(p => p.id === phraseId);
            if (phrase && window.lyricsController) {
                window.lyricsController.showPronunciation(phrase);
            }
        };
        container.appendChild(pronunciationBtn);

        return container;
    }

    attachToZoomController() {
        // Listen for zoom changes on optimal tuning
        if (window.zoomController) {
            // Hook into existing zoom update
            const originalUpdateZoom = window.zoomController.updateZoom;
            window.zoomController.updateZoom = (section, axis, value) => {
                // Call original
                originalUpdateZoom.call(window.zoomController, section, axis, value);

                // Update phrase bars if optimal tuning X-zoom changed
                if (section === 'optimal' && axis === 'x') {
                    this.currentZoomX = value / 100;
                    this.updatePhraseBarsZoom();
                }
            };

            console.log('[PhraseBars] Attached to zoom controller');
        }

        // Sync scroll position with optimal tuning tablature
        this.attachScrollSync();
    }

    attachScrollSync() {
        const phraseBarsContainer = document.getElementById('phraseBarsContainer');
        const optimalTablatureContainer = document.querySelector('#optimalTuningSection .tablature-reference');

        if (!phraseBarsContainer || !optimalTablatureContainer) {
            console.warn('[PhraseBars] Could not attach scroll sync - containers not found');
            console.warn(`[PhraseBars]   phraseBarsContainer: ${!!phraseBarsContainer}`);
            console.warn(`[PhraseBars]   optimalTablatureContainer: ${!!optimalTablatureContainer}`);
            return;
        }

        // Prevent infinite loop with flag
        let isSyncing = false;

        // Sync phrase bars scroll to optimal tablature scroll
        optimalTablatureContainer.addEventListener('scroll', (e) => {
            if (isSyncing) return;
            isSyncing = true;
            phraseBarsContainer.scrollLeft = e.target.scrollLeft;
            requestAnimationFrame(() => { isSyncing = false; });
        });

        // Sync optimal tablature scroll to phrase bars scroll
        phraseBarsContainer.addEventListener('scroll', (e) => {
            if (isSyncing) return;
            isSyncing = true;
            optimalTablatureContainer.scrollLeft = e.target.scrollLeft;
            requestAnimationFrame(() => { isSyncing = false; });
        });

        console.log('[PhraseBars] Scroll synchronization attached');
    }

    updatePhraseBarsZoom() {
        console.log(`[PhraseBars] Applying zoom: ${this.currentZoomX}x to ${this.phraseBars.length} bars`);

        for (const barData of this.phraseBars) {
            if (barData.rect && barData.text) {
                // Apply zoom to X positions (same formula as tablature zoom)
                const scaledX1 = 120 + (barData.baseX1 - 120) * this.currentZoomX;
                const scaledX2 = 120 + (barData.baseX2 - 120) * this.currentZoomX;
                const scaledWidth = scaledX2 - scaledX1 + 24;

                barData.rect.setAttribute('x', scaledX1);
                barData.rect.setAttribute('width', scaledWidth);

                // Center text
                const centerX = (scaledX1 + scaledX2) / 2;
                barData.text.setAttribute('x', centerX);

                // Update label position (top-left of bar)
                if (barData.labelText) {
                    barData.labelText.setAttribute('x', scaledX1 + 5);
                }

                // Update button position (overlaid on bar)
                if (barData.buttonsContainer) {
                    barData.buttonsContainer.style.left = `${scaledX1 + 5}px`;
                }

                console.log(`[PhraseBars]   Bar ${barData.container.dataset.phraseId}: x ${barData.baseX1} → ${scaledX1}`);
            }
        }
    }

    // Shared playback functions - delegate to lyrics controller
    playPhrase(phraseId) {
        console.log(`[PhraseBars] Play phrase ${phraseId} - delegating to lyrics controller`);

        if (window.lyricsController && window.lyricsController.playPhrase) {
            window.lyricsController.playPhrase(phraseId);
            this.highlightPhraseBar(phraseId);
        } else {
            console.error('[PhraseBars] Lyrics controller not available for playback');
        }
    }

    stopPhrase(phraseId) {
        console.log(`[PhraseBars] Stop phrase ${phraseId} - delegating to lyrics controller`);

        if (window.lyricsController && window.lyricsController.stopPhrase) {
            window.lyricsController.stopPhrase(phraseId);
            this.clearPhraseBarHighlight(phraseId);
        } else {
            console.error('[PhraseBars] Lyrics controller not available');
        }
    }

    highlightPhraseBar(phraseId) {
        const barData = this.phraseBars.find(b => b.phraseId === phraseId);
        if (barData) {
            const rect = barData.element.querySelector('rect');
            if (rect) {
                rect.setAttribute('opacity', '1.0');
                rect.setAttribute('stroke', '#27AE60');  // Green during playback
                rect.setAttribute('stroke-width', '4');
            }
        }
    }

    clearPhraseBarHighlight(phraseId) {
        const barData = this.phraseBars.find(b => b.phraseId === phraseId);
        if (barData) {
            const rect = barData.element.querySelector('rect');
            if (rect) {
                rect.setAttribute('opacity', '0.7');
                rect.setAttribute('stroke', '#333');
                rect.setAttribute('stroke-width', '2');
            }
        }
    }
}

// Global instance
window.phraseBarsController = new PhraseBarsController();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for optimal SVG to load, then initialize
    setTimeout(() => {
        if (window.phraseBarsController) {
            window.phraseBarsController.initialize();
        }
    }, 1000);  // Delay to ensure SVG is loaded
});