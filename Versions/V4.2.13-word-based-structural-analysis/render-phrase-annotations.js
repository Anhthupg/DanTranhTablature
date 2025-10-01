// v4/render-phrase-annotations.js
// Renders individual phrase annotation SVG elements

function renderPhraseAnnotations(annotatedPhrasesData) {
    if (!annotatedPhrasesData || !annotatedPhrasesData.phrases) {
        return '<!-- No phrase annotation data available -->';
    }

    const { phrases, sections } = annotatedPhrasesData;

    let svg = '';

    // V4.2.7: Render section boxes FIRST (background layer)
    if (sections && sections.length > 0) {
        svg += renderSectionBoxes(sections, phrases);
    }

    // Render phrase boxes (foreground layer)
    svg += phrases.map(phrase => {
        const { id, position, parallelismClass, parallelismBadge, dominantDomainClass, semanticIcons, functionLabel, hoverText } = phrase;

        // Build SVG group for this phrase
        let svg = `
    <g class="phrase-annotation" data-phrase-id="${id}">
        <!-- Background box -->
        <rect x="${position.startX}" y="50"
              width="${position.width}" height="280"
              class="phrase-box ${parallelismClass} ${dominantDomainClass}"
              data-base-x="${position.startX}"
              data-base-width="${position.width}"/>

        <!-- Phrase number label - moved lower, above phrase text -->
        <text x="${position.centerX}" y="355"
              class="phrase-label"
              data-base-x="${position.centerX}"
              data-base-y="355">
            Phrase ${id}
        </text>

        <!-- Phrase text background (for visibility) -->
        <rect x="${position.centerX - 60}" y="363"
              width="120" height="18"
              fill="white" stroke="#ddd" stroke-width="1" opacity="0.95"
              data-base-x="${position.centerX - 60}"
              data-base-width="120"
              rx="3" ry="3"/>

        <!-- Phrase text (Vietnamese) - right above phrase boxes -->
        <text x="${position.centerX}" y="375"
              class="phrase-text"
              data-base-x="${position.centerX}"
              data-base-y="375">
            ${escapeXml(phrase.text.substring(0, 30))}${phrase.text.length > 30 ? '...' : ''}
        </text>`;

        // Add parallelism badge if present
        if (parallelismBadge) {
            svg += `
        <!-- Parallelism badge -->
        <text x="${position.centerX}" y="80"
              class="parallelism-badge ${parallelismBadge.badgeClass}"
              data-base-x="${position.centerX}">
            ${parallelismBadge.text}
        </text>`;
        }

        // Add semantic cluster icons
        if (semanticIcons && semanticIcons.length > 0) {
            svg += `
        <!-- Semantic cluster icons -->
        <g class="semantic-icons"
           transform="translate(${position.centerX}, 120)"
           data-base-x="${position.centerX}">`;

            semanticIcons.forEach(icon => {
                svg += `
            <text x="0" y="${icon.yOffset}" class="semantic-icon ${icon.iconClass}">
                ${icon.icon} ${icon.label}
            </text>`;
            });

            svg += `
        </g>`;
        }

        // Add function label if present
        if (functionLabel) {
            svg += `
        <!-- Function label -->
        <text x="${position.centerX}" y="300"
              class="function-label"
              data-base-x="${position.centerX}">
            ${functionLabel.text}
        </text>`;
        }

        // Add hover tooltip
        svg += `
        <!-- Hover tooltip -->
        <title>${escapeXml(hoverText)}</title>
    </g>`;

        return svg;
    }).join('\n');

    return svg;
}

/**
 * Render section boxes (background layer)
 * V4.2.7: Macro-structure visualization
 */
function renderSectionBoxes(sections, phrases) {
    // Calculate section positions from phrase positions
    const sectionBoxes = sections.map(section => {
        // Find first and last phrase in this section
        const firstPhraseId = section.phraseIds[0];
        const lastPhraseId = section.phraseIds[section.phraseIds.length - 1];

        const firstPhrase = phrases.find(p => p.id === firstPhraseId);
        const lastPhrase = phrases.find(p => p.id === lastPhraseId);

        if (!firstPhrase || !lastPhrase) return null;

        // Section spans from start of first phrase to end of last phrase
        const startX = firstPhrase.position.startX;
        const endX = lastPhrase.position.endX;
        const width = endX - startX;
        const centerX = (startX + endX) / 2;

        return {
            id: section.id,
            type: section.type,
            label: section.label,
            startX: startX,
            width: width,
            centerX: centerX,
            phraseCount: section.phraseIds.length
        };
    }).filter(s => s !== null);

    // Render section boxes
    return sectionBoxes.map(section => {
        const typeClass = `section-${section.type}`;

        return `
    <!-- Section Box: ${section.label} -->
    <g class="section-group" data-section-id="${section.id}">
        <!-- Background box (larger, behind phrases) -->
        <rect x="${section.startX - 10}" y="35"
              width="${section.width + 20}" height="380"
              class="section-box ${typeClass}"
              data-base-x="${section.startX - 10}"
              data-base-width="${section.width + 20}"
              rx="8" ry="8"/>

        <!-- Section label background (for visibility) -->
        <rect x="${section.centerX - 60}" y="10"
              width="120" height="28"
              fill="white" stroke="${typeClass === 'section-intro' ? '#3498DB' : typeClass === 'section-refrain' ? '#F39C12' : typeClass === 'section-verse' ? '#9B59B6' : typeClass === 'section-dialogue' ? '#1ABC9C' : '#E74C3C'}" stroke-width="2" opacity="0.95"
              data-base-x="${section.centerX - 60}"
              rx="5" ry="5"/>

        <!-- Section label (top, above box) -->
        <text x="${section.centerX}" y="30"
              class="section-label ${typeClass}"
              data-base-x="${section.centerX}">
            ${section.label}
        </text>

        <!-- Phrase count background (for visibility) -->
        <rect x="${section.centerX - 40}" y="438"
              width="80" height="18"
              fill="white" stroke="none" opacity="0.9"
              data-base-x="${section.centerX - 40}"
              data-base-width="80"
              rx="3" ry="3"/>

        <!-- Phrase count badge (bottom, below box) -->
        <text x="${section.centerX}" y="450"
              class="section-info"
              data-base-x="${section.centerX}"
              data-base-y="450">
            ${section.phraseCount} phrase${section.phraseCount > 1 ? 's' : ''}
        </text>

        <title>Section: ${section.label} (${section.phraseCount} phrases)</title>
    </g>`;
    }).join('\n');
}

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = { renderPhraseAnnotations };
