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

        <!-- Phrase text (Vietnamese) - right above phrase boxes, NO background box -->
        <text x="${position.centerX}" y="375"
              class="phrase-text"
              data-base-x="${position.centerX}"
              data-base-y="375"
              style="text-shadow: 1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white;">
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
        <!-- Background box (large, groups phrases together) -->
        <rect x="${section.startX - 10}" y="35"
              width="${section.width + 20}" height="380"
              class="section-box ${typeClass}"
              data-base-x="${section.startX - 10}"
              data-base-y="35"
              data-base-width="${section.width + 20}"
              data-base-height="380"
              rx="8" ry="8"/>

        <!-- Section label (top) - no background box, just text with shadow -->
        <text x="${section.centerX}" y="30"
              class="section-label ${typeClass}"
              data-base-x="${section.centerX}"
              style="text-shadow: 2px 2px 3px white, -2px -2px 3px white, 2px -2px 3px white, -2px 2px 3px white; font-weight: bold; font-size: 16px;">
            ${section.label}
        </text>

        <!-- Phrase count badge (bottom) - no background box, just text with shadow -->
        <text x="${section.centerX}" y="450"
              class="section-info"
              data-base-x="${section.centerX}"
              data-base-y="450"
              style="text-shadow: 1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white;">
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
