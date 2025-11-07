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
            console.log('Extracted syllable data:', this.syllableData.length, 'syllables');

            // Render pattern controls
            this.renderPatternControls();

        } catch (error) {
            console.error('Pattern visualization initialization error:', error);
        }
    }

    /**
     * Extract syllable data from DOM elements
     * @returns {Array} Array of syllable objects with positions and linguistic data
     */
    extractSyllableData() {
        const syllables = [];
        const syllableElements = document.querySelectorAll('.syllable');

        syllableElements.forEach(el => {
            syllables.push({
                element: el,
                lyric: el.dataset.lyric,
                tone: el.dataset.tone,
                rhyme: el.dataset.rhyme,
                phraseId: el.dataset.phraseId,
                noteIndex: parseInt(el.dataset.noteIndex),
                x: parseFloat(el.dataset.noteX),
                y: parseFloat(el.dataset.noteY),
                noteId: el.dataset.noteId
            });
        }�們=���]�XPY1rn syllables;
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
        if (category === 'ktic') {
            console.log(`Highlighting KTIC match:`, {
                first: match.first?.lyric || 'N/A',
                firstTone: match.first?.tone || 'N/A',
                second: match.second?.lyric || 'N/A',
                secondTone: match.second?.tone || 'N/A'
            });
        }

        // Handle multi-syllable patterns (KSIC with multiple words)
        if (match.allSyllables && match.allSyllables.length > 0) {
            // Highlight all syllables in the sequence
            match.allSyllables.forEach(syllable => {
                if (syllable.element) {
                    syllable.element.style.background = color;
                    syllable.element.style.color = 'white';
                    syllable.element.style.padding = '4px 8px';
                    syllable.element.style.borderRadius = '4px';
                }
                // Highlight note in tablature
                if (syllable.noteId) {
                    this.highlightNoteInTablature(syllable.noteId, color);
                }
            });

            // Draw connection lines between syllables
            for (let i = 0; i < match.allSyllables.length - 1; i++) {
                this.drawConnectionLine(match.allSyllables[i], match.allSyllables[i + 1], color);
            }
        } else {
            // Handle single syllable or transition patterns
            // Highlight first syllable in DOM
            if (match.first.element) {
                match.first.element.style.background = color;
                match.first.element.style.color = 'white';
                match.first.element.style.padding = '4px 8px';
                match.first.element.style.borderRadius = '4px';
            }

            // Highlight second syllable if it exists (for transitions)
            if (match.second && match.second.element) {
                match.second.element.style.background = color;
                match.second.element.style.color = 'white';
                match.second.element.style.padding = '4px 8px';
                match.second.element.style.borderRadius = '4px';
            }

            // Draw connection line in tablature (only for transitions)
            if (match.second) {
                this.drawConnectionLine(match.first, match.second, color);
            }

            // Highlight notes in tablature
            this.highlightNoteInTablature(match.first.noteId, color);
            if (match.second) {
                this.highlightNoteInTablature(match.second.noteId, color);
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
     */
    highlightNoteInTablature(noteId, color) {
        if (!noteId) return;

        const noteElement = document.getElementById(noteId);
        if (noteElement) {
            noteElement.style.filter = `drop-shadow(0 0 8px ${color})`;
            noteElement.style.fill = color;
        }
    }

    /**
     * Clear all pattern highlights
     */
    clearHighlights() {
        // Clear syllable highlights
        this.syllableData.forEach(syl => {
            if (syl.element) {
                syl.element.style.background = '';
                syl.element.style.color = '';
                syl.element.style.padding = '';
                syl.element.style.borderRadius = '';
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
