# Vietnamese Figurative Language Taxonomy
## Multi-Dimensional Classification System for Ca Dao Analysis

## Problem with Single-Category Classification

### Why "type: idiom" vs "type: metaphor" Doesn't Work:

**Example: "tang tình"**
- Is it an idiom? YES (thành ngữ - fixed expression)
- Is it a cultural phrase? YES (specific to Vietnamese culture)
- Does it use metaphor? YES (appearance for character)
- Is it meaning-loaded? YES (multiple semantic layers)

**Forcing exclusive categories loses information!**

## Solution: Multi-Dimensional Tagging

Each expression gets tagged across **5 independent dimensions**:

### Dimension 1: Vietnamese Traditional Category (Primary Classification)

```javascript
vietnameseCategory: {
  "thành_ngữ",        // Idiom - fixed expression with figurative meaning
  "tục_ngữ",          // Proverb - wisdom, advice, moral lessons
  "từ_láy",           // Reduplication - already handled by separate tagger
  "từ_kết_hợp",       // Collocation - words that naturally pair
  "điển_tích",        // Cultural allusion - reference to history/legend
  "ca_dao_formula"    // Folk song formula - recurring poetic patterns
}
```

### Dimension 2: Semantic Relationship (How Meaning Works)

```javascript
semanticMechanism: {
  "literal",              // Compositional meaning from parts
  "metaphorical",         // Source→target domain mapping
  "metonymic",           // Part-for-whole or association
  "symbolic",            // Cultural symbol with assigned meaning
  "hyperbolic",          // Exaggeration for effect
  "euphemistic"          // Indirect reference
}
```

### Dimension 3: Cultural Specificity

```javascript
culturalScope: {
  "universal",           // Exists in many languages
  "vietnamese_specific", // Unique to Vietnamese
  "east_asian",         // Shared across East Asia
  "regional_vietnamese" // Specific to North/South/Central Vietnam
}
```

### Dimension 4: Fixedness (How Fixed is the Expression?)

```javascript
fixedness: {
  "frozen",             // Cannot change any word (idioms, proverbs)
  "semi_fixed",         // Core words fixed, modifiers flexible
  "flexible_pattern",   // Template with variable slots
  "free_combination"    // Words just happen to co-occur
}
```

### Dimension 5: Semantic Load (Meaning Density)

```javascript
meaningDepth: {
  "surface",            // Single literal meaning
  "layered",            // Literal + one figurative layer
  "multi_layered",      // Multiple interpretations
  "highly_symbolic"     // Deep cultural/philosophical meaning
}
```

## Enhanced Data Structure

### Example 1: "tang tình" (understated beauty)

```json
{
  "vietnamese": "tang tình",
  "literal": "mourning appearance",
  "meaning": "simple, plain clothes revealing inner beauty",

  "classification": {
    "vietnameseCategory": "thành_ngữ",
    "semanticMechanism": "metaphorical",
    "culturalScope": "vietnamese_specific",
    "fixedness": "semi_fixed",
    "meaningDepth": "multi_layered"
  },

  "features": [
    "appearance_metaphor",
    "beauty_in_simplicity",
    "traditional_aesthetic"
  ],

  "culturalContext": "Common motif in Vietnamese folk poetry: modest appearance concealing inner virtue/beauty",
  "words": ["tang", "tình"]
}
```

### Example 2: "có công mài sắt có ngày nên kim" (perseverance proverb)

```json
{
  "vietnamese": "có công mài sắt có ngày nên kim",
  "literal": "with effort grinding iron, one day becomes needle",
  "meaning": "perseverance leads to success",

  "classification": {
    "vietnameseCategory": "tục_ngữ",
    "semanticMechanism": "metaphorical",
    "culturalScope": "vietnamese_specific",
    "fixedness": "frozen",
    "meaningDepth": "highly_symbolic"
  },

  "features": [
    "work_ethic",
    "transformation_metaphor",
    "moral_lesson",
    "complete_proverb"
  ],

  "culturalContext": "Classic Vietnamese proverb teaching value of persistent effort",
  "words": ["có", "công", "mài", "sắt", "có", "ngày", "nên", "kim"]
}
```

### Example 3: "chiều chiều" (temporal reduplication)

```json
{
  "vietnamese": "chiều chiều",
  "literal": "afternoon afternoon",
  "meaning": "every afternoon, habitually at twilight",

  "classification": {
    "vietnameseCategory": "từ_láy",
    "semanticMechanism": "literal",
    "culturalScope": "vietnamese_specific",
    "fixedness": "frozen",
    "meaningDepth": "layered"
  },

  "features": [
    "total_reduplication",
    "temporal_emphasis",
    "habitual_aspect",
    "poetic_rhythm"
  ],

  "culturalContext": "Reduplication emphasizing recurring time and creating contemplative mood",
  "words": ["chiều", "chiều"]
}
```

### Example 4: "trong lòng" (in the heart)

```json
{
  "vietnamese": "trong lòng",
  "literal": "inside heart",
  "meaning": "in one's heart/feelings",

  "classification": {
    "vietnameseCategory": "từ_kết_hợp",
    "semanticMechanism": "metaphorical",
    "culturalScope": "east_asian",
    "fixedness": "semi_fixed",
    "meaningDepth": "layered"
  },

  "features": [
    "container_metaphor",
    "emotion_localization",
    "heart_symbolism"
  ],

  "culturalContext": "Heart as container of emotions - central to Vietnamese emotional expression",
  "words": ["trong", "lòng"]
}
```

## Statistics Output Format

### Old (Single Category):
```json
{
  "typeDistribution": {
    "idiom": 3,
    "proverb": 0,
    "cultural_phrase": 5,
    "metaphor": 2
  }
}
```
**Problem**: Overlapping categories, information loss

### New (Multi-Dimensional):
```json
{
  "byVietnameseCategory": {
    "thành_ngữ": 4,
    "tục_ngữ": 1,
    "từ_láy": 2,
    "từ_kết_hợp": 3,
    "ca_dao_formula": 1
  },

  "bySemanticMechanism": {
    "metaphorical": 7,
    "literal": 2,
    "symbolic": 2
  },

  "byCulturalScope": {
    "vietnamese_specific": 8,
    "east_asian": 2,
    "universal": 1
  },

  "byMeaningDepth": {
    "surface": 2,
    "layered": 5,
    "multi_layered": 3,
    "highly_symbolic": 1
  },

  "featureDistribution": {
    "appearance_metaphor": 2,
    "container_metaphor": 3,
    "temporal_emphasis": 2,
    "moral_lesson": 1,
    "beauty_in_simplicity": 1
  }
}
```

## Benefits of Multi-Dimensional System

1. **No information loss** - capture all aspects
2. **Cross-dimensional queries** - "Show me all Vietnamese-specific metaphorical idioms"
3. **Richer analysis** - understand HOW expressions work, not just WHAT they are
4. **Linguistic accuracy** - matches how figurative language actually functions
5. **Scalable** - easy to add new dimensions/features as needed

## Implementation

Would you like me to:
1. Create new enhanced idiom detector with this taxonomy
2. Re-process "Lý chiều chiều" with multi-dimensional tags
3. Show you the improved results

This will give you much richer data for analysis!
