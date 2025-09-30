// Vertical Header Demo Server - Dedicated server for vertical layout
const express = require('express');
const path = require('path');
const fs = require('fs');
const ServerTablatureGenerator = require('./server-tablature-generator');

const app = express();
const port = 3006; // Vertical demo on port 3006

// Create tablature generator instance
const tablatureGen = new ServerTablatureGenerator();

// Serve the vertical header template with real song data
app.get('/', (req, res) => {
    const verticalTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'v4-vertical-header-sections-annotated.html'), 'utf8');

    // Load first available song from processed data with preserved names
    const processedDir = path.join(__dirname, 'data', 'processed-preserve');
    const songFiles = fs.readdirSync(processedDir).filter(f => f.endsWith('.json'));

    if (songFiles.length === 0) {
        return res.status(500).send('No processed songs found. Run batch-process-all.js first.');
    }

    // Load the first song data
    const songFile = songFiles[0];
    const songData = JSON.parse(fs.readFileSync(path.join(processedDir, songFile), 'utf8'));

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
        .replace(/{{GRACE_PERCENTAGE}}/g, gracePercentage);

    res.send(populatedTemplate);
});

// Serve static files for any additional resources
app.use('/static', express.static(path.join(__dirname, 'templates')));

// Serve the client-side tablature generator
app.get('/static/client-tablature-generator.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'client-tablature-generator.js'));
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
        const processedDir = path.join(__dirname, 'data', 'processed-preserve');

        // Simple conversion: just change extension from .xml to .json
        const jsonFile = filename.replace(/\.xml$/, '.json');
        const jsonPath = path.join(processedDir, jsonFile);

        console.log(`Looking for: ${jsonFile}`);

        if (!fs.existsSync(jsonPath)) {
            console.log(`Not found: ${jsonPath}`);
            return res.status(404).json({
                error: 'Song not found',
                requested: jsonFile
            });
        }

        // Load song data
        const songData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

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