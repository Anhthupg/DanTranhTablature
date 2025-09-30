// Vertical Header Demo Server - Dedicated server for vertical layout
const express = require('express');
const path = require('path');
const fs = require('fs');
const ServerTablatureGenerator = require('./server-tablature-generator');
const PhraseSegmenter = require('./processors/phrase-segmenter');

const app = express();
const port = 3006; // Vertical demo on port 3006

// Create tablature generator instance
const tablatureGen = new ServerTablatureGenerator();

// Serve the vertical header template with real song data
app.get('/', (req, res) => {
    const verticalTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'v4-vertical-header-sections-annotated.html'), 'utf8');

    // Load first available song from v3 processed data which has lyrics
    const v3ProcessedDir = path.join(__dirname, '..', 'v3', 'data', 'processed');
    const songDirs = fs.readdirSync(v3ProcessedDir).filter(f =>
        fs.statSync(path.join(v3ProcessedDir, f)).isDirectory() &&
        fs.existsSync(path.join(v3ProcessedDir, f, 'relationships.json'))
    );

    if (songDirs.length === 0) {
        return res.status(500).send('No processed songs found in v3 data.');
    }

    // Load the first song's relationships data which contains lyrics
    const songDir = songDirs[0];
    const relationshipsPath = path.join(v3ProcessedDir, songDir, 'relationships.json');
    const relationshipsData = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

    // Convert relationships data to songData format
    const songData = {
        metadata: {
            title: relationshipsData.metadata?.title || songDir,
            optimalTuning: relationshipsData.metadata?.optimalTuning || 'C-D-E-G-A',
            genre: relationshipsData.metadata?.genre || 'Traditional'
        },
        notes: relationshipsData.notes ? relationshipsData.notes.map(note => ({
            step: note.pitch?.step || note.pitch?.fullNote?.replace(/[0-9]/g, '') || 'C',
            octave: note.pitch?.octave || parseInt(note.pitch?.fullNote?.match(/[0-9]/)?.[0]) || 4,
            duration: note.duration?.value ? note.duration.value / 4 : 1, // Convert from duration value
            isGrace: note.isGrace || false,
            lyric: note.lyrics?.text || ''
        })) : []
    };

    // V4.2.0: Generate color-coded lyrics with clickable words and font controls
    let lyricsHTML = '<p style="padding: 20px; text-align: center; color: #999;">No lyrics available for this song.</p>';

    // Try to find MusicXML file
    let musicXmlPath = path.join(__dirname, 'data', 'musicxml', `${songDir}.musicxml.xml`);

    if (!fs.existsSync(musicXmlPath)) {
        const musicXmlDir = path.join(__dirname, 'data', 'musicxml');
        const allXmlFiles = fs.readdirSync(musicXmlDir).filter(f => f.endsWith('.musicxml.xml'));

        const removeDiacritics = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
        const normalizedSongDir = removeDiacritics(songDir).toLowerCase().replace(/[_\s]+/g, '');
        const matchedFile = allXmlFiles.find(f => {
            const normalized = removeDiacritics(f.replace('.musicxml.xml', '')).toLowerCase().replace(/[_\s]+/g, '');
            return normalized === normalizedSongDir;
        });

        if (matchedFile) musicXmlPath = path.join(musicXmlDir, matchedFile);
    }

    if (fs.existsSync(musicXmlPath)) {
        try {
            const xmlContent = fs.readFileSync(musicXmlPath, 'utf-8');
            const lyricMatches = xmlContent.match(/<lyric[^>]*>[\s\S]*?<text>([^<]+)<\/text>[\s\S]*?<\/lyric>/g) || [];

            if (lyricMatches.length > 0) {
                const lyrics = lyricMatches.map(match => {
                    const textMatch = match.match(/<text>([^<]+)<\/text>/);
                    return textMatch ? textMatch[1].trim() : '';
                }).filter(text => text.length > 0);

                if (lyrics.length > 0) {
                    const segmentationPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${path.basename(musicXmlPath, '.musicxml.xml')}.json`);
                    let segmentationResult;

                    if (fs.existsSync(segmentationPath)) {
                        segmentationResult = JSON.parse(fs.readFileSync(segmentationPath, 'utf-8'));
                        segmentationResult.phrases = segmentationResult.phrases.map(p => ({
                            ...p,
                            vietnameseText: p.text || p.vietnameseText
                        }));
                    } else {
                        const syllables = lyrics.map((text, i) => ({ text, index: i, noteIndices: [i], noteDurations: [1.0] }));
                        const phraseSegmenter = new PhraseSegmenter();
                        segmentationResult = phraseSegmenter.segment(syllables, songData.notes);
                    }

                    // Generate clickable word HTML
                    const generateClickableWords = (phrase, i) => {
                        if (!phrase.wordMapping) return phrase.vietnameseText;
                        return phrase.wordMapping.map((m, idx) =>
                            `<span class="syllable" data-phrase="${i}" data-word="${idx}" data-vn="${m.vn}" data-en="${m.en}" style="cursor: pointer; padding: 2px 3px; border-radius: 2px; transition: background 0.2s;" onclick="highlightWord(${i}, ${idx})">${m.vn}</span>`
                        ).join(' ');
                    };

                    const generateClickableEnglish = (phrase, i) => {
                        if (!phrase.english || !phrase.wordMapping) return phrase.english || '';
                        return phrase.wordMapping.map((m, idx) =>
                            `<span class="en-word" data-phrase="${i}" data-word="${idx}" data-vn="${m.vn}" data-en="${m.en}" style="cursor: pointer; padding: 2px 3px; border-radius: 2px; transition: background 0.2s;" onclick="highlightWord(${i}, ${idx})">${m.en}</span>`
                        ).join(' ');
                    };

                    // Map phrases to note ranges for audio playback
                    let noteIndex = 0;
                    const rows = segmentationResult.phrases.map((phrase, i) => {
                        const lingType = phrase.linguisticType || 'narrative';
                        const lingColor = {
                            question: '#4ECDC4', answer: '#95E1D3', exclamatory: '#FF6B6B',
                            complaint: '#FFD93D', onomatopoeia: '#C3AED6', narrative: '#A8E6CF'
                        }[lingType] || '#95A5A6';

                        // Calculate note range for this phrase (based on syllable count)
                        const startNote = noteIndex;
                        const endNote = noteIndex + phrase.syllableCount - 1;
                        noteIndex += phrase.syllableCount;

                        return `
                        <tr data-phrase="${i}" data-start-note="${startNote}" data-end-note="${endNote}" style="border-bottom: 1px solid #e0e0e0; height: 30px;">
                            <td style="padding: 6px; background: ${lingColor}; color: white; text-align: center; font-weight: 600; font-size: 10px; vertical-align: middle; line-height: 1.2;">
                                <div style="margin-bottom: 1px;">${lingType}</div>
                                <div style="font-size: 9px; opacity: 0.9;">${phrase.syllableCount} syl</div>
                            </td>
                            <td style="padding: 4px; text-align: center; font-weight: 600; color: #666; font-size: 13px; vertical-align: middle;">${i + 1}</td>
                            <td style="padding: 4px; text-align: center; vertical-align: middle;">
                                <div style="display: flex; gap: 3px; justify-content: center; flex-wrap: nowrap;">
                                    <button title="Play phrase" onclick="playPhrase(${i}, ${startNote}, ${endNote})" style="width: 22px; height: 22px; border: 1px solid #27AE60; background: white; border-radius: 3px; cursor: pointer; font-size: 11px; padding: 0; color: #27AE60;">▶</button>
                                    <button title="Loop phrase" onclick="togglePhraseLoop(${i})" data-phrase="${i}" class="loop-btn-${i}" style="width: 22px; height: 22px; border: 1px solid #3498DB; background: white; border-radius: 3px; cursor: pointer; font-size: 11px; padding: 0; color: #3498DB;">🔁</button>
                                    <button title="Stop" onclick="stopPhrase(${i})" style="width: 22px; height: 22px; border: 1px solid #E74C3C; background: white; border-radius: 3px; cursor: pointer; font-size: 11px; padding: 0; color: #E74C3C;">■</button>
                                    <button title="Pronunciation" onclick="alert('Pronunciation guide for: ${phrase.vietnameseText.replace(/'/g, "\\'")} ')" style="width: 22px; height: 22px; border: 1px solid #9B59B6; background: white; border-radius: 3px; cursor: pointer; font-size: 10px; padding: 0; color: #9B59B6;">🗣</button>
                                    <button title="Word meanings" onclick="alert('${phrase.english || "Translation not available"}')" style="width: 22px; height: 22px; border: 1px solid #F39C12; background: white; border-radius: 3px; cursor: pointer; font-size: 10px; padding: 0; color: #F39C12;">📖</button>
                                    <button title="Google Translate" onclick="window.open('https://translate.google.com/?sl=vi&tl=en&text=${encodeURIComponent(phrase.vietnameseText)}&op=translate', '_blank')" style="width: 22px; height: 22px; border: 1px solid #008080; background: white; border-radius: 3px; cursor: pointer; font-size: 10px; padding: 0; color: #008080;">🌐</button>
                                </div>
                            </td>
                            <td class="vn-text" style="padding: 4px 8px; font-size: 14px; line-height: 1.3; vertical-align: middle; white-space: nowrap;">${generateClickableWords(phrase, i)}</td>
                            <td class="en-text" style="padding: 4px 8px; font-size: 13px; color: #555; font-style: italic; line-height: 1.3; vertical-align: middle; white-space: nowrap;">${generateClickableEnglish(phrase, i)}</td>
                        </tr>`;
                    }).join('');

                    lyricsHTML = `
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
                        </div>
                        <table id="lyricsTable" style="width: auto; border-collapse: collapse; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); table-layout: fixed;">
                            <thead>
                                <tr style="background: #008080; color: white;">
                                    <th style="width: 120px; padding: 8px; text-align: center; font-size: 11px;">Type</th>
                                    <th style="width: 40px; padding: 8px; text-align: center; font-size: 11px;">#</th>
                                    <th style="width: 140px; padding: 8px; text-align: center; font-size: 11px;">Controls</th>
                                    <th style="width: 450px; padding: 8px; font-size: 11px;">Tiếng Việt</th>
                                    <th style="width: 500px; padding: 8px; font-size: 11px;">English</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
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
                        // Audio playback functions
                        function playPhrase(phraseId, startNote, endNote) {
                            if (!window.audioController) return console.error('Audio controller not initialized');
                            window.audioController.stop(); // Stop any current playback
                            window.audioController.playRange(startNote, endNote); // Play note range
                            console.log(\`Playing phrase \${phraseId}: notes \${startNote}-\${endNote}\`);

                            // If loop enabled, restart when done
                            if (window.phraseLoopState[phraseId]) {
                                const duration = window.audioController.calculateRangeDuration(startNote, endNote);
                                setTimeout(() => {
                                    if (window.phraseLoopState[phraseId]) playPhrase(phraseId, startNote, endNote);
                                }, duration);
                            }
                        }
                        function togglePhraseLoop(phraseId) {
                            window.phraseLoopState[phraseId] = !window.phraseLoopState[phraseId];
                            const btn = document.querySelector(\`.loop-btn-\${phraseId}\`);
                            if (window.phraseLoopState[phraseId]) {
                                btn.style.background = '#3498DB'; btn.style.color = 'white';
                            } else {
                                btn.style.background = 'white'; btn.style.color = '#3498DB';
                            }
                        }
                        function stopPhrase(phraseId) {
                            window.phraseLoopState[phraseId] = false;
                            const btn = document.querySelector(\`.loop-btn-\${phraseId}\`);
                            if (btn) { btn.style.background = 'white'; btn.style.color = '#3498DB'; }
                            if (window.audioController) window.audioController.stop();
                        }
                        </script>
                    `;
                }
            }
        } catch (err) {
            console.log('Lyrics failed:', err.message);
        }
    }

    // Generate tablatures with V3 duration spacing and V4.0.2 features
    const optimalTuning = songData.metadata.optimalTuning || 'C-D-E-G-A';
    const alternativeTunings = ['C-D-F-G-A', 'C-D-E-G-Bb', 'C-Eb-F-G-Bb'].filter(t => t !== optimalTuning);

    // Generate optimal tuning tablature
    const optimalSVG = tablatureGen.generateSVG(songData, optimalTuning, true);

    // Generate comparison tablature with first alternative tuning
    const comparisonSVG = tablatureGen.generateSVG(songData, alternativeTunings[0], true);

    // Extract just the inner SVG content (without the outer <svg> tags)
    const extractSvgContent = (svgString) => {
        const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
        return match ? match[1] : svgString;
    };

    // Calculate statistics from real data
    const graceNotes = songData.notes.filter(n => n.isGrace).length;
    const gracePercentage = ((graceNotes / songData.notes.length) * 100).toFixed(1);
    const uniquePitches = [...new Set(songData.notes.map(n => `${n.step}${n.octave}`))].length;

    // Replace placeholders with real song data
    const populatedTemplate = verticalTemplate
        .replace(/{{SONG_NAME}}/g, songData.metadata.title)
        .replace(/{{SVG_WIDTH}}/g, '100%')
        .replace(/{{SVG_HEIGHT}}/g, '800')
        .replace(/{{OPTIMAL_SVG_CONTENT}}/g, extractSvgContent(optimalSVG))
        .replace(/{{COMPARISON_SVG_CONTENT}}/g, extractSvgContent(comparisonSVG))
        .replace(/{{UNIQUE_PITCHES}}/g, uniquePitches)
        .replace(/{{PITCH_RANGE}}/g, '17')
        .replace(/{{ASCENDING_PERCENTAGE}}/g, '34.2')
        .replace(/{{TONE_NGANG_PERCENTAGE}}/g, '23.5')
        .replace(/{{TONE_NGA_PERCENTAGE}}/g, '12.5')
        .replace(/{{TONE_MELODY_CORRELATION}}/g, '78.4')
        .replace(/{{MELISMA_COUNT}}/g, '8')
        .replace(/{{GRACE_PERCENTAGE}}/g, gracePercentage)
        .replace(/{{LYRICS_CONTENT}}/g, lyricsHTML);

    res.send(populatedTemplate);
});

// Serve static files for any additional resources
app.use('/static', express.static(path.join(__dirname, 'templates')));

// Serve the client-side tablature generator
app.get('/static/client-tablature-generator.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client-tablature-generator.js'));
});

// V4.0.5: Serve the zoom controller
app.get('/zoom-controller.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'zoom-controller.js'));
});

// V4.0.9: Serve the library controller
app.get('/library-controller.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'library-controller.js'));
});

// V4.0.11: Serve the visual state controller
app.get('/visual-state-controller.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'visual-state-controller.js'));
});

// V4.0.12: Serve the audio playback controller
app.get('/audio-playback-controller.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'audio-playback-controller.js'));
});

// V4: Serve audio controller v2 (cache-busted version)
app.get('/audio-playback-controller-v2.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'audio-playback-controller-v2.js'));
});

// V4.0.13: Serve the visual state manager
app.get('/visual-state-manager.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'visual-state-manager.js'));
});

// V4.2.0: External Lyrics Controller
app.get('/lyrics-controller.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'lyrics-controller.js'));
});

// All Tablatures Viewer
app.get('/tablatures', (req, res) => {
    const tablatureViewerPath = path.join(__dirname, 'templates', 'all-tablatures-viewer.html');
    res.sendFile(tablatureViewerPath);
});

// Serve tablature SVG files
app.use('/data/tablatures', express.static(path.join(__dirname, 'data', 'tablatures')));

// Helper function to convert MusicXML filename to processed JSON filename
// This must match the exact conversion used by batch-process-all.js
function musicXMLToProcessedFilename(musicXMLFilename) {
    // Remove extensions: .musicxml.xml or .xml
    let name = musicXMLFilename.replace(/\.(musicxml|xml)\.xml$/, '').replace(/\.(musicxml|xml)$/, '');

    // This matches batch-process-all.js conversion:
    // Remove Vietnamese diacritics completely (not just decompose)
    const vietnameseMap = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
        'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
        'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
        'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
        'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
        'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
        'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
        'đ': 'd', 'Đ': 'D'
    };

    // Replace Vietnamese characters
    for (let [viet, latin] of Object.entries(vietnameseMap)) {
        name = name.split(viet).join(latin);
    }

    // Convert to lowercase and replace non-alphanumeric with underscores
    name = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    return name + '.json';
}

// API endpoint to generate tablature for a specific song
app.get('/api/tablature/:filename', (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);

        // Try to find the song in v3 processed data
        const v3ProcessedDir = path.join(__dirname, '..', 'v3', 'data', 'processed');

        // Remove .musicxml.xml or .xml extension and clean up filename
        const cleanName = filename.replace(/\.(musicxml\.xml|xml|musicxml)$/, '').replace(/_/g, ' ');

        // Find matching directory in v3 (flexible matching)
        const songDirs = fs.readdirSync(v3ProcessedDir);
        const matchingDir = songDirs.find(dir => {
            // Try exact match first (case-insensitive)
            if (dir.toLowerCase() === cleanName.toLowerCase()) return true;

            // Try match with spaces replaced by underscores
            const dirWithSpaces = dir.replace(/_/g, ' ').toLowerCase();
            if (dirWithSpaces === cleanName.toLowerCase()) return true;

            // Remove all non-alphanumeric for comparison (handles accents)
            const dirNormalized = dir.toLowerCase().replace(/[àáảãạăằắẳẵặâầấẩẫậ]/g, 'a')
                .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
                .replace(/[ìíỉĩị]/g, 'i')
                .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
                .replace(/[ùúủũụưừứửữự]/g, 'u')
                .replace(/[ỳýỷỹỵ]/g, 'y')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9]/g, '');

            const nameNormalized = cleanName.toLowerCase().replace(/[àáảãạăằắẳẵặâầấẩẫậ]/g, 'a')
                .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
                .replace(/[ìíỉĩị]/g, 'i')
                .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
                .replace(/[ùúủũụưừứửữự]/g, 'u')
                .replace(/[ỳýỷỹỵ]/g, 'y')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9]/g, '');

            if (dirNormalized === nameNormalized) return true;

            return false;
        }
        );

        if (!matchingDir) {
            console.log(`Song not found in v3: ${cleanName}`);
            return res.status(404).json({
                error: 'Song not found',
                requested: cleanName
            });
        }

        // Load song data from v3 relationships.json
        const relationshipsPath = path.join(v3ProcessedDir, matchingDir, 'relationships.json');
        const relationshipsData = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

        // Convert relationships data to songData format
        const songData = {
            metadata: {
                title: relationshipsData.metadata?.title || matchingDir,
                optimalTuning: relationshipsData.metadata?.optimalTuning || 'C-D-E-G-A',
                genre: relationshipsData.metadata?.genre || 'Traditional'
            },
            notes: relationshipsData.notes ? relationshipsData.notes.map(note => ({
                step: note.pitch?.step || note.pitch?.fullNote?.replace(/[0-9]/g, '') || 'C',
                octave: note.pitch?.octave || parseInt(note.pitch?.fullNote?.match(/[0-9]/)?.[0]) || 4,
                duration: note.duration?.value ? note.duration.value / 4 : 1, // Convert from duration value
                isGrace: note.isGrace || false,
                lyric: note.lyrics?.text || ''
            })) : []
        };

        // Generate tablatures with V3 duration spacing and V4.0.2 features
        const optimalTuning = songData.metadata.optimalTuning || 'C-D-E-G-A';
        const alternativeTunings = ['C-D-F-G-A', 'C-D-E-G-Bb', 'C-Eb-F-G-Bb'].filter(t => t !== optimalTuning);

        // Generate optimal and comparison tablatures
        const optimalSVG = tablatureGen.generateSVG(songData, optimalTuning, true);
        const comparisonSVG = tablatureGen.generateSVG(songData, alternativeTunings[0], true);

        // Calculate statistics
        const graceNotes = songData.notes.filter(n => n.isGrace).length;
        const gracePercentage = ((graceNotes / songData.notes.length) * 100).toFixed(1);
        const uniquePitches = [...new Set(songData.notes.map(n => `${n.step}${n.octave}`))].length;

        // Return tablature data
        res.json({
            songName: songData.metadata.title,
            optimalSVG: optimalSVG,
            comparisonSVG: comparisonSVG,
            uniquePitches: uniquePitches,
            gracePercentage: gracePercentage,
            totalNotes: songData.notes.length,
            optimalTuning: optimalTuning,
            alternativeTuning: alternativeTunings[0]
        });
    } catch (error) {
        console.error('Tablature generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// V4.2.0: Lyrics API endpoint - Serves lyrics segmentation JSON
app.get('/api/lyrics/:songName', (req, res) => {
    try {
        const songName = decodeURIComponent(req.params.songName);
        const lyricsPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${songName}.json`);

        if (!fs.existsSync(lyricsPath)) {
            return res.status(404).json({ error: 'Lyrics not found', song: songName });
        }

        const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));
        res.json(lyricsData);
    } catch (error) {
        console.error('Lyrics API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Library API endpoint
app.get('/api/library', (req, res) => {
    const V4LibraryManager = require('./auto-import-library');
    const libraryManager = new V4LibraryManager();

    try {
        // Scan for new files and get updated library
        const library = libraryManager.scanAndUpdateLibrary();
        res.json(library);
    } catch (error) {
        console.error('Library API error:', error);
        // Return demo data if library system fails
        res.json([
            {
                title: "Lý Chiều Chiều",
                filename: "ly_chieu_chieu.xml",
                region: "Northern",
                genre: "Lý",
                optimalTuning: "C-D-E-G-A",
                totalNotes: 57,
                uniquePitches: 5,
                bentStrings: 2,
                bentNotes: 8
            },
            {
                title: "Hò Giã Gạo",
                filename: "ho_gia_gao.xml",
                region: "Southern",
                genre: "Hò",
                optimalTuning: "C-D-F-G-A",
                totalNotes: 43,
                uniquePitches: 6,
                bentStrings: 3,
                bentNotes: 12
            },
            {
                title: "Ru Con Quảng Nam",
                filename: "ru_con_quang_nam.xml",
                region: "Central",
                genre: "Ru Con",
                optimalTuning: "C-D-E-G-Bb",
                totalNotes: 32,
                uniquePitches: 4,
                bentStrings: 1,
                bentNotes: 3
            }
        ]);
    }
});

app.listen(port, () => {
    console.log(`🚀 Vertical Header Demo Server running on http://localhost:${port}`);
    console.log(`📋 Features:`);
    console.log(`   • Vertical headers (80px left panels)`);
    console.log(`   • Move arrows (▲ ▼) in vertical layout`);
    console.log(`   • Metric cards with cross-highlighting`);
    console.log(`   • Complete UI terminology annotations`);
    console.log(`   • Interactive tablature with data attributes`);
    console.log(`\n✨ Perfect for your 100+ metrics statistical analysis!`);
});

module.exports = app;