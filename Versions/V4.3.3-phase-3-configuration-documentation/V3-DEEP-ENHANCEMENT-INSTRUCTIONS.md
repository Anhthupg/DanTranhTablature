# V3.0 DEEP Enhancement Instructions
## Complete 7-Component Figurative Language Analysis

**Goal:** Process all 121 Vietnamese folk songs with comprehensive figurative language analysis
**Method:** One song per conversation (1-2 hours each)
**Total Effort:** ~121-242 hours across 121 conversations

---

## 📋 Pre-Conversation Checklist

### Step 1: Identify Next Song to Process

Run this command to see which songs still need V3.0 enhancement:

```bash
cd /Users/wecanmusic/Downloads/Dan\ Tranh\ Tablature/v4
node intelligent-deep-enhancer.js
```

**Output shows:**
- Recommended song(s) for this session based on complexity
- Remaining songs for future sessions
- Estimated conversations needed

### Step 2: Load Source Data

The recommended song will have a Tier 1 file here:
```
/Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/data/lyrics-enhanced-tier1/{SONG_NAME}.json
```

**This file contains:**
- Basic figurative expressions already identified
- Tone analysis, pronoun analysis, reduplication patterns
- Cultural context notes
- Multi-dimensional taxonomy classifications

---

## 🎯 Conversation Workflow (Per Song)

### STEP 1: Read Source File

```bash
Read /Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/data/lyrics-enhanced-tier1/{SONG_NAME}.json
```

**Identify:**
- Total figurative expressions (look in `figurativeLanguageAnalysis.expressions`)
- Number of phrases
- Complexity indicators (idioms, reduplication, cultural references)

---

### STEP 2: Extract Each Figurative Expression

For EACH expression found, you will create a complete 7-component analysis:

#### Component 1: **culturalWeights** (6 dimensions, 0-10 scale)

```json
"culturalWeights": {
  "historicalDepth": 0-10,
  "explanation": "How far back does this tradition go? Ancient = 10, Modern = 1",

  "regionalSpecificity": 0-10,
  "explanation": "How region-specific? One village = 10, Universal = 1",

  "symbolicLoad": 0-10,
  "explanation": "How much symbolic/metaphorical meaning? Deep = 10, Literal = 1",

  "ritualSignificance": 0-10,
  "explanation": "Role in ceremonies/rituals? Essential = 10, None = 0",

  "transmissionImportance": 0-10,
  "explanation": "How critical for cultural survival? Essential = 10, Optional = 1",

  "emotionalResonance": 0-10,
  "explanation": "Emotional impact on audience? Powerful = 10, Neutral = 1"
}
```

**Scoring Guidelines:**
- **9-10:** Exceptional, rare, UNESCO-level significance
- **7-8:** High cultural value, regionally important
- **5-6:** Moderate significance, common in tradition
- **3-4:** Present but not central
- **1-2:** Minimal cultural weight

---

#### Component 2: **complexityMetrics** (6 factors, 0-10 scale)

```json
"complexityMetrics": {
  "layersOfMeaning": 1-5,
  "explanation": "How many interpretive layers? 1=literal only, 5=highly multi-layered",

  "crossDomainMapping": 0-10,
  "explanation": "Metaphorical complexity? Simple = 2, Complex abstract mapping = 10",

  "culturalPrerequisites": 0-10,
  "explanation": "Background knowledge needed? Extensive = 10, None = 0",

  "idiomaticity": 0-10,
  "explanation": "How fixed/idiomatic? Frozen idiom = 10, Free composition = 1",

  "contextDependence": 0-10,
  "explanation": "Relies on context? Highly dependent = 10, Context-free = 1",

  "pedagogicalChallenge": 0-10,
  "explanation": "Difficulty teaching non-natives? Very hard = 10, Easy = 1"
}
```

---

#### Component 3: **semanticNetwork** (Conceptual Metaphor Theory)

```json
"semanticNetwork": {
  "sourceDomain": "CONCRETE_CONCEPT",
  "targetDomain": "ABSTRACT_CONCEPT",
  "mappings": [
    {
      "source": "concrete element 1",
      "target": "abstract element 1"
    },
    {
      "source": "concrete element 2",
      "target": "abstract element 2"
    }
  ],
  "conceptualMetaphor": "ABSTRACT IS CONCRETE"
}
```

**Examples:**
- SOUND → SPIRITUALITY: "dom dom" gong sound = spiritual communication
- SPEECH → BONDING: "ơi thơng ơi" calling = communal connection
- APPEARANCE → CHARACTER: "tang tình" plain clothes = inner beauty

---

#### Component 4: **usagePatterns**

```json
"usagePatterns": {
  "phrasePosition": "beginning|middle|ending|refrain",
  "explanation": "Where does it appear in phrases?",

  "syntacticRole": "subject|predicate|modifier|vocative|refrain|vocable",
  "explanation": "Grammatical function",

  "discourseFunction": "emphasis|contrast|transition|invitation|atmosphere",
  "explanation": "What does it do in discourse?",

  "participationPattern": "solo|call_response|communal|listening",
  "explanation": "How does audience engage?",

  "emotionalValence": "positive|negative|neutral|mixed",
  "explanation": "Emotional tone conveyed"
}
```

---

#### Component 5: **statistics** (Auto-calculate)

```json
"statistics": {
  "occurrences": 0,
  "phraseIds": [],
  "totalPhrases": 0,
  "coverage": "0%",
  "positionDistribution": {
    "beginning": 0,
    "middle": 0,
    "ending": 0
  }
}
```

---

#### Component 6: **comparativeContext**

```json
"comparativeContext": {
  "uniquenessScore": 0-10,
  "explanation": "How unique is this expression? Unique = 10, Common = 1",

  "similarExpressions": [
    {
      "expression": "similar phrase from other songs",
      "similarity": "high|medium|low",
      "difference": "how it differs"
    }
  ],

  "regionalDistribution": "Which regions use this?",
  "genreDistribution": "Which song types feature this?",
  "historicalPersistence": "How long has this been used?"
}
```

---

#### Component 7: **interpretiveGuidance**

```json
"interpretiveGuidance": {
  "performanceTips": [
    "Concrete vocal/instrumental technique advice",
    "Pronunciation, rhythm, melody guidance",
    "Body language, gesture suggestions"
  ],

  "culturalSensitivity": [
    "What to be aware of culturally",
    "Avoiding misrepresentation",
    "Respecting source communities"
  ],

  "pedagogicalApproach": [
    "Step 1: ...",
    "Step 2: ...",
    "How to teach this effectively"
  ],

  "commonMisinterpretations": [
    "❌ Wrong interpretation → ✅ Correct understanding"
  ]
}
```

---

### STEP 3: Aggregate Statistics

After analyzing all expressions, calculate:

```json
"aggregateStatistics": {
  "totalExpressions": 0,
  "uniqueExpressions": 0,
  "totalOccurrences": 0,
  "phrasesCovered": 0,
  "phraseCoverage": "0%",
  "averageCulturalWeight": 0.0,
  "averageComplexity": 0.0,
  "dominantMechanism": "most_common_semantic_mechanism",
  "culturalRichness": "minimal|low|moderate|high|very_high|exceptional"
}
```

---

### STEP 4: Collection Context

Add broader context:

```json
"collectionContext": {
  "genreClassification": "Work song | Love song | Ceremonial | etc.",
  "culturalSignificance": "UNESCO status, historical importance, etc.",
  "linguisticProfile": "Dialect, minority language, features",
  "performanceContext": "When/where/how performed",
  "pedagogicalValue": "Why this is useful for teaching"
}
```

---

### STEP 5: Save Enhanced File

**File naming convention:**
```
/Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/data/figurative-enhanced/{SONG_NAME}-v3.json
```

**Example:** `Bengu Adai-v3.json`

---

## ✅ Quality Validation Checklist

Before saving, verify:

- [ ] All expressions have 6 cultural weight dimensions with scores AND explanations
- [ ] All expressions have 6 complexity metrics with scores AND explanations
- [ ] All expressions have semantic network with source/target domains
- [ ] All expressions have usage patterns (5 fields)
- [ ] All expressions have statistics (auto-calculated)
- [ ] All expressions have comparative context
- [ ] All expressions have interpretive guidance (4 sections)
- [ ] Aggregate statistics calculated correctly
- [ ] Collection context added
- [ ] File saved with `-v3.json` suffix
- [ ] No placeholder text like "TODO" or "TBD"

---

## 📊 Progress Tracking

### Update Progress File

After completing each song, update:

```bash
echo "{SONG_NAME}" >> /Users/wecanmusic/Downloads/Dan\ Tranh\ Tablature/v4/V3-COMPLETED.txt
```

### Check Remaining

```bash
# Total songs
ls /Users/wecanmusic/Downloads/Dan\ Tranh\ Tablature/v4/data/lyrics-enhanced-tier1/ | grep -c ".json"

# V3.0 completed
ls /Users/wecanmusic/Downloads/Dan\ Tranh\ Tablature/v4/data/figurative-enhanced/ | grep -c "v3.json"

# Remaining
# Total - Completed = Remaining
```

---

## 🎓 Analysis Guidelines

### Cultural Weight Scoring Examples

**Historical Depth:**
- 9-10: Ancient traditions (1000+ years), pre-colonial
- 7-8: Colonial period or earlier (200-1000 years)
- 5-6: Modern traditional (50-200 years)
- 3-4: Contemporary folk (20-50 years)
- 1-2: Recent innovations (<20 years)

**Regional Specificity:**
- 9-10: Single village or ethnic group only
- 7-8: Single region (Northern, Central, Southern)
- 5-6: Multiple regions but not nationwide
- 3-4: Nationwide with variations
- 1-2: Universal (found in many languages)

**Symbolic Load:**
- 9-10: Deep metaphysical/philosophical symbolism
- 7-8: Rich cultural symbolism (multiple layers)
- 5-6: Moderate symbolism (1-2 metaphorical layers)
- 3-4: Minimal symbolism (mostly literal)
- 1-2: Pure literal meaning

### Complexity Metric Guidelines

**Layers of Meaning:**
- 1: Single literal meaning only
- 2: Literal + 1 figurative layer
- 3: Multiple figurative interpretations
- 4: Historical + contemporary + symbolic layers
- 5: Highly multi-layered, context-dependent meanings

**Cross-Domain Mapping:**
- 9-10: Complex abstract mappings (LIFE IS JOURNEY)
- 7-8: Moderate abstract mappings (LOVE IS WAR)
- 5-6: Simple concrete mappings (HEART IS CONTAINER)
- 3-4: Minimal metaphor (attribute transfer only)
- 1-2: No metaphor (literal or simple comparison)

---

## 🚀 Time Estimates

### Per Expression
- Component 1 (Cultural Weights): 10-15 min
- Component 2 (Complexity): 10-15 min
- Component 3 (Semantic Network): 5-10 min
- Component 4 (Usage Patterns): 5-10 min
- Component 5 (Statistics): 2-5 min (auto-calc)
- Component 6 (Comparative): 10-15 min
- Component 7 (Interpretive): 15-20 min

**Total per expression:** 60-90 minutes

### Per Song
- 1-3 expressions: 60-90 minutes
- 4-6 expressions: 90-120 minutes
- 7-10 expressions: 2-3 hours
- 10+ expressions: 3-4 hours

**Average:** 1.5-2 hours per song

---

## 📝 Conversation Template

### Opening Prompt (Copy-paste for each conversation)

```
I'm continuing the V3.0 DEEP Enhancement workflow for Vietnamese folk songs.

Please:
1. Run: node intelligent-deep-enhancer.js to see recommended song
2. Read the Tier 1 file for that song from: /Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/data/lyrics-enhanced-tier1/
3. Apply complete 7-component analysis to EACH figurative expression:
   - culturalWeights (6 dimensions, 0-10)
   - complexityMetrics (6 factors, 0-10)
   - semanticNetwork (source/target mappings)
   - usagePatterns (5 fields)
   - statistics (auto-calculated)
   - comparativeContext (uniqueness, similar expressions)
   - interpretiveGuidance (performance, pedagogy, sensitivity)
4. Calculate aggregate statistics
5. Add collection context
6. Save as: /Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/data/figurative-enhanced/{SONG_NAME}-v3.json

Use the full instructions in: /Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/V3-DEEP-ENHANCEMENT-INSTRUCTIONS.md

Quality check: All 7 components complete, no placeholders, all scores have explanations.
```

---

## 🎯 Success Criteria

A song is COMPLETE when:

✅ Every figurative expression has all 7 components
✅ Every score (0-10) has a detailed explanation
✅ Interpretive guidance has concrete, actionable tips
✅ Comparative context references specific other songs
✅ File saved with correct naming: `{SONG_NAME}-v3.json`
✅ Quality checklist 100% satisfied
✅ No "TODO", "TBD", or placeholder text remains

---

## 📈 Expected Timeline

- **1 song/day:** 121 days (4 months)
- **2 songs/day:** 60 days (2 months)
- **3 songs/day:** 40 days (1.3 months)
- **5 songs/day:** 24 days (3-4 weeks)

**Realistic target:** 2-3 songs per day = 40-60 days total

---

## 🆘 Troubleshooting

### Issue: Song has no figurative expressions identified

**Solution:** Manually identify at least 1-2 expressions:
- Look for từ láy (reduplication)
- Look for idioms/proverbs
- Look for metaphorical language
- Analyze even if minimal

### Issue: Expression is ambiguous

**Solution:**
- Provide multiple interpretations in explanations
- Note ambiguity in comparative context
- Give range of scores (e.g., "7-8 depending on interpretation")

### Issue: Not enough time in one conversation

**Solution:**
- Focus on top 3-5 most important expressions
- Complete those fully
- Note remaining expressions for follow-up

---

## 📚 Reference Files

**Instructions:** `/Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/V3-DEEP-ENHANCEMENT-INSTRUCTIONS.md` (this file)

**Taxonomy Guide:** `/Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/parsers/FIGURATIVE-LANGUAGE-TAXONOMY.md`

**Example (Complete):** `/Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/data/figurative-enhanced/Bengu Adai-v3.json`

**Progress Tracker:** `/Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/V3-COMPLETED.txt`

**Complexity Analyzer:** `/Users/wecanmusic/Downloads/Dan Tranh Tablature/v4/intelligent-deep-enhancer.js`

---

## 🎉 Final Output

When all 121 songs complete, you will have:

- **121 × V3.0 enhanced files** with comprehensive 7-component analysis
- **Deep cultural insights** for each figurative expression
- **Performance guidance** for musicians and educators
- **Cross-song comparative analysis** capability
- **The most detailed figurative language corpus** of Vietnamese folk music ever created

**Total value:** Research-grade dataset for linguistics, ethnomusicology, cultural studies, and music pedagogy.

---

*Ready to process the entire collection, one conversation at a time!*
