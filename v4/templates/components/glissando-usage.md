# Perfect Glissando Controller - Usage Guide

## Overview
The Perfect Glissando Controller automatically draws glissando paths using parametric chevron-based visualization that adapts to all candidate notes based on the precise positioning rules for Vietnamese Dan Tranh music.

## Features
- **Perfect Positioning**: Automatic path calculation using Vietnamese music rules
- **Edgemost String Detection**: Finds closest string to target note
- **Dotted vs Normal Notes**: Different X-From calculation (1/3 vs midway)
- **Grace Note Support**: Includes grace notes as valid targets
- **Auto-Draw All**: Draws all candidates at once with one method call
- **Toggle Visibility**: Show/hide all glissandos easily

## Path Calculation Rules

### Y-From: Edgemost String
The glissando starts from the string **closest** to the target note:
```javascript
// Finds string with minimum distance to target note's Y position
calculateEdgemostStringY(targetNoteY)
```

### Y-To & X-To: Immediate Following Note
The glissando ends at the **next note** in the sequence (could be main or grace):
```javascript
// Includes grace notes as valid targets
findImmediateFollowingNote(candidateNoteIndex)
```

### X-From: Smart Start Position
The horizontal start depends on the candidate note's duration type:

**Normal Notes (not dotted):** Midway between candidate and target
```javascript
xFrom = candidateX + (targetX - candidateX) * 0.5
```

**Dotted Notes:** 1/3 from candidate, 2/3 before target
```javascript
xFrom = candidateX + (targetX - candidateX) * 1/3
```

---

## Step 1: Load Controller in HTML

```html
<script src="/glissando-controller.js"></script>
```

## Step 2: Initialize with SVG

```javascript
// Initialize controller with your SVG ID
const success = window.glissandoController.initialize('optimalSvg');

if (!success) {
    console.error('Failed to initialize glissando controller');
}
```

**What happens:**
- Extracts all notes from SVG (with `data-note-index`)
- Extracts all string positions
- Sorts notes by index

## Step 3: Load Glissando Candidates

```javascript
// Load candidates from analyzer
const candidates = [
    { noteIndex: 5, duration: 2.0 },     // Longest note
    { noteIndex: 12, duration: 1.75 },   // Second longest
    { noteIndex: 23, duration: 1.5 }     // Third longest
];

window.glissandoController.loadCandidates(candidates);
```

## Step 4: Draw All Glissandos

```javascript
// Automatically draws all glissando paths
window.glissandoController.drawAllGlissandos();
```

**Console Output:**
```
Drawing 3 glissando paths...
Drawing glissando for note #5: {
  candidate: (220.0, 350.0),
  target: (263.5, 410.0),
  path: (241.8, 398.0) → (263.5, 410.0),
  dotted: false
}
Drawing glissando for note #12: ...
Drawing glissando for note #23: ...
✓ Drew 3 glissando paths
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <script src="/glissando-controller.js"></script>
</head>
<body>
    <svg id="optimalSvg" width="2000" height="800">
        <!-- Tablature content here -->
    </svg>

    <button onclick="drawGlissandos()">Draw Glissandos</button>
    <button onclick="clearGlissandos()">Clear Glissandos</button>
    <button onclick="toggleGlissandos()">Toggle</button>

    <script>
        // 1. Initialize
        window.glissandoController.initialize('optimalSvg');

        // 2. Load candidates (from analyzer or manual)
        const candidates = [
            { noteIndex: 5, duration: 2.0 },
            { noteIndex: 12, duration: 1.75 }
        ];
        window.glissandoController.loadCandidates(candidates);

        // 3. Draw all
        function drawGlissandos() {
            window.glissandoController.drawAllGlissandos();
        }

        // 4. Clear all
        function clearGlissandos() {
            window.glissandoController.clearAllGlissandos();
        }

        // 5. Toggle visibility
        let visible = true;
        function toggleGlissandos() {
            visible = !visible;
            window.glissandoController.toggleGlissandos(visible);
        }
    </script>
</body>
</html>
```

---

## Advanced Usage

```javascript
const { generateGlissandoForNote } = require('./glissando-generator.js');

const glissandoSVG = generateGlissandoForNote({
    noteX: 150,              // Target note X position
    noteY: 400,              // Target note Y position
    lowestStringY: 575,      // Y of lowest string
    beatsBack: 1,            // Start 1 beat before note (default: 1)
    beatSpacing: 40,         // Pixels per beat (default: 40)
    chevronWidth: 14,        // Optional
    chevronDepth: 9,         // Optional
    color: 'black'           // Optional
});
```

---

## Method 3: Server-Side Generation (Node.js)

In your tablature generator:

```javascript
const { generateGlissandoForNote } = require('./templates/components/glissando-generator.js');

// During note processing
notes.forEach(note => {
    if (note.hasGlissando) {
        const glissando = generateGlissandoForNote({
            noteX: note.x,
            noteY: note.y,
            lowestStringY: stringConfig.lowestString.y,
            beatsBack: note.glissandoDuration || 1,
            beatSpacing: 40
        });

        svgContent += glissando;
    }
});
```

---

## Method 4: Client-Side Dynamic Generation (Browser)

Include in HTML:
```html
<script src="/templates/components/glissando-generator.js"></script>
```

Generate on-the-fly:
```javascript
// User clicks to add glissando
function addGlissandoToNote(noteElement) {
    const noteX = parseFloat(noteElement.getAttribute('cx'));
    const noteY = parseFloat(noteElement.getAttribute('cy'));

    const glissandoSVG = generateGlissandoForNote({
        noteX,
        noteY,
        lowestStringY: 575,
        color: 'red'  // Highlight color
    });

    // Insert into SVG
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = glissandoSVG;
    const glissandoElements = tempDiv.querySelectorAll('polyline');

    glissandoElements.forEach(el => {
        noteElement.parentNode.insertBefore(el, noteElement);
    });
}
```

---

## Parameters Reference

### `generateGlissando(params)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startX` | number | **required** | Starting X position (beat) |
| `startY` | number | **required** | Starting Y position (lowest string) |
| `endX` | number | **required** | Ending X position (note center) |
| `endY` | number | **required** | Ending Y position (note center) |
| `chevronWidth` | number | `14` | Width perpendicular to path (px) |
| `chevronDepth` | number | `9` | Depth along path = spacing (px) |
| `color` | string | `'black'` | Stroke color |
| `strokeWidth` | number | `2` | Line thickness |
| `showPath` | boolean | `false` | Show dashed reference line |

### `generateGlissandoForNote(params)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `noteX` | number | **required** | Target note X position |
| `noteY` | number | **required** | Target note Y position |
| `lowestStringY` | number | **required** | Y position of lowest string |
| `beatsBack` | number | `1` | Beats before note to start |
| `beatSpacing` | number | `40` | Pixels per beat |
| `chevronWidth` | number | `14` | Chevron width |
| `chevronDepth` | number | `9` | Chevron depth |
| `color` | string | `'black'` | Stroke color |

---

## Examples

### Example 1: Standard Glissando (1 beat before)
```javascript
generateGlissandoForNote({
    noteX: 150,
    noteY: 400,
    lowestStringY: 575
});
// Uses defaults: 1 beat back, 40px spacing, 14px wide, 9px deep, black
```

### Example 2: Long Glissando (2 beats before)
```javascript
generateGlissandoForNote({
    noteX: 150,
    noteY: 400,
    lowestStringY: 575,
    beatsBack: 2,        // Starts 80px before note
    beatSpacing: 40
});
```

### Example 3: Colored Glissando (for emphasis)
```javascript
generateGlissandoForNote({
    noteX: 150,
    noteY: 400,
    lowestStringY: 575,
    color: '#E74C3C'     // Red
});
```

### Example 4: Wider Chevrons (more visible)
```javascript
generateGlissandoForNote({
    noteX: 150,
    noteY: 400,
    lowestStringY: 575,
    chevronWidth: 18,    // Wider
    chevronDepth: 12     // Deeper
});
```

### Example 5: Different Starting String
```javascript
generateGlissando({
    startX: 110,
    startY: 450,         // Start from string 5 instead of lowest
    endX: 150,
    endY: 400
});
```

---

## Integration with Tablature Generator

Add to `server-tablature-generator.js`:

```javascript
const { generateGlissandoForNote } = require('./templates/components/glissando-generator.js');

// In note generation loop
if (note.glissando) {
    const glissandoMarkup = generateGlissandoForNote({
        noteX: noteX,
        noteY: stringY,
        lowestStringY: stringConfig[lowestString].y,
        beatsBack: note.glissando.duration || 1,
        beatSpacing: spacing
    });

    svgContent += glissandoMarkup;
}
```

---

## Mathematical Basis

The generator uses vector math to ensure chevrons are always correctly oriented:

1. **Path Vector**: `(dx, dy) = (endX - startX, endY - startY)`
2. **Unit Vector**: `(ux, uy) = (dx, dy) / length`
3. **Perpendicular**: `(px, py) = (-uy, ux)` (90° rotation)
4. **Chevron Arms**:
   - Left: `point + depth×(-u) + width/2×(p)`
   - Right: `point + depth×(-u) - width/2×(p)`
5. **Spacing**: `chevronDepth` along path direction

This ensures chevrons remain perpendicular to any path angle.

---

## File Location
`v4/templates/components/glissando-generator.js`
