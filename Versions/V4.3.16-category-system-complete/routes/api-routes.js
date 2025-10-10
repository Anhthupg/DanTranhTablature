// API Routes Module - Extracted from vertical-demo-server.js
// Handles all /api/* endpoints

const fs = require('fs');
const path = require('path');
const DataLoader = require('../utils/data-loader');

module.exports = function(app, baseDir, tablatureGen) {
    // Initialize data loader for name conversion
    const dataLoader = new DataLoader(baseDir);

    // V4.2.5: Relationships API
    app.get('/api/relationships/:songName', (req, res) => {
        try {
            let displayName = decodeURIComponent(req.params.songName);

            // V4.3.15: Strip extensions if present
            displayName = displayName
                .replace(/\.musicxml\.xml$/i, '')
                .replace(/\.musicxml$/i, '')
                .replace(/\.xml$/i, '');

            // Convert display name to backend ID (e.g., "Bà rằng bà rí" → "ba-rang-ba-ri")
            const backendId = dataLoader.toBackendId(displayName);
            const relationshipsPath = path.join(baseDir, 'data', 'relationships', `${backendId}-relationships.json`);

            if (!fs.existsSync(relationshipsPath)) {
                console.error(`[API] Relationships not found: ${displayName} → ${backendId}`);
                return res.status(404).json({ error: 'Relationships not found', displayName, backendId });
            }

            const relationshipsData = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));
            res.json(relationshipsData);
        } catch (error) {
            console.error('Error loading relationships:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // V4.2.16: Generate tablature with custom tuning
    app.get('/api/generate-tuning/:song/:tuning', (req, res) => {
        try {
            const songName = decodeURIComponent(req.params.song).replace(/\.musicxml\.xml$/i, '').replace(/\.xml$/i, '');
            const tuning = decodeURIComponent(req.params.tuning);

            console.log(`Generating tablature: ${songName} with tuning ${tuning}`);

            const v3ProcessedDir = path.join(baseDir, '..', 'v3', 'data', 'processed');
            const relationshipsPath = path.join(v3ProcessedDir, songName, 'relationships.json');

            if (!fs.existsSync(relationshipsPath)) {
                return res.status(404).json({ error: 'Song not found' });
            }

            const relationshipsData = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

            const songData = {
                metadata: relationshipsData.metadata || {},
                notes: relationshipsData.notes ? relationshipsData.notes.map((note, index) => {
                    const duration = note.duration?.value ? note.duration.value / 4 : 1;
                    if (isNaN(duration) || duration <= 0) {
                        console.warn(`[API] Note ${index} has invalid duration:`, note.duration, '- using default 1');
                    }
                    return {
                        step: note.pitch?.step || note.pitch?.fullNote?.replace(/[0-9]/g, '') || 'C',
                        octave: note.pitch?.octave || parseInt(note.pitch?.fullNote?.match(/[0-9]/)?.[0]) || 4,
                        duration: (isNaN(duration) || duration <= 0) ? 1 : duration,
                        isGrace: note.isGrace || false,
                        lyric: note.lyrics?.text || ''
                    };
                }) : []
            };

            console.log(`Converted ${songData.notes.length} notes for ${songName}`);

            const TablatureGenerator = require('../server-tablature-generator.js');
            const gen = new TablatureGenerator();
            const svg = gen.generateSVG(songData, tuning, true);

            res.json({ svg: svg });
        } catch (error) {
            console.error('Error generating tuning:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // API endpoint to get tablature for a song
    app.get('/api/tablature/:filename', (req, res) => {
        try {
            const filename = decodeURIComponent(req.params.filename);
            const v3ProcessedDir = path.join(baseDir, '..', 'v3', 'data', 'processed');
            const cleanName = filename.replace(/\.(musicxml\.xml|xml|musicxml)$/, '').replace(/_/g, ' ');

            const songDirs = fs.readdirSync(v3ProcessedDir);
            const matchingDir = songDirs.find(dir => {
                if (dir.toLowerCase() === cleanName.toLowerCase()) return true;

                const dirWithSpaces = dir.replace(/_/g, ' ').toLowerCase();
                if (dirWithSpaces === cleanName.toLowerCase()) return true;

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
            });

            if (!matchingDir) {
                console.log(`Song not found in v3: ${cleanName}`);
                return res.status(404).json({
                    error: 'Song not found',
                    requested: cleanName
                });
            }

            const relationshipsPath = path.join(v3ProcessedDir, matchingDir, 'relationships.json');
            const relationshipsData = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

            const songData = {
                metadata: {
                    title: relationshipsData.metadata?.title || matchingDir,
                    optimalTuning: relationshipsData.metadata?.optimalTuning || 'C-D-E-G-A',
                    genre: relationshipsData.metadata?.genre || 'Traditional'
                },
                notes: relationshipsData.notes ? relationshipsData.notes.map(note => ({
                    step: note.pitch?.step || note.pitch?.fullNote?.replace(/[0-9]/g, '') || 'C',
                    octave: note.pitch?.octave || parseInt(note.pitch?.fullNote?.match(/[0-9]/)?.[0]) || 4,
                    duration: note.duration?.value ? note.duration.value / 4 : 1,
                    isGrace: note.isGrace || false,
                    lyric: note.lyrics?.text || ''
                })) : []
            };

            const optimalTuning = songData.metadata.optimalTuning || 'C-D-E-G-A';
            const alternativeTunings = ['C-D-F-G-A', 'C-D-E-G-Bb', 'C-Eb-F-G-Bb'].filter(t => t !== optimalTuning);

            const optimalSVG = tablatureGen.generateSVG(songData, optimalTuning, true);
            const comparisonSVG = tablatureGen.generateSVG(songData, alternativeTunings[0], true);

            const graceNotes = songData.notes.filter(n => n.isGrace).length;
            const gracePercentage = ((graceNotes / songData.notes.length) * 100).toFixed(1);
            const uniquePitches = [...new Set(songData.notes.map(n => `${n.step}${n.octave}`))].length;

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

    // V4.2.0: Lyrics API endpoint
    app.get('/api/lyrics/:songName', (req, res) => {
        try {
            const songName = decodeURIComponent(req.params.songName);
            const lyricsDir = path.join(baseDir, 'data', 'lyrics-segmentations');

            let lyricsPath = path.join(lyricsDir, `${songName}.json`);

            if (!fs.existsSync(lyricsPath)) {
                const files = fs.readdirSync(lyricsDir).filter(f => f.endsWith('.json'));
                const cleanName = songName.replace(/\.(musicxml\.xml|xml|musicxml)$/, '').replace(/_/g, ' ');

                const matchingFile = files.find(file => {
                    const fileBase = file.replace('.json', '');

                    if (fileBase.toLowerCase() === cleanName.toLowerCase()) return true;
                    if (fileBase.toLowerCase() === songName.toLowerCase()) return true;

                    const fileNormalized = fileBase.replace(/_/g, ' ').toLowerCase();
                    if (fileNormalized === cleanName.toLowerCase()) return true;

                    const removeDiacritics = (str) => str.toLowerCase()
                        .replace(/[àáảãạăằắẳẵặâầấẩẫậ]/g, 'a')
                        .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
                        .replace(/[ìíỉĩị]/g, 'i')
                        .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
                        .replace(/[ùúủũụưừứửữự]/g, 'u')
                        .replace(/[ỳýỷỹỵ]/g, 'y')
                        .replace(/đ/g, 'd')
                        .replace(/[^a-z0-9]/g, '');

                    if (removeDiacritics(fileBase) === removeDiacritics(cleanName)) return true;

                    return false;
                });

                if (matchingFile) {
                    lyricsPath = path.join(lyricsDir, matchingFile);
                } else {
                    return res.status(404).json({ error: 'Lyrics not found', song: songName });
                }
            }

            const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));
            res.json(lyricsData);
        } catch (error) {
            console.error('Lyrics API error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Thematic Profiles API
    app.get('/api/thematic-profiles', (req, res) => {
        try {
            const profilesPath = path.join(baseDir, 'data', 'thematic-profiles.json');

            if (fs.existsSync(profilesPath)) {
                const stats = fs.statSync(profilesPath);
                const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60;

                if (ageMinutes < 60) {
                    const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
                    res.json(profiles);
                    console.log(`[API] Thematic profiles served from cache (${ageMinutes.toFixed(1)} min old)`);
                    return;
                }
            }

            const ThematicProfileGenerator = require('../generate-thematic-profiles');
            const generator = new ThematicProfileGenerator();
            const profiles = generator.generateAllProfiles();

            res.json(profiles);
            console.log('[API] Thematic profiles regenerated and served');
        } catch (error) {
            console.error('[API] Thematic profiles error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Vocabulary Metrics API
    app.get('/api/vocabulary-metrics', (req, res) => {
        try {
            const metricsPath = path.join(baseDir, 'data', 'vocabulary-metrics.json');

            if (fs.existsSync(metricsPath)) {
                const stats = fs.statSync(metricsPath);
                const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60;

                if (ageMinutes < 60) {
                    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
                    res.json(metrics);
                    console.log(`[API] Vocabulary metrics served from cache (${ageMinutes.toFixed(1)} min old)`);
                    return;
                }
            }

            const VocabularyAnalyzer = require('../analyze-vocabulary-metrics');
            const analyzer = new VocabularyAnalyzer();
            const metrics = analyzer.analyze();

            res.json(metrics);
            console.log('[API] Vocabulary metrics regenerated and served');
        } catch (error) {
            console.error('[API] Vocabulary metrics error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Library API
    app.get('/api/library', (req, res) => {
        const V4LibraryManager = require('../auto-import-library');
        const libraryManager = new V4LibraryManager();

        try {
            const library = libraryManager.scanAndUpdateLibrary();
            res.json(library);
        } catch (error) {
            console.error('Library API error:', error);
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
                }
            ]);
        }
    });

    // Glissando API - by song name
    app.get('/api/glissando-by-name/:songName', (req, res) => {
        try {
            const { GlissandoAnalyzer } = require('../glissando-analyzer');
            const songName = decodeURIComponent(req.params.songName);
            const processedDir = path.join(baseDir, 'data', 'processed');
            const allFiles = fs.readdirSync(processedDir).filter(f => f.endsWith('.json'));

            const normalize = (str) => str.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9]/g, '');

            const normalizedSongName = normalize(songName);

            let matchedFile = allFiles.find(f => {
                const baseName = f.replace('.json', '');
                const fileData = JSON.parse(fs.readFileSync(path.join(processedDir, f), 'utf8'));
                const title = fileData.metadata?.title || baseName;
                return normalize(title) === normalizedSongName;
            });

            if (!matchedFile) {
                const scored = allFiles.map(f => {
                    const baseName = f.replace('.json', '');
                    const fileData = JSON.parse(fs.readFileSync(path.join(processedDir, f), 'utf8'));
                    const title = fileData.metadata?.title || baseName;
                    const normalizedTitle = normalize(title);
                    const normalizedBaseName = normalize(baseName);

                    let score = 0;

                    if (normalizedTitle === normalizedSongName || normalizedBaseName === normalizedSongName) {
                        score = 1000;
                    } else if (normalizedTitle.startsWith(normalizedSongName) || normalizedSongName.startsWith(normalizedTitle)) {
                        score = 100 + normalizedTitle.length;
                    } else if (normalizedBaseName.startsWith(normalizedSongName) || normalizedSongName.startsWith(normalizedBaseName)) {
                        score = 50 + normalizedBaseName.length;
                    } else if (normalizedSongName.includes(normalizedTitle)) {
                        score = normalizedTitle.length;
                    } else if (normalizedTitle.includes(normalizedSongName)) {
                        score = normalizedSongName.length;
                    }

                    return { file: f, title, score };
                }).filter(item => item.score > 0);

                scored.sort((a, b) => b.score - a.score);

                if (scored.length > 0) {
                    matchedFile = scored[0].file;
                    console.log(`Glissando: Best match for "${songName}": ${matchedFile} (title: ${scored[0].title}, score: ${scored[0].score})`);
                }
            }

            if (!matchedFile) {
                console.log(`Glissando: No file found for "${songName}" (normalized: ${normalizedSongName})`);
                return res.status(404).json({
                    error: 'Song file not found',
                    songName,
                    availableFiles: allFiles.slice(0, 5).map(f => f.replace('.json', ''))
                });
            }

            const songPath = path.join(processedDir, matchedFile);
            const songData = JSON.parse(fs.readFileSync(songPath, 'utf8'));
            const analyzer = new GlissandoAnalyzer(songData);
            const report = analyzer.generateReport();

            console.log(`Glissando: Analyzed "${songName}" using file "${matchedFile}" - found ${report.glissandoCandidates.length} candidates`);
            res.json(report);
        } catch (error) {
            console.error('Glissando analysis error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Glissando API - by exact file
    app.get('/api/glissando/:songFile', (req, res) => {
        try {
            const { GlissandoAnalyzer } = require('../glissando-analyzer');
            const songFile = req.params.songFile;
            const processedDir = path.join(baseDir, 'data', 'processed');
            const songPath = path.join(processedDir, songFile);

            if (!fs.existsSync(songPath)) {
                return res.status(404).json({ error: 'Song file not found' });
            }

            const songData = JSON.parse(fs.readFileSync(songPath, 'utf8'));
            const analyzer = new GlissandoAnalyzer(songData);
            const report = analyzer.generateReport();

            res.json(report);
        } catch (error) {
            console.error('Glissando analysis error:', error);
            res.status(500).json({ error: error.message });
        }
    });
};
