// Main Page Route - Extracted from vertical-demo-server.js
// Clean route handler that delegates to service layer

const SongDataService = require('../services/song-data-service');
const TuningService = require('../services/tuning-service');
const TablatureService = require('../services/tablature-service');
const LyricsService = require('../services/lyrics-service');
const PhraseService = require('../services/phrase-service');
const NoteLyricsService = require('../services/note-lyrics-service');
const DataLoader = require('../utils/data-loader');

module.exports = function(app, baseDir, templateComposer) {
    // Initialize services
    const songDataService = new SongDataService(baseDir);
    const tuningService = new TuningService();
    const tablatureService = new TablatureService();
    const lyricsService = new LyricsService();
    const phraseService = new PhraseService();
    const noteLyricsService = new NoteLyricsService(baseDir);
    const dataLoader = new DataLoader(baseDir);

    // Main page route
    app.get('/', (req, res) => {
        try {
            const requestedSong = req.query.song;

            // 1. Load song data
            const { songDir, songData } = songDataService.loadSongData(requestedSong);

            // 2. Calculate tuning
            const tuning = tuningService.calculateOptimalTuning(songData);
            const comparisonTuning = tuningService.getComparisonTuning(req.query.tuning1, tuning.alternative);

            // 3. Generate tablatures
            const tablatures = tablatureService.generateTablatures(
                songData,
                tuning.optimal,
                comparisonTuning,
                true // show bent notes
            );

            // 3.5. Generate syllable lyrics with X positions (NEW: V4.3.5+)
            let syllableLyricsHTML = '<p style="padding: 20px; text-align: center; color: #999;">No syllable data available.</p>';
            const backendId = dataLoader.toBackendId(songData.metadata.title);
            const annotatedNotes = noteLyricsService.loadAnnotatedNotes(backendId);
            if (annotatedNotes && tablatures.optimalPositionedNotes) {
                const mergedNotes = noteLyricsService.mergeNotesWithPositions(
                    annotatedNotes.notes,
                    tablatures.optimalPositionedNotes
                );
                syllableLyricsHTML = noteLyricsService.generateSyllableLyricsHTML(mergedNotes);
                const syllableStats = noteLyricsService.getSyllableStatistics(mergedNotes);
                console.log(`Syllable lyrics coverage: ${syllableStats.coverage}% (${syllableStats.notesWithBoth}/${syllableStats.totalNotes} notes)`);
            }

            // 4. Generate lyrics
            const lyrics = songDataService.extractLyrics(songDir);
            const segmentationResult = songDataService.loadLyricsSegmentation(songDir, lyrics, songData.notes);
            const lyricsHTML = lyricsService.generateLyricsHTML(segmentationResult);

            // 5. Generate phrase annotations
            let annotatedPhrasesSVG = '';
            let annotatedSvgWidth = 2000;
            let structuralOverviewCards = '<p style="color: #999;">No structural analysis available for this song.</p>';

            const relationshipsData = songDataService.loadRelationships(songDir);
            if (relationshipsData && segmentationResult) {
                const phraseResult = phraseService.generatePhraseAnnotations(
                    songDir,
                    relationshipsData,
                    segmentationResult,
                    tablatures.optimalPositionedNotes
                );

                if (phraseResult) {
                    annotatedPhrasesSVG = phraseResult.svg;
                    annotatedSvgWidth = phraseResult.width;
                    structuralOverviewCards = phraseResult.cards;
                }
            }

            // 6. Calculate statistics
            const statistics = songDataService.calculateStatistics(songData);

            // 7. Render template
            const html = templateComposer.render('v4-vertical-header-sections-annotated.html', {
                VERSION: 'v4.3.15',
                SONG_NAME: songData.metadata.title,
                BACKEND_ID: backendId,  // For client-side pattern controller
                SVG_WIDTH: tablatures.width,
                SVG_HEIGHT: '800',
                OPTIMAL_SVG_CONTENT: tablatureService.extractSvgContent(tablatures.optimalSVG),
                COMPARISON_SVG_CONTENT: tablatureService.extractSvgContent(tablatures.comparisonSVG),
                OPTIMAL_TUNING: tuning.optimal,
                OPTIMAL_BENT_COUNT: tuning.bentCount,
                COMPARISON_TUNING: comparisonTuning,
                COMPARISON_BENT_COUNT: tuningService.countBentNotes(songData.notes, comparisonTuning),
                UNIQUE_PITCHES: statistics.uniquePitches,
                PITCH_RANGE: '17',
                ASCENDING_PERCENTAGE: '34.2',
                TONE_NGANG_PERCENTAGE: '23.5',
                TONE_NGA_PERCENTAGE: '12.5',
                TONE_MELODY_CORRELATION: '78.4',
                MELISMA_COUNT: '8',
                GRACE_PERCENTAGE: statistics.gracePercentage,
                STRUCTURAL_OVERVIEW_CARDS: structuralOverviewCards,
                ANNOTATED_PHRASES_SVG: annotatedPhrasesSVG,
                ANNOTATED_SVG_WIDTH: annotatedSvgWidth,
                SYLLABLE_LYRICS_HTML: syllableLyricsHTML  // NEW: V4.3.5+ syllable lyrics with X positions
            });

            res.send(html);

        } catch (error) {
            console.error('Main page error:', error);
            res.status(500).send(`
                <h1>Error loading page</h1>
                <p>${error.message}</p>
                <pre>${error.stack}</pre>
            `);
        }
    });

    // Word Journey Sankey - Standalone Page
    app.get('/word-journey', (req, res) => {
        try {
            const html = templateComposer.render('word-journey-sankey-page.html');
            res.send(html);
        } catch (error) {
            console.error('Word journey page error:', error);
            res.status(500).send(`Error loading word journey page: ${error.message}`);
        }
    });

    // Vibrato test page
    app.get('/vibrato-test', (req, res) => {
        const path = require('path');
        res.sendFile(path.join(baseDir, 'vibrato-test.html'));
    });

    // Tap chevron demo
    app.get('/tap-chevron-demo', (req, res) => {
        const path = require('path');
        const componentPath = path.join(baseDir, 'templates/components/tap-chevron-component.html');
        res.sendFile(componentPath);
    });
};
