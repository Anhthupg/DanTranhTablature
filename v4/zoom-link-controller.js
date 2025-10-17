/**
 * ZoomLinkController - Synchronizes zoom sliders across different sections
 *
 * Allows users to link zoom controls between sections (Phrases, Lyrics-Based Analyses)
 * and the main tablature sections (Optimal, Alternative Tuning)
 *
 * Features:
 * - Bidirectional linking (when linked section zooms, target section zooms too)
 * - Multiple link support (can link to both Optimal and Alt1 simultaneously)
 * - Independent X and Y zoom synchronization
 *
 * @class ZoomLinkController
 */
class ZoomLinkController {
    constructor() {
        // Store active links: { sourceSection: { targetSection: true/false } }
        this.links = {
            phrases: {
                optimal: false,
                alt1: false
            },
            annotatedII: {
                optimal: false,
                alt1: false
            }
        };

        // Store original zoom update function from zoomController
        this.originalUpdateZoom = null;

        console.log('[ZoomLinkController] Initialized');
    }

    /**
     * Initialize the controller - hook into existing zoomController
     */
    initialize() {
        if (!window.zoomController) {
            console.error('[ZoomLinkController] zoomController not found - waiting...');
            // Retry after a short delay
            setTimeout(() => this.initialize(), 100);
            return;
        }

        // Store original updateZoom method
        this.originalUpdateZoom = window.zoomController.updateZoom.bind(window.zoomController);

        // Replace with our wrapped version
        window.zoomController.updateZoom = (section, axis, value) => {
            // Call original
            this.originalUpdateZoom(section, axis, value);

            // Propagate to linked sections
            this.propagateZoom(section, axis, value);
        };

        console.log('[ZoomLinkController] Hooked into zoomController');
    }

    /**
     * Toggle a link between two sections
     * @param {string} sourceSection - The section with the checkbox (e.g., 'phrases', 'annotatedII')
     * @param {string} targetSection - The section to link to (e.g., 'optimal', 'alt1')
     * @param {boolean} enabled - Whether to enable or disable the link
     */
    toggleLink(sourceSection, targetSection, enabled) {
        if (!this.links[sourceSection]) {
            console.error(`[ZoomLinkController] Unknown source section: ${sourceSection}`);
            return;
        }

        this.links[sourceSection][targetSection] = enabled;

        console.log(`[ZoomLinkController] ${enabled ? 'Enabled' : 'Disabled'} link: ${sourceSection} → ${targetSection}`);

        // If enabling link, sync current zoom values immediately
        if (enabled) {
            this.syncToTarget(sourceSection, targetSection);
        }
    }

    /**
     * Sync current zoom values from source to target section
     * @param {string} sourceSection - Section to copy zoom values from
     * @param {string} targetSection - Section to apply zoom values to
     */
    syncToTarget(sourceSection, targetSection) {
        // Get current zoom values from source section
        const xSlider = document.getElementById(`${sourceSection}XZoom`);
        const ySlider = document.getElementById(`${sourceSection}YZoom`);

        if (!xSlider || !ySlider) {
            console.warn(`[ZoomLinkController] Sliders not found for ${sourceSection}`);
            return;
        }

        const xValue = parseFloat(xSlider.value);
        const yValue = parseFloat(ySlider.value);

        console.log(`[ZoomLinkController] Syncing ${sourceSection} (${xValue}%, ${yValue}%) → ${targetSection}`);

        // Apply to target section
        if (this.originalUpdateZoom) {
            this.originalUpdateZoom(targetSection, 'x', xValue);
            this.originalUpdateZoom(targetSection, 'y', yValue);

            // Update target sliders if they exist
            const targetXSlider = document.getElementById(`${targetSection}XZoom`);
            const targetYSlider = document.getElementById(`${targetSection}YZoom`);
            if (targetXSlider) targetXSlider.value = xValue;
            if (targetYSlider) targetYSlider.value = yValue;
        }
    }

    /**
     * Propagate zoom changes to all linked sections
     * @param {string} sourceSection - Section that was zoomed
     * @param {string} axis - 'x' or 'y'
     * @param {number} value - Zoom percentage (1-400)
     */
    propagateZoom(sourceSection, axis, value) {
        // Check if this section has any active links
        const sectionLinks = this.links[sourceSection];
        if (!sectionLinks) return;

        // Propagate to each linked target
        for (const [targetSection, isLinked] of Object.entries(sectionLinks)) {
            if (isLinked) {
                console.log(`[ZoomLinkController] Propagating ${sourceSection}.${axis} = ${value}% → ${targetSection}`);

                // Apply zoom to target
                if (this.originalUpdateZoom) {
                    this.originalUpdateZoom(targetSection, axis, value);

                    // Update target slider to match
                    const targetSlider = document.getElementById(`${targetSection}${axis.toUpperCase()}Zoom`);
                    if (targetSlider) {
                        targetSlider.value = value;
                    }
                }
            }
        }
    }

    /**
     * Get current link status for a section
     * @param {string} sourceSection - Section to check
     * @returns {object} Object with link statuses
     */
    getLinkStatus(sourceSection) {
        return this.links[sourceSection] || {};
    }

    /**
     * Disable all links for a section
     * @param {string} sourceSection - Section to disable links for
     */
    disableAllLinks(sourceSection) {
        if (!this.links[sourceSection]) return;

        for (const targetSection in this.links[sourceSection]) {
            this.links[sourceSection][targetSection] = false;

            // Uncheck checkbox if exists
            const checkbox = document.getElementById(`${sourceSection}Link${targetSection.charAt(0).toUpperCase() + targetSection.slice(1)}`);
            if (checkbox) {
                checkbox.checked = false;
            }
        }

        console.log(`[ZoomLinkController] Disabled all links for ${sourceSection}`);
    }
}

// Auto-instantiate and initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.zoomLinkController = new ZoomLinkController();

    // Initialize after DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.zoomLinkController.initialize();
        });
    } else {
        // DOM already loaded
        window.zoomLinkController.initialize();
    }
}
