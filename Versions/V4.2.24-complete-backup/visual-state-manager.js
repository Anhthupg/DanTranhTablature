/**
 * VisualStateManager - V4.0.13
 *
 * Systematic solution for managing multiple overlapping visual states
 * without conflicts (bent notes, playback, patterns, tones, phrases, etc.)
 *
 * Architecture:
 * - State Stack: Multiple visual states can be active simultaneously
 * - Layer Priority: Higher priority layers override lower ones
 * - Clean Removal: Removing a layer reveals the layer below
 * - No Conflicts: Multiple systems can coexist without knowing about each other
 */

class VisualStateManager {
    constructor() {
        // Track all visual states by element ID
        // Structure: { elementId: { layerName: { fill, stroke, filter, etc. } } }
        this.elementStates = new Map();

        // Layer priority (higher number = higher priority, rendered on top)
        this.layerPriority = {
            'base': 0,              // CSS defaults
            'bent-toggle': 10,      // Bent note show/hide
            'pattern-highlight': 20, // Pattern highlighting
            'phrase-highlight': 30,  // Phrase highlighting
            'tone-highlight': 40,    // Linguistic tone highlighting
            'playback': 50          // Currently playing note (highest priority)
        };

        console.log('VisualStateManager: Initialized');
    }

    /**
     * Apply a visual state to an element
     * @param {String} elementId - Element ID (e.g., "note-5")
     * @param {String} layerName - State layer name (e.g., "playback", "bent-toggle")
     * @param {Object} styles - CSS styles to apply { fill, stroke, filter, etc. }
     */
    applyState(elementId, layerName, styles) {
        // Get or create element state
        if (!this.elementStates.has(elementId)) {
            this.elementStates.set(elementId, {});
        }

        const elementState = this.elementStates.get(elementId);

        // Store this layer's styles
        elementState[layerName] = styles;

        // Apply the highest priority layer
        this.renderElement(elementId);
    }

    /**
     * Remove a visual state from an element
     * @param {String} elementId - Element ID
     * @param {String} layerName - State layer name to remove
     */
    removeState(elementId, layerName) {
        if (!this.elementStates.has(elementId)) return;

        const elementState = this.elementStates.get(elementId);

        // Remove this layer
        delete elementState[layerName];

        // If no layers left, remove element from tracking
        if (Object.keys(elementState).length === 0) {
            this.elementStates.delete(elementId);
        }

        // Re-render element (shows next highest priority layer)
        this.renderElement(elementId);
    }

    /**
     * Remove a state layer from ALL elements
     * @param {String} layerName - State layer name to remove globally
     */
    removeStateGlobally(layerName) {
        const affectedElements = [];

        // Find all elements with this layer
        for (const [elementId, layers] of this.elementStates.entries()) {
            if (layers[layerName]) {
                affectedElements.push(elementId);
            }
        }

        // Remove layer from each element
        affectedElements.forEach(elementId => {
            this.removeState(elementId, layerName);
        });

        console.log(`VisualStateManager: Removed "${layerName}" from ${affectedElements.length} elements`);
    }

    /**
     * Apply a state to multiple elements
     * @param {Array} elementIds - Array of element IDs
     * @param {String} layerName - State layer name
     * @param {Object} styles - CSS styles to apply
     */
    applyStateBatch(elementIds, layerName, styles) {
        elementIds.forEach(elementId => {
            this.applyState(elementId, layerName, styles);
        });
    }

    /**
     * Render element with highest priority layer
     * @param {String} elementId - Element ID
     */
    renderElement(elementId) {
        // Find element in all SVGs
        const elements = this.findElementsById(elementId);

        if (elements.length === 0) {
            return;
        }

        const elementState = this.elementStates.get(elementId);

        if (!elementState || Object.keys(elementState).length === 0) {
            // No layers active - clear all inline styles
            elements.forEach(el => {
                el.style.fill = '';
                el.style.stroke = '';
                el.style.filter = '';
                el.style.opacity = '';
            });
            return;
        }

        // Find highest priority layer
        let highestPriority = -1;
        let highestLayer = null;

        for (const layerName in elementState) {
            const priority = this.layerPriority[layerName] || 0;
            if (priority > highestPriority) {
                highestPriority = priority;
                highestLayer = layerName;
            }
        }

        if (!highestLayer) return;

        // Apply highest priority layer's styles
        const styles = elementState[highestLayer];

        elements.forEach(el => {
            if (styles.fill !== undefined) el.style.fill = styles.fill;
            if (styles.stroke !== undefined) el.style.stroke = styles.stroke;
            if (styles.filter !== undefined) el.style.filter = styles.filter;
            if (styles.opacity !== undefined) el.style.opacity = styles.opacity;
            if (styles.display !== undefined) el.style.display = styles.display;
        });
    }

    /**
     * Find all instances of an element by ID (across multiple SVGs)
     * @param {String} elementId - Element ID
     * @returns {Array} Array of DOM elements
     */
    findElementsById(elementId) {
        const elements = [];

        // Check all SVGs in the page
        const allSvgs = document.querySelectorAll('svg');

        allSvgs.forEach(svg => {
            const el = svg.querySelector(`#${elementId}`);
            if (el) elements.push(el);
        });

        return elements;
    }

    /**
     * Clear all visual states (useful for debugging)
     */
    clearAllStates() {
        const elementIds = Array.from(this.elementStates.keys());

        elementIds.forEach(elementId => {
            this.elementStates.delete(elementId);
            this.renderElement(elementId);
        });

        console.log(`VisualStateManager: Cleared all states (${elementIds.length} elements)`);
    }

    /**
     * Get current state info for debugging
     * @param {String} elementId - Element ID
     * @returns {Object} Current state layers and active layer
     */
    getStateInfo(elementId) {
        if (!this.elementStates.has(elementId)) {
            return { layers: {}, activeLayer: null };
        }

        const elementState = this.elementStates.get(elementId);

        // Find highest priority layer
        let highestPriority = -1;
        let highestLayer = null;

        for (const layerName in elementState) {
            const priority = this.layerPriority[layerName] || 0;
            if (priority > highestPriority) {
                highestPriority = priority;
                highestLayer = layerName;
            }
        }

        return {
            layers: elementState,
            activeLayer: highestLayer,
            activePriority: highestPriority
        };
    }

    /**
     * Register a new layer type with priority
     * @param {String} layerName - Layer name
     * @param {Number} priority - Priority (higher = more important)
     */
    registerLayer(layerName, priority) {
        this.layerPriority[layerName] = priority;
        console.log(`VisualStateManager: Registered layer "${layerName}" with priority ${priority}`);
    }
}

// Export for global use
window.VisualStateManager = VisualStateManager;