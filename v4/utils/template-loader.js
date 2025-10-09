// Template Loader - Centralized template file loading with caching
// V4.2.41: Created for efficient template management

const fs = require('fs');
const path = require('path');

class TemplateLoader {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.templatesDir = path.join(baseDir, 'templates');
        this.cache = new Map();
        this.cacheEnabled = true;
    }

    /**
     * Load a template file with caching
     * @param {string} relativePath - Path relative to templates directory
     * @returns {string} Template content
     */
    load(relativePath) {
        const fullPath = path.join(this.templatesDir, relativePath);

        // Check cache first
        if (this.cacheEnabled && this.cache.has(fullPath)) {
            return this.cache.get(fullPath);
        }

        // Load from file system
        try {
            const content = fs.readFileSync(fullPath, 'utf8');

            // Store in cache
            if (this.cacheEnabled) {
                this.cache.set(fullPath, content);
            }

            return content;
        } catch (error) {
            throw new Error(`Failed to load template: ${relativePath}\n${error.message}`);
        }
    }

    /**
     * Load a component from templates/components/
     * @param {string} componentName - Component filename (with or without .html)
     * @returns {string} Component content
     */
    loadComponent(componentName) {
        // Add .html extension if not present
        const filename = componentName.endsWith('.html') ? componentName : `${componentName}.html`;
        return this.load(path.join('components', filename));
    }

    /**
     * Load main template from templates/
     * @param {string} templateName - Template filename (with or without .html)
     * @returns {string} Template content
     */
    loadTemplate(templateName) {
        // Add .html extension if not present
        const filename = templateName.endsWith('.html') ? templateName : `${templateName}.html`;
        return this.load(filename);
    }

    /**
     * Load a section from templates/sections/
     * @param {string} sectionName - Section filename (with or without .html)
     * @returns {string} Section content
     */
    loadSection(sectionName) {
        // Add .html extension if not present
        const filename = sectionName.endsWith('.html') ? sectionName : `${sectionName}.html`;
        return this.load(path.join('sections', filename));
    }

    /**
     * Preload multiple templates at once
     * @param {Array<string>} templatePaths - Array of template paths to preload
     */
    preload(templatePaths) {
        templatePaths.forEach(templatePath => {
            try {
                this.load(templatePath);
            } catch (error) {
                console.warn(`Failed to preload template: ${templatePath}`);
            }
        });
    }

    /**
     * Clear the template cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Disable caching (useful for development)
     */
    disableCache() {
        this.cacheEnabled = false;
        this.clearCache();
    }

    /**
     * Enable caching
     */
    enableCache() {
        this.cacheEnabled = true;
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            enabled: this.cacheEnabled,
            templates: Array.from(this.cache.keys()).map(k => path.relative(this.templatesDir, k))
        };
    }
}

module.exports = TemplateLoader;
