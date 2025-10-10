// Lyrics Table HTML Generator
// Extracted from vertical-demo-server.js for reusability

class LyricsTableGenerator {
    constructor() {
        this.lingTypeColors = {
            question: '#4ECDC4',
            answer: '#95E1D3',
            exclamatory: '#FF6B6B',
            complaint: '#FFD93D',
            onomatopoeia: '#C3AED6',
            narrative: '#A8E6CF'
        };
    }

    /**
     * Generate clickable Vietnamese words with data attributes
     */
    generateClickableWords(phrase, phraseIndex) {
        if (!phrase.wordMapping) return phrase.vietnameseText || phrase.text;

        return phrase.wordMapping.map((m, idx) =>
            `<span class="syllable" data-phrase="${phraseIndex}" data-word="${idx}" data-vn="${m.vn}" data-en="${m.en}" ` +
            `style="cursor: pointer; padding: 2px 3px; border-radius: 2px; transition: background 0.2s;" ` +
            `onclick="highlightWord(${phraseIndex}, ${idx})">${m.vn}</span>`
        ).join(' ');
    }

    /**
     * Generate clickable English translation with data attributes
     */
    generateClickableEnglish(phrase, phraseIndex) {
        if (!phrase.english || !phrase.wordMapping) return phrase.english || '';

        return phrase.wordMapping.map((m, idx) =>
            `<span class="en-word" data-phrase="${phraseIndex}" data-word="${idx}" data-vn="${m.vn}" data-en="${m.en}" ` +
            `style="cursor: pointer; padding: 2px 3px; border-radius: 2px; transition: background 0.2s;" ` +
            `onclick="highlightWord(${phraseIndex}, ${idx})">${m.en}</span>`
        ).join(' ');
    }

    /**
     * Generate a single table row for a phrase
     */
    generatePhraseRow(phrase, phraseIndex, noteIndex) {
        const lingType = phrase.linguisticType || 'narrative';
        const lingColor = this.lingTypeColors[lingType] || '#95A5A6';

        const startNote = noteIndex;
        const endNote = noteIndex + phrase.syllableCount - 1;

        const vietnameseText = phrase.vietnameseText || phrase.text;

        return `
        <tr data-phrase="${phraseIndex}" data-start-note="${startNote}" data-end-note="${endNote}" style="border-bottom: 1px solid #e0e0e0; height: 30px;">
            <td style="padding: 6px; background: ${lingColor}; color: white; text-align: center; font-weight: 600; font-size: 10px; vertical-align: middle; line-height: 1.2;">
                <div style="margin-bottom: 1px;">${lingType}</div>
                <div style="font-size: 9px; opacity: 0.9;">${phrase.syllableCount} syl</div>
            </td>
            <td style="padding: 4px; text-align: center; font-weight: 600; color: #666; font-size: 13px; vertical-align: middle;">${phraseIndex + 1}</td>
            <td style="padding: 4px; text-align: center; vertical-align: middle;">
                <div style="display: flex; gap: 3px; justify-content: center; flex-wrap: nowrap;">
                    <button title="Play phrase" onclick="if(window.lyricsController) window.lyricsController.playPhrase(${phrase.id})" style="width: 22px; height: 22px; border: 1px solid #27AE60; background: white; border-radius: 3px; cursor: pointer; font-size: 11px; padding: 0; color: #27AE60;">▶</button>
                    <button title="Loop phrase" onclick="if(window.lyricsController) window.lyricsController.toggleLoop(${phrase.id}, this)" data-phrase="${phrase.id}" class="loop-btn-${phrase.id}" style="width: 22px; height: 22px; border: 1px solid #3498DB; background: white; border-radius: 3px; cursor: pointer; font-size: 11px; padding: 0; color: #3498DB;">🔁</button>
                    <button title="Stop" onclick="if(window.lyricsController) window.lyricsController.stopPhrase(${phrase.id})" style="width: 22px; height: 22px; border: 1px solid #E74C3C; background: white; border-radius: 3px; cursor: pointer; font-size: 11px; padding: 0; color: #E74C3C;">■</button>
                    <button class="phrase-control-btn btn-pronunciation" title="Pronunciation" onclick="if(window.lyricsController) window.lyricsController.showPronunciation(${JSON.stringify(phrase).replace(/"/g, '&quot;')})" style="width: 22px; height: 22px; border: 1px solid #9B59B6; background: white; border-radius: 3px; cursor: pointer; font-size: 10px; padding: 0; color: #9B59B6;">🗣</button>
                    <button class="phrase-control-btn btn-info" title="Word meanings" style="width: 22px; height: 22px; border: 1px solid #F39C12; background: white; border-radius: 3px; cursor: pointer; font-size: 10px; padding: 0; color: #F39C12;">📖</button>
                    <button title="Google Translate" onclick="window.open('https://translate.google.com/?sl=vi&tl=en&text=${encodeURIComponent(vietnameseText)}&op=translate', '_blank')" style="width: 22px; height: 22px; border: 1px solid #008080; background: white; border-radius: 3px; cursor: pointer; font-size: 10px; padding: 0; color: #008080;">🌐</button>
                </div>
            </td>
            <td class="vn-text" style="padding: 4px 8px; font-size: 14px; line-height: 1.3; vertical-align: middle; white-space: nowrap;">${this.generateClickableWords(phrase, phraseIndex)}</td>
            <td class="en-text" style="padding: 4px 8px; font-size: 13px; color: #555; font-style: italic; line-height: 1.3; vertical-align: middle; white-space: nowrap;">${this.generateClickableEnglish(phrase, phraseIndex)}</td>
        </tr>`;
    }

    /**
     * Generate table header
     */
    generateTableHeader() {
        return `
        <thead>
            <tr style="background: #008080; color: white;">
                <th style="width: 120px; padding: 8px; text-align: center; font-size: 11px;">Type</th>
                <th style="width: 40px; padding: 8px; text-align: center; font-size: 11px;">#</th>
                <th style="width: 140px; padding: 8px; text-align: center; font-size: 11px;">Controls</th>
                <th style="width: 450px; padding: 8px; font-size: 11px;">Tiếng Việt</th>
                <th style="width: 500px; padding: 8px; font-size: 11px;">English</th>
            </tr>
        </thead>`;
    }

    /**
     * Generate font controls
     */
    generateFontControls() {
        return `
        <div style="margin-bottom: 15px; padding: 12px; background: white; border-radius: 6px;">
            <label style="margin-right: 15px;">Font:
                <select id="lyricsFont" onchange="changeLyricsFont(this.value)">
                    <option>Arial</option>
                    <option>Times New Roman</option>
                    <option>Roboto</option>
                    <option>Georgia</option>
                </select>
            </label>
            <label>Size:
                <input type="range" id="lyricsFontSize" min="12" max="28" value="16" oninput="changeLyricsFontSize(this.value)">
                <span id="lyricsFontSizeDisplay">16px</span>
            </label>
        </div>`;
    }

    /**
     * Generate JavaScript for client-side functionality
     */
    generateClientScript() {
        return `
        <script>
        // Lyrics phrase playback state
        window.phraseLoopState = {};

        function changeLyricsFont(font) {
            document.getElementById('lyricsTable').style.fontFamily = font;
        }
        function changeLyricsFontSize(size) {
            document.getElementById('lyricsFontSizeDisplay').textContent = size + 'px';
            // Only change lyrics cells, not headers
            document.querySelectorAll('#lyricsTable .vn-text').forEach(el => el.style.fontSize = size + 'px');
            document.querySelectorAll('#lyricsTable .en-text').forEach(el => el.style.fontSize = Math.round(size * 0.93) + 'px');
            // Adjust column widths (Vietnamese and English only)
            const ratio = size / 14; // Base 14px
            const headers = document.querySelectorAll('#lyricsTable thead th');
            headers[3].style.width = Math.round(450 * ratio) + 'px'; // Vietnamese (4th column)
            headers[4].style.width = Math.round(500 * ratio) + 'px'; // English (5th column)
        }
        function highlightWord(phraseId, wordId) {
            document.querySelectorAll('.syllable, .en-word').forEach(el => {
                el.style.background = ''; el.style.color = ''; el.style.fontWeight = '';
            });
            document.querySelectorAll(\`[data-phrase="\${phraseId}"][data-word="\${wordId}"]\`).forEach(el => {
                el.style.background = '#3498DB'; el.style.color = 'white'; el.style.fontWeight = 'bold';
            });
        }
        // V4.2.6: All playback now handled by lyricsController (single source of truth)
        </script>`;
    }

    /**
     * Generate complete lyrics table HTML
     * @param {Object} segmentationResult - Phrase segmentation data with phrases array
     * @returns {string} Complete HTML for lyrics table
     */
    generateTable(segmentationResult) {
        if (!segmentationResult || !segmentationResult.phrases || segmentationResult.phrases.length === 0) {
            return '<p style="padding: 20px; text-align: center; color: #999;">No lyrics available for this song.</p>';
        }

        // Generate all table rows
        let noteIndex = 0;
        const rows = segmentationResult.phrases.map((phrase, i) => {
            const row = this.generatePhraseRow(phrase, i, noteIndex);
            noteIndex += phrase.syllableCount;
            return row;
        }).join('');

        // Assemble complete table
        return `
            ${this.generateFontControls()}
            <table id="lyricsTable" style="width: auto; border-collapse: collapse; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); table-layout: fixed;">
                ${this.generateTableHeader()}
                <tbody id="lyricsTableBody">${rows}</tbody>
            </table>
            ${this.generateClientScript()}
        `;
    }
}

module.exports = LyricsTableGenerator;
