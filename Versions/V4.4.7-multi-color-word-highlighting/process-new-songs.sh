#!/bin/bash

# Complete Workflow for Adding New Folk Songs to V4 System
# Usage: ./process-new-songs.sh

set -e  # Exit on error

echo "=== V4.3.15 NEW SONG PROCESSING WORKFLOW ==="
echo ""

# Step 1: Scan for new files
echo "Step 1: Scanning for new MusicXML files in category folders..."
node categorize-and-link-songs-v2.js

echo ""
echo "Step 2: Rebuilding library with new files..."
rm -f data/library/song-library.json
timeout 60 node auto-import-library.js || echo "Library scan timeout (normal for many files)"

echo ""
echo "Step 3: Finding songs that need segmentation..."
node find-missing-segmentations.js > /tmp/missing-songs.txt
cat /tmp/missing-songs.txt

# Count missing
MISSING_COUNT=$(grep "Total missing:" /tmp/missing-songs.txt | awk '{print $3}')

if [ "$MISSING_COUNT" = "0" ]; then
    echo ""
    echo "✅ All songs have segmentation! System is complete."
    exit 0
fi

echo ""
echo "Step 4: Generating segmentation prompts for $MISSING_COUNT songs..."
node batch-segment-lyrics.js

echo ""
echo "=== NEXT STEPS (Manual) ==="
echo ""
echo "1. Segment the lyrics:"
echo "   cat data/segmentation-prompts/batch-1.txt"
echo "   → Copy/paste into Claude or process manually"
echo "   → Save each JSON to data/lyrics-segmentations/"
echo ""
echo "2. After saving segmentation files, run:"
echo "   ./complete-segmentation.sh"
echo ""
