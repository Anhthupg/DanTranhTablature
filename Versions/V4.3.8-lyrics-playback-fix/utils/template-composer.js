// Template Composer - Recursive component resolution and placeholder replacement
// V4.2.41: Created for automatic template composition

const TemplateLoader = require('./template-loader');

class TemplateComposer {
    constructor(templateLoader) {
        this.loader = templateLoader;
        this.maxNestingDepth = 10;  // Prevent infinite loops
    }

    /**
     * Render a template with data and auto-resolved components
     * @param {string} templateName - Main template filename
     * @param {Object} data - Data for placeholder replacement
     * @param {Object} options - Rendering options
     * @returns {string} Fully composed HTML
     */
    render(templateName, data = {}, options = {}) {
        const {
            validatePlaceholders = false,
            throwOnMissing = false,
            maxDepth = this.maxNestingDepth
        } = options;

        // Load main template
        let html = this.loader.loadTemplate(templateName);

        // Step 1: Resolve all components recursively
        html = this.resolveComponents(html, 0, maxDepth);

        // Step 2: Replace data placeholders
        html = this.replacePlaceholders(html, data, throwOnMissing);

        // Step 3: Validate if requested
        if (validatePlaceholders) {
            this.validatePlaceholders(html, throwOnMissing);
        }

        return html;
    }

    /**
     * Recursively resolve component placeholders
     * Pattern: {{COMPONENT_NAME}} or {{COMPONENT_NAME_COMPONENT}}
     * Only resolves known component placeholders, not data placeholders
     * @param {string} html - HTML with component placeholders
     * @param {number} depth - Current nesting depth
     * @param {number} maxDepth - Maximum nesting depth
     * @returns {string} HTML with components resolved
     */
    resolveComponents(html, depth = 0, maxDepth = 10) {
        if (depth >= maxDepth) {
            throw new Error(`Maximum component nesting depth (${maxDepth}) exceeded`);
        }

        // Known component placeholders (only these will be resolved as components)
        const knownComponents = [
            'WORD_CLOUD_COMPONENT',
            'RADAR_CHART_COMPONENT',
            'SONG_RADAR_GALLERY_COMPONENT',
            'WORD_JOURNEY_SANKEY_COMPONENT',
            'GLISSANDO_PANEL',
            'VOCABULARY_METRICS_SECTION',
            'ANNOTATED_PHRASES_SECTION',
            'LYRICS_SECTION',
            'TAP_CHEVRON',
            'VIBRATO_SINEWAVE'
        ];

        // Find all placeholders
        const placeholderPattern = /\{\{([A-Z_]+)\}\}/g;
        const matches = [];
        let match;

        while ((match = placeholderPattern.exec(html)) !== null) {
            const name = match[1];
            // Only process if it's a known component
            if (knownComponents.includes(name)) {
                matches.push({
                    placeholder: match[0],
                    name: name,
                    index: match.index
                });
            }
        }

        // No components found, return as-is
        if (matches.length === 0) {
            return html;
        }

        // Load and inject components
        let result = html;
        const loadedComponents = new Map();

        for (const { placeholder, name } of matches) {
            // Skip if already loaded
            if (loadedComponents.has(placeholder)) {
                continue;
            }

            // Convert WORD_CLOUD_COMPONENT → word-cloud-visualization
            const componentFilename = this.placeholderToComponentName(name);

            try {
                // Load component content
                const componentContent = this.loader.loadComponent(componentFilename);
                loadedComponents.set(placeholder, componentContent);

                // Replace all instances of this component
                const regex = new RegExp(this.escapeRegex(placeholder), 'g');
                result = result.replace(regex, componentContent);
            } catch (error) {
                console.warn(`Component not found: ${componentFilename} (placeholder: ${placeholder})`);
                // Keep placeholder if component not found
            }
        }

        // Recursively resolve any components in the newly injected content
        if (loadedComponents.size > 0) {
            result = this.resolveComponents(result, depth + 1, maxDepth);
        }

        return result;
    }

    /**
     * Replace data placeholders with values
     * @param {string} html - HTML with data placeholders
     * @param {Object} data - Data object with values
     * @param {boolean} throwOnMissing - Throw error if placeholder not found in data
     * @returns {string} HTML with placeholders replaced
     */
    replacePlaceholders(html, data, throwOnMissing = false) {
        let result = html;

        // Replace each data placeholder
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            const regex = new RegExp(this.escapeRegex(placeholder), 'g');

            // Convert value to string
            const stringValue = value !== null && value !== undefined ? String(value) : '';

            result = result.replace(regex, stringValue);
        }

        return result;
    }

    /**
     * Validate that no unreplaced placeholders remain
     * @param {string} html - HTML to validate
     * @param {boolean} throwOnMissing - Throw error if placeholders found
     * @returns {Array} Array of unreplaced placeholders
     */
    validatePlaceholders(html, throwOnMissing = false) {
        const placeholderPattern = /\{\{([A-Z_]+)\}\}/g;
        const unreplaced = [];
        let match;

        while ((match = placeholderPattern.exec(html)) !== null) {
            unreplaced.push(match[1]);
        }

        if (unreplaced.length > 0) {
            const message = `Unreplaced placeholders found: ${unreplaced.join(', ')}`;

            if (throwOnMissing) {
                throw new Error(message);
            } else {
                console.warn(message);
            }
        }

        return unreplaced;
    }

    /**
     * Convert placeholder name to component filename
     * WORD_CLOUD_COMPONENT → word-cloud-visualization.html
     * GLISSANDO_PANEL → glissando-panel.html
     * @param {string} placeholderName - Placeholder name (e.g., WORD_CLOUD_COMPONENT)
     * @returns {string} Component filename
     */
    placeholderToComponentName(placeholderName) {
        // Remove _COMPONENT suffix if present
        let name = placeholderName.replace(/_COMPONENT$/, '');

        // Special mappings for components with different naming
        const specialMappings = {
            'WORD_CLOUD': 'word-cloud-visualization',
            'RADAR_CHART': 'thematic-radar-chart',
            'SONG_RADAR_GALLERY': 'song-radar-gallery',
            'GLISSANDO_PANEL': 'glissando-panel',
            'WORD_JOURNEY_SANKEY': 'word-journey-sankey',
            'VOCABULARY_METRICS': 'vocabulary-metrics-section',
            'ANNOTATED_PHRASES': 'annotated-phrases-section',
            'LYRICS_SECTION': 'lyrics-section',
            'TAP_CHEVRON': 'tap-chevron-component',
            'VIBRATO_SINEWAVE': 'vibrato-sinewave'
        };

        if (specialMappings[name]) {
            return specialMappings[name] + '.html';
        }

        // Default: Convert SNAKE_CASE to kebab-case
        return name.toLowerCase().replace(/_/g, '-') + '.html';
    }

    /**
     * Escape special regex characters in string
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Compose a template with manual component injection (legacy support)
     * @param {string} templateName - Template name
     * @param {Object} components - Pre-loaded component map {PLACEHOLDER: content}
     * @param {Object} data - Data for replacement
     * @returns {string} Composed HTML
     */
    composeLegacy(templateName, components = {}, data = {}) {
        let html = this.loader.loadTemplate(templateName);

        // Replace components first
        for (const [placeholder, content] of Object.entries(components)) {
            const regex = new RegExp(this.escapeRegex(`{{${placeholder}}}`), 'g');
            html = html.replace(regex, content);
        }

        // Then replace data
        html = this.replacePlaceholders(html, data);

        return html;
    }
}

module.exports = TemplateComposer;
