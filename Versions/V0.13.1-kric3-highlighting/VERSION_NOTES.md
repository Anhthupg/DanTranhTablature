# Version 0.13.1 - KRIC-3 Highlighting System

## Major Features Added:
- **Complete KRIC-3 interactive highlighting system** matching KPIC-3 functionality
- **Pattern group highlighting**: Both segments of 3-note patterns highlight together
- **Tablature integration**: KRIC-3 band clicks highlight corresponding notes in tablature
- **Persistent selection**: Selected patterns maintain gold highlighting

## KRIC-3 Highlighting Features:
- **Hover effects**: Glow filters and increased stroke width on pattern groups
- **Both segments highlight**: Complete 3-note pattern highlights as one unit
- **Click selection**: Gold stroke (#FFD700) with persistent glow effect
- **Tablature connection**: Shows all occurrences of rhythm patterns in tablature
- **Pattern clearing**: Previous selections cleared when new patterns selected

## Interactive Behavior:
- **onmouseover**: Both segments glow with pattern color + stroke width increase
- **onmouseout**: Return to normal unless persistently selected
- **onclick**: Persistent gold selection + tablature highlighting
- **Pattern groups**: kric3-pattern-group-{index} classes ensure unified highlighting

## Technical Implementation:
- Added highlightKric3PatternGroup() and unhighlightKric3PatternGroup() functions
- Updated selectKric3Pattern() to handle positions and tablature highlighting
- Added highlightKric3PatternInTablature() for note highlighting
- Pattern group classes for unified segment treatment

## Previous Changes (from 0.12.10):
- Standardized 11px fonts across all Sankey diagrams
- KRIC-3 layout improvements (80px boxes, better spacing)
- Timestamp-based regeneration system
- Font scaling consistency without flattening

Date: September 21, 2025
