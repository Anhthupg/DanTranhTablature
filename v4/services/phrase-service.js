// Phrase Service - Handles phrase annotation generation and structural analysis
// Extracted from vertical-demo-server.js as part of Phase 2 refactoring

const PhraseAnnotationsGenerator = require('../generate-phrase-annotations');
const { renderPhraseAnnotations } = require('../render-phrase-annotations');

class PhraseService {
    constructor() {
        this.phraseAnnotationGen = new PhraseAnnotationsGenerator();
    }

    /**
     * Generate phrase annotations and structural analysis
     * @param {string} songDir - Song directory name
     * @param {Object} relationshipsData - Relationships data
     * @param {Object} lyricsData - Lyrics segmentation data
     * @param {Array} positionedNotes - Notes with X/Y positions from tablature
     * @returns {Object} { svg, width, cards } or null if failed
     */
    generatePhraseAnnotations(songDir, relationshipsData, lyricsData, positionedNotes) {
        if (!relationshipsData || !lyricsData) {
            console.log(`Missing data for phrase annotations: songDir=${songDir}`);
            return null;
        }

        try {
            // Merge X/Y positions into relationshipsData.notes by index
            relationshipsData.notes.forEach((note, idx) => {
                if (positionedNotes[idx]) {
                    note.x = positionedNotes[idx].x;
                    note.y = positionedNotes[idx].y;
                }
            });

            console.log(`Merged X/Y positions into ${relationshipsData.notes.length} notes from ${positionedNotes.length} positioned notes`);

            // Calculate phrase positions
            const phrasePositions = this.phraseAnnotationGen.calculatePhrasePositions(
                lyricsData.phrases,
                relationshipsData.wordToNoteMap,
                relationshipsData.notes
            );

            // Analyze structure
            const analysis = this.phraseAnnotationGen.analyzeStructure(lyricsData.phrases);

            // Build annotated phrases
            const annotatedPhrases = lyricsData.phrases.map((phrase, idx) => {
                const position = phrasePositions[idx];
                if (!position) return null;

                const parallelism = this.phraseAnnotationGen.getParallelismLevel(phrase, analysis);
                const semantics = this.phraseAnnotationGen.getSemanticClusters(phrase);
                const functionLabel = this.phraseAnnotationGen.getFunctionLabel(phrase, idx, lyricsData.phrases.length);

                return {
                    id: phrase.id,
                    text: phrase.text,
                    position: position,
                    parallelismClass: parallelism.class,
                    parallelismBadge: parallelism.badge,
                    dominantDomainClass: `domain-${semantics.dominantDomain}`,
                    semanticIcons: semantics.icons,
                    functionLabel: functionLabel,
                    hoverText: this.phraseAnnotationGen.generateHoverText(phrase, parallelism, semantics, functionLabel)
                };
            }).filter(p => p !== null);

            // Render SVG
            const annotatedPhrasesSVG = renderPhraseAnnotations({
                phrases: annotatedPhrases,
                sections: analysis.sections
            });
            const annotatedSvgWidth = Math.max(...phrasePositions.filter(p => p).map(p => p.endX)) + 200;

            // Generate structural overview cards
            const structuralOverviewCards = this.generateStructuralCards(analysis, lyricsData);

            console.log(`Generated phrase annotations: ${annotatedPhrases.length} phrases, ${analysis.sections.length} sections, width: ${annotatedSvgWidth}px`);

            return {
                svg: annotatedPhrasesSVG,
                width: annotatedSvgWidth,
                cards: structuralOverviewCards
            };

        } catch (err) {
            console.log('Phrase annotations generation failed:', err.message);
            return null;
        }
    }

    /**
     * Generate structural overview cards HTML
     * @param {Object} analysis - Structural analysis
     * @param {Object} lyricsData - Lyrics segmentation data
     * @returns {string} HTML for structural cards
     */
    generateStructuralCards(analysis, lyricsData) {
        console.log('\nSection Analysis:');
        analysis.sections.forEach(s => console.log(`  ${s.label} (type: ${s.type}, ${s.phraseCount} phrases)`));

        const typeColors = {
            intro: '#3498DB',
            verse: '#9B59B6',
            refrain: '#F39C12',
            dialogue: '#1ABC9C',
            coda: '#E74C3C'
        };

        // Assign sections to rows based on chronological position
        const typeOrder = ['intro', 'dialogue', 'verse', 'refrain', 'coda'];

        let currentRow = 0;
        const sectionsInCurrentRow = [];

        analysis.sections.forEach((section, idx) => {
            const previousSectionsOfType = analysis.sections.slice(0, idx).filter(s => s.type === section.type);
            const typesInCurrentRow = [...new Set(sectionsInCurrentRow.map(s => s.type))];

            if (previousSectionsOfType.length > 0 && typesInCurrentRow.includes(section.type)) {
                currentRow++;
                sectionsInCurrentRow.length = 0;
            }

            section.rowNumber = currentRow;
            sectionsInCurrentRow.push(section);
        });

        // Group by row number
        const sectionsByRow = {};
        analysis.sections.forEach(section => {
            if (!sectionsByRow[section.rowNumber]) sectionsByRow[section.rowNumber] = [];
            sectionsByRow[section.rowNumber].push(section);
        });

        // Build rows
        const rows = Object.values(sectionsByRow);

        // Render rows with dividers
        return rows.map((rowSections, rowIdx) => {
            const rowCards = typeOrder.map(type => {
                const section = rowSections.find(s => s.type === type);
                if (!section) return '<div></div>';

                const color = typeColors[type] || '#95A5A6';
                const sectionPhrases = section.phraseIds.map(phraseId => {
                    const phrase = lyricsData.phrases.find(p => p.id === phraseId);
                    return phrase ? `<div style="padding: 4px 0; font-size: 12px; color: #555;">• ${phrase.text}</div>` : '';
                }).join('');

                return `
                <div style="background: white; border-left: 4px solid ${color}; border-radius: 6px; padding: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 14px; font-weight: bold; color: ${color}; margin-bottom: 8px;">${section.label}</div>
                    <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 10px;">${section.phraseCount} phrase${section.phraseCount > 1 ? 's' : ''}</div>
                    ${sectionPhrases}
                </div>`;
            }).join('');

            const divider = rowIdx < rows.length - 1 ? '<div style="grid-column: 1 / -1; height: 1px; background: linear-gradient(to right, transparent, #ccc, transparent); margin: 15px 0;"></div>' : '';
            return rowCards + divider;
        }).join('\n');
    }
}

module.exports = PhraseService;
