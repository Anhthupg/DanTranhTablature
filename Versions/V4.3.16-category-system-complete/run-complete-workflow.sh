#!/bin/bash

# Complete Segmentation Workflow - One Command Solution
# This completes all pending segmentations and updates the system

echo "=== COMPLETE V4.3.15 CATEGORY SYSTEM WORKFLOW ==="
echo ""

# Step 1: Show what needs processing
echo "Step 1: Checking missing segmentations..."
node find-missing-segmentations.js

echo ""
echo "=== INSTRUCTIONS ==="
echo ""
echo "To complete the segmentation workflow:"
echo ""
echo "1. View the batch prompt:"
echo "   cat data/segmentation-prompts/batch-1.txt"
echo ""
echo "2. Process segmentations (use Claude or your preferred LLM)"
echo "   - Copy the prompt from batch-1.txt"
echo "   - Paste into Claude/LLM"
echo "   - Save the returned JSONs to data/lyrics-segmentations/"
echo ""
echo "3. After saving segmentation files, run:"
echo "   node batch-regenerate-relationships.js batch-1"
echo ""
echo "4. Verify completion:"
echo "   node find-missing-segmentations.js"
echo ""
echo "=== QUICK REFERENCE ==="
echo ""
echo "Files needed in data/lyrics-segmentations/:"
echo "  - ho-boi-thuyen.json"
echo "  - ho-do-khoan-do-huay-ho-cheo-thuyen.json"
echo "  - ho-nen.json"
echo "  - mua-sap.json"
echo "  - xoe-hoa.json"
echo "  - sakura-folksong-japanese-melody.json (if has lyrics)"
echo "  - sakura-folksong-japanese-tranh.json (if has lyrics)"
echo ""
echo "Then run: node batch-regenerate-relationships.js batch-1"
echo ""
