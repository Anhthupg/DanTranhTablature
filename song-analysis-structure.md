# Song Analysis Feature Structure

## Overview
This document outlines the structure for the song analysis popup feature that will provide comprehensive analysis for each Đàn Tranh piece.

## Analysis Categories

### 1. Cultural Significance (Left Sidebar - Key Takeaways)
- **Lyrics Meaning**: Cultural and social significance of lyrics in Vietnamese society
- **Musical Context**: Role of the piece in Vietnamese traditional music
- **Key Message**: Main takeaway for learners

### 2. Technical Analysis (Right Main Section)

#### 2.1 String Usage Analysis
- **Total Strings Used**: Count and identification of Đàn Tranh strings utilized
- **String Distribution**: Frequency of each string's usage
- **Range Analysis**: Melodic range coverage

#### 2.2 KPIC Pattern Analysis (Kinetic Pitch Contour)
- **Most Frequent KPIC Patterns**: Top 5-10 pitch movement patterns
- **Pattern Explanation**: Musical significance of each pattern
- **Pattern Examples**: Specific occurrences with timing

#### 2.3 KRIC Pattern Analysis (Kinetic Rhythm Contour)
- **Most Frequent KRIC Patterns**: Top 5-10 rhythm patterns
- **Pattern Explanation**: Rhythmic significance and feel
- **Dotted Eighth Note Emphasis**: Special focus on dotted eighth note patterns that characterize the piece

#### 2.4 Rhythmic Characteristics
- **Dominant Rhythms**: Primary rhythmic patterns
- **Dotted Eighth Note Impact**: How dotted eighth notes create the song's distinctive character
- **Tempo and Feel**: Overall rhythmic character

## Interface Layout

### Left Sidebar (30% width)
- **Cultural Context** section
- **Key Learning Points** section
- **Quick Facts** section

### Right Main Panel (70% width)
- **Technical Analysis** tabs or sections
- **Pattern Visualizations** (if applicable)
- **Detailed Explanations** with examples

## Suggested Additional Analysis Elements

1. **Difficulty Assessment**: Technical difficulty rating for learners
2. **Performance Tips**: Practical advice for playing the piece
3. **Historical Context**: When and where the piece originated
4. **Similar Pieces**: Recommendations for related songs
5. **Practice Focus Areas**: Specific technical elements to emphasize
6. **Ornament Analysis**: Traditional Vietnamese ornaments used
7. **Modal Analysis**: Scale/mode characteristics
8. **Dynamic Analysis**: Volume and intensity patterns
9. **Structural Analysis**: Song form and sections
10. **Cross-Reference**: How patterns relate to other pieces in the collection

## Implementation Notes

- Popup should be responsive and scrollable
- Consider tabbed interface for different analysis types
- Include audio examples where relevant (tied to existing playback system)
- Allow printing/export of analysis
- Integrate with existing pattern highlighting system
- Consider expandable/collapsible sections for better organization

## Data Requirements

For each song, we'll need:
- Lyrics with Vietnamese cultural context
- String usage statistics
- KPIC/KRIC pattern data (already available)
- Rhythmic analysis data
- Cultural/historical background information
- Technical difficulty metrics