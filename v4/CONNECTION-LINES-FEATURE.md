# Connection Lines Feature - Phrase Relationship Visualization

## Overview (2025-10-16)

Added curved arc connections between related phrases to visualize distribution and patterns at a glance.

## Visual System

### Three Phrase Types

1. **Identical Phrases (Exact Text Match)**
   - Appearance: Solid curved arcs
   - Color: Matches phrase fill color
   - Stroke width: 2px
   - Opacity: 0.6
   - Shows: How exact repetitions are distributed throughout the song

2. **Structural Parallels (Similar Pattern, Different Words)**
   - Appearance: Dashed curved arcs
   - Color: Matches phrase fill color
   - Stroke width: 1.5px
   - Stroke dash: 4,3
   - Opacity: 0.4
   - Shows: How similar structural patterns recur

3. **Unique Phrases (Appear Once)**
   - Appearance: No connectors
   - Shows: Phrases that don't repeat

### Arc Design

```
Phrase 1         Phrase 2              Phrase 3
  ████             ████                  ████
    ╰─────────────╯                       │
      Solid arc                           │ (no connector - unique)
    (identical)
                   ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯
                     Dashed arc
                   (structural parallel)
```

- **Arc height**: Adaptive based on distance
  - Identical: `min(distance * 0.3, 40px)`
  - Structural: `min(distance * 0.25, 30px)`
- **Position**: Just below phrase boxes (10px gap)
- **Connection**: Consecutive occurrences linked

## Implementation Details

### Algorithm

```javascript
// Group 1: By exact text
const textGroups = {};
phrases.forEach(phrase => {
    textGroups[phrase.text] = textGroups[phrase.text] || [];
    textGroups[phrase.text].push(phrase);
});

// Draw solid arcs for identical phrases (2+ occurrences)
Object.values(textGroups).forEach(group => {
    if (group.length > 1) {
        for (let i = 0; i < group.length - 1; i++) {
            drawSolidArc(group[i], group[i + 1]);
        }
    }
});

// Group 2: By structural parallel groupId
// Draw dashed arcs for structural parallels
```

### SVG Path Format

```xml
<!-- Solid arc (identical phrases) -->
<path
    d="M x1,y Q midX,arcTop x2,y"
    stroke="#FF6B9D"
    stroke-width="2"
    fill="none"
    opacity="0.6"/>

<!-- Dashed arc (structural parallels) -->
<path
    d="M x1,y Q midX,arcTop x2,y"
    stroke="#FF6B9D"
    stroke-width="1.5"
    stroke-dasharray="4,3"
    fill="none"
    opacity="0.4"/>
```

### Zoom Awareness

Connection lines have `data-base-x1` and `data-base-x2` attributes for zoom controller integration:

```javascript
data-base-x1="${x1}"
data-base-x2="${x2}"
```

## Benefits

1. **Instant Pattern Recognition**: See at a glance how phrases repeat and where
2. **Distribution Visualization**: Understand spacing between repetitions
3. **Structural Insights**: Dashed lines show similar patterns even with different words
4. **Clean Hierarchy**: Arcs drawn behind boxes, don't obscure content
5. **Interactive Tooltips**: Hover to see exact phrase text

## Usage Insights

### What You Can Learn

**Solid arcs tell you:**
- "This exact phrase appears 3 times throughout the song"
- "There are long gaps between some repetitions"
- "The refrain is evenly distributed"

**Dashed arcs tell you:**
- "These phrases follow similar melodic/rhythmic patterns"
- "The song uses structural repetition even when words change"
- "There's a question-answer pattern here"

**No connectors tell you:**
- "This phrase is unique - appears only once"
- "This is the intro/outro/bridge"

## Visual Examples

### Refrain Song
```
Intro  Refrain  Verse  Refrain  Verse  Refrain  Outro
████    ████    ████    ████    ████    ████    ████
        ╰───────────────╯
               ╰────────────────────────╯
(Solid arcs connecting identical refrains)
```

### Structural Variation
```
Question 1      Question 2      Question 3
████            ████            ████
╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯
               ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯
(Dashed arcs - similar structure, different words)
```

### Mixed Pattern
```
A     B     A     C     B     A     D
████  ████  ████  ████  ████  ████  ████
╰───────────╯     │     │     │     (unique)
      ╰───────────┼─────╯     │
                  ╰───────────╯
```

## Files Modified

- `v4/annotated-phrases-ii-generator.js`
  - Added `renderConnectionLines()` method (95 lines)
  - Updated `buildSVG()` to render connections first (behind boxes)
  - Updated header comments

## Answer to User Question

**"Do I miss any types?"**

No, you've identified all the main phrase relationship types:

1. ✅ **Identical phrases** - exact text match (solid arcs)
2. ✅ **Structural parallels** - similar pattern, different words (dashed arcs)
3. ✅ **Unique phrases** - no repetition (no connectors)

These three categories cover the complete taxonomy of phrase relationships in Vietnamese folk songs.

## Testing

View at: http://localhost:3006

Look for:
- Solid arcs connecting phrases with identical text
- Dashed arcs connecting structurally similar phrases
- Phrases with no arcs (unique occurrences)
- Adaptive arc heights based on phrase spacing
- Color-coded arcs matching phrase colors
