/**
 * V4 Zoom Controller - Centralized Zoom Management
 * Prevents common issues: stretching, cropping, scroll failures
 *
 * Architecture:
 * - Single source of truth for zoom state
 * - Element-by-element transformation (V3 approach)
 * - Automatic base position management
 * - Clear initialization sequence
 */

class ZoomController {
    constructor() {
        this.sections = ['optimal', 'alt1', 'alt2', 'alt3'];
        this.zoomState = this.initializeZoomState();
        this.initialized = false;
    }

    /**
     * Initialize zoom state for all sections
     */
    initializeZoomState() {
        const state = {};
        this.sections.forEach(section => {
            state[section] = {
                x: 1.0,  // 100%
                y: 1.0,  // 100%
                basePositionsStored: false,
                svgElement: null,
                container: null
            };
        });
        return state;
    }

    /**
     * Initialize zoom system - call this once on DOM ready
     */
    initialize() {
        if (this.initialized) {
            console.warn('ZoomController already initialized');
            return;
        }

        console.log('🔧 Initializing ZoomController...');

        // Find and validate all SVG elements
        this.sections.forEach(section => {
            const svgId = this.getSvgId(section);
            const svg = document.getElementById(svgId);

            if (!svg) {
                console.warn(`SVG not found for section: ${section} (${svgId})`);
                return;
            }

            const container = svg.closest('.tablature-reference');
            if (!container) {
                console.warn(`Container not found for section: ${section}`);
                return;
            }

            // Store references
            this.zoomState[section].svgElement = svg;
            this.zoomState[section].container = container;

            // Store base dimensions
            if (!svg.hasAttribute('data-base-width')) {
                svg.setAttribute('data-base-width', svg.getAttribute('width'));
                svg.setAttribute('data-base-height', svg.getAttribute('height'));
            }

            // Ensure container has proper scroll setup
            this.setupContainer(container);

            console.log(`✓ Section ${section} initialized`);
        });

        this.initialized = true;
        console.log('✅ ZoomController ready');
    }

    /**
     * Setup container for proper scrolling
     */
    setupContainer(container) {
        container.style.overflowX = 'auto';
        container.style.overflowY = 'auto';
        container.style.maxHeight = '600px';
        container.style.position = 'relative';
        container.style.boxSizing = 'border-box';
    }

    /**
     * Get SVG ID for a section
     */
    getSvgId(section) {
        const idMap = {
            'optimal': 'optimalSvg',
            'alt1': 'alt1Svg',
            'alt2': 'alt2Svg',
            'alt3': 'alt3Svg'
        };
        return idMap[section] || null;
    }

    /**
     * Update zoom for a section and axis
     * @param {string} section - Section name (optimal, alt1, alt2, alt3)
     * @param {string} axis - 'x' or 'y'
     * @param {number} percent - Zoom percentage (1-400)
     */
    updateZoom(section, axis, percent) {
        // Validate section
        if (!this.zoomState[section]) {
            console.error(`Invalid section: ${section}`);
            return;
        }

        // Validate zoom range
        const zoom = Math.max(0.01, Math.min(4.0, percent / 100));

        // Update state
        this.zoomState[section][axis] = zoom;

        // Apply zoom
        this.applyZoom(section);

        // Update UI display
        this.updateZoomDisplay(section, axis, percent);
    }

    /**
     * Apply zoom transformation to a section
     */
    applyZoom(section) {
        const state = this.zoomState[section];

        if (!state.svgElement) {
            console.warn(`Cannot apply zoom - SVG not found for section: ${section}`);
            return;
        }

        const svg = state.svgElement;
        const { x: xZoom, y: yZoom } = state;

        // Get base dimensions
        const baseWidth = parseFloat(svg.getAttribute('data-base-width'));
        const baseHeight = parseFloat(svg.getAttribute('data-base-height'));

        // Calculate new dimensions
        const newWidth = baseWidth * xZoom;
        const newHeight = baseHeight * yZoom;

        // Update SVG dimensions
        svg.setAttribute('width', newWidth);
        svg.setAttribute('height', newHeight);

        // Transform all elements
        this.transformElements(svg, xZoom, yZoom);

        // Reset scroll position
        if (state.container) {
            state.container.scrollLeft = 0;
            state.container.scrollTop = 0;
        }

        console.log(`Zoom applied to ${section}: X=${(xZoom*100).toFixed(0)}%, Y=${(yZoom*100).toFixed(0)}%`);
    }

    /**
     * Store base positions for all transformable elements
     */
    storeBasePositions(svg) {
        // Store circle positions (notes)
        svg.querySelectorAll('circle').forEach(circle => {
            if (!circle.dataset.baseCx) {
                circle.dataset.baseCx = circle.getAttribute('cx');
                circle.dataset.baseCy = circle.getAttribute('cy');
                circle.dataset.baseR = circle.getAttribute('r');
            }
        });

        // Store text positions
        svg.querySelectorAll('text').forEach(text => {
            if (!text.dataset.baseX) {
                text.dataset.baseX = text.getAttribute('x');
                text.dataset.baseY = text.getAttribute('y');
            }
        });

        // Store line positions
        svg.querySelectorAll('line').forEach(line => {
            if (!line.dataset.baseX1) {
                line.dataset.baseX1 = line.getAttribute('x1');
                line.dataset.baseY1 = line.getAttribute('y1');
                line.dataset.baseX2 = line.getAttribute('x2');
                line.dataset.baseY2 = line.getAttribute('y2');
            }
        });

        // Store polygon positions (resonance bands)
        svg.querySelectorAll('polygon').forEach(polygon => {
            if (!polygon.dataset.basePoints) {
                polygon.dataset.basePoints = polygon.getAttribute('points');
            }
        });
    }

    /**
     * Transform all elements (V3 approach - positions change, sizes don't)
     */
    transformElements(svg, xZoom, yZoom) {
        // First ensure base positions are stored
        this.storeBasePositions(svg);

        // Transform circles (notes)
        svg.querySelectorAll('circle').forEach(circle => {
            const baseCx = parseFloat(circle.dataset.baseCx);
            const baseCy = parseFloat(circle.dataset.baseCy);
            const baseR = parseFloat(circle.dataset.baseR);

            // Scale position, keep size
            circle.setAttribute('cx', baseCx * xZoom);
            circle.setAttribute('cy', baseCy * yZoom);
            circle.setAttribute('r', baseR); // Size unchanged
        });

        // Transform text
        svg.querySelectorAll('text').forEach(text => {
            const baseX = parseFloat(text.dataset.baseX);
            const baseY = parseFloat(text.dataset.baseY);

            text.setAttribute('x', baseX * xZoom);
            text.setAttribute('y', baseY * yZoom);
            // Font size unchanged
        });

        // Transform lines
        svg.querySelectorAll('line').forEach(line => {
            const baseX1 = parseFloat(line.dataset.baseX1);
            const baseY1 = parseFloat(line.dataset.baseY1);
            const baseX2 = parseFloat(line.dataset.baseX2);
            const baseY2 = parseFloat(line.dataset.baseY2);

            line.setAttribute('x1', baseX1 * xZoom);
            line.setAttribute('y1', baseY1 * yZoom);
            line.setAttribute('x2', baseX2 * xZoom);
            line.setAttribute('y2', baseY2 * yZoom);
        });

        // Transform polygons
        svg.querySelectorAll('polygon').forEach(polygon => {
            const basePoints = polygon.dataset.basePoints;
            const points = basePoints.split(/[\s,]+/).map(parseFloat);
            const newPoints = [];

            for (let i = 0; i < points.length; i += 2) {
                newPoints.push(points[i] * xZoom, points[i + 1] * yZoom);
            }

            polygon.setAttribute('points', newPoints.join(' '));
        });
    }

    /**
     * Update zoom display value
     */
    updateZoomDisplay(section, axis, percent) {
        const displayId = `${section}${axis.toUpperCase()}Value`;
        const display = document.getElementById(displayId);

        if (display) {
            display.textContent = percent + '%';
        }
    }

    /**
     * Fit section to container width
     */
    fitToWidth(section) {
        const state = this.zoomState[section];

        if (!state.svgElement || !state.container) {
            console.warn(`Cannot fit to width - elements missing for section: ${section}`);
            return;
        }

        const svgWidth = parseFloat(state.svgElement.getAttribute('width'));
        const containerWidth = state.container.clientWidth - 30; // Account for padding

        // Calculate zoom needed
        const zoomNeeded = Math.max(0.01, Math.min(4.0, containerWidth / svgWidth));
        const zoomPercent = Math.round(zoomNeeded * 100);

        // Apply zoom
        this.updateZoom(section, 'x', zoomPercent);

        // Update slider
        const slider = document.getElementById(`${section}XZoom`);
        if (slider) {
            slider.value = zoomPercent;
        }
    }

    /**
     * Reset zoom for a section
     */
    resetZoom(section) {
        this.updateZoom(section, 'x', 100);
        this.updateZoom(section, 'y', 100);
    }

    /**
     * Reset all sections to 100%
     */
    resetAll() {
        this.sections.forEach(section => this.resetZoom(section));
    }
}

// Export for use in templates
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZoomController;
}