/**
 * V4 Metrics Controller - Unified Metric Updates
 *
 * Updates all instances of the same metric across the page at once
 * Uses data attributes to identify metric types
 *
 * Example:
 * <span class="metric-value" data-metric="bent-notes">14</span>
 * <span class="metric-value" data-metric="bent-notes">14</span>
 *
 * metricsController.update('bent-notes', 14) → Both update!
 */

class MetricsController {
    constructor() {
        this.metrics = new Map(); // Store current values
    }

    /**
     * Update all instances of a metric
     * @param {string} metricName - Name of the metric (e.g., 'bent-notes', 'total-notes')
     * @param {any} value - New value to display
     * @param {string} format - Optional format function name
     */
    update(metricName, value, format = null) {
        // Store current value
        this.metrics.set(metricName, value);

        // Find all elements with this metric
        const elements = document.querySelectorAll(`[data-metric="${metricName}"]`);

        // Format value if formatter provided
        let displayValue = value;
        if (format && this.formatters[format]) {
            displayValue = this.formatters[format](value);
        }

        // Update all instances
        elements.forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = displayValue;
            } else {
                element.textContent = displayValue;
            }
        });

        console.log(`Updated ${elements.length} instances of '${metricName}' to ${displayValue}`);
    }

    /**
     * Update multiple metrics at once
     * @param {object} metricsObj - Object with metric names as keys
     */
    updateBatch(metricsObj) {
        Object.entries(metricsObj).forEach(([name, value]) => {
            this.update(name, value);
        });
    }

    /**
     * Get current value of a metric
     * @param {string} metricName - Name of the metric
     */
    get(metricName) {
        return this.metrics.get(metricName);
    }

    /**
     * Built-in formatters
     */
    formatters = {
        // Number with commas
        number: (val) => val.toLocaleString(),

        // Percentage
        percentage: (val) => `${val.toFixed(1)}%`,

        // Note count with plural
        noteCount: (val) => `${val} note${val !== 1 ? 's' : ''}`,

        // Bent notes with singular/plural
        bentNotes: (val) => `${val} bent note${val !== 1 ? 's' : ''}`,

        // Time signature
        timeSignature: (val) => val || 'Unknown',

        // Tuning system
        tuning: (val) => val || 'C-D-E-G-A'
    };

    /**
     * Extract metrics from SVG
     * @param {string} svgId - ID of SVG element
     * @returns {object} Object with calculated metrics
     */
    extractFromSVG(svgId) {
        const svg = document.getElementById(svgId);
        if (!svg) return {};

        const bentElements = svg.querySelectorAll('[data-bent="true"]');
        const circles = svg.querySelectorAll('circle');
        const graceNotes = svg.querySelectorAll('.grace-note');

        // Each bent note has 4 elements (circle, polygon, line, text)
        const bentNoteCount = bentElements.length / 4;

        return {
            'total-notes': circles.length,
            'bent-notes': bentNoteCount,
            'grace-notes': graceNotes.length,
            'regular-notes': circles.length - graceNotes.length
        };
    }

    /**
     * Auto-update metrics from SVG
     * @param {string} svgId - ID of SVG
     * @param {string} prefix - Optional prefix for metric names (e.g., 'optimal-')
     */
    autoUpdateFromSVG(svgId, prefix = '') {
        const metrics = this.extractFromSVG(svgId);

        Object.entries(metrics).forEach(([name, value]) => {
            this.update(prefix + name, value, this.getFormatter(name));
        });
    }

    /**
     * Get formatter for metric name
     */
    getFormatter(metricName) {
        if (metricName.includes('notes')) return 'noteCount';
        if (metricName.includes('percentage')) return 'percentage';
        if (metricName.includes('tuning')) return 'tuning';
        return null;
    }
}

// Export for use in templates
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetricsController;
}