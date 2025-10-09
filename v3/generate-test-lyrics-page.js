#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test with "Đò Đưa" song
const songName = 'Do_Dua';
const displayName = 'Đò Đưa';

// Load the song's relationships data
const relationshipsPath = path.join(__dirname, 'data/processed', songName, 'relationships.json');
if (!fs.existsSync(relationshipsPath)) {
    console.error('Relationships file not found:', relationshipsPath);
    process.exit(1);
}

const relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

// Extract lyrics from MusicXML data
function extractLyricsWithPhrases(notes) {
    const syllables = [];

    // Extract all lyrics
    notes.forEach((note, index) => {
        if (note.lyrics && note.lyrics.text && note.lyrics.text.trim()) {
            syllables.push({
                text: note.lyrics.text.trim(),
                index: index,
                timing: note.startTime || index
            });
        }
    });

    // Create phrases using Vietnamese linguistic patterns
    const phrases = [];
    let currentPhrase = [];

    syllables.forEach((syllable, i) => {
        currentPhrase.push(syllable.text);

        // Detect phrase breaks
        const isEndOfPhrase =
            syllable.text.match(/[.!?,;]$/) || // Punctuation
            (i > 0 && i % 8 === 0) || // Every 8 syllables
            (i < syllables.length - 1 &&
             syllables[i + 1].timing - syllable.timing > 100) || // Large timing gap
            i === syllables.length - 1; // Last syllable

        if (isEndOfPhrase && currentPhrase.length > 0) {
            phrases.push(currentPhrase.join(' | '));
            currentPhrase = [];
        }
    });

    return {
        syllables: syllables.map(s => s.text),
        phrases: phrases,
        hasLyrics: syllables.length > 0
    };
}

const lyricsData = extractLyricsWithPhrases(relationships.notes);

// Create test HTML page with complete V1 features
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayName} - Complete V1 Lyrics Test</title>
    <style>
        /* Complete V1 Styles */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        h1 {
            color: #2c3e50;
            text-align: center;
        }

        /* V1-Style Lyrics Container */
        .v1-lyrics-container {
            background: rgba(52, 152, 219, 0.02);
            border: 1px solid rgba(52, 152, 219, 0.1);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }

        .lyrics-headers {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #3498DB;
        }

        .vietnamese-header, .english-header {
            font-weight: bold;
            font-size: 16px;
            color: #2C3E50;
            text-align: center;
        }

        /* Control Buttons */
        .lyrics-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .control-btn {
            background: none;
            border: 1px solid #3498DB;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s ease;
        }

        .control-btn:hover {
            background: rgba(52, 152, 219, 0.1);
        }

        .control-btn.active {
            background: #3498DB;
            color: white;
        }

        /* Lyrics Content Grid */
        .lyrics-content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }

        .vietnamese-lyrics, .english-lyrics {
            font-size: 16px;
            line-height: 1.8;
            padding: 10px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 6px;
        }

        .vietnamese-lyrics {
            color: #2C3E50;
            font-weight: 500;
            background: rgba(52, 152, 219, 0.08);
            border-left: 4px solid #3498DB;
        }

        .english-lyrics {
            color: #7F8C8D;
            font-style: italic;
            background: rgba(127, 140, 141, 0.08);
            border-left: 4px solid #95A5A6;
        }

        /* Interactive Pipe Separators */
        .pipe-separator {
            color: #3498DB;
            cursor: pointer;
            margin: 0 2px;
            transition: background 0.2s ease;
            padding: 0 2px;
            border-radius: 2px;
        }

        .pipe-separator:hover {
            background: rgba(52, 152, 219, 0.2);
        }

        .pipe-separator.line-break::after {
            content: "\\A";
            white-space: pre;
        }

        /* Word Highlighting */
        .word-segment {
            cursor: pointer;
            transition: background 0.2s ease;
            padding: 2px 4px;
            border-radius: 3px;
        }

        .word-segment:hover {
            background: rgba(255, 215, 0, 0.3);
        }

        .word-segment.highlighted {
            background: #FFD700;
            color: #4A3C00;
        }

        /* Bottom Controls */
        .lyrics-bottom-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            font-size: 12px;
            color: #7F8C8D;
        }

        .font-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .font-controls select {
            padding: 2px 6px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 12px;
        }

        /* Status Display */
        .status-display {
            background: #e8f5e9;
            border-left: 4px solid #27ae60;
            padding: 10px;
            margin: 10px 0;
            font-size: 14px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .lyrics-content-grid {
                display: block;
                gap: 0;
            }

            .vietnamese-lyrics {
                border-bottom: 1px solid rgba(52, 152, 219, 0.2);
                margin-bottom: 5px;
            }

            .english-lyrics {
                font-size: 14px;
                margin-bottom: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${displayName}</h1>
        <h2>Complete V1-Style Interactive Lyrics System</h2>

        <div class="status-display" id="status">
            Loaded ${lyricsData.syllables.length} syllables in ${lyricsData.phrases.length} phrases
        </div>

        <!-- V1-Style Interactive Lyrics -->
        <div class="v1-lyrics-container">
            <!-- Headers -->
            <div class="lyrics-headers">
                <div class="vietnamese-header">Tiếng Việt (Vietnamese)</div>
                <div class="english-header">English Translation</div>
            </div>

            <!-- Control Buttons -->
            <div class="lyrics-controls">
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
            </div>

            <!-- Lyrics Content -->
            <div class="lyrics-content-grid">
                <div class="vietnamese-lyrics" id="vietnameseLyrics"></div>
                <div class="english-lyrics" id="englishLyrics"></div>
            </div>

            <!-- Bottom Controls -->
            <div class="lyrics-bottom-controls">
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
                    <label>Voice:
                        <select id="voice">
                            <option>👩 Female</option>
                            <option>👨 Male</option>
                        </select>
                    </label>
                </div>
                <button class="control-btn" onclick="startLearning()">▶ Start Learning</button>
            </div>
        </div>

        <!-- Phrases Display -->
        <div class="v1-lyrics-container">
            <h3>Detected Phrases (${lyricsData.phrases.length} total)</h3>
            <ol id="phrasesList">
                ${lyricsData.phrases.map((phrase, i) =>
                    `<li>${phrase}</li>`
                ).join('')}
            </ol>
        </div>
    </div>

    <script>
        // Lyrics data from extraction
        const vietnamesePhrases = ${JSON.stringify(lyricsData.phrases)};
        const vietnameseSyllables = ${JSON.stringify(lyricsData.syllables)};

        // Mock English translations (would be from database in real system)
        const englishPhrases = vietnamesePhrases.map(phrase =>
            '[Translation pending for: ' + phrase.substring(0, 20) + '...]'
        );

        // Create V1-style interactive display
        function createV1LyricsDisplay() {
            const vietnameseDiv = document.getElementById('vietnameseLyrics');
            const englishDiv = document.getElementById('englishLyrics');

            // Build Vietnamese display with pipe separators
            let vietnameseHTML = '';
            vietnamesePhrases.forEach((phrase, phraseIndex) => {
                if (phraseIndex > 0) {
                    vietnameseHTML += '<span class="pipe-separator" data-type="phrase" onclick="toggleLineBreak(this)"> | </span>';
                }

                const words = phrase.split(' | ');
                words.forEach((word, wordIndex) => {
                    if (wordIndex > 0) {
                        vietnameseHTML += '<span class="pipe-separator" data-type="word" onclick="toggleLineBreak(this)"> | </span>';
                    }
                    vietnameseHTML += '<span class="word-segment" onclick="highlightWord(this)">' + word + '</span>';
                });
            });

            // Build English display
            let englishHTML = '';
            englishPhrases.forEach((phrase, phraseIndex) => {
                if (phraseIndex > 0) {
                    englishHTML += '<span class="pipe-separator" data-type="phrase"> | </span>';
                }
                englishHTML += '<span>' + phrase + '</span>';
            });

            vietnameseDiv.innerHTML = vietnameseHTML;
            englishDiv.innerHTML = englishHTML;
        }

        // Toggle line break at pipe separator
        function toggleLineBreak(element) {
            element.classList.toggle('line-break');

            // Find corresponding English pipe if exists
            const allVietnamesePipes = document.querySelectorAll('#vietnameseLyrics .pipe-separator');
            const allEnglishPipes = document.querySelectorAll('#englishLyrics .pipe-separator');
            const index = Array.from(allVietnamesePipes).indexOf(element);

            if (index >= 0 && allEnglishPipes[index]) {
                allEnglishPipes[index].classList.toggle('line-break');
            }

            updateStatus('Line break toggled');
        }

        // Highlight word
        function highlightWord(element) {
            // Clear all highlights
            document.querySelectorAll('.word-segment').forEach(el => {
                el.classList.remove('highlighted');
            });

            // Highlight clicked word
            element.classList.add('highlighted');
            updateStatus('Selected: ' + element.textContent);
        }

        // Reset line breaks
        function resetLineBreaks() {
            document.querySelectorAll('.pipe-separator').forEach(el => {
                el.classList.remove('line-break');
            });
            updateStatus('Line breaks reset');
        }

        // Font controls
        function changeFontFamily(value) {
            const lyrics = document.querySelectorAll('.vietnamese-lyrics, .english-lyrics');
            const fontFamily = value === 'default' ? 'inherit' : value;
            lyrics.forEach(el => el.style.fontFamily = fontFamily);
        }

        function changeFontSize(value) {
            const lyrics = document.querySelectorAll('.vietnamese-lyrics, .english-lyrics');
            lyrics.forEach(el => el.style.fontSize = value);
        }

        // Control button functions
        function playLyrics() { updateStatus('Playing lyrics...'); }
        function pauseLyrics() { updateStatus('Paused'); }
        function stopLyrics() { updateStatus('Stopped'); }
        function toggleEditMode() { updateStatus('Edit mode toggled'); }
        function toggleTranslation() { updateStatus('Translation mode toggled'); }
        function toggleAudio() { updateStatus('Audio toggled'); }
        function startLearning() { updateStatus('Learning mode started'); }

        // Update status
        function updateStatus(message) {
            document.getElementById('status').textContent = message;
        }

        // Initialize on load
        window.onload = function() {
            createV1LyricsDisplay();
            updateStatus('Loaded ${lyricsData.syllables.length} syllables in ${lyricsData.phrases.length} phrases - Ready for interaction');
        };
    </script>
</body>
</html>`;

// Write test file
const outputPath = path.join(__dirname, `test-${songName}-complete-lyrics.html`);
fs.writeFileSync(outputPath, htmlContent, 'utf8');

console.log('✅ Test page created:', outputPath);
console.log('📊 Extracted:', lyricsData.syllables.length, 'syllables in', lyricsData.phrases.length, 'phrases');
console.log('🎵 Song:', displayName);
console.log('\nOpen the test page to verify all V1 features are working correctly.');
console.log('Once verified, we can integrate this into the main template.');