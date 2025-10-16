/**
 * Debug Label Generator Component
 * Generates debugging labels for tablature visualization
 *
 * @module debug-label-generator
 */

/**
 * Generate Y-position debug label for a string
 * @param {Object} params
 * @param {number} params.y - Y position
 * @param {number} params.x - X position for label
 * @param {string} params.value - Value to display
 * @param {string} [params.color='#999999'] - Label color
 * @param {number} [params.fontSize=10] - Font size
 * @returns {string} SVG text element
 */
function generateYPositionLabel(params) {
    const {
        y,
        x = 85,
        value,
        color = '#999999',
        fontSize = 10
    } = params;

    return `<text x="${x}" y="${y + 5}" class="debug-y-label" fill="${color}" font-size="${fontSize}">Y=${value.toFixed(1)}</text>`;
}

/**
 * Generate boundary marker label (TOP/BOT)
 * @param {Object} params
 * @param {number} params.y - Y position
 * @param {number} params.x - X position for label
 * @param {string} params.type - 'TOP' or 'BOT'
 * @param {string} [params.color='#0066CC'] - Label color
 * @param {number} [params.fontSize=10] - Font size
 * @param {boolean} [params.isGrey=false] - Whether boundary is on grey string
 * @returns {string} SVG text element
 */
function generateBoundaryLabel(params) {
    const {
        y,
        x = 5,
        type,
        color = '#0066CC',
        fontSize = 10,
        isGrey = false
    } = params;

    const label = isGrey ? `${type} (GREY)` : type;
    const finalColor = isGrey ? '#FF00FF' : color; // Magenta for grey boundaries

    return `<text x="${x}" y="${y + 5}" class="debug-label" fill="${finalColor}" font-size="${fontSize}" font-weight="bold">${label}</text>`;
}

/**
 * Generate complete debug labels for a string
 * @param {Object} params
 * @param {number} params.stringNumber - String number (1-based)
 * @param {string} params.note - Note name (e.g., "E3")
 * @param {number} params.y - Y position
 * @param {boolean} params.isFirst - Is this the first string?
 * @param {boolean} params.isLast - Is this the last string?
 * @param {Object} [params.config] - Configuration options
 * @param {boolean} [params.config.showYValues=true] - Show Y position values
 * @param {boolean} [params.config.showBoundaries=true] - Show TOP/BOT markers
 * @param {number} [params.config.labelX=50] - X position for string label
 * @param {number} [params.config.yValueX=85] - X position for Y value
 * @param {number} [params.config.boundaryX=5] - X position for boundary marker
 * @returns {string} SVG markup for all labels
 */
function generateStringDebugLabels(params) {
    const {
        stringNumber,
        note,
        y,
        isFirst,
        isLast,
        config = {}
    } = params;

    const {
        showYValues = true,
        showBoundaries = true,
        labelX = 5,
        yValueX = 85,
        boundaryX = 5
    } = config;

    let labels = [];

    // Main string label (always shown)
    labels.push(`<text x="${labelX}" y="${y + 5}" class="string-label">${note}</text>`);

    // Y-position debug label (optional)
    if (showYValues) {
        labels.push(generateYPositionLabel({ y, x: yValueX, value: y }));
    }

    // Boundary markers (optional)
    if (showBoundaries) {
        if (isFirst) {
            labels.push(generateBoundaryLabel({ y, x: boundaryX, type: 'TOP' }));
        } else if (isLast) {
            labels.push(generateBoundaryLabel({ y, x: boundaryX, type: 'BOT' }));
        }
    }

    return labels.join('\n    ');
}

/**
 * Generate glissando start Y-position debug label
 * @param {Object} params
 * @param {number} params.x - X position (glissando start X)
 * @param {number} params.y - Y position (glissando start Y)
 * @param {number} [params.offsetX=-30] - Offset from glissando start
 * @param {string} [params.color='#CC0000'] - Label color (red by default)
 * @param {number} [params.fontSize=11] - Font size
 * @returns {string} SVG text element
 */
function generateGlissandoStartLabel(params) {
    const {
        x,
        y,
        offsetX = -30,
        color = '#CC0000',
        fontSize = 11
    } = params;

    return `<text x="${x + offsetX}" y="${y}" class="glissando-y-debug" fill="${color}" font-size="${fontSize}" font-weight="bold">Y=${y.toFixed(1)}</text>`;
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateYPositionLabel,
        generateBoundaryLabel,
        generateStringDebugLabels,
        generateGlissandoStartLabel
    };
}
