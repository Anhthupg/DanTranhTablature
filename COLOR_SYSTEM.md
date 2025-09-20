# Dan Tranh Tablature - Comprehensive Color System Design
## Version 1.0 - Unified Visual Language

### Core Design Principles
1. **Semantic Consistency**: Colors convey meaning across all visualizations
2. **State Clarity**: Clear visual distinction between normal, hover, selected, and highlighted states
3. **Category Hierarchy**: Main categories distinct, subcategories share hue with varied saturation/lightness
4. **Accessibility**: Sufficient contrast, colorblind-friendly palette options

---

## 1. BASE COLOR PALETTE

### Primary Note Types
```css
/* Main Notes */
--main-note-fill: #008080;        /* Teal - stable, foundational */
--main-note-stroke: #005959;      /* Dark teal - defines boundaries */
--main-note-text: #FFFFFF;        /* White - high contrast */

/* Grace Notes */
--grace-note-fill: #FFD700;       /* Gold - ornamental, attention-drawing */
--grace-note-stroke: #CC9900;     /* Dark gold - maintains definition */
--grace-note-text: #4A3C00;       /* Dark brown - readable on gold */

/* Tone Markings */
--tone-fill: #9B59B6;             /* Purple - tonal indicators */
--tone-stroke: #7D3C98;           /* Dark purple - boundaries */
--tone-text: #FFFFFF;             /* White - readable on purple */

/* Melisma */
--melisma-fill: #E74C3C;          /* Red - flowing ornamentations */
--melisma-stroke: #C0392B;        /* Dark red - definition */
--melisma-text: #FFFFFF;          /* White - high contrast */
```

### Pattern Categories
```css
/* KPIC (Pitch) Patterns - Blue Family */
--kpic-primary: #0066CC;          /* Primary blue */
--kpic-secondary: #3498DB;        /* Light blue */
--kpic-tertiary: #5DADE2;         /* Sky blue */
--kpic-quaternary: #85C1E9;       /* Pale blue */

/* KRIC (Rhythm) Patterns - Green Family */
--kric-primary: #27AE60;          /* Primary green */
--kric-secondary: #52BE80;        /* Light green */
--kric-tertiary: #76D7A4;         /* Mint green */
--kric-quaternary: #A9DFBF;       /* Pale green */

/* Combined/Complex Patterns - Purple Family */
--complex-primary: #8E44AD;       /* Primary purple */
--complex-secondary: #AF7AC5;     /* Light purple */
--complex-tertiary: #C39BD3;      /* Lavender */
--complex-quaternary: #D7BDE2;    /* Pale purple */
```

---

## 2. AUDIO PLAYBACK STATES

### Playback Visual Feedback
```css
/* Audio States */
--audio-playing: #FF6B6B;         /* Bright red - active playback */
--audio-playing-stroke: #FF4444;  /* Strong red border */
--audio-just-played: #4ECDC4;     /* Teal-cyan - recent playback */
--audio-upcoming: #95E1D3;        /* Pale green - next to play */

/* Audio Animations */
@keyframes audioPlay {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 107, 107, 0);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(255, 107, 107, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 107, 107, 0);
  }
}
```

## 3. STATE SYSTEM

### Opacity/Transparency Levels
```css
/* Base States */
--opacity-normal: 0.8;            /* Default visibility */
--opacity-dimmed: 0.4;            /* Background/unselected */
--opacity-ghost: 0.2;             /* Very subtle presence */
--opacity-full: 1.0;              /* Selected/active */

/* Interactive States */
--opacity-hover: 0.9;             /* Slight emphasis on hover */
--opacity-selected: 1.0;          /* Full opacity when selected */
--opacity-inactive: 0.3;          /* Clearly inactive but visible */
```

### Glow/Highlight Effects
```css
/* Glow System - Applied via filter or box-shadow */
--glow-soft: 0 0 10px rgba(color, 0.4);       /* Subtle indication */
--glow-medium: 0 0 20px rgba(color, 0.6);     /* Clear highlight */
--glow-strong: 0 0 30px rgba(color, 0.8);     /* Strong emphasis */
--glow-pulse: 0 0 40px rgba(color, 1.0);      /* Active/animated */

/* Stroke Highlights */
--stroke-width-normal: 1px;
--stroke-width-hover: 2px;
--stroke-width-selected: 3px;
--stroke-width-highlight: 4px;
```

---

## 4. PATTERN DIFFERENTIATION

### Multiple Pattern Selection
When multiple patterns are selected simultaneously:

```css
/* First Selected Pattern */
.pattern-1 {
  fill: var(--category-primary);
  opacity: var(--opacity-full);
  filter: drop-shadow(var(--glow-medium));
}

/* Second Selected Pattern */
.pattern-2 {
  fill: var(--category-secondary);
  opacity: var(--opacity-full);
  filter: drop-shadow(var(--glow-medium));
  stroke-dasharray: 5, 3;  /* Dashed outline */
}

/* Third Selected Pattern */
.pattern-3 {
  fill: var(--category-tertiary);
  opacity: var(--opacity-full);
  filter: drop-shadow(var(--glow-medium));
  stroke-dasharray: 10, 5;  /* Different dash pattern */
}

/* Fourth+ Selected Pattern */
.pattern-4plus {
  fill: var(--category-quaternary);
  opacity: var(--opacity-full);
  filter: drop-shadow(var(--glow-soft));
  stroke-dasharray: 3, 3;  /* Dotted outline */
}
```

---

## 5. SANKEY DIAGRAM COLORS

### KPIC-2 Sankey (Pitch Transitions)
```css
/* Main Note Nodes & Bands */
.sankey-pitch-node-main {
  fill: #008080;           /* Same as main notes */
  stroke: #005959;
  opacity: 0.9;
}

.sankey-pitch-band-main {
  fill: url(#mainPitchGradient);  /* Gradient: #008080 → #0066CC */
  opacity: 0.6;
}

/* Grace Note Nodes & Bands */
.sankey-pitch-node-grace {
  fill: #FFD700;           /* Same as grace notes */
  stroke: #CC9900;
  opacity: 0.9;
}

.sankey-pitch-band-grace {
  fill: url(#gracePitchGradient);  /* Gradient: #FFD700 → #FFA500 */
  opacity: 0.6;
}

/* Hover & Selected States */
.sankey-pitch-band:hover {
  opacity: 0.8;
  filter: drop-shadow(0 0 10px currentColor);
}

.sankey-pitch-band.selected {
  opacity: 1.0;
  stroke-width: 2px;
  filter: drop-shadow(0 0 20px currentColor);
}
```

### KRIC-2 Sankey (Rhythm Transitions)
```css
/* Node Colors - Differentiated for rhythm */
.sankey-rhythm-node {
  fill: #27AE60;           /* Green family for rhythm */
  stroke: #1E8449;
  opacity: 0.9;
}

/* Transition Bands */
.sankey-rhythm-band {
  fill: url(#rhythmGradient);  /* Gradient: #27AE60 → #52BE80 */
  opacity: 0.6;
}

.sankey-rhythm-band:hover {
  opacity: 0.8;
  filter: drop-shadow(0 0 10px #27AE60);
}

.sankey-rhythm-band.selected {
  opacity: 1.0;
  stroke: #27AE60;
  stroke-width: 2px;
  filter: drop-shadow(0 0 20px #27AE60);
}
```

---

## 6. IMPLEMENTATION STRATEGY

### CSS Variables Setup
```javascript
// Add to analytical_tablature.html initialization
const colorSystem = {
  mainNote: {
    fill: '#008080',
    stroke: '#005959',
    glow: 'rgba(0, 128, 128, 0.6)'
  },
  graceNote: {
    fill: '#FFD700',
    stroke: '#CC9900',
    glow: 'rgba(255, 215, 0, 0.6)'
  },
  kpic: {
    levels: ['#0066CC', '#3498DB', '#5DADE2', '#85C1E9'],
    glow: 'rgba(0, 102, 204, 0.6)'
  },
  kric: {
    levels: ['#27AE60', '#52BE80', '#76D7A4', '#A9DFBF'],
    glow: 'rgba(39, 174, 96, 0.6)'
  },
  states: {
    normal: 0.8,
    hover: 0.9,
    selected: 1.0,
    dimmed: 0.4,
    inactive: 0.3
  }
};
```

### Dynamic State Management
```javascript
function applyColorState(element, category, state, level = 0) {
  const colors = colorSystem[category];
  const opacity = colorSystem.states[state];

  if (Array.isArray(colors.levels)) {
    element.style.fill = colors.levels[Math.min(level, colors.levels.length - 1)];
  } else {
    element.style.fill = colors.fill;
    element.style.stroke = colors.stroke;
  }

  element.style.opacity = opacity;

  if (state === 'selected' || state === 'hover') {
    element.style.filter = `drop-shadow(0 0 20px ${colors.glow})`;
  } else {
    element.style.filter = 'none';
  }
}
```

### Transition Animations
```css
/* Smooth color transitions */
.note-element,
.sankey-node,
.sankey-band,
.pattern-highlight {
  transition: fill 0.3s ease,
              stroke 0.3s ease,
              opacity 0.3s ease,
              filter 0.3s ease,
              stroke-width 0.2s ease;
}
```

---

## 7. ACCESSIBILITY CONSIDERATIONS

### Colorblind-Friendly Mode
```javascript
const colorblindPalette = {
  mainNote: {
    fill: '#0173B2',      /* Blue - safe for all types */
    stroke: '#004D80'
  },
  graceNote: {
    fill: '#ECE133',      /* Yellow - distinguishable */
    stroke: '#B3AA00'
  },
  kpic: {
    levels: ['#0173B2', '#56B4E9', '#88CCEE', '#B3E0FF']
  },
  kric: {
    levels: ['#CC6677', '#EE8899', '#FFAABB', '#FFCCDD']
  }
};
```

### High Contrast Mode
```css
.high-contrast {
  --main-note-fill: #000000;
  --main-note-stroke: #FFFFFF;
  --grace-note-fill: #FFFFFF;
  --grace-note-stroke: #000000;
  --stroke-width-normal: 2px;
  --stroke-width-selected: 4px;
}
```

---

## 8. USAGE EXAMPLES

### Main Note Rendering
```javascript
// Normal state
note.style.fill = '#008080';
note.style.opacity = '0.8';

// Highlighted state
note.style.fill = '#008080';
note.style.opacity = '1.0';
note.style.filter = 'drop-shadow(0 0 20px rgba(0, 128, 128, 0.6))';
```

### Pattern Selection
```javascript
// Single pattern selected
pattern.classList.add('selected');
applyColorState(pattern, 'kpic', 'selected', 0);

// Multiple patterns selected
patterns.forEach((pattern, index) => {
  pattern.classList.add('selected', `pattern-${index + 1}`);
  applyColorState(pattern, 'kpic', 'selected', index);
});
```

### Sankey Interaction
```javascript
// Hover effect
band.addEventListener('mouseenter', () => {
  band.style.opacity = '0.8';
  band.style.filter = 'drop-shadow(0 0 10px rgba(0, 102, 204, 0.6))';
});

// Selection
band.addEventListener('click', () => {
  band.classList.toggle('selected');
  updateRelatedPatterns(band.dataset.pattern);
});
```

---

## 9. MIGRATION PATH

### Phase 1: Core Colors
1. Update main and grace note colors
2. Standardize opacity levels
3. Implement basic state system

### Phase 2: Pattern System
1. Apply KPIC blue family
2. Apply KRIC green family
3. Implement multi-selection differentiation

### Phase 3: Sankey Integration
1. Align Sankey colors with note system
2. Implement gradient transitions
3. Add interactive states

### Phase 4: Polish
1. Add smooth transitions
2. Implement accessibility modes
3. Fine-tune glow effects

---

## Summary

This color system provides:
- **Clear hierarchy**: Main notes (teal) vs Grace notes (gold)
- **Category consistency**: KPIC (blues), KRIC (greens), Complex (purples)
- **State clarity**: Normal (0.8 opacity) vs Selected (1.0 + glow)
- **Multi-selection support**: 4 levels within each category
- **Accessibility**: Colorblind and high-contrast modes
- **Smooth interactions**: Consistent transitions and hover effects

The system eliminates confusion by:
1. Using opacity for state, not category
2. Using color family for category, not state
3. Using glow intensity for emphasis level
4. Using stroke patterns for additional differentiation
5. Maintaining consistency across all visualizations