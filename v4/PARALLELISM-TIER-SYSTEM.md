# Parallelism Tier System - Complete Hierarchy

## 📊 THE 4-TIER REPETITION SYSTEM

Based on `generate-phrase-annotations.js` lines 398-431, here's the complete hierarchy:

---

## **Tier 1: EXACT REFRAIN** 🥇 (Highest Priority)

### Definition
**Word-for-word identical phrases** - every syllable matches exactly

### Detection Logic
```javascript
// Group phrases by exact text
const exactRefrains = phrases.reduce((groups, phrase) => {
    if (!groups[phrase.text]) groups[phrase.text] = [];
    groups[phrase.text].push(phrase.id);
    return groups;
}, {});

// Keep only phrases that repeat (count > 1)
return Object.entries(exactRefrains)
    .filter(([text, ids]) => ids.length > 1);
```

### Visual Encoding
```javascript
{
    class: 'exact-refrain',
    badge: {
        text: 'REFRAIN (1/4)',  // Shows occurrence number / total occurrences
        color: '#FFD700',        // Gold
        position: 'top'
    }
}
```

### Examples
```
"Bà rằng bà rí, ơi hỡi cho dày" appears 4 times
→ Badge: REFRAIN (1/4), REFRAIN (2/4), REFRAIN (3/4), REFRAIN (4/4)

"Ới khắp chốn nối cái" appears 2 times
→ Badge: REFRAIN (1/2), REFRAIN (2/2)
```

### Characteristics
- ✅ 100% text match
- ✅ Most visually prominent (gold badge)
- ✅ Shows occurrence count (1/4 = first of 4 times)
- ✅ Indicates song's memorable hooks/anchors

---

## **Tier 2: STRUCTURAL PARALLEL** 🥈

### Definition
**Same grammatical pattern, different words** - structural skeleton matches

### Detection Logic
```javascript
// Extract grammatical pattern from each phrase
function extractPattern(wordMapping) {
    return wordMapping.map(word => {
        const vn = word.vietnamese.toLowerCase();
        const en = word.english.toLowerCase();

        // Classify by linguistic function
        if (['bà', 'ông', 'chồng'].includes(vn)) return 'PERSON';
        if (['gì', 'nào', 'sao'].includes(vn)) return 'Q-WORD';
        if (['khổ', 'buồn', 'vui'].includes(vn)) return 'EMOTION';
        // ... etc

        return 'OTHER';
    }).join('-');
}

// Group by pattern
const structuralParallels = phrases.reduce((groups, phrase) => {
    const pattern = extractPattern(phrase.wordMapping);
    if (!groups[pattern]) groups[pattern] = [];
    groups[pattern].push(phrase.id);
    return groups;
}, {});

// Keep only patterns that repeat (count > 1)
return Object.entries(structuralParallels)
    .filter(([pattern, ids]) => ids.length > 1);
```

### Visual Encoding
```javascript
{
    class: 'structural-parallel',
    badge: {
        text: 'STRUCTURAL',
        color: '#3498DB',  // Blue
        position: 'top'
    }
}
```

### Examples
```
Pattern: "PERSON-Q-WORD-OTHER-PERSON-EMOTION"

Phrase 1: "Chồng gì mà chồng bé khổ?"
          PERSON-Q-WORD-OTHER-PERSON-EMOTION

Phrase 2: "Bà nào mà bà xinh vui?"
          PERSON-Q-WORD-OTHER-PERSON-EMOTION

→ Both get: Badge "STRUCTURAL" (blue)
```

### Characteristics
- ✅ Same grammatical skeleton
- ✅ Different vocabulary
- ✅ Blue badge (distinguishes from exact refrain)
- ✅ Shows compositional patterns
- ❌ Does NOT show occurrence count (just "STRUCTURAL")

---

## **Tier 3: SEMANTIC PARALLEL** 🥉 (Detected, Not Shown)

### Definition
**Same thematic content** - similar meaning/topics, different structure

### Detection Logic
```javascript
// Extract themes from each phrase
function extractThemes(wordMapping) {
    const themes = new Set();

    wordMapping.forEach(word => {
        const vn = word.vietnamese.toLowerCase();

        // Semantic domain mapping
        if (this.domains.characters.includes(vn)) themes.add('characters');
        if (this.domains.emotions.includes(vn)) themes.add('emotions');
        if (this.domains.nature.includes(vn)) themes.add('nature');
        // ... etc
    });

    return Array.from(themes);
}

// Group phrases by shared themes
const semanticParallels = {};
phrases.forEach(phrase => {
    const themes = extractThemes(phrase.wordMapping);
    themes.forEach(theme => {
        if (!semanticParallels[theme]) semanticParallels[theme] = [];
        semanticParallels[theme].push(phrase.id);
    });
});
```

### Visual Encoding
```javascript
// NOT shown as badge (unlike Tier 1 & 2)
// Instead: Used for semantic clustering icons
{
    semantics: {
        icons: [
            { icon: '👤', label: 'characters' },
            { icon: '😢', label: 'emotion' }
        ]
    }
}
```

### Examples
```
Phrase 1: "Bà thương em nhiều lắm"
          Themes: [characters, emotions]

Phrase 2: "Chồng nhớ vợ khổ quá"
          Themes: [characters, emotions]

→ Both phrases share [characters, emotions] themes
→ Shown as icons, NOT as "SEMANTIC PARALLEL" badge
```

### Characteristics
- ✅ Same thematic domains (nature, emotion, characters, etc.)
- ✅ Different words AND structure
- ✅ Shown via semantic icons (👤, 😢, 🌳, etc.)
- ❌ NO badge (not part of parallelism badge system)

---

## **Tier 4: UNIQUE** (No Badge)

### Definition
**Appears only once** - no textual, structural, or semantic repetition

### Detection Logic
```javascript
// By process of elimination:
// NOT exact refrain (text doesn't repeat)
// NOT structural parallel (pattern appears once)
// NOT even semantic parallel (no shared themes)

getParallelismLevel(phrase, analysis) {
    // Check exact refrain
    if (isExactRefrain) return { badge: 'REFRAIN (1/4)' };

    // Check structural parallel
    if (isStructuralParallel) return { badge: 'STRUCTURAL' };

    // Default: unique phrase
    return { class: 'unique', badge: null };  // ← No badge!
}
```

### Visual Encoding
```javascript
{
    class: 'unique',
    badge: null  // No badge displayed
}
```

### Examples
```
"Làm khổ cái đời tôi mãi mãi"
→ Appears once, unique structure, no shared themes
→ NO BADGE (clean phrase box)
```

### Characteristics
- ✅ Appears exactly once
- ✅ Unique grammatical pattern
- ❌ NO badge (clean appearance)
- ✅ Default state for most phrases

---

## 📊 VISUAL SUMMARY

| Tier | Badge Text | Badge Color | Stroke | Shows Count? | Indicates |
|------|-----------|-------------|---------|--------------|-----------|
| **1. Exact Refrain** | `REFRAIN (1/4)` | Gold (#FFD700) | Solid | ✅ Yes | Memorable hooks, word-for-word repetition |
| **2. Structural Parallel** | `STRUCTURAL` | Blue (#3498DB) | Solid | ❌ No | Compositional patterns, same skeleton |
| **3. Semantic Parallel** | *(none)* | *(icons only)* | N/A | N/A | Thematic clustering (shown via icons) |
| **4. Unique** | *(none)* | *(none)* | Normal | N/A | Single occurrence, unique phrase |

---

## 🎨 HOW THEY INTERACT WITH FILL/BORDER COLORS

### Current Two-Tier Color System (V4.4.9)
- **Fill color** = Identical phrase text (Tier 1 exact match)
- **Border color** = Identical linguistic type (question, exclamatory, etc.)

### Parallelism Badges (Additional Layer)
- **Gold badge** = Tier 1 exact refrain
- **Blue badge** = Tier 2 structural parallel
- **No badge** = Tier 3 (semantic) or Tier 4 (unique)

### Complete Visual Encoding
```
┌─────────────────────────┐
│  REFRAIN (2/4) ← Gold   │  Tier 1: Exact refrain badge
│                         │
│  ┌──────────────────┐   │
│  │  Pink fill       │   │  Fill: Identical phrase text
│  │  Cyan border     │   │  Border: Question type
│  │                  │   │
│  │  "Bà rằng bà rí" │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

---

## 🔍 DETECTION PRIORITY (Cascading)

The system checks in order:

1. **First:** Is it exact refrain? → Show gold badge
2. **Else:** Is it structural parallel? → Show blue badge
3. **Else:** No badge (unique or semantic-only)

**Only ONE badge per phrase** - highest priority wins!

---

## 💡 PROPOSED ENHANCEMENT

### Add Tier 3 Badge (Optional)

Currently semantic parallels have NO badge. We could add:

```javascript
// Check semantic parallel (if not exact or structural)
if (semanticMatch && semanticMatch.phraseIds.length > 2) {
    return {
        class: 'semantic-parallel',
        badge: {
            text: 'SEMANTIC',
            color: '#9B59B6'  // Purple
        }
    };
}
```

**Benefits:**
- ✅ Shows thematic relationships explicitly
- ✅ Complete 3-tier badge system
- ✅ Purple badge distinguishes from gold/blue

**Drawback:**
- ⚠️ More visual noise
- ⚠️ Overlaps with semantic icons

**Recommendation:** Keep current system (2 badge tiers + semantic icons)

---

## 📋 QUICK REFERENCE

**What do I see in the app?**

- **Gold "REFRAIN (2/4)"** → Phrase appears 4 times total, this is 2nd occurrence
- **Blue "STRUCTURAL"** → Same pattern as other phrases, different words
- **No badge** → Unique phrase OR only semantic similarity

**How do I interpret the visual hierarchy?**

1. **Gold badge** = Most important (memorable hooks, exact repetition)
2. **Blue badge** = Secondary pattern (compositional structure)
3. **No badge** = Background (unique content)

**What's the difference from fill/border colors?**

- **Fill color** = Groups identical phrase TEXT
- **Border color** = Groups identical linguistic TYPE
- **Badge** = Shows PARALLELISM level (exact/structural/none)

All three are independent dimensions showing different aspects!

---

**Status**: 4-tier system fully documented
**Current Implementation**: Tiers 1-2 shown as badges, Tier 3 shown as icons, Tier 4 has no badge
**Next**: User decides if any enhancements needed
**Date**: 2025-10-16
