/**
 * V4 Visual State Controller - Reusable Toggle/Highlight/Select System
 *
 * Handles all visual state changes in the application:
 * - Show/Hide toggles
 * - Highlight/Unhighlight
 * - Select/Unselect
 * - Custom visual transformations
 *
 * Architecture:
 * - Data attribute-based grouping (e.g., data-bent="true")
 * - Configurable style rules per state
 * - Supports multiple element types with different styling
 * - State persistence and tracking
 */

class VisualStateController {
    constructor() {
        this.stateRegistry = new Map(); // Track state for each feature
        this.stylePresets = this.defineStylePresets();
    }

    /**
     * Define style presets for common visual states
     */
    defineStylePresets() {
        return {
            // Bent note toggle preset
            bentNotes: {
                selector: '[data-bent="true"]',
                states: {
                    hidden: {
                        circle: { fill: '#333333', stroke: '#000000' },
                        polygon: { fill: '#666666' },
                        line: { display: 'none' },
                        text: { display: 'none' }
                    },
                    shown: {
                        circle: { fill: '#FF0000', stroke: '#CC0000' },
                        polygon: { fill: '#FF0000' },
                        line: { display: 'block' },
                        text: { display: 'block' }
                    }
                },
                button: {
                    hidden: { background: '#E67E22', color: 'white' },
                    shown: { background: '#FF0000', color: 'white' }
                }
            },

            // Grace note highlight preset
            graceNotes: {
                selector: '[data-grace="true"]',
                states: {
                    normal: {
                        circle: { fill: '#FFD700', stroke: '#CC9900', opacity: '0.8' }
                    },
                    highlighted: {
                        circle: { fill: '#FFD700', stroke: '#CC9900', opacity: '1.0', filter: 'drop-shadow(0 0 10px #FFD700)' }
                    }
                }
            },

            // Pitch-based selection preset
            pitchSelection: {
                selector: (pitch) => `[data-pitch="${pitch}"]`,
                states: {
                    unselected: {
                        circle: { opacity: '0.4', stroke: '#999' }
                    },
                    selected: {
                        circle: { opacity: '1.0', stroke: '#000', strokeWidth: '3' }
                    }
                }
            },

            // String usage highlight preset
            stringUsage: {
                selector: (stringNum) => `[data-string="${stringNum}"]`,
                states: {
                    inactive: {
                        line: { stroke: '#999999', opacity: '0.3' }
                    },
                    active: {
                        line: { stroke: '#000000', opacity: '1.0', strokeWidth: '4' }
                    }
                }
            },

            // Melodic contour highlight preset
            melodicContour: {
                selector: '[data-contour-type]',
                states: {
                    neutral: {
                        circle: { fill: '#333333' },
                        polygon: { opacity: '0.35' }
                    },
                    ascending: {
                        circle: { fill: '#3498DB' },
                        polygon: { fill: '#3498DB', opacity: '0.5' }
                    },
                    descending: {
                        circle: { fill: '#E74C3C' },
                        polygon: { fill: '#E74C3C', opacity: '0.5' }
                    }
                }
            }
        };
    }

    /**
     * Initialize a visual state feature
     * @param {string} featureId - Unique identifier for this feature
     * @param {string} svgId - ID of the SVG element
     * @param {string} presetName - Name of preset from stylePresets
     * @param {string} initialState - Initial state name
     */
    initialize(featureId, svgId, presetName, initialState) {
        const preset = this.stylePresets[presetName];
        if (!preset) {
            console.error(`Preset not found: ${presetName}`);
            return;
        }

        this.stateRegistry.set(featureId, {
            svgId,
            preset,
            currentState: initialState,
            buttonElement: null
        });

        // Apply initial state
        this.applyState(featureId, initialState);
    }

    /**
     * Toggle between two states
     * @param {string} featureId - Feature identifier
     * @param {string} stateA - First state name
     * @param {string} stateB - Second state name
     */
    toggle(featureId, stateA, stateB) {
        const feature = this.stateRegistry.get(featureId);
        if (!feature) {
            console.error(`Feature not registered: ${featureId}`);
            return;
        }

        const newState = feature.currentState === stateA ? stateB : stateA;
        this.applyState(featureId, newState);
    }

    /**
     * Apply a specific state to a feature
     * @param {string} featureId - Feature identifier
     * @param {string} stateName - State name to apply
     */
    applyState(featureId, stateName) {
        const feature = this.stateRegistry.get(featureId);
        if (!feature) {
            console.error(`Feature not registered: ${featureId}`);
            return;
        }

        const svg = document.getElementById(feature.svgId);
        if (!svg) {
            console.error(`SVG not found: ${feature.svgId}`);
            return;
        }

        const preset = feature.preset;
        const stateStyles = preset.states[stateName];

        if (!stateStyles) {
            console.error(`State not found: ${stateName} for feature ${featureId}`);
            return;
        }

        // Get selector (can be string or function)
        const selector = typeof preset.selector === 'function'
            ? preset.selector(feature.selectorParam)
            : preset.selector;

        // Apply styles to all matching elements
        const elements = svg.querySelectorAll(selector);
        let count = 0;

        elements.forEach(element => {
            const tagName = element.tagName.toLowerCase();
            const styles = stateStyles[tagName];

            if (styles) {
                Object.entries(styles).forEach(([property, value]) => {
                    element.style[property] = value;
                });
                count++;
            }
        });

        // Update button if preset has button styles
        if (preset.button && preset.button[stateName] && feature.buttonElement) {
            Object.entries(preset.button[stateName]).forEach(([property, value]) => {
                feature.buttonElement.style[property] = value;
            });
        }

        // Update state
        feature.currentState = stateName;

        console.log(`${featureId}: Applied state '${stateName}' to ${count} elements`);
    }

    /**
     * Register a button for state-based styling
     * @param {string} featureId - Feature identifier
     * @param {HTMLElement} buttonElement - Button element
     */
    registerButton(featureId, buttonElement) {
        const feature = this.stateRegistry.get(featureId);
        if (feature) {
            feature.buttonElement = buttonElement;
        }
    }

    /**
     * Get current state of a feature
     * @param {string} featureId - Feature identifier
     * @returns {string} Current state name
     */
    getState(featureId) {
        const feature = this.stateRegistry.get(featureId);
        return feature ? feature.currentState : null;
    }

    /**
     * Create a custom preset
     * @param {string} presetName - Name for the new preset
     * @param {object} config - Preset configuration
     */
    addCustomPreset(presetName, config) {
        this.stylePresets[presetName] = config;
    }

    /**
     * Apply multiple states at once (for complex highlighting)
     * @param {string} featureId - Feature identifier
     * @param {object} stateMap - Map of element selectors to state names
     */
    applyMultiState(featureId, stateMap) {
        const feature = this.stateRegistry.get(featureId);
        if (!feature) return;

        const svg = document.getElementById(feature.svgId);
        if (!svg) return;

        Object.entries(stateMap).forEach(([selector, stateName]) => {
            const elements = svg.querySelectorAll(selector);
            const styles = feature.preset.states[stateName];

            elements.forEach(element => {
                const tagName = element.tagName.toLowerCase();
                const elementStyles = styles[tagName];

                if (elementStyles) {
                    Object.entries(elementStyles).forEach(([property, value]) => {
                        element.style[property] = value;
                    });
                }
            });
        });
    }
}

// Export for use in templates
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualStateController;
}