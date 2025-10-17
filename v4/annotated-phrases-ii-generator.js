/**
 * Lyrics-Based Analyses Generator (Pure Lyrics STRUCTURAL Analysis)
 * Clean, server-side SVG generation with zoom-aware design
 *
 * IMPORTANT: This analyzes LYRICS TEXT STRUCTURE ONLY
 * - Shows: Phrase text, repetition, linguistic types (question, exclamatory, etc.)
 * - Does NOT show: Tone, rhyme, pitch, duration, or semantic themes
 * - Semantic themes (nature, family, emotion) → See Radar Chart section instead
 *
 * 2-Row Linguistic STRUCTURE System:
 * - ROW 1: Phrase boxes (rainbow hue colors) + Connection arcs
 * - ROW 2: Linguistic type bands (7 distinct colors showing phrase function)
 *
 * Visual Encoding (V4.4.8 Final):
 * - Fill color = Rainbow hue progression for unique phrases (Red→Orange→Yellow→Green→Blue→Purple)
 * - Badges = REPEAT groups only (Roman numerals: I, II, III...)
 * - Solid arcs = REPEAT groups (identical text)
 * - Dashed arcs = PARALLEL groups (LLM thematic similarities)
 * - Linguistic bands = 7 distinct colors (Red, Blue, Green, Purple, Orange, Pink, Teal)
 *
 * Technical Features:
 * - Vietnamese text with proper centering
 * - Perfect zoom alignment (no inline style issues)
 * - Server-side SVG generation
 * - 2-arc system (REPEAT + PARALLEL only)
 * - 2-row system (removed semantic themes - redundant with radar chart)
 * - Ribbon-style bands clearly distinct from phrase boxes
 * - Curved arc connections with adaptive height
 */

const PhraseAnnotationsGenerator = require('./generate-phrase-annotations');

class AnnotatedPhrasesIIGenerator {
    constructor() {
        // Use existing analysis engine
        this.analyzer = new PhraseAnnotationsGenerator();

        // Linguistic type colors - maximally distinct for easy recognition
        this.typeColors = {
            'exclamatory': '#E74C3C',      // Red - emotional outbursts
            'question': '#3498DB',         // Blue - interrogative
            'answer': '#2ECC71',           // Green - positive response
            'narrative': '#9B59B6',        // Purple - story-telling
            'complaint': '#F39C12',        // Orange - grievance
            'onomatopoeia': '#E91E63',     // Pink - sound effects
            'descriptive': '#16A085'       // Teal - observational
        };

        // Section type colors (pure linguistic types) - Subtle backgrounds, don't compete with phrase colors
        this.sectionColors = {
            // Special positions
            'intro': 'rgba(189, 195, 199, 0.12)',        // Light gray - opening
            'coda': 'rgba(93, 109, 126, 0.12)',          // Dark gray - conclusion

            // Pure linguistic types (subtle, neutral)
            'exclamatory': 'rgba(255, 107, 107, 0.05)',  // Very light red
            'question': 'rgba(78, 205, 196, 0.05)',      // Very light cyan
            'answer': 'rgba(149, 225, 211, 0.05)',       // Very light mint
            'complaint': 'rgba(255, 217, 61, 0.05)',     // Very light yellow
            'narrative': 'rgba(168, 230, 207, 0.05)',    // Very light green
            'imperative': 'rgba(231, 76, 60, 0.05)',     // Very light orange
            'vocative': 'rgba(195, 174, 214, 0.05)'      // Very light purple
        };
    }

    /**
     * Generate complete Lyrics-Based Analyses SVG (Pure Lyrics STRUCTURE Analysis)
     * 2-row system: phrase boxes + connection arcs, linguistic type bands
     * @param {Object} lyricsData - Lyrics segmentation data
     * @param {Object} relationships - Word-to-note mappings
     * @param {Array} positionedNotes - Notes with X/Y positions from tablature (index-based)
     * @returns {Object} { svg, width, height, phraseCount }
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

        // NEW: Assign fill colors by unique phrase text (identical phrases = same fill)
        // Use parallelGroup if available, otherwise normalize text (MUST match detectExactRefrains!)
        const normalizeText = (text) => text.trim().toLowerCase().replace(/[,\.!?;:]/g, '');

        const getGroupKey = (phrase) => {
            // Use parallelGroup if LLM provided it, otherwise normalize text
            return phrase.parallelGroup || normalizeText(phrase.text);
        };

        const uniqueGroups = [...new Set(lyricsData.phrases.map(p => getGroupKey(p)))];
        const fillColorPalette = this.generateFillColorPalette(uniqueGroups.length);
        const groupToFillColor = {};
        uniqueGroups.forEach((group, idx) => {
            groupToFillColor[group] = fillColorPalette[idx];
        });

        console.log(`[AnnotatedPhrasesII] Color assignment: ${uniqueGroups.length} unique phrase groups (punctuation-normalized), fill by group, border by linguisticType`);

        // STEP 1: Assign group IDs for labeling
        const groupAssignments = this.assignGroupIDs(lyricsData.phrases, analysis, getGroupKey, normalizeText);

        // Build enriched phrase data
        const enrichedPhrases = lyricsData.phrases.map((phrase, idx) => {
            const position = phrasePositions[idx];
            if (!position) {
                console.warn(`[AnnotatedPhrasesII] No position for phrase ${phrase.id}`);
                return null;
            }

            // Get parallelism level with group ID
            const parallelism = this.getParallelismWithGroupID(phrase, analysis, groupAssignments);

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
                // Group key for lyrics-based grouping (ignores punctuation)
                groupKey: getGroupKey(phrase),
                // Group IDs for connecting related phrases
                repeatGroupID: groupAssignments.repeatGroups[normalizeText(phrase.text)],
                parallelGroupID: phrase.parallelGroup ? groupAssignments.parallelGroups[phrase.parallelGroup] : undefined,
                structuralGroupID: groupAssignments.structuralGroups[this.analyzer.extractPattern(phrase.wordMapping)],
                // Two-tier color system
                fillColor: groupToFillColor[getGroupKey(phrase)] || '#E0E0E0',
                borderColor: this.typeColors[phrase.linguisticType] || '#999'
            };
        }).filter(p => p !== null);

        // Calculate dimensions
        if (enrichedPhrases.length === 0) {
            console.warn('[AnnotatedPhrasesII] No phrases to render');
            return { svg: '', width: 2000, height: 800, phraseCount: 0 };
        }

        const maxX = Math.max(...enrichedPhrases.map(p => p.position.endX)) + 200;
        const totalHeight = 480; // 120px arcs + 120px Row 1 + 33px Row 2 + (5 methods × 25px) + padding

        // Build SVG with 3-row architecture
        const svg = this.buildSVG(enrichedPhrases, analysis.sections, maxX, totalHeight, lyricsData);

        console.log(`[AnnotatedPhrasesII] Generated ${enrichedPhrases.length} phrases in 2-row layout (${maxX}x${totalHeight})`);

        return {
            svg,
            width: maxX,
            height: totalHeight,
            phraseCount: enrichedPhrases.length
        };
    }

    /**
     * Assign unique group IDs to distinguish different relationship types
     * - REPEAT groups: Roman numerals (I, II, III...)
     * - PARALLEL groups: Letters (A, B, C...)
     * - STRUCTURAL groups: Pattern names (TITLE-NAME, VERB-OBJECT, etc.)
     */
    assignGroupIDs(phrases, analysis, getGroupKey, normalizeText) {
        const assignments = {
            repeatGroups: {},      // normalizedText -> Roman numeral
            parallelGroups: {},    // parallelGroup key -> Letter
            structuralGroups: {},  // pattern -> pattern name (spelled out)
            structuralPatterns: {} // pattern -> human-readable pattern
        };

        // 1. Assign Roman numerals to REPEAT groups (exact text matches)
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        let repeatIndex = 0;

        analysis.exactRefrains.forEach(refrain => {
            const normalizedText = refrain.text;
            assignments.repeatGroups[normalizedText] = romanNumerals[repeatIndex] || `${repeatIndex + 1}`;
            repeatIndex++;
        });

        // 2. Store PARALLEL groups with their descriptive names (from LLM parallelGroup)
        const parallelGroupKeys = new Set();
        phrases.forEach(phrase => {
            if (phrase.parallelGroup) {
                const normalized = normalizeText(phrase.text);
                const isThematicGroup = phrase.parallelGroup !== normalized;
                if (isThematicGroup) {
                    parallelGroupKeys.add(phrase.parallelGroup);
                }
            }
        });

        Array.from(parallelGroupKeys).forEach(groupKey => {
            // Use the parallelGroup key itself as the label (it's already descriptive from LLM)
            assignments.parallelGroups[groupKey] = groupKey;
        });

        // 3. Store STRUCTURAL patterns with their pattern names (spell out the structure)
        analysis.structuralParallels.forEach(parallel => {
            if (parallel.phraseIds.length > 1) {
                // Store the pattern itself as the ID (e.g., "TITLE-NAME", "VERB-OBJECT")
                assignments.structuralGroups[parallel.pattern] = parallel.pattern;
                assignments.structuralPatterns[parallel.pattern] = parallel.pattern;
            }
        });

        console.log(`[AnnotatedPhrasesII] Assigned ${repeatIndex} REPEAT groups, ${Object.keys(assignments.parallelGroups).length} PARALLEL groups, ${Object.keys(assignments.structuralGroups).length} STRUCTURAL groups`);
        console.log(`[AnnotatedPhrasesII] REPEAT group keys:`, Object.keys(assignments.repeatGroups));
        console.log(`[AnnotatedPhrasesII] PARALLEL group keys:`, Object.keys(assignments.parallelGroups));

        return assignments;
    }

    /**
     * Get parallelism level with group ID for labeling
     */
    getParallelismWithGroupID(phrase, analysis, groupAssignments) {
        const normalizeText = (text) => text.replace(/[.,;:!?]/g, '').trim();
        const normalizedText = normalizeText(phrase.text);

        // Check if exact refrain
        const exactRefrain = analysis.exactRefrains.find(r =>
            r.phraseIds.includes(phrase.id)
        );

        if (exactRefrain) {
            const index = exactRefrain.phraseIds.indexOf(phrase.id) + 1;
            const groupID = groupAssignments.repeatGroups[exactRefrain.text];
            return {
                class: 'exact-refrain',
                badge: {
                    text: `${groupID} REPEAT (${index}/${exactRefrain.count})`,
                    badgeClass: 'exact',
                    color: '#D35400'
                }
            };
        }

        // STRUCTURAL parallels: DON'T show badges (too confusing)
        // Pattern extraction is too simplistic (e.g., "OTHER-VERB-OTHER-OTHER" is meaningless)
        // Structural arcs will still be drawn if patterns exist, but no text badges

        // No badge for structural or LLM parallels (shown by arcs only)
        return {
            class: '',
            badge: null
        };
    }

    /**
     * Generate vibrant, distinguishable fill color palette for unique phrases
     * Uses HSL color space for maximum visual distinction
     */
    generateFillColorPalette(count) {
        const palette = [];

        // Base colors following hue spectrum (rainbow order) for visual progression
        const baseColors = [
            '#E74C3C',  // Red (0°)
            '#E67E22',  // Orange (30°)
            '#F39C12',  // Dark Orange (40°)
            '#F1C40F',  // Yellow (50°)
            '#2ECC71',  // Green (120°)
            '#1ABC9C',  // Turquoise (170°)
            '#3498DB',  // Blue (210°)
            '#9B59B6',  // Purple (270°)
            '#E91E63',  // Pink (340°)
            '#95A5A6',  // Grey
            '#34495E',  // Dark grey
            '#16A085'   // Teal
        ];

        // Use base colors for first 12
        for (let i = 0; i < Math.min(count, baseColors.length); i++) {
            palette.push(baseColors[i]);
        }

        // Generate additional colors using HSL if needed
        if (count > baseColors.length) {
            const remaining = count - baseColors.length;
            for (let i = 0; i < remaining; i++) {
                const hue = (i * 360 / remaining) % 360;
                const saturation = 70 + (i % 3) * 10;  // 70%, 80%, 90%
                const lightness = 60 + (i % 3) * 5;    // 60%, 65%, 70%
                palette.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
            }
        }

        return palette;
    }

    /**
     * Increase saturation of a color by a given amount
     * Used to make structural parallels more vibrant
     */
    increaseSaturation(color, amount = 30) {
        // Convert hex to RGB
        let r, g, b;
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            r = parseInt(hex.substr(0, 2), 16) / 255;
            g = parseInt(hex.substr(2, 2), 16) / 255;
            b = parseInt(hex.substr(4, 2), 16) / 255;
        } else if (color.startsWith('hsl')) {
            // Already HSL, parse it
            const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (match) {
                const h = parseInt(match[1]);
                const s = Math.min(100, parseInt(match[2]) + amount);
                const l = parseInt(match[3]);
                return `hsl(${h}, ${s}%, ${l}%)`;
            }
            return color;
        } else {
            return color;
        }

        // Convert RGB to HSL
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        // Increase saturation
        s = Math.min(1, s + amount / 100);

        // Convert back to RGB
        let r2, g2, b2;
        if (s === 0) {
            r2 = g2 = b2 = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r2 = hue2rgb(p, q, h + 1/3);
            g2 = hue2rgb(p, q, h);
            b2 = hue2rgb(p, q, h - 1/3);
        }

        // Convert to hex
        const toHex = (x) => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
    }

    /**
     * Build complete SVG with 2-row pure lyrics STRUCTURE architecture
     * Row 1: Phrase boxes (rainbow hue colors, arcs show repetition/parallels)
     * Row 2: Linguistic type bands (7 distinct colors show phrase function)
     * + Connection lines: solid arcs = REPEAT, dashed arcs = PARALLEL
     * + Rows 3-7: 5 sectionization methods (different ways to segment the song)
     * Note: Semantic themes removed (redundant with radar chart, not structural)
     */
    buildSVG(enrichedPhrases, sections, width, height, lyricsData) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = [];

        // SVG header with ID for zoom controller
        svg.push(`<svg id="annotatedIISvg" width="${width}" height="${height}" xmlns="${svgNS}">`);

        // SVG pattern definitions for textures
        svg.push(this.renderPatternDefinitions());

        // CONNECTION LINES (drawn first, behind everything)
        svg.push(this.renderConnectionLines(enrichedPhrases));

        // ROW 1: Phrase text boxes (one per phrase, colored + textured)
        svg.push(this.renderRow1PhraseBoxes(enrichedPhrases));

        // ROW 2: Merged linguistic type boxes
        svg.push(this.renderRow2LinguisticTypes(enrichedPhrases));

        // ROWS 3-6: Multiple sectionization methods (different ways to segment the song)
        svg.push(this.renderSectionizationMethods(enrichedPhrases, lyricsData));

        // ROW 3 REMOVED: Semantic themes redundant with radar chart (not linguistic structure)

        svg.push('</svg>');

        return svg.join('\n');
    }

    /**
     * Render connection lines showing phrase relationships (2 types only)
     * - Solid arcs = REPEAT groups (identical text) - labeled with Roman numerals (I, II, III...)
     * - Dashed arcs = PARALLEL groups (LLM thematic) - if detected
     * - STRUCTURAL arcs REMOVED (patterns too confusing - "OTHER-OTHER-OTHER")
     * - Arcs positioned ABOVE boxes with curved paths
     */
    renderConnectionLines(enrichedPhrases) {
        const lines = [];
        const rowY = 140;
        const arcY = rowY - 10;

        // Group 1: REPEAT groups (identical text) - Solid arcs with Roman numerals
        const repeatGroups = {};
        enrichedPhrases.forEach(phrase => {
            if (phrase.repeatGroupID) {
                const groupID = phrase.repeatGroupID;
                if (!repeatGroups[groupID]) {
                    repeatGroups[groupID] = [];
                }
                repeatGroups[groupID].push(phrase);
            }
        });

        console.log(`[Arc Rendering] Found ${Object.keys(repeatGroups).length} REPEAT groups:`, Object.keys(repeatGroups));
        console.log(`[Arc Rendering] Phrases with repeatGroupID: ${enrichedPhrases.filter(p => p.repeatGroupID).length}/${enrichedPhrases.length}`);

        Object.entries(repeatGroups).forEach(([groupID, phrases]) => {
            if (phrases.length > 1) {
                for (let i = 0; i < phrases.length - 1; i++) {
                    const p1 = phrases[i];
                    const p2 = phrases[i + 1];
                    const x1 = p1.position.centerX;
                    const x2 = p2.position.centerX;
                    const distance = Math.abs(x2 - x1);
                    const arcHeight = Math.min(distance * 0.5, 80);
                    const brightColor = this.increaseSaturation(p1.fillColor, 40);

                    lines.push(`
        <!-- REPEAT Group ${groupID}: "${p1.text.substring(0, 20)}..." -->
        <path d="M ${x1},${arcY} Q ${(x1 + x2) / 2},${arcY - arcHeight} ${x2},${arcY}"
            stroke="#FFFFFF" stroke-width="6" fill="none" opacity="0.7"
            data-base-x1="${x1}" data-base-x2="${x2}"/>
        <path d="M ${x1},${arcY} Q ${(x1 + x2) / 2},${arcY - arcHeight} ${x2},${arcY}"
            stroke="${brightColor}" stroke-width="4" fill="none" opacity="0.9"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
            data-base-x1="${x1}" data-base-x2="${x2}">
            <title>${groupID} REPEAT: "${this.escapeXML(p1.text)}"</title>
        </path>`);
                }
            }
        });

        // Group 2: PARALLEL groups (LLM thematic) - Dashed arcs with letters
        const parallelGroups = {};
        enrichedPhrases.forEach(phrase => {
            if (phrase.parallelGroupID) {
                const groupID = phrase.parallelGroupID;
                if (!parallelGroups[groupID]) {
                    parallelGroups[groupID] = [];
                }
                parallelGroups[groupID].push(phrase);
            }
        });

        Object.entries(parallelGroups).forEach(([groupID, phrases]) => {
            if (phrases.length > 1) {
                for (let i = 0; i < phrases.length - 1; i++) {
                    const p1 = phrases[i];
                    const p2 = phrases[i + 1];
                    const x1 = p1.position.centerX;
                    const x2 = p2.position.centerX;
                    const distance = Math.abs(x2 - x1);
                    const arcHeight = Math.min(distance * 0.7, 120);
                    const brightColor = this.increaseSaturation(p1.fillColor, 40);

                    lines.push(`
        <!-- PARALLEL Group ${groupID} -->
        <path d="M ${x1},${arcY - 10} Q ${(x1 + x2) / 2},${arcY - 10 - arcHeight} ${x2},${arcY - 10}"
            stroke="#FFFFFF" stroke-width="5" stroke-dasharray="8,6" fill="none" opacity="0.6"
            data-base-x1="${x1}" data-base-x2="${x2}"/>
        <path d="M ${x1},${arcY - 10} Q ${(x1 + x2) / 2},${arcY - 10 - arcHeight} ${x2},${arcY - 10}"
            stroke="${brightColor}" stroke-width="3" stroke-dasharray="8,6" fill="none" opacity="0.8"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
            data-base-x1="${x1}" data-base-x2="${x2}">
            <title>${groupID} PARALLEL: "${this.escapeXML(p1.text)}" ↔ "${this.escapeXML(p2.text)}"</title>
        </path>`);
                }
            }
        });

        // STRUCTURAL arcs REMOVED - too confusing (patterns like "OTHER-OTHER" are meaningless)
        // Only REPEAT (solid) and PARALLEL (dashed) arcs remain

        return lines.join('\n');
    }

    /**
     * Render SVG pattern definitions for textures
     */
    renderPatternDefinitions() {
        return `
    <defs>
        <!-- Diagonal stripes for structural parallels -->
        <pattern id="stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="currentColor"/>
            <line x1="0" y1="0" x2="0" y2="8" stroke="#FFFFFF" stroke-width="2" opacity="0.6"/>
        </pattern>

        <!-- Polka dots for semantic parallels -->
        <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="currentColor"/>
            <circle cx="6" cy="6" r="2" fill="#FFFFFF" opacity="0.7"/>
        </pattern>
    </defs>`;
    }

    /**
     * ROW 1: Phrase text boxes with connection arcs
     * - One box per phrase
     * - Fill color = identical text (same phrase = same color)
     * - Connection arcs show relationships (solid = identical, dashed = thematic parallel)
     */
    renderRow1PhraseBoxes(enrichedPhrases) {
        const boxes = [];
        const rowY = 140;  // Increased to 140 to add top padding for tall arcs
        const rowHeight = 120;

        enrichedPhrases.forEach(phrase => {
            const { position, parallelism } = phrase;

            // Use base fill color (no saturation adjustment)
            // Connection arcs now show all relationships - saturation is redundant
            let fillColor = phrase.fillColor;

            boxes.push(`
    <g class="phrase-box-row1" data-phrase-id="${phrase.id}">
        <!-- Background box (no border) -->
        <rect
            x="${position.startX}"
            y="${rowY}"
            width="${position.width}"
            height="${rowHeight}"
            fill="${fillColor}"
            fill-opacity="0.4"
            rx="4"
            data-base-x="${position.startX}"
            data-base-width="${position.width}"
            data-base-y="${rowY}"
            data-base-height="${rowHeight}">
            <title>${this.escapeXML(phrase.text)}</title>
        </rect>

        <!-- REPEAT badge -->
        ${parallelism.badge ? `
        <text
            x="${position.centerX}"
            y="${rowY + 25}"
            text-anchor="middle"
            font-size="11"
            font-weight="bold"
            fill="${parallelism.badge.color || '#FFD700'}"
            stroke="#FFFFFF"
            stroke-width="2"
            paint-order="stroke"
            data-base-x="${position.centerX}"
            data-base-y="${rowY + 25}">
            ${parallelism.badge.text}
        </text>` : ''}

        <!-- Phrase text -->
        <text
            x="${position.centerX}"
            y="${rowY + 70}"
            text-anchor="middle"
            font-size="12"
            font-weight="700"
            fill="#000000"
            stroke="#FFFFFF"
            stroke-width="3"
            paint-order="stroke"
            data-base-x="${position.centerX}"
            data-base-y="${rowY + 70}">
            ${this.escapeXML(phrase.text.substring(0, 30))}${phrase.text.length > 30 ? '...' : ''}
        </text>

        <!-- Phrase number -->
        <text
            x="${position.centerX}"
            y="${rowY + 110}"
            text-anchor="middle"
            font-size="9"
            fill="#000000"
            stroke="#FFFFFF"
            stroke-width="2"
            paint-order="stroke"
            data-base-x="${position.centerX}"
            data-base-y="${rowY + 110}">
            #${phrase.id}
        </text>
    </g>`);
        });

        return boxes.join('\n');
    }

    /**
     * ROW 2: Linguistic type bands (thin ribbons, not boxes)
     * - Shows consecutive phrases of same type with colored bands
     * - Clearly distinct from phrase boxes above
     */
    renderRow2LinguisticTypes(enrichedPhrases) {
        const bands = [];
        const rowY = 280;  // Increased to match new layout (140 + 120 + 20 padding)
        const bandHeight = 8;  // Thin band instead of tall box
        const labelY = rowY + 25;  // Label below the band

        // Group consecutive phrases by linguistic type
        const groups = [];
        let currentGroup = null;

        enrichedPhrases.forEach(phrase => {
            if (!currentGroup || currentGroup.type !== phrase.linguisticType) {
                // Start new group
                if (currentGroup) groups.push(currentGroup);
                currentGroup = {
                    type: phrase.linguisticType,
                    phrases: [phrase],
                    startX: phrase.position.startX,
                    endX: phrase.position.endX
                };
            } else {
                // Continue current group
                currentGroup.phrases.push(phrase);
                currentGroup.endX = phrase.position.endX;
            }
        });

        if (currentGroup) groups.push(currentGroup);

        // Render thin colored bands with labels
        groups.forEach(group => {
            const width = group.endX - group.startX;
            const centerX = (group.startX + group.endX) / 2;
            const typeColor = this.typeColors[group.type] || '#999';
            const phraseIds = group.phrases.map(p => p.id).join(', #');

            bands.push(`
    <g class="linguistic-type-band" data-type="${group.type}">
        <!-- Thin colored band (ribbon style) -->
        <rect
            x="${group.startX}"
            y="${rowY}"
            width="${width}"
            height="${bandHeight}"
            fill="${typeColor}"
            fill-opacity="0.8"
            rx="4"
            data-base-x="${group.startX}"
            data-base-width="${width}">
            <title>${group.type.toUpperCase()} (${group.phrases.length} phrases): #${phraseIds}</title>
        </rect>

        <!-- Connecting vertical line (left edge) -->
        <line
            x1="${group.startX}"
            y1="${rowY + bandHeight}"
            x2="${group.startX}"
            y2="${labelY - 5}"
            stroke="${typeColor}"
            stroke-width="1"
            opacity="0.4"
            data-base-x1="${group.startX}"
            data-base-x2="${group.startX}"/>

        <!-- Connecting vertical line (right edge) -->
        <line
            x1="${group.endX}"
            y1="${rowY + bandHeight}"
            x2="${group.endX}"
            y2="${labelY - 5}"
            stroke="${typeColor}"
            stroke-width="1"
            opacity="0.4"
            data-base-x1="${group.endX}"
            data-base-x2="${group.endX}"/>

        <!-- Type label (below band) -->
        <text
            x="${centerX}"
            y="${labelY}"
            text-anchor="middle"
            font-size="11"
            font-weight="600"
            fill="${typeColor}"
            data-base-x="${centerX}">
            ${group.type.toUpperCase()} (${group.phrases.length})
        </text>
    </g>`);
        });

        return bands.join('\n');
    }

    /**
     * ROWS 3-7: Multiple Sectionization Methods
     * Shows different ways to segment the song based on lyrics alone
     */
    renderSectionizationMethods(enrichedPhrases, lyricsData) {
        const methods = [];
        const startY = 320; // Start after Row 2 (280 + 8px band + 32px padding)
        const bandHeight = 18;  // Increased from 6 to 18 for labels
        const rowGap = 30;  // Increased gap for better separation

        // Method 1: Repetition-Based (Verse-Refrain structure)
        methods.push(this.renderRepetitionSections(enrichedPhrases, startY, bandHeight));

        // Method 2: Dialogue-Based (Question-Answer pairs)
        methods.push(this.renderDialogueSections(enrichedPhrases, startY + rowGap, bandHeight));

        // Method 3: Emotion-Based (Emotional intensity shifts)
        methods.push(this.renderEmotionSections(enrichedPhrases, startY + rowGap * 2, bandHeight));

        // Method 4: Narrative-Based (Story progression)
        methods.push(this.renderNarrativeSections(enrichedPhrases, startY + rowGap * 3, bandHeight));

        // Method 5: Parallelism-Based (Structural patterns)
        methods.push(this.renderParallelismSections(enrichedPhrases, startY + rowGap * 4, bandHeight));

        return methods.join('\n');
    }

    /**
     * Method 1: Repetition-Based Sectionization (Verse-Refrain Structure)
     * Visual: Wave contour - Verses dip down, Refrains rise up (like musical dynamics)
     * Height encoding: Refrain = tall (12px), Verse = short (6px), Unique = medium (9px)
     */
    renderRepetitionSections(enrichedPhrases, startY, baseHeight) {
        const bands = [];

        // Detect sections by repetition - merge adjacent same-type sections
        const sections = [];
        let currentSection = null;
        let verseCounter = 0;
        let refrainCounter = 0;

        enrichedPhrases.forEach((phrase, idx) => {
            const isRepeated = phrase.repeatGroupID !== undefined;
            const sectionType = isRepeated ? 'REFRAIN' : 'VERSE';

            if (!currentSection || currentSection.type !== sectionType) {
                // Start new section
                if (currentSection) sections.push(currentSection);

                // Increment counter for this type
                if (sectionType === 'VERSE') verseCounter++;
                else refrainCounter++;

                currentSection = {
                    type: sectionType,
                    startX: phrase.position.startX,
                    endX: phrase.position.endX,
                    phrases: [phrase],
                    number: sectionType === 'VERSE' ? verseCounter : refrainCounter
                };
            } else {
                // Extend current section (adjacent same type)
                currentSection.endX = phrase.position.endX;
                currentSection.phrases.push(phrase);
            }
        });

        if (currentSection) sections.push(currentSection);

        // Render merged bars with labels inside
        sections.forEach((section, idx) => {
            const width = section.endX - section.startX;
            const centerX = (section.startX + section.endX) / 2;

            // Color: Refrains gold, Verses blue
            const color = section.type === 'REFRAIN' ? '#F39C12' : '#3498DB';
            const label = section.type === 'REFRAIN' ? `REF ${section.number}` : `V${section.number}`;

            bands.push(`
    <g class="repetition-section">
        <!-- Thick bar -->
        <rect
            x="${section.startX}"
            y="${startY}"
            width="${width}"
            height="${baseHeight}"
            fill="${color}"
            fill-opacity="0.75"
            rx="4"
            data-base-x="${section.startX}"
            data-base-width="${width}">
            <title>${section.type} ${section.number} (${section.phrases.length} phrases)</title>
        </rect>

        <!-- Label on bar -->
        <text
            x="${centerX}"
            y="${startY + baseHeight / 2 + 4}"
            text-anchor="middle"
            font-size="10"
            font-weight="700"
            fill="white"
            data-base-x="${centerX}">
            ${label}
        </text>
    </g>`);
        });

        // Row label on left
        bands.unshift(`
    <text x="10" y="${startY + baseHeight / 2 + 4}" font-size="10" font-weight="700" fill="#666">Repetition:</text>`);

        return bands.join('\n');
    }

    /**
     * Method 2: Dialogue-Based (Q-A Flow)
     * Visual: Bracket shapes - Questions curve left, Answers curve right (conversation flow)
     */
    renderDialogueSections(enrichedPhrases, startY, bandHeight) {
        const bands = [];
        const sections = [];
        let current = null;

        enrichedPhrases.forEach(phrase => {
            const type = phrase.linguisticType === 'question' ? 'Q' :
                        phrase.linguisticType === 'answer' ? 'A' : 'MONO';

            if (!current || current.type !== type) {
                if (current) sections.push(current);
                current = { type, startX: phrase.position.startX, endX: phrase.position.endX, count: 1 };
            } else {
                current.endX = phrase.position.endX;
                current.count++;
            }
        });
        if (current) sections.push(current);

        sections.forEach(s => {
            const w = s.endX - s.startX;
            const cx = (s.startX + s.endX) / 2;
            const color = s.type === 'Q' ? '#3498DB' : s.type === 'A' ? '#2ECC71' : '#95A5A6';

            bands.push(`<rect x="${s.startX}" y="${startY}" width="${w}" height="${bandHeight}" fill="${color}" opacity="0.75" rx="4" data-base-x="${s.startX}" data-base-width="${w}"><title>${s.type} (${s.count})</title></rect>
<text x="${cx}" y="${startY + bandHeight / 2 + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="white" data-base-x="${cx}">${s.type}</text>`);
        });

        bands.unshift(`<text x="10" y="${startY + bandHeight / 2 + 4}" font-size="10" font-weight="700" fill="#666">Dialogue:</text>`);
        return bands.join('\n');
    }

    /**
     * Method 3: Emotion-Based (Intensity Curve)
     * Visual: Height = emotional intensity, creates mountain-like contour
     */
    renderEmotionSections(enrichedPhrases, startY, bandHeight) {
        const bands = [];

        enrichedPhrases.forEach(phrase => {
            const isEmotional = phrase.linguisticType === 'exclamatory' || phrase.linguisticType === 'complaint';
            const h = isEmotional ? bandHeight : bandHeight * 0.5;
            const y = isEmotional ? startY : startY + bandHeight * 0.25;
            const color = phrase.linguisticType === 'exclamatory' ? '#E74C3C' :
                         phrase.linguisticType === 'complaint' ? '#F39C12' : '#BDC3C7';
            const w = phrase.position.width;
            const label = phrase.linguisticType === 'exclamatory' ? 'EX' :
                         phrase.linguisticType === 'complaint' ? 'CM' : '';

            bands.push(`<rect x="${phrase.position.startX}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="0.75" rx="4" data-base-x="${phrase.position.startX}" data-base-width="${w}"/>
${isEmotional && w > 50 ? `<text x="${phrase.position.startX + w/2}" y="${y + h/2 + 4}" text-anchor="middle" font-size="9" font-weight="700" fill="white" data-base-x="${phrase.position.startX + w/2}">${label}</text>` : ''}`);
        });

        bands.unshift(`<text x="10" y="${startY + bandHeight / 2 + 4}" font-size="10" font-weight="700" fill="#666">Emotion:</text>`);
        return bands.join('\n');
    }

    /**
     * Method 4: Narrative-Based (Story Arc)
     * Visual: Ascending steps (setup → climax), then descending (resolution)
     */
    renderNarrativeSections(enrichedPhrases, startY, bandHeight) {
        const bands = [];
        const total = enrichedPhrases.length;

        enrichedPhrases.forEach((phrase, idx) => {
            const progress = idx / total;
            const h = bandHeight;
            const y = startY;
            const color = `hsl(${progress * 120}, 70%, 50%)`;
            const w = phrase.position.width;

            bands.push(`<rect x="${phrase.position.startX}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="0.75" rx="4" data-base-x="${phrase.position.startX}" data-base-width="${w}"/>`);
        });

        bands.unshift(`<text x="10" y="${startY + bandHeight / 2 + 4}" font-size="10" font-weight="700" fill="#666">Narrative:</text>`);
        return bands.join('\n');
    }

    /**
     * Method 5: Repeat Groups (Show which specific lyrics repeat)
     * Visual: Each repeat group (I, II, III, IV) gets its own color
     */
    renderParallelismSections(enrichedPhrases, startY, bandHeight) {
        const bands = [];

        // Group phrases by their repeat group (I, II, III, IV) or mark as UNIQUE
        const repeatGroups = new Map();
        enrichedPhrases.forEach(phrase => {
            const groupID = phrase.repeatGroupID || 'UNIQUE';
            if (!repeatGroups.has(groupID)) {
                repeatGroups.set(groupID, []);
            }
            repeatGroups.get(groupID).push(phrase);
        });

        // Assign colors - repeat groups get bright colors, UNIQUE gets grey
        const colors = {
            'I': '#E74C3C',      // Red
            'II': '#3498DB',     // Blue
            'III': '#27AE60',    // Green
            'IV': '#F39C12',     // Orange
            'V': '#9B59B6',      // Purple
            'VI': '#1ABC9C',     // Turquoise
            'VII': '#E67E22',    // Dark orange
            'VIII': '#16A085',   // Teal
            'UNIQUE': '#BDC3C7'  // Grey
        };

        // Render each phrase with its group color
        enrichedPhrases.forEach(phrase => {
            const groupID = phrase.repeatGroupID || 'UNIQUE';
            const color = colors[groupID] || '#95A5A6';
            const opacity = groupID === 'UNIQUE' ? 0.3 : 0.75;
            const w = phrase.position.width;
            const cx = phrase.position.startX + w / 2;

            // Add label if wide enough and has repeat group
            const showLabel = groupID !== 'UNIQUE' && w > 40;

            bands.push(`<rect x="${phrase.position.startX}" y="${startY}" width="${w}" height="${bandHeight}" fill="${color}" opacity="${opacity}" rx="4" data-base-x="${phrase.position.startX}" data-base-width="${w}">
<title>${groupID === 'UNIQUE' ? 'Unique phrase (no repeat)' : `Repeat Group ${groupID}`}</title></rect>${showLabel ? `
<text x="${cx}" y="${startY + bandHeight / 2 + 4}" text-anchor="middle" font-size="9" font-weight="700" fill="white" data-base-x="${cx}">${groupID}</text>` : ''}`);
        });

        bands.unshift(`<text x="10" y="${startY + bandHeight / 2 + 4}" font-size="10" font-weight="700" fill="#666">Repeat Groups:</text>`);
        return bands.join('\n');
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
            fill="#000000"
            stroke="#FFFFFF"
            stroke-width="3"
            paint-order="stroke"
            data-base-x="${centerX}">
            <title>${this.getSectionTooltip(section.type)}</title>
            ${section.label}
        </text>

        <!-- Phrase count (bottom) -->
        <text
            x="${centerX}"
            y="530"
            text-anchor="middle"
            font-size="11"
            fill="#000000"
            stroke="#FFFFFF"
            stroke-width="2"
            paint-order="stroke"
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
            fill="${phrase.fillColor}"
            fill-opacity="0.3"
            stroke="${phrase.borderColor}"
            stroke-width="3"
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
            stroke="#FFFFFF"
            stroke-width="2"
            paint-order="stroke"
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
            fill="#000000"
            stroke="#FFFFFF"
            stroke-width="2"
            paint-order="stroke"
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
            fill="#000000"
            stroke="#FFFFFF"
            stroke-width="2"
            paint-order="stroke"
            data-base-x="${position.centerX}">
            <title>${this.escapeXML(functionLabel.tooltip)}</title>
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
            font-size="13"
            font-weight="700"
            fill="#000000"
            stroke="#FFFFFF"
            stroke-width="3"
            paint-order="stroke"
            data-base-x="${position.centerX}"
            class="phrase-text">
            ${this.escapeXML(phrase.text.substring(0, 40))}${phrase.text.length > 40 ? '...' : ''}
        </text>

        <!-- Phrase number -->
        <text
            x="${position.centerX}"
            y="380"
            text-anchor="middle"
            font-size="10"
            fill="#000000"
            stroke="#FFFFFF"
            stroke-width="2"
            paint-order="stroke"
            data-base-x="${position.centerX}">
            Phrase ${phrase.id}
        </text>
    </g>`);

        return parts.join('\n');
    }

    /**
     * Get tooltip text for section types
     */
    getSectionTooltip(sectionType) {
        const tooltips = {
            'intro': 'Opening phrase of the song',
            'exclamatory': 'Emotional outbursts and calls - ơi, ới, hỡi, í, à',
            'question': 'Interrogative phrases - ai (who), gì (what), đâu (where), sao (why)',
            'answer': 'Responses to questions',
            'complaint': 'Expressions of grievance and suffering - khổ (suffering), buồn (sad)',
            'narrative': 'Story-telling and descriptive phrases',
            'imperative': 'Commands and requests - hãy (please), đừng (don\'t), chớ (don\'t)',
            'vocative': 'Calling or addressing someone',
            'coda': 'Concluding phrase of the song'
        };

        return tooltips[sectionType] || 'Section grouping phrases by linguistic type';
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
