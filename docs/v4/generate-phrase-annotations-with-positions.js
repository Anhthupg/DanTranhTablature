// generate-phrase-annotations-with-positions.js
// Generates phrase annotations using positioned notes from tablature generation

const fs = require('fs');
const path = require('path');
const ServerTablatureGenerator = require('./server-tablature-generator.js');
const PhraseAnnotationsGenerator = require('./generate-phrase-annotations.js');

/**
 * Generate phrase annotations with actual note positions from tablature
 */
function generateWithPositions(songName, tuningKey = 'C-D-E-G-A') {
    console.log(`\n=== Generating Phrase Annotations with Positions ===`);
    console.log(`Song: ${songName}`);
    console.log(`Tuning: ${tuningKey}`);

    // 1. Load MusicXML and generate tablature (which positions notes)
    const musicxmlPath = path.join(__dirname, '..', 'v3', 'data', 'musicxml', `${songName}.musicxml.xml`);
    if (!fs.existsSync(musicxmlPath)) {
        console.error(`MusicXML not found: ${musicxmlPath}`);
        return null;
    }

    const musicxmlContent = fs.readFileSync(musicxmlPath, 'utf8');
    const parser = require('./parse-musicxml.js');
    const songData = parser.parseMusicXML(musicxmlContent, songName);

    if (!songData || !songData.notes) {
        console.error(`Failed to parse MusicXML for ${songName}`);
        return null;
    }

    // 2. Generate tablature (this positions the notes with X coordinates)
    const tablatureGenerator = new ServerTablatureGenerator();
    tablatureGenerator.generateSVG(songData, tuningKey);

    // Now songData.notes have X positions!
    console.log(`Tablature generated, notes positioned`);

    // 3. Load relationships data
    const relationshipsPath = path.join(__dirname, 'data', 'relationships', `${songName}-relationships.json`);
    if (!fs.existsSync(relationshipsPath)) {
        console.error(`Relationships not found: ${relationshipsPath}`);
        return null;
    }

    const relationshipsData = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));

    // 4. Update relationships notes array with positioned notes
    relationshipsData.notes = songData.notes;

    // 5. Load lyrics data
    const lyricsPath = path.join(__dirname, 'data', 'lyrics-segmentations', `${songName}.json`);
    if (!fs.existsSync(lyricsPath)) {
        console.error(`Lyrics not found: ${lyricsPath}`);
        return null;
    }

    const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

    // 6. Generate phrase annotations using positioned notes
    const annotationGenerator = new PhraseAnnotationsGenerator();

    // Call internal methods directly with positioned data
    const phrasePositions = annotationGenerator.calculatePhrasePositions(
        lyricsData.phrases,
        relationshipsData.wordToNoteMap,
        relationshipsData.notes  // Now has X positions!
    );

    const analysis = annotationGenerator.analyzeStructure(lyricsData.phrases);

    // Build annotated phrases
    const annotatedPhrases = lyricsData.phrases.map((phrase, idx) => {
        const position = phrasePositions[idx];

        if (!position) {
            console.warn(`No position for phrase ${phrase.id}`);
            return null;
        }

        const parallelism = annotationGenerator.getParallelismLevel(phrase, analysis);
        const semantics = annotationGenerator.getSemanticClusters(phrase);
        const functionLabel = annotationGenerator.getFunctionLabel(phrase, idx, lyricsData.phrases.length);

        return {
            id: phrase.id,
            text: phrase.text,
            position: position,
            parallelismClass: parallelism.class,
            parallelismBadge: parallelism.badge,
            dominantDomainClass: `domain-${semantics.dominantDomain}`,
            semanticIcons: semantics.icons,
            functionLabel: functionLabel,
            hoverText: annotationGenerator.generateHoverText(phrase, parallelism, semantics, functionLabel)
        };
    }).filter(p => p !== null);

    const svgWidth = Math.max(...phrasePositions.filter(p => p).map(p => p.endX)) + 200;

    console.log(`Generated ${annotatedPhrases.length} annotated phrases`);
    console.log(`SVG width: ${svgWidth}px`);

    return {
        phrases: annotatedPhrases,
        svgWidth: svgWidth,
        analysis: analysis
    };
}

module.exports = { generateWithPositions };
