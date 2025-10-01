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
        this.sections = ['optimal', 'alt1', 'alt2', 'alt3', 'annotated'];
        this.zoomState = this.initializeZoomState();
        this.initialized = false;
        this.zoomLinked = true;  // Default: zoom is linked between sections
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

            // Different container class for annotated section
            const containerSelector = section === 'annotated' ? '.tablature-scroll-container' : '.tablature-reference';
            const container = svg.closest(containerSelector);
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

        // Setup scroll sync between optimal and annotated sections
        this.setupScrollSync();

        this.initialized = true;
        console.log('✅ ZoomController ready');
    }

    /**
     * Setup bidirectional scroll synchronization between optimal and annotated sections
     */
    setupScrollSync() {
        // Use direct ID selectors for reliability
        const optimalContainer = document.getElementById('optimalScrollContainer');
        const annotatedContainer = document.getElementById('annotatedScrollContainer');

        if (!optimalContainer || !annotatedContainer) {
            console.log('Scroll sync skipped - containers not found:', {
                optimal: !!optimalContainer,
                annotated: !!annotatedContainer
            });
            return;
        }

        // Optimal → Annotated sync
        optimalContainer.addEventListener('scroll', () => {
            if (optimalContainer.dataset.scrolling) return;
            annotatedContainer.dataset.scrolling = 'true';
            annotatedContainer.scrollLeft = optimalContainer.scrollLeft;
            setTimeout(() => delete annotatedContainer.dataset.scrolling, 10);
        });

        // Annotated → Optimal sync
        annotatedContainer.addEventListener('scroll', () => {
            if (annotatedContainer.dataset.scrolling) return;
            optimalContainer.dataset.scrolling = 'true';
            optimalContainer.scrollLeft = annotatedContainer.scrollLeft;
            setTimeout(() => delete optimalContainer.dataset.scrolling, 10);
        });

        console.log('✅ Scroll sync enabled: optimalScrollContainer ↔ annotatedScrollContainer');
    }

    /**
     * Refresh element references after DOM update (e.g., loading new song)
     * V4.1.4: Added to handle dynamic content loading
     */
    refresh() {
        console.log('🔄 Refreshing ZoomController element references...');

        this.sections.forEach(section => {
            const svgId = this.getSvgId(section);
            const svg = document.getElementById(svgId);

            if (!svg) {
                console.warn(`SVG not found for section: ${section} (${svgId})`);
                return;
            }

            // Update SVG element reference
            this.zoomState[section].svgElement = svg;

            // Update base dimensions for new SVG
            svg.setAttribute('data-base-width', svg.getAttribute('width'));
            svg.setAttribute('data-base-height', svg.getAttribute('height'));

            // Force update base positions for new song content
            this.storeBasePositions(svg, true);

            console.log(`✓ Section ${section} refreshed`);
        });

        console.log('✅ ZoomController element references updated');
    }

    /**
     * Store base positions for all transformable elements
     * V4.1.4: Extracted helper for refresh functionality
     * @param {boolean} forceUpdate - If true, update even if base positions already exist
     */
    storeBasePositions(svg, forceUpdate = false) {
        const elements = svg.querySelectorAll('circle, polygon, line, text, rect');

        elements.forEach(el => {
            const tagName = el.tagName.toLowerCase();

            // Store base positions based on element type
            // V4.1.4: Force update during refresh to handle new song content
            if (tagName === 'circle') {
                if (forceUpdate || !el.dataset.baseCx) el.dataset.baseCx = el.getAttribute('cx');
                if (forceUpdate || !el.dataset.baseCy) el.dataset.baseCy = el.getAttribute('cy');
            } else if (tagName === 'line') {
                if (forceUpdate || !el.dataset.baseX1) el.dataset.baseX1 = el.getAttribute('x1');
                if (forceUpdate || !el.dataset.baseY1) el.dataset.baseY1 = el.getAttribute('y1');
                if (forceUpdate || !el.dataset.baseX2) el.dataset.baseX2 = el.getAttribute('x2');
                if (forceUpdate || !el.dataset.baseY2) el.dataset.baseY2 = el.getAttribute('y2');
            } else if (tagName === 'polygon') {
                if (forceUpdate || !el.dataset.basePoints) el.dataset.basePoints = el.getAttribute('points');
            } else if (tagName === 'text' || tagName === 'rect') {
                if (forceUpdate || !el.dataset.baseX) el.dataset.baseX = el.getAttribute('x');
                if (forceUpdate || !el.dataset.baseY) el.dataset.baseY = el.getAttribute('y');
            }
        });
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
            'alt3': 'alt3Svg',
            'annotated': 'annotatedSvg'
        };
        return idMap[section] || null;
    }

    /**
     * Update zoom for a section and axis
     * @param {string} section - Section name (optimal, alt1, alt2, alt3)
     * @param {string} axis - 'x' or 'y'
     * @param {number} percent - Zoom percentage (1-400)
     * @param {boolean} skipSync - Skip syncing to other sections (internal use)
     */
    updateZoom(section, axis, percent, skipSync = false) {
        // Validate section
        if (!this.zoomState[section]) {
            console.error(`Invalid section: ${section}`);
            return;
        }

        // Validate zoom range
        const zoom = Math.max(0.01, Math.min(4.0, percent / 100));

        // Update state
        this.zoomState[section][axis] = zoom;

        // Update UI display
        this.updateZoomDisplay(section, axis, percent);

        // Apply zoom to current section
        this.applyZoom(section);

        // If zoom is linked and not skipping sync, update other sections
        if (this.zoomLinked && !skipSync) {
            this.sections.forEach(otherSection => {
                if (otherSection !== section) {
                    // Update state directly
                    this.zoomState[otherSection][axis] = zoom;
                    this.updateZoomDisplay(otherSection, axis, percent);

                    // Update slider value
                    const slider = document.getElementById(`${otherSection}${axis.toUpperCase()}Zoom`);
                    if (slider) {
                        slider.value = percent;
                    }

                    // Apply zoom
                    this.applyZoom(otherSection);
                }
            });
        }
    }

    /**
     * Toggle zoom linking between sections
     * @param {boolean} linked - Whether sections should be linked
     */
    setZoomLinked(linked) {
        this.zoomLinked = linked;

        // If enabling link, sync all sections to optimal zoom
        if (linked) {
            const optimalX = this.zoomState.optimal.x * 100;
            const optimalY = this.zoomState.optimal.y * 100;

            this.sections.forEach(section => {
                if (section !== 'optimal') {
                    this.updateZoom(section, 'x', optimalX);
                    this.updateZoom(section, 'y', optimalY);
                }
            });
        }

        console.log(`Zoom linking ${linked ? 'enabled' : 'disabled'}`);
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

        // Get base dimensions with fallback to current dimensions if not set
        let baseWidth = parseFloat(svg.getAttribute('data-base-width'));
        let baseHeight = parseFloat(svg.getAttribute('data-base-height'));

        // If base dimensions not set or invalid, use current dimensions
        if (!baseWidth || isNaN(baseWidth)) {
            const currentWidth = parseFloat(svg.getAttribute('width'));
            if (!currentWidth || isNaN(currentWidth) || currentWidth < 200) {
                console.error(`Invalid SVG width for ${section}: ${currentWidth}. Cannot apply zoom.`);
                return; // Abort zoom to prevent shrinking
            }
            baseWidth = currentWidth;
            svg.setAttribute('data-base-width', baseWidth);
            console.warn(`Base width not set for ${section}, using current: ${baseWidth}`);
        }
        if (!baseHeight || isNaN(baseHeight)) {
            const currentHeight = parseFloat(svg.getAttribute('height'));
            if (!currentHeight || isNaN(currentHeight) || currentHeight < 100) {
                console.error(`Invalid SVG height for ${section}: ${currentHeight}. Cannot apply zoom.`);
                return; // Abort zoom to prevent shrinking
            }
            baseHeight = currentHeight;
            svg.setAttribute('data-base-height', baseHeight);
            console.warn(`Base height not set for ${section}, using current: ${baseHeight}`);
        }

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

        // Store text positions and associate with parent circles
        svg.querySelectorAll('text.note-text').forEach(text => {
            if (!text.dataset.baseX) {
                const textX = parseFloat(text.getAttribute('x'));
                const textY = parseFloat(text.getAttribute('y'));

                text.dataset.baseX = textX;
                text.dataset.baseY = textY;

                // Find associated circle (same x, y within 10px)
                const associatedCircle = Array.from(svg.querySelectorAll('circle')).find(circle => {
                    const cx = parseFloat(circle.getAttribute('cx'));
                    const cy = parseFloat(circle.getAttribute('cy'));
                    return Math.abs(cx - textX) < 1 && Math.abs(cy - textY) < 10;
                });

                if (associatedCircle) {
                    const baseCy = parseFloat(associatedCircle.getAttribute('cy'));
                    text.dataset.offsetY = textY - baseCy;  // Store fixed offset (usually +6)
                    text.dataset.associatedCircle = associatedCircle.dataset.baseCx + ',' + associatedCircle.dataset.baseCy;
                }
            }
        });

        // Store other text positions (lyrics, etc)
        svg.querySelectorAll('text:not(.note-text)').forEach(text => {
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
                // V4.0.9: Store note radius for fixed offset
                const noteRadius = polygon.getAttribute('data-note-radius');
                if (noteRadius) {
                    polygon.dataset.noteRadius = noteRadius;
                }
            }
        });

        // Store rect positions (phrase boxes in annotated section)
        svg.querySelectorAll('rect').forEach(rect => {
            if (!rect.dataset.baseX && rect.getAttribute('data-base-x')) {
                // Already has base position from generator
                return;
            }
            if (!rect.dataset.baseX) {
                rect.dataset.baseX = rect.getAttribute('x');
                rect.dataset.baseY = rect.getAttribute('y');
                rect.dataset.baseWidth = rect.getAttribute('width');
                rect.dataset.baseHeight = rect.getAttribute('height');
            }
        });

        // Store g transform positions (semantic icon groups)
        svg.querySelectorAll('g[data-base-x]').forEach(group => {
            // These are pre-marked by generator, just ensure transform is stored
            if (!group.dataset.baseTransform && group.getAttribute('transform')) {
                group.dataset.baseTransform = group.getAttribute('transform');
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

        // Transform note text (stays centered on circles)
        svg.querySelectorAll('text.note-text').forEach(text => {
            const baseX = parseFloat(text.dataset.baseX);
            const baseCy = parseFloat(text.dataset.baseY);  // baseCy is same as circle cy

            // Position at scaled circle center (no offset scaling)
            text.setAttribute('x', baseX * xZoom);
            text.setAttribute('y', baseCy * yZoom);  // Centered with dominant-baseline: middle
            // Font size unchanged
        });

        // Transform other text (lyrics, labels, etc)
        svg.querySelectorAll('text:not(.note-text)').forEach(text => {
            const baseX = parseFloat(text.dataset.baseX);
            const baseY = parseFloat(text.dataset.baseY);

            // Skip if base positions invalid (prevents NaN errors)
            if (isNaN(baseX) || isNaN(baseY)) return;

            text.setAttribute('x', baseX * xZoom);
            text.setAttribute('y', baseY * yZoom);
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

        // Transform polygons with fixed radius offset (V4.0.9 - Scaled Offset Fix)
        svg.querySelectorAll('polygon').forEach(polygon => {
            const basePoints = polygon.dataset.basePoints;
            const noteRadius = parseFloat(polygon.dataset.noteRadius || polygon.getAttribute('data-note-radius') || '12');

            const points = basePoints.split(/[\s,]+/).map(parseFloat);
            const newPoints = [];

            // Triangle has 3 points: (startX, topY), (startX, bottomY), (endX, centerY)
            // First two X coords need radius offset added
            for (let i = 0; i < points.length; i += 2) {
                const baseX = points[i];
                const baseY = points[i + 1];

                // Add fixed radius offset to first two points (startX positions)
                const scaledX = baseX * xZoom;
                const newX = (i === 0 || i === 2) ? scaledX + noteRadius : scaledX;

                newPoints.push(newX, baseY * yZoom);
            }

            polygon.setAttribute('points', newPoints.join(' '));
        });

        // Transform rects (phrase boxes and section boxes in annotated section)
        svg.querySelectorAll('rect').forEach(rect => {
            // V4.2.14: Prioritize getAttribute (server-generated) over dataset (client-set)
            const baseX = parseFloat(rect.getAttribute('data-base-x') || rect.dataset.baseX);
            const baseY = parseFloat(rect.getAttribute('data-base-y') || rect.dataset.baseY);
            const baseWidth = parseFloat(rect.getAttribute('data-base-width') || rect.dataset.baseWidth);
            const baseHeight = parseFloat(rect.getAttribute('data-base-height') || rect.dataset.baseHeight);

            if (!isNaN(baseX) && !isNaN(baseWidth)) {
                // X-axis scaling with pivot at 120 (string label boundary)
                const scaledX = 120 + (baseX - 120) * xZoom;
                const scaledWidth = baseWidth * xZoom;

                rect.setAttribute('x', scaledX);
                rect.setAttribute('width', scaledWidth);
            }

            if (!isNaN(baseY) && !isNaN(baseHeight)) {
                rect.setAttribute('y', baseY * yZoom);
                rect.setAttribute('height', baseHeight * yZoom);
            }
        });

        // Transform g elements with translate (semantic icon groups)
        svg.querySelectorAll('g[data-base-x]').forEach(group => {
            // V4.2.14: Prioritize getAttribute (server-generated)
            const baseX = parseFloat(group.getAttribute('data-base-x') || group.dataset.baseX);
            const transform = group.getAttribute('transform');

            if (!isNaN(baseX) && transform) {
                // Extract Y from transform: "translate(x, y)"
                const yMatch = transform.match(/translate\([^,]+,\s*(\d+)\)/);
                const y = yMatch ? yMatch[1] : 120;

                // Scale X position with pivot
                const scaledX = 120 + (baseX - 120) * xZoom;

                group.setAttribute('transform', `translate(${scaledX}, ${y})`);
            }
        });

        // V4.2.14: Transform text elements with data-base-x (section labels, phrase labels)
        svg.querySelectorAll('text[data-base-x]').forEach(text => {
            // Prioritize getAttribute (server-generated)
            const baseX = parseFloat(text.getAttribute('data-base-x') || text.dataset.baseX);
            const baseY = parseFloat(text.getAttribute('data-base-y') || text.dataset.baseY);

            if (!isNaN(baseX)) {
                // Scale X position with pivot at 120
                const scaledX = 120 + (baseX - 120) * xZoom;
                text.setAttribute('x', scaledX);
            }

            if (!isNaN(baseY)) {
                // Y-axis scaling from top (no pivot)
                const scaledY = baseY * yZoom;
                text.setAttribute('y', scaledY);
            }
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