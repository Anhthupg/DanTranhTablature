/**
 * V4.3.34 Fingering Visibility Controller
 * 2-stage button: Show → Hide
 */

class FingeringController {
    constructor() {
        this.visible = true; // true=show, false=hide
    }

    initialize(optimalSvgId, alt1SvgId, buttonId) {
        this.optimalSvg = document.getElementById(optimalSvgId);
        this.alt1Svg = document.getElementById(alt1SvgId);
        this.button = document.getElementById(buttonId);

        if (!this.button) {
            console.warn('[Fingering] Button not found:', buttonId);
            return;
        }

        // Set initial state
        this.updateDisplay();
        this.updateButtonText();
    }

    toggle() {
        // Toggle between show/hide
        this.visible = !this.visible;
        this.updateDisplay();
        this.updateButtonText();
    }

    updateDisplay() {
        [this.optimalSvg, this.alt1Svg].forEach(svg => {
            if (!svg) return;

            const allFingerings = svg.querySelectorAll('.fingering-label');
            const opacity = this.visible ? '1' : '0';

            allFingerings.forEach(label => {
                label.style.opacity = opacity;
            });
        });
    }

    updateButtonText() {
        if (!this.button) return;

        if (this.visible) {
            this.button.textContent = 'Hide Fingering';
            this.button.style.background = '#4CAF50'; // Green
        } else {
            this.button.textContent = 'Show Fingering';
            this.button.style.background = '#757575'; // Grey
        }
    }
}

// Auto-instantiate
if (typeof window !== 'undefined') {
    window.fingeringController = new FingeringController();
}
