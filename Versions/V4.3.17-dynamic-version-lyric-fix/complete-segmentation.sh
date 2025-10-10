#!/bin/bash

# Complete the segmentation workflow after you've created the JSON files
# Usage: ./complete-segmentation.sh

set -e

echo "=== COMPLETING SEGMENTATION WORKFLOW ==="
echo ""

# Step 1: Regenerate relationships for all new segmentations
echo "Step 1: Regenerating relationships for all processed songs..."
node batch-regenerate-relationships.js batch-1

echo ""
echo "Step 2: Verifying completion..."
node find-missing-segmentations.js

echo ""
echo "✅ Workflow complete!"
echo ""
echo "Your new songs are now fully integrated into the V4 system."
echo "Check them at: http://localhost:3006"
echo ""
