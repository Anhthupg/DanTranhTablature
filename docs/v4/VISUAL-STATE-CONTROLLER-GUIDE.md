# Visual State Controller - Usage Guide

## Overview

The `VisualStateController` is a reusable component for managing visual states (show/hide, highlight, select) across the application. It eliminates code duplication and provides consistent behavior for all visual toggling needs.

## Architecture

### Data Attribute Grouping
All elements that share visual behavior are grouped using data attributes:
```html
<!-- Bent notes group -->
<circle data-bent="true" class="bent-note"/>
<polygon data-bent="true" class="resonance-triangle-bent"/>
<line data-bent="true" class="bent-line"/>
<text data-bent="true" class="bent-indicator"/>

<!-- Grace notes group -->
<circle data-grace="true" class="grace-note"/>

<!-- Pitch-based grouping -->
<circle data-pitch="E4"/>
<circle data-pitch="G4"/>
```

### Preset-Based Configuration
Visual states are defined as presets with specific styles per element type:
```javascript
presets = {
    bentNotes: {
        selector: '[data-bent="true"]',
        states: {
            hidden: {
                circle: { fill: '#333', stroke: '#000' },
                polygon: { fill: '#666' }
            },
            shown: {
                circle: { fill: '#F00', stroke: '#C00' },
                polygon: { fill: '#F00' }
            }
        }
    }
}
```

---

## Usage Examples

### 1. Bent Note Toggle (Current Implementation)

#### Setup:
```javascript
// Initialize controller
const visualController = new VisualStateController();

// Register bent note feature for each section
visualController.initialize('bent-optimal', 'optimalSvg', 'bentNotes', 'hidden');
visualController.initialize('bent-alt1', 'alt1Svg', 'bentNotes', 'hidden');
```

#### Usage:
```javascript
// Toggle between hidden and shown
function toggleBentNotes(section) {
    visualController.toggle(`bent-${section}`, 'hidden', 'shown');
}
```

#### HTML:
```html
<button onclick="toggleBentNotes('optimal')">Show/Hide Bent Notes</button>
```

---

### 2. Grace Note Highlighting

#### Setup:
```javascript
// Initialize grace note highlighting
visualController.initialize('grace-optimal', 'optimalSvg', 'graceNotes', 'normal');
```

#### Usage:
```javascript
// Highlight all grace notes
function highlightGraceNotes() {
    visualController.applyState('grace-optimal', 'highlighted');
}

// Return to normal
function unhighlightGraceNotes() {
    visualController.applyState('grace-optimal', 'normal');
}
```

---

### 3. Pitch-Based Selection

#### Custom Preset:
```javascript
visualController.addCustomPreset('pitchHighlight', {
    selector: (pitch) => `[data-pitch="${pitch}"]`,
    states: {
        normal: {
            circle: { opacity: '1.0', strokeWidth: '2' }
        },
        highlighted: {
            circle: {
                opacity: '1.0',
                strokeWidth: '4',
                stroke: '#3498DB',
                filter: 'drop-shadow(0 0 15px #3498DB)'
            }
        },
        dimmed: {
            circle: { opacity: '0.3', strokeWidth: '1' }
        }
    }
});
```

#### Usage:
```javascript
// Highlight all E notes
function highlightPitch(pitch) {
    visualController.initialize(`pitch-${pitch}`, 'optimalSvg', 'pitchHighlight', 'highlighted');
    visualController.applyState(`pitch-${pitch}`, 'highlighted');
}

// Dim all other notes
function dimOtherNotes() {
    const allNotes = document.querySelectorAll('circle:not([data-pitch="E4"])');
    allNotes.forEach(circle => {
        circle.style.opacity = '0.3';
    });
}
```

---

### 4. String Usage Highlighting

#### Preset:
```javascript
// Already defined in stylePresets
presets.stringUsage = {
    selector: (stringNum) => `[data-string="${stringNum}"]`,
    states: {
        inactive: { line: { stroke: '#999', opacity: '0.3' } },
        active: { line: { stroke: '#000', opacity: '1.0', strokeWidth: '4' } }
    }
}
```

#### Usage:
```javascript
// Highlight used strings
function showUsedStrings() {
    const usedStrings = [5, 7, 8, 9, 10, 11, 12]; // From song analysis

    usedStrings.forEach(stringNum => {
        visualController.initialize(`string-${stringNum}`, 'optimalSvg', 'stringUsage', 'active');
    });
}
```

---

### 5. Melodic Contour Visualization

#### Preset:
```javascript
presets.melodicContour = {
    selector: '[data-contour-type]',
    states: {
        neutral: {
            circle: { fill: '#333' },
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
```

#### Data Attributes (added during generation):
```html
<circle data-contour-type="ascending" data-pitch="E4"/>
<circle data-contour-type="descending" data-pitch="C4"/>
```

#### Usage:
```javascript
// Color code notes by melodic direction
function visualizeMelodicContour() {
    visualController.initialize('contour-optimal', 'optimalSvg', 'melodicContour', 'neutral');

    // Analyze contour and apply states
    const ascendingNotes = document.querySelectorAll('[data-contour-type="ascending"]');
    ascendingNotes.forEach(note => {
        visualController.applyState('contour-optimal', 'ascending');
    });
}
```

---

## Advanced Usage

### Multi-State Highlighting
```javascript
// Highlight multiple groups at once
visualController.applyMultiState('complex-analysis', {
    '[data-pitch="E4"]': 'highlighted',
    '[data-pitch="G4"]': 'highlighted',
    '[data-grace="true"]': 'dimmed'
});
```

### State Chaining
```javascript
// Apply sequence of states
function animateNoteFlow(noteIds) {
    noteIds.forEach((id, index) => {
        setTimeout(() => {
            visualController.applyState(`note-${id}`, 'active');
        }, index * 200); // 200ms delay between each
    });
}
```

### Custom Transformations
```javascript
// Add app-specific preset
visualController.addCustomPreset('linguisticToneHighlight', {
    selector: '[data-tone]',
    states: {
        normal: {
            circle: { fill: '#333' }
        },
        'tone-nga': {
            circle: { fill: '#9B59B6', filter: 'drop-shadow(0 0 10px #9B59B6)' }
        },
        'tone-sac': {
            circle: { fill: '#27AE60', filter: 'drop-shadow(0 0 10px #27AE60)' }
        }
    }
});
```

---

## Benefits Over Inline Functions

### Before (Duplicate Code):
```javascript
// Bent note toggle - 40 lines
function toggleBentNotes(section) {
    const svg = document.getElementById(svgId);
    const bentNotes = svg.querySelectorAll('.bent-note');
    bentNotes.forEach(circle => {
        circle.style.fill = visible ? '#FF0000' : '#333333';
    });
    // ...repeat for triangles, lines, text
}

// Grace note highlight - 40 lines
function highlightGraceNotes(section) {
    const svg = document.getElementById(svgId);
    const graceNotes = svg.querySelectorAll('.grace-note');
    graceNotes.forEach(circle => {
        circle.style.opacity = highlighted ? '1.0' : '0.8';
    });
    // ...
}

// Pitch selection - 40 lines
function selectPitch(pitch) {
    const svg = document.getElementById(svgId);
    const pitchNotes = svg.querySelectorAll(`[data-pitch="${pitch}"]`);
    pitchNotes.forEach(circle => {
        circle.style.stroke = '#3498DB';
    });
    // ...
}

// Total: 120+ lines of repetitive code
```

### After (Unified Controller):
```javascript
// All features use the same controller - 3 lines each!

// Bent notes
visualController.toggle('bent-optimal', 'hidden', 'shown');

// Grace notes
visualController.toggle('grace-optimal', 'normal', 'highlighted');

// Pitch selection
visualController.applyState('pitch-E4', 'selected');

// Total: 9 lines for all features!
```

---

## Integration Plan

### Step 1: Add Controller to Template
```html
<script src="/visual-state-controller.js"></script>
```

### Step 2: Initialize on Page Load
```javascript
document.addEventListener('DOMContentLoaded', function() {
    window.visualController = new VisualStateController();

    // Initialize all features
    ['optimal', 'alt1', 'alt2', 'alt3'].forEach(section => {
        visualController.initialize(`bent-${section}`, `${section}Svg`, 'bentNotes', 'hidden');
    });
});
```

### Step 3: Replace Inline Functions
```javascript
// Before
function toggleBentNotes(section) { /* 40 lines */ }

// After
function toggleBentNotes(section) {
    window.visualController.toggle(`bent-${section}`, 'hidden', 'shown');
}
```

---

## Future Features You Can Add

### 1. Phrase Position Highlighting
```javascript
visualController.addCustomPreset('phrasePosition', {
    selector: '[data-phrase-position]',
    states: {
        normal: { circle: { opacity: '1.0' } },
        beginning: { circle: { fill: '#27AE60', stroke: '#1E8449' } },
        middle: { circle: { fill: '#3498DB', stroke: '#2874A6' } },
        ending: { circle: { fill: '#E74C3C', stroke: '#C0392B' } }
    }
});
```

### 2. Linguistic Tone Correlation
```javascript
visualController.addCustomPreset('linguisticTone', {
    selector: '[data-linguistic-tone]',
    states: {
        normal: {},
        'ngang-highlighted': { circle: { fill: '#9B59B6' } },
        'sac-highlighted': { circle: { fill: '#27AE60' } },
        'huyen-highlighted': { circle: { fill: '#E67E22' } }
    }
});
```

### 3. Pattern Membership Highlighting
```javascript
visualController.addCustomPreset('patternMembership', {
    selector: '[data-pattern-id]',
    states: {
        normal: {},
        'pattern-1': { circle: { stroke: '#3498DB', strokeWidth: '4' } },
        'pattern-2': { circle: { stroke: '#27AE60', strokeWidth: '4' } }
    }
});
```

### 4. Cross-Song Comparison
```javascript
visualController.addCustomPreset('crossSongComparison', {
    selector: '[data-comparison-status]',
    states: {
        unique: { circle: { fill: '#E74C3C' } },
        common: { circle: { fill: '#3498DB' } },
        universal: { circle: { fill: '#27AE60' } }
    }
});
```

---

## Summary

**Created:** `visual-state-controller.js` - 240 lines of reusable code

**Replaces:** Potentially 1000+ lines of duplicate toggle/highlight/select functions

**Benefits:**
- ✅ No code duplication
- ✅ Consistent behavior across features
- ✅ Easy to add new visual states
- ✅ Configurable presets
- ✅ State tracking built-in
- ✅ Button styling support
- ✅ Debug logging included

**Next Step:** Integrate into template to replace inline toggleBentNotes function (optional - current implementation works, this is for future scalability)

---

**The VisualStateController future-proofs the app for hundreds of visual analysis features you'll need!**