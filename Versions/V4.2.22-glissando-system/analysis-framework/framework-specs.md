# Dan Tranh Tablature - Core Analysis Framework

## Musical Dimensions Framework

### ✅ Pitch Contour
**Definition**: Pure melodic shape (no rhythm)
**Focus**: Intervals, direction, range, peaks, valleys
**Isolation**: Remove all temporal information, analyze only pitch sequences
**Key Metrics**: Interval distribution, contour complexity, melodic arch patterns

### ✅ Duration/Rhythm
**Definition**: Pure timing patterns (no pitch)
**Focus**: Note durations, rests, tempo, syncopation
**Isolation**: Remove all pitch information, analyze only time values
**Key Metrics**: Rhythmic density, beat patterns, tempo variations

### ✅ Melody (Pitch + Rhythm Interplay)
**Definition**: The interaction between pitch and rhythm
**Focus**: How pitch changes correlate with rhythmic patterns
**Analysis**: Melodic rhythm correlation, climax timing, phrase structures
**Key Metrics**: High notes with short durations, ascending with acceleration

### ✅ Linguistic Integration
**Definition**: How Vietnamese language elements interact with music
**Components**:
  - **Words**: Syllable-to-note mapping, semantic emphasis
  - **Tones**: 6 Vietnamese tones correlation with pitch/rhythm
  - **Phrase Position**: Beginning/middle/ending characteristics
  - **Melisma**: Multiple pitches per syllable
  - **Grace Notes**: Ornamental subset of melisma

## Component-Analysis Mapping

### When Working on Tablature Section
**Relevant Analyses**:
- Pattern Density Map (Visual #1)
- String Usage Profile (Visual #2)
- Ornament Density Timeline (Visual #4)
- Hand Span Requirements (Visual #11)
- Basic Musical metrics (Group A)
- Pitch Contour metrics (Group B)

### When Working on Pattern Panel
**Relevant Analyses**:
- Learning Path Optimizer (Visual #8)
- Memory Optimization Chunks (Visual #15)
- Rhythmic Complexity Score (Visual #6)
- Melody Interplay metrics (Group D)
- Melisma & Grace Analysis (Group I)

### When Working on Song Analysis Panel
**Relevant Analyses**:
- Melodic Contour Graph (Visual #3)
- Interval Frequency Analysis (Visual #5)
- Phrase Structure Detection (Visual #7)
- Regional Style Fingerprint (Visual #10)
- Vietnamese Linguistic metrics (Group E)
- Tone-Musical Correlations (Group G)

### When Working on Library/Collection View
**Relevant Analyses**:
- Cross-Song Similarity Matrix (Visual #9)
- Pedagogical Difficulty Rating (Visual #14)
- Comparative Analysis metrics (Group L)
- Cultural & Contextual metrics (Group J)

### When Working on Playback Controls
**Relevant Analyses**:
- Tempo Variation Map (Visual #12)
- Dynamic Range Indicators (Visual #13)
- Duration/Rhythm metrics (Group C)
- Phrase Position Correlations (Group H)

## Analysis Approval Workflow

### Step 1: Proactive Suggestion
When working on any component, Claude will:
1. Check relevant analyses from this framework
2. Suggest applicable analyses with mini-preview
3. Show expected value/insight

### Step 2: Mini-Preview
**Format**:
```
📊 Suggested Analysis: [Name]
Preview: [Visual representation]
Insight: [What this reveals]
Apply? (y/n)
```

### Step 3: User Approval
- **Approved**: Mark as 🟢 in framework files
- **In Progress**: Mark as 🔵 in framework files
- **Pending**: Default state 🟡
- **Rejected**: Mark as 🔴 with reason

### Step 4: Implementation
Once approved:
1. Implement the analysis
2. Test with sample data
3. Generate visualization
4. Update status in framework files

### Step 5: Documentation Update
After successful implementation:
1. Add to CLAUDE.md under "Approved Analyses" section
2. Include implementation details
3. Add usage examples
4. Document any dependencies

## Quick Reference

### Files to Check
1. `/v4/analysis-framework/visual-analyses.md` - 15 UI visualizations
2. `/v4/analysis-framework/statistical-groups.md` - 450+ metrics in 13 groups
3. `/v4/analysis-framework/framework-specs.md` - This file

### Status Tracking
- 🟢 Approved & Implemented
- 🔵 Approved & In Progress
- 🟡 Pending Approval (default)
- 🔴 Rejected/Deprecated

### Priority Levels
1. **Essential**: Basic metrics for functionality
2. **Cultural**: Vietnamese-specific features
3. **Advanced**: Complex interplay analyses
4. **Specialized**: Technical deep-dives
5. **Research**: Mathematical/AI features