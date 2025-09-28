#!/bin/bash

# Clean up old parser files and experimental HTML files from v3 data directories

echo "🧹 Cleaning up old parser files and experimental HTML files..."

cd /Users/wecanmusic/Downloads/Dan\ Tranh\ Tablature/v3/data/processed

# Count files before cleanup
BEFORE_COUNT=$(find . -type f | wc -l)

# Remove old patterns.json files from old parser
find . -name "patterns.json" -type f -delete 2>/dev/null

# Remove experimental HTML files from Cô_nói_sao directory
if [ -d "Cô_nói_sao" ]; then
    echo "Cleaning experimental files from Cô_nói_sao..."
    cd Cô_nói_sao
    rm -f 17-string-tunings.html
    rm -f bai-choi-*.html
    rm -f complete-17-*.html
    rm -f corrected-*.html
    rm -f database-*.html
    rm -f dual-panel-tuning-analyzer.html
    rm -f final-*.html
    rm -f fixed-*.html
    rm -f global-*.html
    rm -f identical-*.html
    rm -f multiple-*.html
    rm -f pentatonic-*.html
    rm -f perfect-*.html
    rm -f scale-*.html
    rm -f simple-*.html
    rm -f strict-*.html
    rm -f truly-*.html
    rm -f tuning-*.html
    rm -f viewer_*.html
    cd ..
fi

# Remove duplicate directories (ones with spaces in names that have no metadata)
echo "Removing duplicate directories without metadata..."
for dir in */; do
    if [[ "$dir" == *" "* ]]; then
        # Directory has spaces in name
        if [ ! -f "$dir/metadata.json" ]; then
            echo "Removing duplicate: $dir"
            rm -rf "$dir"
        fi
    fi
done

# Count files after cleanup
AFTER_COUNT=$(find . -type f | wc -l)
REMOVED=$((BEFORE_COUNT - AFTER_COUNT))

echo ""
echo "✅ Cleanup complete!"
echo "   Files before: $BEFORE_COUNT"
echo "   Files after: $AFTER_COUNT"
echo "   Files removed: $REMOVED"

# List remaining file types
echo ""
echo "📊 Remaining file types:"
find . -type f -name "*.json" | sed 's/.*\///' | sort -u | sed 's/^/   - /'
find . -type f -name "*.html" | sed 's/.*\///' | sort -u | sed 's/^/   - /'
find . -type f -name "*.svg" | sed 's/.*\///' | sort -u | sed 's/^/   - /'