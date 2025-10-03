/**
 * Glissando Generator Component
 * Generates parametric glissando chevrons for Dan Tranh tablature
 *
 * @param {Object} params - Glissando parameters
 * @param {number} params.startX - Starting X position (beat/subdivision position)
 * @param {number} params.startY - Starting Y position (lowest string)
 * @param {number} params.endX - Ending X position (note center)
 * @param {number} params.endY - Ending Y position (note center)
 * @param {number} [params.chevronWidth=14] - Width of each chevron (perpendicular to path)
 * @param {number} [params.chevronDepth=9] - Depth of each chevron (along path)
 * @param {string} [params.color='black'] - Chevron color
 * @param {number} [params.strokeWidth=2] - Chevron stroke width
 * @param {boolean} [params.showPath=false] - Show reference path line
 * @returns {string} SVG markup for the glissando
 */
function generateGlissando(params) {
    const {
        startX,
        startY,
        endX,
        endY,
        chevronWidth = 14,
        chevronDepth = 9,
        color = 'black',
        strokeWidth = 2,
        showPath = false
    } = params;

    // Calculate path vector
    const dx = endX - startX;
    const dy = endY - startY;
    const pathLength = Math.sqrt(dx * dx + dy * dy);

    // Unit vector along path
    const unitX = dx / pathLength;
    const unitY = dy / pathLength;

    // Perpendicular unit vector (rotated 90° counterclockwise)
    const perpX = -unitY;
    const perpY = unitX;

    // Calculate number of chevrons that fit
    const numChevrons = Math.floor(pathLength / chevronDepth);

    // Calculate chevron spacing vector
    const spacingX = unitX * chevronDepth;
    const spacingY = unitY * chevronDepth;

    // Calculate arm offsets (from chevron point)
    const halfWidth = chevronWidth / 2;
    const leftArmX = -unitX * chevronDepth + perpX * halfWidth;
    const leftArmY = -unitY * chevronDepth + perpY * halfWidth;
    const rightArmX = -unitX * chevronDepth - perpX * halfWidth;
    const rightArmY = -unitY * chevronDepth - perpY * halfWidth;

    // Generate SVG markup
    let svg = '';

    // Optional path line
    if (showPath) {
        svg += `    <!-- Glissando Path -->\n`;
        svg += `    <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="${color}" stroke-width="1" stroke-dasharray="3,3" opacity="0.2"/>\n\n`;
    }

    // Generate chevrons
    svg += `    <!-- Glissando Chevrons (${numChevrons} chevrons, ${chevronWidth}px wide, ${chevronDepth}px deep) -->\n`;

    for (let i = 0; i < numChevrons; i++) {
        // Current chevron point position
        const pointX = startX + spacingX * i;
        const pointY = startY + spacingY * i;

        // Calculate arm positions
        const leftX = pointX + leftArmX;
        const leftY = pointY + leftArmY;
        const rightX = pointX + rightArmX;
        const rightY = pointY + rightArmY;

        // Generate polyline
        svg += `    <polyline points="${leftX.toFixed(2)},${leftY.toFixed(2)} ${pointX.toFixed(2)},${pointY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)}" `;
        svg += `stroke="${color}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="miter"/>\n`;
    }

    return svg;
}

/**
 * Generate glissando for a note in the tablature
 *
 * @param {Object} params - Note-based parameters
 * @param {number} params.noteX - Target note X position
 * @param {number} params.noteY - Target note Y position
 * @param {number} params.lowestStringY - Y position of lowest string
 * @param {number} params.beatsBack - How many beats/subdivisions before the note to start (default 1)
 * @param {number} params.beatSpacing - Pixels per beat/subdivision (default 40)
 * @param {number} [params.chevronWidth=14] - Chevron width
 * @param {number} [params.chevronDepth=9] - Chevron depth
 * @param {string} [params.color='black'] - Chevron color
 * @returns {string} SVG markup for the glissando
 */
function generateGlissandoForNote(params) {
    const {
        noteX,
        noteY,
        lowestStringY,
        beatsBack = 1,
        beatSpacing = 40,
        chevronWidth = 14,
        chevronDepth = 9,
        color = 'black'
    } = params;

    // Calculate start position (one beat/subdivision back)
    const startX = noteX - (beatsBack * beatSpacing);
    const startY = lowestStringY;

    return generateGlissando({
        startX,
        startY,
        endX: noteX,
        endY: noteY,
        chevronWidth,
        chevronDepth,
        color
    });
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateGlissando, generateGlissandoForNote };
}
