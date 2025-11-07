// Pattern Visualization Controller - Tier 3 Patterns (KSIC, KTIC, KRIC)
// Visualizes syllable, tone, and rhyme patterns matched to tablature X positions

class PatternVisualizationController {
    constructor() {
        this.patternData = null;
        this.syllableData = null;
        this.currentHighlights = [];
        this.activePattern = null;
    }

    /**
     * Initialize with pattern and syllable data
     * @param {string} songName - Song backend ID (e.g., "ba-rang-ba-ri")
     */
    async initialize(songName) {
        try {
            // Load pattern data from pattern-analyzer.js output
            const patternResponse = await fetch(`/data/patterns/${songName}-patterns.json`);
            if (patternResponse.ok) {
                this.patternData = await patternResponse.json();
                console.log('Loaded pattern data:', this.patternData);
            } else {
                console.warn('Pattern data not found, using empty patterns');
                this.patternData = { ktic: {}, kric: {}, ksic: {} };
            }

            // Get syllable data from DOM (already loaded by NoteLyricsService)
            this.syllableData = this.extractSyllableData();
            console.log('[Pattern Controller] Extracted syllable data:', this.syllableData.length, 'syllables');

            // Debug: Show first few syllables
            if (this.syllableData.length > 0) {
                console.log('[Pattern Controller] Sample syllables:', this.syllableData.slice(0, 3));
            } else {
                console.warn('[Pattern Controller] No syllables found! Checking if section exists...');
                const section = document.getElementById('syllableLyricsSection');
                console.log('[Pattern Controller] Section exists:', !!section);
                if (section) {
                    const allSyllables = section.querySelectorAll('.syllable');
                    console.log('[Pattern Controller] Total .syllable elements in section:', allSyllables.length);
                    if (allSyllables.length > 0) {
                        console.log('[Pattern Controller] First syllable element:', allSyllables[0]);
                        console.log('[Pattern Controller] First syllable datasets:', allSyllables[0].dataset);
                    }
                }
            }

            // Render pattern controls
            this.renderPatternControls();

        } catch (error) {
            console.error('Pattern visualization initialization error:', error);
        }
    }

    /**
     * Extract syllable data from DOM elements
     * ONLY extracts from "Lyrics with Tablature Positions" section (has position data)
     * @returns {Array} Array of syllable objects with positions and linguistic data
     */
    extractSyllableData() {
        const syllables = [];

        // Find the "Syllable Lyrics with X-Positions" section specifically
        const lyricsWithPositions = document.getElementById('syllableLyricsSection');
        if (!lyricsWithPositions) {
            console.warn('Syllable Lyrics section not found');
            return syllables;
        }

        // Only get syllables from this section (these have data-note-x, data-note-y, data-note-id)
        const syllableElements = lyricsWithPositions.querySelectorAll('.syllable');

        console.log(`[Syllable Extraction] Found ${syllableElements.length} .syllable elements`);

        if (syllableElements.length > 0) {
            console.log('[Syllable Extraction] First syllable element:', syllableElements[0]);
            console.log('[Syllable Extraction] First syllable datasets:', syllableElements[0].dataset);
        }

        syllableElements.forEach((el, index) => {
            // Only include syllables that have position data
            // Note: noteId might be empty string for some syllables, but we still need X/Y positions
            if (el.dataset.noteX && el.dataset.noteY) {
                // Find matching syllable in main Lyrics table
                const lyricsTableSyllable = this.findLyricsTableSyllable(el);

                syllables.push({
                    element: el,
                    lyric: el.dataset.lyric,
                    tone: el.dataset.tone,
                    rhyme: el.dataset.rhyme,
                    phraseId: el.dataset.phraseId,
                    noteIndex: parseInt(el.dataset.noteIndex),
                    x: parseFloat(el.dataset.noteX),
                    y: parseFloat(el.dataset.noteY),
                    noteId: el.dataset.noteId,
                    lyricsTableElement: lyricsTableSyllable
                });
            } else if (index < 3) {
                // Log first few rejected syllables to see why
                console.warn('[Syllable Extraction] Rejected syllable (missing data):', {
                    element: el,
                    hasNoteX: !!el.dataset.noteX,
                    hasNoteY: !!el.dataset.noteY,
                    hasNoteId: !!el.dataset.noteId,
                    datasets: el.dataset
                });
            }
        });

        return syllables;
    }

    /**
     * Find corresponding syllable element in the main Lyrics section
     * Looks for syllable with same lyric, tone, and phraseId
     * @param {HTMLElement} syllableElement - Syllable from "Lyrics with Tablature Positions"
     * @returns {HTMLElement|null} - Corresponding element in Lyrics section or null
     */
    findLyricsSectionSyllable(syllableElement) {
        const lyric = syllableElement.dataset.lyric;
        const tone = syllableElement.dataset.tone;
        const phraseId = syllableElement.dataset.phraseId;
        const noteIndex = syllableElement.dataset.noteIndex;

        // Look in the main Lyrics section for matching syllable
        const lyricsSection = document.getElementById('lyricsSection');
        if (!lyricsSection) {
            console.warn('[Find Lyrics] lyricsSection not found');
            return null;
        }

        // Find all syllables in lyrics section with matching attributes
        const candidates = lyricsSection.querySelectorAll('.syllable');

        // Debug: Only log once during initialization
        if (!this._loggedLyricsSection) {
            console.log('[Find Lyrics] lyricsSection found:', !!lyricsSection);
            console.log('[Find Lyrics] Total .syllable elements in lyricsSection:', candidates.length);
            if (candidates.length > 0) {
                console.log('[Find Lyrics] First candidate:', candidates[0]);
                console.log('[Find Lyrics] First candidate datasets:', candidates[0].dataset);
            }
            this._loggedLyricsSection = true;
        }

        // Note: lyricsSection uses data-vn, syllableLyricsSection uses data-lyric
        // Try matching by phraseId and Vietnamese text (vn vs lyric)
        for (const candidate of candidates) {
            if (candidate.dataset.vn === lyric &&
                candidate.dataset.phraseId === phraseId) {
                return candidate;
            }
        }

        // If no match, try case-insensitive
        const normalizedLyric = lyric ? lyric.toLowerCase().trim() : '';
        for (const candidate of candidates) {
            const candidateVn = candidate.dataset.vn ? candidate.dataset.vn.toLowerCase().trim() : '';
            if (candidateVn === normalizedLyric &&
                candidate.dataset.phraseId === phraseId) {
                return candidate;
            }
        }

        console.warn('[Find Lyrics] No match found for:', { lyric, tone, phraseId, noteIndex });
        return null;
    }

    /**
     * Find matching syllable in main Lyrics table
     * Lyrics table uses data-vn, data-phrase-id, data-word-index
     * @param {HTMLElement} syllableElement - Syllable from syllableLyricsSection
     * @returns {HTMLElement|null}
     */
    findLyricsTableSyllable(syllableElement) {
        const lyric = syllableElement.dataset.lyric;
        const phraseId = syllableElement.dataset.phraseId;

        const lyricsSection = document.getElementById('lyricsSection');
        if (!lyricsSection) return null;

        const candidates = lyricsSection.querySelectorAll('.syllable');

        // Match by data-vn (Vietnamese text) and phraseId
        for (const candidate of candidates) {
            if (candidate.dataset.vn === lyric &&
                candidate.dataset.phraseId === phraseId) {
                return candidate;
            }
        }

        // Try case-insensitive
        const normalizedLyric = lyric ? lyric.toLowerCase().trim() : '';
        for (const candidate of candidates) {
            const candidateVn = candidate.dataset.vn ? candidate.dataset.vn.toLowerCase().trim() : '';
            if (candidateVn === normalizedLyric &&
                candidate.dataset.phraseId === phraseId) {
                return candidate;
            }
        }

        return null;
    }

    /**
     * Sum rhyme occurrences across all positions (beginning, middle, ending)
     * @param {Object} kricData - KRIC data with beginningRhymes, middleRhymes, endingRhymes
     * @returns {Object} - Combined counts { "i-family": 12, "u-family": 6, ... }
     */
    sumRhymePositions(kricData) {
        const totals = {};

        // Sum across all three positions
        [kricData.beginningRhymes || {},
         kricData.middleRhymes || {},
         kricData.endingRhymes || {}].forEach(positionData => {
            Object.entries(positionData).forEach(([rhyme, count]) => {
                totals[rhyme] = (totals[rhyme] || 0) + count;
            });
        });

        return totals;
    }

    /**
     * Combine KSIC word counts across beginning, middle, ending positions
     * @param {Object} ksicData - KSIC category data with lyricsBased position data
     * @returns {Object} - Combined counts { "bà": 20, "rằng": 12, ... }
     */
    combineKSICWords(ksicData) {
        const totals = {};

        if (!ksicData.lyricsBased) return totals;

        // Sum across all three positions
        [ksicData.lyricsBased.beginningWords || {},
         ksicData.lyricsBased.middleWords || {},
         ksicData.lyricsBased.endingWords || {}].forEach(positionData => {
            Object.entries(positionData).forEach(([word, count]) => {
                totals[word] = (totals[word] || 0) + count;
            });
        });

        return totals;
    }

    /**
     * Render pattern selection controls
     */
    renderPatternControls() {
        const container = document.getElementById('patternControlsContainer');
        if (!container) {
            console.warn('Pattern controls container not found');
            return;
        }

        let html = '<div class="pattern-controls" style="padding: 20px; background: #f5f5f5; border-radius: 8px;">\n';

        // KTIC (Tone) Patterns
        html += this.renderPatternCategory('ktic', 'Tone Patterns (Vietnamese Tones)', '#9B59B6');

        // KRIC (Rhyme) Patterns
        html += this.renderPatternCategory('kric', 'Rhyme Patterns (Vietnamese Rhyme Families)', '#E67E22');

        // KWIC (Word/Syllable) Patterns - Only showing frequent words for now
        html += this.renderPatternCategory('ksic', 'Syllable Patterns (Frequent Words)', '#3498DB');

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Render controls for a specific pattern category
     */
    renderPatternCategory(categoryKey, categoryName, color) {
        if (!this.patternData || !this.patternData[categoryKey]) {
            return '';
        }

        const categoryData = this.patternData[categoryKey];
        let html = `<div class="pattern-category" style="margin-bottom: 20px;">\n`;
        html += `  <h4 style="color: ${color}; margin-bottom: 10px;">${categoryName}</h4>\n`;

        // Get 2-note patterns based on category structure
        let twoNotePatterns = {};
        if (categoryKey === 'ktic') {
            twoNotePatterns = categoryData.twoTonePatterns || {};
        } else if (categoryKey === 'kric') {
            // KRIC: Sum all positions (beginning + middle + ending) for total count
            twoNotePatterns = this.sumRhymePositions(categoryData);
        } else if (categoryKey === 'ksic') {
            // KSIC: Combine beginning + middle + ending words for total frequency
            twoNotePatterns = this.combineKSICWords(categoryData);
        }

        const topPatterns = Object.entries(twoNotePatterns)
            .filter(([pattern, count]) => {
                // For KRIC: Show all specific rhyme families, even rare ones
                if (categoryKey === 'kric') {
                    return count >= 1;  // Show all including single occurrences
                }
                // For other categories: Show patterns with 2+ occurrences
                return count >= 2;
            })
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);  // Show top 15 (increased from 10 to accommodate all rhyme families)

        if (topPatterns.length > 0) {
            html += `  <div style="display: flex; flex-wrap: wrap; gap: 10px;">\n`;
            topPatterns.forEach(([pattern, count]) => {
                html += `    <button class="pattern-btn"
                    style="padding: 8px 12px; background: ${color}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    onclick="window.patternController.highlightPattern('${categoryKey}', '${pattern}', this)">
                    ${pattern} (${count})
                </button>\n`;
            });
            html += `  </div>\n`;
        } else {
            html += `  <p style="color: #999; font-size: 12px;">No patterns available</p>\n`;
        }

        html += `</div>\n`;
        return html;
    }

    /**
     * Highlight pattern occurrences in tablature
     * @param {string} category - KTIC, KRIC, or KWIC
     * @param {string} pattern - Pattern string (e.g., "ngang→huyền" for transitions or "bà" for single words)
     * @param {HTMLElement} buttonElement - Button that was clicked
     */
    highlightPattern(category, pattern, buttonElement) {
        // If syllable data is empty, try to re-extract (might have loaded after initialization)
        if (this.syllableData.length === 0) {
            console.warn('[Pattern Controller] Syllable data empty, re-extracting...');
            this.syllableData = this.extractSyllableData();
            console.log('[Pattern Controller] Re-extracted:', this.syllableData.length, 'syllables');
        }

        // Clear previous highlights
        this.clearHighlights();

        // Toggle if clicking same pattern
        if (this.activePattern === pattern) {
            this.activePattern = null;
            this.resetButtonStates();
            return;
        }

        this.activePattern = pattern;
        this.resetButtonStates();
        buttonElement.style.transform = 'scale(1.1)';
        buttonElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';

        // Parse pattern
        let first, second;

        if (category === 'ksic' || category === 'kric') {
            // KSIC and KRIC patterns are single items, not transitions
            // KSIC: single syllables (e.g., "bà", "rằng")
            // KRIC: single rhyme families (e.g., "i-family", "u-family")
            first = pattern;
            second = null;
        } else {
            // KTIC uses transitions (first→second)
            const parts = pattern.split('→');
            if (parts.length !== 2) {
                console.warn('Invalid pattern format:', pattern);
                return;
            }
            [first, second] = parts;
        }

        const matches = this.findPatternMatches(category, first, second);

        console.log(`Found ${matches.length} matches for ${category} pattern: ${pattern}`);

        // Highlight matches
        matches.forEach(match => {
            this.highlightMatch(match, category);
        });
    }

    /**
     * Find syllables that match a pattern
     * @param {string} category - KTIC, KRIC, or KWIC
     * @param {string} first - First element of pattern (or single word for KWIC)
     * @param {string} second - Second element of pattern (null for KWIC)
     * @returns {Array} Array of matches
     */
    findPatternMatches(category, first, second) {
        const matches = [];
        const field = category === 'ktic' ? 'tone' :
                     category === 'kric' ? 'rhyme' : 'lyric';

        // Debug: Log what we're searching for
        console.log(`[Pattern Matching] Searching for ${category} pattern: "${first}"${second ? ' → ' + second : ''}`);
        console.log(`[Pattern Matching] Field to match: "${field}"`);
        console.log(`[Pattern Matching] Total syllables: ${this.syllableData.length}`);

        // Show sample of what values exist in the data
        if (this.syllableData.length > 0) {
            const sampleValues = this.syllableData.slice(0, 5).map(s => s[field]);
            console.log(`[Pattern Matching] Sample ${field} values:`, sampleValues);
        }

        // Normalize function for case-insensitive comparison
        const normalize = (str) => str ? str.toLowerCase().trim() : '';

        // For KSIC (syllable patterns) and KRIC (rhyme patterns) - single pattern matches
        if (category === 'ksic' || category === 'kric') {
            // Check if pattern is multi-syllable (contains spaces)
            const patternWords = first.trim().split(/\s+/);

            if (patternWords.length === 1) {
                // Single syllable pattern - simple match
                const normalizedFirst = normalize(first);

                // Both pattern data and DOM data have "-family" suffix - match directly
                for (let i = 0; i < this.syllableData.length; i++) {
                    const current = this.syllableData[i];
                    if (normalize(current[field]) === normalizedFirst) {
                        matches.push({
                            first: current,
                            second: null,
                            index: i
                        });
                    }
                }
            } else {
                // Multi-syllable pattern - find consecutive sequence
                for (let i = 0; i <= this.syllableData.length - patternWords.length; i++) {
                    let allMatch = true;

                    // Check if all syllables in sequence match
                    for (let j = 0; j < patternWords.length; j++) {
                        const syllable = this.syllableData[i + j];
                        const normalizedPattern = normalize(patternWords[j]);

                        // Both pattern data and DOM data have "-family" suffix - match directly
                        if (!syllable || normalize(syllable[field]) !== normalizedPattern) {
                            allMatch = false;
                            break;
                        }
                    }

                    if (allMatch) {
                        // Collect all matching syllables
                        const matchedSyllables = [];
                        for (let j = 0; j < patternWords.length; j++) {
                            matchedSyllables.push(this.syllableData[i + j]);
                        }

                        matches.push({
                            first: matchedSyllables[0],
                            second: matchedSyllables.length > 1 ? matchedSyllables.slice(1) : null,
                            allSyllables: matchedSyllables,
                            index: i,
                            length: patternWords.length
                        });
                    }
                }
            }

            return matches;
        }

        // For KTIC only - find tone transitions between pairs (e.g., ngang→huyền)
        const normalizedFirst = normalize(first);
        const normalizedSecond = normalize(second);

        for (let i = 0; i < this.syllableData.length - 1; i++) {
            const current = this.syllableData[i];
            const next = this.syllableData[i + 1];

            if (normalize(current[field]) === normalizedFirst &&
                normalize(next[field]) === normalizedSecond) {
                matches.push({
                    first: current,
                    second: next,
                    index: i
                });
            }
        }

        return matches;
    }

    /**
     * Highlight a pattern match in the tablature
     */
    highlightMatch(match, category) {
        const color = category === 'ktic' ? '#9B59B6' :
                     category === 'kric' ? '#E67E22' : '#3498DB';

        // Debug: Log what's being highlighted
        console.log(`[Highlight] Highlighting ${category} match: "${match.first?.lyric}" (color: ${color})`);

        // Handle multi-syllable patterns (KSIC with multiple words)
        if (match.allSyllables && match.allSyllables.length > 0) {
            // Highlight all syllables in the sequence
            match.allSyllables.forEach(syllable => {
                // Highlight in Syllable Lyrics section
                if (syllable.element) {
                    syllable.element.style.setProperty('background', color, 'important');
                    syllable.element.style.setProperty('color', 'white', 'important');
                    syllable.element.style.setProperty('padding', '4px 8px', 'important');
                    syllable.element.style.setProperty('border-radius', '4px', 'important');
                    syllable.element.style.setProperty('font-weight', 'bold', 'important');
                    syllable.element.style.setProperty('transform', 'scale(1.1)', 'important');
                }
                // Highlight in main Lyrics table
                if (syllable.lyricsTableElement) {
                    syllable.lyricsTableElement.style.setProperty('background', color, 'important');
                    syllable.lyricsTableElement.style.setProperty('color', 'white', 'important');
                    syllable.lyricsTableElement.style.setProperty('padding', '4px 8px', 'important');
                    syllable.lyricsTableElement.style.setProperty('border-radius', '4px', 'important');
                    syllable.lyricsTableElement.style.setProperty('font-weight', 'bold', 'important');
                }
                // Highlight note in tablature (try by ID, fallback to position)
                this.highlightNoteInTablature(syllable.noteId, color, syllable.x, syllable.y);
                // Highlight lyric text in tablature by text content
                this.highlightLyricInTablature(syllable.lyric, color);
            });

            // Draw connection lines between syllables
            for (let i = 0; i < match.allSyllables.length - 1; i++) {
                this.drawConnectionLine(match.allSyllables[i], match.allSyllables[i + 1], color);
            }
        } else {
            // Handle single syllable or transition patterns
            // Highlight first syllable in Syllable Lyrics section
            if (match.first.element) {
                match.first.element.style.setProperty('background', color, 'important');
                match.first.element.style.setProperty('color', 'white', 'important');
                match.first.element.style.setProperty('padding', '4px 8px', 'important');
                match.first.element.style.setProperty('border-radius', '4px', 'important');
                match.first.element.style.setProperty('font-weight', 'bold', 'important');
                match.first.element.style.setProperty('transform', 'scale(1.1)', 'important');
            }
            // Highlight in main Lyrics table
            if (match.first.lyricsTableElement) {
                match.first.lyricsTableElement.style.setProperty('background', color, 'important');
                match.first.lyricsTableElement.style.setProperty('color', 'white', 'important');
                match.first.lyricsTableElement.style.setProperty('padding', '4px 8px', 'important');
                match.first.lyricsTableElement.style.setProperty('border-radius', '4px', 'important');
                match.first.lyricsTableElement.style.setProperty('font-weight', 'bold', 'important');
            }

            // Highlight second syllable if it exists (for transitions)
            if (match.second && match.second.element) {
                match.second.element.style.setProperty('background', color, 'important');
                match.second.element.style.setProperty('color', 'white', 'important');
                match.second.element.style.setProperty('padding', '4px 8px', 'important');
                match.second.element.style.setProperty('border-radius', '4px', 'important');
                match.second.element.style.setProperty('font-weight', 'bold', 'important');
                match.second.element.style.setProperty('transform', 'scale(1.1)', 'important');
            }
            // Highlight in main Lyrics table
            if (match.second && match.second.lyricsTableElement) {
                match.second.lyricsTableElement.style.setProperty('background', color, 'important');
                match.second.lyricsTableElement.style.setProperty('color', 'white', 'important');
                match.second.lyricsTableElement.style.setProperty('padding', '4px 8px', 'important');
                match.second.lyricsTableElement.style.setProperty('border-radius', '4px', 'important');
                match.second.lyricsTableElement.style.setProperty('font-weight', 'bold', 'important');
            }

            // Draw connection line in tablature (only for transitions)
            if (match.second) {
                this.drawConnectionLine(match.first, match.second, color);
            }

            // Highlight notes in tablature (try by ID, fallback to position)
            this.highlightNoteInTablature(match.first.noteId, color, match.first.x, match.first.y);
            if (match.second) {
                this.highlightNoteInTablature(match.second.noteId, color, match.second.x, match.second.y);
            }

            // Highlight lyric text in tablature by text content
            this.highlightLyricInTablature(match.first.lyric, color);
            if (match.second) {
                this.highlightLyricInTablature(match.second.lyric, color);
            }
        }

        // Store for cleanup
        this.currentHighlights.push(match);
    }

    /**
     * Draw a connection line between two syllables in tablature
     */
    drawConnectionLine(first, second, color) {
        const svg = document.getElementById('optimalSvg');
        if (!svg) return;

        // Validate coordinates - must be valid numbers
        if (!first || !second ||
            typeof first.x !== 'number' || isNaN(first.x) ||
            typeof first.y !== 'number' || isNaN(first.y) ||
            typeof second.x !== 'number' || isNaN(second.x) ||
            typeof second.y !== 'number' || isNaN(second.y)) {
            console.warn('Invalid coordinates for connection line:', { first, second });
            return;
        }

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', first.x);
        line.setAttribute('y1', first.y - 20);  // Above note
        line.setAttribute('x2', second.x);
        line.setAttribute('y2', second.y - 20);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '3');
        line.setAttribute('opacity', '0.7');
        line.setAttribute('class', 'pattern-connection-line');

        svg.appendChild(line);
    }

    /**
     * Highlight a note in the tablature SVG
     * Finds note by position (cx, cy) matching the syllable's x, y coordinates
     */
    highlightNoteInTablature(noteId, color, x, y) {
        const svg = document.getElementById('optimalSvg');
        if (!svg) return;

        let noteElements = [];

        // Try by ID first
        if (noteId && noteId.trim()) {
            const noteById = document.getElementById(noteId);
            if (noteById) {
                noteElements.push(noteById);
            }
        }

        // Always also try position-based matching (more reliable)
        if (x && y) {
            const notes = svg.querySelectorAll('circle.main-note, circle.grace-note, circle[class*="note"]');
            for (const note of notes) {
                const cx = parseFloat(note.getAttribute('cx'));
                const cy = parseFloat(note.getAttribute('cy'));
                // Match if within 10 pixels
                if (Math.abs(cx - x) < 10 && Math.abs(cy - y) < 10) {
                    noteElements.push(note);
                }
            }
        }

        // Apply highlighting to all found notes
        noteElements.forEach(noteElement => {
            noteElement.style.setProperty('filter', `drop-shadow(0 0 12px ${color})`, 'important');
            noteElement.style.setProperty('fill', color, 'important');
            noteElement.style.setProperty('stroke', '#FFFFFF', 'important');
            noteElement.style.setProperty('stroke-width', '3', 'important');
            console.log('[Note Highlight] Highlighted note at', noteElement.getAttribute('cx'), noteElement.getAttribute('cy'));
        });
    }

    /**
     * Highlight lyric text in tablature SVG by matching text content
     * @param {string} lyricText - The lyric text to highlight (e.g., "đi", "Rí")
     */
    highlightLyricInTablature(lyricText, color) {
        const svg = document.getElementById('optimalSvg');
        if (!svg || !lyricText) return;

        // Normalize the lyric text for matching
        const normalizedTarget = lyricText.toLowerCase().trim();

        // Find all lyric text elements
        const lyrics = svg.querySelectorAll('text.lyric-text, text[class*="lyric"]');

        for (const lyric of lyrics) {
            const lyricContent = lyric.textContent.toLowerCase().trim();

            // Match by text content
            if (lyricContent === normalizedTarget) {
                lyric.style.setProperty('fill', color, 'important');
                lyric.style.setProperty('font-weight', 'bold', 'important');
                lyric.style.setProperty('font-size', '16px', 'important');
            }
        }
    }

    /**
     * Clear all pattern highlights
     */
    clearHighlights() {
        // Clear syllable highlights in both sections
        this.syllableData.forEach(syl => {
            // Clear Syllable Lyrics section
            if (syl.element) {
                syl.element.style.removeProperty('background');
                syl.element.style.removeProperty('color');
                syl.element.style.removeProperty('padding');
                syl.element.style.removeProperty('border-radius');
                syl.element.style.removeProperty('font-weight');
                syl.element.style.removeProperty('transform');
            }
            // Clear main Lyrics table
            if (syl.lyricsTableElement) {
                syl.lyricsTableElement.style.removeProperty('background');
                syl.lyricsTableElement.style.removeProperty('color');
                syl.lyricsTableElement.style.removeProperty('padding');
                syl.lyricsTableElement.style.removeProperty('border-radius');
                syl.lyricsTableElement.style.removeProperty('font-weight');
            }
        });

        // Clear note highlights
        this.currentHighlights.forEach(match => {
            // Handle multi-syllable patterns
            if (match.allSyllables && match.allSyllables.length > 0) {
                match.allSyllables.forEach(syllable => {
                    if (syllable.noteId) {
                        const note = document.getElementById(syllable.noteId);
                        if (note) {
                            note.style.filter = '';
                            note.style.fill = '';
                        }
                    }
                });
            } else {
                // Handle single syllable or transition patterns
                if (match.first && match.first.noteId) {
                    const note = document.getElementById(match.first.noteId);
                    if (note) {
                        note.style.filter = '';
                        note.style.fill = '';
                    }
                }
                if (match.second && match.second.noteId) {
                    const note = document.getElementById(match.second.noteId);
                    if (note) {
                        note.style.filter = '';
                        note.style.fill = '';
                    }
                }
            }
        });

        // Remove connection lines
        const lines = document.querySelectorAll('.pattern-connection-line');
        lines.forEach(line => line.remove());

        // Clear tablature lyric text highlights
        const svg = document.getElementById('optimalSvg');
        if (svg) {
            const lyrics = svg.querySelectorAll('text.lyric-text, text[class*="lyric"]');
            lyrics.forEach(lyric => {
                lyric.style.removeProperty('fill');
                lyric.style.removeProperty('font-weight');
                lyric.style.removeProperty('font-size');
            });
        }

        this.currentHighlights = [];
    }

    /**
     * Reset all button visual states
     */
    resetButtonStates() {
        const buttons = document.querySelectorAll('.pattern-btn');
        buttons.forEach(btn => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        });
    }
}

// Global instance
window.patternController = new PatternVisualizationController();
