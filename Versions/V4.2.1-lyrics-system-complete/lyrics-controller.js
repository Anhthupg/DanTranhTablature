/**
 * Lyrics Controller - V4.2.0
 * Ultra-Compact Single-Row Design with Interactive Word-to-Word Highlighting
 *
 * Features:
 * - Loads lyrics segmentation JSON
 * - Renders 28 phrases in ultra-compact format (30px height)
 * - 6 control buttons per phrase (horizontal layout)
 * - Interactive word-to-word highlighting
 * - Color-coded linguistic types (7 colors)
 */

class LyricsController {
    constructor() {
        this.lyricsData = null;
        this.currentlyPlaying = null;
        this.isLooping = {};
        this.highlightedWords = new Set();

        // Linguistic type colors (7 colors)
        this.typeColors = {
            'exclamatory': '#FF6B6B',      // Red - emotional
            'question': '#4ECDC4',         // Cyan - inquiry
            'answer': '#95E1D3',           // Light cyan - response
            'narrative': '#A8E6CF',        // Light green - storytelling
            'complaint': '#FFD93D',        // Yellow - dissatisfaction
            'onomatopoeia': '#C3AED6',     // Purple - sound effects
            'descriptive': '#8AC4D0'       // Blue-grey - description
        };
    }

    async initialize() {
        console.log('[LyricsController] Initializing...');

        // Load lyrics data
        await this.loadLyricsData();

        // Render phrases
        this.renderPhrases();

        // Update statistics
        this.updateStatistics();

        console.log('[LyricsController] Initialized successfully');
    }

    async loadLyricsData() {
        try {
            const response = await fetch('/api/lyrics/Bà rằng bà rí');
            this.lyricsData = await response.json();
            console.log(`[LyricsController] Loaded ${this.lyricsData.phrases.length} phrases`);
        } catch (error) {
            console.error('[LyricsController] Error loading lyrics:', error);
            this.lyricsData = { phrases: [], statistics: {} };
        }
    }

    renderPhrases() {
        const tbody = document.getElementById('lyricsTableBody');
        if (!tbody || !this.lyricsData) return;

        tbody.innerHTML = '';

        this.lyricsData.phrases.forEach(phrase => {
            const row = this.createPhraseRow(phrase);
            tbody.appendChild(row);
        });
    }

    createPhraseRow(phrase) {
        const row = document.createElement('tr');
        row.dataset.phraseId = phrase.id;
        row.style.backgroundColor = this.typeColors[phrase.linguisticType] + '15'; // 15% opacity

        // Column 1: Controls (100px width, horizontal buttons)
        const controlsCell = document.createElement('td');
        controlsCell.className = 'controls-column';
        controlsCell.innerHTML = `
            <div class="phrase-controls">
                <button class="phrase-control-btn btn-play" title="Play phrase">▶</button>
                <button class="phrase-control-btn btn-loop" title="Loop phrase">🔁</button>
                <button class="phrase-control-btn btn-stop" title="Stop">■</button>
                <button class="phrase-control-btn btn-pronunciation" title="Pronunciation guide">🗣</button>
                <button class="phrase-control-btn btn-info" title="Show note mappings">📖</button>
                <button class="phrase-control-btn btn-translate" title="Google Translate">🌐</button>
            </div>
        `;

        // Column 2: Vietnamese text with word highlighting
        const vietnameseCell = document.createElement('td');
        vietnameseCell.className = 'vietnamese-column';
        vietnameseCell.innerHTML = this.renderVietnameseText(phrase);

        // Column 3: English translation with word highlighting
        const englishCell = document.createElement('td');
        englishCell.className = 'english-column';
        englishCell.innerHTML = this.renderEnglishText(phrase);

        row.appendChild(controlsCell);
        row.appendChild(vietnameseCell);
        row.appendChild(englishCell);

        // Wire up event listeners
        this.attachEventListeners(row, phrase);

        return row;
    }

    renderVietnameseText(phrase) {
        if (!phrase.wordMapping) {
            return `<div class="phrase-text">${phrase.text}</div>`;
        }

        const words = phrase.wordMapping.map((mapping, idx) => {
            return `<span class="syllable" data-phrase-id="${phrase.id}" data-word-index="${idx}" data-vn="${mapping.vn}" data-en="${mapping.en}">${mapping.vn}</span>`;
        }).join(' ');

        return `<div class="phrase-text">${words}</div>`;
    }

    renderEnglishText(phrase) {
        if (!phrase.english || !phrase.wordMapping) {
            return `<div class="phrase-translation">${phrase.english || ''}</div>`;
        }

        const words = phrase.wordMapping.map((mapping, idx) => {
            return `<span class="translation-word" data-phrase-id="${phrase.id}" data-word-index="${idx}" data-vn="${mapping.vn}" data-en="${mapping.en}">${mapping.en}</span>`;
        }).join(' ');

        return `<div class="phrase-translation">${words}</div>`;
    }

    attachEventListeners(row, phrase) {
        const phraseId = phrase.id;

        // Control buttons
        const playBtn = row.querySelector('.btn-play');
        const loopBtn = row.querySelector('.btn-loop');
        const stopBtn = row.querySelector('.btn-stop');
        const pronunciationBtn = row.querySelector('.btn-pronunciation');
        const infoBtn = row.querySelector('.btn-info');
        const translateBtn = row.querySelector('.btn-translate');

        playBtn.addEventListener('click', () => this.playPhrase(phraseId));
        loopBtn.addEventListener('click', () => this.toggleLoop(phraseId, loopBtn));
        stopBtn.addEventListener('click', () => this.stopPhrase(phraseId));
        pronunciationBtn.addEventListener('click', () => this.showPronunciation(phrase));
        infoBtn.addEventListener('click', () => this.showNoteMapping(phrase));
        translateBtn.addEventListener('click', () => this.openGoogleTranslate(phrase));

        // Word highlighting
        const vnWords = row.querySelectorAll('.syllable');
        const enWords = row.querySelectorAll('.translation-word');

        vnWords.forEach(word => {
            word.addEventListener('click', (e) => this.handleWordClick(e, row));
        });

        enWords.forEach(word => {
            word.addEventListener('click', (e) => this.handleWordClick(e, row));
        });
    }

    // ========== CONTROL BUTTON HANDLERS ==========

    playPhrase(phraseId) {
        console.log(`[LyricsController] Play phrase ${phraseId}`);
        // TODO: Integrate with audio playback controller
        // For now, just highlight the phrase
        this.highlightPlayingPhrase(phraseId);

        // Simulate playback duration
        setTimeout(() => {
            if (!this.isLooping[phraseId]) {
                this.clearPlayingPhrase(phraseId);
            } else {
                this.playPhrase(phraseId); // Loop
            }
        }, 3000);
    }

    toggleLoop(phraseId, loopBtn) {
        this.isLooping[phraseId] = !this.isLooping[phraseId];

        if (this.isLooping[phraseId]) {
            loopBtn.style.backgroundColor = '#3498DB';
            loopBtn.style.color = 'white';
        } else {
            loopBtn.style.backgroundColor = 'white';
            loopBtn.style.color = '#3498DB';
        }

        console.log(`[LyricsController] Loop ${phraseId}: ${this.isLooping[phraseId]}`);
    }

    stopPhrase(phraseId) {
        console.log(`[LyricsController] Stop phrase ${phraseId}`);
        this.isLooping[phraseId] = false;
        this.clearPlayingPhrase(phraseId);

        // Reset loop button
        const row = document.querySelector(`tr[data-phrase-id="${phraseId}"]`);
        const loopBtn = row?.querySelector('.btn-loop');
        if (loopBtn) {
            loopBtn.style.backgroundColor = 'white';
            loopBtn.style.color = '#3498DB';
        }
    }

    showPronunciation(phrase) {
        console.log(`[LyricsController] Show pronunciation for phrase ${phrase.id}`);

        // Create a simple modal showing IPA or pronunciation guide
        const pronunciation = this.generatePronunciationGuide(phrase);
        alert(`Pronunciation Guide:\n\n${phrase.text}\n\n${pronunciation}`);
    }

    generatePronunciationGuide(phrase) {
        // Simple pronunciation guide (could be enhanced with actual IPA data)
        if (!phrase.wordMapping) return 'No pronunciation data available';

        return phrase.wordMapping.map(m => `${m.vn} → [${m.en}]`).join('\n');
    }

    showNoteMapping(phrase) {
        console.log(`[LyricsController] Show note mapping for phrase ${phrase.id}`);

        // TODO: Integrate with tablature to show which notes correspond to which syllables
        // For now, show the word mapping
        if (!phrase.wordMapping) {
            alert('No note mapping data available');
            return;
        }

        const mapping = phrase.wordMapping.map((m, idx) =>
            `${idx + 1}. ${m.vn} → ${m.en}`
        ).join('\n');

        alert(`Note Mapping:\n\n${mapping}\n\n(Note: Note-to-syllable linking coming soon!)`);
    }

    openGoogleTranslate(phrase) {
        console.log(`[LyricsController] Open Google Translate for phrase ${phrase.id}`);

        const text = encodeURIComponent(phrase.text);
        const url = `https://translate.google.com/?sl=vi&tl=en&text=${text}&op=translate`;
        window.open(url, '_blank');
    }

    // ========== HIGHLIGHTING ==========

    highlightPlayingPhrase(phraseId) {
        const row = document.querySelector(`tr[data-phrase-id="${phraseId}"]`);
        if (row) {
            row.style.outline = '3px solid #27AE60';
            row.style.backgroundColor = 'rgba(39, 174, 96, 0.1)';
        }
    }

    clearPlayingPhrase(phraseId) {
        const row = document.querySelector(`tr[data-phrase-id="${phraseId}"]`);
        if (row) {
            row.style.outline = '';
            // Restore original background color based on linguistic type
            const phrase = this.lyricsData.phrases.find(p => p.id === phraseId);
            if (phrase) {
                row.style.backgroundColor = this.typeColors[phrase.linguisticType] + '15';
            }
        }
    }

    handleWordClick(event, row) {
        const word = event.target;
        const phraseId = word.dataset.phraseId;
        const wordIndex = word.dataset.wordIndex;
        const vnWord = word.dataset.vn;
        const enWord = word.dataset.en;

        console.log(`[LyricsController] Word clicked: ${vnWord} → ${enWord}`);

        // Toggle highlight
        const wordKey = `${phraseId}-${wordIndex}`;

        if (this.highlightedWords.has(wordKey)) {
            this.clearWordHighlight(phraseId, wordIndex);
            this.highlightedWords.delete(wordKey);
        } else {
            this.highlightWord(phraseId, wordIndex);
            this.highlightedWords.add(wordKey);
        }

        // TODO: Highlight corresponding note in tablature
        this.highlightCorrespondingNote(phraseId, wordIndex);
    }

    highlightWord(phraseId, wordIndex) {
        const row = document.querySelector(`tr[data-phrase-id="${phraseId}"]`);
        if (!row) return;

        // Highlight both Vietnamese and English words
        const vnWord = row.querySelector(`.syllable[data-phrase-id="${phraseId}"][data-word-index="${wordIndex}"]`);
        const enWord = row.querySelector(`.translation-word[data-phrase-id="${phraseId}"][data-word-index="${wordIndex}"]`);

        if (vnWord) vnWord.classList.add('highlighted');
        if (enWord) enWord.classList.add('highlighted');
    }

    clearWordHighlight(phraseId, wordIndex) {
        const row = document.querySelector(`tr[data-phrase-id="${phraseId}"]`);
        if (!row) return;

        const vnWord = row.querySelector(`.syllable[data-phrase-id="${phraseId}"][data-word-index="${wordIndex}"]`);
        const enWord = row.querySelector(`.translation-word[data-phrase-id="${phraseId}"][data-word-index="${wordIndex}"]`);

        if (vnWord) vnWord.classList.remove('highlighted');
        if (enWord) enWord.classList.remove('highlighted');
    }

    highlightCorrespondingNote(phraseId, wordIndex) {
        // TODO: Find and highlight the corresponding note in the tablature SVG
        console.log(`[LyricsController] Highlighting note for phrase ${phraseId}, word ${wordIndex}`);

        // This will be integrated with the tablature system
        // For now, just log it
    }

    // ========== STATISTICS ==========

    updateStatistics() {
        if (!this.lyricsData || !this.lyricsData.statistics) return;

        const stats = this.lyricsData.statistics;

        document.querySelector('[data-metric="total-phrases"]').textContent = stats.totalPhrases || '-';
        document.querySelector('[data-metric="total-syllables"]').textContent = stats.totalSyllables || '-';
        document.querySelector('[data-metric="phrase-pattern"]').textContent = stats.dominantPattern || '-';

        // Melisma count not in current data structure, placeholder
        document.querySelector('[data-metric="melisma-count"]').textContent = '-';
    }
}

// Global instance
window.lyricsController = new LyricsController();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[LyricsController] DOM ready, initializing...');
    window.lyricsController.initialize();
});