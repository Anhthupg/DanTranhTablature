V0.9.8-bands-stay: Comprehensive resonance band fixes and UI improvements

Key improvements over previous version:
- Resonance bands now stay visible during all zoom operations
- Fixed width: 240px for main notes (6 eighth-note durations), 60px for grace notes  
- Width scales with X-zoom while maintaining 6 eighth-note duration proportion
- Bands stay Y-centered with note heads during Y-zoom operations
- Minimum width of 20px ensures visibility at low zoom levels
- Using inline styles with !important to ensure band visibility
- Proper DOM hierarchy positioning (bands render behind notes)

UI Text Improvements:
- All lyrics now bold for better readability
- Duration numbers at 30% opacity
- Position numbers at 30% opacity  
- Lyrics properly centered with their corresponding notes (4px offset for rotation)
- Fixed first note's inconsistent text positioning

Technical fixes:
- Band colors use direct fill attributes instead of gradient references
- Bands repositioned in DOM after each zoom to maintain correct rendering order
- Fixed opacity values that were incorrectly set to Y-position values
- Resonance bands moved up 3px for better visual alignment

The resonance bands now reliably stay visible and properly aligned through all zoom operations.
