/**
 * Annotated Phrases II Generator
 * Clean, server-side SVG generation with zoom-aware design
 *
 * Features:
 * - Musical sections (Intro, Verse, Refrain, Dialogue, Coda)
 * - Parallelism hierarchy (gold = exact refrain, blue = structural parallel)
 * - Semantic clustering (emotion, nature, action, etc.)
 * - Vietnamese text with proper centering
 * - Perfect zoom alignment (no inline style issues)
 */

const PhraseAnnotationsGenerator = require('./generate-phrase-annotations');

class AnnotatedPhrasesIIGenerator {
    constructor() {
        // Use existing analysis engine
        this.analyzer = new PhraseAnnotationsGenerator();

        // Linguistic type colors (same as phrase-bars-controller.js)
        this.typeColors = {
            'exclamatory': '#FF6B6B',      // Red
            'question': '#4ECDC4',         // Cyan
            'answer': '#95E1D3',           // Light cyan
            'narrative': '#A8E6CF',        // Light green
            'complaint': '#FFD93D',        // Yellow
            'onomatopoeia': '#C3AED6',     // Purple
            'descriptive': '#8AC4D0'       // Blue-grey
        };

        // Section type colors (for macro-structure) - Neutral tones to avoid conflict with phrase colors
        this.sectionColors = {
            'intro': 'rgba(189, 195, 199, 0.15)',     // Light gray - neutral opening
            'verse': 'rgba(149, 165, 166, 0.12)',     // Medium gray - storytelling
            'refrain': 'rgba(127, 140, 141, 0.15)',   // Dark gray - repeated hooks
            'dialogue': 'rgba(108, 122, 137, 0.12)',  // Blue-gray - conversation
            'coda': 'rgba(93, 109, 126, 0.15)'        // Darker gray - conclusion
        };
    }

    /**
     * Generate complete Annotated Phrases II SVG with full analysis
     * @param {Object} lyricsData - Lyrics segmentation data
     * @param {Object} relationships - Word-to-note mappings
     * @param {Array} positionedNotes - Notes with X/Y positions from tablature (index-based)
     * @returns {Object} { svg, width, height }
     */
    generate(lyricsData, relationships, positionedNotes) {
        console.log(`[AnnotatedPhrasesII] Generating for ${lyricsData.phrases.length} phrases with full analysis`);

        // CRITICAL FIX: positionedNotes is index-based, not ID-based
        // Merge X/Y into relationships.notes by index (same pattern as phrase-service.js)
        const notesWithPositions = relationships.notes || [];
        notesWithPositions.forEach((note, idx) => {
            if (positionedNotes[idx]) {
                note.x = positionedNotes[idx].x;
                note.y = positionedNotes[idx].y;
            }
        });

        console.log(`[AnnotatedPhrasesII] Merged ${positionedNotes.length} positions into ${notesWithPositions.length} notes`);

        // Calculate phrase positions using analyzer
        const phrasePositions = this.analyzer.calculatePhrasePositions(
            lyricsData.phrases,
            relationships.wordToNoteMap,
            notesWithPositions
        );

        // Run full structural analysis
        const analysis = this.analyzer.analyzeStructure(lyricsData.phrases);
        console.log(`[AnnotatedPhrasesII] Analysis complete: ${analysis.sections.length} sections, ${analysis.exactRefrains.length} exact refrains`);

        // Build enriched phrase data
        const enrichedPhrases = lyricsData.phrases.map((phrase, idx) => {
            const position = phrasePositions[idx];
            if (!position) {
                console.warn(`[AnnotatedPhrasesII] No position for phrase ${phrase.id}`);
                return null;
            }

            // Get parallelism level
            const parallelism = this.analyzer.getParallelismLevel(phrase, analysis);

            // Get semantic clusters
            const semantics = this.analyzer.getSemanticClusters(phrase);

            // Get function label
            const functionLabel = this.analyzer.getFunctionLabel(phrase, idx, lyricsData.phrases.length);

            return {
                id: phrase.id,
                text: phrase.text,
                type: phrase.type,
                linguisticType: phrase.linguisticType,
                position,
                parallelism,
                semantics,
                functionLabel,
                color: this.typeColors[phrase.linguisticType] || '#999'
            };
        }).filter(p => p !== null);

        // Calculate dimensions
        if (enrichedPhrases.length === 0) {
            console.warn('[AnnotatedPhrasesII] No phrases to render');
            return { svg: '', width: 2000, height: 800, phraseCount: 0 };
        }

        const maxX = Math.max(...enrichedPhrases.map(p => p.position.endX)) + 200;
        const totalHeight = 550; // Fixed height for consistent layout

        // Build SVG with sections + phrases
        const svg = this.buildSVG(enrichedPhrases, analysis.sections, maxX, totalHeight);

        console.log(`[AnnotatedPhrasesII] Generated ${enrichedPhrases.length} phrases, ${analysis.sections.length} sections (${maxX}x${totalHeight})`);

        return {
            svg,
            width: maxX,
            height: totalHeight,
            phraseCount: enrichedPhrases.length
        };
    }

    /**
     * Build complete SVG with sections and full phrase annotations
     */
    buildSVG(enrichedPhrases, sections, width, height) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = [];

        // SVG header with ID for zoom controller
        svg.push(`<svg id="annotatedIISvg" width="${width}" height="${height}" xmlns="${svgNS}">`);

        // LAYER 1: Section boxes (background)
        if (sections && sections.length > 0) {
            svg.push(this.renderSectionBoxes(sections, enrichedPhrases));
        }

        // LAYER 2: Phrase annotations (foreground)
        for (const phrase of enrichedPhrases) {
            svg.push(this.renderPhraseAnnotation(phrase));
        }

        svg.push('</svg>');

        return svg.join('\n');
    }

    /**
     * Render section boxes (Intro, Verse 1, Refrain 1, etc.)
     */
    renderSectionBoxes(sections, enrichedPhrases) {
        const boxes = [];

        for (const section of sections) {
            // Find first and last phrase in this section
            const firstPhraseId = section.phraseIds[0];
            const lastPhraseId = section.phraseIds[section.phraseIds.length - 1];

            const firstPhrase = enrichedPhrases.find(p => p.id === firstPhraseId);
            const lastPhrase = enrichedPhrases.find(p => p.id === lastPhraseId);

            if (!firstPhrase || !lastPhrase) {
                console.warn(`[AnnotatedPhrasesII] Section ${section.label}: missing phrases`);
                continue;
            }

            // Calculate section span
            const startX = firstPhrase.position.startX;
            const endX = lastPhrase.position.endX;
            const sectionWidth = endX - startX;
            const centerX = (startX + endX) / 2;

            const sectionColor = this.sectionColors[section.type] || 'rgba(200, 200, 200, 0.1)';

            boxes.push(`
    <!-- Section: ${section.label} -->
    <g class="section-group" data-section-id="${section.id}">
        <!-- Background box -->
        <rect
            x="${startX - 10}"
            y="35"
            width="${sectionWidth + 20}"
            height="480"
            fill="${sectionColor}"
            stroke="#999"
            stroke-width="1"
            rx="8"
            data-base-x="${startX - 10}"
            data-base-width="${sectionWidth + 20}"
        />

        <!-- Section label (top) -->
        <text
            x="${centerX}"
            y="25"
            text-anchor="middle"
            font-size="14"
            font-weight="bold"
            fill="#2c3e50"
            data-base-x="${centerX}"
            style="text-shadow: 2px 2px 3px white, -2px -2px 3px white;">
            ${section.label}
        </text>

        <!-- Phrase count (bottom) -->
        <text
            x="${centerX}"
            y="530"
            text-anchor="middle"
            font-size="11"
            fill="#7f8c8d"
            data-base-x="${centerX}">
            ${section.phraseIds.length} phrase${section.phraseIds.length > 1 ? 's' : ''}
        </text>
    </g>`);
        }

        return boxes.join('\n');
    }

    /**
     * Render single phrase annotation with all features
     */
    renderPhraseAnnotation(phrase) {
        const { position, parallelism, semantics, functionLabel } = phrase;
        const parts = [];

        // Generate hover tooltip text
        const hoverText = this.analyzer.generateHoverText(phrase, parallelism, semantics, functionLabel);

        // Phrase box
        parts.push(`
    <g class="phrase-annotation" data-phrase-id="${phrase.id}">
        <!-- Background box -->
        <rect
            x="${position.startX}"
            y="50"
            width="${position.width}"
            height="280"
            fill="${phrase.color}"
            fill-opacity="0.2"
            stroke="${phrase.color}"
            stroke-width="2"
            class="${parallelism.class}"
            data-base-x="${position.startX}"
            data-base-width="${position.width}"
        >
            <title>${this.escapeXML(hoverText)}</title>
        </rect>`);

        // Parallelism badge (gold for exact refrain, blue for structural parallel)
        if (parallelism.badge) {
            parts.push(`
        <!-- Parallelism badge -->
        <text
            x="${position.centerX}"
            y="70"
            text-anchor="middle"
            font-size="12"
            font-weight="bold"
            fill="${parallelism.badge.color || '#FFD700'}"
            data-base-x="${position.centerX}">
            ${parallelism.badge.text}
        </text>`);
        }

        // Semantic cluster icons (positioned individually for better zoom control)
        if (semantics.icons && semantics.icons.length > 0) {
            semantics.icons.forEach((icon, idx) => {
                parts.push(`
        <!-- Semantic icon ${idx + 1} -->
        <text
            x="${position.centerX}"
            y="${110 + idx * 20}"
            text-anchor="middle"
            font-size="11"
            fill="#555"
            data-base-x="${position.centerX}">
            ${icon.icon} ${icon.label}
        </text>`);
            });
        }

        // Function label (beginning/middle/ending)
        if (functionLabel) {
            parts.push(`
        <!-- Function label -->
        <text
            x="${position.centerX}"
            y="290"
            text-anchor="middle"
            font-size="10"
            fill="#7f8c8d"
            data-base-x="${position.centerX}">
            ${functionLabel.text}
        </text>`);
        }

        // Vietnamese phrase text (bottom)
        parts.push(`
        <!-- Phrase text -->
        <text
            x="${position.centerX}"
            y="360"
            text-anchor="middle"
            font-size="12"
            font-weight="600"
            fill="#2c3e50"
            data-base-x="${position.centerX}"
            class="phrase-text"
            style="text-shadow: 1px 1px 2px white, -1px -1px 2px white;">
            ${this.escapeXML(phrase.text.substring(0, 40))}${phrase.text.length > 40 ? '...' : ''}
        </text>

        <!-- Phrase number -->
        <text
            x="${position.centerX}"
            y="380"
            text-anchor="middle"
            font-size="10"
            fill="#95a5a6"
            data-base-x="${position.centerX}">
            Phrase ${phrase.id}
        </text>
    </g>`);

        return parts.join('\n');
    }

    /**
     * Escape XML special characters
     */
    escapeXML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

module.exports = AnnotatedPhrasesIIGenerator;
