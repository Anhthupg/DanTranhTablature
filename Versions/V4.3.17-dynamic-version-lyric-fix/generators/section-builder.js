// Section Builder - Template-based section assembly
// Builds sections from reusable wrapper template + content

const fs = require('fs');
const path = require('path');

class SectionBuilder {
    constructor() {
        // Load section wrapper template once
        const templatePath = path.join(__dirname, '..', 'templates', 'sections', 'section-wrapper.html');
        this.wrapperTemplate = fs.readFileSync(templatePath, 'utf8');
    }

    /**
     * Build a complete section from wrapper + content
     * @param {Object} config - Section configuration
     * @param {string} config.id - Section ID (e.g., 'optimalTuningSection')
     * @param {number} config.order - Section order number
     * @param {string} config.focus - Data-focus attribute
     * @param {string} config.title - Section title
     * @param {boolean} config.showMoveArrows - Whether to show move up/down arrows
     * @param {string} config.content - Section content HTML
     * @returns {string} Complete section HTML
     */
    buildSection(config) {
        const {
            id,
            order = 0,
            focus = '',
            title = 'Section',
            showMoveArrows = true,
            content = ''
        } = config;

        // Generate move arrows HTML if needed
        const moveArrows = showMoveArrows ? `
            <button class="move-up" data-target="${id}" title="Move section up">▲</button>
            <button class="move-down" data-target="${id}" title="Move section down">▼</button>
        ` : '<!-- No move arrows for first section -->';

        // Replace placeholders in wrapper template
        return this.wrapperTemplate
            .replace(/{{SECTION_ID}}/g, id)
            .replace(/{{SECTION_ORDER}}/g, order)
            .replace(/{{SECTION_FOCUS}}/g, focus)
            .replace(/{{SECTION_TITLE}}/g, title)
            .replace(/{{MOVE_ARROWS}}/g, moveArrows)
            .replace(/{{SECTION_CONTENT}}/g, content);
    }

    /**
     * Build multiple sections at once
     * @param {Array<Object>} sectionsConfig - Array of section configurations
     * @returns {string} All sections HTML joined together
     */
    buildMultipleSections(sectionsConfig) {
        return sectionsConfig.map(config => this.buildSection(config)).join('\n\n');
    }
}

module.exports = SectionBuilder;
