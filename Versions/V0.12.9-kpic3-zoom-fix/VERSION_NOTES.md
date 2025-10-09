# Version 0.12.9 - KPIC-3 Zoom Fix

## Changes Made:
- Fixed KPIC-3 zoom behavior to match KPIC-2 exactly
- KPIC-3 now counter-scales only nodes and text, NOT bands
- Bands now properly stay connected to label boxes during zoom
- Uses getBBox() positioning like KPIC-2 for consistent behavior

## Previous Changes (from 0.12.8):
- Fixed KRIC-3 band-to-box alignment during zoom using wrapper div approach
- Standardized all Sankey diagrams to 900px height (KPIC-2, KRIC-2, KPIC-3, KRIC-3)
- Anchored all Sankey charts at the top edge (Y=110)
- Removed vertical offsets from KPIC-3 string positions
- Updated KRIC-2 and KRIC-3 to start at Y=110 instead of Y=50

## Key Features:
- Consistent zoom behavior across all 3 Sankey diagram types
- Proper band-to-box alignment in all zoom scenarios
- Uniform 900px height and top-anchored layout

Date: September 21, 2025
