# MELISMA & GRACE NOTE ANALYSIS - 50+ SPECIFIC METRICS

Based on your framework: "words encompass pitches" + "grace note is subset of melisma" + slur relationships

---

## 🎶 MELISMA ANALYSIS (Words Encompass Multiple Pitches) - 25 Metrics

### **A. Basic Melisma Counting (5 metrics)**
1. **Total melisma groups** - Count of syllables with multiple notes
2. **Melisma percentage** - (melismas / total syllables) × 100
3. **Average notes per melisma** - Mean number of notes per melismatic syllable
4. **Maximum melisma complexity** - Largest number of notes on single syllable
5. **Melisma density** - (total melismatic notes / total notes) × 100

### **B. Melisma Syllable Distribution (8 metrics)**
6. **Vietnamese tone melisma preference** - Which tones (ngang, sắc, etc.) get melismas most
7. **Syllable position melisma tendency** - Beginning/middle/ending syllables melisma frequency
8. **Vowel-based melisma patterns** - Which Vietnamese vowels attract melismas
9. **Consonant-based melisma patterns** - Which consonant starts/ends get melismas
10. **Semantic field melisma correlation** - Which word types (nature, emotion) get melismas
11. **Syllable stress melisma alignment** - Do stressed syllables get more melismas
12. **Word importance melisma correlation** - Do important words get more elaborate melismas
13. **Melisma phrase position preference** - Where in phrases do melismas occur

### **C. Melisma Musical Characteristics (12 metrics)**
14. **Melisma pitch contour types** - Ascending, descending, arch, valley patterns
15. **Melisma interval preferences** - Which intervals used within melismas
16. **Melisma register tendencies** - High/middle/low pitch preferences for melismas
17. **Melisma duration distribution** - How long are melismatic passages
18. **Melisma rhythmic patterns** - Common rhythm patterns within melismas
19. **Melisma starting note tendency** - How melismas typically begin
20. **Melisma ending note tendency** - How melismas typically conclude
21. **Melisma peak note analysis** - Where climactic notes occur in melismas
22. **Melisma directional consistency** - Do melismas maintain directional flow
23. **Melisma ornament types** - Turns, trills, runs, neighbor notes
24. **Melisma complexity progression** - Do melismas get more complex through song
25. **Melisma interval size distribution** - Steps vs leaps within melismatic passages

---

## 🎵 GRACE NOTE ANALYSIS (Subset of Melisma) - 25 Metrics

### **D. Grace Note Position Analysis (8 metrics)**
26. **Grace note total count** - Raw number of grace notes
27. **Grace note percentage** - (grace notes / total notes) × 100
28. **Grace note density per phrase** - Average grace notes per linguistic phrase
29. **Grace note phrase position preference** - Beginning/middle/ending phrase placement
30. **Grace note beat position analysis** - Strong beat vs weak beat placement
31. **Grace note measure position tendency** - Beginning/middle/ending of measures
32. **Grace note syllable attachment rate** - How many grace notes belong to syllables
33. **Grace note isolation rate** - How many grace notes stand alone

### **E. Grace Note Slur Relationships (10 metrics)**
34. **Grace note slur start percentage** - Grace notes that begin slurs
35. **Grace note slur end percentage** - Grace notes that end slurs
36. **Grace note slur middle percentage** - Grace notes within slur spans
37. **Grace note slur isolation percentage** - Grace notes outside any slur
38. **Grace note to main note slur connections** - Direct slur connections to main notes
39. **Grace note syllable ownership via slurs** - Which syllable owns grace note through slur
40. **Multi-grace note slur groups** - Slurs containing multiple grace notes
41. **Grace note slur direction correlation** - Do slurs match grace note pitch direction
42. **Grace note slur span analysis** - How far grace note slurs extend
43. **Grace note slur complexity** - Simple vs complex slur relationships

### **F. Grace Note Musical Function (7 metrics)**
44. **Appoggiatura percentage** - Grace notes that resolve down by step
45. **Acciaccatura percentage** - Grace notes that are crushed/very short
46. **Neighbor note percentage** - Grace notes that return to original pitch
47. **Anticipation percentage** - Grace notes that anticipate next main note
48. **Escape tone percentage** - Grace notes that move away from harmony
49. **Turn figure percentage** - Grace notes in turn/ornament patterns
50. **Passing tone percentage** - Grace notes that fill in melodic gaps

---

## 🎵 SLUR ANALYSIS (Connects Melisma & Grace Notes) - 15+ Metrics

### **G. Slur Classification & Relationships (15 metrics)**
51. **Total slur groups** - Count of all slur groupings
52. **True tie percentage** - Slurs connecting identical pitches (ties)
53. **Melismatic slur percentage** - Slurs spanning different pitches (true melismas)
54. **Grace note slur percentage** - Slurs involving grace notes
55. **Mixed slur percentage** - Slurs with both grace and main notes
56. **Slur length distribution** - 2-note, 3-note, 4+ note slur frequencies
57. **Slur pitch span analysis** - Pitch range covered by slurs
58. **Slur duration analysis** - Total time duration of slur groups
59. **Slur syllable coverage** - How many syllables per slur group
60. **Nested slur analysis** - Slurs within slurs (if any)
61. **Slur phrase boundary crossing** - Slurs that span phrase boundaries
62. **Slur linguistic tone consistency** - Slurs within same Vietnamese tone
63. **Slur musical phrase alignment** - Slurs that align with musical phrase structure
64. **Slur articulation patterns** - How slurred notes are performed
65. **Slur complexity evolution** - Do slurs get more complex through song

---

## 🎵 ADVANCED MELISMA-GRACE INTERACTIONS - 10+ Metrics

### **H. Cross-Analysis & Patterns (10+ metrics)**
66. **Grace note melisma proportion** - (grace notes in melismas / total grace notes) × 100
67. **Melisma grace note density** - Average grace notes per melismatic syllable
68. **Grace note ornament complexity** - Simple vs elaborate grace note patterns
69. **Melisma-grace note Vietnamese tone correlation** - Which tones prefer grace-enhanced melismas
70. **Grace note phrase position function** - Different grace note roles by phrase position
71. **Melisma structural importance** - Do melismas mark important musical moments
72. **Grace note pitch relationship patterns** - Common interval relationships with main notes
73. **Melisma rhythm complexity correlation** - Do complex melismas have complex rhythms
74. **Grace note clustering analysis** - Do grace notes appear in groups
75. **Cross-song melisma-grace comparison** - Consistency across Vietnamese song collection

---

## 🔧 SPECIFIC IMPLEMENTATION EXAMPLES

### **Example 1: Syllable "Lý" with Melisma + Grace Note**
```javascript
const melismaExample = {
    syllable: "Lý",
    vietnamese_tone: "huyền", // falling tone
    notes: [
        { type: "grace", pitch: "C5", duration: 60, slur_start: true },
        { type: "main", pitch: "D4", duration: 480, slur_continue: true },
        { type: "main", pitch: "G4", duration: 240, slur_end: true }
    ],
    analysis: {
        melisma_note_count: 3, // total notes for this syllable
        grace_note_count: 1,   // grace notes within this melisma
        melisma_pitch_contour: "ascending", // C5 → D4 → G4 overall direction
        grace_note_position: "slur_start", // grace note begins the slur
        grace_note_syllable_ownership: "Lý", // grace note belongs to "Lý"
        slur_type: "melismatic", // different pitches = true melisma
        ornament_function: "appoggiatura" // C5 resolves down to D4
    }
};
```

### **Example 2: Complex Slur Analysis**
```javascript
const slurAnalysisExample = {
    slur_group: {
        slur_number: 1,
        notes: [
            { type: "main", pitch: "D4", syllable: "chiều" },
            { type: "grace", pitch: "E4", syllable: null },
            { type: "main", pitch: "G4", syllable: "chiều" }, // same syllable = melisma
            { type: "grace", pitch: "F4", syllable: null },
            { type: "main", pitch: "A4", syllable: "về" }     // new syllable
        ]
    },
    analysis: {
        slur_classification: "complex_melismatic",
        syllables_involved: ["chiều", "về"],
        grace_note_positions: ["middle", "end"],
        grace_note_ownership: {
            "E4_grace": "chiều", // belongs to previous syllable
            "F4_grace": "về"     // belongs to next syllable
        },
        melisma_within_slur: {
            "chiều": ["D4", "E4_grace", "G4"] // 3 notes for one syllable
        }
    }
};
```

### **Example 3: Grace Note Position Classification**
```javascript
const graceNotePositions = {
    // Position in slur
    slur_start: "Grace note begins a slur to main note",
    slur_middle: "Grace note within slur span",
    slur_end: "Grace note at very end before next sound",
    slur_isolated: "Grace note not in any slur",

    // Position relative to syllable
    syllable_prefix: "Grace note before syllable's main note",
    syllable_suffix: "Grace note after syllable's main note",
    syllable_embedded: "Grace note within syllable's note group",

    // Position in phrase
    phrase_beginning: "Grace note in first 25% of phrase",
    phrase_middle: "Grace note in middle 50% of phrase",
    phrase_ending: "Grace note in last 25% of phrase",

    // Functional position
    anticipation: "Grace note anticipates next syllable's pitch",
    resolution: "Grace note resolves previous syllable's tension",
    ornamental: "Grace note pure decoration within syllable",
    transitional: "Grace note bridges between syllables"
};
```

---

## 📊 COMPLETE 75+ METRICS BREAKDOWN

### **MELISMA METRICS (25)**
- Basic counting (5): total, percentage, average, maximum, density
- Syllable distribution (8): tone preference, position, vowel/consonant, semantic, stress, importance, phrase position
- Musical characteristics (12): contour, intervals, register, duration, rhythm, start/end tendencies, peaks, consistency, ornaments, complexity progression, interval distribution

### **GRACE NOTE METRICS (25)**
- Position analysis (8): count, percentage, density, phrase position, beat position, measure position, attachment rate, isolation
- Slur relationships (10): slur start/middle/end/isolation %, connections, ownership, multi-grace groups, direction correlation, span, complexity
- Musical function (7): appoggiatura, acciaccatura, neighbor, anticipation, escape, turn, passing tone percentages

### **SLUR ANALYSIS METRICS (15)**
- Classification (15): total groups, tie vs melisma %, grace note slurs, mixed slurs, length distribution, pitch span, duration, syllable coverage, nested analysis, boundary crossing, tone consistency, phrase alignment, articulation patterns, complexity evolution

### **ADVANCED INTERACTIONS (10+)**
- Cross-analysis (10+): grace-melisma proportion, density correlations, ornament complexity, tone correlations, phrase function, structural importance, pitch relationships, rhythm complexity correlation, clustering, cross-song comparison

**Total: 75+ specific, measurable metrics for melisma and grace note analysis.**

Each metric has a clear calculation method based on real MusicXML data (pitch, duration, lyrics, slur markings) and your precise definitions of how grace notes relate to syllables through slur connections.