# Version 0.13.2 - KRIC-3 Tooltips

## Major Features Added:
- **Complete KRIC-3 tooltip system** matching KPIC-3 functionality
- **Rich pattern information** with readable rhythm names
- **Detailed analytics** including percentages, rankings, and positions
- **Grace note detection** and special handling

## KRIC-3 Tooltip Features:
- **Segment-aware tooltips**: Shows current segment (1/2 or 2/2) with full pattern context
- **Readable format**: Converts raw values (2, 1, 0.5) to note names (8th, 16th, etc.)
- **Statistical data**: Occurrence count, percentage, and frequency ranking
- **Position tracking**: Shows which notes in tablature contain the pattern
- **Grace note handling**: Special indicators for patterns with grace notes

## Tooltip Content:
- Current segment transition with readable names
- Full 3-note pattern display
- Occurrence count and percentage of total
- Frequency ranking among all KRIC-3 patterns
- Pattern type classification
- Note positions in tablature
- Grace note pattern indicators

## Technical Implementation:
- Added window.kric3TransitionData global storage
- Created showKric3DetailedTooltip() function
- Integrated with existing highlighting system
- Pattern data calculation with ranking and percentages
- Proper tooltip positioning and styling

## Previous Changes (from 0.13.1):
- Complete KRIC-3 interactive highlighting system
- Pattern group highlighting with both segments
- Tablature integration for rhythm pattern visualization
- Persistent selection with gold highlighting

Date: September 21, 2025
