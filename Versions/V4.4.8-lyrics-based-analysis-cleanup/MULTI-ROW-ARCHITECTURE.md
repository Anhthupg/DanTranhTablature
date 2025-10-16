# Multi-Row Phrase Analysis Architecture - Clean Dimensional Separation

## 🎯 Core Concept

**User Insight:** "Fills and outline colors coded is not good. Let's do rows of boxes for different tiers."

**New Architecture:** Each dimension gets its OWN ROW - no multi-encoding in single boxes!

---

## 🏗️ THE 3-ROW SYSTEM

### **Row 1: Phrase Text & Repetition (Primary)**
**Height:** 120px
**One box per phrase**

#### Color Encoding:
- **Identical text** → Same solid color
  - "Bà rằng bà rí" appears 4 times → All 4 boxes = solid PINK

- **Structural parallel** → Same color with texture
  - "Chồng gì mà chồng X?" pattern repeats → Same CYAN with diagonal stripes
  - Different from solid cyan (shows it's variation, not exact match!)

- **Unique** → Unique color, solid
  - "Làm khổ cái đời tôi" appears once → Unique YELLOW, solid

#### Texture Patterns:
```javascript
const textures = {
    solid: 'No pattern (exact repetition)',
    stripes: 'Diagonal lines (structural parallel - same pattern)',
    dots: 'Polka dots (semantic parallel - same themes)',
    crosshatch: 'Grid pattern (variation)',
};
```

#### Content Displayed:
- Vietnamese phrase text (13px, black with white stroke)
- REPEAT badge if exact match: "REPEAT (2/4)"
- STRUCTURAL badge if pattern match: "STRUCTURAL"
- Phrase number: "Phrase 5"

---

### **Row 2: Linguistic Type (Merged Boxes)**
**Height:** 60px
**One box per consecutive group of same type**

#### Merging Logic:
```javascript
// Merge consecutive phrases of same linguistic type
Phrases: [Q1, Q2, Q3, N1, N2, C1, C2, C3, C4]
Types:   [question, question, question, narrative, narrative, complaint, complaint, complaint, complaint]

Result:
┌─────────────┬─────────┬──────────────────┐
│ Question    │Narrative│  Complaint       │
│ (3 phrases) │(2)      │  (4 phrases)     │
└─────────────┴─────────┴──────────────────┘
```

#### Visual:
- Box width = sum of phrase widths
- Color = linguistic type color (solid, subtle)
- Label: "Question (3)" or "Narrative (2)" or "Complaint (4)"
- Tooltip: "3 consecutive question phrases: #1, #2, #3"

---

### **Row 3: Semantic Themes (Optional)**
**Height:** 40px
**Shows dominant theme or theme combinations**

#### Options:

**Option A: Dominant Theme**
- One box per phrase showing PRIMARY theme
- Colors: Nature (green), Emotion (red), Characters (orange), Action (blue)

**Option B: Metaphor Indicator**
- Only show when nature+emotion combine
- Icon: 🎭 for metaphorical phrases
- Empty for literal phrases

**Option C: Theme Density**
- Box intensity = number of themes
- Light = 1 theme, Dark = 3+ themes

---

## 🎨 COMPLETE VISUAL EXAMPLE

```
ROW 1: PHRASE TEXT & REPETITION
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ PINK     │ PINK     │ CYAN     │ PINK     │ YELLOW   │  ← Colors
│ solid    │ solid    │ stripes  │ solid    │ solid    │  ← Textures
│          │          │          │          │          │
│ REPEAT   │ REPEAT   │STRUCTURAL│ REPEAT   │ (none)   │  ← Badges
│  (1/4)   │  (2/4)   │          │  (3/4)   │          │
│          │          │          │          │          │
│"Bà rằng" │"Bà rằng" │"Chồng gì"│"Bà rằng" │"Làm khổ" │  ← Text
│ Phrase 1 │ Phrase 5 │ Phrase 3 │ Phrase 12│ Phrase 7 │
└──────────┴──────────┴──────────┴──────────┴──────────┘

ROW 2: LINGUISTIC TYPE (MERGED)
┌──────────┬──────────────────────┬──────────┬──────────┐
│  Intro   │   Exclamatory (4)    │Question  │Complaint │
│          │                      │   (2)    │   (3)    │
└──────────┴──────────────────────┴──────────┴──────────┘
   ↑              ↑                     ↑           ↑
 1 phrase      4 phrases              2 phrases  3 phrases
              merged into 1 box

ROW 3: SEMANTIC THEMES (OPTIONAL)
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│👤        │👤 📣     │👤 😢     │👤 📣     │🗣️ 😢 💭│  ← Icons
│characters│char+vocal│char+emot │char+vocal│act+em+abs│
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 🎨 TEXTURE PATTERN IMPLEMENTATION

### SVG Pattern Definitions:

```xml
<defs>
    <!-- Diagonal stripes for structural parallels -->
    <pattern id="stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
    </pattern>

    <!-- Polka dots for semantic parallels -->
    <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="2" fill="#FFFFFF" opacity="0.6"/>
    </pattern>

    <!-- Crosshatch for variations -->
    <pattern id="crosshatch" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0,0 L8,8 M8,0 L0,8" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/>
    </pattern>
</defs>

<!-- Usage -->
<rect fill="#4ECDC4" />                    <!-- Solid (exact repetition) -->
<rect fill="#4ECDC4" mask="url(#stripes)"/> <!-- With stripes (structural parallel) -->
<rect fill="#4ECDC4" mask="url(#dots)"/>    <!-- With dots (semantic parallel) -->
```

---

## 📐 LAYOUT SPECIFICATIONS

### Row Heights:
```javascript
const layout = {
    row1: {
        y: 0,
        height: 120,
        purpose: 'Phrase text & repetition pattern'
    },
    row2: {
        y: 140,
        height: 60,
        purpose: 'Linguistic type (merged boxes)'
    },
    row3: {
        y: 220,
        height: 40,
        purpose: 'Semantic themes (optional)'
    },
    totalHeight: 280
};
```

### Row 1 Box Structure:
```javascript
// Each phrase box
{
    x: phraseStartX,
    y: 0,
    width: phraseWidth,
    height: 120,
    fill: colorByText[phrase.text],      // Same text = same color
    pattern: getPattern(parallelismLevel), // solid / stripes / dots
    content: {
        badge: 'REPEAT (2/4)' or 'STRUCTURAL' or null,
        text: phrase.text,
        number: `Phrase ${phrase.id}`
    }
}
```

### Row 2 Box Structure:
```javascript
// Merged linguistic type boxes
{
    x: firstPhraseX,
    y: 140,
    width: sumOfPhraseWidths,  // Spans multiple phrases!
    height: 60,
    fill: typeColors[linguisticType],  // Subtle color
    content: {
        label: `${typeLabel} (${phraseCount})`,
        tooltip: `${phraseCount} consecutive ${typeLabel} phrases: #${ids.join(', #')}`
    }
}
```

---

## 🎯 BENEFITS OF MULTI-ROW DESIGN

| Aspect | Old (Single Box) | New (Multi-Row) | Improvement |
|--------|------------------|-----------------|-------------|
| **Clarity** | Fill+border encoding | Each row = one dimension | 100% clearer |
| **Patterns** | Hard to spot | Vertical alignment obvious | Instant recognition |
| **Grouping** | Border color grouping | Merged boxes | Explicit grouping |
| **Textures** | Not possible | Stripes/dots distinguish parallels | Richer encoding |
| **Scalability** | 2 dimensions max | N rows = N dimensions | Unlimited |

---

## 📊 INFORMATION DENSITY COMPARISON

### Current (Single Box):
```
One 280px tall box encodes:
- Fill color (repetition)
- Border color (type)
- Badge (parallelism)
- Icons (semantics)
- Label (structure)

Problem: Cramped, confusing, limited to 2 color dimensions
```

### Proposed (Multi-Row):
```
Row 1 (120px): Text + color + texture + badge
Row 2 (60px): Merged type boxes (clear grouping!)
Row 3 (40px): Theme indicators

Benefit: Each row independent, textures add dimension, merging shows flow!
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Row 1 (Phrase Text with Textures)
1. Generate color palette by unique text
2. Detect parallelism levels (exact, structural, semantic)
3. Assign textures (solid, stripes, dots)
4. Render boxes with SVG patterns

### Phase 2: Row 2 (Merged Linguistic Type Boxes)
1. Group consecutive phrases by type
2. Calculate merged box dimensions
3. Render wide boxes spanning groups
4. Add phrase count labels

### Phase 3: Row 3 (Semantic Themes - Optional)
1. Extract dominant theme per phrase
2. Detect metaphor patterns (nature+emotion)
3. Render theme indicators

---

## 🎨 MOCKUP

```
Song: "Bà Rằng Bà Rí" (28 phrases)

ROW 1: PHRASE REPETITION (Each box = one phrase)
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐...
│PINK │CYAN │PINK │YELLOW│PINK │PINK │CYAN │PINK │
│solid│stripe│solid│solid│solid│solid│stripe│solid│
│2/4  │STRUC│3/4  │ -   │4/4  │1/4  │STRUC│2/4  │
│Bà...│Chồng│Bà...│Làm..│Bà...│Bà...│Chồng│Bà...│
│ #1  │ #3  │ #5  │ #7  │ #12 │ #15 │ #18 │ #22 │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

ROW 2: LINGUISTIC TYPE (Merged boxes)
┌───┬──────────────┬────────────┬────────┬─────────┐...
│Int│ Exclamatory  │  Question  │Narrative│Complaint│
│1  │  (4 phrases) │ (2 phrases)│   (5)   │   (8)   │
└───┴──────────────┴────────────┴────────┴─────────┘

ROW 3: THEMES (Icons only when special)
┌───┬───┬───┬────┬───┬───┬───┬───┐
│👤 │👤📣│👤😢│🎭 │👤 │👤 │👤😢│👤 │
└───┴───┴───┴────┴───┴───┴───┴───┘
         ↑     ↑
      vocative metaphor!
```

**Much clearer!** Want me to implement this?