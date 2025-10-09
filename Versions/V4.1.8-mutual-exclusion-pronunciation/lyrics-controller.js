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

        // Load relationships data for note mappings
        await this.loadRelationships();

        // DON'T render phrases - server already generated the table!
        // this.renderPhrases();

        // Only update statistics (metrics cards)
        this.updateStatistics();

        // Attach event listeners to server-generated buttons
        this.attachEventListenersToExistingTable();

        // Add spacebar keyboard shortcut for stop
        this.attachKeyboardShortcuts();

        console.log('[LyricsController] Initialized successfully');
    }

    attachKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Spacebar: Stop current playback
            if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
                e.preventDefault();
                if (this.currentlyPlaying) {
                    console.log('[LyricsController] Spacebar pressed - stopping playback');
                    this.stopPhrase(this.currentlyPlaying);
                }
            }
        });

        console.log('[LyricsController] Keyboard shortcuts attached (Spacebar = Stop)');
    }

    async refresh() {
        console.log('[LyricsController] Refreshing for new song...');

        // Stop any playing audio
        if (this.currentlyPlaying) {
            this.stopPhrase(this.currentlyPlaying);
        }

        // Reload data
        await this.loadLyricsData();
        await this.loadRelationships();

        // Update statistics
        this.updateStatistics();

        // Reattach event listeners
        this.attachEventListenersToExistingTable();

        console.log('[LyricsController] Refresh complete');
    }

    async loadLyricsData() {
        try {
            // Get currently loaded song from library controller
            let currentSong = window.libraryController?.currentSong || 'Bà rằng bà rí';
            currentSong = currentSong.replace(/\.musicxml\.xml$/i, '');

            const response = await fetch(`/api/lyrics/${encodeURIComponent(currentSong)}`);
            this.lyricsData = await response.json();
            console.log(`[LyricsController] Loaded ${this.lyricsData.phrases.length} phrases`);
        } catch (error) {
            console.error('[LyricsController] Error loading lyrics:', error);
            this.lyricsData = { phrases: [], statistics: {} };
        }
    }

    async loadRelationships() {
        try {
            // Get currently loaded song from library controller
            let currentSong = window.libraryController?.currentSong || 'Bà rằng bà rí';
            currentSong = currentSong.replace(/\.musicxml\.xml$/i, '');

            const response = await fetch(`/api/relationships/${encodeURIComponent(currentSong)}`);
            this.relationships = await response.json();
            console.log(`[LyricsController] Loaded relationships with ${this.relationships.wordToNoteMap.length} word mappings`);
        } catch (error) {
            console.error('[LyricsController] Error loading relationships:', error);
            this.relationships = { wordToNoteMap: [], noteToWordMap: {} };
        }
    }

    attachEventListenersToExistingTable() {
        // Server already generated the table - just attach event listeners to buttons
        if (!this.lyricsData || !this.lyricsData.phrases) return;

        this.lyricsData.phrases.forEach((phrase, index) => {
            const row = document.querySelector(`tr[data-phrase="${index}"]`);
            if (!row) return;

            // Find buttons in this row
            const pronunciationBtn = row.querySelector('.btn-pronunciation');
            const infoBtn = row.querySelector('.btn-info');

            // Attach event listeners
            if (pronunciationBtn) {
                pronunciationBtn.addEventListener('click', () => this.showPronunciation(phrase));
            }

            if (infoBtn) {
                infoBtn.addEventListener('click', () => this.showNoteMapping(phrase));
            }

            // Word highlighting on clickable words
            const vnWords = row.querySelectorAll('.syllable');
            const enWords = row.querySelectorAll('.translation-word');

            vnWords.forEach(word => {
                word.addEventListener('click', (e) => this.handleWordClick(e, row));
            });

            enWords.forEach(word => {
                word.addEventListener('click', (e) => this.handleWordClick(e, row));
            });
        });

        console.log('[LyricsController] Event listeners attached to server-generated table');
    }

    // ========== CONTROL BUTTON HANDLERS (Server-generated table) ==========
    // NOTE: Table rendering removed - server generates table with LLM segmentation data
    // Controller only handles: statistics calculation + event listener attachment

    playPhrase(phraseId) {
        console.log(`[LyricsController] ═══ Play phrase ${phraseId} ═══`);

        // Stop any existing playback first (including other phrases)
        if (window.audioController) {
            window.audioController.stop();
        }

        // Clear any previous phrase's playing state
        if (this.currentlyPlaying && this.currentlyPlaying !== phraseId) {
            this.clearPlayingPhrase(this.currentlyPlaying);
        }

        if (!this.relationships || !this.relationships.wordToNoteMap) {
            console.warn('[LyricsController] No relationships data - cannot play phrase');
            return;
        }

        // Get all word mappings for this phrase
        const phraseWords = this.relationships.wordToNoteMap.filter(m => m.phraseId === phraseId);

        if (phraseWords.length === 0) {
            console.warn(`[LyricsController] No word mappings found for phrase ${phraseId}`);
            return;
        }

        console.log(`[LyricsController] Phrase ${phraseId} has ${phraseWords.length} words:`);
        phraseWords.forEach((w, i) => {
            console.log(`  Word ${i}: "${w.syllable}" -> ${w.noteIds.join(', ')}`);
        });

        // V4.2.6: Use ALL notes from corrected relationships mapping
        // Mapping now correctly excludes pre-slur graces (belong to next phrase)
        // Includes only: main notes + post-slur graces + melisma notes
        const allNoteIdsSet = new Set();
        phraseWords.forEach(w => {
            w.noteIds.forEach(id => allNoteIdsSet.add(id));
        });

        const allNoteIds = Array.from(allNoteIdsSet);
        allNoteIds.sort((a, b) => {
            const aNum = parseInt(a.replace('note_', ''));
            const bNum = parseInt(b.replace('note_', ''));
            return aNum - bNum;
        });

        console.log(`[LyricsController] Playing ${allNoteIds.length} notes (correct grace notes included):`, allNoteIds);

        // Track currently playing
        this.currentlyPlaying = phraseId;

        // Highlight the phrase
        this.highlightPlayingPhrase(phraseId);

        // Play through audio controller (ALL notes for correct rhythm, with loop setting)
        if (window.audioController) {
            const loop = this.isLooping[phraseId] || false;
            window.audioController.playNoteIds(allNoteIds, false, loop);  // false = include grace notes
        } else {
            console.warn('[LyricsController] Audio controller not available');
        }
    }

    toggleLoop(phraseId, loopBtn) {
        this.isLooping[phraseId] = !this.isLooping[phraseId];

        if (this.isLooping[phraseId]) {
            loopBtn.style.backgroundColor = '#3498DB';
            loopBtn.style.color = 'white';
            console.log(`[LyricsController] Loop ENABLED for phrase ${phraseId}`);

            // If currently playing this phrase, audio controller will loop automatically
            // If not playing, start playing with loop
            if (this.currentlyPlaying !== phraseId) {
                this.playPhrase(phraseId);
            }
        } else {
            loopBtn.style.backgroundColor = 'white';
            loopBtn.style.color = '#3498DB';
            console.log(`[LyricsController] Loop DISABLED for phrase ${phraseId}`);

            // Don't stop playback, just disable looping for next cycle
        }
    }

    stopPhrase(phraseId) {
        console.log(`[LyricsController] Stop phrase ${phraseId}`);
        this.isLooping[phraseId] = false;
        this.currentlyPlaying = null;
        this.clearPlayingPhrase(phraseId);

        // Stop audio playback
        if (window.audioController) {
            window.audioController.stop();
        }

        // Reset loop buttons in BOTH sections (Lyrics table + Phrase Bars)
        // Lyrics table loop button
        const loopBtnLyrics = document.querySelector(`.loop-btn-${phraseId}`);
        if (loopBtnLyrics) {
            loopBtnLyrics.style.backgroundColor = 'white';
            loopBtnLyrics.style.color = '#3498DB';
        }

        // Phrase bars loop button (if phrase bars controller exists)
        if (window.phraseBarsController) {
            const barData = window.phraseBarsController.phraseBars.find(b => b.container.dataset.phraseId == phraseId);
            if (barData && barData.buttonsContainer) {
                const loopBtnPhraseBars = barData.buttonsContainer.querySelector('button[title="Toggle loop"]');
                if (loopBtnPhraseBars) {
                    loopBtnPhraseBars.style.backgroundColor = 'white';
                    loopBtnPhraseBars.style.color = '#3498DB';
                }
            }
        }
    }

    showPronunciation(phrase) {
        console.log(`[LyricsController] Show pronunciation guide for: "${phrase.text}"`);

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;

        // Generate IPA pronunciation for Vietnamese words
        const generateIPA = (vnWord) => {
            // Simplified IPA mapping for common Vietnamese sounds
            const ipaMap = {
                'Bà': 'ɓaː', 'bà': 'ɓaː', 'Rằng': 'zaːŋ', 'rằng': 'zaːŋ', 'Rí': 'zi', 'rí': 'zi',
                'Ới': 'ɤːj', 'ới': 'ɤːj', 'đi': 'ɗi', 'là': 'laː', 'đâu': 'ɗəw',
                'khắp': 'xɐp̚', 'chốn': 't͡ɕon', 'nối': 'noj', 'dây': 'zəj', 'tơ': 'təː', 'hồng': 'hoŋm',
                'cái': 'kaj', 'duyên': 'zwiən', 'ông': 'oŋm', 'chồng': 't͡ɕoŋm',
                'làm': 'laːm', 'khổ': 'xo', 'đời': 'ɗəːj', 'tôi': 'toj', 'ơi': 'əːj',
                'Chồng': 't͡ɕoŋm', 'gì': 'ziː', 'mà': 'maː', 'bé': 'ɓe', 'tẹo': 'tɛw', 'tèo': 'tɛw', 'teo': 'tɛw',
                'chân': 't͡ɕən', 'cà': 'kaː', 'kheo': 'xɛw', 'lúc': 'luk̚', 'phải': 'faj', 'cõng': 'koŋm', 'khóc': 'xok̚', 'bồng': 'ɓoŋm',
                'ngáy': 'ŋaj', 'o': 'ɔ', 'Đêm': 'ɗem', 'thời': 'tʰəːj', 'nằm': 'nɐm', 'co': 'kɔ',
                'ăn': 'ɐn', 'lười': 'luəj', 'biếng': 'ɓiəŋ', 'chẳng': 't͡ɕaŋ', 'lo': 'lɔ', 'học': 'hɔk̚', 'hành': 'haːŋ'
            };
            return ipaMap[vnWord] || '?';
        };

        // Generate Anglicized pronunciation
        const generateAnglicized = (vnWord) => {
            const anglicizedMap = {
                'Bà': 'BAH', 'bà': 'bah', 'Rằng': 'ZAHNG', 'rằng': 'zahng', 'Rí': 'ZEE', 'rí': 'zee',
                'Ới': 'ER-ee', 'ới': 'er-ee', 'đi': 'dee', 'là': 'lah', 'đâu': 'dow',
                'khắp': 'kap', 'chốn': 'chohn', 'nối': 'noy', 'dây': 'zay', 'tơ': 'ter', 'hồng': 'hom',
                'cái': 'kai', 'duyên': 'zwee-en', 'ông': 'ohm', 'chồng': 'chohm',
                'làm': 'lahm', 'khổ': 'koh', 'đời': 'der-ee', 'tôi': 'toy', 'ơi': 'er-ee',
                'Chồng': 'CHOHM', 'gì': 'zee', 'mà': 'mah', 'bé': 'beh', 'tẹo': 'teh-oh', 'tèo': 'teh-oh', 'teo': 'teh-oh',
                'chân': 'chan', 'cà': 'kah', 'kheo': 'keh-oh', 'lúc': 'look', 'phải': 'fai', 'cõng': 'kohm', 'khóc': 'kok', 'bồng': 'bohm',
                'ngáy': 'ngai', 'o': 'aw', 'Đêm': 'DEM', 'thời': 'ter-ee', 'nằm': 'nam', 'co': 'kaw',
                'ăn': 'an', 'lười': 'loo-er-ee', 'biếng': 'bee-eng', 'chẳng': 'chahng', 'lo': 'law', 'học': 'hawk', 'hành': 'hahng'
            };
            return anglicizedMap[vnWord] || vnWord.toUpperCase();
        };

        // Build pronunciation table
        let pronunciationTable = '';
        if (phrase.wordMapping && phrase.wordMapping.length > 0) {
            pronunciationTable = `
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                    <div style="font-weight: 600; color: #2c3e50; margin-bottom: 10px;">Pronunciation Guide:</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background: #f8f9fa; border-bottom: 2px solid #e0e0e0;">
                                <th style="padding: 8px; text-align: left;">Vietnamese</th>
                                <th style="padding: 8px; text-align: left;">IPA</th>
                                <th style="padding: 8px; text-align: left;">Anglicized</th>
                                <th style="padding: 8px; text-align: left;">English</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            phrase.wordMapping.forEach((mapping) => {
                const ipa = generateIPA(mapping.vn);
                const anglicized = generateAnglicized(mapping.vn);

                pronunciationTable += `
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 8px; font-weight: 600; color: #2c3e50;">${mapping.vn}</td>
                        <td style="padding: 8px; font-family: 'Courier New', monospace; color: #3498db;">/${ipa}/</td>
                        <td style="padding: 8px; color: #666; font-style: italic;">${anglicized}</td>
                        <td style="padding: 8px; color: #555;">${mapping.en}</td>
                    </tr>
                `;
            });

            pronunciationTable += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Build content
        let content = `
            <div style="border-bottom: 2px solid #3498db; padding-bottom: 12px; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #2c3e50;">Pronunciation Guide - Phrase ${phrase.id}</h3>
            </div>

            <div style="margin-bottom: 15px;">
                <div style="font-weight: 600; color: #7f8c8d; font-size: 11px; text-transform: uppercase; margin-bottom: 5px;">Vietnamese</div>
                <div style="font-size: 20px; color: #2c3e50; margin-bottom: 10px; font-weight: 600;">${phrase.text}</div>

                <div style="font-weight: 600; color: #7f8c8d; font-size: 11px; text-transform: uppercase; margin-bottom: 5px;">English Translation</div>
                <div style="font-size: 16px; color: #555; margin-bottom: 10px;">${phrase.english}</div>
            </div>

            ${pronunciationTable}

            <div style="margin-top: 20px; padding: 12px; background: #e8f5e9; border-radius: 6px; border-left: 4px solid #27ae60;">
                <div style="font-weight: 600; color: #2c3e50; margin-bottom: 8px;">Listen to Pronunciation</div>
                <button onclick="this.closest('.modal-container').speakPhrase()" style="background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    🗣 Speak Phrase
                </button>
            </div>

            <div style="margin-top: 15px; padding: 12px; background: #fff3e0; border-radius: 6px; border-left: 4px solid #f39c12;">
                <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">Vietnamese Pronunciation Tips:</div>
                <ul style="margin: 5px 0; padding-left: 20px; color: #666; font-size: 12px; line-height: 1.6;">
                    <li><strong>Tones matter:</strong> Vietnamese has 6 tones that change word meaning</li>
                    <li><strong>đ/d:</strong> "đ" = English "d", "d" = English "z" (Northern) or "y" (Southern)</li>
                    <li><strong>ng/ngh:</strong> Like English "ng" in "sing" (can start words)</li>
                    <li><strong>Final -t/-p/-c/-ch:</strong> Unreleased stops (don't open mouth at end)</li>
                </ul>
            </div>

            <div style="margin-top: 15px; text-align: right;">
                <button onclick="this.closest('.modal-container').closeModal()" style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        `;

        modal.innerHTML = content;
        modal.className = 'modal-container';

        // Add speak method to modal
        modal.speakPhrase = () => {
            this.speakVietnamese(phrase.text);
        };

        // Add close method
        modal.closeModal = () => {
            document.body.removeChild(overlay);
            document.body.removeChild(modal);
        };

        // Close on overlay click
        overlay.onclick = () => modal.closeModal();

        // Append to body
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
    }

    speakVietnamese(text) {
        // Use Web Speech API with Vietnamese voice
        if (!('speechSynthesis' in window)) {
            console.error('Speech synthesis not supported');
            alert('Speech synthesis is not supported in your browser');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Function to speak once voices are loaded
        const speak = () => {
            const voices = window.speechSynthesis.getVoices();
            console.log(`[LyricsController] Available voices: ${voices.length}`);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'vi-VN';
            utterance.rate = 0.7;  // Slower for learning
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Try to find Vietnamese voice
            const vietnameseVoice = voices.find(voice =>
                voice.lang === 'vi-VN' || voice.lang === 'vi_VN' || voice.lang.startsWith('vi')
            );

            if (vietnameseVoice) {
                utterance.voice = vietnameseVoice;
                console.log(`[LyricsController] Using voice: ${vietnameseVoice.name}`);
            } else {
                console.warn('[LyricsController] No Vietnamese voice found, using default');
            }

            window.speechSynthesis.speak(utterance);
        };

        // Load voices first
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            speak();
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                speak();
                window.speechSynthesis.onvoiceschanged = null;
            };
        }
    }

    generatePronunciationGuide(phrase) {
        // Simple pronunciation guide (could be enhanced with actual IPA data)
        if (!phrase.wordMapping) return 'No pronunciation data available';

        return phrase.wordMapping.map(m => `${m.vn} → [${m.en}]`).join('\n');
    }

    showNoteMapping(phrase) {
        console.log(`[LyricsController] Show info for phrase ${phrase.id}`);

        // Create a styled modal with comprehensive info
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;

        // Build content
        let content = `
            <div style="border-bottom: 2px solid #3498db; padding-bottom: 12px; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #2c3e50;">Phrase Information</h3>
            </div>

            <div style="margin-bottom: 15px;">
                <div style="font-weight: 600; color: #7f8c8d; font-size: 11px; text-transform: uppercase; margin-bottom: 5px;">Vietnamese</div>
                <div style="font-size: 18px; color: #2c3e50; margin-bottom: 10px;">${phrase.text}</div>

                <div style="font-weight: 600; color: #7f8c8d; font-size: 11px; text-transform: uppercase; margin-bottom: 5px;">English Translation</div>
                <div style="font-size: 16px; color: #555; margin-bottom: 10px;">${phrase.english}</div>

                <div style="font-weight: 600; color: #7f8c8d; font-size: 11px; text-transform: uppercase; margin-bottom: 5px;">Linguistic Type</div>
                <div style="font-size: 14px; color: #666; text-transform: capitalize;">${phrase.linguisticType}</div>
            </div>
        `;

        // Add word-by-word breakdown if available
        if (phrase.wordMapping && phrase.wordMapping.length > 0) {
            content += `
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                    <div style="font-weight: 600; color: #2c3e50; margin-bottom: 10px;">Word-by-Word Breakdown:</div>
                    <table style="width: 100%; border-collapse: collapse;">
            `;

            phrase.wordMapping.forEach((mapping, idx) => {
                content += `
                    <tr style="border-bottom: 1px solid #f0f0f0;">
                        <td style="padding: 8px; color: #666; width: 30px;">${idx + 1}.</td>
                        <td style="padding: 8px; font-weight: 600; color: #2c3e50;">${mapping.vn}</td>
                        <td style="padding: 8px; color: #555;">→</td>
                        <td style="padding: 8px; color: #555;">${mapping.en}</td>
                    </tr>
                `;
            });

            content += `</table></div>`;
        }

        // Add pronunciation guide
        content += `
            <div style="margin-top: 20px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #3498db;">
                <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">Pronunciation Guide</div>
                <div style="font-size: 13px; color: #666; line-height: 1.6;">
                    Click the pronunciation button (🗣) to hear this phrase spoken in Vietnamese.
                </div>
            </div>
        `;

        // Close button
        content += `
            <div style="margin-top: 20px; text-align: right;">
                <button onclick="this.closest('[data-modal]').remove(); document.querySelector('[data-overlay]').remove()"
                        style="background: #3498db; color: white; border: none; border-radius: 6px; padding: 8px 20px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    Close
                </button>
            </div>
        `;

        modal.innerHTML = content;
        modal.dataset.modal = 'true';
        overlay.dataset.overlay = 'true';

        // Close on overlay click
        overlay.addEventListener('click', () => {
            modal.remove();
            overlay.remove();
        });

        document.body.appendChild(overlay);
        document.body.appendChild(modal);
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
        if (!this.lyricsData || !this.lyricsData.phrases) return;

        const phrases = this.lyricsData.phrases;

        // Calculate total phrases
        const totalPhrases = phrases.length;

        // Calculate total syllables from LLM segmentation data
        const totalSyllables = phrases.reduce((sum, phrase) => sum + phrase.syllableCount, 0);

        // Calculate average syllables per phrase
        const avgSyllables = totalSyllables / totalPhrases;

        // Count unique linguistic types
        const uniqueTypes = new Set(phrases.map(p => p.linguisticType)).size;

        // Count types for breakdown
        const typeCounts = {};
        phrases.forEach(phrase => {
            typeCounts[phrase.linguisticType] = (typeCounts[phrase.linguisticType] || 0) + 1;
        });

        // Update metrics card
        const totalPhrasesEl = document.getElementById('totalPhrases');
        const totalWordsEl = document.getElementById('totalWords');
        const avgWordsEl = document.getElementById('avgWordsPerPhrase');
        const uniqueTypesEl = document.getElementById('uniqueTypes');
        const typeBreakdownEl = document.getElementById('typeBreakdown');

        if (totalPhrasesEl) totalPhrasesEl.textContent = totalPhrases;
        if (totalWordsEl) totalWordsEl.textContent = totalSyllables;
        if (avgWordsEl) avgWordsEl.textContent = avgSyllables.toFixed(1);
        if (uniqueTypesEl) uniqueTypesEl.textContent = uniqueTypes;

        // Build type breakdown HTML
        if (typeBreakdownEl) {
            const breakdownHTML = Object.entries(typeCounts)
                .sort((a, b) => b[1] - a[1]) // Sort by count descending
                .map(([type, count]) => {
                    const color = this.typeColors[type] || '#999';
                    const percentage = ((count / totalPhrases) * 100).toFixed(0);
                    return `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="display: flex; align-items: center; gap: 5px;">
                                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
                                <span style="text-transform: capitalize;">${type}</span>
                            </span>
                            <span style="font-weight: 600; color: #2c3e50;">${count} (${percentage}%)</span>
                        </div>
                    `;
                })
                .join('');
            typeBreakdownEl.innerHTML = breakdownHTML;
        }

        // Calculate phrase structure metrics from LLM segmentation
        const phraseLengths = phrases.map(phrase => phrase.syllableCount);

        const shortestLength = Math.min(...phraseLengths);
        const longestLength = Math.max(...phraseLengths);

        // Find most common length
        const lengthCounts = {};
        phraseLengths.forEach(length => {
            lengthCounts[length] = (lengthCounts[length] || 0) + 1;
        });
        const mostCommonLength = Object.entries(lengthCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        // Get pattern structure from LLM data
        const patternStructure = this.lyricsData.patterns?.structure || 'Unknown';
        const dominantPattern = this.lyricsData.statistics?.dominantPattern || 'Unknown pattern';

        // Update phrase structure card
        const shortestEl = document.getElementById('shortestPhrase');
        const longestEl = document.getElementById('longestPhrase');
        const mostCommonEl = document.getElementById('mostCommonLength');
        const lengthBreakdownEl = document.getElementById('lengthBreakdown');

        if (shortestEl) shortestEl.textContent = `${shortestLength} syllables`;
        if (longestEl) longestEl.textContent = `${longestLength} syllables`;
        if (mostCommonEl) mostCommonEl.textContent = `${mostCommonLength} syllables`;

        // Build length distribution breakdown
        if (lengthBreakdownEl) {
            // First show the Q-A-E pattern
            let lengthBreakdownHTML = `
                <div style="margin-bottom: 12px; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e9ecef;">
                    <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px; font-size: 12px;">Pattern Structure</div>
                    <div style="font-size: 14px; color: #3498db; font-weight: 600;">${patternStructure}</div>
                    <div style="font-size: 11px; color: #666; margin-top: 4px;">${dominantPattern}</div>
                </div>
            `;

            // Then show syllable distribution
            lengthBreakdownHTML += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">`;
            lengthBreakdownHTML += Object.entries(lengthCounts)
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0])) // Sort by length ascending
                .map(([length, count]) => {
                    const percentage = ((count / totalPhrases) * 100).toFixed(0);
                    const barWidth = (count / totalPhrases) * 100;
                    return `
                        <div style="margin-bottom: 6px;">
                            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                                <span style="color: #666;">${length} syllables</span>
                                <span style="font-weight: 600; color: #2c3e50;">${count} (${percentage}%)</span>
                            </div>
                            <div style="width: 100%; background: #e9ecef; border-radius: 3px; height: 6px; overflow: hidden;">
                                <div style="width: ${barWidth}%; background: #9b59b6; height: 100%;"></div>
                            </div>
                        </div>
                    `;
                })
                .join('');
            lengthBreakdownHTML += `</div>`;

            lengthBreakdownEl.innerHTML = lengthBreakdownHTML;
        }

        console.log('[LyricsController] Statistics updated:', {
            totalPhrases,
            totalSyllables,
            avgSyllables: avgSyllables.toFixed(1),
            uniqueTypes,
            typeCounts,
            phraseLengths: { shortestLength, longestLength, mostCommonLength },
            lengthCounts,
            patternStructure,
            dominantPattern
        });
    }
}

// Global instance
window.lyricsController = new LyricsController();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[LyricsController] DOM ready, initializing...');
    window.lyricsController.initialize();
});