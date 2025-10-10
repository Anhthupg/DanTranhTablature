# V3.0 DEEP Enhancement - Complete Workflow
## The ONLY Figurative Language Processing Method

**Policy:** All 121 songs MUST use V3.0 DEEP Enhancement. No basic/tier1 analysis accepted.

**Method:** Direct from source lyrics → Full 7-component analysis
**Quality:** Research-grade, publication-ready depth
**Output:** One `-v3.json` file per song with complete analysis

---

## 🎯 Quick Start: Copy-Paste This Into Each New Conversation

```
I'm processing Vietnamese folk song #{SONG_NUMBER} of 121 using V3.0 DEEP Enhancement.

Instructions file: /Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/V3-DEEP-ENHANCEMENT-INSTRUCTIONS.md

Please:
1. Run intelligent analyzer to get recommended song
2. Read source lyrics from tier1 file (just for reference)
3. Apply FULL 7-component analysis to ALL figurative expressions
4. Save as {SONG_NAME}-v3.json

No shortcuts. Full depth required.
```

---

## 📊 Current Progress

**Check status:**
```bash
cd /Users/wecanmusic/Downloads/Dan\ Tranh\ Tablature/v4

# Total songs
echo "Total: 121"

# V3.0 completed
ls data/figurative-enhanced/*-v3.json 2>/dev/null | wc -l

# Remaining
# 121 - completed = remaining
```

**Completed so far:** 1/121 (Bengu Adai)
**Remaining:** 120 songs

---

## ⚡ Streamlined Process (Per Song)

### 1. **Identify Next Song** (30 seconds)
```bash
node intelligent-deep-enhancer.js
```

### 2. **Read Source** (2 minutes)
Load tier1 file just to see:
- Song title and lyrics
- Pre-identified expressions (starting point)
- Basic cultural notes (hints)

**Important:** Tier1 data is REFERENCE ONLY. You will replace it with deep analysis.

### 3. **Identify ALL Figurative Expressions** (10-20 minutes)

Look for 7 categories:
- **Từ láy** (Reduplication)
- **Thành ngữ** (Idioms)
- **Ẩn dụ** (Metaphors)
- **Đối ngẫu** (Parallel structures)
- **Từ tượng thanh** (Onomatopoeia)
- **Irony/Hyperbole**
- **Ca dao formulas** (Folk song patterns)

### 4. **Apply 7-Component Analysis to EACH** (60-90 min per expression)

**Component 1: culturalWeights** (6 dimensions × 0-10)
- historicalDepth
- regionalSpecificity
- symbolicLoad
- ritualSignificance
- transmissionImportance
- emotionalResonance

**Component 2: complexityMetrics** (6 factors × 0-10)
- layersOfMeaning
- crossDomainMapping
- culturalPrerequisites
- idiomaticity
- contextDependence
- pedagogicalChallenge

**Component 3: semanticNetwork**
- sourceDomain
- targetDomain
- mappings (source→target pairs)
- conceptualMetaphor

**Component 4: usagePatterns**
- phrasePosition
- syntacticRole
- discourseFunction
- participationPattern
- emotionalValence

**Component 5: statistics** (auto-calculate)
- occurrences
- phraseIds
- coverage
- position distribution

**Component 6: comparativeContext**
- uniquenessScore
- similarExpressions (from other songs)
- regional/genre/historical distribution

**Component 7: interpretiveGuidance**
- performanceTips (concrete techniques)
- culturalSensitivity (what to respect)
- pedagogicalApproach (teaching steps)
- commonMisinterpretations (❌→✅)

### 5. **Aggregate & Save** (10 minutes)

Calculate:
- Total/unique expressions
- Average cultural weight
- Average complexity
- Overall cultural richness

Add collection context:
- Genre classification
- Cultural significance
- Performance context
- Pedagogical value

**Save as:** `data/figurative-enhanced/{SONG_NAME}-v3.json`

---

## ✅ Mandatory Quality Checklist

Every `-v3.json` file MUST have:

- [ ] ALL 7 components for EVERY expression
- [ ] ALL scores (0-10) with detailed explanations
- [ ] Semantic networks with specific mappings
- [ ] Performance tips that are concrete and actionable
- [ ] Cultural sensitivity notes that show respect
- [ ] Pedagogical approach with step-by-step teaching plan
- [ ] Comparative context referencing other specific songs
- [ ] No placeholder text ("TODO", "TBD", "...")
- [ ] Aggregate statistics calculated correctly
- [ ] Collection context added
- [ ] File named correctly: `{SONG_NAME}-v3.json`

**If ANY checkbox fails → NOT COMPLETE, must revise**

---

## 📈 Time Budget Per Song

| Song Complexity | Expressions | Time Required |
|----------------|-------------|---------------|
| Simple (1-3) | 1-3 | 60-90 min |
| Moderate (4-6) | 4-6 | 90-120 min |
| Complex (7-10) | 7-10 | 2-3 hours |
| Very Complex (10+) | 10+ | 3-4 hours |

**Average:** 1.5-2 hours per song

---

## 🎯 Scoring Guidelines Reference

### Cultural Weights (0-10 scale)

**Historical Depth:**
- 9-10: Ancient (1000+ years), UNESCO heritage level
- 7-8: Pre-modern (200-1000 years)
- 5-6: Modern traditional (50-200 years)
- 3-4: Contemporary folk (20-50 years)
- 1-2: Recent (<20 years)

**Regional Specificity:**
- 9-10: Single village/ethnic group only
- 7-8: Single region (North/Central/South)
- 5-6: Multiple regions
- 3-4: Nationwide with variations
- 1-2: Universal (cross-cultural)

**Symbolic Load:**
- 9-10: Deep metaphysical/philosophical
- 7-8: Rich multi-layered symbolism
- 5-6: Moderate symbolism (1-2 layers)
- 3-4: Minimal symbolism
- 1-2: Pure literal

**Ritual Significance:**
- 9-10: Essential to ceremonies
- 7-8: Important but not essential
- 5-6: Sometimes used in rituals
- 3-4: Occasional ritual use
- 1-2: No ritual function

**Transmission Importance:**
- 9-10: Critical for cultural survival
- 7-8: Very important to preserve
- 5-6: Worth preserving
- 3-4: Nice to preserve
- 1-2: Optional

**Emotional Resonance:**
- 9-10: Extremely powerful emotional impact
- 7-8: Strong emotional response
- 5-6: Moderate emotional effect
- 3-4: Mild emotional response
- 1-2: Neutral/minimal emotion

### Complexity Metrics (0-10 scale)

**Layers of Meaning:**
- 5: Multiple historical + contemporary + symbolic layers
- 4: Several interpretive layers
- 3: Multiple figurative meanings
- 2: Literal + 1 figurative layer
- 1: Single literal meaning

**Cross-Domain Mapping:**
- 9-10: Complex abstract mappings (LIFE IS JOURNEY)
- 7-8: Moderate abstract (LOVE IS WAR)
- 5-6: Simple concrete (HEART IS CONTAINER)
- 3-4: Minimal metaphor
- 1-2: No metaphor/literal

**Cultural Prerequisites:**
- 9-10: Extensive background needed
- 7-8: Significant cultural knowledge required
- 5-6: Moderate cultural context helpful
- 3-4: Minimal context needed
- 1-2: No prerequisites

**Idiomaticity:**
- 9-10: Completely frozen idiom
- 7-8: Highly idiomatic, fixed
- 5-6: Semi-fixed expression
- 3-4: Somewhat compositional
- 1-2: Fully compositional

**Context Dependence:**
- 9-10: Meaningless without context
- 7-8: Highly context-dependent
- 5-6: Context clarifies meaning
- 3-4: Mostly context-free
- 1-2: Fully context-independent

**Pedagogical Challenge:**
- 9-10: Extremely difficult to teach non-natives
- 7-8: Very challenging
- 5-6: Moderately difficult
- 3-4: Some challenge
- 1-2: Easy to teach

---

## 🔄 Workflow Diagram

```
Source Lyrics
     ↓
Identify ALL Figurative Expressions (7 categories)
     ↓
For EACH expression:
     ├── Component 1: culturalWeights (6 × 0-10)
     ├── Component 2: complexityMetrics (6 × 0-10)
     ├── Component 3: semanticNetwork (mappings)
     ├── Component 4: usagePatterns (5 fields)
     ├── Component 5: statistics (auto)
     ├── Component 6: comparativeContext
     └── Component 7: interpretiveGuidance
     ↓
Aggregate Statistics
     ↓
Collection Context
     ↓
Quality Check (11-point checklist)
     ↓
Save: {SONG_NAME}-v3.json
     ↓
Update Progress Tracker
```

---

## 📝 Example Expression (Complete)

```json
{
  "expression": "Dom dom",
  "literal": "sound repetition (gong imitation)",
  "meaning": "onomatopoeia imitating gong percussion sounds",

  "culturalWeights": {
    "historicalDepth": 9,
    "explanation": "Gong culture centuries old, UNESCO 2008",
    "regionalSpecificity": 10,
    "explanation": "Exclusively Central Highlands ethnic minorities",
    "symbolicLoad": 8,
    "explanation": "Gongs symbolize spiritual communication, ancestors",
    "ritualSignificance": 9,
    "explanation": "Central to weddings, funerals, ceremonies",
    "transmissionImportance": 9,
    "explanation": "Essential for ethnic minority cultural survival",
    "emotionalResonance": 7,
    "explanation": "Evokes communal identity, ceremonial solemnity"
  },

  "complexityMetrics": {
    "layersOfMeaning": 3,
    "explanation": "1) Sound imitation 2) Cultural reference 3) Spiritual invocation",
    "crossDomainMapping": 8,
    "explanation": "SOUND → RITUAL → SPIRITUALITY complex mapping",
    "culturalPrerequisites": 9,
    "explanation": "Requires highland gong culture knowledge",
    "idiomaticity": 7,
    "explanation": "Fixed ceremonial expression, not compositional",
    "contextDependence": 8,
    "explanation": "Full meaning only in ceremonial performance",
    "pedagogicalChallenge": 8,
    "explanation": "Non-Vietnamese need extensive cultural background"
  },

  "semanticNetwork": {
    "sourceDomain": "SOUND/PERCUSSION",
    "targetDomain": "SPIRITUAL_COMMUNICATION",
    "mappings": [
      {"source": "bronze gong strike", "target": "calling ancestral spirits"},
      {"source": "rhythmic pattern", "target": "ceremonial structure"},
      {"source": "resonance/vibration", "target": "spiritual energy"}
    ],
    "conceptualMetaphor": "SOUND IS SPIRITUAL MEDIUM"
  },

  "usagePatterns": {
    "phrasePosition": "beginning_and_middle",
    "explanation": "Phrase 3 start, phrase 5 middle - rhythmic anchor",
    "syntacticRole": "rhythmic_vocable",
    "explanation": "Percussive element, not grammatical",
    "discourseFunction": "ceremonial_atmosphere",
    "explanation": "Establishes sacred/ritual context",
    "participationPattern": "communal_responsive",
    "explanation": "Audience internalizes rhythm, body response",
    "emotionalValence": "solemn_reverent",
    "explanation": "Serious, respectful, spiritual focus"
  },

  "statistics": {
    "occurrences": 2,
    "phraseIds": [3, 5],
    "totalPhrases": 5,
    "coverage": "40%",
    "positionDistribution": {"beginning": 1, "middle": 1, "ending": 0}
  },

  "comparativeContext": {
    "uniquenessScore": 9,
    "explanation": "Ethnic minority songs only, not mainstream Vietnamese",
    "similarExpressions": [
      {
        "expression": "đình đống (other Tây Nguyên songs)",
        "similarity": "high",
        "difference": "đình đống generalized, dom-dom specific pattern"
      }
    ],
    "regionalDistribution": "Central Highlands only (Ê Đê, Jarai)",
    "genreDistribution": "Ceremonial/ritual only",
    "historicalPersistence": "Ancient to present, UNESCO safeguarded"
  },

  "interpretiveGuidance": {
    "performanceTips": [
      "Percussive 'D' with tongue strike, 'm' with lip resonance",
      "Downbeat on first 'Dom', lighter second 'dom'",
      "Imagine bronze gong: heavy attack, sustained decay",
      "Slight head nod or torso bounce to embody percussion"
    ],
    "culturalSensitivity": [
      "Sacred music from living cultures, not museum artifact",
      "Avoid exoticization, treat as serious spiritual tradition",
      "UNESCO recognition: world heritage with protection",
      "Outside performance: acknowledge source, seek consultation"
    ],
    "pedagogicalApproach": [
      "Step 1: Listen to actual gong recordings (YouTube: 'chiêng Tây Nguyên')",
      "Step 2: Practice vocal percussion for gong timbre",
      "Step 3: Learn cultural context: when/why gongs played",
      "Step 4: Study UNESCO gong culture documentation",
      "Step 5: Connect to broader Southeast Asian gong traditions"
    ],
    "commonMisinterpretations": [
      "❌ 'Meaningless filler' → ✅ Culturally-loaded ritual onomatopoeia",
      "❌ 'Vietnamese reduplication' → ✅ Ethnic minority distinct mechanism",
      "❌ 'Can omit for simplicity' → ✅ Essential, cannot remove"
    ]
  }
}
```

---

## 📁 File Structure

```
v4/
├── V3-DEEP-ENHANCEMENT-INSTRUCTIONS.md  ← Full detailed guide
├── V3-COMPLETE-WORKFLOW.md             ← This streamlined workflow
├── V3-COMPLETED.txt                     ← Progress tracker
├── intelligent-deep-enhancer.js         ← Song recommender
│
├── data/
│   ├── lyrics-enhanced-tier1/          ← Reference only (read for hints)
│   │   └── {SONG_NAME}.json
│   │
│   └── figurative-enhanced/            ← OUTPUT: V3.0 files ONLY
│       ├── Bengu Adai-v3.json          ← ✅ Complete example
│       ├── {SONG_NAME}-v3.json         ← Your output files
│       └── _COLLECTION_SUMMARY.json    ← Ignore (outdated basic analysis)
│
└── parsers/
    └── FIGURATIVE-LANGUAGE-TAXONOMY.md  ← Classification reference
```

---

## 🚀 Production Timeline

**Daily Targets:**

| Songs/Day | Total Days | Calendar Time |
|-----------|-----------|---------------|
| 1 | 120 days | 4 months |
| 2 | 60 days | 2 months |
| 3 | 40 days | 1.3 months |
| 5 | 24 days | 3-4 weeks |

**Recommended:** 2-3 songs/day = 40-60 days

**Sprint option:** 5 songs/day = under 1 month (intensive)

---

## ✅ Final Deliverable

When complete (121/121):

**You will have:**
- The world's most comprehensive figurative language analysis of Vietnamese folk music
- Research-grade dataset for linguistics, ethnomusicology, cultural studies
- Performance guides for musicians and educators
- Cultural preservation documentation for endangered traditions
- Cross-song comparative analysis capability
- Publication-ready scholarly resource

**Value:** Unprecedented depth of cultural-linguistic analysis

---

*Begin next conversation with the Quick Start prompt above!*
