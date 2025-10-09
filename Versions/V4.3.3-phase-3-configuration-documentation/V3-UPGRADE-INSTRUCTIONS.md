# V3.0 Enhancement Upgrade Instructions

## Context
- **Current Status**: 3/121 songs at v3.0, 118 at v1.0
- **Goal**: Upgrade all to v3.0-complete-multidimensional
- **Template**: `Bengu Adai.json`
- **Processing**: 1-2 songs per conversation (local, NO API)

## Auto-Start Protocol

**Step 1: Find Next Songs**
```bash
cd v4/data/figurative-enhanced
grep -L "3.0-complete-multidimensional" *.json | grep -v "_COLLECTION" | head -2
```

**Step 2: Read Input**
```bash
cd v4/data/lyrics-segmentations
# Read the song file found in Step 1
```

**Step 3: Create v3.0 Enhancement**

Required Components (match Bengu Adai structure):
1. **culturalWeights** (6 factors per expression)
2. **complexityMetrics** (6 factors per expression)
3. **semanticNetwork** (source/target/mappings)
4. **usagePatterns** (position/role/participation/valence)
5. **statistics.comparativeContext**
6. **statistics** (means, medians, distributions)
7. **interpretiveGuidance** (performance/cultural/pedagogical)

**Step 4: Save Output**
```bash
# Save to: v4/data/figurative-enhanced/{songname}.json
# Update: metadata.enhancementVersion = "3.0-complete-multidimensional"
```

## Quality Checklist
- [ ] All figurative expressions have 6-factor culturalWeights
- [ ] All expressions have 6-factor complexityMetrics
- [ ] All expressions have semanticNetwork mappings
- [ ] All expressions have usagePatterns
- [ ] statistics.comparativeContext exists
- [ ] interpretiveGuidance (3 sections) exists
- [ ] enhancementVersion = "3.0-complete-multidimensional"

## Example culturalWeights (Bengu Adai reference):
```json
"culturalWeights": {
  "culturalSignificance": 9.5,
  "historicalDepth": 8.0,
  "regionalSpecificity": 10.0,
  "spiritualConnection": 9.0,
  "artisticValue": 8.5,
  "overallWeight": 9.0
}
```

## Example complexityMetrics:
```json
"complexityMetrics": {
  "semanticLayers": 3,
  "metaphoricalDepth": 2,
  "culturalReferences": 4,
  "linguisticComplexity": 1,
  "interpretiveOpenness": 2,
  "complexityScore": 6.5
}
```

## Example semanticNetwork:
```json
"semanticNetwork": {
  "sourceDomain": "percussion_instruments",
  "targetDomain": "ceremonial_spirituality",
  "mappings": [
    {"source": "gong_sound", "target": "ancestral_voice"},
    {"source": "repetition", "target": "ritual_continuity"}
  ]
}
```

## Example usagePatterns:
```json
"usagePatterns": {
  "phrasePosition": "rhythmic_interlude",
  "functionalRole": "ceremonial_anchor",
  "participationLevel": "communal_response",
  "emotionalValence": "reverent_joyful"
}
```

## Example comparativeContext:
```json
"comparativeContext": {
  "comparedToVietnameseFolkSongs": {
    "culturalWeight": "significantly_higher",
    "reasoning": "UNESCO heritage connection...",
    "avgVietnameseFolkWeight": 5.5,
    "thisSongWeight": 7.87,
    "difference": "+2.37 (43% higher)"
  },
  "uniqueCharacteristics": [
    "Documented UNESCO heritage reference",
    "Bilingual ceremonial formula"
  ]
}
```

## Example interpretiveGuidance:
```json
"interpretiveGuidance": {
  "performanceContext": "Requires understanding of...",
  "culturalSensitivity": "As an ethnic minority ceremonial song...",
  "pedagogicalValue": "Excellent example for teaching..."
}
```

---

**START EACH CONVERSATION WITH**: "Process next 1-2 v3.0 upgrades" (I'll auto-detect and process)
